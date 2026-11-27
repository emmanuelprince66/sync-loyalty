import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import { useApiDateRange } from '@/hooks/useApiDateRange'
import { useState } from 'react'
import { Gift, Percent, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { formatActivityDate } from '@/api/http'
import { useRedeemReward, useRewards, useRewardsSummary, type LoyaltyReward, type RewardStatus } from '@/api/loyalty'
import { Badge, Card, Chips, EmptyBlock, ErrorBlock, Metric, MetricSkeleton, MkButton, PageHeading } from '@/components/ui/mk'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { usePermissions } from '@/hooks/usePermissions'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

const FILTERS: { value: RewardStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'ISSUED', label: 'Ready' },
  { value: 'REDEEMED', label: 'Claimed' },
  { value: 'EXPIRED', label: 'Expired' },
]

const tone = (status: RewardStatus) => (status === 'ISSUED' ? 'lime' : status === 'REDEEMED' ? 'purple' : 'gray')
const label = (status: RewardStatus) => (status === 'ISSUED' ? 'Ready' : status === 'REDEEMED' ? 'Claimed' : status === 'EXPIRED' ? 'Expired' : 'Revoked')

/** Reward centre: issued rewards (loyalty/rewards) with redeem, and the rewards summary (loyalty/rewards/analytics). */
function useRewardsPage() {
  const money = useFormatMoney()
  const { canScan } = usePermissions()
  const [status, setStatus] = useState<RewardStatus | ''>('')
  // Rewards and their summary for a chosen period (start_date / end_date).
  const dates = useApiDateRange()
  const rewards = useRewards(status, dates.query)
  const summary = useRewardsSummary(dates.query)
  const redeem = useRedeemReward()
  const [pendingRedeem, setPendingRedeem] = useState<LoyaltyReward | null>(null)
  const s = summary.data
  return {
    dates,
    status, setStatus,
    rows: rewards.data ?? [],
    isLoading: rewards.isLoading,
    isError: rewards.isError,
    retry: () => { void rewards.refetch() },
    summaryLoading: summary.isLoading,
    programs: s?.programs ?? [],
    metrics: s ? [
      { label: 'Rewards unlocked', value: s.sent.toLocaleString(), detail: `${s.redeemed.toLocaleString()} claimed`, icon: Gift, dark: true },
      { label: 'Claim rate', value: s.sent ? `${((s.redeemed / s.sent) * 100).toFixed(1)}%` : '—', detail: `${s.retention.toFixed(0)}% retention`, icon: Percent },
      { label: 'Revenue retained', value: money(s.retainedRevenue), detail: `${s.roi.toFixed(0)}% ROI`, icon: TrendingUp },
    ] : [],
    canRedeem: canScan,
    redeemingId: redeem.isPending ? redeem.variables?.rewardId ?? '' : '',
    pendingRedeem,
    askRedeem: (reward: LoyaltyReward) => setPendingRedeem(reward),
    cancelRedeem: () => setPendingRedeem(null),
    confirmRedeem: () => { if (pendingRedeem) redeem.mutate({ rewardId: pendingRedeem.id, loyaltyCode: pendingRedeem.code }, {
      onSuccess: () => { toast.success('Reward redeemed'); setPendingRedeem(null) },
      onError: error => toast.error(errorMessage(error, 'Could not redeem this reward.')),
    }) },
  }
}

export default function RewardsPage() {
  const page = useRewardsPage()
  const pending = page.pendingRedeem
  return <div className="space-y-5">
    <PageHeading title="Reward centre" subtitle="Track unlocked, claimed, and expiring rewards." actions={<DateRangeFilter value={page.dates.range} onChange={page.dates.setRange} placeholder="All time" className="w-full sm:w-56"/>}/>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1">{page.summaryLoading ? Array.from({ length: 3 }, (_, index) => <MetricSkeleton key={index} dark={index === 0}/>) : page.metrics.map(metric => <Metric key={metric.label} {...metric}/>)}</div>
    <Chips options={FILTERS} value={page.status} onChange={page.setStatus}/>
    <Card className="overflow-hidden">
      {page.isError ? <ErrorBlock text="We couldn’t load rewards." onRetry={page.retry}/>
        : page.isLoading ? <TableSkeleton header={false} rows={5} columns={[{ thumbnail: true, flex: true, twoLine: true }, { pill: true, alignRight: true }]}/>
          : page.rows.length === 0 ? <EmptyBlock title="No rewards here" text="Rewards show up as members complete your programs."/>
            : page.rows.map(reward => <div key={reward.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 p-4 last:border-0">
              <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F0F0EC]"><Gift size={15}/></span><div className="min-w-0"><p className="truncate text-xs font-black">{reward.member} · {reward.value || reward.type}</p><p className="mt-1 truncate text-[9px] text-black/40">{reward.program} · {reward.code} · {formatActivityDate(reward.status === 'REDEEMED' ? reward.redeemedAt : reward.issuedAt)}</p></div></div>
              <div className="flex items-center gap-3"><Badge tone={tone(reward.status)}>{label(reward.status)}</Badge>{reward.status === 'ISSUED' && page.canRedeem && <MkButton onClick={() => page.askRedeem(reward)} loading={page.redeemingId === reward.id}>Redeem</MkButton>}</div>
            </div>)}
    </Card>
    {page.programs.length > 0 && <Card className="overflow-hidden">
      <div className="border-b border-black/10 p-5"><h3 className="text-sm font-black">By program</h3><p className="mt-1 text-[11px] text-black/45">What each program has given out and how many came back</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs">
        <thead className="bg-[#F7F7F4] text-[10px] uppercase tracking-wider text-black/45"><tr><th className="px-5 py-3">Program</th><th>Sent</th><th>Claimed</th><th>Cancelled</th><th>Retention</th></tr></thead>
        <tbody>{page.programs.map(row => <tr key={row.id || row.name} className="border-t border-black/10">
          <td className="px-5 py-3"><b className="block">{row.name}</b><span className="text-[10px] text-black/45">{[row.trigger, row.reward].filter(Boolean).join(' · ')}</span></td>
          <td>{row.sent.toLocaleString()}</td><td className="font-black">{row.redeemed.toLocaleString()}</td><td>{row.cancelled.toLocaleString()}</td>
          <td><span className="flex items-center gap-2"><span className="h-1.5 w-16 overflow-hidden rounded-full bg-black/10"><span className="block h-full bg-black" style={{ width: `${Math.min(100, row.retention)}%` }}/></span>{row.retention.toFixed(0)}%</span></td>
        </tr>)}</tbody>
      </table></div>
    </Card>}
    <ConfirmModal open={Boolean(pending)} onClose={page.cancelRedeem} onConfirm={page.confirmRedeem} loading={Boolean(pending) && page.redeemingId === pending?.id} kicker="Redeem reward" title="Hand over this reward?" confirmLabel="Redeem now">
      {pending && <>Mark <b className="text-black">{pending.value || pending.type.replace('_', ' ').toLowerCase()}</b> from <b className="text-black">{pending.program}</b> as used for <b className="text-black">{pending.member}</b> ({pending.code}). Do this when you give it to them; it can’t be undone.</>}
    </ConfirmModal>
  </div>
}
