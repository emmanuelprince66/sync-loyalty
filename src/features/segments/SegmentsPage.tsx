import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useNavigate } from 'react-router'
import { PenLine, Plus, Send, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { CONDITION_FIELDS, SEGMENT_TYPES, conditionLabel, useDeleteSegment, useSaveSegment, useSegmentCustomers, useSegments, type Segment, type SegmentInput } from '@/api/segments'
import { Badge, Card, EmptyBlock, ErrorBlock, MkButton, PageHeading, initialsOf, inputClass, labelClass } from '@/components/ui/mk'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { usePermissions } from '@/hooks/usePermissions'
import { cn } from '@/lib/cn'
import { customerPath, paths } from '@/routes/paths'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { CardSkeleton } from '@/components/ui/CardSkeleton'

type Rule = { key: string; value: string }
const toRules = (conditions: Record<string, number | string>): Rule[] => Object.entries(conditions).map(([key, value]) => ({ key, value: String(value) }))

function SegmentEditor({ segment, onClose }: { segment: Segment | 'new'; onClose: () => void }) {
  const existing = segment === 'new' ? null : segment
  const save = useSaveSegment()
  const [name, setName] = useState(existing?.name ?? '')
  const [type, setType] = useState(existing?.type ?? 'CUSTOM')
  const [matchType, setMatchType] = useState<SegmentInput['matchType']>(existing?.matchType ?? 'ALL')
  const [rules, setRules] = useState<Rule[]>(existing ? toRules(existing.conditions) : [{ key: 'purchases', value: '' }])
  const unused = CONDITION_FIELDS.filter(field => !rules.some(rule => rule.key === field.key))

  const submit = () => {
    if (!name.trim()) return toast.error('Name the segment.')
    if (rules.length === 0) return toast.error('Add at least one condition.')
    if (rules.some(rule => rule.value.trim() === '')) return toast.error('Fill in every condition.')
    const conditions = Object.fromEntries(rules.map(rule => [rule.key, Number.isFinite(Number(rule.value)) ? Number(rule.value) : rule.value]))
    save.mutate({ id: existing?.id, input: { name, type, matchType, conditions } }, {
      onSuccess: () => { toast.success(existing ? 'Segment updated' : 'Segment created'); onClose() },
      onError: error => toast.error(errorMessage(error, 'Could not save the segment.')),
    })
  }

  return <Dialog.Root open onOpenChange={next => { if (!next) onClose() }}>
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-0 sm:p-4"><Dialog.Content aria-describedby={undefined} className="max-h-[100dvh] w-full max-w-xl overflow-y-auto bg-[#F6F6F2] shadow-2xl outline-none sm:max-h-[92vh]">
      <div className="flex items-center justify-between gap-3 border-b border-black/10 px-6 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-black/40">Segments</p><Dialog.Title className="text-xl font-black">{existing ? 'Edit segment' : 'New segment'}</Dialog.Title></div><button type="button" aria-label="Close" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-black text-white"><X size={16}/></button></div>
      <div className="space-y-5 p-6">
        <label className="block"><span className={labelClass}>Name</span><input value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Weekend regulars" className={cn(inputClass, 'mt-2')}/></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label><span className={labelClass}>Type</span><select value={type} disabled={existing?.isDefault} onChange={event => setType(event.target.value)} className={cn(inputClass, 'mt-2 disabled:opacity-60')}>{SEGMENT_TYPES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label><span className={labelClass}>Customers must match</span><select value={matchType} onChange={event => setMatchType(event.target.value as SegmentInput['matchType'])} className={cn(inputClass, 'mt-2')}><option value="ALL">All conditions</option><option value="ANY">Any condition</option></select></label>
        </div>
        <div>
          <p className={labelClass}>Conditions</p>
          <div className="mt-2 space-y-2">{rules.map((rule, index) => {
            const field = CONDITION_FIELDS.find(item => item.key === rule.key)
            return <div key={rule.key} className="flex items-center gap-2 border border-black/15 bg-white p-2 pl-3">
              <span className="min-w-0 flex-1 truncate text-xs font-bold">{conditionLabel(rule.key)}</span>
              <div className="flex h-9 w-36 items-center border border-black/10 px-2"><input inputMode="numeric" value={rule.value} onChange={event => setRules(rules.map((item, at) => (at === index ? { ...item, value: event.target.value.replace(/[^\d.]/g, '') } : item)))} className="w-full bg-transparent text-xs outline-none" placeholder="0"/>{field?.suffix && <span className="text-[10px] font-bold text-black/40">{field.suffix}</span>}</div>
              <button type="button" aria-label={`Remove ${conditionLabel(rule.key)}`} onClick={() => setRules(rules.filter((_, at) => at !== index))} className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#F0F0EC]"><X size={14}/></button>
            </div>
          })}</div>
          {unused.length > 0 && <select value="" onChange={event => { if (event.target.value) setRules([...rules, { key: event.target.value, value: '' }]) }} className={cn(inputClass, 'mt-2')} aria-label="Add a condition"><option value="">+ Add a condition</option>{unused.map(field => <option key={field.key} value={field.key}>{field.label}</option>)}</select>}
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-black/10 px-6 py-4"><MkButton secondary onClick={onClose}>Cancel</MkButton><MkButton onClick={submit} loading={save.isPending}>{existing ? 'Save changes' : 'Create segment'}</MkButton></div>
    </Dialog.Content></Dialog.Overlay></Dialog.Portal>
  </Dialog.Root>
}

/** sink's Segments tab: segment cards, who is in each, editing rules and messaging a segment. */
export default function SegmentsPage() {
  const navigate = useNavigate()
  const money = useFormatMoney()
  const { canSendMessages, canEditCustomers } = usePermissions()
  const segments = useSegments()
  const remove = useDeleteSegment()
  const list = segments.data ?? []
  const [selectedId, setSelectedId] = useState('')
  const [editing, setEditing] = useState<Segment | 'new' | null>(null)
  const selected = list.find(segment => segment.id === selectedId) ?? list[0]
  const members = useSegmentCustomers(selected?.id)

  return <div className="space-y-5">
    <PageHeading badge="AUDIENCES" title="Customer segments." subtitle="Groups that update themselves as customers buy, return or drift away." actions={canEditCustomers && <MkButton onClick={() => setEditing('new')}><Plus size={14}/>New segment</MkButton>}/>
    {segments.isError ? <Card><ErrorBlock text="We couldn’t load your segments." onRetry={() => { void segments.refetch() }}/></Card>
      : <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {segments.isLoading ? Array.from({ length: 6 }, (_, index) => <CardSkeleton key={index} footer={0}/>)
            : list.length === 0 ? <Card className="sm:col-span-2"><EmptyBlock title="No segments yet" text="Create one to group customers by how they buy."/></Card>
              : list.map(segment => <button key={segment.id} type="button" onClick={() => setSelectedId(segment.id)} aria-pressed={selected?.id === segment.id} className={cn('p-5 text-left transition', selected?.id === segment.id ? 'bg-black text-white' : 'border border-black/10 bg-white hover:border-black/40')}>
                <div className="flex items-start justify-between gap-2"><b className="text-sm">{segment.name}</b>{segment.isDefault && <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold', selected?.id === segment.id ? 'bg-white/15' : 'bg-[#F0F0EC]')}>Default</span>}</div>
                <p className="mt-4 text-3xl font-black tracking-[-.05em]">{segment.customers.toLocaleString()}</p>
                <p className={cn('text-[10px]', selected?.id === segment.id ? 'text-white/50' : 'text-black/45')}>customers · {money(segment.revenue)} revenue</p>
              </button>)}
        </div>

        {selected && <Card className="flex max-h-[70vh] min-h-[420px] flex-col overflow-hidden lg:sticky lg:top-0 lg:h-[calc(100dvh-140px)] lg:max-h-none">
          <div className="border-b border-black/10 p-5">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-lg font-black">{selected.name}</h3><p className="mt-1 text-[11px] text-black/45">Matches {selected.matchType === 'ANY' ? 'any' : 'all'} of these</p></div>
              {canEditCustomers && <div className="flex shrink-0 gap-1.5"><button type="button" aria-label="Edit segment" onClick={() => setEditing(selected)} className="grid h-9 w-9 place-items-center rounded-full border border-black/10 hover:border-black"><PenLine size={14}/></button>{!selected.isDefault && <button type="button" aria-label="Delete segment" disabled={remove.isPending} onClick={() => remove.mutate(selected.id, { onSuccess: () => { toast.success('Segment deleted'); setSelectedId('') }, onError: error => toast.error(errorMessage(error, 'Could not delete the segment.')) })} className="grid h-9 w-9 place-items-center rounded-full border border-black/10 hover:border-[#B43A16] disabled:opacity-50"><Trash2 size={14}/></button>}</div>}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">{Object.entries(selected.conditions).map(([key, value]) => <Badge key={key} tone="gray">{conditionLabel(key)}: {String(value)}</Badge>)}</div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">{[['Repeat rate', `${selected.repeatRate.toFixed(0)}%`], ['Avg spend', money(selected.avgSpend)], ['Revenue', money(selected.revenue)]].map(([label, value]) => <div key={label} className="bg-[#F6F6F2] p-2.5"><p className="text-[9px] font-extrabold uppercase text-black/40">{label}</p><b className="mt-0.5 block truncate text-xs">{value}</b></div>)}</div>
            {canSendMessages && <MkButton onClick={() => navigate(`${paths.messages}?segment=${encodeURIComponent(selected.id)}`)} className="mt-4 w-full" disabled={selected.customers === 0}><Send size={14}/>Message this segment</MkButton>}
          </div>
          <div className="min-h-0 flex-1 divide-y divide-black/10 overflow-y-auto">
            {members.isLoading ? <TableSkeleton header={false} rows={5} columns={[{ thumbnail: true, flex: true, twoLine: true }, { width: 'w-20', alignRight: true, twoLine: true }]}/>
              : (members.data ?? []).length === 0 ? <EmptyBlock title="Nobody matches yet" text="Customers join automatically when they meet the conditions."/>
                : (members.data ?? []).map(customer => <button key={customer.id} type="button" onClick={() => navigate(customerPath(customer.id))} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-[#F6F6F2]">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F0F0EC] text-[11px] font-black">{initialsOf(customer.name)}</span>
                  <span className="min-w-0 flex-1"><b className="block truncate text-xs">{customer.name}</b><span className="block truncate text-[10px] text-black/40">{customer.phone || customer.email}</span></span>
                  <span className="shrink-0 text-right"><b className="block text-xs">{money(customer.totalSpend)}</b><span className="text-[10px] text-black/40">{customer.purchases} purchases</span></span>
                </button>)}
          </div>
        </Card>}
      </div>}
    {editing && <SegmentEditor segment={editing} onClose={() => setEditing(null)}/>}
  </div>
}
