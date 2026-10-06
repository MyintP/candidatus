// Job-description matching: keyword extraction, gap analysis, ATS-style score,
// bullet relevance and AI-phrase cleanup.
//
// Ported to JavaScript from Resume-Matcher (https://github.com/srbhr/Resume-Matcher),
// Apache License 2.0, files apps/backend/app/services/{ats,refiner,bullet_scoring}.py
// and apps/backend/app/prompts/{templates,refinement}.py. See NOTICE.
//
// Additions for Candidatus: "knock-out" extraction (degree, clearance, police
// check, citizenship) because mandatory items are what most often end an
// application before skills are read.

import { callLLM } from './llm.js'

// ---------------------------------------------------------------- keywords

const EXTRACT_KEYWORDS_SYSTEM = 'You extract job requirements from a job ad. Output ONLY a JSON object, no other text.'

export async function extractJobKeywords(jdText) {
  const prompt = `Extract job requirements as JSON. Output ONLY the JSON object, no other text.

Example format:
{
  "company": "Acme Corp",
  "role": "Senior Solution Architect",
  "required_skills": ["Azure", "Entra ID"],
  "preferred_skills": ["TOGAF"],
  "experience_requirements": ["5+ years as a Solution Architect"],
  "education_requirements": ["Bachelor's in IT"],
  "key_responsibilities": ["Produce solution design documents"],
  "keywords": ["integration", "governance"],
  "knockouts": ["Tertiary qualification in IT (mandatory)", "Current police check"],
  "experience_years": 5,
  "seniority_level": "senior"
}

Rules:
- Use short terms exactly as the ad words them (1-4 words each).
- "knockouts" lists only items the ad marks as mandatory or essential that a screener can reject on:
  degrees, licences, security clearances, police or working-with-children checks, citizenship or residency,
  named certifications. Use an empty list if there are none.
- Set "company" and "role" exactly as written; empty string if not stated.

Job description:
${jdText}`
  const raw = await callLLM(EXTRACT_KEYWORDS_SYSTEM, prompt, 1500)
  const k = parseJSON(raw, 'job keywords')
  for (const key of ['required_skills', 'preferred_skills', 'keywords', 'key_responsibilities', 'knockouts',
                     'experience_requirements', 'education_requirements']) {
    k[key] = Array.isArray(k[key]) ? k[key].filter(s => typeof s === 'string' && s.trim()) : []
  }
  return k
}

