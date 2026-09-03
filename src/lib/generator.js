// Tailored resume + cover letter generation from a pasted job description.
// Follows the same callLLM + JSON-with-regex-fallback pattern as
// vsf-scorer.js and gap-analyser.js.
//
// HARD CONSTRAINT: both prompts forbid inventing any fact, number or outcome
// not already present in the tier data. The model may only select, reorder
// and rephrase what's given - this mirrors the no-invented-metrics rule the
// resume-automation Python pipeline enforces on the same source data.

import { callLLM } from './llm.js'

const NO_INVENTION_RULE = `Rules, no exceptions:
- Use ONLY facts, figures, employers, titles and achievements present in TIER DATA below.
- Never invent a number, percentage, team size, budget or outcome that isn't already there.
- Never invent a certification, employer or job title.
- You may reorder, select a subset, and rephrase wording to speak to the job description's language.
- If the job description asks for something TIER DATA doesn't cover, leave it out rather than implying it.`

function tierDataBlock(tierData) {
  return `TIER DATA (source of truth - the only facts you may use):
Headline: ${tierData.headline}
Summary: ${tierData.summary}
Key skills: ${tierData.key_skills}
Certifications: ${tierData.certifications.join('; ')}
Roles:
${tierData.roles.map(r => `- ${r.title}${r.org ? ' at ' + r.org : ''} (${r.dates})
  Overview: ${r.overview || ''}
  Responsibilities: ${(r.responsibilities || []).join(' | ')}
  Achievements: ${(r.achievements || []).join(' | ')}`).join('\n')}
Earlier career: ${(tierData.earlier_career || []).join(' ')}`
}

const RESUME_SYSTEM_PROMPT = `You tailor an existing resume's wording and bullet ordering to a specific job description. You do not write a new resume from scratch and you do not invent content.

${NO_INVENTION_RULE}

Return ONLY valid JSON, no preamble.`

export async function generateTailoredResume(tierData, jdText) {
  const userMessage = `${tierDataBlock(tierData)}

JOB DESCRIPTION TO TAILOR FOR:
${jdText}

Return JSON in exactly this structure:
{
  "headline": "possibly reworded headline, still truthful to TIER DATA",
  "summary": "2-4 sentence summary reordered/reworded to foreground what this JD asks for, built only from TIER DATA",
  "keySkillsOrdered": "key skills string, same skills as TIER DATA, reordered so the most JD-relevant come first",
  "roleNotes": [
    { "title": "role title from TIER DATA", "emphasis": "one sentence on which of this role's existing bullets to lead with for this JD, quoting them" }
  ]
}`

  const result = await callLLM(RESUME_SYSTEM_PROMPT, userMessage, 2048)
  return parseJSON(result, 'tailored resume')
}

const COVER_LETTER_SYSTEM_PROMPT = `You write a concise, evidence-based cover letter using only facts supplied about the candidate. No flattery filler, no generic claims the source material doesn't support.

${NO_INVENTION_RULE}

Australian English. Return ONLY valid JSON, no preamble.`

export async function generateCoverLetter(tierData, jdText, companyName) {
  const userMessage = `${tierDataBlock(tierData)}

COMPANY: ${companyName || '(not specified - address generically)'}

JOB DESCRIPTION:
${jdText}

Write a cover letter, 3-4 short paragraphs: why this role, 2-3 concrete matches between TIER DATA and the JD (with evidence), a brief close. No invented figures.

Return JSON in exactly this structure:
{
  "greeting": "Dear Hiring Manager," ,
  "paragraphs": ["paragraph 1", "paragraph 2", "paragraph 3"],
  "signOff": "Kind regards,"
}`

  const result = await callLLM(COVER_LETTER_SYSTEM_PROMPT, userMessage, 1536)
  return parseJSON(result, 'cover letter')
}

function parseJSON(result, label) {
  try {
    return JSON.parse(result)
  } catch {
    const match = result.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error(`Failed to parse ${label} response`)
  }
}
