import { useMutation, useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { useCurrentBusiness, useCurrentBusinessId } from './business'
import { asRecord, listFrom, num, str, type UnknownRecord } from './http'

/**
 * Plans, as sink-inventory's Premium / Plan pages. One subscription per account, the same fields across
 * products; each app reads the ones that apply to it:
 *  GET  user/plans/                      every tier with its prices and gated fields (-1 = unlimited)
 *  GET  user/active_plan/?business_id=   the current plan and live usage; business_id only for a branch
 *                                        billed on its own (not the founding one)
 *  POST user/subscribe/                  { plan, duration: MONTHLY|QUARTERLY|BIANNUAL|ANNUAL, business_id? } → { payment_url }
 * Loyalty itself is not plan-gated: programmes, rewards, enrolments and QR codes are unlimited on every plan.
 * maheleKart only shows the shared fields (customer records, attendants, branches).
 */

export type PlanField = 'customers_count' | 'no_of_attendants' | 'no_of_business'
export type BillingPeriod = 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'ANNUAL'

export const BILLING_PERIODS: { value: BillingPeriod; label: string; priceKey: string; short: string }[] = [
  { value: 'MONTHLY', label: 'Monthly', priceKey: 'monthly', short: 'month' },
  { value: 'QUARTERLY', label: 'Quarterly', priceKey: 'quarterly', short: 'quarter' },
  { value: 'BIANNUAL', label: '6 months', priceKey: 'biannually', short: '6 months' },
  { value: 'ANNUAL', label: 'Yearly', priceKey: 'annually', short: 'year' },
]

/** Fields shared with the other Sync360 apps, in the backend's own wording of the matrix. */
export const SHARED_PLAN_FEATURES: { field: PlanField; label: string }[] = [
  { field: 'customers_count', label: 'Customer records' },
  { field: 'no_of_attendants', label: 'Attendants' },
  { field: 'no_of_business', label: 'Branches' },
]

/** What every plan includes for loyalty (not gated by the backend). */
export const LOYALTY_FEATURES = ['Loyalty programmes', 'Rewards', 'Member enrolments', 'QR codes'] as const

export type PlanLimits = Partial<Record<PlanField, number>>
export type Plan = { raw?: UnknownRecord; id: string; name: string; prices: Record<string, number>; limits: PlanLimits }
export type ActivePlan = {
  name: string
  /** The fields sink's Premium screen shows, straight from active_plan. */
  summary: PlanSummary
  endsAt: string
  amount: number
  duration: string
  limits: PlanLimits
  /** Live usage, where the backend reports it. */
  usage: PlanLimits
}

const limitsOf = (record: UnknownRecord): PlanLimits => {
  const limits: PlanLimits = {}
  for (const { field } of SHARED_PLAN_FEATURES) {
    const value = record[field]
    if (value !== undefined && value !== null && value !== '') limits[field] = num(value)
  }
  return limits
}

const mapPlan = (value: unknown): Plan => {
  const p = asRecord(value)
  return { raw: p, id: str(p.id), name: str(p.name), prices: Object.fromEntries(BILLING_PERIODS.map(period => [period.priceKey, num(p[period.priceKey])])), limits: limitsOf(p) }
}

/** Usage keys the active plan may carry for each field (the backend names them per counter; undocumented). */
const USAGE_KEYS: Record<PlanField, string[]> = {
  customers_count: ['customer_count'],
  // sink's Premium screen lists `attendants` under Features next to customer_count / business_count: a count.
  no_of_attendants: ['attendants', 'attendants_count', 'attendant_count'],
  no_of_business: ['business_count', 'businesses_count', 'branches_count', 'current_business'],
}

/** sink's Premium screen, field for field: what active_plan reports, shown as-is (-1 = ∞, missing = not shown). */
export type PlanSummary = {
  amount: number
  duration: string
  startDate: string
  endDate: string
  businesses: number | null
  attendants: number | null
  inventoryCount: number | null
  inventoryLimit: number | null
  customerCount: number | null
  customerLimit: number | null
  bookingsCount: number | null
  bookingsLimit: number | null
}
const maybeNum = (value: unknown) => (value === undefined || value === null || value === '' ? null : num(value))
export const summaryOf = (root: UnknownRecord): PlanSummary => ({
  amount: num(root.amount),
  duration: str(root.duration),
  startDate: str(root.start_date),
  endDate: str(root.end_date),
  businesses: maybeNum(root.business_count),
  attendants: maybeNum(root.attendants),
  inventoryCount: maybeNum(root.inventory_count),
  inventoryLimit: maybeNum(root.inventory_limit),
  customerCount: maybeNum(root.customer_count),
  customerLimit: maybeNum(root.customer_limit),
  bookingsCount: maybeNum(root.bookings_count),
  bookingsLimit: maybeNum(root.bookings_limit),
})

/**
 * user/active_plan/ is flat (sink's /api/premium passes it through as-is; its Premium screen reads):
 * amount, duration, end_date, custom_domain_allowed, usage counts (customer_count, business_count,
 * attendants, inventory_count, bookings_count) and some limits (customer_limit, inventory_limit,
 * bookings_limit). It has no plan name or id, so the tier is found by matching amount + duration against
 * user/plans/ prices, and that tier's limits fill the gaps (attendants, branches). active_plan's own limits win.
 */
const mapActivePlan = (value: unknown): ActivePlan => {
  const root = asRecord(asRecord(value).data ?? value)
  const usage = asRecord(root.usage)
  const used: PlanLimits = {}
  for (const [field, keys] of Object.entries(USAGE_KEYS) as [PlanField, string[]][]) {
    const key = keys.find(k => usage[k] !== undefined || root[k] !== undefined)
    if (key) used[field] = num(usage[key] ?? root[key])
  }
  return {
    summary: summaryOf(root),
    name: str(asRecord(root.plan).name) || str(root.plan_name),
    endsAt: str(root.end_date) || str(root.subscription_end_date),
    amount: num(root.amount),
    duration: str(root.duration).toUpperCase(),
    // customer_limit is the one shared limit active_plan sends (-1 = unlimited).
    limits: { ...limitsOf(asRecord(root.plan)), ...(root.customer_limit !== undefined && root.customer_limit !== null ? { customers_count: num(root.customer_limit) } : {}) },
    usage: used,
  }
}

/** A non-founding branch that hasn't subscribed is billed on its own (sink's branchSubscription). */
export const useBranchSubscription = () => {
  const business = useCurrentBusiness()
  const raw = business.data?.raw ?? {}
  const separatelyBilled = raw.is_founding === false
  return {
    planBusinessId: separatelyBilled ? str(raw.id) || business.data?.id || null : null,
    locked: separatelyBilled && raw.is_subscribed !== true,
    branchName: business.data?.name ?? '',
  }
}

export const usePlans = () => useQuery({
  queryKey: ['plans'],
  queryFn: async () => listFrom(await apiRequest<unknown>('user/plans/?page=1&limit=15'), ['results', 'data', 'results.data', 'data.results']).map(mapPlan),
  staleTime: 10 * 60 * 1000,
})

const useActivePlanRaw = () => {
  const { businessId } = useCurrentBusinessId()
  const { planBusinessId } = useBranchSubscription()
  return useQuery({
    queryKey: ['active-plan', businessId ?? '', planBusinessId ?? 'founding'],
    queryFn: async () => mapActivePlan(await apiRequest<unknown>(`user/active_plan/${planBusinessId ? `?business_id=${encodeURIComponent(planBusinessId)}` : ''}`)),
    retry: (count, error) => ![401, 404].includes((error as { status?: number })?.status ?? 0) && count < 1,
  })
}


/**
 * The tier the business is on. active_plan has no plan name or number (plan_id is the subscription's id)
 * and the amount can be ₦0 on a comped plan, so the price says nothing: the tier is the one whose
 * inventory_count and customers_count equal active_plan's inventory_limit and customer_limit. No match → none.
 */
export const matchPlan = (active: ActivePlan, plans: Plan[]) => {
  const { inventoryLimit, customerLimit } = active.summary
  if (inventoryLimit === null || customerLimit === null) return undefined
  const found = plans.filter(plan => plan.raw && num(plan.raw.inventory_count) === inventoryLimit && num(plan.raw.customers_count) === customerLimit)
  return found.length === 1 ? found[0] : undefined
}

/** The plan in force, filled in from its tier (see mapActivePlan). */
export const useActivePlan = () => {
  const query = useActivePlanRaw()
  const plans = usePlans()
  const raw = query.data
  const tier = raw ? matchPlan(raw, plans.data ?? []) : undefined
  const data: ActivePlan | undefined = raw && { ...raw, name: tier?.name || raw.name, limits: { ...(tier?.limits ?? {}), ...raw.limits } }
  return { data, isLoading: query.isLoading, isError: query.isError, error: query.error, refetch: query.refetch }
}

export const useSubscribe = () => useMutation({
  mutationFn: async ({ planId, period, businessId }: { planId: string; period: BillingPeriod; businessId: string | null }) => {
    const raw = asRecord(await apiRequest<unknown>('user/subscribe/', { method: 'POST', body: { plan: Number(planId) || planId, duration: period, ...(businessId ? { business_id: businessId } : {}) } }))
    const paymentUrl = str(asRecord(raw.data).payment_url) || str(raw.payment_url)
    if (!paymentUrl) throw new Error('No payment link came back. Please try again.')
    return { paymentUrl }
  },
})
