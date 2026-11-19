import { useRef, useState, type ReactNode } from 'react'
import { Check, Crown, Infinity as InfinityIcon, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { BILLING_PERIODS, SHARED_PLAN_FEATURES, matchPlan, useActivePlan, useBranchSubscription, usePlans, useSubscribe, type BillingPeriod, type Plan } from '@/api/plan'
import { CardGridSkeleton } from '@/components/ui/CardSkeleton'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Badge, Card, Chips, ErrorBlock, MkButton, PageHeading } from '@/components/ui/mk'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { cn } from '@/lib/cn'

/** As sink: only a real -1 is unlimited (∞); a missing value is "—"; any other number is shown as-is. */
const limitText = (value: number | null | undefined) => (value === undefined || value === null ? '—' : value === -1 ? '∞' : value.toLocaleString())
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()
const naira = (amount: number) => `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const DURATION_LABEL: Record<string, string> = { ANNUAL: 'annual', MONTHLY: 'monthly', QUARTERLY: 'quarterly', BIANNUAL: '6 months' }
const durationLabel = (duration: string) => DURATION_LABEL[duration.toUpperCase()] ?? duration.toLowerCase()

/** Plan & billing, showing sink's Premium data (active_plan as-is) in maheleKart's layout; then the plans. */
function usePlanPage() {
  const money = useFormatMoney()
  const plans = usePlans()
  const active = useActivePlan()
  const branch = useBranchSubscription()
  const subscribe = useSubscribe()
  const [period, setPeriod] = useState<BillingPeriod>('MONTHLY')
  const [pending, setPending] = useState<Plan | null>(null)
  const billing = BILLING_PERIODS.find(item => item.value === period) ?? BILLING_PERIODS[0]
  // The tier name only when active_plan's limits match exactly one plan (active_plan carries no name).
  const tierName = active.data ? matchPlan(active.data, plans.data ?? [])?.name ?? '' : ''
  return {
    money, plans, active, branch, period, setPeriod, billing, pending, tierName,
    current: active.data,
    subscribing: subscribe.isPending,
    choose: (plan: Plan) => setPending(plan),
    cancel: () => { if (!subscribe.isPending) setPending(null) },
    confirm: () => {
      if (!pending) return
      subscribe.mutate({ planId: pending.id, period, businessId: branch.planBusinessId }, {
        onSuccess: ({ paymentUrl }) => { window.location.href = paymentUrl },
        onError: error => { toast.error(errorMessage(error, 'Could not start the subscription.')); setPending(null) },
      })
    },
  }
}

function Tile({ label, value }: { label: string; value: ReactNode }) {
  return <div className="min-w-0 border border-black/10 bg-[#F6F6F2] p-3">
    <p className="truncate text-[10px] font-extrabold uppercase tracking-wider text-black/45">{label}</p>
    <p className="mt-1 truncate text-lg font-black">{value}</p>
  </div>
}

function Usage({ label, used, limit }: { label: string; used: number | null; limit: number | null }) {
  const pct = used !== null && limit !== null && limit > 0 ? Math.min(100, (used / limit) * 100) : 0
  return <div className="min-w-0">
    <div className="flex items-baseline justify-between gap-3 text-xs"><span className="min-w-0 truncate font-semibold text-white/60">{label}</span><b className="shrink-0 font-black">{limitText(used)} / {limitText(limit)}</b></div>
    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/15"><span className={cn('block h-full rounded-full', pct >= 100 ? 'bg-[#FF6B3D]' : 'bg-[#D7FF45]')} style={{ width: `${pct}%` }}/></span>
  </div>
}

export default function PlanPage() {
  const s = usePlanPage()
  const { current, active, branch, tierName } = s
  const summary = current?.summary
  const pendingPrice = s.pending?.prices[s.billing.priceKey] ?? 0
  const plansRef = useRef<HTMLDivElement>(null)

  return <div className="space-y-5">
    <PageHeading title="Plan & billing" subtitle="One subscription covers all your Sync360 apps."/>

    {branch.locked && <Card className="flex items-start gap-3 border-[#FF6B3D]/40 bg-[#FFF1EC] p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FF6B3D] text-white"><Lock size={15}/></span>
      <div className="min-w-0"><p className="text-sm font-black">{branch.branchName || 'This branch'} needs its own plan</p><p className="mt-1 text-xs text-black/55">Only your first business is covered by your account plan. Choose a plan below to cover this branch.</p></div>
    </Card>}

    {active.isError ? <Card className="p-5"><ErrorBlock text={errorMessage(active.error, 'We couldn’t load your plan.')} onRetry={() => void active.refetch()}/></Card>
      : active.isLoading || !summary ? <CardGridSkeleton count={2} footer={0} gridClassName="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"/>
        : <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="min-w-0 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black text-[#D7FF45]"><Crown size={18}/></span>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-extrabold uppercase tracking-wider text-black/45">Current plan{tierName ? ` · ${tierName}` : ''}</p>
                  <p className="mt-0.5 break-words text-2xl font-black tracking-[-.04em]">{naira(summary.amount)}{summary.duration && <span className="text-xs font-bold tracking-normal text-black/45"> / {durationLabel(summary.duration)}</span>}</p>
                </div>
              </div>
              <Badge>Active</Badge>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-black/55">Renewal date: <b className="text-black">{summary.endDate || '—'}</b></p>
              <MkButton secondary onClick={() => plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>View subscriptions</MkButton>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              <Tile label="Users" value={limitText(summary.customerCount)}/>
              <Tile label="Businesses" value={limitText(summary.businesses ?? 0)}/>
              <Tile label="Attendants" value={limitText(summary.attendants ?? 0)}/>
              <Tile label="Inventory limit" value={limitText(summary.inventoryLimit)}/>
              <Tile label="Customer limit" value={limitText(summary.customerLimit)}/>
            </div>
          </Card>

          <Card className="min-w-0 bg-black p-5 text-white">
            <h3 className="text-sm font-black">Usage summary</h3>
            <div className="mt-4 space-y-5">
              <Usage label="Inventory used" used={summary.inventoryCount} limit={summary.inventoryLimit}/>
              <Usage label="Customers added" used={summary.customerCount} limit={summary.customerLimit}/>
            </div>
          </Card>
        </div>}

    <div className="flex min-w-0 items-center gap-2 bg-black px-4 py-3 text-white">
      <InfinityIcon size={16} className="shrink-0 text-[#D7FF45]"/>
      <p className="min-w-0 text-xs font-bold"><span className="text-[#D7FF45]">Loyalty: unlimited on every plan</span><span className="text-white/55"> · programmes, rewards, enrolments and QR codes have no caps.</span></p>
    </div>

    <div ref={plansRef} className="scroll-mt-4">
      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><h3 className="text-sm font-black">Plans</h3><p className="mt-1 text-[10px] text-black/45">Upgrade for more customer records, attendants and branches.</p></div>
          <Chips options={BILLING_PERIODS} value={s.period} onChange={s.setPeriod}/>
        </div>
        {s.plans.isError ? <ErrorBlock text={errorMessage(s.plans.error, 'We couldn’t load the plans.')} onRetry={() => void s.plans.refetch()}/>
          : s.plans.isLoading ? <CardGridSkeleton count={3} footer={0} gridClassName="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:grid-cols-3"/>
            : (s.plans.data ?? []).length === 0 ? <p className="mt-5 text-xs text-black/45">No plans are available right now.</p>
              : <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:grid-cols-3">{(s.plans.data ?? []).map(plan => {
                const isCurrent = Boolean(tierName) && sameName(plan.name, tierName)
                const price = plan.prices[s.billing.priceKey] ?? 0
                const disabled = (isCurrent && !branch.locked) || price <= 0
                return <div key={plan.id} className={cn('flex min-w-0 flex-col border p-5', isCurrent ? 'border-black bg-[#F6F6F2]' : 'border-black/10')}>
                  <div className="flex items-center justify-between gap-2"><b className="truncate text-sm font-black">{plan.name}</b>{isCurrent && <Badge>Current</Badge>}</div>
                  <p className="mt-3 break-words text-2xl font-black tracking-[-.04em]">{price > 0 ? s.money(price) : 'Free'}{price > 0 && <span className="text-xs font-bold tracking-normal text-black/45"> / {s.billing.short}</span>}</p>
                  <ul className="mt-4 flex flex-1 flex-col gap-2">
                    {SHARED_PLAN_FEATURES.map(({ field, label }) => <li key={field} className="flex items-center gap-2 text-xs font-semibold text-black/70"><Check size={14} className="shrink-0"/><span className="min-w-0">{limitText(plan.limits[field])} {label.toLowerCase()}</span></li>)}
                    <li className="flex items-center gap-2 text-xs font-semibold text-black/70"><Check size={14} className="shrink-0"/><span className="min-w-0">Unlimited loyalty</span></li>
                  </ul>
                  <MkButton onClick={() => s.choose(plan)} disabled={disabled} className="mt-5 w-full">{isCurrent && !branch.locked ? 'Your plan' : price <= 0 ? 'Free plan' : `Choose ${plan.name}`}</MkButton>
                </div>
              })}</div>}
      </Card>
    </div>

    <ConfirmModal open={Boolean(s.pending)} onClose={s.cancel} onConfirm={s.confirm} loading={s.subscribing} kicker="Plan & billing" title={`Subscribe to ${s.pending?.name ?? ''}`} confirmLabel="Continue to payment">
      You'll pay <b className="text-black">{s.money(pendingPrice)}</b> per {s.billing.short}{branch.planBusinessId ? <> for <b className="text-black">{branch.branchName || 'this branch'}</b></> : null}. We'll take you to the payment page to finish.
    </ConfirmModal>
  </div>
}
