import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'
import { ChevronRight, CreditCard, Eye, Plus, Send, Users, WalletCards, X } from 'lucide-react'
import { MIN_FUND_AMOUNT, NAIRA_PER_UNIT } from '@/api/campaigns'
import { formatActivityDate } from '@/api/http'
import { Badge, Card, EmptyBlock, Metric, MkButton, PageHeading, Tabs, inputClass, labelClass } from '@/components/ui/mk'
import { cn } from '@/lib/cn'
import { CampaignActions, GroupsTab, SenderIdCard, SenderIdModals, useSenderIdFlow, type SenderIdFlow } from './MessagesExtras'
import { PLACEHOLDERS, TEMPLATES, useMessages, type MessagesModel, type MessagesTab } from './hooks/useMessages'
import { TableSkeleton } from '@/components/ui/TableSkeleton'

/** sink's FundMessageCredits presets. */
const PRESETS = [1000, 5000, 10000, 25000, 50000]

function Compose({ m, sender }: { m: MessagesModel; sender: SenderIdFlow }) {
  // sink's ComposeCampaign: the sender is the approved sender ID, else the business name.
  const senderName = sender.current || m.businessName
  return <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,.75fr)]">
    <Card className="min-w-0 p-5 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-black/40">Create outreach</p><h3 className="mt-1 text-lg font-black">Write your message</h3></div>
        <div className="inline-flex rounded-full bg-[#EEEEEA] p-1">{(['SMS', 'EMAIL'] as const).map(item => <button key={item} type="button" onClick={() => m.setChannel(item)} className={cn('rounded-full px-4 py-2 text-[10px] font-extrabold', m.channel === item ? 'bg-black text-white' : 'text-black/45')}>{item === 'EMAIL' ? 'Email' : 'SMS'}</button>)}</div>
      </div>
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div><span className={labelClass}>Sender</span>
            <div className="mt-2 flex h-12 items-center justify-between gap-2 border border-black/15 bg-[#FAFAF7] pl-3 pr-1.5"><span className="min-w-0 truncate text-xs font-black">{senderName}</span>{sender.canManage && <button type="button" onClick={sender.openDialog} className="shrink-0 rounded-full border border-black/15 bg-white px-3 py-1.5 text-[10px] font-extrabold hover:border-black">{sender.current ? 'Change' : 'Set up sender ID'}</button>}</div>
            <span className="mt-1.5 block text-[10px] text-black/40">{m.channel === 'EMAIL' ? 'Displayed as the sender in the recipient’s inbox' : sender.current ? 'This is what recipients see as the sender' : 'No sender ID yet: messages go out under your business name'}</span>
          </div>
          <label className="block"><span className={labelClass}>Name (only you see it)</span><input value={m.name} onChange={event => m.setName(event.target.value)} maxLength={50} placeholder="e.g. November promo" className={cn(inputClass, 'mt-2 h-12 font-bold')}/></label>
          <label className="block"><span className={labelClass}>Send to</span>
            <select value={m.audience} onChange={event => m.setAudience(event.target.value)} className="mt-2 h-12 w-full border border-black/15 bg-white px-3 text-xs font-bold">{m.audienceOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            <span className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-black/40"><Users size={11}/>{m.estimating ? 'Counting…' : `${m.recipients.toLocaleString()} customers can be reached`}</span>
          </label>
          {m.channel === 'EMAIL' && <label className="block"><span className={labelClass}>Subject line</span><input value={m.subject} maxLength={100} onChange={event => m.setSubject(event.target.value)} className={cn(inputClass, 'mt-2 h-12 font-bold')}/></label>}
          <label className="block"><span className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-black/45"><span>Message</span><span>{m.message.length} characters{m.channel === 'SMS' && ` · ${m.smsParts} SMS part${m.smsParts > 1 ? 's' : ''}`}</span></span>
            <textarea value={m.message} onChange={event => m.setMessage(event.target.value)} className="mt-2 h-44 w-full resize-none border border-black/15 p-4 text-xs leading-relaxed outline-none focus:border-black" placeholder="Write a message your customers will love..."/>
          </label>
          <div className="flex flex-wrap gap-2">{PLACEHOLDERS.map(([label, token]) => <button key={token} type="button" onClick={() => m.insert(token)} className="rounded-full border border-black/10 px-3 py-1.5 text-[9px] font-extrabold">+ {label}</button>)}</div>
        </div>
        <div className="space-y-4">
          <div><p className={labelClass}>Quick templates</p><div className="mt-2 space-y-2">{TEMPLATES.map(([title, copy]) => <button key={title} type="button" onClick={() => m.setMessage(copy)} className="flex w-full items-center justify-between gap-2 border border-black/10 p-3 text-left hover:bg-[#F4F4F0]"><span className="min-w-0"><b className="block text-[10px]">{title}</b><small className="mt-0.5 block truncate text-[8px] text-black/40">{copy}</small></span><ChevronRight size={13} className="shrink-0"/></button>)}</div></div>
        </div>
      </div>
      <div className="mt-6 flex flex-col justify-between gap-3 border-t border-black/10 pt-5 sm:flex-row sm:items-center">
        <div><p className="text-xs font-black">{m.estimating ? 'Calculating…' : `${m.needed.toLocaleString()} credits`}</p><p className={cn('text-[9px]', m.notEnough ? 'font-bold text-[#B43A16]' : 'text-black/40')}>{m.notEnough ? `Not enough credits · you have ${m.balance.toLocaleString()}` : `${m.recipients.toLocaleString()} recipients${m.unreachable ? ` · ${m.unreachable.toLocaleString()} have no ${m.channel === 'EMAIL' ? 'email' : 'phone number'}` : ''}`}</p></div>
        {m.canSend && <MkButton onClick={m.send} loading={m.sending} disabled={m.recipients === 0}><Send size={14}/>Send to {m.recipients.toLocaleString()} customers</MkButton>}
      </div>
    </Card>
    <div className="space-y-4">
      <Card className="bg-black p-5 text-white">
        <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-white/40">{m.channel === 'EMAIL' ? 'Email' : 'SMS'} preview</p>
        {m.channel === 'SMS'
          ? <div className="mt-5 rounded-[24px] bg-white p-3 text-black"><div className="rounded-[18px] bg-[#F1F1ED] p-4"><b className="text-[10px]">{senderName}</b><p className="mt-3 whitespace-pre-wrap text-[10px] leading-relaxed">{m.preview}</p></div></div>
          : <div className="mt-5 overflow-hidden bg-white text-black"><div className="bg-[#D7FF45] p-5"><h4 className="text-xl font-black leading-tight tracking-[-.04em]">{m.subject || 'Your subject line'}</h4></div><div className="p-5"><p className="whitespace-pre-wrap text-[10px] leading-relaxed">{m.preview}</p></div></div>}
      </Card>
      <Card className="p-5"><p className="text-[9px] font-extrabold uppercase tracking-wider text-black/40">Credit balance</p><p className="mt-2 text-3xl font-black tracking-[-.05em]">{m.creditsLoading ? '—' : m.balance.toLocaleString()}</p>{m.canBuy && <button type="button" onClick={m.openBuy} className="mt-4 text-xs font-black">Buy more credits →</button>}</Card>
    </div>
  </div>
}

