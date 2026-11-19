import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { requireBusinessId, useCurrentBusinessId } from './business'
import { asRecord, listFrom, num, str, type UnknownRecord } from './http'

/**
 * Loyalty, on the same backend and payloads as sink-inventory (customers/growth):
 *  GET/POST   loyalty/programs/{business_id}/               list / create (sink wizard's buildPayload)
 *  GET/PATCH/DELETE loyalty/programs/single/{program_id}/   one programme
 *  GET        loyalty/programs/{program_id}/enrollments/    members and their progress
 *  GET        loyalty/programs/{program_id}/qr/             { token, qr_url } for the join QR
 *  GET        loyalty/dashboard/{business_id}/              headline numbers
 *  GET        loyalty/customers/{business_id}/?search&tier_id   members with code, tier, progress
 *  GET/POST   loyalty/tiers/{business_id}/, PATCH/DELETE loyalty/tiers/{tier_id}/ (as sink-inventory calls it)
 *  GET        loyalty/rewards/{business_id}/?status         issued rewards
 *  POST       loyalty/rewards/{reward_id}/redeem/           { loyalty_code, sale_id? }
 *  GET        loyalty/rewards/analytics/{business_id}/      rewards summary
 *  GET        loyalty/progress/{loyalty_code}/              public wallet for one member (no auth)
 *  GET/POST   loyalty/join/{token}/                         public join page (no auth)
 * Visits and spend are recorded by sales to the customer; there is no direct "record visit" endpoint.
 */

export const loyaltyKeys = { all: ['loyalty'] as const }

const useScope = () => {
  const { businessId } = useCurrentBusinessId()
  const scope = businessId ?? ''
  return { scope, enabled: Boolean(scope) }
}

// ─── Types ────────────────────────────────────────────────────────────────

export type ProgramStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED'
export type RewardType = 'POINTS' | 'WALLET_CREDIT' | 'PERCENTAGE' | 'FREE_ITEM' | 'FREE_SERVICE'
export type RuleMode = 'VISIT' | 'SPEND' | 'BOTH'

export type LoyaltyProgram = {
  id: string
  name: string
  description: string
  status: ProgramStatus
  rewardType: RewardType
  rewardValue: string
  rewardDescription: string
  triggerSummary: string
  rewardSummary: string
  enrolled: number
  active: number
  completions: number
  completionRate: number
  retentionRate: number
  startDate: string
  qrUrl: string
  visitTarget: number
  spendTarget: number
  /** The programme as the API sent it, for the edit form. */
  raw: UnknownRecord
}

export type ProgramMember = {
  id: string
  name: string
  code: string
  tier: string
  status: string
  visits: number
  spend: number
  streak: number
  progress: string
  remaining: string
  joinedAt: string
}

export type LoyaltyCustomer = { id: string; name: string; phone: string; code: string; tier: string; spend: number; visits: number; target: number }

export type LoyaltyDashboard = {
  members: number
  activeMembers: number
  rewardsIssued: number
  rewardsRedeemed: number
  rewardsPending: number
  redemptionRate: number
  averageSpend: number
  averageVisits: number
  returningRate: number
  campaignRevenue: number
  topStreaks: { id: string; name: string; initials: string; tier: string; streak: number }[]
}

export type RewardStatus = 'ISSUED' | 'REDEEMED' | 'EXPIRED' | 'REVOKED'
export type LoyaltyReward = { id: string; member: string; code: string; program: string; type: RewardType; value: string; status: RewardStatus; issuedAt: string; expiresAt: string; redeemedAt: string }

export type LoyaltyTier = { id: string; name: string; rank: number; metric: 'SPEND' | 'VISITS'; threshold: number; color: string }

export type MemberWallet = {
  name: string
  phone: string
  code: string
  program: string
  tier: string
  nextTier: string
  totalVisits: number
  totalSpend: number
  points: number
  progress: string
  statusLabel: string
  rewardDescription: string
  remaining: string
  visitCount: number
  streak: number
  availableRewards: { id: string; label: string }[]
  /** The member's own code to share with friends (LoyaltyJoin referral_code). */
  referralCode: string
  /** The customer record the card belongs to: a sale for them counts as a visit. */
  customerId: string
  email: string
  /** Rewards already used: label + when. */
  history: { id: string; label: string; date: string }[]
}

