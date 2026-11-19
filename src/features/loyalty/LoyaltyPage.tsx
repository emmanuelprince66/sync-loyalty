import { Plus, QrCode } from 'lucide-react'
import { useState } from 'react'
import { Badge, Card, Chips, EmptyBlock, ErrorBlock, MkButton, PageHeading, Tabs } from '@/components/ui/mk'
import { MembersTab } from './components/MembersTab'
import { PROGRAM_FILTERS, statusLabel, useLoyaltyPage } from './hooks/useLoyaltyPage'
import { useCardColour } from '@/api/storeTheme'
import { CardGridSkeleton } from '@/components/ui/CardSkeleton'

export default function LoyaltyPage() {
  const page = useLoyaltyPage()
  const colour = useCardColour()
  const [tab, setTab] = useState<'programs' | 'members'>('programs')
  return <div className="space-y-5">
    <PageHeading title="Loyalty programs" subtitle="Build habits, grow spend, and reward your best customers." actions={page.canCreate && <MkButton onClick={page.create}><Plus size={15}/>Create loyalty</MkButton>}/>
    <Tabs options={[{ value: 'programs', label: 'Programs' }, { value: 'members', label: 'Members' }]} value={tab} onChange={setTab}/>
    {tab === 'members' ? <MembersTab/> : <>
    <Chips options={PROGRAM_FILTERS} value={page.filter} onChange={page.setFilter}/>
    {page.isError
      ? <Card><ErrorBlock text="We couldn’t load your loyalty programs." onRetry={page.retry}/></Card>
      : page.isLoading
        ? <CardGridSkeleton count={4} gridClassName="grid gap-4 md:grid-cols-2" footer={4}/>
        : page.programs.length === 0
          ? <Card><EmptyBlock title={page.total === 0 ? 'No loyalty programs yet' : 'Nothing in this list'} text={page.total === 0 ? 'Create a program to start rewarding customers who come back.' : 'Try another filter.'} action={page.total === 0 && page.canCreate && <MkButton onClick={page.create}><Plus size={14}/>Create loyalty</MkButton>}/></Card>
          : <div className="grid gap-4 md:grid-cols-2">{page.programs.map(program => <Card key={program.id} className="group overflow-hidden transition hover:-translate-y-1 hover:shadow-xl">
            <div className="h-3" style={{ background: colour }}/>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><Badge tone={program.status === 'ACTIVE' ? 'lime' : 'gray'}>{statusLabel(program.status)}</Badge><h3 className="mt-4 truncate text-xl font-black tracking-[-.04em]">{program.name}</h3><p className="mt-1 truncate text-xs text-black/45">{program.triggerSummary || '—'}</p></div>
              </div>
              <div className="mt-7 grid grid-cols-3 gap-2 border-y border-black/10 py-4">
                <div className="min-w-0"><p className="text-[9px] text-black/40">MEMBERS</p><b>{program.enrolled.toLocaleString()}</b></div>
                <div className="min-w-0"><p className="text-[9px] text-black/40">REWARD</p><b className="block truncate text-xs">{program.rewardSummary || '—'}</b></div>
                <div className="min-w-0"><p className="text-[9px] text-black/40">COMPLETED</p><b>{program.completions.toLocaleString()}</b></div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button type="button" onClick={() => page.open(program.id)} className="text-xs font-extrabold">Manage program →</button>
                <button type="button" aria-label={`QR poster for ${program.name}`} onClick={() => page.openCardStudio(program.id)} className="grid h-8 w-8 place-items-center rounded-full bg-[#F0F0EC]"><QrCode size={14}/></button>
              </div>
            </div>
          </Card>)}</div>}
    </>}
  </div>
}
