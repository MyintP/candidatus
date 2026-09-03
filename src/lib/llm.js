// LLM calls via Google's Gemini API (generativelanguage.googleapis.com).
// Chosen because Google AI Studio issues genuinely free API keys - no
// credit card, a real daily free quota - unlike Anthropic's pay-as-you-go
// Claude API. Called directly from the browser: Google's API supports CORS
// for exactly this client-side use case (it's how their own AI Studio web
// playground works), so no special browser-access header is needed.
//
// The key comes from this browser's localStorage (entered by the visitor -
// see api-key.js), so no secret is ever baked into the deployed bundle.

import { getApiKey } from './api-key.js'

const MODEL = 'gemini-2.0-flash'

export async function callLLM(systemPrompt, userMessage, maxTokens = 4096) {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('No Google AI API key set. Add yours above to enable scoring.')
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json',
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Gemini API error: ${error.error?.message || response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    const reason = data.candidates?.[0]?.finishReason
    throw new Error(`Gemini returned no content${reason ? ` (${reason})` : ''}`)
  }
  return text
}
