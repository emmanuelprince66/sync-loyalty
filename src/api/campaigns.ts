import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { fetchCurrentBusiness, requireBusinessId, useCurrentBusinessId } from './business'
import { asRecord, listFrom, num, str } from './http'

/**
 * Messages (SMS / email campaigns), same backend as sink-inventory's Campaign screens:
 *  GET/POST  campaign/{business_id}/          list / create { name, channel, title?, preview_text?, message, send_to_all, group_ids, segment_ids, customer_ids }
 *  POST      campaign/estimate/{business_id}/ { channel, send_to_all, group_ids, segment_ids, customer_ids }
 *            → { reachable_recipients, unreachable_count, credits_required, current_balance, balance_after, sufficient_credit }
 *  GET       campaign/group/{business_id}/    customer groups (default groups are created by the backend)
 *  GET       customer/segment/{business_id}/  segments (default segments are created by the backend)
 *  GET/POST  campaign/automation/{business_id}/ POST takes the whole list [{ type, message, channel, is_active }, …] (sink's CampaignSettings)
 *  POST      campaign/fund/{business_id}/     { amount } in naira, ₦10 = 1 unit → { payment_url } the user is sent to, as sink does
 *  GET       campaign/credit-usage/{business_id}/ ledger rows { title, usage_type_display, units_used, channel_display, recipient, created_at }
 *  Credit balance: business.message_credit (and message_credit_used this month).
 */

export const NAIRA_PER_UNIT = 10
/** FundCampaign.amount minimum in the API spec. */
export const MIN_FUND_AMOUNT = 100
export const campaignKeys = { all: ['campaigns'] as const }

const useScope = () => {
  const { businessId } = useCurrentBusinessId()
  const scope = businessId ?? ''
  return { scope, enabled: Boolean(scope) }
}

export type Channel = 'SMS' | 'EMAIL' | 'WHATSAPP'
export type Audience = { sendToAll: boolean; groupIds: string[]; segmentIds: string[] }

export type Campaign = { id: string; name: string; title: string; channel: Channel; message: string; recipients: number; createdAt: string; status: string }
export type Group = { id: string; name: string; count: number; members: { id: string; name: string; phone: string }[] }
export type Segment = { id: string; name: string; count: number }
export type Automation = { type: AutomationType; message: string; channel: Channel; active: boolean }
export type AutomationType = 'POINT-OF-PURCHASE' | 'FRIDAY' | 'MONDAY' | 'NEW-MONTH' | 'RETURNING-CUSTOMER' | 'INACTIVE' | 'BIRTHDAY'

/** The API's MarketAutomation types (sink's six, plus BIRTHDAY), with the design's wording. */
export const AUTOMATION_TYPES: { type: AutomationType; name: string; detail: string }[] = [
  { type: 'POINT-OF-PURCHASE', name: 'Thank you after purchase', detail: 'Sent after every recorded sale' },
  { type: 'NEW-MONTH', name: 'Happy new month', detail: 'Sent on the first day of every month' },
  { type: 'MONDAY', name: 'Happy new week', detail: 'Sent every Monday to active customers' },
  { type: 'FRIDAY', name: 'Weekend nudge', detail: 'Sent every Friday' },
  { type: 'RETURNING-CUSTOMER', name: 'Welcome back', detail: 'Sent when a customer comes back' },
  { type: 'INACTIVE', name: 'We miss you', detail: 'Sent when a customer has not visited in a while' },
  { type: 'BIRTHDAY', name: 'Happy birthday', detail: 'A personal message on their birthday' },
]


const mapCampaign = (value: unknown): Campaign => {
  const c = asRecord(value)
  return { id: str(c.id), name: str(c.name) || str(c.title), title: str(c.title), channel: (str(c.channel) || 'SMS') as Channel, message: str(c.message), recipients: num(c.user_count ?? c.user_counts ?? c.recipients), createdAt: str(c.created_at), status: str(c.status) }
}

// ─── Campaigns ────────────────────────────────────────────────────────────

const getCampaigns = async (scope: string) => {
  return listFrom(await apiRequest<unknown>(`campaign/${scope}/`), ['results', 'data', 'results.data']).map(mapCampaign)
}

export const useCampaigns = () => {
  const { scope, enabled } = useScope()
  return useQuery({ queryKey: [...campaignKeys.all, 'list', scope], queryFn: () => getCampaigns(scope), enabled })
}

