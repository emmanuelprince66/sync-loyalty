import * as Dialog from '@radix-ui/react-dialog'
import { ArrowLeft, ArrowRight, Check, Gift, Heart, Search, TrendingUp, Trophy, X, Zap } from 'lucide-react'
import { isDarkColour } from '@/api/storeTheme'
import { CARD_COLOURS, MkButton, StampRow, inputClass, labelClass } from '@/components/ui/mk'
import { cn } from '@/lib/cn'
import { GOALS, MECHANICS, NOTIFICATIONS, REWARDS, STYLES, TIMEOUT_ACTIONS, TIME_LIMITS, VISIT_WINDOWS, useCreateLoyalty, type CreateLoyaltyModel } from '../hooks/useCreateLoyalty'

const goalIcons = { visits: Heart, revenue: TrendingUp, streak: Zap, vip: Trophy }

/** A choice tile: black when picked, outlined otherwise. */
function Choice({ active, onClick, label, detail, lime }: { active: boolean; onClick: () => void; label: string; detail?: string; lime?: boolean }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={cn('min-h-12 p-3 text-left transition', active ? (lime ? 'bg-[#D7FF45] text-black' : 'bg-black text-white') : 'border border-black/15 bg-white hover:border-black/40')}>
    <b className="block text-[11px] font-extrabold">{label}</b>
    {detail && <span className={cn('mt-0.5 block text-[10px] leading-snug', active && !lime ? 'text-white/55' : 'text-black/45')}>{detail}</span>}
  </button>
}

function Suffixed({ label, value, onChange, suffix, placeholder, optional }: { label: string; value: string; onChange: (value: string) => void; suffix: string; placeholder?: string; optional?: boolean }) {
  return <label className="block"><span className="text-xs font-extrabold">{label}{optional && <small className="ml-1 font-bold text-black/35">optional</small>}</span>
    <div className="mt-2 flex h-11 items-center border border-black/15 bg-white px-3 focus-within:border-black"><input inputMode="numeric" value={value} placeholder={placeholder} onChange={event => onChange(event.target.value.replace(/\D/g, ''))} className="w-full bg-transparent text-sm outline-none"/><span className="text-[10px] font-bold text-black/40">{suffix}</span></div>
  </label>
}

function GoalStep({ m }: { m: CreateLoyaltyModel }) {
  return <div className="grid gap-3 sm:grid-cols-2">
    {GOALS.map(({ value, label, detail }) => {
      const Icon = goalIcons[value]
      const active = m.goal === value
      return <button key={value} type="button" aria-pressed={active} onClick={() => m.setGoal(value)} className={cn('p-4 text-left transition', active ? 'bg-black text-white' : 'border border-black/15 bg-white hover:border-black/40')}>
        <Icon size={19}/><b className="mt-5 block text-sm">{label}</b><span className={cn('mt-1 block text-[11px]', active ? 'text-white/55' : 'text-black/45')}>{detail}</span>
      </button>
    })}
  </div>
}