// ─── Mappers ──────────────────────────────────────────────────────────────

const conditionTarget = (conditions: unknown[], type: string) => num(asRecord(conditions.map(asRecord).find(c => str(c.type) === type)).threshold)

const mapProgram = (value: unknown): LoyaltyProgram => {
  const p = asRecord(value)
  const conditions = listFrom(p.conditions, [])
  return {
    id: str(p.id),
    name: str(p.name),
    description: str(p.description),
    status: (str(p.status) || 'DRAFT') as ProgramStatus,
    rewardType: (str(p.reward_type) || 'POINTS') as RewardType,
    rewardValue: str(p.reward_value),
    rewardDescription: str(p.reward_description),
    triggerSummary: str(p.trigger_summary),
    rewardSummary: str(p.reward_summary) || str(p.reward_description),
    enrolled: num(p.enrolled_count ?? p.participants),
    active: num(p.active_count),
    completions: num(p.completions_count ?? p.completions),
    completionRate: num(p.completion_rate),
    retentionRate: num(p.retention_rate),
    startDate: str(p.start_date),
    qrUrl: str(p.qr_url),
    visitTarget: conditionTarget(conditions, 'VISIT'),
    spendTarget: conditionTarget(conditions, 'SPEND'),
    raw: p,
  }
}

const mapMember = (value: unknown): ProgramMember => {
  const m = asRecord(value)
  return {
    id: str(m.id),
    name: str(m.member_name) || str(m.name),
    code: str(m.loyalty_code),
    tier: str(m.tier_name),
    status: str(m.status_label) || str(m.status),
    visits: num(m.visit_count ?? m.progress_current),
    spend: num(m.spend_total),
    streak: num(m.current_streak),
    progress: str(m.progress_display) || (m.progress_target ? `${num(m.progress_current)}/${num(m.progress_target)}` : ''),
    remaining: str(m.remaining_message),
    joinedAt: str(m.joined_at),
  }
}

const mapReward = (value: unknown): LoyaltyReward => {
  const r = asRecord(value)
  return {
    id: str(r.id), member: str(r.member_name), code: str(r.loyalty_code), program: str(r.program_name),
    type: (str(r.reward_type) || 'POINTS') as RewardType, value: str(r.value) || str(r.applied_value),
    status: (str(r.status) || 'ISSUED') as RewardStatus, issuedAt: str(r.issued_at), expiresAt: str(r.expires_at), redeemedAt: str(r.redeemed_at),
  }
}

const mapTier = (value: unknown): LoyaltyTier => {
  const t = asRecord(value)
  return { id: str(t.id), name: str(t.name), rank: num(t.rank), metric: str(t.qualifying_metric) === 'VISITS' ? 'VISITS' : 'SPEND', threshold: num(t.threshold), color: str(t.badge_color) || '#D7FF45' }
}

const mapWallet = (value: unknown): MemberWallet => {
  const w = asRecord(asRecord(value).data ?? value)
  const e = asRecord(w.enrollment)
  const next = asRecord(w.next_tier_info)
  return {
    name: str(w.name), phone: str(w.phone), code: str(w.loyalty_code), program: str(w.program) || str(e.program_name),
    tier: str(w.tier) || str(e.tier_name), nextTier: str(next.next_tier_progress_display),
    totalVisits: num(w.total_visits), totalSpend: num(w.total_spend), points: num(w.points_balance),
    progress: str(e.progress_display), statusLabel: str(e.status_label), rewardDescription: str(e.reward_description),
    remaining: str(e.remaining_message), visitCount: num(e.visit_count), streak: num(e.current_streak),
    referralCode: str(w.referral_code),
    customerId: str(w.customer_id),
    email: str(w.email),
    history: listFrom(w.redemption_history, []).map((item, index) => {
      const r = asRecord(item)
      return { id: str(r.id) || String(index), label: str(r.reward_summary) || str(r.reward_description) || str(r.description) || str(r.program_name) || 'Reward used', date: str(r.redeemed_at) || str(r.created_at) }
    }),
    availableRewards: listFrom(w.available_rewards, []).map(item => {
      // sink's rewardIdOf / rewardLabelOf: the id is what redeems it; reward_summary is the backend's own wording.
      const r = asRecord(item)
      return { id: str(r.id) || str(r.reward_id) || str(r.uuid), label: str(r.reward_summary) || str(r.reward_description) || str(r.description) || str(r.name) || str(e.reward_description) || 'Loyalty reward' }
    }).filter(item => item.id),
  }
}

