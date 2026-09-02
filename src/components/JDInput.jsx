import React, { useState } from 'react'
import { tiers, tierNames, tiersAvailable } from '../lib/tiers.js'
import { hasApiKey as checkHasApiKey } from '../lib/api-key.js'
import ApiKeyBanner from './ApiKeyBanner.jsx'

export default function JDInput({
  title, setTitle, company, setCompany, sourceUrl, setSourceUrl,
  jdText, setJdText, tierKey, setTierKey, onGenerate, error, busy,
}) {
  const [, setKeyVersion] = useState(0)
  const hasApiKey = checkHasApiKey()

  return (
    <div className="jd-input-screen">
      <div className="input-hero">
        <h1>Paste the job. Get your materials.</h1>
        <p className="hero-sub">
          Paste one job description, pick the resume tier it matches, and generate a tailored
          resume and cover letter from your master data — no invented figures, just your real
          facts reordered and reframed for this job.
        </p>
      </div>

      {!tiersAvailable && (
        <div className="alert alert-warning">
          <strong>No resume tier data found.</strong> Run <code>npm run sync-tiers</code> after
          building your master resume tiers in resume_data.json.
        </div>
      )}
      {!hasApiKey && (
        <ApiKeyBanner onSaved={() => setKeyVersion(v => v + 1)} />
      )}
      {error && (
        <div className="alert alert-error"><strong>Error:</strong> {error}</div>
      )}

      <div className="input-grid">
        <div className="input-col-main">
          <div className="field">
            <label htmlFor="jd-text">Job description</label>
            <p className="field-hint">Paste the full ad text.</p>
            <textarea
              id="jd-text"
              className="cv-textarea"
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              placeholder="Paste the job description here..."
              rows={18}
            />
          </div>
        </div>

        <div className="input-col-side">
          <div className="field">
            <label htmlFor="jd-title">Job title</label>
            <input id="jd-title" type="text" className="input" value={title}
                   onChange={e => setTitle(e.target.value)} placeholder="e.g. Solutions Architect" />
          </div>
          <div className="field">
            <label htmlFor="jd-company">Company</label>
            <input id="jd-company" type="text" className="input" value={company}
                   onChange={e => setCompany(e.target.value)} placeholder="e.g. New Era Technology" />
          </div>
          <div className="field">
            <label htmlFor="jd-url">Source link (optional)</label>
            <input id="jd-url" type="text" className="input" value={sourceUrl}
                   onChange={e => setSourceUrl(e.target.value)} placeholder="Paste the job ad URL" />
          </div>
          <div className="field">
            <label htmlFor="jd-tier">Resume tier</label>
            <p className="field-hint">Which base resume to tailor.</p>
            <select id="jd-tier" className="input" value={tierKey} onChange={e => setTierKey(e.target.value)}>
              {tierNames.map(name => (
                <option key={name} value={name}>{name} — {tiers[name].headline}</option>
              ))}
            </select>
          </div>

          <button
            className="btn-primary run-btn"
            onClick={onGenerate}
            disabled={!jdText.trim() || !tierKey || busy || !tiersAvailable}
          >
            {busy ? 'Generating...' : 'Generate resume & cover letter'}
          </button>
        </div>
      </div>
    </div>
  )
}