function RewardStep({ m }: { m: CreateLoyaltyModel }) {
  return <div className="space-y-6">
    <div>
      <p className={labelClass}>How members progress</p>
      <div className="mt-2 grid grid-cols-3 gap-2">{MECHANICS.map(item => <Choice key={item.value} active={m.mode === item.value} onClick={() => m.setMode(item.value)} label={item.label}/>)}</div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      {m.mode !== 'SPEND' && <Suffixed label="Visits needed" value={m.visits} onChange={m.setVisits} suffix="VISITS"/>}
      {m.mode !== 'VISIT' && <Suffixed label={m.mode === 'BOTH' ? 'Total spend' : 'Spend target'} value={m.spend} onChange={m.setSpend} suffix="NGN" placeholder="0"/>}
      {m.mode !== 'SPEND' && <Suffixed label="Min. spend per visit" value={m.minSpend} onChange={m.setMinSpend} suffix="NGN" placeholder="0" optional/>}
    </div>
    <div>
      <p className={labelClass}>Reward at completion</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{REWARDS.map(item => <button key={item.value} type="button" aria-pressed={m.rewardType === item.value} onClick={() => m.setRewardType(item.value)} className={cn('flex min-h-12 items-center gap-2 p-3 text-left text-[11px] font-extrabold transition', m.rewardType === item.value ? 'bg-[#D7FF45]' : 'border border-black/15 bg-white hover:border-black/40')}><Gift size={14}/>{item.label}</button>)}</div>
    </div>
    {m.needsItem
      ? <div>
        <span className="text-xs font-extrabold">{m.rewardType === 'FREE_ITEM' ? 'Which product?' : 'Which service?'}</span>
        <label className="mt-2 flex h-11 items-center gap-2 border border-black/15 bg-white px-3 focus-within:border-black"><Search size={14} className="text-black/40"/><input value={m.itemSearch} onChange={event => m.setItemSearch(event.target.value)} placeholder={`Search your ${m.rewardType === 'FREE_ITEM' ? 'products' : 'services'}`} className="w-full bg-transparent text-xs outline-none"/></label>
        <div className="mt-2 max-h-44 divide-y divide-black/10 overflow-y-auto border border-black/10 bg-white">
          {m.itemsLoading ? <p className="p-3 text-[11px] text-black/40">Loading…</p>
            : m.items.length === 0 ? <p className="p-3 text-[11px] text-black/40">No matches. Add it to your inventory first.</p>
              : m.items.map(item => <button key={item.id} type="button" onClick={() => m.pickItem(item)} className={cn('flex w-full items-center justify-between gap-3 p-3 text-left text-xs', m.rewardItem?.id === item.id ? 'bg-[#D7FF45]' : 'hover:bg-[#F6F6F2]')}><span className="truncate font-bold">{item.name}</span><span className="flex shrink-0 items-center gap-2 text-[10px] text-black/45">{item.price > 0 && `₦${item.price.toLocaleString()}`}{m.rewardItem?.id === item.id && <Check size={14} className="text-black"/>}</span></button>)}
        </div>
      </div>
      : <Suffixed label="Reward value" value={m.rewardValue} onChange={m.setRewardValue} suffix={REWARDS.find(item => item.value === m.rewardType)?.hint ?? ''} placeholder="0"/>}
  </div>
}

function RulesStep({ m }: { m: CreateLoyaltyModel }) {
  return <div className="space-y-6">
    {m.mode !== 'SPEND' && <div>
      <p className={labelClass}>When does a sale count as a new visit?</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{VISIT_WINDOWS.map(item => <Choice key={item.value} active={m.visitWindow === item.value} onClick={() => m.setVisitWindow(item.value)} label={item.label} detail={item.detail}/>)}</div>
      {m.visitWindow === -1 && <div className="mt-3 max-w-[220px]"><Suffixed label="Hours between visits" value={m.customHours} onChange={m.setCustomHours} suffix="HOURS" placeholder="0"/></div>}
    </div>}
    <div>
      <p className={labelClass}>Time to complete</p>
      <div className="mt-2 flex flex-wrap gap-2">{TIME_LIMITS.map(item => <button key={item.value} type="button" aria-pressed={m.timeLimit === item.value} onClick={() => m.setTimeLimit(item.value)} className={cn('rounded-full px-4 py-2.5 text-[11px] font-extrabold transition', m.timeLimit === item.value ? 'bg-black text-white' : 'border border-black/15 bg-white hover:border-black/40')}>{item.label}</button>)}</div>
      {m.timeLimit === -1 && <div className="mt-3 max-w-[220px]"><Suffixed label="Number of days" value={m.customDays} onChange={m.setCustomDays} suffix="DAYS" placeholder="0"/></div>}
    </div>
    {m.timeLimit !== 0 && <div>
      <p className={labelClass}>If time runs out</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">{TIMEOUT_ACTIONS.map(item => <Choice key={item.value} active={m.timeoutAction === item.value} onClick={() => m.setTimeoutAction(item.value)} label={item.label} detail={item.detail}/>)}</div>
    </div>}
    <div>
      <p className={labelClass}>How often can they earn it?</p>
      <div className="mt-2 grid grid-cols-2 gap-2">{STYLES.map(item => <Choice key={item.value} active={m.rewardStyle === item.value} onClick={() => m.setRewardStyle(item.value)} label={item.label} detail={item.detail}/>)}</div>
    </div>
  </div>
}

