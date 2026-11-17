import { useState } from 'react'
import { Copy, ExternalLink, Gift, Trophy, UserRound, Users } from 'lucide-react'
import type { Customer } from '@/api/customers'
import { useMemberWallet } from '@/api/loyalty'
import { useCardColour } from '@/api/storeTheme'
import { LoyaltyCard } from '@/components/ui/LoyaltyCard'
import { Card, EmptyBlock, MkButton, PageHeading, initialsOf } from '@/components/ui/mk'
import { CustomersSheet } from '@/features/customers/components/CustomersSheet'
import { useClipboard } from '@/hooks/useClipboard'
import { cardPath } from '@/routes/paths'
import { useBusinessDataStore } from '@/stores/business-data-store'
import { LoyaltyCardSkeleton } from '@/components/ui/CardSkeleton'

/**
 * Customer view: pick a customer from the right-hand sheet (sink's CustomersDrawer), then see the
 * wallet they see on their phone (GET loyalty/progress/{loyalty_code}/).
 */
function useCustomerWallet() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const code = customer?.loyaltyCode ?? ''
  const wallet = useMemberWallet(code)
  const { copy, copied } = useClipboard()
  const link = code ? `${window.location.origin}${cardPath(code)}` : ''
  return {
    sheetOpen, setSheetOpen,
    openSheet: () => setSheetOpen(true),
    customer,
    pick: (picked: Customer) => { setCustomer(picked); setSheetOpen(false) },
    code,
    wallet: wallet.data ?? null,
    loading: wallet.isLoading && Boolean(code),
    failed: wallet.isError,
    link,
    copied,
    copyLink: () => { if (link) void copy(link) },
    openCard: () => { if (link) window.open(link, '_blank', 'noopener') },
  }
}

export default function CustomerWalletPage() {
  const w = useCustomerWallet()
  const businessName = useBusinessDataStore(state => state.businessData?.name) || 'Your business'
  const cardColour = useCardColour()
  const first = w.wallet?.name.split(' ')[0] || w.customer?.name.split(' ')[0]

  return <div className="space-y-5">
    <PageHeading badge="CUSTOMER VIEW" title="See what your customers see." subtitle="Select a customer to preview the wallet on their phone, then share their card link." actions={<MkButton onClick={w.openSheet}><Users size={14}/>Select customer</MkButton>}/>

    {/* The selected customer, as sink's CustomerBar */}
    <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
      {w.customer
        ? <div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black text-xs font-black text-[#D7FF45]">{initialsOf(w.customer.name)}</span><div className="min-w-0"><b className="block truncate text-sm">{w.customer.name}</b><span className="block truncate text-[11px] text-black/45">{[w.customer.loyaltyCode || 'Not a loyalty member', w.customer.phone, w.customer.tier].filter(Boolean).join(' · ')}</span></div></div>
        : <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#F0F0EC]"><UserRound size={17}/></span><div><b className="block text-sm">No customer selected</b><span className="text-[11px] text-black/45">Pick one to see their card</span></div></div>}
      <div className="flex gap-2">
        {w.wallet && <MkButton secondary onClick={w.copyLink}><Copy size={14}/>{w.copied ? 'Copied' : 'Copy card link'}</MkButton>}
        <MkButton secondary onClick={w.openSheet}>{w.customer ? 'Change' : 'Select customer'}</MkButton>
      </div>
    </Card>

    {/* The member's phone */}
    <Card className="grid place-items-center bg-[#EDEDE8] p-5 sm:p-8">
      {!w.customer ? <EmptyBlock title="Choose a customer" text="Their loyalty card, progress and rewards will show here exactly as they see it." action={<MkButton onClick={w.openSheet}><Users size={14}/>Select customer</MkButton>}/>
        : !w.code ? <EmptyBlock title={`${w.customer.name} isn’t a loyalty member yet`} text="Share a program’s join QR with them, or pick another customer." action={<MkButton secondary onClick={w.openSheet}>Pick another</MkButton>}/>
          : <div className="w-full max-w-[360px]">
            <div className="rounded-[44px] border-[10px] border-black bg-[#F6F6F2] shadow-[0_30px_60px_rgba(0,0,0,.18)]">
              <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-black"/>
              <div className="space-y-4 px-4 pb-6 pt-5">
                {w.loading ? <><div className="h-6 w-32 animate-pulse bg-black/10"/><LoyaltyCardSkeleton/></>
                  : w.failed || !w.wallet ? <EmptyBlock title="Card not found" text="This member’s card couldn’t be loaded."/>
                    : <>
                      <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-black/40">My wallet</p><h3 className="mt-1 text-2xl font-black tracking-[-.05em]">Hello, {first}.</h3>{w.wallet.remaining && <p className="mt-1 text-[11px] text-black/55">{w.wallet.remaining}</p>}</div>
                      <LoyaltyCard wallet={w.wallet} businessName={businessName} colour={cardColour}/>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[['Visits', String(w.wallet.totalVisits)], ['Streak', `🔥 ${w.wallet.streak}`], ['Points', w.wallet.points.toLocaleString()]].map(([label, value]) => <div key={label} className="bg-white p-3"><p className="text-[9px] font-extrabold uppercase text-black/40">{label}</p><b className="mt-1 block text-sm">{value}</b></div>)}
                      </div>
                      {w.wallet.nextTier && <div className="flex items-center gap-3 bg-black p-4 text-white"><Trophy size={16} className="shrink-0 text-[#D7FF45]"/><div className="min-w-0"><p className="text-[9px] font-extrabold uppercase tracking-wider text-white/45">Next tier</p><p className="truncate text-xs font-black">{w.wallet.nextTier}</p></div></div>}
                      {w.wallet.availableRewards.length > 0 && <div className="space-y-2"><p className="text-[10px] font-extrabold uppercase tracking-wider text-black/40">Rewards ready</p>{w.wallet.availableRewards.map(reward => <div key={reward.id} className="flex items-center gap-2 bg-[#D7FF45] p-3 text-xs font-black"><Gift size={14}/>{reward.label}</div>)}</div>}
                    </>}
              </div>
            </div>
            {w.wallet && <MkButton onClick={w.openCard} className="mt-4 w-full"><ExternalLink size={14}/>Open their card</MkButton>}
          </div>}
    </Card>

    <CustomersSheet open={w.sheetOpen} onOpenChange={w.setSheetOpen} onSelect={w.pick} selectedId={w.customer?.id}/>
  </div>
}