const audienceBody = (audience: Audience) => ({ send_to_all: audience.sendToAll, group_ids: audience.sendToAll ? [] : audience.groupIds, segment_ids: audience.sendToAll ? [] : audience.segmentIds, customer_ids: [] })

export type Estimate = { recipients: number; unreachable: number; credits: number; balanceAfter: number; sufficient: boolean }

/** sink's CreditEstimate: what the backend says this audience reaches and costs. */
const estimate = async ({ channel, audience }: { channel: Channel; audience: Audience }): Promise<Estimate> => {
  const raw = asRecord(await apiRequest<unknown>(`campaign/estimate/${requireBusinessId()}/`, { method: 'POST', body: { channel, ...audienceBody(audience) } }))
  const d = asRecord(raw.data ?? raw)
  return { recipients: num(d.reachable_recipients), unreachable: num(d.unreachable_count), credits: num(d.credits_required), balanceAfter: num(d.balance_after), sufficient: d.sufficient_credit !== false }
}

export const useEstimate = () => useMutation({ mutationFn: estimate })

export type CampaignInput = { name: string; channel: Channel; title: string; message: string; audience: Audience }

const createCampaign = async (input: CampaignInput) => {
  // The API wants a title on every campaign; an SMS has no subject, so sink sends the name as its title.
  const body = { name: input.name.trim(), channel: input.channel, title: input.channel === 'EMAIL' ? input.title.trim() : input.name.trim(), ...(input.channel === 'EMAIL' ? { preview_text: input.message.slice(0, 90) } : {}), message: input.message.trim(), ...audienceBody(input.audience) }
  return apiRequest<unknown>(`campaign/${requireBusinessId()}/`, { method: 'POST', body })
}

const useInvalidate = () => {
  const client = useQueryClient()
  return () => { client.invalidateQueries({ queryKey: campaignKeys.all }); client.invalidateQueries({ queryKey: ['business'] }) }
}

export const useCreateCampaign = () => useMutation({ mutationFn: createCampaign, onSuccess: useInvalidate() })

// ─── Audience: groups and segments ────────────────────────────────────────

const getGroups = async (scope: string): Promise<Group[]> => {
  const rows = listFrom(await apiRequest<unknown>(`campaign/group/${scope}/`), ['results', 'data', 'results.data'])
  return rows.map(value => {
    const g = asRecord(value)
    const members = listFrom(g.customers, []).map(item => { const c = asRecord(item); return { id: str(c.id), name: str(c.name), phone: str(c.phone) } })
    return { id: str(g.id), name: str(g.name), count: num(g.user_count ?? g.user_counts) || members.length, members }
  })
}

const getSegments = async (scope: string): Promise<Segment[]> => {
  const rows = listFrom(await apiRequest<unknown>(`customer/segment/${scope}/`), ['results', 'data', 'results.data'])
  return rows.map(value => { const s = asRecord(value); return { id: str(s.id), name: str(s.name), count: num(s.customer_count ?? s.count ?? s.user_counts) } })
}

export const useAudiences = () => {
  const { scope, enabled } = useScope()
  const groups = useQuery({ queryKey: [...campaignKeys.all, 'groups', scope], queryFn: () => getGroups(scope), enabled })
  const segments = useQuery({ queryKey: [...campaignKeys.all, 'segments', scope], queryFn: () => getSegments(scope), enabled })
  return { groups: groups.data ?? [], segments: segments.data ?? [], isLoading: groups.isLoading || segments.isLoading, groupsLoading: groups.isLoading }
}

// ─── Automations ──────────────────────────────────────────────────────────

const getAutomations = async (scope: string): Promise<Automation[]> => {
  const rows = listFrom(await apiRequest<unknown>(`campaign/automation/${scope}/`), ['results', 'data', 'results.data'])
  return rows.map(value => { const a = asRecord(value); return { type: str(a.type) as AutomationType, message: str(a.message), channel: (str(a.channel) || 'SMS') as Channel, active: a.is_active === true } })
}

export const useAutomations = () => {
  const { scope, enabled } = useScope()
  return useQuery({ queryKey: [...campaignKeys.all, 'automations', scope], queryFn: () => getAutomations(scope), enabled })
}

/** Saves every automation at once, the way sink's Campaign settings does: a list with one entry per type. */
const saveAutomations = async (rows: Automation[]) => {
  const body = rows.map(row => ({ type: row.type, message: row.message.trim(), channel: row.channel, is_active: row.active }))
  return apiRequest<unknown>(`campaign/automation/${requireBusinessId()}/`, { method: 'POST', body })
}

export const useSaveAutomations = () => useMutation({ mutationFn: saveAutomations, onSuccess: useInvalidate() })

