import React, { useEffect, useState } from 'react'
import CVInput from './components/CVInput.jsx'
import JobResults from './components/JobResults.jsx'
import GapAnalysis from './components/GapAnalysis.jsx'
import LearningPath from './components/LearningPath.jsx'
import Sidebar from './components/Sidebar.jsx'
import NotesPanel from './components/NotesPanel.jsx'
import JDInput from './components/JDInput.jsx'
import GenerateResult from './components/GenerateResult.jsx'
import { fetchLiveJobs } from './lib/jooble.js'
import { scoreCV } from './lib/vsf-scorer.js'
import { tiers, tierNames } from './lib/tiers.js'
import { generateTailoredResume, generateCoverLetter } from './lib/generator.js'
import { listEntries, getEntry, saveEntry, updateStatus, deleteEntry } from './lib/history.js'

// Generate (paste-a-JD, tailor-a-resume, track-the-application) is gated off
// by default. It reads Phil's real master-resume content and this app calls
// Claude directly from the browser - fine for local `npm run dev` in this
// private repo. If this is ever built and deployed anywhere public, keep this
// flag unset in that build's environment so the deployed bundle doesn't ship
// personal resume content or bake in a usable API key.
const GENERATE_ENABLED = import.meta.env.VITE_ENABLE_GENERATE === 'true'