function FinishStep({ m }: { m: CreateLoyaltyModel }) {
  return <div className="space-y-5">
    <label className="block"><span className="text-xs font-extrabold">Program name</span><input value={m.name} onChange={event => m.setName(event.target.value)} placeholder="e.g. Coffee regulars" className={cn(inputClass, 'mt-2')}/></label>
    <label className="block"><span className="text-xs font-extrabold">Description <small className="ml-1 font-bold text-black/35">optional</small></span><textarea value={m.description} onChange={event => m.setDescription(event.target.value)} placeholder="e.g. Visit 5 times in 30 days and your next signature drink is on us." className="mt-2 h-20 w-full resize-none border border-black/15 bg-white p-3 text-xs outline-none focus:border-black"/></label>
    <div><span className="text-xs font-extrabold">Card colour <small className="ml-1 font-bold text-black/35">also your store colour</small></span><div className="mt-2 flex flex-wrap gap-2">{CARD_COLOURS.map(item => <button key={item} type="button" aria-label={`Colour ${item}`} aria-pressed={m.colour === item} onClick={() => m.setColour(item)} className={cn('h-9 w-9 rounded-full border-2', m.colour === item ? 'border-black p-1' : 'border-transparent')}><i className="block h-full w-full rounded-full" style={{ background: item }}/></button>)}</div></div>
    <div><p className={labelClass}>Messages go by</p><div className="mt-2 grid grid-cols-3 gap-2">{(['BOTH', 'SMS', 'EMAIL'] as const).map(item => <Choice key={item} active={m.channel === item} onClick={() => m.setChannel(item)} label={item === 'BOTH' ? 'SMS + Email' : item === 'EMAIL' ? 'Email only' : 'SMS only'}/>)}</div></div>
    <div>
      <p className={labelClass}>Automatic messages</p>
      <div className="mt-2 divide-y divide-black/10 border border-black/15 bg-white">{NOTIFICATIONS.map(item => <label key={item.key} className="flex cursor-pointer items-center justify-between gap-3 p-3">
        <span><b className="block text-xs">{item.label}</b><small className="text-[10px] text-black/45">{item.detail}</small></span>
        <button type="button" role="switch" aria-checked={m.notify[item.key]} aria-label={item.label} onClick={() => m.toggleNotify(item.key)} className={cn('relative h-6 w-11 shrink-0 rounded-full transition', m.notify[item.key] ? 'bg-black' : 'bg-black/15')}><i className={cn('absolute top-1 h-4 w-4 rounded-full transition-all', m.notify[item.key] ? 'left-6 bg-[#D7FF45]' : 'left-1 bg-white')}/></button>
      </label>)}</div>
    </div>
  </div>
}

/** The step bar: finished steps are clickable to go back to them. */
function StepBar({ m }: { m: CreateLoyaltyModel }) {
  return <ol className="mt-6 grid grid-cols-4 gap-2">
    {m.steps.map((item, index) => {
      const number = index + 1
      const done = number < m.step
      const current = number === m.step
      const reachable = number <= m.reached && !current
      return <li key={item.short}>
        <button type="button" disabled={!reachable} onClick={() => m.goTo(number)} aria-current={current ? 'step' : undefined} className="group w-full text-left disabled:cursor-default">
          <span className={cn('block h-1.5 rounded-full transition', current ? 'bg-black' : done ? 'bg-[#D7FF45]' : 'bg-black/10', reachable && 'group-hover:bg-black/60')}/>
          <span className={cn('mt-2 flex items-center gap-1 text-[10px] font-extrabold', current ? 'text-black' : done ? 'text-black/60' : 'text-black/30')}>{done && <Check size={11}/>}{item.short}</span>
        </button>
      </li>
    })}
  </ol>
}