// ─── Programmes ───────────────────────────────────────────────────────────

const getPrograms = async (scope: string): Promise<LoyaltyProgram[]> => {
  return listFrom(await apiRequest<unknown>(`loyalty/programs/${scope}/`), ['results', 'data', 'results.data']).map(mapProgram)
}

export const usePrograms = () => {
  const { scope, enabled } = useScope()
  return useQuery({ queryKey: [...loyaltyKeys.all, 'programs', scope], queryFn: () => getPrograms(scope), enabled })
}

/** One participant row from the detail's `participants` (sink's ParticipantsTab). */
export type Participant = { id: string; memberId: string; name: string; joinedAt: string; lastVisitAt: string; status: string; current: number; target: number }

/** The detail's `reward_cost_report` (sink's ReportTab). */
export type RewardReport = { sent: number; redeemed: number; cancelled: number; retainedRevenue: number; roi: number; afterFirst: number; afterSecond: number; afterThirdPlus: number }

export type ProgramDetail = { program: LoyaltyProgram; enrolled: number; active: number; completed: number; cancelled: number; completionRate: number; retentionRate: number; totalGivenOut: number; qrUrl: string; token: string; participants: Participant[]; report: RewardReport | null }

const getProgram = async (id: string): Promise<ProgramDetail> => {
  const raw = asRecord(await apiRequest<unknown>(`loyalty/programs/single/${id}/`))
  const info = raw.program_info ?? raw
  const overview = asRecord(raw.overview)
  const qr = asRecord(raw.qr_details)
  const program = mapProgram(info)
  return {
    program,
    enrolled: num(overview.total_enrolled) || program.enrolled,
    active: num(overview.active_now) || program.active,
    completed: num(overview.completed) || program.completions,
    completionRate: num(overview.completion_rate) || program.completionRate,
    retentionRate: num(overview.retention_rate) || program.retentionRate,
    cancelled: num(overview.cancelled),
    totalGivenOut: num(overview.total_given_out),
    qrUrl: str(qr.qr_url) || program.qrUrl,
    token: str(qr.token),
    participants: listFrom(raw.participants, []).map(value => {
      const row = asRecord(value)
      return { id: str(row.id), memberId: str(row.member_id), name: str(row.name), joinedAt: str(row.joined_at), lastVisitAt: str(row.last_qualifying_visit_at), status: str(row.status), current: num(row.progress_current), target: num(row.progress_target) }
    }),
    report: raw.reward_cost_report ? (() => {
      const r = asRecord(raw.reward_cost_report)
      const likely = asRecord(r.return_likelihood)
      return { sent: num(r.total_rewards_sent), redeemed: num(r.total_redeemed), cancelled: num(r.cancelled_forfeited), retainedRevenue: num(r.estimated_retained_revenue), roi: num(r.estimated_roi_percentage), afterFirst: num(likely.after_1st_reward), afterSecond: num(likely.after_2nd_reward), afterThirdPlus: num(likely.after_3rd_reward_plus) }
    })() : null,
  }
}

export const useProgram = (id: string | undefined) => useQuery({
  queryKey: [...loyaltyKeys.all, 'program', id],
  queryFn: () => getProgram(id as string),
  enabled: Boolean(id),
})

const getEnrollments = async (id: string): Promise<ProgramMember[]> => {
  return listFrom(await apiRequest<unknown>(`loyalty/programs/${id}/enrollments/`), ['results', 'data', 'results.data']).map(mapMember)
}

export const useEnrollments = (id: string | undefined) => useQuery({
  queryKey: [...loyaltyKeys.all, 'enrollments', id],
  queryFn: () => getEnrollments(id as string),
  enabled: Boolean(id),
})

/** The join QR for a programme: `{ token, qr_url }`. The public join page is /join/{token}. */
const getProgramQr = async (id: string) => {
  const raw = asRecord(await apiRequest<unknown>(`loyalty/programs/${id}/qr/`))
  const data = asRecord(raw.data ?? raw)
  return { token: str(data.token), qrUrl: str(data.qr_url) }
}

