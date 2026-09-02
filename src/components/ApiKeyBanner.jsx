import React, { useState } from 'react'
import { setApiKey } from '../lib/api-key.js'

// Shown when no usable API key is present. Lets a visitor paste their own
// Anthropic key, kept only in their browser's localStorage - never sent
// anywhere but directly to Anthropic from their own requests.
export default function ApiKeyBanner({ onSaved }) {
  const [value, setValue] = useState('')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    if (!value.trim()) return
    setApiKey(value.trim())
    setSaved(true)
    onSaved?.()
  }

  if (saved) {
    return (
      <div className="alert alert-success">
        <strong>Key saved.</strong> Kept only in this browser — you can run a score now.
      </div>
    )
  }

  return (
    <div className="alert alert-warning api-key-banner">
      <strong>Add your Anthropic API key to score a CV.</strong>
      <p className="field-hint" style={{ margin: '4px 0 8px' }}>
        Kept only in your browser (localStorage) — never sent anywhere but directly to Anthropic.
        Get one at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">console.anthropic.com</a>.
      </p>
      <div className="api-key-row">
        <input
          type="password"
          className="input"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="sk-ant-..."
        />
        <button className="btn-secondary" onClick={handleSave} disabled={!value.trim()}>Save key</button>
      </div>
    </div>
  )
}
