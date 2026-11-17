import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { programEditFrom, toEditPayload, useDeleteProgram, useEnrollments, useProgram, useProgramQr, useUpdateProgram, type ProgramEdit } from '@/api/loyalty'
import { useCardColour } from '@/api/storeTheme'
import { useClipboard } from '@/hooks/useClipboard'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { usePermissions } from '@/hooks/usePermissions'
import { joinPath, paths } from '@/routes/paths'

export type DetailTab = 'overview' | 'participants' | 'qr' | 'report'
export type ParticipantFilter = 'All' | 'Active' | 'Completed' | 'At risk'
export const PARTICIPANT_FILTERS: ParticipantFilter[] = ['All', 'Active', 'Completed', 'At risk']

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
  const members = useEnrollments(programId)
  const qr = useProgramQr(programId)
  const update = useUpdateProgram()
  const remove = useDeleteProgram()
  const { copy, copied } = useClipboard()
  const cardColour = useCardColour()
  const [tab, setTab] = useState<DetailTab>('overview')
  const [filter, setFilter] = useState<ParticipantFilter>('All')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editing, setEditing] = useState<ProgramEdit | null>(null)

  const d = detail.data
  const token = d?.token || qr.data?.token || ''
  const joinUrl = token ? `${window.location.origin}${joinPath(token)}` : ''
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
    colour: cardColour,
    tab, setTab,
    stats: d ? [
      { label: 'Members', value: d.enrolled.toLocaleString() },
      { label: 'Active now', value: d.active.toLocaleString() },
      { label: 'Completed', value: d.completed.toLocaleString() },
      { label: 'Completion rate', value: `${d.completionRate.toFixed(0)}%` },
      { label: 'Retention', value: `${d.retentionRate.toFixed(0)}%` },
      { label: 'Rewards given', value: money(d.totalGivenOut) },
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
    qrUrl: d?.qrUrl || qr.data?.qrUrl || '',
    copied,
    copyLink: () => { if (joinUrl) void copy(joinUrl) },
    openLanding: () => { if (joinUrl) window.open(joinUrl, '_blank', 'noopener') },
    // report
    report: d?.report ?? null,
    money,
    // actions
    canManage: canManageLoyalty,
    canPause: status === 'ACTIVE',
    canResume: status === 'PAUSED' || status === 'DRAFT',
    toggling: update.isPending && !editing,
    setLive: (live: boolean) => update.mutate({ id: programId, patch: { status: live ? 'ACTIVE' : 'PAUSED' } }, {
      onSuccess: () => toast.success(live ? 'Program is live' : 'Program paused'),
      onError: error => toast.error(errorMessage(error, 'Could not update the program.')),
    }),
    editing,
    openEdit: () => { if (d) setEditing(programEditFrom(d.program)) },
    changeEdit: (patch: Partial<ProgramEdit>) => setEditing(current => (current ? { ...current, ...patch } : current)),
    closeEdit: () => setEditing(null),
    saving: update.isPending && Boolean(editing),
    saveEdit: () => {
      if (!editing) return
      if (!editing.name.trim()) return toast.error('Give the program a name.')
      if (editing.conditions.some(condition => !(Number(condition.threshold) > 0))) return toast.error('Enter the target for each condition.')
      update.mutate({ id: programId, patch: toEditPayload(editing) }, {
        onSuccess: () => { toast.success('Program updated'); setEditing(null) },
        onError: error => toast.error(errorMessage(error, 'Could not save the changes.')),
      })
    },
    confirmDelete,
    askDelete: () => setConfirmDelete(true),
    cancelDelete: () => setConfirmDelete(false),
    deleting: remove.isPending,
    remove: () => remove.mutate(programId, {
      onSuccess: () => { toast.success('Program deleted'); navigate(paths.loyalty) },
      onError: error => toast.error(errorMessage(error, 'Could not delete the program.')),
    }),
    back: () => navigate(paths.loyalty),
    openCardStudio: () => navigate(`${paths.cardStudio}?program=${encodeURIComponent(programId)}`),
  }
}

export type ProgramDetailModel = ReturnType<typeof useProgramDetail>
