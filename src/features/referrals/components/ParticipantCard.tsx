import { useState } from 'react'
import { BadgeCheck, Check, Copy, Link2, Medal } from 'lucide-react'
import type { ReferralParticipant } from '@/api/referrals'
import { initialsOf } from '@/components/ui/mk'
import { useClipboard } from '@/hooks/useClipboard'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { shortDate } from './shared'

/** sink's ParticipantCard: who they are, their link to share, what it has brought in, and a details drawer. */
export function ParticipantCard({ participant }: { participant: ReferralParticipant }) {
  const money = useFormatMoney()
  const { copy, copied } = useClipboard()
  const [open, setOpen] = useState(false)
  const added = shortDate(participant.createdAt)
  const details = [
    { label: 'Referral code', value: participant.code || '—' },
    { label: 'Phone', value: participant.phone || '—' },
    { label: 'Pending', value: String(Math.max(0, participant.referrals - participant.paid)) },
    { label: 'Added', value: added ?? '—' },
  ]

  return <div className="min-w-0 border border-black/10 bg-white p-4">
    <div className="flex min-w-0 items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-[11px] font-black text-[#D7FF45]">{participant.initials || initialsOf(participant.name)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <b className="min-w-0 truncate text-sm">{participant.name || 'Customer'}</b>
          {participant.code && <span className="rounded-full bg-[#EEE9FF] px-2 py-0.5 font-mono text-[10px] font-extrabold text-[#5E49A8]">{participant.code}</span>}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-black/45">{participant.phone}{added ? ` · Added ${added}` : ''}</p>
      </div>
    </div>

    {participant.link && <div className="mt-3 flex min-w-0 items-center gap-2 bg-[#F6F6F2] py-2 pl-3 pr-1.5">
      <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-black/65">{participant.link}</span>
      <button type="button" onClick={() => { void copy(participant.link) }} aria-label={`Copy ${participant.name}’s referral link`} className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-black px-3 text-[11px] font-extrabold text-white hover:bg-[#272727]">{copied ? <Check size={12}/> : <Copy size={12}/>}<span className="hidden sm:inline">{copied ? 'Copied' : 'Copy Link'}</span></button>
    </div>}

    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/10 pt-3">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-black/50">
        <span className="flex items-center gap-1"><Link2 size={13} className="text-black/35"/><b className="text-black">{participant.referrals}</b>referrals</span>
        <span className="flex items-center gap-1"><BadgeCheck size={13} className="text-[#237A49]"/><b className="text-black">{participant.paid}</b>paid</span>
        <span className="flex items-center gap-1"><Medal size={13} className="text-[#FF6B3D]"/><b className="text-[#B43A16]">{money(participant.earned)}</b>earned</span>
      </div>
      <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="shrink-0 rounded-full border border-black/15 px-3 py-1.5 text-[11px] font-extrabold hover:border-black">{open ? 'View Less' : 'View More'}</button>
    </div>

    {open && <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-black/10 pt-3 sm:grid-cols-4">
      {details.map(item => <div key={item.label} className="min-w-0"><dt className="text-[10px] text-black/45">{item.label}</dt><dd className="truncate text-xs font-extrabold">{item.value}</dd></div>)}
    </dl>}
  </div>
}
