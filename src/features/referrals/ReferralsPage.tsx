import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Copy, Gift, Link2, PenLine, Plus, Search, Share2, UserPlus, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useAddParticipant, useReferralOverview, useReferralParticipants, useReferralProgrammes, useSaveProgramme, useSetProgrammeActive, type ProgrammeInput, type ReferralProgramme } from '@/api/referrals'
import { Badge, Card, EmptyBlock, ErrorBlock, Metric, MetricSkeleton, MkButton, PageHeading, initialsOf, inputClass, labelClass } from '@/components/ui/mk'
import { useClipboard } from '@/hooks/useClipboard'
import { useDebounce } from '@/hooks/useDebounce'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { usePermissions } from '@/hooks/usePermissions'
import { cn } from '@/lib/cn'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { CardGridSkeleton } from '@/components/ui/CardSkeleton'

function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  return <Dialog.Root open onOpenChange={next => { if (!next) onClose() }}>
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-0 sm:p-4"><Dialog.Content aria-describedby={undefined} className="max-h-[100dvh] w-full max-w-lg overflow-y-auto bg-[#F6F6F2] shadow-2xl outline-none sm:max-h-[92vh]">
      <div className="flex items-center justify-between gap-3 border-b border-black/10 px-6 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-black/40">Referrals</p><Dialog.Title className="text-xl font-black">{title}</Dialog.Title></div><button type="button" aria-label="Close" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-black text-white"><X size={16}/></button></div>
      <div className="space-y-4 p-6">{children}</div>
      <div className="flex justify-end gap-2 border-t border-black/10 px-6 py-4">{footer}</div>
    </Dialog.Content></Dialog.Overlay></Dialog.Portal>
  </Dialog.Root>
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange} className={cn('relative h-6 w-11 shrink-0 rounded-full transition', on ? 'bg-black' : 'bg-black/15')}><i className={cn('absolute top-1 h-4 w-4 rounded-full transition-all', on ? 'left-6 bg-[#D7FF45]' : 'left-1 bg-white')}/></button>
}

function ProgrammeEditor({ programme, onClose }: { programme: ReferralProgramme | 'new'; onClose: () => void }) {
  const existing = programme === 'new' ? null : programme
  const save = useSaveProgramme()
  const [form, setForm] = useState<ProgrammeInput>({ name: existing?.name ?? '', rewardPercentage: existing ? String(existing.rewardPercentage) : '5', rewardCap: existing ? String(existing.rewardCap) : '10', notifySms: existing?.notifySms ?? true, notifyEmail: existing?.notifyEmail ?? false })
  const submit = () => {
    if (!form.name.trim()) return toast.error('Name the programme.')
    if (!(Number(form.rewardPercentage) > 0) || Number(form.rewardPercentage) > 100) return toast.error('Enter a reward between 1% and 100%.')
    if (!(Number(form.rewardCap) >= 1)) return toast.error('Enter how many referrals can earn a reward.')
    save.mutate({ id: existing?.id, input: form }, {
      onSuccess: () => { toast.success(existing ? 'Programme updated' : 'Referral programme created'); onClose() },
      onError: error => toast.error(errorMessage(error, 'Could not save the programme.')),
    })
  }
  return <Modal title={existing ? 'Edit programme' : 'New referral programme'} onClose={onClose} footer={<><MkButton secondary onClick={onClose}>Cancel</MkButton><MkButton onClick={submit} loading={save.isPending}>{existing ? 'Save changes' : 'Create programme'}</MkButton></>}>
    <label className="block"><span className={labelClass}>Name</span><input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="e.g. Bring a friend" className={cn(inputClass, 'mt-2')}/></label>
    <div className="grid grid-cols-2 gap-3">
      <label><span className={labelClass}>Reward</span><div className="mt-2 flex h-11 items-center border border-black/15 bg-white px-3"><input inputMode="decimal" value={form.rewardPercentage} onChange={event => setForm({ ...form, rewardPercentage: event.target.value.replace(/[^\d.]/g, '') })} className="w-full bg-transparent text-sm outline-none"/><span className="text-[10px] font-bold text-black/40">% OF SALE</span></div></label>
      <label><span className={labelClass}>Paid referrals</span><div className="mt-2 flex h-11 items-center border border-black/15 bg-white px-3"><input inputMode="numeric" value={form.rewardCap} onChange={event => setForm({ ...form, rewardCap: event.target.value.replace(/\D/g, '') })} className="w-full bg-transparent text-sm outline-none"/><span className="text-[10px] font-bold text-black/40">MAX</span></div></label>
    </div>
    <p className="text-[11px] text-black/50">Each participant earns {form.rewardPercentage || '0'}% of what a referred customer spends, for up to {form.rewardCap || '0'} referrals.</p>
    <div className="divide-y divide-black/10 border border-black/15 bg-white">
      <div className="flex items-center justify-between p-3"><b className="text-xs">Notify by SMS</b><Toggle on={form.notifySms} label="Notify by SMS" onChange={() => setForm({ ...form, notifySms: !form.notifySms })}/></div>
      <div className="flex items-center justify-between p-3"><b className="text-xs">Notify by email</b><Toggle on={form.notifyEmail} label="Notify by email" onChange={() => setForm({ ...form, notifyEmail: !form.notifyEmail })}/></div>
    </div>
  </Modal>
}

