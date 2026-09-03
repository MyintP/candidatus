// Gap Analysis and Learning Path Generator
import { callLLM } from './llm.js'

const GAP_SYSTEM_PROMPT = `You are a senior enterprise/solution architecture career coach.

Your role is to generate a precise, senior-level learning path for a specific skill gap.
The learner is a senior practitioner — 15+ years experience. Do NOT give beginner content.
Bridge from what they know to what they need. Make it specific and actionable.

Return ONLY valid JSON.`

export async function generateLearningPath(gap, cvText, targetRole) {
  const userMessage = `Generate a learning path for this specific gap for a senior EA/SA practitioner.

GAP: ${gap.skill}
PRIORITY: ${gap.priority}
JD REQUIRES: ${gap.jdEvidence}
CURRENT CV SHOWS: ${gap.cvEvidence}
TARGET ROLE: ${targetRole}
WEEKS TO BRIDGE: ${gap.weeksToBridge}

The practitioner has 30 years experience in enterprise and solution architecture, cloud transformation, and global operations delivery.

Return JSON:
{
  "gap": "${gap.skill}",
  "weeksToBridge": ${gap.weeksToBridge},
  "bridgeStrategy": "One sentence — how to approach this gap given their existing experience",
  "weeks": [
    {
      "week": 1,
      "focus": "Week focus title",
      "dailyCommitment": "45 mins",
      "activities": [
        { "type": "READ|WATCH|PRACTICE|BUILD", "title": "Activity title", "resource": "Specific resource or URL", "duration": "30 mins" }
      ],
      "milestone": "What they can demonstrate by end of week"
    }
  ],
  "audioBriefScript": "A 500-word podcast script that explains this topic at senior EA level — suitable for NotebookLM or ElevenLabs. Conversational, dense, no padding.",
  "cvLanguage": "Rewrite suggestion — how to phrase this capability on a CV once acquired"
}`

  const result = await callLLM(GAP_SYSTEM_PROMPT, userMessage, 3000)

  try {
    return JSON.parse(result)
  } catch {
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    throw new Error('Failed to parse learning path response')
  }
}

export function rankGaps(gaps) {
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
  return [...gaps].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}