export const useProgramQr = (id: string | undefined) => useQuery({
  queryKey: [...loyaltyKeys.all, 'qr', id],
  queryFn: () => getProgramQr(id as string),
  enabled: Boolean(id),
  staleTime: 10 * 60 * 1000,
})

/** What the Create loyalty modal collects; turned into sink's create payload by `toProgramPayload`. */
export type ProgramInput = {
  name: string
  description: string
  ruleMode: RuleMode
  visits: number
  spendTarget: string
  minSpendPerVisit: string
  completionWindowDays: number | null
  visitWindowHours: number
  rewardType: RewardType
  rewardValue: string
  /** The product or service given away, for FREE_ITEM / FREE_SERVICE (sink's reward_product / reward_service). Empty when typed. */
  rewardItemId: string
  /** The giveaway in words (sink's reward_description), e.g. a typed item for a business with no inventory. */
  rewardDescription: string
  rewardStyle: 'CONTINUOUS' | 'ONE_TIME'
  timeoutAction: 'RESTART' | 'PAUSE' | 'EXPIRE'
  channel: 'SMS' | 'EMAIL' | 'BOTH'
  notifyWelcome: boolean
  notifyProgress: boolean
  notifyRewardReady: boolean
  notifyExpiry: boolean
}

/** sink-inventory's wizard buildPayload, field for field. */
export const toProgramPayload = (input: ProgramInput) => {
  const conditions: Record<string, unknown>[] = []
  if (input.ruleMode !== 'SPEND') {
    conditions.push({ type: 'VISIT', threshold: String(input.visits), ...(input.minSpendPerVisit.trim() ? { min_spend_per_visit: input.minSpendPerVisit.trim() } : {}) })
  }
  if (input.ruleMode !== 'VISIT') conditions.push({ type: 'SPEND', threshold: input.spendTarget.trim() || '0' })
  return {
    name: input.name.trim(),
    description: input.description.trim() || undefined,
    start_date: new Date().toISOString().slice(0, 10),
    // sink's wizard always creates a live programme.
    status: 'ACTIVE',
    reward_type: input.rewardType,
    reward_value: input.rewardValue.trim() || undefined,
    reward_product: input.rewardType === 'FREE_ITEM' && input.rewardItemId ? input.rewardItemId : undefined,
    reward_service: input.rewardType === 'FREE_SERVICE' && input.rewardItemId ? input.rewardItemId : undefined,
    reward_description: input.rewardDescription.trim() || undefined,
    communication_channel: input.channel,
    reward_style: input.rewardStyle,
    completion_window_days: input.completionWindowDays && input.completionWindowDays > 0 ? input.completionWindowDays : null,
    visit_window_hours: Math.max(0, input.visitWindowHours),
    timeout_action: input.timeoutAction,
    notify_welcome: input.notifyWelcome,
    notify_progress: input.notifyProgress,
    notify_reward_ready: input.notifyRewardReady,
    notify_expiry_reminder: input.notifyExpiry,
    condition_data: conditions,
  }
}

const createProgram = async (input: ProgramInput): Promise<LoyaltyProgram> => {
  const payload = toProgramPayload(input)
  return mapProgram(await apiRequest<unknown>(`loyalty/programs/${requireBusinessId()}/`, { method: 'POST', body: payload }))
}

const updateProgram = async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
  return apiRequest<unknown>(`loyalty/programs/single/${id}/`, { method: 'PATCH', body: patch })
}

const deleteProgram = async (id: string) => {
  return apiRequest<unknown>(`loyalty/programs/single/${id}/`, { method: 'DELETE' })
}

const useInvalidateLoyalty = () => {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: loyaltyKeys.all })
}

export const useCreateProgram = () => useMutation({ mutationFn: createProgram, onSuccess: useInvalidateLoyalty() })
export const useUpdateProgram = () => useMutation({ mutationFn: updateProgram, onSuccess: useInvalidateLoyalty() })
export const useDeleteProgram = () => useMutation({ mutationFn: deleteProgram, onSuccess: useInvalidateLoyalty() })

