// User-supplied Google AI (Gemini) API key, entered in the browser and kept
// only in this browser's localStorage - never sent anywhere but directly to
// Google. This lets the app be deployed as a public static site (GitHub
// Pages) with no key baked into the bundle: each visitor supplies their own,
// free, from Google AI Studio.
//
// Local dev (`npm run dev`) can still set VITE_GEMINI_API_KEY in .env as a
// fallback default, which is convenient for one person developing locally -
// that path is never available in the deployed public build since env vars
// are inlined at build time and this repo's deploy workflow doesn't set it.

const KEY = 'candidatus.llm_key.v1'
const PLACEHOLDER = 'your-gemini-key-here'

export function getApiKey() {
  try {
    return window.localStorage.getItem(KEY) || import.meta.env.VITE_GEMINI_API_KEY || ''
  } catch {
    return import.meta.env.VITE_GEMINI_API_KEY || ''
  }
}

export function setApiKey(key) {
  try {
    if (key) window.localStorage.setItem(KEY, key.trim())
    else window.localStorage.removeItem(KEY)
  } catch (err) {
    console.warn('Could not save API key to localStorage:', err.message)
  }
}

export function hasApiKey() {
  const key = getApiKey()
  return Boolean(key) && key !== PLACEHOLDER
}
