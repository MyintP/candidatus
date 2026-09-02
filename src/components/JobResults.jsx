import React from 'react'
import { getBand } from '../lib/vsf-scorer.js'

const MATCH_COLOURS = { 'STRONG': '#f97316', 'MODERATE': '#d19900', 'WEAK': '#a13544' }
const APPLY_COLOURS = { 'STRONG YES': '#f97316', 'YES': '#ea580c', 'BORDERLINE': '#d19900', 'NO': '#a13544' }

export default function JobResults({ scores, jobs, role, region, onSelectJob, onReset }) {
  const sorted = [...scores].sort((a, b) => parseFloat(b.overallScore) - parseFloat(a.overallScore))

  // Merge source URL from jobs array into each score
  const withLinks = sorted.map(score => {
    const matched = jobs.find(j =>
      (j.title === score.jobTitle || j.title?.includes(score.jobTitle)) &&
      (j.company === score.company)
    )
    return {
      ...score,
      sourceUrl: score.sourceUrl || matched?.link || matched?.url || matched?.jobUrl || matched?.redirect_url || null
    }
  })

  return (
    <div className="results-screen">
      <div className="results-header">
        <button className="btn-back" onClick={onReset}>← New Search</button>
        <div>
          <h2>Live Market: {role}</h2>
          <p className="results-meta">
            {region} · {scores.length} roles scored · {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      <div className="scores-summary">
        <div className="summary-stat">
          <span className="stat-value">{scores.length > 0 ? Math.max(...scores.map(s => parseFloat(s.overallScore))).toFixed(1) : '—'}</span>
          <span className="stat-label">Best Match Score</span>
        </div>
        <div className="summary-stat">
          <span className="stat-value">{scores.filter(s => s.applyRecommendation?.includes('YES')).length}</span>
          <span className="stat-label">Apply Recommended</span>
        </div>
        <div className="summary-stat">
          <span className="stat-value">{scores.length > 0 ? (scores.reduce((a, s) => a + parseFloat(s.overallScore), 0) / scores.length).toFixed(1) : '—'}</span>
          <span className="stat-label">Average Match</span>
        </div>
        <div className="summary-stat">
          <span className="stat-value">{scores.length > 0 ? getBand(scores.reduce((a, s) => a + parseFloat(s.overallScore), 0) / scores.length).label : '—'}</span>
          <span className="stat-label">Your Market Band</span>
        </div>
      </div>

      <div className="job-cards">
        {withLinks.map((score, i) => {
          const band = getBand(score.overallScore)
          return (
            <div key={score.jobId || i} className="job-card" onClick={() => onSelectJob(score)}>
              <div className="job-card-header">
                <div>
                  <h3 className="job-title">{score.jobTitle}</h3>
                  <p className="job-company">{score.company}</p>
                  {score.sourceUrl && score.sourceUrl !== '#' && (
                    <a
                      className="job-live-link"
                      href={score.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                    >
                      View live job ↗
                    </a>
                  )}
                </div>
                <div className="score-badge" style={{ borderColor: band.color, color: band.color }}>
                  {score.overallScore}
                </div>
              </div>

              <div className="job-card-dims">
                {Object.entries(score.dimensions || {}).map(([key, dim]) => (
                  <div key={key} className="mini-dim">
                    <div className="mini-dim-bar-track">
                      <div className="mini-dim-bar-fill" style={{ width: `${(dim.score / 10) * 100}%`, background: band.color }}/>
                    </div>
                    <span className="mini-dim-score">{dim.score}</span>
                  </div>
                ))}
              </div>

              <div className="job-card-footer">
                <span className="match-tag" style={{ color: MATCH_COLOURS[score.matchStrength] || '#666' }}>
                  ● {score.matchStrength}
                </span>
                <span className="apply-tag" style={{ background: APPLY_COLOURS[score.applyRecommendation] || '#666' }}>
                  {score.applyRecommendation}
                </span>
                <span className="gap-count">{score.gaps?.length || 0} gaps · click to analyse →</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}