# Candidatus — Career Readiness Engine

**Phil Myint · Brisbane**

> *Stop applying blind. Know exactly where you stand — and what to do about it.*

A personal, private tool: score your CV against a job description across five
weighted dimensions, see the gaps, get a learning path — then paste the same
job description in and get a tailored resume and cover letter generated from
your own real career facts, tracked in a sidebar so you're not doing this in
a folder of two hundred loose Word documents.

---

## What This Does

**Score.** Paste your CV, enter a target role and region, and the engine
pulls live job listings (or scores a single pasted job), rates your fit
across five dimensions, identifies gaps against that specific JD, and builds
a learning path for each gap.

**Generate.** Paste a job description, pick which resume tier it matches
(Architect / Engineer / Manager), and get a tailored resume and cover letter
built only from facts already in your tier data — no invented figures, ever.
Track the application's status (Active / Interviewing / Archived / Dead) and
keep notes on it in the same place.

---

## The Five Fit Dimensions

| # | Dimension | Weight | What it measures |
|---|---|---|---|
| 1 | Scale of Impact | 25% | How far did your work reach? Users, sites, countries, financial consequence |
| 2 | Complexity Governed | 25% | How hard was the environment? M&A, regulation, live operations, multi-vendor |
| 3 | Authority Held | 20% | What level did you actually operate at? ARB chair, Design Authority, sign-off |
| 4 | Outcome Integrity | 20% | Did the work land? Delivered, zero-disruption, clean handover |
| 5 | Capability Transferred | 10% | What did you leave behind? Frameworks, patterns, team uplift |

---

## Generate — tailored resume + cover letter from a pasted JD

**Local-only by design, off by default.** It processes your real
master-resume content and this app calls Claude directly from the browser —
fine for `npm run dev` on your own machine. If this ever gets built and
deployed anywhere public, keep `VITE_ENABLE_GENERATE` unset in that
environment: with the flag unset, Vite dead-code-eliminates the entire
feature (components, lib code, tier data) out of the production bundle —
confirmed by build.

- Run `npm run sync-tiers` after any edit to
  `D:\ArchivePre2026\04_Personal\Resumes_Bio\resume-automation\resume_data.json`
  to copy the 3 tiers into the gitignored `src/data/resume-tiers.local.json`.
  Never committed — this repo is private, but that file still isn't tracked.
- History (tracked jobs, status, notes) lives in this browser's
  `localStorage` only — no backend, no cross-device sync.
- PDF export is browser print-to-PDF (a "Print / save as PDF" button), not a
  pixel-match to the SEEK-template pipeline in `resume-automation/`.
- Generation prompts (`src/lib/generator.js`) are constrained to only
  reorder/reword facts already in the tier data — no invented figures, same
  rule the Python pipeline enforces.

---

## Repository Structure

```
candidatus/
├── README.md
├── package.json
├── vite.config.js
├── .env.example
├── index.html
├── scripts/
│   └── sync-tiers.mjs       — copies resume tiers from Resumes_Bio (gitignored dest)
├── public/
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── components/
    │   ├── CVInput.jsx          — CV paste area + role/region intake
    │   ├── JobResults.jsx       — Live job listings with fit scores
    │   ├── GapAnalysis.jsx      — Ranked gap report with evidence
    │   ├── LearningPath.jsx     — Personalised learning curve per gap
    │   ├── Sidebar.jsx          — Generate: tracked-job list, status, filters
    │   ├── NotesPanel.jsx       — Generate: per-job notes, bottom panel
    │   ├── JDInput.jsx          — Generate: paste JD + pick tier
    │   └── GenerateResult.jsx   — Generate: tailored resume + cover letter output
    └── lib/
        ├── jooble.js            — Jooble API integration
        ├── vsf-scorer.js        — Five-dimension scoring engine
        ├── gap-analyser.js      — Gap identification and ranking
        ├── learning-path.js     — Learning curve generator
        ├── claude.js            — Anthropic API calls
        ├── generator.js         — Generate: tailored resume/letter prompts
        ├── docx-export.js       — Generate: client-side .docx rendering
        ├── history.js           — Generate: localStorage job tracking
        └── tiers.js             — Generate: loads resume-tiers.local.json
```

---

## Setup

### 1. Get API keys

**Anthropic (Claude):** https://console.anthropic.com → API Keys → Create Key
**Jooble (optional, live job search):** https://jooble.org/api/about → Register → Copy key

### 2. Install

```bash
git clone https://github.com/MyintP/candidatus.git
cd candidatus
npm install
```

### 3. Configure

```bash
cp .env.example .env
# Edit .env — add your Anthropic key, and set VITE_ENABLE_GENERATE=true
```

### 4. Sync your resume tiers (for Generate)

```bash
npm run sync-tiers
```

### 5. Run

```bash
npm run dev
# Open http://localhost:5173
```

---

## Roadmap

| Feature | Status |
|---|---|
| CV intake + live jobs + five-dimension fit scoring | ✅ Working |
| Gap analysis with evidence and ranking | ✅ Working |
| Personalised learning path per gap | ✅ Working |
| Generate: tailored resume + cover letter from a pasted JD | ✅ Working |
| Job tracking sidebar + notes | ✅ Working |
| Live Jooble job search (currently mocked) | ⏳ Planned |
| Audio brief script generation | ⏳ Planned |

---

## Built On

- Claude (Anthropic) for CV analysis, gap intelligence, and tailored generation
- Jooble API for live job data (currently mocked — see `src/lib/jooble.js`)
- React + Vite
- `docx` for client-side resume/cover-letter rendering

---

## Licence

Private, personal tool. Not for redistribution.