// ─── Credits ──────────────────────────────────────────────────────────────

export type Credits = { balance: number; usedThisMonth: number }

const getCredits = async (): Promise<Credits> => {
  const business = await fetchCurrentBusiness()
  return { balance: num(business.raw.message_credit), usedThisMonth: num(business.raw.message_credit_used) }
}

export const useCredits = () => {
  const { scope, enabled } = useScope()
  return useQuery({ queryKey: [...campaignKeys.all, 'credits', scope], queryFn: getCredits, enabled })
}

export type CreditUsage = { id: string; label: string; kind: string; topUp: boolean; units: number; channel: string; recipient: string; date: string }

/** sink's UnitUsage ledger. CREDIT_TOPUP rows add credit; every other usage_type spends it. */
const getUsage = async (scope: string): Promise<CreditUsage[]> => {
  const rows = listFrom(await apiRequest<unknown>(`campaign/credit-usage/${scope}/`), ['results.data', 'data.results.data', 'results', 'data'])
  return rows.map(value => {
    const u = asRecord(value)
    return { id: str(u.id), label: str(u.title) || 'Credit activity', kind: str(u.usage_type_display) || str(u.usage_type), topUp: str(u.usage_type) === 'CREDIT_TOPUP', units: num(u.units_used), channel: str(u.channel_display), recipient: str(u.recipient), date: str(u.created_at) }
  })
}

export const useCreditUsage = () => {
  const { scope, enabled } = useScope()
  return useQuery({ queryKey: [...campaignKeys.all, 'usage', scope], queryFn: () => getUsage(scope), enabled })
}

/** Starts a credit purchase (amount in naira, ₦10 per unit). Resolves to the payment page the user is sent to, as in sink. */
const fundCredits = async (amount: number) => {
  const raw = asRecord(await apiRequest<unknown>(`campaign/fund/${requireBusinessId()}/`, { method: 'POST', body: { amount } }))
  const paymentUrl = str(asRecord(raw.data).payment_url) || str(raw.payment_url)
  if (!paymentUrl) throw new Error('No payment link came back. Please try again.')
  return { paymentUrl, message: str(raw.message) }
}

export const useFundCredits = () => useMutation({ mutationFn: fundCredits, onSuccess: useInvalidate() })

// ─── Campaign edit / delete (sink: campaign/single/{id}/) ─────────────────

export const useUpdateCampaign = () => useMutation({
  mutationFn: ({ id, input }: { id: string; input: { name: string; title: string; message: string } }) =>
    apiRequest<unknown>(`campaign/single/${id}/`, { method: 'PATCH', body: { name: input.name.trim(), title: input.title.trim() || input.name.trim(), message: input.message.trim() } }),
  onSuccess: useInvalidate(),
})

export const useDeleteCampaign = () => useMutation({
  mutationFn: (id: string) => apiRequest<unknown>(`campaign/single/${id}/`, { method: 'DELETE' }),
  onSuccess: useInvalidate(),
})

// ─── Customer groups (sink: campaign/group/{business_id}/, campaign/single_group/{id}/) ──

export type GroupInput = { name: string; customerIds: string[] }

export const useSaveGroup = () => useMutation({
  mutationFn: ({ id, input }: { id?: string; input: GroupInput }) => {
    const body = { name: input.name.trim(), customer_ids: input.customerIds }
    return id
      ? apiRequest<unknown>(`campaign/single_group/${id}/`, { method: 'PATCH', body })
      : apiRequest<unknown>(`campaign/group/${requireBusinessId()}/`, { method: 'POST', body })
  },
  onSuccess: useInvalidate(),
})

export const useDeleteGroup = () => useMutation({
  mutationFn: (id: string) => apiRequest<unknown>(`campaign/single_group/${id}/`, { method: 'DELETE' }),
  onSuccess: useInvalidate(),
})

// ─── Sender ID (sink: business.sender_id, POST campaign/sender_id/{business_id}/) ──

export const useSenderId = () => {
  const { scope, enabled } = useScope()
  return useQuery({ queryKey: [...campaignKeys.all, 'sender', scope], queryFn: async () => str((await fetchCurrentBusiness()).raw.sender_id), enabled })
}

export const useSaveSenderId = () => useMutation({
  mutationFn: (senderId: string) => apiRequest<unknown>(`campaign/sender_id/${requireBusinessId()}/`, { method: 'POST', body: { sender_id: senderId.trim() } }),
  onSuccess: useInvalidate(),
})
