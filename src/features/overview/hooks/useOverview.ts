import { useNavigate } from 'react-router'
import { useLoyaltyDashboard, usePrograms } from '@/api/loyalty'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { usePermissions } from '@/hooks/usePermissions'
import { paths, programPath } from '@/routes/paths'
import { useUiStore } from '@/stores/ui-store'

const compact = (value: number) => (value >= 1_000_000 ? `${(value / 1_000_000).toFixed(2)}m` : value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value)))

/** Overview: loyalty dashboard numbers (loyalty/dashboard) and the live programmes. */
export function useOverview() {
  const navigate = useNavigate()
  const money = useFormatMoney()
  const { canManageLoyalty } = usePermissions()
  const openCreate = useUiStore(state => state.openCreateLoyalty)
  const dashboard = useLoyaltyDashboard()
  const programs = usePrograms()
  const d = dashboard.data
  const live = (programs.data ?? []).filter(program => program.status === 'ACTIVE')

  return {
    isLoading: dashboard.isLoading,
    isError: dashboard.isError,
    retry: () => { void dashboard.refetch() },
    metrics: d ? [
      { label: 'Active members', value: d.activeMembers.toLocaleString(), detail: `${d.members.toLocaleString()} total`, dark: true, icon: 'users' as const },
      { label: 'Return visit rate', value: `${d.returningRate.toFixed(1)}%`, detail: `${d.averageVisits.toFixed(1)} visits avg`, icon: 'trend' as const },
      { label: 'Revenue influenced', value: `₦${compact(d.campaignRevenue)}`, detail: `${money(d.averageSpend)} avg spend`, icon: 'money' as const },
      { label: 'Rewards claimed', value: d.rewardsRedeemed.toLocaleString(), detail: `${d.rewardsPending.toLocaleString()} waiting`, icon: 'gift' as const },
    ] : [],
    topStreaks: d?.topStreaks ?? [],
    insight: d ? { redemption: d.redemptionRate, pending: d.rewardsPending } : null,
    programsLoading: programs.isLoading,
    livePrograms: live.slice(0, 3),
    canCreate: canManageLoyalty,
    create: openCreate,
    viewPrograms: () => navigate(paths.loyalty),
    openProgram: (id: string) => navigate(programPath(id)),
    openRewards: () => navigate(paths.rewards),
  }
}
