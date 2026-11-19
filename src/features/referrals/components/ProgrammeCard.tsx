import { Link } from 'react-router'
import { ArrowRight, Mail, MessageSquare } from 'lucide-react'
import type { ReferralProgramme } from '@/api/referrals'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { cn } from '@/lib/cn'
import { referralProgrammePath } from '@/routes/paths'
import { capUsage, shortDate } from './shared'

/** sink's ReferralProgrammeCard: rate, cap, notifications, cap usage, totals and Manage. */
export function ProgrammeCard({ programme }: { programme: ReferralProgramme }) {
  const money = useFormatMoney()
  const { cap, pct, label } = capUsage(programme)
  const stats = [
    { value: programme.participants.toLocaleString(), label: 'Participants' },
    { value: programme.referrals.toLocaleString(), label: 'Referrals' },
    { value: money(programme.totalPaid), label: 'Paid Out' },
  ]

  return <div className="min-w-0 bg-black p-5 text-white sm:p-6">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-black">{programme.name}</h3>
        <p className="mt-1 text-[11px] text-[#D7FF45]">Created {shortDate(programme.createdAt) ?? '—'}</p>
      </div>
      <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold', programme.active ? 'bg-[#D7FF45] text-black' : 'bg-white/10 text-white/60')}>{programme.active ? 'Active' : 'Paused'}</span>
    </div>

    <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
      <div className="flex gap-8">
        <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#D7FF45]">Reward Rate</p><p className="text-2xl font-black tracking-[-.04em]">{programme.rewardPercentage}%</p></div>
        <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#D7FF45]">Cap</p><p className="text-2xl font-black tracking-[-.04em]">{cap}</p></div>
      </div>
      <div className="flex shrink-0 gap-1.5">
        {programme.notifySms && <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-white/70" title="SMS notification on"><MessageSquare size={12}/></span>}
        {programme.notifyEmail && <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-white/70" title="Email notification on"><Mail size={12}/></span>}
      </div>
    </div>

    <div className="mt-5">
      <div className="flex items-center justify-between gap-2 text-[10px]"><span className="min-w-0 truncate text-white/60">Cap usage — {label} rewards</span><b className="shrink-0 text-[#D7FF45]">{pct}%</b></div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#D7FF45]" style={{ width: `${pct}%` }}/></div>
    </div>

    <div className="mt-5 grid grid-cols-3 gap-2">
      {stats.map(stat => <div key={stat.label} className="min-w-0 bg-white/10 px-2 py-3 text-center"><p className="truncate text-sm font-black sm:text-base">{stat.value}</p><p className="mt-0.5 truncate text-[10px] text-white/50">{stat.label}</p></div>)}
    </div>

    <Link to={referralProgrammePath(programme.id)} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#D7FF45] text-xs font-extrabold text-black transition hover:bg-[#c8f030]">Manage Programme<ArrowRight size={14}/></Link>
  </div>
}
