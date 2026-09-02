import React from 'react'
import { tierContact } from '../lib/tiers.js'
import { resumeToDocxBlob, coverLetterToDocxBlob, downloadBlob } from '../lib/docx-export.js'

function printTarget(target) {
  document.body.dataset.printTarget = target
  window.print()
}

export default function GenerateResult({ entry, tierData, onBack, onEdit }) {
  const { tailored, letter } = entry.generated || {}
  if (!tailored || !letter) return null

  const fileBase = `${tierContact.name.replace(/\s+/g, '_')}_${(entry.company || 'Application').replace(/\s+/g, '_')}`

  async function downloadResume() {
    const blob = await resumeToDocxBlob(tierContact, tailored, tierData)
    downloadBlob(blob, `${fileBase}_Resume.docx`)
  }

  async function downloadLetter() {
    const blob = await coverLetterToDocxBlob(tierContact, letter, entry.company)
    downloadBlob(blob, `${fileBase}_CoverLetter.docx`)
  }

  function copyLetterForEmail() {
    const text = [letter.greeting, '', ...letter.paragraphs, '', letter.signOff, tierContact.name].join('\n\n')
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="generate-result">
      <button className="btn-back" onClick={onBack}>&larr; Back to job list</button>

      <div className="generate-header">
        <h2>{entry.title || tailored.headline}</h2>
        <span className="generate-company">{entry.company}</span>
      </div>

      <div className="generate-actions">
        <button className="btn-secondary" onClick={onEdit}>Edit job description / tier</button>
        <button className="btn-primary" onClick={downloadResume}>Download resume (.docx)</button>
        <button className="btn-primary" onClick={downloadLetter}>Download cover letter (.docx)</button>
        <button className="btn-secondary" onClick={() => printTarget('resume')}>Print / save resume as PDF</button>
        <button className="btn-secondary" onClick={() => printTarget('letter')}>Print / save letter as PDF</button>
        <button className="btn-ghost" onClick={copyLetterForEmail}>Copy letter for email</button>
      </div>

      <div className="generate-columns">
        <section className="generate-card" data-print-content="resume">
          <h3>Tailored resume</h3>
          <p className="generate-field-label">Headline</p>
          <p>{tailored.headline}</p>
          <p className="generate-field-label">Summary</p>
          <p>{tailored.summary}</p>
          <p className="generate-field-label">Key skills (reordered)</p>
          <p>{tailored.keySkillsOrdered}</p>
          <p className="generate-field-label">Which bullets to lead with, per role</p>
          <ul className="generate-role-notes">
            {(tailored.roleNotes || []).map((r, i) => (
              <li key={i}><strong>{r.title}:</strong> {r.emphasis}</li>
            ))}
          </ul>
          <p className="field-hint">Full role history, certifications and earlier career come from the
            {' '}{entry.tierKey} tier unchanged — only headline, summary, skill order and emphasis are
            tailored above. The downloaded .docx includes the full tier content.</p>
        </section>

        <section className="generate-card" data-print-content="letter">
          <h3>Cover letter</h3>
          <p>{letter.greeting}</p>
          {(letter.paragraphs || []).map((p, i) => <p key={i}>{p}</p>)}
          <p>{letter.signOff}</p>
          <p>{tierContact.name}</p>
        </section>
      </div>
    </div>
  )
}
