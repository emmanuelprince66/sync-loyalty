import { useState } from 'react'
import { PauseCircle, PlayCircle } from 'lucide-react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useSaveProgramme, type ProgrammeInput, type ReferralProgramme } from '@/api/referrals'
import { MkButton, inputClass, labelClass } from '@/components/ui/mk'
import { MkModal } from '@/components/ui/MkModal'
import { cn } from '@/lib/cn'

function Switch({ on }: { on: boolean }) {
  return <span className={cn('flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition', on ? 'justify-end bg-black' : 'justify-start bg-black/15')}><span className={cn('h-5 w-5 rounded-full', on ? 'bg-[#D7FF45]' : 'bg-white')}/></span>
}

function ToggleRow({ label, hint, on, onChange }: { label: string; hint: string; on: boolean; onChange: (next: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={cn('flex w-full items-center justify-between gap-3 border p-3.5 text-left transition', on ? 'border-black bg-white' : 'border-black/15 bg-white')}>
    <span className="min-w-0"><b className="block text-xs font-extrabold">{label}</b><span className="block text-[11px] text-black/50">{hint}</span></span>
    <Switch on={on}/>
  </button>
}

const FORM_ID = 'referral-programme-form'

/**
 * sink's ReferralProgrammeForm in a modal: creating a programme (no `programme`) or its Settings
 * (name, reward rate, cap, SMS/email notifications and the running switch, saved together).
 */
export function ProgrammeFormModal({ programme, onClose }: { programme?: ReferralProgramme; onClose: () => void }) {
  const editing = Boolean(programme)
  const save = useSaveProgramme()
  const [values, setValues] = useState<Required<ProgrammeInput>>({
    name: programme?.name ?? '',
    rewardPercentage: programme ? String(programme.rewardPercentage) : '5',
    rewardCap: programme ? String(programme.rewardCap) : '50',
    notifySms: programme ? programme.notifySms : true,
    notifyEmail: programme ? programme.notifyEmail : false,
    active: programme ? programme.active : true,
  })
  const [error, setError] = useState('')
  const set = <K extends keyof ProgrammeInput>(key: K, value: Required<ProgrammeInput>[K]) => setValues(current => ({ ...current, [key]: value }))

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!values.name.trim()) return setError('Give the programme a name.')
    if (!(Number(values.rewardPercentage) > 0)) return setError('Enter a reward percentage above zero.')
    const cap = Number(values.rewardCap)
    if (values.rewardCap === '' || !Number.isInteger(cap) || cap < 0) return setError('The cap must be a whole number of rewards.')
    // The running switch is only sent when editing; the create schema has no is_active.
    const input: ProgrammeInput = editing ? values : { ...values, active: undefined }
    save.mutate({ id: programme?.id, input }, {
      onSuccess: () => { toast.success(editing ? 'Programme updated' : 'Referral programme created'); onClose() },
      onError: failure => toast.error(errorMessage(failure, editing ? 'Could not update the programme' : 'Could not create the programme')),
    })
  }

  return <MkModal open onClose={onClose} kicker="Referrals" title={editing ? 'Programme Settings' : 'New Referral Programme'}
    footer={<><MkButton secondary onClick={onClose}>Cancel</MkButton><MkButton type="submit" form={FORM_ID} loading={save.isPending}>{editing ? 'Save Changes' : 'Create Programme'}</MkButton></>}>
    <form id={FORM_ID} onSubmit={submit} className="flex min-w-0 flex-col gap-5">
      {editing && <div className={cn('flex items-center justify-between gap-3 border p-3.5', values.active ? 'border-black bg-[#D7FF45]/30' : 'border-black/15 bg-white')}>
        <span className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 shrink-0">{values.active ? <PlayCircle size={18}/> : <PauseCircle size={18} className="text-black/40"/>}</span>
          <span className="min-w-0">
            <b className="block text-xs font-extrabold">{values.active ? 'Programme is running' : 'Programme is paused'}</b>
            <span className="mt-0.5 block text-[11px] leading-relaxed text-black/50">{values.active ? 'Existing links keep working and new referrals earn rewards.' : 'Links still resolve, but referrals stop earning until you start it again.'}</span>
          </span>
        </span>
        <button type="button" role="switch" aria-checked={values.active} aria-label={values.active ? 'Pause programme' : 'Start programme'} onClick={() => set('active', !values.active)}><Switch on={values.active}/></button>
      </div>}

      <label className="block"><span className={labelClass}>Programme name</span><input value={values.name} onChange={event => set('name', event.target.value)} placeholder="e.g. Bring a Friend" className={cn(inputClass, 'mt-2')}/></label>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
        <label className="block min-w-0">
          <span className={labelClass}>Reward rate (%)</span>
          <input value={values.rewardPercentage} inputMode="numeric" onChange={event => set('rewardPercentage', event.target.value.replace(/\D/g, ''))} placeholder="5" className={cn(inputClass, 'mt-2')}/>
          <span className="mt-1.5 block text-[11px] text-black/45">Share of the referred customer’s spend paid to the referrer.</span>
        </label>
        <label className="block min-w-0">
          <span className={labelClass}>Reward cap</span>
          <input value={values.rewardCap} inputMode="numeric" onChange={event => set('rewardCap', event.target.value.replace(/\D/g, ''))} placeholder="50" className={cn(inputClass, 'mt-2')}/>
          <span className="mt-1.5 block text-[11px] text-black/45">Most rewards this programme will ever pay out.</span>
        </label>
      </div>

      <div className="flex flex-col gap-3">
        <ToggleRow label="SMS notifications" hint="Text the referrer when a referral lands." on={values.notifySms} onChange={next => set('notifySms', next)}/>
        <ToggleRow label="Email notifications" hint="Email the referrer the same updates." on={values.notifyEmail} onChange={next => set('notifyEmail', next)}/>
      </div>

      {error && <p role="alert" className="bg-[#FFE6DD] px-3 py-2 text-xs font-bold text-[#B43A16]">{error}</p>}
    </form>
  </MkModal>
}
