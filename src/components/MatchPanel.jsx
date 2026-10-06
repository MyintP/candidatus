import React from 'react'

// Shows how the tailored resume reads against the job ad: ATS-style score
// (Resume-Matcher weighting), knock-outs, keywords that are safe to add,
// genuine gaps, and which existing bullets to lead with.

function Bar({ label, value }) {
  return (
    <div className="match-bar">
      <div className="match-bar-label"><span>{label}</span><span>{value}%</span></div>
      <div className="match-bar-track"><div className="match-bar-fill" style={{ width: `${value}%` }} /></div>
    </div>
  )
}

function Chips({ items, kind }) {
  if (!items || !items.length) return <p className="field-hint">None</p>
  return <div className="match-chips">{items.map((k, i) => <span key={i} className={`match-chip ${kind}`}>{k}</span>)}</div>
}

export default function MatchPanel({ match }) {
  if (!match) return null
  const { ats, before, bulletRanks, aiPhrasesRemoved, jdKeywords } = match
  const failing = ats.knockouts.filter(k => !k.evidenced)

  return (
    <section className="generate-card match-panel">
      <h3>Match against this ad</h3>
      <div className="match-score">
        <span className="match-score-num">{Math.round(ats.overall)}</span>
        <span className="match-score-of">/ 100 ATS-style score</span>
      </div>
      <p className="field-hint">
        Keyword match went from {before}% (tier as-is) to {ats.subScores.keywordMatch}% after tailoring.
        The most this master can reach without inventing anything is {ats.potentialMatch}%.
      </p>
      <Bar label="Keyword match (55%)" value={ats.subScores.keywordMatch} />
      <Bar label="Skills coverage (25%)" value={ats.subScores.skillsCoverage} />
      <Bar label="Sections present (20%)" value={ats.subScores.sectionCompleteness} />

      <p className="generate-field-label">Mandatory items (knock-outs)</p>
      {ats.knockouts.length === 0 ? <p className="field-hint">The ad lists none.</p> : (
        <ul className="match-knockouts">
          {ats.knockouts.map((k, i) => (
            <li key={i} className={k.evidenced ? 'ok' : 'warn'}>
              {k.evidenced ? 'Stated in resume: ' : 'Not stated in resume, check: '}{k.item}
            </li>
          ))}
        </ul>
      )}
      {failing.length > 0 && <p className="alert alert-warning">A missing mandatory item usually ends an application before skills are read.</p>}

      <p className="generate-field-label">Safe to add (proven elsewhere in your master)</p>
      <Chips items={ats.injectable} kind="safe" />
      <p className="generate-field-label">Genuine gaps (not in your master; don't claim)</p>
      <Chips items={ats.nonInjectable} kind="gap" />

      <p className="generate-field-label">What to do</p>
      <ul>{ats.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>

      <p className="generate-field-label">Lead with these bullets</p>
      <ul className="generate-role-notes">
        {(bulletRanks || []).filter(r => r.bullets.some(b => b.score > 0)).slice(0, 5).map((r, i) => (
          <li key={i}><strong>{r.title}{r.org ? `, ${r.org}` : ''}:</strong> {r.bullets[0].text}</li>
        ))}
      </ul>

      {aiPhrasesRemoved && aiPhrasesRemoved.length > 0 && (
        <p className="field-hint">Plain-English cleanup replaced: {aiPhrasesRemoved.join(', ')}.</p>
      )}
      {jdKeywords?.seniority_level && (
        <p className="field-hint">Ad reads as {jdKeywords.seniority_level}
          {jdKeywords.experience_years ? `, ${jdKeywords.experience_years}+ years` : ''}.</p>
      )}
    </section>
  )
}