/** The design's Create loyalty modal: the steps on the left, a live customer card on the right. */
export function CreateLoyaltyModal() {
  const m = useCreateLoyalty()
  const last = m.step === m.steps.length
  return <Dialog.Root open={m.open} onOpenChange={next => { if (!next) m.close() }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-0 sm:p-4">
        <Dialog.Content aria-describedby={undefined} className="max-h-[100dvh] w-full max-w-5xl overflow-y-auto bg-[#F6F6F2] shadow-2xl outline-none sm:max-h-[92vh]">
          <div className="grid lg:min-h-[650px] lg:grid-cols-[1.15fr_.85fr]">
            <div className="flex min-w-0 flex-col p-6 lg:p-8">
              <div className="flex items-start gap-3">
                {m.step > 1 && <button type="button" aria-label="Back to the previous step" onClick={m.back} className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/15 bg-white transition hover:border-black"><ArrowLeft size={16}/></button>}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-black/40">New loyalty · Step {m.step} of {m.steps.length}</p>
                  <Dialog.Title className="mt-1 text-xl font-black leading-tight sm:text-2xl">{m.title}</Dialog.Title>
                </div>
                <button type="button" aria-label="Close" onClick={m.close} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-white transition hover:bg-black/80"><X size={16}/></button>
              </div>
              <StepBar m={m}/>
              <div className="mt-7 flex-1">
                {m.step === 1 && <GoalStep m={m}/>}
                {m.step === 2 && <RewardStep m={m}/>}
                {m.step === 3 && <RulesStep m={m}/>}
                {m.step === 4 && <FinishStep m={m}/>}
              </div>
              {m.error && <p role="alert" className="mt-5 bg-[#FFE6DD] px-3 py-2 text-xs font-bold text-[#B43A16]">{m.error}</p>}
              <div className="mt-8 flex items-center justify-between gap-3 border-t border-black/10 pt-5">
                {m.step > 1
                  ? <MkButton secondary onClick={m.back}><ArrowLeft size={14}/>Back</MkButton>
                  : <MkButton secondary onClick={m.close}>Cancel</MkButton>}
                {last
                  ? <MkButton onClick={m.publish} loading={m.saving}>Create & publish<ArrowRight size={14}/></MkButton>
                  : <MkButton onClick={m.next}>Continue<ArrowRight size={14}/></MkButton>}
              </div>
            </div>
            <div className="flex items-center justify-center bg-black p-6">
              <div className="w-full max-w-[310px]">
                <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[.18em] text-white/40">Live customer preview</p>
                <div className="overflow-hidden rounded-[26px]" style={{ background: m.colour }}>
                  <div className={cn('p-6', isDarkColour(m.colour) && 'text-white')}>
                    <div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-full bg-black text-xs font-black text-white ring-1 ring-white/30">{m.preview.initials}</span><span className="max-w-[60%] truncate text-[10px] font-black uppercase tracking-wider">{m.preview.businessName}</span></div>
                    <p className="mt-9 text-[10px] font-extrabold uppercase tracking-wider">Your loyalty card</p>
                    <h3 className="mt-2 break-words text-2xl font-black leading-tight tracking-[-.05em]">{m.preview.name}.</h3>
                    <p className="mt-3 max-w-[230px] text-[11px] leading-relaxed opacity-65">{m.preview.line}</p>
                    <div className="mt-7"><StampRow total={m.preview.stamps} done={Math.min(4, m.preview.stamps - 1)} dark={isDarkColour(m.colour)}/></div>
                  </div>
                  <div className="flex items-center justify-between bg-white p-4 text-black"><div><b className="block text-[10px]">MEMBER NAME</b><span className="text-[9px] text-black/45">MEMBER CODE</span></div><span className="grid h-12 w-12 place-items-center border-4 border-black text-[8px] font-black">QR</span></div>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Portal>
  </Dialog.Root>
}