// Whole-word, case-insensitive match (Resume-Matcher refiner._keyword_in_text).
export function keywordInText(keyword, textLower) {
  const k = String(keyword || '').trim().toLowerCase()
  if (!k) return false
  const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?<![\\w])${escaped}(?![\\w])`).test(textLower)
}

export function allText(obj) {
  const parts = []
  const walk = o => {
    if (typeof o === 'string') parts.push(o)
    else if (Array.isArray(o)) o.forEach(walk)
    else if (o && typeof o === 'object') Object.values(o).forEach(walk)
  }
  walk(obj)
  return parts.join(' ')
}

function jdTerms(k) {
  return [...new Set([...(k.required_skills || []), ...(k.preferred_skills || []), ...(k.keywords || [])]
    .map(s => s.trim()).filter(Boolean))]
}

// Which JD terms are missing from the tailored resume, and of those, which the
// master already proves (safe to add) versus genuine gaps (never to be invented).
export function analyzeKeywordGaps(jdKeywords, tailoredText, masterText) {
  const t = tailoredText.toLowerCase()
  const m = masterText.toLowerCase()
  const terms = jdTerms(jdKeywords)
  const missing = [], injectable = [], nonInjectable = []
  for (const kw of terms) {
    if (!keywordInText(kw, t)) {
      missing.push(kw)
      ;(keywordInText(kw, m) ? injectable : nonInjectable).push(kw)
    }
  }
  const total = terms.length || 1
  return {
    terms,
    missing,
    injectable,
    nonInjectable,
    currentMatch: terms.length ? ((total - missing.length) / total) * 100 : 0,
    potentialMatch: terms.length ? ((total - nonInjectable.length) / total) * 100 : 0,
  }
}

// --------------------------------------------------------------- ATS score

const WEIGHTS = { keyword_match: 0.55, skills_coverage: 0.25, section_completeness: 0.2 }
const SECTION_PATTERNS = {
  summary: ['summary', 'profile', 'objective'],
  experience: ['experience', 'career history', 'employment'],
  education: ['education', 'qualification'],
  skills: ['skills', 'technologies', 'competencies'],
}

export function computeAtsScore({ resumeText, skillsText, sectionsPresent, jdKeywords, gaps }) {
  const kw = Math.max(0, Math.min(100, gaps.currentMatch))
  const jdSkills = [...(jdKeywords.required_skills || []), ...(jdKeywords.preferred_skills || [])]
  const rt = resumeText.toLowerCase(), st = (skillsText || '').toLowerCase()
  const sk = jdSkills.length
    ? Math.min(100, (jdSkills.filter(s => keywordInText(s, st) || keywordInText(s, rt)).length / jdSkills.length) * 100)
    : 0
  const found = sectionsPresent
    ? Object.keys(SECTION_PATTERNS).filter(s => sectionsPresent[s]).length
    : Object.values(SECTION_PATTERNS).filter(ps => ps.some(p => rt.includes(p))).length
  const sec = (found / Object.keys(SECTION_PATTERNS).length) * 100
  const knockouts = (jdKeywords.knockouts || []).map(item => ({ item, evidenced: knockoutEvidenced(item, rt) }))

  const tips = []
  if (knockouts.some(k => !k.evidenced))
    tips.push(`State these mandatory items plainly, or check you meet them: ${knockouts.filter(k => !k.evidenced).map(k => k.item).join('; ')}.`)
  if (gaps.injectable.length)
    tips.push(`Already in your master but missing here, so safe to add: ${gaps.injectable.slice(0, 6).join(', ')}.`)
  if (kw < 60 && gaps.nonInjectable.length)
    tips.push(`Genuine gaps (not in your master, do not claim them): ${gaps.nonInjectable.slice(0, 6).join(', ')}.`)
  if (sk < 60) tips.push('Name more of the ad\'s required tools and platforms in the skills section, where you genuinely use them.')
  if (sec < 75) tips.push('Make sure Summary, Experience, Education and Skills are all present as headed sections.')
  if (!tips.length) tips.push('Strong alignment. Check each mandatory item is stated word-for-word in the resume, not only the cover letter.')

  return {
    overall: Math.round((kw * WEIGHTS.keyword_match + sk * WEIGHTS.skills_coverage + sec * WEIGHTS.section_completeness) * 10) / 10,
    subScores: { keywordMatch: Math.round(kw), skillsCoverage: Math.round(sk), sectionCompleteness: Math.round(sec) },
    potentialMatch: Math.round(gaps.potentialMatch),
    knockouts,
    missing: gaps.missing.slice(0, 12),
    injectable: gaps.injectable.slice(0, 12),
    nonInjectable: gaps.nonInjectable.slice(0, 12),
    tips,
  }
}

// Loose evidence check for a knock-out item: every significant word of the
// item appears somewhere in the resume. Deliberately conservative: when in
// doubt it reports "not evidenced" so the user checks it.
function knockoutEvidenced(item, textLower) {
  const words = item.toLowerCase().replace(/\(.*?\)/g, ' ').match(/[a-z0-9+#]{4,}/g) || []
  const stop = new Set(['mandatory', 'essential', 'current', 'required', 'must', 'have', 'with', 'related', 'discipline', 'equivalent', 'demonstrated'])
  const sig = words.filter(w => !stop.has(w))
  return sig.length > 0 && sig.every(w => textLower.includes(w))
}

// ----------------------------------------------------------- bullet scores

// Deterministic: 20 points per distinct JD term in the bullet, capped at 100
// (Resume-Matcher bullet_scoring.keyword_scores). No API call.
export function keywordBulletScores(roles, jdKeywords) {
  const terms = [...new Set([...jdTerms(jdKeywords), ...(jdKeywords.key_responsibilities || [])].map(s => s.toLowerCase()))]
  return roles.map(r => {
    const bullets = [...(r.achievements || []), ...(r.responsibilities || []), ...(r.bullets || [])]
    return {
      title: r.title,
      org: r.org,
      bullets: bullets
        .map(text => ({ text, score: Math.min(100, 20 * terms.filter(t => keywordInText(t, text.toLowerCase())).length) }))
        .sort((a, b) => b.score - a.score),
    }
  })
}

// LLM relevance scoring that never edits bullets; falls back to keywords.
export async function scoreBulletsLLM(roles, jdText, jdKeywords) {
  const lines = []
  roles.forEach((r, i) => [...(r.achievements || []), ...(r.responsibilities || []), ...(r.bullets || [])]
    .forEach((b, j) => lines.push(`- r${i}.b${j} | ${r.title}${r.org ? ' @ ' + r.org : ''} | ${b}`)))
  if (!lines.length) return { scores: {}, source: 'llm' }
  const prompt = `Score how relevant each resume bullet is to this job.

