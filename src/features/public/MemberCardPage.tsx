import { useParams } from 'react-router'
import { Gift, History, Trophy } from 'lucide-react'
import { formatActivityDate } from '@/api/http'
import { useMemberWallet } from '@/api/loyalty'
import { LoyaltyCardSkeleton } from '@/components/ui/CardSkeleton'
import { LoyaltyCard } from '@/components/ui/LoyaltyCard'
import { Logo } from '@/components/ui/Logo'

/**
 * Public: a member's own card by loyalty code (GET loyalty/progress/{code}/, no sign-in):
 * the card, rewards ready, the next tier, and rewards already used.
 */
export default function MemberCardPage() {
  const { code = '' } = useParams()
  const wallet = useMemberWallet(code)
  const w = wallet.data
  return <div className="min-h-[100dvh] bg-[#F6F6F2] px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
    <div className="mx-auto max-w-sm space-y-4">
      <div className="mb-2 flex justify-center"><Logo/></div>
      {wallet.isLoading ? <LoyaltyCardSkeleton/>
        : w ? <>
          <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-black/40">My wallet</p><h1 className="mt-1 text-2xl font-black tracking-[-.05em]">Hello, {w.name.split(' ')[0] || 'there'}.</h1>{w.remaining && <p className="mt-1 text-xs text-black/55">{w.remaining}</p>}</div>
          <LoyaltyCard wallet={w} businessName={w.program}/>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[['Visits', String(w.totalVisits)], ['Streak', `🔥 ${w.streak}`], ['Points', w.points.toLocaleString()]].map(([label, value]) => <div key={label} className="bg-white p-3"><p className="text-[9px] font-extrabold uppercase text-black/40">{label}</p><b className="mt-1 block text-sm">{value}</b></div>)}
          </div>
          {w.availableRewards.length > 0 && <div className="bg-black p-4 text-white"><p className="text-[10px] font-extrabold uppercase tracking-wider text-white/45">Rewards ready</p>{w.availableRewards.map(reward => <p key={reward.id} className="mt-2 flex items-center gap-2 text-sm font-black text-[#D7FF45]"><Gift size={15}/>{reward.label}</p>)}<p className="mt-3 text-[11px] text-white/50">Show this card at the counter to claim.</p></div>}
          {w.nextTier && <div className="flex items-center gap-3 border border-black/10 bg-white p-4"><Trophy size={16} className="shrink-0"/><div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-wider text-black/40">Next tier</p><p className="truncate text-xs font-black">{w.nextTier}</p></div></div>}
          {w.history.length > 0 && <div className="border border-black/10 bg-white">
            <p className="flex items-center gap-2 border-b border-black/10 p-4 text-[10px] font-extrabold uppercase tracking-wider text-black/40"><History size={13}/>Rewards used</p>
            {w.history.map(item => <div key={item.id} className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3 last:border-0"><span className="min-w-0 truncate text-xs font-bold">{item.label}</span><span className="shrink-0 text-[10px] text-black/45">{formatActivityDate(item.date)}</span></div>)}
          </div>}
        </>
          : <div className="border border-black/10 bg-white p-6 text-center"><p className="text-sm font-black">Card not found</p><p className="mt-1 text-xs text-black/45">Check the link you were sent.</p></div>}
    </div>
  </div>
}