/** The fields sink's Edit Campaign form changes (useLoyaltyHook toPayload). */
export type ProgramEdit = {
  name: string
  description: string
  startDate: string
  endDate: string
  conditions: { type: string; threshold: string }[]
  rewardType: RewardType
  rewardValue: string
  rewardDescription: string
  rewardStyle: 'CONTINUOUS' | 'ONE_TIME'
  visitWindowHours: string
  completionWindowDays: string
  timeoutAction: 'RESTART' | 'PAUSE' | 'EXPIRE'
  notifyWelcome: boolean
  notifyProgress: boolean
  notifyRewardReady: boolean
  notifyExpiry: boolean
}

export const programEditFrom = (program: LoyaltyProgram): ProgramEdit => {
  const r = program.raw
  const conditions = listFrom(r.conditions, []).map(asRecord).map(c => ({ type: str(c.type), threshold: str(c.threshold) })).filter(c => c.type)
  return {
    name: program.name, description: program.description,
    startDate: str(r.start_date).slice(0, 10), endDate: str(r.end_date).slice(0, 10),
    conditions: conditions.length ? conditions : [{ type: 'VISIT', threshold: '' }],
    rewardType: program.rewardType, rewardValue: str(r.reward_value), rewardDescription: str(r.reward_description),
    rewardStyle: str(r.reward_style) === 'ONE_TIME' ? 'ONE_TIME' : 'CONTINUOUS',
    visitWindowHours: r.visit_window_hours === null || r.visit_window_hours === undefined ? '' : String(num(r.visit_window_hours)),
    completionWindowDays: num(r.completion_window_days) ? String(num(r.completion_window_days)) : '',
    timeoutAction: (['PAUSE', 'EXPIRE'].includes(str(r.timeout_action)) ? str(r.timeout_action) : 'RESTART') as ProgramEdit['timeoutAction'],
    notifyWelcome: r.notify_welcome !== false, notifyProgress: r.notify_progress !== false, notifyRewardReady: r.notify_reward_ready !== false, notifyExpiry: r.notify_expiry_reminder === true,
  }
}

/** sink's toPayload for an edit: PATCH loyalty/programs/single/{id}/. */
export const toEditPayload = (edit: ProgramEdit) => ({
  name: edit.name.trim(),
  description: edit.description.trim() || null,
  start_date: edit.startDate || new Date().toISOString().slice(0, 10),
  end_date: edit.endDate || null,
  reward_type: edit.rewardType,
  reward_value: edit.rewardValue || null,
  reward_description: edit.rewardDescription || null,
  reward_style: edit.rewardStyle,
  visit_window_hours: edit.visitWindowHours ? Number(edit.visitWindowHours) : undefined,
  completion_window_days: edit.completionWindowDays ? Number(edit.completionWindowDays) : null,
  timeout_action: edit.timeoutAction,
  notify_welcome: edit.notifyWelcome,
  notify_progress: edit.notifyProgress,
  notify_reward_ready: edit.notifyRewardReady,
  notify_expiry_reminder: edit.notifyExpiry,
  condition_data: edit.conditions.map(c => ({ type: c.type, threshold: c.threshold })),
})

// ─── Bonus periods (sink's BonusPeriods) ──────────────────────────────────
//  GET/POST loyalty/programs/{program_id}/bonus-periods/   PATCH/DELETE loyalty/bonus-periods/{id}/

export const WEEK_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const
export type WeekDay = typeof WEEK_DAYS[number]
export type BonusPeriod = { id: string; name: string; multiplier: number; days: WeekDay[]; startDate: string; endDate: string; active: boolean }
export type BonusPeriodInput = { name: string; multiplier: string; days: WeekDay[]; startDate: string; endDate: string }

const getBonusPeriods = async (programId: string): Promise<BonusPeriod[]> =>
  listFrom(await apiRequest<unknown>(`loyalty/programs/${programId}/bonus-periods/`), ['results', 'data', 'results.data']).map(value => {
    const b = asRecord(value)
    return { id: str(b.id), name: str(b.name), multiplier: num(b.multiplier) || 1, days: listFrom(b.days_of_week, []).map(day => str(day) as WeekDay), startDate: str(b.start_date), endDate: str(b.end_date), active: b.is_active !== false }
  })

export const useBonusPeriods = (programId: string | undefined) => useQuery({ queryKey: [...loyaltyKeys.all, 'bonus', programId], queryFn: () => getBonusPeriods(programId as string), enabled: Boolean(programId) })

