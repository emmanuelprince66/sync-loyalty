import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useDeleteProgram, useEnrollments, useProgram, useProgramQr, useUpdateProgram } from '@/api/loyalty'
import { joinUrl as publicJoinUrl, joinUrlHere } from '@/lib/join-url'
import { formatRewardAmount } from '@/lib/reward-format'
import { useProgramEditor } from './useProgramEditor'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { usePermissions } from '@/hooks/usePermissions'
import { paths } from '@/routes/paths'
import { useBusinessDataStore } from '@/stores/business-data-store'
import { useCurrentBusiness } from '@/api/business'
import { str } from '@/api/http'

export type DetailTab = 'overview' | 'participants' | 'qr' | 'report'
export type ParticipantFilter = 'All' | 'Active' | 'Completed' | 'At risk'
export const PARTICIPANT_FILTERS: ParticipantFilter[] = ['All', 'Active', 'Completed', 'At risk']
const TAB_VALUES: DetailTab[] = ['overview', 'participants', 'qr', 'report']

/**
 * One programme, as sink's ProgramDetailPanel: Overview / Participants / QR code / Report tabs over
 * GET loyalty/programs/single/{id}/, plus pause, resume, edit (PATCH, sink's Edit form) and delete.
 */
export function useProgramDetail() {
  const { programId = '' } = useParams()
  const navigate = useNavigate()
  const money = useFormatMoney()
  const { canManageLoyalty } = usePermissions()
  const detail = useProgram(programId)
  const business = useCurrentBusiness()
  const members = useEnrollments(programId)
  const qr = useProgramQr(programId)
  const update = useUpdateProgram()
  const remove = useDeleteProgram()
  const editor = useProgramEditor()
  const [params] = useSearchParams()
  const businessName = useBusinessDataStore(state => state.businessData?.name) || 'Your business'
  // ?tab=participants (the list's View participants) or ?tab=qr opens straight on that tab.
  const [tab, setTab] = useState<DetailTab>(() => TAB_VALUES.find(value => value === params.get('tab')) ?? 'overview')
  const [filter, setFilter] = useState<ParticipantFilter>('All')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const d = detail.data
  const token = d?.token || qr.data?.token || ''
  const approvedDomain = business.data?.raw.custom_domain_approved === true ? str(business.data.raw.custom_domain) : undefined
  const joinUrl = publicJoinUrl(token, approvedDomain)
  const status = d?.program.status
  const participants = d?.participants ?? []
  const filtered = participants.filter(row => {
    const value = row.status.toUpperCase().replace(' ', '_')
    if (filter === 'All') return true
    if (filter === 'Active') return value === 'ACTIVE'
    if (filter === 'Completed') return value === 'COMPLETED' || value === 'REWARDED'
    return value === 'AT_RISK'
  })

  return {
    programId,
    isLoading: detail.isLoading,
    isError: detail.isError,
    retry: () => { void detail.refetch() },
    program: d?.program,
    businessName,
    tab, setTab,
    stats: d ? [
      { label: 'Members', value: d.enrolled.toLocaleString() },
      { label: 'Active now', value: d.active.toLocaleString() },
      { label: 'Completed', value: d.completed.toLocaleString() },
      { label: 'Completion rate', value: `${d.completionRate.toFixed(0)}%` },
      { label: 'Retention', value: `${d.retentionRate.toFixed(0)}%` },
      { label: 'Rewards given', value: formatRewardAmount(d.totalGivenOut, d.program.rewardType, money) },
    ] : [],
    cancelled: d?.cancelled ?? 0,
    // participants
    filter, setFilter,
    participants: filtered,
    participantCount: participants.length,
    members: members.data ?? [],
    membersLoading: members.isLoading,
    // QR
    joinUrl,
    previewUrl: joinUrlHere(token),
    // report
    report: d?.report ?? null,
    money,
    // actions
    canManage: canManageLoyalty,
    canPause: status === 'ACTIVE',
    canResume: status === 'PAUSED' || status === 'DRAFT',
    toggling: update.isPending,
    setLive: (live: boolean) => update.mutate({ id: programId, patch: { status: live ? 'ACTIVE' : 'PAUSED' } }, {
      onSuccess: () => toast.success(live ? 'Program is live' : 'Program paused'),
      onError: error => toast.error(errorMessage(error, 'Could not update the program.')),
    }),
    editor,
    openEdit: () => { if (d) editor.openEdit(d.program) },
    confirmDelete,
    askDelete: () => setConfirmDelete(true),
    cancelDelete: () => setConfirmDelete(false),
    deleting: remove.isPending,
    remove: () => remove.mutate(programId, {
      onSuccess: () => { toast.success('Program deleted'); navigate(paths.loyalty) },
      onError: error => toast.error(errorMessage(error, 'Could not delete the program.')),
    }),
    back: () => navigate(paths.loyalty),
  }
}

export type ProgramDetailModel = ReturnType<typeof useProgramDetail>
