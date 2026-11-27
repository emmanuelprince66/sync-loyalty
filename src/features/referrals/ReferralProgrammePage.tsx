import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import { useApiDateRange } from '@/hooks/useApiDateRange'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeft, Link2, Mail, MessageSquare, Plus, Search, Settings2, Target, Trophy, Users } from 'lucide-react'
import { useReferralParticipants, useReferralProgramme } from '@/api/referrals'
import { CardGridSkeleton } from '@/components/ui/CardSkeleton'
import { Badge, Card, EmptyBlock, ErrorBlock, Metric, MetricSkeleton, MkButton } from '@/components/ui/mk'
import { useDebounce } from '@/hooks/useDebounce'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { usePermissions } from '@/hooks/usePermissions'
import { paths } from '@/routes/paths'
import { AddParticipantModal } from './components/AddParticipantModal'
import { ParticipantCard } from './components/ParticipantCard'
import { ProgrammeFormModal } from './components/ProgrammeFormModal'
import { capUsage, shortDate } from './components/shared'

function BackLink({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white py-2 pl-2 pr-4 text-xs font-extrabold transition hover:border-black">
    <span className="grid h-6 w-6 place-items-center rounded-full bg-black text-white"><ArrowLeft size={13}/></span>Referral programmes
  </button>
}

/** sink's ReferralProgrammePage: one programme fetched by id, its numbers and terms, Settings, and its participants. */
export default function ReferralProgrammePage() {
  const { programmeId = '' } = useParams()
  const navigate = useNavigate()
  const money = useFormatMoney()
  const { canManageLoyalty } = usePermissions()
  const programme = useReferralProgramme(programmeId)
  const [query, setQuery] = useState('')
  const search = useDebounce(query, 300)
  // Participants who joined in a chosen period (start_date / end_date).
  const dates = useApiDateRange()
  const participants = useReferralParticipants(programmeId, search, dates.query)
  const [showSettings, setShowSettings] = useState(false)
  const [adding, setAdding] = useState(false)
  const back = () => navigate(paths.referrals)

  if (programme.isLoading) return <div className="min-w-0 space-y-5">
    <BackLink onClick={back}/>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <MetricSkeleton key={index} dark={index === 0}/>)}</div>
    <CardGridSkeleton count={3} gridClassName="grid grid-cols-[minmax(0,1fr)] gap-3" avatar footer={3}/>
  </div>

  if (programme.isError && !programme.data) return <div className="min-w-0 space-y-5"><BackLink onClick={back}/><Card><ErrorBlock text="We couldn’t load this programme." onRetry={() => { void programme.refetch() }}/></Card></div>

  const p = programme.data
  if (!p || !p.id) return <div className="min-w-0 space-y-5"><BackLink onClick={back}/><Card><EmptyBlock title="Programme not found" text="It may have been removed, or the link is out of date." action={<MkButton secondary onClick={back}>Back to Affiliate & Referral</MkButton>}/></Card></div>

  const { cap, pct, label } = capUsage(p)
  const list = participants.data ?? []

  return <div className="min-w-0 space-y-5">
    <BackLink onClick={back}/>

    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-black tracking-[-.05em] sm:text-3xl">{p.name}</h2>
          <p className="mt-1 text-[11px] text-black/45">Referral Programmes · Created {shortDate(p.createdAt) ?? '—'}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone={p.active ? 'lime' : 'gray'}>{p.active ? 'Active' : 'Paused'}</Badge>
          {canManageLoyalty && <MkButton secondary onClick={() => setShowSettings(true)}><Settings2 size={14}/>Settings</MkButton>}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Participants" value={p.participants.toLocaleString()} icon={Users} dark/>
        <Metric label="Referrals" value={p.referrals.toLocaleString()} icon={Link2}/>
        <Metric label="Total Paid" value={money(p.totalPaid)} icon={Trophy}/>
        <Metric label={`Cap (${pct}%)`} value={label} icon={Target}/>
      </div>
    </Card>

    <div className="flex flex-wrap items-center justify-between gap-4 bg-black px-5 py-4 text-white">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#D7FF45]">Reward Rate</p><p className="text-2xl font-black tracking-[-.04em]">{p.rewardPercentage}%</p><p className="text-[10px] text-white/50">of purchase value</p></div>
        <div className="hidden h-10 w-px bg-white/15 sm:block"/>
        <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#D7FF45]">Reward Cap</p><p className="text-2xl font-black tracking-[-.04em]">{cap}</p><p className="text-[10px] text-white/50">max rewards</p></div>
      </div>
      {(p.notifySms || p.notifyEmail) && <div className="flex shrink-0 gap-1.5">
        {p.notifySms && <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-extrabold text-white/75"><MessageSquare size={12}/>SMS</span>}
        {p.notifyEmail && <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-extrabold text-white/75"><Mail size={12}/>Email</span>}
      </div>}
    </div>

    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-black">Participants</h3>
        {canManageLoyalty && <MkButton onClick={() => setAdding(true)}><Plus size={14}/>Add participant</MkButton>}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <DateRangeFilter value={dates.range} onChange={dates.setRange} placeholder="Joined any time" className="w-full sm:w-56"/>
      <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-black/10 focus-within:ring-black">
        <Search size={14} className="shrink-0 text-black/45"/>
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name or code..." aria-label="Search participants" className="w-full min-w-0 bg-transparent text-xs outline-none"/>
      </label>
      </div>

      {participants.isError ? <Card><ErrorBlock text="We couldn’t load the participants." onRetry={() => { void participants.refetch() }}/></Card>
        : participants.isLoading ? <CardGridSkeleton count={3} gridClassName="grid grid-cols-[minmax(0,1fr)] gap-3" avatar footer={3}/>
          : list.length === 0 ? <Card className="border-dashed"><EmptyBlock title={search ? 'No matches' : 'No participants yet'} text={search ? 'No participants match that search.' : 'Nobody is enrolled yet. Add a loyal customer to mint their referral link.'}/></Card>
            : <div className="grid grid-cols-[minmax(0,1fr)] gap-2.5">{list.map(person => <ParticipantCard key={person.id} participant={person}/>)}</div>}
    </section>

    {showSettings && <ProgrammeFormModal programme={p} onClose={() => setShowSettings(false)}/>}
    {adding && <AddParticipantModal programmeId={p.id} onClose={() => setAdding(false)}/>}
  </div>
}