const createBonusPeriod = ({ programId, input }: { programId: string; input: BonusPeriodInput }) =>
  apiRequest<unknown>(`loyalty/programs/${programId}/bonus-periods/`, { method: 'POST', body: { name: input.name.trim(), multiplier: input.multiplier, days_of_week: input.days, start_date: input.startDate || null, end_date: input.endDate || null } })
const updateBonusPeriod = ({ id, patch }: { id: string; patch: Record<string, unknown> }) => apiRequest<unknown>(`loyalty/bonus-periods/${id}/`, { method: 'PATCH', body: patch })
const deleteBonusPeriod = (id: string) => apiRequest<unknown>(`loyalty/bonus-periods/${id}/`, { method: 'DELETE' })

export const useCreateBonusPeriod = () => useMutation({ mutationFn: createBonusPeriod, onSuccess: useInvalidateLoyalty() })
export const useUpdateBonusPeriod = () => useMutation({ mutationFn: updateBonusPeriod, onSuccess: useInvalidateLoyalty() })
export const useDeleteBonusPeriod = () => useMutation({ mutationFn: deleteBonusPeriod, onSuccess: useInvalidateLoyalty() })

// ─── Dashboard and members ────────────────────────────────────────────────

const getDashboard = async (scope: string): Promise<LoyaltyDashboard> => {
  const raw = asRecord(await apiRequest<unknown>(`loyalty/dashboard/${scope}/`))
  const d = asRecord(raw.data ?? raw)
  return {
    members: num(d.members ?? d.total_participants),
    activeMembers: num(d.active_members),
    rewardsIssued: num(d.rewards_issued),
    rewardsRedeemed: num(d.rewards_redeemed),
    rewardsPending: num(d.rewards_pending),
    redemptionRate: num(d.redemption_rate),
    averageSpend: num(d.average_spend),
    averageVisits: num(d.average_visits),
    returningRate: num(d.returning_customer_rate),
    campaignRevenue: num(d.campaign_revenue),
    topStreaks: listFrom(d.top_streak_performers, []).map(item => {
      const t = asRecord(item)
      return { id: str(t.id), name: str(t.full_name), initials: str(t.initials), tier: str(t.tier), streak: num(t.streak_count) }
    }),
  }
}

export const useLoyaltyDashboard = () => {
  const { scope, enabled } = useScope()
  return useQuery({ queryKey: [...loyaltyKeys.all, 'dashboard', scope], queryFn: () => getDashboard(scope), enabled })
}

const getLoyaltyCustomers = async (scope: string, search: string): Promise<LoyaltyCustomer[]> => {
  const toCustomer = (value: unknown): LoyaltyCustomer => {
    const c = asRecord(value)
    return { id: str(c.id), name: str(c.name), phone: str(c.phone), code: str(c.loyalty_code), tier: str(c.tier_name), spend: num(c.total_spend), visits: num(c.progress_visits), target: num(c.progress_target) }
  }
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''
  return listFrom(await apiRequest<unknown>(`loyalty/customers/${scope}/${query}`), ['results', 'data', 'results.data']).map(toCustomer)
}

/** Loyalty members (code, tier, progress), searchable by name, phone or loyalty code. */
export const useLoyaltyCustomers = (search = '') => {
  const { scope, enabled } = useScope()
  return useQuery({ queryKey: [...loyaltyKeys.all, 'customers', scope, search], queryFn: () => getLoyaltyCustomers(scope, search), enabled, placeholderData: keepPreviousData })
}

// ─── Rewards ──────────────────────────────────────────────────────────────

const getRewards = async (scope: string, status: RewardStatus | ''): Promise<LoyaltyReward[]> => {
  return listFrom(await apiRequest<unknown>(`loyalty/rewards/${scope}/${status ? `?status=${status}` : ''}`), ['results', 'data', 'results.data']).map(mapReward)
}

export const useRewards = (status: RewardStatus | '' = '') => {
  const { scope, enabled } = useScope()
  return useQuery({ queryKey: [...loyaltyKeys.all, 'rewards', scope, status], queryFn: () => getRewards(scope, status), enabled, placeholderData: keepPreviousData })
}

