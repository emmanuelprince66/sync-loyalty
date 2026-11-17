import { useState } from 'react'
import { useNavigate } from 'react-router'
import { usePrograms, type ProgramStatus } from '@/api/loyalty'
import { usePermissions } from '@/hooks/usePermissions'
import { paths, programPath } from '@/routes/paths'
import { useUiStore } from '@/stores/ui-store'

export type ProgramFilter = 'ALL' | ProgramStatus

export const PROGRAM_FILTERS: { value: ProgramFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Live' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PAUSED', label: 'Paused' },
]

export const statusLabel = (status: ProgramStatus) => (status === 'ACTIVE' ? 'LIVE' : status)

/** Loyalty programmes list (loyalty/programs) with the design's status chips. */
export function useLoyaltyPage() {
  const navigate = useNavigate()
  const { canManageLoyalty } = usePermissions()
  const create = useUiStore(state => state.openCreateLoyalty)
  const [filter, setFilter] = useState<ProgramFilter>('ALL')
  const programs = usePrograms()
  const rows = (programs.data ?? []).filter(program => filter === 'ALL' || program.status === filter)
  return {
    filter,
    setFilter,
    programs: rows,
    total: programs.data?.length ?? 0,
    isLoading: programs.isLoading,
    isError: programs.isError,
    retry: () => { void programs.refetch() },
    canCreate: canManageLoyalty,
    create,
    open: (id: string) => navigate(programPath(id)),
    openCardStudio: (id: string) => navigate(`${paths.cardStudio}?program=${encodeURIComponent(id)}`),
  }
}
