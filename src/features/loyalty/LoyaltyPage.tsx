import { Gift, Link2, Plus, QrCode, Ticket } from 'lucide-react'
import { useState } from 'react'
import type { LoyaltyProgram } from '@/api/loyalty'
import { useLoyaltyTheme } from '@/api/storeTheme'
import { Card, Chips, EmptyBlock, ErrorBlock, MkButton, PageHeading, Tabs } from '@/components/ui/mk'
import { CardGridSkeleton } from '@/components/ui/CardSkeleton'
import { cn } from '@/lib/cn'
import { asRate, formatRewardAmount } from '@/lib/reward-format'
import { EditProgramModal } from './components/EditProgramModal'
import { MembersTab } from './components/MembersTab'
import { ShareProgramModal } from './components/ShareProgramModal'
import { PROGRAM_FILTERS, statusLabel, useLoyaltyPage } from './hooks/useLoyaltyPage'

type Page = ReturnType<typeof useLoyaltyPage>

const linkClass = 'inline-flex items-center gap-1.5 text-xs font-extrabold text-black/65 transition hover:text-black disabled:cursor-not-allowed disabled:opacity-40'

/** sink's CampaignCard, in the design's style: summary, the four counters, rewards given out, and the actions. */
function ProgramCard({ program, page }: { program: LoyaltyProgram; page: Page }) {
  const theme = useLoyaltyTheme()
  const live = program.status === 'ACTIVE'
  const cells = [
    { label: 'Enrolled', value: program.enrolled.toLocaleString() },
    { label: 'Active', value: program.active.toLocaleString() },
    { label: 'Completed', value: program.completedMembers.toLocaleString() },
    { label: 'Rate', value: `${asRate(program.completionRate)}%` },
  ]
  const opening = page.landingFor === program.id
  return <Card className="flex min-w-0 flex-col overflow-hidden">
    <div className="h-1.5" style={{ background: theme.base }}/>
    <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
      <button type="button" onClick={() => page.open(program.id)} className="flex min-w-0 items-start gap-3 text-left">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: theme.surface, color: theme.qrFg }}><Ticket size={17}/></span>
        <span className="min-w-0">
          <span className="line-clamp-2 break-words text-[15px] font-black leading-snug tracking-[-.02em] hover:underline">{program.name}</span>
          <span className="mt-1 block text-[11px] leading-relaxed text-black/45">Trigger: <b className="text-black/75">{program.triggerSummary || '—'}</b> · Reward: <b className="text-black/75">{program.rewardSummary || '—'}</b></span>
        </span>
      </button>
      <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold', live ? 'bg-[#D7FF45] text-black' : 'bg-[#F0F0EC] text-black/55')}>
        <i className={cn('h-1.5 w-1.5 rounded-full', live ? 'bg-black' : 'bg-black/35')}/>{statusLabel(program.status)}
      </span>
    </div>

    <div className="grid grid-cols-4 divide-x divide-black/10 border-y border-black/10">
      {cells.map(cell => <div key={cell.label} className="min-w-0 px-1 py-3 text-center">
        <p className="truncate text-base font-black">{cell.value}</p>
        <p className="mt-0.5 truncate text-[10px] text-black/45">{cell.label}</p>
      </div>)}
    </div>

    <div className="flex items-center justify-between gap-3 bg-[#FFF7DF] px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <Gift size={16} className="shrink-0 text-[#8F5F00]"/>
        <div className="min-w-0"><p className="truncate text-xs font-extrabold">Total rewards given out</p><p className="truncate text-[10px] text-black/45">{program.completions.toLocaleString()} completions · {program.cancelledRewards.toLocaleString()} cancelled</p></div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-black text-[#B43A16]">{formatRewardAmount(program.givenOutValue, program.rewardType, page.money)}</p>
        <p className="text-[10px] text-black/45">Retention: {asRate(program.retentionRate)}%</p>
      </div>
    </div>

    {/* The three links wrap on phones and View participants takes its own full-width row. */}
    <div className="mt-auto flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {page.canManage && <button type="button" onClick={() => page.editor.openEdit(program)} className="text-xs font-extrabold underline decoration-[#D7FF45] decoration-2 underline-offset-4 hover:decoration-black">Edit</button>}
        <button type="button" onClick={() => page.share(program)} className={linkClass}><QrCode size={14}/>QR</button>
        <button type="button" onClick={() => page.openLanding(program)} disabled={opening} className={linkClass}>{opening ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"/> : <Link2 size={14}/>}Landing page</button>
      </div>
      <MkButton onClick={() => page.viewParticipants(program.id)} className="h-9 w-full sm:w-auto">View participants</MkButton>
    </div>
  </Card>
}

export default function LoyaltyPage() {
  const page = useLoyaltyPage()
  const [tab, setTab] = useState<'programs' | 'members'>('programs')
  return <div className="space-y-5">
    <PageHeading title="Loyalty programs" subtitle="Build habits, grow spend, and reward your best customers." actions={page.canCreate && <MkButton onClick={page.create}><Plus size={15}/>Create loyalty</MkButton>}/>
    <Tabs options={[{ value: 'programs', label: 'Programs' }, { value: 'members', label: 'Members' }]} value={tab} onChange={setTab}/>
    {tab === 'members' ? <MembersTab/> : <>
    <Chips options={PROGRAM_FILTERS} value={page.filter} onChange={page.setFilter}/>
    {page.isError
      ? <Card><ErrorBlock text="We couldn’t load your loyalty programs." onRetry={page.retry}/></Card>
      : page.isLoading
        ? <CardGridSkeleton count={4} gridClassName="grid gap-4 xl:grid-cols-2" footer={4}/>
        : page.programs.length === 0
          ? <Card><EmptyBlock title={page.total === 0 ? 'No loyalty programs yet' : 'Nothing in this list'} text={page.total === 0 ? 'Create a program to start rewarding customers who come back.' : 'Try another filter.'} action={page.total === 0 && page.canCreate && <MkButton onClick={page.create}><Plus size={14}/>Create loyalty</MkButton>}/></Card>
          : <div className="grid gap-4 xl:grid-cols-2">{page.programs.map(program => <ProgramCard key={program.id} program={program} page={page}/>)}</div>}
    </>}
    <ShareProgramModal program={page.sharing} onClose={page.closeShare}/>
    <EditProgramModal page={page.editor}/>
  </div>
}
