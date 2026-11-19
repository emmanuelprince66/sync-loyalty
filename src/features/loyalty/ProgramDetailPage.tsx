import { ArrowLeft, Copy, Palette, Pause, PenLine, Play, Trash2 } from 'lucide-react'
import { formatActivityDate } from '@/api/http'
import { Badge, Card, Chips, EmptyBlock, ErrorBlock, MkButton, Tabs, initialsOf } from '@/components/ui/mk'
import { cn } from '@/lib/cn'
import { BonusPeriods } from './components/BonusPeriods'
import { JoinQrCard } from './components/JoinQrCard'
import { EditProgramModal } from './components/EditProgramModal'
import { statusLabel } from './hooks/useLoyaltyPage'
import { PARTICIPANT_FILTERS, useProgramDetail, type DetailTab, type ProgramDetailModel } from './hooks/useProgramDetail'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { CardGridSkeleton } from '@/components/ui/CardSkeleton'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

const TABS: { value: DetailTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'participants', label: 'Participants' },
  { value: 'qr', label: 'QR code' },
  { value: 'report', label: 'Report' },
]

function BackLink({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white py-2 pl-2 pr-4 text-xs font-extrabold transition hover:border-black">
    <span className="grid h-6 w-6 place-items-center rounded-full bg-black text-white"><ArrowLeft size={13}/></span>Loyalty programs
  </button>
}

function Overview({ page }: { page: ProgramDetailModel }) {
  return <div className="space-y-5">
    <Card className="overflow-hidden">
      <div className="border-b border-black/10 p-5"><h3 className="text-sm font-black">Members</h3><p className="mt-1 text-[11px] text-black/45">Everyone enrolled and how close they are to the reward</p></div>
      {page.membersLoading
        ? <TableSkeleton rows={4} columns={[{ flex: true, twoLine: true }, { pill: true }, { width: 'w-24', twoLine: true }, { width: 'w-12', hiddenOnMobile: true }, { pill: true }]}/>
        : page.members.length === 0
          ? <EmptyBlock title="No members yet" text="Share the join QR so customers can sign up."/>
          : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-[#F7F7F4] text-[10px] uppercase tracking-wider text-black/45"><tr><th className="px-5 py-3">Member</th><th>Tier</th><th>Progress</th><th>Streak</th><th>Status</th></tr></thead>
            <tbody>{page.members.map(member => <tr key={member.id || member.code} className="border-t border-black/10">
              <td className="px-5 py-4"><b className="block">{member.name}</b><span className="text-[10px] text-black/40">{member.code}</span></td>
              <td>{member.tier ? <Badge tone="gray">{member.tier}</Badge> : '—'}</td>
              <td><b>{member.progress || '—'}</b>{member.remaining && <span className="block text-[10px] text-black/40">{member.remaining}</span>}</td>
              <td className="font-black">🔥 {member.streak}</td>
              <td><Badge tone={/ready/i.test(member.status) ? 'lime' : 'gray'}>{member.status || '—'}</Badge></td>
            </tr>)}</tbody>
          </table></div>}
    </Card>
    <BonusPeriods programId={page.programId} canManage={page.canManage}/>
  </div>
}

function Participants({ page }: { page: ProgramDetailModel }) {
  return <Card className="overflow-hidden">
    <div className="flex flex-col justify-between gap-3 border-b border-black/10 p-5 sm:flex-row sm:items-center">
      <div><h3 className="text-sm font-black">Participants</h3><p className="mt-1 text-[11px] text-black/45">{page.participantCount.toLocaleString()} in this program</p></div>
      <Chips options={PARTICIPANT_FILTERS.map(value => ({ value, label: value }))} value={page.filter} onChange={page.setFilter}/>
    </div>
    {page.isLoading ? <TableSkeleton header={false} rows={5} columns={[{ thumbnail: true, flex: true, twoLine: true }, { pill: true, alignRight: true }]}/>
      : page.participants.length === 0 ? <EmptyBlock title="Nobody here yet" text={page.filter === 'All' ? 'Participants appear once customers join and visit.' : `No ${page.filter.toLowerCase()} participants.`}/>
        : page.participants.map(row => {
          const pct = row.target > 0 ? Math.min(100, (row.current / row.target) * 100) : 0
          return <div key={row.id} className="flex items-center gap-4 border-b border-black/10 px-5 py-4 last:border-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-[11px] font-black text-white">{initialsOf(row.name)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3"><b className="truncate text-xs">{row.name}</b><span className="shrink-0 text-[11px] font-black">{row.current}{row.target ? `/${row.target}` : ''}</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full bg-black" style={{ width: `${pct}%` }}/></div>
              <p className="mt-1.5 text-[10px] text-black/40">Joined {formatActivityDate(row.joinedAt)}{row.lastVisitAt ? ` · last visit ${formatActivityDate(row.lastVisitAt)}` : ''}</p>
            </div>
            <Badge tone={/complete|reward/i.test(row.status) ? 'lime' : /risk/i.test(row.status) ? 'orange' : 'gray'}>{row.status.replace('_', ' ') || '—'}</Badge>
          </div>
        })}
  </Card>
}

function QrPanel({ page }: { page: ProgramDetailModel }) {
  const program = page.program
  return <Card className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,.9fr)] lg:items-start">
    <JoinQrCard businessName={page.businessName} programName={program?.name ?? ''} rewardSummary={program?.rewardSummary ?? ''} triggerSummary={program?.triggerSummary ?? ''} stamps={program?.visitTarget ?? 0} joinUrl={page.joinUrl} colour={page.colour}/>
    <div className="min-w-0">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-black/40">Join QR</p>
      <h3 className="mt-2 text-2xl font-black tracking-[-.04em]">Customers scan to join</h3>
      <p className="mt-2 text-xs leading-relaxed text-black/55">Download or print this card and put it at the counter, on tables or on receipts. Scanning opens the join page, and their loyalty card is ready straight away.</p>
      {page.joinUrl && <button type="button" onClick={page.copyLink} className="mt-5 flex w-full items-center justify-between gap-3 border border-black/15 bg-white p-3 text-left text-[11px] font-bold hover:border-black"><span className="truncate">{page.joinUrl}</span><Copy size={14} className="shrink-0"/></button>}
      {page.copied && <p className="mt-2 text-[11px] font-bold text-[#237A49]">Link copied</p>}
      <MkButton secondary onClick={page.openCardStudio} className="mt-4"><Palette size={14}/>More poster designs</MkButton>
    </div>
  </Card>
}

function Report({ page }: { page: ProgramDetailModel }) {
  const r = page.report
  if (page.isLoading) return <CardGridSkeleton count={4} gridClassName="grid grid-cols-2 gap-3 xl:grid-cols-4" footer={0}/>
  if (!r) return <Card><EmptyBlock title="No report yet" text="The report fills in once rewards start going out."/></Card>
  const tiles = [
    { label: 'Rewards sent', value: r.sent.toLocaleString() },
    { label: 'Redeemed', value: r.redeemed.toLocaleString() },
    { label: 'Cancelled or forfeited', value: r.cancelled.toLocaleString() },
    { label: 'Est. retained revenue', value: page.money(r.retainedRevenue) },
  ]
  const likely = [
    { label: 'After 1st reward', value: r.afterFirst },
    { label: 'After 2nd reward', value: r.afterSecond },
    { label: 'After 3rd+', value: r.afterThirdPlus },
  ]
  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{tiles.map(tile => <Card key={tile.label} className="p-5"><p className="text-[10px] font-extrabold uppercase tracking-wider text-black/40">{tile.label}</p><p className="mt-3 truncate text-2xl font-black tracking-[-.04em]">{tile.value}</p></Card>)}</div>
    <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <Card className="bg-[#D7FF45] p-6"><p className="text-[10px] font-extrabold uppercase tracking-wider text-black/50">Estimated ROI</p><p className="mt-3 text-5xl font-black tracking-[-.06em]">{r.roi.toFixed(0)}%</p><p className="mt-2 text-xs text-black/60">Revenue kept versus what the rewards cost.</p></Card>
      <Card className="p-6"><p className="text-sm font-black">How likely members are to come back</p>
        <div className="mt-5 space-y-4">{likely.map(row => <div key={row.label}><div className="flex justify-between text-xs"><span className="font-bold">{row.label}</span><b>{row.value.toFixed(0)}%</b></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full bg-black" style={{ width: `${Math.min(100, row.value)}%` }}/></div></div>)}</div>
      </Card>
    </div>
  </div>
}

export default function ProgramDetailPage() {
  const page = useProgramDetail()
  if (page.isError) return <div className="space-y-5"><BackLink onClick={page.back}/><Card><ErrorBlock text="We couldn’t load this program." onRetry={page.retry}/></Card></div>
  const program = page.program
  return <div className="space-y-5">
    <BackLink onClick={page.back}/>
    <Card className="overflow-hidden">
      <div className="h-3" style={{ background: page.colour }}/>
      <div className="p-6">
        {page.isLoading || !program
          ? <div className="space-y-3"><div className="h-5 w-16 animate-pulse bg-[#ECECE8]"/><div className="h-8 w-56 animate-pulse bg-[#ECECE8]"/></div>
          : <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="min-w-0"><Badge tone={program.status === 'ACTIVE' ? 'lime' : 'gray'}>{statusLabel(program.status)}</Badge><h2 className="mt-3 text-3xl font-black tracking-[-.055em]">{program.name}</h2><p className="mt-1 text-sm text-black/50">{program.triggerSummary}{program.rewardSummary ? ` · ${program.rewardSummary}` : ''}</p>{program.description && <p className="mt-3 max-w-xl text-xs leading-relaxed text-black/60">{program.description}</p>}</div>
            {page.canManage && <div className="flex flex-wrap gap-2">
              <MkButton secondary onClick={page.openEdit}><PenLine size={14}/>Edit</MkButton>
              {page.canPause && <MkButton secondary onClick={() => page.setLive(false)} loading={page.toggling}><Pause size={14}/>Pause</MkButton>}
              {page.canResume && <MkButton onClick={() => page.setLive(true)} loading={page.toggling}><Play size={14}/>{program.status === 'DRAFT' ? 'Publish' : 'Resume'}</MkButton>}
              <MkButton secondary onClick={page.askDelete} aria-label="Delete program"><Trash2 size={14}/></MkButton>
            </div>}
          </div>}
      </div>
      <div className="grid grid-cols-2 border-t border-black/10 sm:grid-cols-3 xl:grid-cols-6">
        {(page.stats.length ? page.stats : Array.from({ length: 6 }, (_, index) => ({ label: `s${index}`, value: '' }))).map(stat => <div key={stat.label} className="min-w-0 border-b border-r border-black/10 p-4"><p className="truncate text-[10px] uppercase text-black/40">{stat.value ? stat.label : ''}</p>{stat.value ? <b className="block truncate">{stat.value}</b> : <div className="mt-1 h-5 w-14 animate-pulse bg-[#ECECE8]"/>}</div>)}
      </div>
    </Card>

    <ConfirmModal open={page.confirmDelete} onClose={page.cancelDelete} onConfirm={page.remove} loading={page.deleting} danger kicker="Loyalty program" title="Delete this program?" confirmLabel="Delete program" cancelLabel="Keep it">
      <b className="text-black">{program?.name}</b> will be removed. Members lose their progress and can’t earn this reward any more. This can’t be undone.
    </ConfirmModal>

    <Tabs options={TABS} value={page.tab} onChange={page.setTab}/>
    <div className={cn(page.tab !== 'overview' && 'hidden')}><Overview page={page}/></div>
    {page.tab === 'participants' && <Participants page={page}/>}
    {page.tab === 'qr' && <QrPanel page={page}/>}
    {page.tab === 'report' && <Report page={page}/>}
    <EditProgramModal page={page}/>
  </div>
}
