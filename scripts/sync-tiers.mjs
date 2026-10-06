// Copies the resume tiers (all variants plus the plain single-column ones) out of Phil's
// private Resumes_Bio resume_data.json into src/data/resume-tiers.local.json,
// which is gitignored - the candidatus repo is public, that data isn't.
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

// Plain single-column variants (build_plain.py) use a simpler shape; convert
// them to the tier shape the generator expects.
const plain = Object.fromEntries(Object.entries(data.plain_variants || {}).map(([key, v]) => [key, {
  headline: v.headline,
  rights: v.rights || data.contact?.rights || '',
  summary: v.summary,
  key_skills: (v.skills || []).map(([label, text]) => `${label}: ${text}`).join('; '),
  certifications: String(v.certifications || '').split(/\s+\|\s+/).filter(Boolean),
  roles: (v.roles || []).map(r => ({
    title: r.title, org: r.org, dates: r.dates, location: r.location || '',
    overview: r.subtitle || '', responsibilities: [], achievements: r.bullets || [],
  })),
  earlier_career: v.earlier ? [v.earlier] : [],
}]))

const variants = { ...plain, ...data.variants }

// Every fact in every variant: the "master" that decides whether a missing
// job-ad keyword is safe to add (proven somewhere) or a genuine gap.
const collect = o => typeof o === 'string' ? [o] : Array.isArray(o) ? o.flatMap(collect)
  : o && typeof o === 'object' ? Object.values(o).flatMap(collect) : []
const masterText = [...new Set(collect({ variants: data.variants, plain: data.plain_variants, education: data.education }))].join(' ')

const tiers = {
  contact: data.contact,
  education: data.education,
  memberships: data.memberships,
  variants,
  masterText,
}

mkdirSync(DEST_DIR, { recursive: true })
writeFileSync(DEST, JSON.stringify(tiers, null, 2) + '\n', 'utf-8')

console.log(`Synced ${Object.keys(tiers.variants).length} tiers to ${DEST}`)
