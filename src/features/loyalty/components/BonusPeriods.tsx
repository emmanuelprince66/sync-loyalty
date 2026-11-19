import { useState } from 'react'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { WEEK_DAYS, useBonusPeriods, useCreateBonusPeriod, useDeleteBonusPeriod, useUpdateBonusPeriod, type BonusPeriodInput, type WeekDay } from '@/api/loyalty'
import { Card, EmptyBlock, MkButton, inputClass, labelClass } from '@/components/ui/mk'
import { cn } from '@/lib/cn'
import { DateRangeFilter, fromApiDate, toApiDate } from '@/components/ui/DateRangeFilter'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { MkModal } from '@/components/ui/MkModal'

const EMPTY: BonusPeriodInput = { name: '', multiplier: '2', days: [], startDate: '', endDate: '' }
const short = (day: WeekDay) => day.slice(0, 3).toLowerCase().replace(/^./, c => c.toUpperCase())

/** sink's BonusPeriods: times a visit or spend counts extra (e.g. 2x on Tuesdays). */
export function BonusPeriods({ programId, canManage }: { programId: string; canManage: boolean }) {
  const periods = useBonusPeriods(programId)
  const create = useCreateBonusPeriod()
  const update = useUpdateBonusPeriod()
  const remove = useDeleteBonusPeriod()
  const [form, setForm] = useState<BonusPeriodInput | null>(null)

  const save = () => {
    if (!form) return
    if (!form.name.trim()) return toast.error('Name the bonus period.')
    if (!(Number(form.multiplier) > 1)) return toast.error('The multiplier must be more than 1.')
    if (form.days.length === 0 && !form.startDate) return toast.error('Pick the days, or a date range.')
    create.mutate({ programId, input: form }, {
      onSuccess: () => { toast.success('Bonus period added'); setForm(null) },
      onError: error => toast.error(errorMessage(error, 'Could not add the bonus period.')),
    })
  }
  const list = periods.data ?? []

  return <Card className="overflow-hidden">
    <div className="flex items-center justify-between gap-3 border-b border-black/10 p-5">
      <div><h3 className="flex items-center gap-2 text-sm font-black"><Sparkles size={15}/>Bonus periods</h3><p className="mt-1 text-[11px] text-black/45">Visits and spend count extra at these times</p></div>
      {canManage && <MkButton secondary onClick={() => setForm(EMPTY)}><Plus size={14}/>Add</MkButton>}
    </div>
    {periods.isLoading ? <TableSkeleton header={false} rows={2} columns={[{ flex: true, twoLine: true }, { width: 'w-20', alignRight: true }]}/>
      : list.length === 0 ? (<EmptyBlock title="No bonus periods" text="Add one to make quiet days busier, like double visits on Tuesdays."/>)
        : list.map(period => <div key={period.id} className="flex items-center justify-between gap-3 border-b border-black/10 p-4 last:border-0">
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate text-xs font-black">{period.name}<span className="rounded-full bg-[#D7FF45] px-2 py-0.5 text-[10px]">{period.multiplier}×</span></p>
            <p className="mt-1 truncate text-[10px] text-black/45">{period.days.length ? period.days.map(short).join(', ') : 'Every day'}{period.startDate ? ` · ${period.startDate}${period.endDate ? ` to ${period.endDate}` : ''}` : ''}</p>
          </div>
          {canManage && <div className="flex shrink-0 items-center gap-2">
            <button type="button" role="switch" aria-checked={period.active} aria-label={`${period.name} on`} disabled={update.isPending} onClick={() => update.mutate({ id: period.id, patch: { is_active: !period.active } }, { onError: error => toast.error(errorMessage(error, 'Could not update the bonus period.')) })} className={cn('relative h-6 w-11 rounded-full transition disabled:opacity-50', period.active ? 'bg-black' : 'bg-black/15')}><i className={cn('absolute top-1 h-4 w-4 rounded-full transition-all', period.active ? 'left-6 bg-[#D7FF45]' : 'left-1 bg-white')}/></button>
            <button type="button" aria-label={`Remove ${period.name}`} disabled={remove.isPending} onClick={() => remove.mutate(period.id, { onSuccess: () => toast.success('Bonus period removed'), onError: error => toast.error(errorMessage(error, 'Could not remove it.')) })} className="grid h-8 w-8 place-items-center rounded-full border border-black/10 disabled:opacity-50"><Trash2 size={13}/></button>
          </div>}
        </div>)}
    <MkModal open={Boolean(form)} onClose={() => setForm(null)} kicker="Bonus periods" title="New bonus period" size="sm" footer={<><MkButton secondary onClick={() => setForm(null)}>Cancel</MkButton><MkButton onClick={save} loading={create.isPending}>Save</MkButton></>}>
      {form && <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <label><span className={labelClass}>Name</span><input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="e.g. Double Tuesdays" className={cn(inputClass, 'mt-2')}/></label>
        <label><span className={labelClass}>Multiplier</span><div className="mt-2 flex h-11 items-center border border-black/15 bg-white px-3"><input inputMode="decimal" value={form.multiplier} onChange={event => setForm({ ...form, multiplier: event.target.value.replace(/[^\d.]/g, '') })} className="w-full bg-transparent text-xs outline-none"/><span className="text-[10px] font-bold text-black/40">×</span></div></label>
      </div>
      <div><span className={labelClass}>Days</span><div className="mt-2 flex flex-wrap gap-1.5">{WEEK_DAYS.map(day => {
        const on = form.days.includes(day)
        return <button key={day} type="button" aria-pressed={on} onClick={() => setForm({ ...form, days: on ? form.days.filter(item => item !== day) : [...form.days, day] })} className={cn('h-9 min-w-12 rounded-full px-3 text-[11px] font-extrabold', on ? 'bg-black text-white' : 'border border-black/15 bg-white')}>{short(day)}</button>
      })}</div></div>
      <div><span className={labelClass}>Dates <small className="normal-case text-black/35">optional</small></span>
        <DateRangeFilter value={form.startDate ? { from: fromApiDate(form.startDate), to: fromApiDate(form.endDate) } : undefined} onChange={next => setForm({ ...form, startDate: toApiDate(next?.from), endDate: toApiDate(next?.to) })} placeholder="Any dates" align="start" className="mt-2 w-full" triggerClassName="h-11 rounded-none border-black/15"/>
      </div>
      </div>}
    </MkModal>
  </Card>
}
