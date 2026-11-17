import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { requireBusinessId, useCurrentBusinessId } from './business'
import { asRecord, listFrom, num, str } from './http'

/**
 * Customer referral programmes, as sink-inventory's Referrals tab (api/customer-referral):
 *  GET/POST  referral/customer-programmes/?business_id=        list / create { name, reward_percentage, reward_cap, notify_sms, notify_email }
 *  GET       referral/customer-programmes/overview/?business_id=
 *  GET/PATCH referral/customer-programmes/{id}/                 PATCH also takes is_active
 *  GET/POST  referral/customer-programmes/{id}/participants/   POST { name, phone, email } → a code and link to share
 * A participant earns reward_percentage of each referred customer's purchase, up to reward_cap referrals.
 */

export const referralKeys = { all: ['referrals'] as const }

export type ReferralProgramme = { id: string; name: string; rewardPercentage: number; rewardCap: number; notifySms: boolean; notifyEmail: boolean; active: boolean; participants: number; referrals: number; totalPaid: number; capProgress: string; createdAt: string }
export type ReferralOverview = { programmes: number; participants: number; referrals: number; paidOut: number; conversion: string }
export type ReferralParticipant = { id: string; code: string; name: string; phone: string; link: string; referrals: number; paid: number; earned: number; createdAt: string }
export type ProgrammeInput = { name: string; rewardPercentage: string; rewardCap: string; notifySms: boolean; notifyEmail: boolean }

const useBusiness = () => {
  const { businessId } = useCurrentBusinessId()
  return { businessId: businessId ?? '', enabled: Boolean(businessId) }
}
const withBusiness = (path: string, businessId: string) => `${path}?business_id=${encodeURIComponent(businessId)}`
const unwrap = (value: unknown) => { const r = asRecord(value); return asRecord(r.data ?? r) }

const mapProgramme = (value: unknown): ReferralProgramme => {
  const p = asRecord(value)
  return {
    id: str(p.id), name: str(p.name), rewardPercentage: num(p.reward_percentage), rewardCap: num(p.reward_cap),
    notifySms: p.notify_sms !== false, notifyEmail: p.notify_email === true, active: p.is_active !== false,
    participants: num(p.participants_count), referrals: num(p.referrals_count), totalPaid: num(p.total_paid), capProgress: str(p.cap_progress), createdAt: str(p.created_at),
  }
}

export const useReferralProgrammes = () => {
  const { businessId, enabled } = useBusiness()
  return useQuery({
    queryKey: [...referralKeys.all, 'programmes', businessId],
    queryFn: async () => listFrom(await apiRequest<unknown>(withBusiness('referral/customer-programmes/', businessId)), ['results.data', 'data.results.data', 'results', 'data']).map(mapProgramme),
    enabled,
  })
}

export const useReferralOverview = () => {
  const { businessId, enabled } = useBusiness()
  return useQuery({
    queryKey: [...referralKeys.all, 'overview', businessId],
    queryFn: async (): Promise<ReferralOverview> => {
      const o = unwrap(await apiRequest<unknown>(withBusiness('referral/customer-programmes/overview/', businessId)))
      return { programmes: num(o.total_programmes), participants: num(o.total_participants), referrals: num(o.total_referrals), paidOut: num(o.total_paid_out), conversion: str(o.conversion_rate_formatted) || `${num(o.conversion_rate).toFixed(0)}%` }
    },
    enabled,
  })
}

export const useReferralParticipants = (programmeId: string | undefined, search: string) => useQuery({
  queryKey: [...referralKeys.all, 'participants', programmeId, search],
  queryFn: async () => {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''
    return listFrom(await apiRequest<unknown>(`referral/customer-programmes/${programmeId}/participants/${query}`), ['results.data', 'data.results.data', 'results', 'data']).map((value): ReferralParticipant => {
      const p = asRecord(value)
      return { id: str(p.id), code: str(p.code), name: str(p.customer_name), phone: str(p.phone), link: str(p.referral_link), referrals: num(p.referrals_count), paid: num(p.paid_count), earned: num(p.total_earned), createdAt: str(p.created_at) }
    })
  },
  enabled: Boolean(programmeId),
})

const useInvalidate = () => {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: referralKeys.all })
}

const programmeBody = (input: ProgrammeInput) => ({ name: input.name.trim(), reward_percentage: input.rewardPercentage, reward_cap: Number(input.rewardCap), notify_sms: input.notifySms, notify_email: input.notifyEmail })

export const useSaveProgramme = () => useMutation({
  mutationFn: ({ id, input }: { id?: string; input: ProgrammeInput }) => id
    ? apiRequest<unknown>(`referral/customer-programmes/${id}/`, { method: 'PATCH', body: programmeBody(input) })
    : apiRequest<unknown>(withBusiness('referral/customer-programmes/', requireBusinessId()), { method: 'POST', body: programmeBody(input) }),
  onSuccess: useInvalidate(),
})

export const useSetProgrammeActive = () => useMutation({
  mutationFn: ({ id, active }: { id: string; active: boolean }) => apiRequest<unknown>(`referral/customer-programmes/${id}/`, { method: 'PATCH', body: { is_active: active } }),
  onSuccess: useInvalidate(),
})

export const useAddParticipant = () => useMutation({
  mutationFn: ({ programmeId, name, phone, email }: { programmeId: string; name: string; phone: string; email: string }) =>
    apiRequest<unknown>(`referral/customer-programmes/${programmeId}/participants/`, { method: 'POST', body: { name: name.trim(), phone: phone.trim(), email: email.trim() || null } }),
  onSuccess: useInvalidate(),
})