export type ProgramBreakdown = { id: string; name: string; trigger: string; reward: string; sent: number; redeemed: number; cancelled: number; retention: number }
export type RewardsSummary = { sent: number; redeemed: number; cancelled: number; retainedRevenue: number; roi: number; retention: number; programs: ProgramBreakdown[] }

const getRewardsSummary = async (scope: string): Promise<RewardsSummary> => {
  const raw = asRecord(await apiRequest<unknown>(`loyalty/rewards/analytics/${scope}/`))
  const root = asRecord(raw.data ?? raw)
  const s = asRecord(root.summary)
  // sink's CustomerRewards: per_campaign_breakdown, one row per programme.
  const programs = listFrom(root.per_campaign_breakdown, []).map(item => {
    const p = asRecord(item)
    return { id: str(p.program_id), name: str(p.program_name), trigger: str(p.trigger_summary), reward: str(p.reward_summary), sent: num(p.total_sent), redeemed: num(p.total_redeemed), cancelled: num(p.cancelled), retention: num(p.retention_rate) }
  })
  return { sent: num(s.total_sent), redeemed: num(s.total_redeemed), cancelled: num(s.cancelled), retainedRevenue: num(s.est_retained_rev), roi: num(s.overall_roi_percentage), retention: num(s.avg_retention_rate), programs }
}

export const useRewardsSummary = () => {
  const { scope, enabled } = useScope()
  return useQuery({ queryKey: [...loyaltyKeys.all, 'rewards-summary', scope], queryFn: () => getRewardsSummary(scope), enabled })
}

/** Staff redeems an issued reward; the loyalty code must match the reward's owner (the backend's anti-fraud check). */
const redeemReward = async ({ rewardId, loyaltyCode }: { rewardId: string; loyaltyCode: string }) => {
  // sink's Point of Sale sends sale_id: null when a reward is redeemed outside a sale.
  return apiRequest<unknown>(`loyalty/rewards/${rewardId}/redeem/`, { method: 'POST', body: { loyalty_code: loyaltyCode, sale_id: null } })
}

export const useRedeemReward = () => useMutation({ mutationFn: redeemReward, onSuccess: useInvalidateLoyalty() })

// ─── Tiers ────────────────────────────────────────────────────────────────

const getTiers = async (scope: string): Promise<LoyaltyTier[]> => {
  return listFrom(await apiRequest<unknown>(`loyalty/tiers/${scope}/`), ['results', 'data', 'results.data']).map(mapTier).sort((a, b) => a.rank - b.rank)
}

export const useTiers = () => {
  const { scope, enabled } = useScope()
  return useQuery({ queryKey: [...loyaltyKeys.all, 'tiers', scope], queryFn: () => getTiers(scope), enabled })
}

export type TierInput = { name: string; rank: number; metric: 'SPEND' | 'VISITS'; threshold: string; color: string }
const tierBody = (input: TierInput) => ({ name: input.name.trim(), rank: input.rank, qualifying_metric: input.metric, threshold: input.threshold, badge_color: input.color })

const saveTier = async ({ id, input }: { id?: string; input: TierInput }) => {
  return id
    ? apiRequest<unknown>(`loyalty/tiers/${id}/`, { method: 'PATCH', body: tierBody(input) })
    : apiRequest<unknown>(`loyalty/tiers/${requireBusinessId()}/`, { method: 'POST', body: tierBody(input) })
}

const deleteTier = async (id: string) => {
  return apiRequest<unknown>(`loyalty/tiers/${id}/`, { method: 'DELETE' })
}

export const useSaveTier = () => useMutation({ mutationFn: saveTier, onSuccess: useInvalidateLoyalty() })
export const useDeleteTier = () => useMutation({ mutationFn: deleteTier, onSuccess: useInvalidateLoyalty() })

// ─── Public (customer-facing, no sign-in) ─────────────────────────────────

const getWallet = async (code: string): Promise<MemberWallet> => {
  return mapWallet(await apiRequest<unknown>(`loyalty/progress/${encodeURIComponent(code.trim())}/`, { auth: false }))
}

/** A member's wallet by loyalty code (the code on their card / QR). Public endpoint. */
export const useMemberWallet = (code: string) => useQuery({
  queryKey: [...loyaltyKeys.all, 'wallet', code.trim().toUpperCase()],
  queryFn: () => getWallet(code),
  enabled: code.trim().length >= 3,
  retry: false,
})

