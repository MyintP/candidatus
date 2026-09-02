import React, { useEffect, useRef, useState } from 'react'
import { updateNotes } from '../lib/history.js'

export default function NotesPanel({ entryId, initialNotes, onCollapse }) {
  const [notes, setNotes] = useState(initialNotes || '')
  const debounceRef = useRef(null)

  useEffect(() => {
    setNotes(initialNotes || '')
  }, [entryId])

  function handleChange(e) {
    const value = e.target.value
    setNotes(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateNotes(entryId, value), 400)
  }

  return (
    <div className="notes-panel">
      <div className="notes-panel-header">
        <span>Notes</span>
        {onCollapse && <button className="btn-ghost" onClick={onCollapse}>Hide</button>}
      </div>
      <textarea
        className="notes-textarea"
        value={notes}
        onChange={handleChange}
        placeholder="Recruiter contact, interview dates, follow-ups..."
        rows={3}
      />
    </div>
  )
}
