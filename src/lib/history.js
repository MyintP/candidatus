// Local job-tracking history (left sidebar + notes panel).
// No backend - everything lives in this browser's localStorage. That means
// no cross-device sync and it's wiped by clearing site data, which is fine
// for a single-user local tool but worth knowing before relying on it.

const KEY = 'candidatus.history.v1'

export const STATUSES = ['Active', 'Interviewing', 'Archived', 'Dead']

function load() {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(entries) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries))
  } catch (err) {
    console.warn('Could not save history to localStorage:', err.message)
  }
}

export function listEntries() {
  return load().sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getEntry(id) {
  return load().find(e => e.id === id) || null
}

export function saveEntry(entry) {
  const entries = load()
  const now = Date.now()
  const idx = entries.findIndex(e => e.id === entry.id)
  const next = { ...entry, updatedAt: now }
  if (idx === -1) {
    next.id = next.id || `job-${now}-${Math.random().toString(36).slice(2, 8)}`
    next.createdAt = now
    entries.push(next)
  } else {
    entries[idx] = { ...entries[idx], ...next }
  }
  save(entries)
  return idx === -1 ? next : entries[idx]
}

export function updateStatus(id, status) {
  const entries = load()
  const idx = entries.findIndex(e => e.id === id)
  if (idx === -1) return
  entries[idx].status = status
  entries[idx].updatedAt = Date.now()
  save(entries)
}

export function updateNotes(id, notes) {
  const entries = load()
  const idx = entries.findIndex(e => e.id === id)
  if (idx === -1) return
  entries[idx].notes = notes
  entries[idx].updatedAt = Date.now()
  save(entries)
}

export function deleteEntry(id) {
  save(load().filter(e => e.id !== id))
}
