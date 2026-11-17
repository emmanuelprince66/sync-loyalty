import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { requireBusinessId, useCurrentBusinessId } from './business'
import { asRecord, listFrom, num, str, type UnknownRecord } from './http'

/**
 * Customer segments, as sink-inventory's Segments tab:
 *  GET/POST     customer/segment/{business_id}/         (default segments are seeded by the backend on first GET)
 *  PATCH/DELETE customer/segment/single/{segment_id}/   (default segments can be edited, not deleted)
 *  GET          customer/segment/customers/{segment_id}/
 * A segment is a flat rule map (`conditions`, e.g. { purchases: 4, within_days: 30 }) plus ALL / ANY matching.
 */

export const segmentKeys = { all: ['segments'] as const }

export type MatchType = 'ALL' | 'ANY'
export type Segment = {
  id: string
  name: string
  type: string
  matchType: MatchType
  isDefault: boolean
  active: boolean
  conditions: Record<string, number | string>
  customers: number
  revenue: number
  repeatRate: number
  avgSpend: number
  windowStart: string
  windowEnd: string
}
export type SegmentCustomer = { id: string; name: string; phone: string; email: string; totalSpend: number; purchases: number }
export type SegmentInput = { name: string; type: string; matchType: MatchType; conditions: Record<string, number | string> }

/** sink's SEGMENT_TYPES. */
export const SEGMENT_TYPES = [
  { value: 'CUSTOM', label: 'Custom' },
  { value: 'VIP_CUSTOMERS', label: 'VIP customers' },
  { value: 'FREQUENT_BUYERS', label: 'Frequent buyers' },
  { value: 'NEW_CUSTOMERS', label: 'New customers' },
  { value: 'AT_RISK', label: 'At risk' },
  { value: 'INACTIVE_CUSTOMERS', label: 'Inactive customers' },
  { value: 'REGULAR_BUYERS', label: 'Regular buyers' },
]

/** sink's CONDITION_FIELDS. Unknown keys from the backend still round-trip. */
export const CONDITION_FIELDS: { key: string; label: string; suffix?: string }[] = [
  { key: 'purchases', label: 'Number of purchases' },
  { key: 'within_days', label: 'Within the last', suffix: 'days' },
  { key: 'no_purchase_days', label: 'No purchase for', suffix: 'days' },
  { key: 'min_spend', label: 'Minimum total spend', suffix: '₦' },
  { key: 'visits', label: 'Number of visits' },
  { key: 'birthday_window_days', label: 'Birthday within the next', suffix: 'days' },
]
export const conditionLabel = (key: string) => CONDITION_FIELDS.find(field => field.key === key)?.label ?? key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())

const useScope = () => {
  const { businessId } = useCurrentBusinessId()
  return { scope: businessId ?? '', enabled: Boolean(businessId) }
}

const mapSegment = (value: unknown): Segment => {
  const s = asRecord(value)
  const conditions = Object.fromEntries(Object.entries(asRecord(s.conditions)).map(([key, raw]) => [key, typeof raw === 'number' ? raw : str(raw)]))
  return {
    id: str(s.id), name: str(s.name), type: str(s.segment_type) || 'CUSTOM', matchType: str(s.match_type) === 'ANY' ? 'ANY' : 'ALL',
    isDefault: s.is_default === true, active: s.is_active !== false, conditions,
    customers: num(s.customer_count), revenue: num(s.revenue), repeatRate: num(s.repeat_rate), avgSpend: num(s.avg_spend),
    windowStart: str(s.window_start_date), windowEnd: str(s.window_end_date),
  }
}

export const useSegments = () => {
  const { scope, enabled } = useScope()
  return useQuery({
    queryKey: [...segmentKeys.all, scope],
    queryFn: async () => listFrom(await apiRequest<unknown>(`customer/segment/${scope}/`), ['results', 'data', 'results.data']).map(mapSegment),
    enabled,
  })
}

export const useSegmentCustomers = (segmentId: string | undefined) => useQuery({
  queryKey: [...segmentKeys.all, 'customers', segmentId],
  queryFn: async () => listFrom(await apiRequest<unknown>(`customer/segment/customers/${segmentId}/`), ['results.data', 'data.results.data', 'results', 'data']).map((value): SegmentCustomer => {
    const c = asRecord(value)
    return { id: str(c.id), name: str(c.name), phone: str(c.phone), email: str(c.email), totalSpend: num(c.total_sales ?? c.total_spend), purchases: num(c.sales_count) }
  }),
  enabled: Boolean(segmentId),
  placeholderData: keepPreviousData,
})

const body = (input: SegmentInput): UnknownRecord => ({ name: input.name.trim(), segment_type: input.type, match_type: input.matchType, is_active: true, conditions: input.conditions })

const useInvalidate = () => {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: segmentKeys.all })
}

export const useSaveSegment = () => useMutation({
  mutationFn: ({ id, input }: { id?: string; input: SegmentInput }) => id
    ? apiRequest<unknown>(`customer/segment/single/${id}/`, { method: 'PATCH', body: body(input) })
    : apiRequest<unknown>(`customer/segment/${requireBusinessId()}/`, { method: 'POST', body: body(input) }),
  onSuccess: useInvalidate(),
})

export const useDeleteSegment = () => useMutation({
  mutationFn: (id: string) => apiRequest<unknown>(`customer/segment/single/${id}/`, { method: 'DELETE' }),
  onSuccess: useInvalidate(),
})
