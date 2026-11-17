import { ArrowRight, CircleDollarSign, Gift, Plus, TrendingUp, Users } from 'lucide-react'
import { Badge, Card, EmptyBlock, ErrorBlock, Metric, MetricSkeleton, MkButton, PageHeading, initialsOf } from '@/components/ui/mk'
import { useCardColour } from '@/api/storeTheme'
import { useOverview } from './hooks/useOverview'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { CardGridSkeleton } from '@/components/ui/CardSkeleton'

const icons = { users: Users, trend: TrendingUp, money: CircleDollarSign, gift: Gift }

export default function OverviewPage() {
  const page = useOverview()
  const colour = useCardColour()
  return <div className="space-y-5">
    <PageHeading badge="LIVE PERFORMANCE" title="Loyalty that moves people." subtitle="See what keeps your customers coming back—and spending more." actions={page.canCreate && <MkButton onClick={page.create}><Plus size={15}/>Create loyalty</MkButton>}/>

    {page.isError
      ? <Card><ErrorBlock text="We couldn’t load your loyalty numbers." onRetry={page.retry}/></Card>
      : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {page.isLoading
          ? Array.from({ length: 4 }, (_, index) => <MetricSkeleton key={index} dark={index === 0}/>)
          : page.metrics.map(metric => <Metric key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} icon={icons[metric.icon]} dark={metric.dark}/>)}
      </div>}

    <div className="grid gap-5 xl:grid-cols-[1.55fr_.85fr]">
      <Card className="p-5">
        <div className="flex items-start justify-between"><div><h3 className="text-sm font-black">Top streaks</h3><p className="mt-1 text-[10px] text-black/45">Members on the longest visit streaks right now</p></div></div>
        {page.isLoading
          ? <TableSkeleton header={false} rows={3} className="mt-3 -mx-5" columns={[{ thumbnail: true, flex: true, twoLine: true }, { width: 'w-12', alignRight: true }]}/>
          : page.topStreaks.length === 0
            ? <EmptyBlock title="No streaks yet" text="As members visit, the ones on the longest streaks show here."/>
            : <div className="mt-5 divide-y divide-black/10">{page.topStreaks.map(person => <div key={person.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-[10px] font-black text-white">{person.initials || initialsOf(person.name)}</span><div className="min-w-0"><p className="truncate text-xs font-black">{person.name}</p><p className="text-[9px] text-black/40">{person.tier || 'Member'}</p></div></div>
              <span className="shrink-0 text-sm font-black">🔥 {person.streak}</span>
            </div>)}</div>}
      </Card>
      <Card className="overflow-hidden bg-[#D7FF45]">
        <div className="p-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[.15em]">Rewards</p>
          {page.insight
            ? <><h3 className="mt-4 text-2xl font-black leading-[1.08] tracking-[-.05em]">{page.insight.redemption.toFixed(0)}% of rewards get claimed.</h3><p className="mt-3 text-xs leading-relaxed text-black/60">{page.insight.pending.toLocaleString()} rewards are waiting to be claimed. Remind those members to come back.</p></>
            : <div className="mt-4 h-16 animate-pulse bg-black/10"/>}
          <button type="button" onClick={page.openRewards} className="mt-6 flex items-center gap-2 text-xs font-black">See rewards <ArrowRight size={14}/></button>
        </div>
      </Card>
    </div>

    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-black/10 p-5"><div><h3 className="text-sm font-black">Live programs</h3><p className="mt-1 text-[10px] text-black/45">Your loyalty experiences running right now</p></div><button type="button" onClick={page.viewPrograms} className="text-xs font-extrabold">View all →</button></div>
      {page.programsLoading
        ? <CardGridSkeleton count={3} gridClassName="grid gap-px lg:grid-cols-3" footer={2} cardClassName="border-0"/>
        : page.livePrograms.length === 0
          ? <EmptyBlock title="No live programs yet" text="Create a loyalty program to start rewarding customers who come back." action={page.canCreate && <MkButton onClick={page.create}><Plus size={14}/>Create loyalty</MkButton>}/>
          : <div className="grid divide-y divide-black/10 lg:grid-cols-3 lg:divide-x lg:divide-y-0">{page.livePrograms.map(program => <button key={program.id} type="button" onClick={() => page.openProgram(program.id)} className="p-5 text-left hover:bg-[#FAFAF7]">
            <span className="block h-2 w-12" style={{ background: colour }}/>
            <div className="mt-5 flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-black">{program.name}</p><p className="mt-1 truncate text-[10px] text-black/45">{program.triggerSummary || program.rewardSummary}</p></div><Badge>LIVE</Badge></div>
            <div className="mt-6 flex items-end justify-between"><div><p className="text-[9px] text-black/40">MEMBERS</p><b>{program.enrolled.toLocaleString()}</b></div><div className="text-right"><p className="text-[9px] text-black/40">COMPLETION</p><b>{program.completionRate ? `${program.completionRate.toFixed(0)}%` : '—'}</b></div></div>
          </button>)}</div>}
    </Card>
  </div>
}
