import React, { useState, useEffect } from 'react'
import { generateLearningPath } from '../lib/gap-analyser.js'

export default function LearningPath({ gap, cvText, targetRole, onBack, onReset }) {
  const [path, setPath] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showScript, setShowScript] = useState(false)

  useEffect(() => {
    generateLearningPath(gap, cvText, targetRole)
      .then(setPath)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [gap, cvText, targetRole])

  const TYPE_ICONS = { READ: '📖', WATCH: '▶', PRACTICE: '⚡', BUILD: '🔨' }

  if (loading) return (
    <div className="learning-loading">
      <div className="pulse-ring small"/>
      <p>Building your learning path for <strong>{gap.skill}</strong>...</p>
      <p className="loading-sub">Calibrating to senior EA level</p>
    </div>
  )

  if (error) return (
    <div className="error-screen">
      <p>Failed to generate learning path: {error}</p>
      <button className="btn-back" onClick={onBack}>← Back</button>
    </div>
  )

  return (
    <div className="learning-screen">
      <button className="btn-back" onClick={onBack}>← Back to Gap Analysis</button>

      <div className="learning-hero">
        <h2>{path.gap}</h2>
        <p className="learning-meta">{path.weeksToBridge} week learning path · {targetRole}</p>
        <p className="bridge-strategy">{path.bridgeStrategy}</p>
      </div>

      <div className="weeks-grid">
        {(path.weeks || []).map((week, i) => (
          <div key={i} className="week-card">
            <div className="week-header">
              <span className="week-num">Week {week.week}</span>
              <span className="week-commit">{week.dailyCommitment}/day</span>
            </div>
            <h4 className="week-focus">{week.focus}</h4>
            <div className="week-activities">
              {(week.activities || []).map((act, j) => (
                <div key={j} className="activity-row">
                  <span className="activity-type">{TYPE_ICONS[act.type] || '·'} {act.type}</span>
                  <span className="activity-title">{act.title}</span>
                  <span className="activity-duration">{act.duration}</span>
                </div>
              ))}
            </div>
            <div className="week-milestone">
              <span className="milestone-label">Milestone:</span> {week.milestone}
            </div>
          </div>
        ))}
      </div>

      {path.cvLanguage && (
        <div className="cv-language-block">
          <h3>CV Language — Once Acquired</h3>
          <p className="cv-language-text">"{path.cvLanguage}"</p>
        </div>
      )}

      {path.audioBriefScript && (
        <div className="audio-brief-block">
          <div className="audio-brief-header" onClick={() => setShowScript(!showScript)}>
            <h3>🎙 Audio Brief Script</h3>
            <span>{showScript ? 'Hide' : 'Show'} — paste into NotebookLM or ElevenLabs</span>
          </div>
          {showScript && (
            <div className="audio-script">
              <pre>{path.audioBriefScript}</pre>
              <button className="btn-copy" onClick={() => navigator.clipboard.writeText(path.audioBriefScript)}>
                Copy Script
              </button>
            </div>
          )}
        </div>
      )}

      <div className="learning-actions">
        <button className="btn-secondary" onClick={onBack}>← More Gaps</button>
        <button className="btn-primary" onClick={onReset}>New Search</button>
      </div>
    </div>
  )
}