Return ONLY a JSON object. Do not rewrite, merge, reorder, or invent bullets.

Rules:
1. Score every listed bullet from 0 (irrelevant) to 100 (directly proves a core requirement).
2. Reward concrete evidence of required skills, key responsibilities, and measurable impact.
3. Copy each bullet's path string exactly.

Job description:
${jdText}

Extracted job keywords:
${JSON.stringify(jdKeywords)}

Bullets (path | role | text):
${lines.join('\n')}

Output: {"scores": [{"path": "r0.b0", "score": 87}]}`
  try {
    const raw = await callLLM('You score resume bullets for relevance to a job. You never rewrite them.', prompt, 3000)
    const out = parseJSON(raw, 'bullet scores')
    const scores = {}
    for (const s of out.scores || []) {
      if (typeof s.path === 'string' && Number.isFinite(s.score)) scores[s.path] = Math.max(0, Math.min(100, s.score))
    }
    return { scores, source: 'llm' }
  } catch {
    return { scores: null, source: 'keyword_fallback' }
  }
}

// --------------------------------------------------------- AI-phrase cleanup

// Resume-Matcher prompts/refinement.py. "stakeholder" and "scalable" are kept
// out of the list deliberately: architect ads use them constantly, and the
// JD-protection rule below would keep them anyway.
const AI_PHRASES = {
  spearheaded: 'led', orchestrated: 'coordinated', championed: 'advocated for', synergized: 'collaborated',
  leveraged: 'used', revolutionized: 'transformed', revolutionised: 'transformed', pioneered: 'introduced',
  catalyzed: 'initiated', operationalized: 'implemented', architected: 'designed', envisioned: 'planned',
  effectuated: 'completed', endeavored: 'worked', utilized: 'used', utilised: 'used',
  synergy: 'collaboration', synergies: 'collaborations', 'paradigm shift': 'change', paradigm: 'approach',
  'best-in-class': 'top-performing', 'world-class': 'high-quality', 'cutting-edge': 'modern',
  'bleeding-edge': 'modern', 'game-changer': 'innovation', 'game-changing': 'innovative', holistic: 'complete',
  impactful: 'effective', 'deep dive': 'review', 'move the needle': 'improve', 'value-add': 'benefit',
  'in order to': 'to', 'for the purpose of': 'to', 'on a daily basis': 'daily', 'on a regular basis': 'regularly',
  'in a timely manner': 'promptly', 'due to the fact that': 'because', '—': ', ',
}

export function removeAiPhrases(text, jdText = '') {
  if (typeof text !== 'string') return { text, removed: [] }
  const jd = jdText.toLowerCase()
  const removed = []
  let out = text
  for (const [phrase, repl] of Object.entries(AI_PHRASES).sort((a, b) => b[0].length - a[0].length)) {
    if (jd.includes(phrase)) continue
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    if (re.test(out)) {
      removed.push(phrase)
      out = out.replace(re, m => (m[0] && m[0] === m[0].toUpperCase() && m[0] !== m[0].toLowerCase())
        ? repl.charAt(0).toUpperCase() + repl.slice(1) : repl)
    }
  }
  return { text: out.replace(/ ,/g, ',').replace(/\s{2,}/g, ' '), removed }
}

export function cleanTailored(tailored, jdText) {
  const removed = new Set()
  const fix = s => { const r = removeAiPhrases(s, jdText); r.removed.forEach(x => removed.add(x)); return r.text }
  return {
    tailored: {
      ...tailored,
      headline: fix(tailored.headline),
      summary: fix(tailored.summary),
      roleNotes: (tailored.roleNotes || []).map(n => ({ ...n, emphasis: fix(n.emphasis) })),
    },
    removed: [...removed],
  }
}

// ------------------------------------------------------------------ util

function parseJSON(result, label) {
  try { return JSON.parse(result) } catch {
    const m = String(result).match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
    throw new Error(`Failed to parse ${label} response`)
  }
}
