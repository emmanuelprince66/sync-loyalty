import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { MkButton, inputClass, labelClass } from '@/components/ui/mk'
import { cn } from '@/lib/cn'
import { DateRangeFilter, fromApiDate, toApiDate } from '@/components/ui/DateRangeFilter'
import { REWARDS, TIMEOUT_ACTIONS } from '../hooks/useCreateLoyalty'
import type { ProgramDetailModel } from '../hooks/useProgramDetail'

const field = cn(inputClass, 'mt-2')

/** sink's Edit Campaign form (AddLoyaltyProgram with editData), in the design's style. */
export function EditProgramModal({ page }: { page: ProgramDetailModel }) {
  const e = page.editing
  const notifyRows = [
    ['notifyWelcome', 'Welcome message'], ['notifyProgress', 'Progress updates'], ['notifyRewardReady', 'Reward ready'], ['notifyExpiry', 'Expiry reminder'],
  ] as const
  return <Dialog.Root open={Boolean(e)} onOpenChange={next => { if (!next) page.closeEdit() }}>
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-0 sm:p-4"><Dialog.Content aria-describedby={undefined} className="max-h-[100dvh] w-full max-w-2xl overflow-y-auto bg-[#F6F6F2] shadow-2xl outline-none sm:max-h-[92vh]">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-black/10 bg-[#F6F6F2] px-6 py-4">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-black/40">Loyalty program</p><Dialog.Title className="text-xl font-black">Edit program</Dialog.Title></div>
        <button type="button" aria-label="Close" onClick={page.closeEdit} className="grid h-10 w-10 place-items-center rounded-full bg-black text-white"><X size={16}/></button>
      </div>
      {e && <div className="space-y-6 p-6">
        <section className="space-y-3">
          <label className="block"><span className={labelClass}>Name</span><input value={e.name} onChange={event => page.changeEdit({ name: event.target.value })} className={field}/></label>
          <label className="block"><span className={labelClass}>Description</span><textarea value={e.description} onChange={event => page.changeEdit({ description: event.target.value })} className="mt-2 h-20 w-full resize-none border border-black/15 bg-white p-3 text-xs outline-none focus:border-black"/></label>
          <div><span className={labelClass}>Runs <small className="normal-case text-black/35">pick the start, then the end (optional)</small></span>
            <DateRangeFilter value={e.startDate ? { from: fromApiDate(e.startDate), to: fromApiDate(e.endDate) } : undefined} onChange={next => page.changeEdit({ startDate: toApiDate(next?.from), endDate: toApiDate(next?.to && next.from && next.to.getTime() !== next.from.getTime() ? next.to : undefined) })} placeholder="Start date" align="start" className="mt-2 w-full" triggerClassName="h-11 rounded-none border-black/15"/>
          </div>
        </section>
        <section>
          <p className={labelClass}>Condition</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">{e.conditions.map((condition, index) => <label key={`${condition.type}-${index}`}><span className="text-xs font-extrabold">{condition.type === 'SPEND' ? 'Spend target' : condition.type === 'VISIT' ? 'Visits needed' : condition.type.toLowerCase()}</span>
            <div className="mt-2 flex h-11 items-center border border-black/15 bg-white px-3"><input inputMode="numeric" value={condition.threshold} onChange={event => page.changeEdit({ conditions: e.conditions.map((item, at) => (at === index ? { ...item, threshold: event.target.value.replace(/[^\d.]/g, '') } : item)) })} className="w-full bg-transparent text-sm outline-none"/><span className="text-[10px] font-bold text-black/40">{condition.type === 'SPEND' ? 'NGN' : 'VISITS'}</span></div>
          </label>)}</div>
        </section>
        <section className="grid gap-3 sm:grid-cols-2">
          <label><span className={labelClass}>Reward</span><select value={e.rewardType} onChange={event => page.changeEdit({ rewardType: event.target.value as typeof e.rewardType })} className={field}>{REWARDS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          {e.rewardType === 'FREE_ITEM' || e.rewardType === 'FREE_SERVICE'
            ? <label><span className={labelClass}>Reward description</span><input value={e.rewardDescription} onChange={event => page.changeEdit({ rewardDescription: event.target.value })} className={field}/></label>
            : <label><span className={labelClass}>Reward value</span><input inputMode="decimal" value={e.rewardValue} onChange={event => page.changeEdit({ rewardValue: event.target.value.replace(/[^\d.]/g, '') })} className={field}/></label>}
          <label><span className={labelClass}>How often</span><select value={e.rewardStyle} onChange={event => page.changeEdit({ rewardStyle: event.target.value as typeof e.rewardStyle })} className={field}><option value="CONTINUOUS">Every time</option><option value="ONE_TIME">Once only</option></select></label>
          <label><span className={labelClass}>Hours between visits</span><input inputMode="numeric" value={e.visitWindowHours} onChange={event => page.changeEdit({ visitWindowHours: event.target.value.replace(/\D/g, '') })} placeholder="24" className={field}/></label>
          <label><span className={labelClass}>Days to complete</span><input inputMode="numeric" value={e.completionWindowDays} onChange={event => page.changeEdit({ completionWindowDays: event.target.value.replace(/\D/g, '') })} placeholder="No limit" className={field}/></label>
          <label><span className={labelClass}>If time runs out</span><select value={e.timeoutAction} onChange={event => page.changeEdit({ timeoutAction: event.target.value as typeof e.timeoutAction })} className={field}>{TIMEOUT_ACTIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        </section>
        <section>
          <p className={labelClass}>Automatic messages</p>
          <div className="mt-2 divide-y divide-black/10 border border-black/15 bg-white">{notifyRows.map(([key, label]) => <div key={key} className="flex items-center justify-between p-3"><b className="text-xs">{label}</b>
            <button type="button" role="switch" aria-checked={e[key]} aria-label={label} onClick={() => page.changeEdit({ [key]: !e[key] })} className={cn('relative h-6 w-11 rounded-full transition', e[key] ? 'bg-black' : 'bg-black/15')}><i className={cn('absolute top-1 h-4 w-4 rounded-full transition-all', e[key] ? 'left-6 bg-[#D7FF45]' : 'left-1 bg-white')}/></button>
          </div>)}</div>
        </section>
      </div>}
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-black/10 bg-[#F6F6F2] px-6 py-4"><MkButton secondary onClick={page.closeEdit}>Cancel</MkButton><MkButton onClick={page.saveEdit} loading={page.saving}>Save changes</MkButton></div>
    </Dialog.Content></Dialog.Overlay></Dialog.Portal>
  </Dialog.Root>
}
