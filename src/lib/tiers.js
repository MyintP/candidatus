// Loads the 3 resume tiers (Architect / Engineer / Manager) from the
// gitignored src/data/resume-tiers.local.json, synced by `npm run sync-tiers`.
//
// Uses import.meta.glob rather than a static import so that a missing file
// (true on every fresh clone, including the CI checkout that builds the
// public GitHub Pages bundle) resolves to an empty object instead of a build
// error - Generate is gated off in that build anyway, but the build itself
// must still succeed.

const modules = import.meta.glob('../data/resume-tiers.local.json', { eager: true })
const path = Object.keys(modules)[0]
const loaded = path ? (modules[path].default ?? modules[path]) : null

export const tiersAvailable = Boolean(loaded)
export const tierContact = loaded?.contact ?? null
export const tierEducation = loaded?.education ?? []
export const tierMemberships = loaded?.memberships ?? ''
export const tiers = loaded?.variants ?? {}
export const tierNames = Object.keys(tiers)
