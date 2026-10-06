// Five-Dimension Fit Scoring Engine
// Scores a CV against a job description across five weighted dimensions.

import { callLLM } from './llm.js'

const FIT_SYSTEM_PROMPT = `You are a rigorous, evidence-based career-fit scoring engine for senior technology roles.

You score CVs against job descriptions across five dimensions. Return ONLY valid JSON — no preamble, no explanation.

THE FIVE DIMENSIONS:
1. Scale of Impact (25%) — How far does their work reach? Users, sites, countries, financial consequence, organisational scope
2. Complexity Governed (25%) — How hard was the environment? M&A, regulatory, live operations, multi-vendor, multi-geography
3. Authority Held (20%) — What level did they actually operate at? ARB chair, Design Authority, board-level, sign-off authority
4. Outcome Integrity (20%) — Did the work land? Delivered on time, zero-disruption, clean handover, measurable outcome
5. Capability Transferred (10%) — What did they leave behind? Frameworks, patterns, team uplift, IP, documentation

SCORING RULES:
- Score each dimension 1.0–10.0 (one decimal place)
- Score the CV against THIS specific JD — not as an absolute measure
- Be honest and evidence-based. A 6.5 overall is senior SA level. 7.5+ is Principal/Lead EA.
- Identify specific gaps where the JD requires something the CV doesn't demonstrate
- Each gap must be named, evidenced from the JD, and rated HIGH/MEDIUM/LOW priority

BENCHMARK BANDS:
3.0–4.5: Graduate / Junior EA
4.5–6.0: Mid-level Solution Architect  
6.0–7.5: Senior Solution Architect
7.5–8.5: Principal / Lead EA
8.5–10.0: Chief Architect`

export async function scoreCV(cvText, job) {
  const userMessage = `Score this CV against the following job description using the five-dimension fit framework.

JOB TITLE: ${job.title}
COMPANY: ${job.company}
LOCATION: ${job.location}
JD SNIPPET: ${job.snippet}

CV TEXT:
${cvText}

Return JSON in exactly this structure:
{
  "jobId": "${job.id}",
  "jobTitle": "${job.title}",
  "company": "${job.company}",
  "overallScore": 0.0,
  "band": "Senior Solution Architect",
  "matchStrength": "STRONG|MODERATE|WEAK",
  "dimensions": {
    "scaleOfImpact": { "score": 0.0, "weight": 0.25, "evidence": "What in the CV supports this score", "jdRequirement": "What the JD needs" },
    "complexityGoverned": { "score": 0.0, "weight": 0.25, "evidence": "...", "jdRequirement": "..." },
    "authorityHeld": { "score": 0.0, "weight": 0.20, "evidence": "...", "jdRequirement": "..." },
    "outcomeIntegrity": { "score": 0.0, "weight": 0.20, "evidence": "...", "jdRequirement": "..." },
    "capabilityTransferred": { "score": 0.0, "weight": 0.10, "evidence": "...", "jdRequirement": "..." }
  },
  "gaps": [
    {
      "skill": "Gap name",
      "priority": "HIGH|MEDIUM|LOW",
      "jdEvidence": "Exact phrase from JD requiring this",
      "cvEvidence": "What the CV does or doesn't show",
      "weeksToBridge": 2
    }
  ],
  "strengths": ["Top 3 genuine strengths for this specific role"],
  "applyRecommendation": "STRONG YES|YES|BORDERLINE|NO",
  "applyRationale": "One sentence honest assessment"
}`

  const result = await callLLM(FIT_SYSTEM_PROMPT, userMessage, 2048)

  try {
    return JSON.parse(result)
  } catch {
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    throw new Error('Failed to parse fit score response')
  }
}

export function calculateWeightedScore(dimensions) {
  return Object.values(dimensions).reduce((total, dim) => {
    return total + (dim.score * dim.weight)
  }, 0).toFixed(1)
}

export function getBand(score) {
  const s = parseFloat(score)
  if (s >= 8.5) return { label: 'Chief Architect', color: '#01696f' }
  if (s >= 7.5) return { label: 'Principal / Lead EA', color: '#437a22' }
  if (s >= 6.0) return { label: 'Senior Solution Architect', color: '#006494' }
  if (s >= 4.5) return { label: 'Mid-level Solution Architect', color: '#d19900' }
  return { label: 'Graduate / Junior EA', color: '#964219' }
}
