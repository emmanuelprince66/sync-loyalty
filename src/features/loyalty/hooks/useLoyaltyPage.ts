import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchProgram, usePrograms, type LoyaltyProgram, type ProgramStatus } from '@/api/loyalty'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { usePermissions } from '@/hooks/usePermissions'
import { joinUrlHere } from '@/lib/join-url'
import { programPath } from '@/routes/paths'
import { useUiStore } from '@/stores/ui-store'
import { useProgramEditor } from './useProgramEditor'

export type ProgramFilter = 'ALL' | ProgramStatus

export const PROGRAM_FILTERS: { value: ProgramFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Live' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PAUSED', label: 'Paused' },
]

export const statusLabel = (status: ProgramStatus) => (status === 'ACTIVE' ? 'LIVE' : status)

/**
 * Loyalty programmes list (loyalty/programs), with sink's campaign-card actions:
 * Edit (the edit form, in place), QR (Share campaign modal), Landing page (the public sign-up page)
 * and View participants (the programme, on its Participants tab).
 */
export function useLoyaltyPage() {
  const navigate = useNavigate()
  const client = useQueryClient()
  const money = useFormatMoney()
  const { canManageLoyalty } = usePermissions()
  const create = useUiStore(state => state.openCreateLoyalty)
  const editor = useProgramEditor()
  const [filter, setFilter] = useState<ProgramFilter>('ALL')
  const [sharing, setSharing] = useState<LoyaltyProgram | null>(null)
  const [landingFor, setLandingFor] = useState('')
  const programs = usePrograms()
  const rows = (programs.data ?? []).filter(program => filter === 'ALL' || program.status === filter)

  /**
   * The list carries no join token, so it's read from the programme detail on click (as sink does).
   * The tab is opened first, inside the click, so the browser doesn't block it as a pop-up once the
   * request comes back.
   */
  const openLanding = async (program: LoyaltyProgram) => {
    const tab = window.open('', '_blank')
    setLandingFor(program.id)
    try {
      const detail = await fetchProgram(client, program.id)
      const url = joinUrlHere(detail.token)
      if (!url) { tab?.close(); toast.error('This program has no sign-up page yet.'); return }
      if (tab) { tab.opener = null; tab.location.href = url } else window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      tab?.close()
      toast.error('Could not open the sign-up page.')
    } finally { setLandingFor('') }
  }

  return {
    filter,
    setFilter,
    programs: rows,
    total: programs.data?.length ?? 0,
    isLoading: programs.isLoading,
    isError: programs.isError,
    retry: () => { void programs.refetch() },
    money,
    canCreate: canManageLoyalty,
    canManage: canManageLoyalty,
    create,
    open: (id: string) => navigate(programPath(id)),
    viewParticipants: (id: string) => navigate(`${programPath(id)}?tab=participants`),
    editor,
    sharing,
    share: setSharing,
    closeShare: () => setSharing(null),
    landingFor,
    openLanding: (program: LoyaltyProgram) => { void openLanding(program) },
  }
}
