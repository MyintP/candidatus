# Candidatus — Setup Guide

**Live at https://myintp.github.io/candidatus/ — the steps below are only for
running locally, which you need for the Generate feature.**

---

## What You Need

### 1. Node.js
Download from https://nodejs.org — install the LTS version.
Verify: `node --version` → should show v18+ or v20+

### 2. Google AI (Gemini) API Key — free
- Go to https://aistudio.google.com/apikey
- Sign in with a Google account → Create API key
- No credit card required, no cost — Google's free tier covers normal personal use

### 3. Jooble API Key (for live Australian jobs)
- Go to https://jooble.org/api/about
- Register (free)
- Copy your API key
- **Without this key:** the app uses realistic mock data — still useful for testing

---

## Installation

```bash
# 1. Clone the repo
git clone https://github.com/MyintP/candidatus.git
cd candidatus

# 2. Install dependencies
npm install

# 3. Configure API keys
cp .env.example .env
# Open .env in any text editor and add your keys, set VITE_ENABLE_GENERATE=true

# 4. Sync your resume tiers (for Generate)
npm run sync-tiers

# 5. Run
npm run dev
# Open http://localhost:5173
```

---

## Your Monday Routine

1. Open terminal → `cd candidatus && npm run dev`
2. Open http://localhost:5173
3. Paste your current CV
4. Enter target role (e.g. "Enterprise Architect") and region (e.g. "Brisbane, Australia")
5. Click **Score against this role**
6. Review scores — which roles are STRONG match vs BORDERLINE?
7. Click the highest-scoring role → review gap analysis
8. Click your highest-priority gap → work through the learning path this week
9. Repeat next Monday — track whether your score is improving
10. Found a real job you want to apply to? Click **+ New job** in the sidebar,
    paste the JD, pick a resume tier, and generate a tailored resume + cover
    letter

---

## Tips

- **Update your CV** as you close gaps — run the score again and see it move
- **Try different role titles** — "Solution Architect" vs "Enterprise Architect" vs "Principal Architect" shows where the market actually wants you
- **Try different regions** — Brisbane vs Sydney vs "Australia" vs "Remote" shows geographic demand
- **Save your audio brief scripts** — paste into NotebookLM at https://notebooklm.google.com for a real podcast episode on the topic

