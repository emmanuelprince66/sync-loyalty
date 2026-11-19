import type { ReferralProgramme } from '@/api/referrals'

/** "12 Mar 2026", or null when there is no date — sink's created/added date. */
export const shortDate = (iso: string) => {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * cap_progress arrives pre-formatted as "used/cap", so the used half is read from it rather than
 * recomputed — reward_cap alone does not say how many rewards have been paid.
 */
export const capUsage = (programme: ReferralProgramme) => {
  const used = Number(programme.capProgress.split('/')[0] ?? 0) || 0
  const cap = programme.rewardCap || 0
  return { used, cap, pct: cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0, label: programme.capProgress || `${used}/${cap}` }
}