function Campaigns({ m }: { m: MessagesModel }) {
  return <Card className="overflow-hidden">
    <div className="flex items-center justify-between border-b border-black/10 p-5"><div><h3 className="text-sm font-black">Outreach campaigns</h3><p className="mt-1 text-[10px] text-black/45">Messages you’ve sent</p></div>{m.canSend && <MkButton onClick={() => m.setTab('compose')}><Plus size={14}/>New message</MkButton>}</div>
    {m.campaignsLoading ? <TableSkeleton rows={4} columns={[{ flex: true, twoLine: true }, { pill: true }, { width: 'w-24', hiddenOnMobile: true }, { width: 'w-24', hiddenOnMobile: true, alignRight: true }]}/>
      : m.campaigns.length === 0 ? <EmptyBlock title="No messages sent yet" text="Write your first message to bring customers back."/>
        : m.campaigns.map(campaign => <div key={campaign.id} className="grid grid-cols-[1fr_auto] gap-4 border-b border-black/10 p-4 last:border-0 md:grid-cols-[1.4fr_.6fr_.7fr_.8fr] md:items-center">
          <div className="min-w-0"><p className="truncate text-xs font-black">{campaign.name}</p><p className="mt-0.5 truncate text-[9px] text-black/40">{campaign.message}</p></div>
          <Badge tone="gray">{campaign.channel}</Badge>
          <span className="hidden text-[10px] font-bold md:block">{campaign.recipients.toLocaleString()} recipients</span>
          <span className="hidden items-center justify-end gap-3 text-[10px] text-black/45 md:flex">{formatActivityDate(campaign.createdAt)}{m.canSend && <CampaignActions campaign={campaign}/>}</span>
        </div>)}
  </Card>
}

