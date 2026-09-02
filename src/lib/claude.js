// Claude API calls via Anthropic SDK
// Note: In production, route through a backend to protect API key
// For local/personal use, direct browser call is acceptable

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

export async function callClaude(systemPrompt, userMessage, maxTokens = 4096) {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'sk-ant-...') {
    throw new Error('Anthropic API key not configured. Add VITE_ANTHROPIC_API_KEY to your .env file.')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
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