export type PublicProgram = { businessId: string; businessName: string; businessLogo: string; name: string; description: string; rewardSummary: string; triggerSummary: string }

const getPublicProgram = async (token: string): Promise<PublicProgram> => {
  const raw = asRecord(await apiRequest<unknown>(`loyalty/join/${token}/`, { auth: false }))
  const p = asRecord(raw.data ?? raw)
  return { businessId: str(p.business_id), businessName: str(p.business_name), businessLogo: str(p.business_logo), name: str(p.name), description: str(p.description), rewardSummary: str(p.reward_summary), triggerSummary: str(p.trigger_summary) }
}

export const usePublicProgram = (token: string | undefined) => useQuery({
  queryKey: [...loyaltyKeys.all, 'public', token],
  queryFn: () => getPublicProgram(token as string),
  enabled: Boolean(token),
  retry: false,
})

export type JoinInput = { fullName: string; phone: string; email: string; birthday: string; address: string }

/** POST loyalty/join/{token}/ (sink's LoyaltyJoin). Returns the new member's loyalty code. */
const joinProgram = async ({ token, input }: { token: string; input: JoinInput }) => {
  // sink's join form asks for one name field and splits it: first word, then the rest as the surname.
  const [first, ...rest] = input.fullName.trim().split(/\s+/)
  const body = { first_name: first, last_name: rest.join(' ') || first, phone: input.phone.trim(), email: input.email.trim() || undefined, birthday: input.birthday || null, address: input.address.trim() || undefined }
  const raw = asRecord(await apiRequest<unknown>(`loyalty/join/${token}/`, { method: 'POST', body, auth: false }))
  const data = asRecord(raw.data ?? raw)
  return { loyaltyCode: str(data.loyalty_code) || str(asRecord(data.enrollment).loyalty_code) }
}

export const useJoinProgram = () => useMutation({ mutationFn: joinProgram })

// ─── Reward items (FREE_ITEM / FREE_SERVICE) ──────────────────────────────

export type RewardItem = { id: string; name: string; price: number }

/** sink's InventoryPickerSheet: GET product/business/{id}/?type=PRODUCT|SERVICE&search&limit (raw materials left out). */
const getRewardItems = async (scope: string, type: 'PRODUCT' | 'SERVICE', search: string): Promise<RewardItem[]> => {
  const params = new URLSearchParams({ type, page: '1', limit: '20' })
  if (search.trim()) params.set('search', search.trim())
  if (type === 'PRODUCT') params.set('include_raw_material', 'false')
  return listFrom(await apiRequest<unknown>(`product/business/${scope}/?${params.toString()}`), ['results.data', 'data.results.data', 'results', 'data']).map(value => {
    const item = asRecord(value)
    return { id: str(item.id), name: str(item.name), price: num(item.selling_price ?? item.amount) }
  }).filter(item => item.id)
}

export const useRewardItems = (type: 'PRODUCT' | 'SERVICE', search: string, enabled: boolean) => {
  const { scope, enabled: ready } = useScope()
  return useQuery({ queryKey: [...loyaltyKeys.all, 'reward-items', scope, type, search], queryFn: () => getRewardItems(scope, type, search), enabled: ready && enabled, placeholderData: keepPreviousData })
}

// ─── Members (GET loyalty/members/{business_id}/) ─────────────────────────

export type LoyaltyMemberRow = { id: string; name: string; phone: string; referralCode: string; tier: string; visits: number; spend: number; birthday: string; gender: string; joinedAt: string }

export const useLoyaltyMembers = () => {
  const { scope, enabled } = useScope()
  return useQuery({
    queryKey: [...loyaltyKeys.all, 'members', scope],
    queryFn: async () => listFrom(await apiRequest<unknown>(`loyalty/members/${scope}/`), ['results', 'data', 'results.data']).map((value): LoyaltyMemberRow => {
      const m = asRecord(value)
      return { id: str(m.id), name: str(m.name), phone: str(m.phone), referralCode: str(m.referral_code), tier: str(m.tier_name), visits: num(m.total_visits), spend: num(m.total_spend), birthday: str(m.birthday), gender: str(m.gender), joinedAt: str(m.joined_at) }
    }),
    enabled,
  })
}