function Automations({ m }: { m: MessagesModel }) {
  return <Card className="overflow-hidden">
    <div className="border-b border-black/10 p-5"><h3 className="text-sm font-black">Customer lifecycle automations</h3><p className="mt-1 text-[10px] text-black/45">Always-on messages triggered by customer moments.</p></div>
    {m.automationsLoading ? <TableSkeleton header={false} rows={5} columns={[{ flex: true, twoLine: true }, { pill: true }, { width: 'w-11', alignRight: true }]}/>
      : m.automationRows.map(row => <div key={row.type} className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 p-4 last:border-0">
        <div className="min-w-0"><p className="text-xs font-black">{row.name}</p><p className="mt-0.5 text-[9px] text-black/40">{row.detail}</p></div>
        <div className="flex items-center gap-3">
          <Badge tone="gray">{row.channel}</Badge>
          {m.canSend && <button type="button" role="switch" aria-checked={row.active} aria-label={`${row.name} on or off`} disabled={m.savingAutomation} onClick={() => m.toggleAutomation(row.type)} className={cn('relative h-6 w-11 rounded-full transition disabled:opacity-60', row.active ? 'bg-black' : 'bg-black/15')}><i className={cn('absolute top-1 h-4 w-4 rounded-full transition-all', row.active ? 'left-6 bg-[#D7FF45]' : 'left-1 bg-white')}/></button>}
          {m.canSend && <button type="button" aria-label={`Edit ${row.name}`} onClick={() => m.editAutomation(row.type)} className="grid h-8 w-8 place-items-center rounded-full border border-black/10"><ChevronRight size={13}/></button>}
        </div>
      </div>)}
  </Card>
}

function Credits({ m }: { m: MessagesModel }) {
  return <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
    <Card className="bg-black p-6 text-white">
      <p className="text-[9px] font-extrabold uppercase tracking-wider text-white/40">Current balance</p>
      <p className="mt-3 text-5xl font-black tracking-[-.06em]">{m.creditsLoading ? '—' : m.balance.toLocaleString()}</p>
      <p className="mt-1 text-xs text-white/40">messaging credits · {m.usedThisMonth.toLocaleString()} used this month</p>
      <div className="mt-8 border-t border-white/15 pt-5"><p className="text-[10px] text-white/45">1 credit = 1 SMS, or 3 emails · ₦{NAIRA_PER_UNIT} per credit</p></div>
      {m.canBuy && <MkButton onClick={m.openBuy} className="mt-6 !bg-[#D7FF45] !text-black"><Plus size={14}/>Buy credits</MkButton>}
    </Card>
    <Card className="overflow-hidden">
      <div className="border-b border-black/10 p-5"><h3 className="text-sm font-black">Credit activity</h3></div>
      {m.usageLoading ? <TableSkeleton header={false} rows={4} columns={[{ flex: true, twoLine: true }, { width: 'w-12', alignRight: true }]}/>
        : m.usage.length === 0 ? <EmptyBlock title="No credit activity yet" text="Purchases and sends show here."/>
          : m.usage.map((row, index) => <div key={row.id || `${row.date}-${index}`} className="flex items-center justify-between gap-3 border-b border-black/10 p-4 last:border-0"><div className="min-w-0"><p className="truncate text-xs font-black">{row.label}</p><p className="mt-0.5 truncate text-[9px] text-black/40">{[row.kind, row.channel, row.recipient, formatActivityDate(row.date)].filter(Boolean).join(' · ')}</p></div><b className={cn('shrink-0 text-xs', row.topUp && 'text-[#237A49]')}>{row.topUp ? '+' : '−'}{Math.abs(row.units).toLocaleString()}</b></div>)}
    </Card>
  </div>
}

