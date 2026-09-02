import React, { useState } from 'react'
import { STATUSES } from '../lib/history.js'

const STATUS_COLORS = {
  Active: '#006494',
  Interviewing: '#437a22',
  Archived: '#666666',
  Dead: '#a13544',
}

export default function Sidebar({ entries, activeId, onSelect, onNew, onScoreMode, onStatusChange, onDelete }) {
  const [filter, setFilter] = useState('All')
  const visible = filter === 'All' ? entries : entries.filter(e => e.status === filter)

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <button className="btn-primary sidebar-new-btn" onClick={onNew}>+ New job</button>
        <button className="btn-ghost sidebar-score-link" onClick={onScoreMode}>Score a CV instead</button>
      </div>

      <div className="sidebar-filter">
        {['All', ...STATUSES].map(s => (
          <button
            key={s}
            className={`filter-chip ${filter === s ? 'filter-chip-active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="sidebar-list">
        {visible.length === 0 && <p className="sidebar-empty">No jobs tracked yet.</p>}
        {visible.map(entry => (
          <div
            key={entry.id}
            className={`sidebar-entry ${entry.id === activeId ? 'sidebar-entry-active' : ''}`}
            onClick={() => onSelect(entry.id)}
          >
            <div className="sidebar-entry-header">
              <span className="sidebar-entry-title">{entry.title || 'Untitled role'}</span>
              <span className="sidebar-status-dot" style={{ background: STATUS_COLORS[entry.status] }} />
            </div>
            <span className="sidebar-entry-company">{entry.company || '—'}</span>
            <div className="sidebar-entry-footer">
              <select
                className="sidebar-status-select"
                value={entry.status}
                onClick={e => e.stopPropagation()}
                onChange={e => onStatusChange(entry.id, e.target.value)}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                className="sidebar-delete-btn"
                title="Remove from tracking"
                onClick={e => { e.stopPropagation(); onDelete(entry.id) }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
