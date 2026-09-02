// Claude API calls via Anthropic SDK
// Note: routes directly from the browser to Anthropic. The key comes from
// this browser's localStorage (entered by the visitor - see api-key.js), so
// no secret is ever baked into the deployed bundle.

import { getApiKey } from './api-key.js'

export async function callClaude(systemPrompt, userMessage, maxTokens = 4096) {
  const apiKey = getApiKey()
  if (!apiKey || apiKey === 'sk-ant-...') {
    throw new Error('No Anthropic API key set. Add yours above to enable scoring.')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Claude API error: ${error.error?.message || response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
}