function BuyCreditsModal({ m }: { m: MessagesModel }) {
  const [amount, setAmount] = useState('')
  const naira = Number(amount || 0)
  const units = Math.floor(naira / NAIRA_PER_UNIT)
  return <Dialog.Root open={m.buying} onOpenChange={next => { if (!next) { m.closeBuy(); setAmount('') } }}>
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"><Dialog.Content aria-describedby={undefined} className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[24px] bg-[#F6F6F2] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl outline-none sm:max-h-[90vh] sm:rounded-none sm:p-6">
      <div className="flex items-start justify-between"><div><Badge>TOP UP</Badge><Dialog.Title className="mt-3 text-xl font-black">Buy messaging credits</Dialog.Title><p className="mt-1 text-xs text-black/45">₦{NAIRA_PER_UNIT} = 1 unit · 1 unit = 1 SMS, or 3 emails.</p></div><button type="button" aria-label="Close" onClick={m.closeBuy} className="grid h-9 w-9 place-items-center rounded-full bg-black text-white"><X size={15}/></button></div>
      <div className="mt-6 flex flex-wrap gap-2">{PRESETS.map(preset => <button key={preset} type="button" onClick={() => setAmount(String(preset))} className={cn('rounded-full px-4 py-2 text-xs font-black', naira === preset ? 'bg-[#D7FF45]' : 'border border-black/15 bg-white')}>₦{preset.toLocaleString()}</button>)}</div>
      <label className="mt-4 block"><span className={labelClass}>Amount (₦)</span><input value={amount} inputMode="numeric" placeholder="0" onChange={event => setAmount(event.target.value.replace(/\D/g, ''))} className={cn(inputClass, 'mt-2')}/></label>
      <div className="mt-5 grid grid-cols-2 gap-3 bg-black p-4 text-white"><div><p className="text-[9px] font-extrabold uppercase tracking-wider text-white/40">You get</p><p className="mt-1 text-2xl font-black">{units.toLocaleString()} units</p></div><div className="text-right"><p className="text-[9px] font-extrabold uppercase tracking-wider text-white/40">You pay</p><p className="mt-1 text-2xl font-black">₦{naira.toLocaleString()}</p></div></div>
      <div className="mt-4 flex items-center gap-3 border border-black/10 bg-white p-4"><CreditCard size={17}/><div><p className="text-xs font-black">Bank transfer or debit card</p><p className="text-[9px] text-black/40">You’ll be taken to the payment page. Credits load once payment goes through.</p></div></div>
      <MkButton onClick={() => m.buy(naira)} loading={m.funding} disabled={naira < MIN_FUND_AMOUNT} className="mt-5 w-full">Continue to payment</MkButton>
    </Dialog.Content></Dialog.Overlay></Dialog.Portal>
  </Dialog.Root>
}

