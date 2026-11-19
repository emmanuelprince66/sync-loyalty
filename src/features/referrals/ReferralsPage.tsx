import { useState } from 'react'
import { Gift, Link2, Plus, TrendingUp, Users } from 'lucide-react'
import { useReferralOverview, useReferralProgrammes } from '@/api/referrals'
import { CardGridSkeleton } from '@/components/ui/CardSkeleton'
import { Card, EmptyBlock, ErrorBlock, Metric, MetricSkeleton, MkButton, PageHeading } from '@/components/ui/mk'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { usePermissions } from '@/hooks/usePermissions'
import { ProgrammeCard } from './components/ProgrammeCard'
import { ProgrammeFormModal } from './components/ProgrammeFormModal'

const STEPS = [
  'Add a loyal customer to your programme',
  'They share their unique referral link',
  'New customer signs up via the link',
  'Both get rewarded automatically',
]

/** sink's Referrals tab: overview, how it works, and the programme cards (each opens its own page). */
export default function ReferralsPage() {
  const money = useFormatMoney()
  const { canManageLoyalty } = usePermissions()
  const overview = useReferralOverview()
  const programmes = useReferralProgrammes()
  const [creating, setCreating] = useState(false)
  const o = overview.data
  const list = programmes.data ?? []

  const tiles = o ? [
    { label: 'Programmes', value: o.programmes.toLocaleString(), icon: Gift },
    { label: 'Participants', value: o.participants.toLocaleString(), icon: Users },
    { label: 'Total Referrals', value: o.referrals.toLocaleString(), icon: Link2 },
    { label: 'Paid Out', value: money(o.paidOut), icon: Gift },
    { label: 'Conversion', value: o.conversion || '0×', icon: TrendingUp },
  ] : []

  return <div className="min-w-0 space-y-5">
    <PageHeading badge="REFERRALS" title="Referral Programmes" subtitle="Turn your loyal customers into your best marketers" actions={canManageLoyalty && <MkButton onClick={() => setCreating(true)}><Plus size={14}/>New Programme</MkButton>}/>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {overview.isLoading || !o ? Array.from({ length: 5 }, (_, index) => <MetricSkeleton key={index} dark={index === 0}/>)
        : tiles.map((tile, index) => <Metric key={tile.label} label={tile.label} value={tile.value} icon={tile.icon} dark={index === 0}/>)}
    </div>

    <div className="bg-black p-5 text-white sm:p-6">
      <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-white/60">How <span className="text-[#D7FF45]">Referrals</span> Work</p>
      <ol className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => <li key={step} className="flex min-w-0 items-start gap-2.5">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#D7FF45] text-[11px] font-black text-black">{index + 1}</span>
          <p className="min-w-0 text-[11px] leading-relaxed text-white/80">{step}</p>
        </li>)}
      </ol>
    </div>

    {programmes.isError ? <Card><ErrorBlock text="We couldn’t load your referral programmes." onRetry={() => { void programmes.refetch() }}/></Card>
      : programmes.isLoading ? <CardGridSkeleton count={2} gridClassName="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2" footer={3} firstDark/>
        : list.length === 0 ? <Card className="border-dashed"><EmptyBlock title="No referral programmes yet" text="Create one to give your customers a link they can share, and set the cut they earn on every referral it brings in." action={canManageLoyalty ? <MkButton onClick={() => setCreating(true)}><Plus size={14}/>New Programme</MkButton> : undefined}/></Card>
          : <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">{list.map(programme => <ProgrammeCard key={programme.id} programme={programme}/>)}</div>}

    {creating && <ProgrammeFormModal onClose={() => setCreating(false)}/>}
  </div>
}
