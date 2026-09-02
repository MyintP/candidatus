// Copies the 3 resume tiers (Architect / Engineer / Manager) out of Phil's
// private Resumes_Bio resume_data.json into src/data/resume-tiers.local.json,
// which is gitignored - the vsf-match repo is public, that data isn't.
//
// Run after any edit to resume_data.json:
//     npm run sync-tiers

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SOURCE = join(
  'D:\\', 'ArchivePre2026', '04_Personal', 'Resumes_Bio',
  'resume-automation', 'resume_data.json'
)
const DEST_DIR = join(HERE, '..', 'src', 'data')
const DEST = join(DEST_DIR, 'resume-tiers.local.json')

const data = JSON.parse(readFileSync(SOURCE, 'utf-8'))
const tiers = {
  contact: data.contact,
  education: data.education,
  memberships: data.memberships,
  variants: data.variants,
}

mkdirSync(DEST_DIR, { recursive: true })
writeFileSync(DEST, JSON.stringify(tiers, null, 2) + '\n', 'utf-8')

console.log(`Synced ${Object.keys(tiers.variants).length} tiers to ${DEST}`)