function AutomationEditor({ m }: { m: MessagesModel }) {
  const editing = m.editing
  return <Dialog.Root open={Boolean(editing)} onOpenChange={next => { if (!next) m.closeEditing() }}>
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"><Dialog.Content aria-describedby={undefined} className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[24px] bg-[#F6F6F2] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl outline-none sm:max-h-[90vh] sm:rounded-none sm:p-6">
      <div className="flex items-start justify-between"><Dialog.Title className="text-xl font-black">Automation message</Dialog.Title><button type="button" aria-label="Close" onClick={m.closeEditing} className="grid h-9 w-9 place-items-center rounded-full bg-black text-white"><X size={15}/></button></div>
      {editing && <div className="mt-5 space-y-4">
        <div className="inline-flex rounded-full bg-[#EEEEEA] p-1">{(['SMS', 'EMAIL'] as const).map(item => <button key={item} type="button" onClick={() => m.updateEditing({ channel: item })} className={cn('rounded-full px-4 py-2 text-[10px] font-extrabold', editing.channel === item ? 'bg-black text-white' : 'text-black/45')}>{item === 'EMAIL' ? 'Email' : 'SMS'}</button>)}</div>
        <textarea value={editing.message} onChange={event => m.updateEditing({ message: event.target.value })} placeholder="The message customers receive" className="h-36 w-full resize-none border border-black/15 bg-white p-4 text-xs outline-none focus:border-black"/>
        <label className="flex items-center justify-between border border-black/15 bg-white p-4"><b className="text-xs">Turn this automation on</b><button type="button" role="switch" aria-checked={editing.active} onClick={() => m.updateEditing({ active: !editing.active })} className={cn('relative h-6 w-11 rounded-full transition', editing.active ? 'bg-black' : 'bg-black/15')}><i className={cn('absolute top-1 h-4 w-4 rounded-full transition-all', editing.active ? 'left-6 bg-[#D7FF45]' : 'left-1 bg-white')}/></button></label>
        <div className="flex justify-end gap-2"><MkButton secondary onClick={m.closeEditing}>Cancel</MkButton><MkButton onClick={m.saveEditing} loading={m.savingAutomation}>Save</MkButton></div>
      </div>}
    </Dialog.Content></Dialog.Overlay></Dialog.Portal>
  </Dialog.Root>
}

const TABS: { value: MessagesTab; label: string }[] = [
  { value: 'compose', label: 'Compose' },
  { value: 'campaigns', label: 'Campaigns' },
  { value: 'groups', label: 'Groups' },
  { value: 'automations', label: 'Automations' },
  { value: 'credits', label: 'Credits' },
]

export default function MessagesPage() {
  const m = useMessages()
  const sender = useSenderIdFlow(m.canSend)
  const live = m.automationRows.filter(row => row.active).length
  return <div className="space-y-5">
    <PageHeading badge="OUTREACH" title="Messages that bring people back." subtitle="Send targeted SMS and email campaigns, or let automations do the work." actions={<>
      {m.canBuy && <MkButton secondary onClick={m.openBuy}><WalletCards size={14}/>Buy credits</MkButton>}
      {m.canSend && <MkButton onClick={() => m.setTab('compose')}><Plus size={14}/>New message</MkButton>}
    </>}/>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1">
      <Metric label="Available credits" value={m.creditsLoading ? '—' : m.balance.toLocaleString()} detail="SMS & email" icon={WalletCards} dark/>
      <Metric label="Used this month" value={m.creditsLoading ? '—' : m.usedThisMonth.toLocaleString()} icon={Send}/>
      <Metric label="Messages sent" value={m.campaignsLoading ? '—' : m.campaigns.length.toLocaleString()} detail={live ? `${live} automations live` : ''} icon={Eye}/>
    </div>
    <Tabs options={TABS.map(item => ({ value: item.value, label: item.value === 'automations' && live ? <>{item.label}<span className="ml-2 rounded-full bg-[#D7FF45] px-2 py-0.5 text-[8px] text-black">{live} LIVE</span></> : item.label }))} value={m.tab} onChange={m.setTab}/>
    {m.tab === 'compose' && <Compose m={m} sender={sender}/>}
    {m.tab === 'campaigns' && <Campaigns m={m}/>}
    {m.tab === 'groups' && <GroupsTab canManage={m.canSend}/>}
    {m.tab === 'automations' && <Automations m={m}/>}
    {m.tab === 'credits' && <div className="space-y-5"><Credits m={m}/><SenderIdCard flow={sender}/></div>}
    <BuyCreditsModal m={m}/>
    <SenderIdModals flow={sender}/>
    <AutomationEditor m={m}/>
  </div>
}