export default function App() {
  const [phase, setPhase] = useState(GENERATE_ENABLED ? 'jdinput' : 'input')
  const [cvText, setCvText] = useState('')
  const [role, setRole] = useState('')
  const [region, setRegion] = useState('Brisbane, Australia')
  const [jobs, setJobs] = useState([])
  const [scores, setScores] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [selectedGap, setSelectedGap] = useState(null)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' })

  // --- Generate feature state (sidebar / JD input / tailored output) -------
  const [entries, setEntries] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [jdTitle, setJdTitle] = useState('')
  const [jdCompany, setJdCompany] = useState('')
  const [jdSourceUrl, setJdSourceUrl] = useState('')
  const [jdText, setJdText] = useState('')
  const [tierKey, setTierKey] = useState(tierNames[0] || '')
  const [genBusy, setGenBusy] = useState(false)
  const [genError, setGenError] = useState(null)

  useEffect(() => {
    if (GENERATE_ENABLED) setEntries(listEntries())
  }, [])

  const activeEntry = activeId ? getEntry(activeId) : null

  function refreshEntries() {
    setEntries(listEntries())
  }

  function handleNewJob() {
    setActiveId(null)
    setJdTitle('')
    setJdCompany('')
    setJdSourceUrl('')
    setJdText('')
    setTierKey(tierNames[0] || '')
    setGenError(null)
    setPhase('jdinput')
  }

  function handleSelectEntry(id) {
    const e = getEntry(id)
    if (!e) return
    setActiveId(id)
    setJdTitle(e.title || '')
    setJdCompany(e.company || '')
    setJdSourceUrl(e.sourceUrl || '')
    setJdText(e.jdText || '')
    setTierKey(e.tierKey || tierNames[0] || '')
    setGenError(null)
    setPhase(e.generated ? 'generate' : 'jdinput')
  }

  function handleScoreMode() {
    setActiveId(null)
    setPhase('input')
  }

  function handleStatusChange(id, status) {
    updateStatus(id, status)
    refreshEntries()
  }

  function handleDeleteEntry(id) {
    deleteEntry(id)
    refreshEntries()
    if (activeId === id) {
      setActiveId(null)
      setPhase('jdinput')
    }
  }

  async function handleGenerate() {
    if (!jdText.trim() || !tierKey) return
    setGenBusy(true)
    setGenError(null)
    try {
      const tierData = tiers[tierKey]
      const [tailored, letter] = await Promise.all([
        generateTailoredResume(tierData, jdText),
        generateCoverLetter(tierData, jdText, jdCompany),
      ])
      const prior = activeId ? getEntry(activeId) : null
      const saved = saveEntry({
        id: activeId,
        title: jdTitle,
        company: jdCompany,
        sourceUrl: jdSourceUrl,
        jdText,
        tierKey,
        status: prior?.status || 'Active',
        notes: prior?.notes || '',
        generated: { tailored, letter },
      })
      setActiveId(saved.id)
      refreshEntries()
      setPhase('generate')
    } catch (err) {
      setGenError(err.message)
    } finally {
      setGenBusy(false)
    }
  }

  async function handleRun() {
    if (!cvText.trim() || !role.trim()) return
    setError(null)
    setPhase('scanning')
    setProgress({ current: 0, total: 0, label: 'Fetching live jobs...' })

    try {
      const liveJobs = await fetchLiveJobs({ keywords: role, location: region, resultsPerPage: 5 })
      setJobs(liveJobs)
      setProgress({ current: 0, total: liveJobs.length, label: 'Scoring your CV against live roles...' })

      const results = []
      for (let i = 0; i < liveJobs.length; i++) {
        setProgress({ current: i + 1, total: liveJobs.length, label: `Scoring: ${liveJobs[i].title} @ ${liveJobs[i].company}` })
        try {
          const score = await scoreCV(cvText, liveJobs[i])
          results.push(score)
        } catch (err) {
          console.warn(`Scoring failed for ${liveJobs[i].title}:`, err.message)
        }
      }

      setScores(results)
      setPhase('results')
    } catch (err) {
      setError(err.message)
      setPhase('input')
    }
  }

  function handleSelectJob(score) {
    setSelectedJob(score)
    setPhase('gap')
  }

  function handleSelectGap(gap) {
    setSelectedGap(gap)
    setPhase('learning')
  }

  const mainContent = (
    <>
      {phase === 'jdinput' && GENERATE_ENABLED && (
        <JDInput
          title={jdTitle} setTitle={setJdTitle}
          company={jdCompany} setCompany={setJdCompany}
          sourceUrl={jdSourceUrl} setSourceUrl={setJdSourceUrl}
          jdText={jdText} setJdText={setJdText}
          tierKey={tierKey} setTierKey={setTierKey}
          onGenerate={handleGenerate}
          error={genError}
          busy={genBusy}
        />
      )}

      {phase === 'generate' && GENERATE_ENABLED && activeEntry && (
        <GenerateResult
          entry={activeEntry}
          tierData={tiers[activeEntry.tierKey]}
          onBack={handleNewJob}
          onEdit={() => setPhase('jdinput')}
        />
      )}

      {phase === 'input' && (
        <CVInput
          cvText={cvText} setCvText={setCvText}
          role={role} setRole={setRole}
          region={region} setRegion={setRegion}
          onRun={handleRun}
          error={error}
        />
      )}

      {phase === 'scanning' && (
        <div className="scanning-screen">
          <div className="scanning-inner">
            <div className="pulse-ring"/>
            <p className="scanning-label">{progress.label}</p>
            {progress.total > 0 && (
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${(progress.current / progress.total) * 100}%` }}/>
              </div>
            )}
            <p className="scanning-sub">{progress.current > 0 ? `${progress.current} of ${progress.total} roles scored` : 'Connecting to live job market...'}</p>
          </div>
        </div>
      )}

      {phase === 'results' && (
        <JobResults
          scores={scores}
          jobs={jobs}
          role={role}
          region={region}
          onSelectJob={handleSelectJob}
          onReset={() => setPhase(GENERATE_ENABLED ? 'jdinput' : 'input')}
        />
      )}

      {phase === 'gap' && selectedJob && (
        <GapAnalysis
          score={selectedJob}
          cvText={cvText}
          role={role}
          onSelectGap={handleSelectGap}
          onBack={() => setPhase('results')}
        />
      )}

      {phase === 'learning' && selectedGap && selectedJob && (
        <LearningPath
          gap={selectedGap}
          cvText={cvText}
          targetRole={`${selectedJob.jobTitle} at ${selectedJob.company}`}
          onBack={() => setPhase('gap')}
          onReset={() => setPhase(GENERATE_ENABLED ? 'jdinput' : 'input')}
        />
      )}
    </>
  )

  const showNotes = GENERATE_ENABLED && activeId && (phase === 'jdinput' || phase === 'generate')

  const shell = (
    <div className="app-main-col">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo-block">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="Candidatus logo">
              <rect x="2" y="2" width="28" height="28" rx="6" fill="var(--color-primary)"/>
              <path d="M8 20 L12 12 L16 18 L20 10 L24 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="24" cy="16" r="2.5" fill="white"/>
            </svg>
            <div>
              <span className="logo-title">Candidatus</span>
              <span className="logo-sub">Career Readiness Engine</span>
            </div>
          </div>
          <div className="header-meta">
            <span>Five-dimension fit score</span>
            <span className="dot">·</span>
            <span>Phil Myint</span>
          </div>
        </div>
      </header>

      <main className="main">{mainContent}</main>

      {showNotes && (
        <NotesPanel entryId={activeId} initialNotes={activeEntry?.notes} />
      )}

      <footer className="app-footer">
        <p>Candidatus · personal job-application tool · Brisbane, Australia</p>
      </footer>
    </div>
  )

  if (!GENERATE_ENABLED) {
    return <div className="app">{shell}</div>
  }

  return (
    <div className="app app-with-sidebar">
      <Sidebar
        entries={entries}
        activeId={activeId}
        onSelect={handleSelectEntry}
        onNew={handleNewJob}
        onScoreMode={handleScoreMode}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteEntry}
      />
      {shell}
    </div>
  )
}