function AddParticipant({ programme, onClose }: { programme: ReferralProgramme; onClose: () => void }) {
  const add = useAddParticipant()
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  return <Modal title={`Add to ${programme.name}`} onClose={onClose} footer={<><MkButton secondary onClick={onClose}>Cancel</MkButton><MkButton loading={add.isPending} onClick={() => {
    if (!form.name.trim() || !form.phone.trim()) return toast.error('Enter their name and phone number.')
    add.mutate({ programmeId: programme.id, ...form }, { onSuccess: () => { toast.success('Participant added. Their referral link is ready.'); onClose() }, onError: error => toast.error(errorMessage(error, 'Could not add the participant.')) })
  }}>Add participant</MkButton></>}>
    <label className="block"><span className={labelClass}>Name</span><input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className={cn(inputClass, 'mt-2')}/></label>
    <label className="block"><span className={labelClass}>Phone</span><input type="tel" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} className={cn(inputClass, 'mt-2')}/></label>
    <label className="block"><span className={labelClass}>Email <small className="normal-case text-black/35">optional</small></span><input type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className={cn(inputClass, 'mt-2')}/></label>
  </Modal>
}

/** sink's Referrals tab: programmes, the overview, and each programme's participants with their share links. */
export default function ReferralsPage() {
  const money = useFormatMoney()
  const { canManageLoyalty } = usePermissions()
  const overview = useReferralOverview()
  const programmes = useReferralProgrammes()
  const setActive = useSetProgrammeActive()
  const { copy } = useClipboard()
  const [selectedId, setSelectedId] = useState('')
  const [editing, setEditing] = useState<ReferralProgramme | 'new' | null>(null)
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 300)
  const list = programmes.data ?? []
  const selected = list.find(item => item.id === selectedId) ?? list[0]
  const participants = useReferralParticipants(selected?.id, debounced)
  const o = overview.data

  return <div className="space-y-5">
    <PageHeading badge="REFERRALS" title="Customers who bring customers." subtitle="Give your fans a link to share and reward them for every friend who buys." actions={canManageLoyalty && <MkButton onClick={() => setEditing('new')}><Plus size={14}/>New programme</MkButton>}/>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {overview.isLoading || !o ? Array.from({ length: 4 }, (_, index) => <MetricSkeleton key={index} dark={index === 0}/>)
        : <>
          <Metric label="Participants" value={o.participants.toLocaleString()} detail={`${o.programmes} programmes`} icon={Users} dark/>
          <Metric label="Referrals" value={o.referrals.toLocaleString()} icon={Share2}/>
          <Metric label="Conversion" value={o.conversion} icon={Link2}/>
          <Metric label="Paid out" value={money(o.paidOut)} icon={Gift}/>
        </>}
    </div>
    {programmes.isError ? <Card><ErrorBlock text="We couldn’t load your referral programmes." onRetry={() => { void programmes.refetch() }}/></Card>
      : programmes.isLoading ? <CardGridSkeleton count={4} gridClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" footer={3}/>
        : list.length === 0 ? <Card><EmptyBlock title="No referral programmes yet" text="Create one, add your best customers, and share their links." action={canManageLoyalty ? <MkButton onClick={() => setEditing('new')}><Plus size={14}/>New programme</MkButton> : undefined}/></Card>
          : <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{list.map(programme => {
              const active = selected?.id === programme.id
              return <div key={programme.id} className={cn('flex flex-col p-5 transition', active ? 'bg-black text-white' : 'border border-black/10 bg-white')}>
                <button type="button" onClick={() => setSelectedId(programme.id)} className="text-left">
                  <div className="flex items-start justify-between gap-2"><b className="text-sm">{programme.name}</b><span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold', programme.active ? 'bg-[#D7FF45] text-black' : active ? 'bg-white/15' : 'bg-[#F0F0EC]')}>{programme.active ? 'Live' : 'Paused'}</span></div>
                  <p className="mt-4 text-3xl font-black tracking-[-.05em]">{programme.rewardPercentage}%</p>
                  <p className={cn('text-[10px]', active ? 'text-white/50' : 'text-black/45')}>of each referred sale · up to {programme.rewardCap} referrals</p>
                  <div className={cn('mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-[10px]', active ? 'border-white/15' : 'border-black/10')}><span><b className="block text-sm">{programme.participants}</b>people</span><span><b className="block text-sm">{programme.referrals}</b>referrals</span><span><b className="block truncate text-sm">{money(programme.totalPaid)}</b>paid</span></div>
                </button>
                {canManageLoyalty && <div className="mt-4 flex items-center justify-between gap-2"><button type="button" onClick={() => setEditing(programme)} className={cn('inline-flex items-center gap-1.5 text-[11px] font-extrabold', active ? 'text-white/70 hover:text-white' : 'text-black/55 hover:text-black')}><PenLine size={12}/>Edit</button><span className="flex items-center gap-2 text-[10px] font-bold">{programme.active ? 'On' : 'Off'}<Toggle on={programme.active} label={`${programme.name} live`} onChange={() => setActive.mutate({ id: programme.id, active: !programme.active }, { onError: error => toast.error(errorMessage(error, 'Could not update the programme.')) })}/></span></div>}
              </div>
            })}</div>

            {selected && <Card className="flex max-h-[70vh] min-h-[420px] flex-col overflow-hidden lg:sticky lg:top-0 lg:h-[calc(100dvh-140px)] lg:max-h-none">
              <div className="border-b border-black/10 p-4">
                <div className="flex items-center justify-between gap-2"><div className="min-w-0"><h3 className="truncate text-sm font-black">{selected.name}</h3><p className="text-[10px] text-black/45">Participants and their links</p></div>{canManageLoyalty && <MkButton onClick={() => setAdding(true)}><UserPlus size={14}/>Add</MkButton>}</div>
                <label className="mt-3 flex h-10 items-center gap-2 rounded-full bg-[#F1F1ED] px-4"><Search size={14} className="text-black/45"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search participants" className="w-full bg-transparent text-xs outline-none" aria-label="Search participants"/></label>
              </div>
              <div className="min-h-0 flex-1 divide-y divide-black/10 overflow-y-auto">
                {participants.isLoading ? <TableSkeleton header={false} rows={4} columns={[{ thumbnail: true, flex: true, twoLine: true }, { width: 'w-8', alignRight: true }]}/>
                  : (participants.data ?? []).length === 0 ? <EmptyBlock title={query ? 'No matches' : 'No participants yet'} text={query ? `Nobody matches “${query}”.` : 'Add customers to give them a referral link.'}/>
                    : (participants.data ?? []).map(person => <div key={person.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F0F0EC] text-[11px] font-black">{initialsOf(person.name)}</span>
                      <div className="min-w-0 flex-1"><b className="block truncate text-xs">{person.name}</b><span className="block truncate text-[10px] text-black/45">{person.code} · {person.referrals} referrals · {money(person.earned)} earned</span></div>
                      {person.link && <button type="button" aria-label={`Copy ${person.name}’s link`} onClick={() => { void copy(person.link); toast.success('Referral link copied') }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/10 hover:border-black"><Copy size={13}/></button>}
                    </div>)}
              </div>
              <div className="border-t border-black/10 p-3"><Badge tone="gray">{selected.capProgress || `${selected.referrals} of ${selected.rewardCap} paid referrals`}</Badge></div>
            </Card>}
          </div>}
    {editing && <ProgrammeEditor programme={editing} onClose={() => setEditing(null)}/>}
    {adding && selected && <AddParticipant programme={selected} onClose={() => setAdding(false)}/>}
  </div>
}
