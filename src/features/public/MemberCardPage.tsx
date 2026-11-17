import { useParams } from 'react-router'
import { useMemberWallet } from '@/api/loyalty'
import { LoyaltyCard } from '@/components/ui/LoyaltyCard'
import { Logo } from '@/components/ui/Logo'
import { LoyaltyCardSkeleton } from '@/components/ui/CardSkeleton'

/** Public: a member's own card by loyalty code (GET loyalty/progress/{code}/, no sign-in). */
export default function MemberCardPage() {
  const { code = '' } = useParams()
  const wallet = useMemberWallet(code)
  return <div className="min-h-[100dvh] bg-[#F6F6F2] px-4 py-8">
    <div className="mx-auto max-w-sm">
      <div className="mb-6 flex justify-center"><Logo/></div>
      {wallet.isLoading ? <LoyaltyCardSkeleton/>
        : wallet.data ? <>
          <LoyaltyCard wallet={wallet.data} businessName={wallet.data.program}/>
          {wallet.data.availableRewards.length > 0 && <div className="mt-4 bg-black p-4 text-white"><p className="text-[9px] font-extrabold uppercase tracking-wider text-white/45">Rewards ready</p>{wallet.data.availableRewards.map(reward => <p key={reward.id} className="mt-2 text-sm font-black text-[#D7FF45]">{reward.label}</p>)}<p className="mt-3 text-[10px] text-white/45">Show this card at the counter to claim.</p></div>}
        </>
          : <div className="border border-black/10 bg-white p-6 text-center"><p className="text-sm font-black">Card not found</p><p className="mt-1 text-xs text-black/45">Check the link you were sent.</p></div>}
    </div>
  </div>
}
