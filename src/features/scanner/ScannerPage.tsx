import { useCardColour } from '@/api/storeTheme'
import { ArrowRight, Check, Gift, Plus, QrCode, ScanLine, Search, Sparkles, X } from 'lucide-react'
import { LoyaltyCard } from '@/components/ui/LoyaltyCard'
import { Badge, Card, MkButton } from '@/components/ui/mk'
import { CustomerFormModal } from '@/features/customers/components/CustomerFormModal'
import { useBusinessDataStore } from '@/stores/business-data-store'
import { useState } from 'react'
import { toast } from 'sonner'
import { CustomersSheet } from '@/features/customers/components/CustomersSheet'
import { Users } from 'lucide-react'
import { CameraScanner } from './CameraScanner'
import { useScanner } from './useScanner'
import { LoyaltyCardSkeleton } from '@/components/ui/CardSkeleton'

function Corners() {
  return <>
    <i className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-[#D7FF45]"/>
    <i className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-[#D7FF45]"/>
    <i className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-[#D7FF45]"/>
    <i className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-[#D7FF45]"/>
  </>
}

export default function ScannerPage() {
  const s = useScanner()
  const businessName = useBusinessDataStore(state => state.businessData?.name) || 'Your business'
  const cardColour = useCardColour()
  const [sheetOpen, setSheetOpen] = useState(false)
  return <div className="mx-auto max-w-5xl space-y-5">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge>TRANSACTION MODE</Badge><h2 className="mt-3 text-3xl font-black tracking-[-.055em]">Check in a customer.</h2><p className="mt-1 text-sm text-black/50">Scan their digital card, select them from your customers, or enter their member code.</p></div><MkButton secondary onClick={() => setSheetOpen(true)}><Users size={14}/>Select customer</MkButton></div>
    <CustomersSheet open={sheetOpen} onOpenChange={setSheetOpen} onSelect={customer => { setSheetOpen(false); if (customer.loyaltyCode) s.pick(customer.loyaltyCode); else toast.error(customer.name + ' is not a loyalty member yet.') }}/>

    {!s.code ? <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
      <Card className="flex min-h-[430px] flex-col items-center justify-center bg-black p-8 text-center text-white">
        {s.cameraOn
          ? <><CameraScanner onScan={s.onScan}/><MkButton secondary onClick={s.stopCamera} className="mt-5"><X size={14}/>Stop camera</MkButton></>
          : <>
            <span className="relative grid h-44 w-44 place-items-center border border-white/25"><Corners/><QrCode size={56} className="text-white/35"/></span>
            <h3 className="mt-6 text-lg font-black">Point camera at customer QR</h3>
            <p className="mt-1 text-xs text-white/40">The member’s card opens automatically.</p>
            <MkButton onClick={s.startCamera} className="mt-6 !bg-[#D7FF45] !text-black"><ScanLine size={15}/>Open camera</MkButton>
          </>}
      </Card>
      <Card className="p-6">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-black/40">No QR?</p>
        <h3 className="mt-2 text-xl font-black">Find member manually</h3>
        <form onSubmit={event => { event.preventDefault(); s.submitQuery() }} className="mt-6 flex h-12 items-center border border-black/15 px-4">
          <Search size={15}/><input value={s.query} onChange={event => s.setQuery(event.target.value)} className="w-full px-3 text-xs outline-none" placeholder="Member code, phone or name"/>
          <button type="submit" aria-label="Find"><ArrowRight size={16}/></button>
        </form>
        {(s.matches.length > 0 || s.searching) && <div className="mt-2 max-h-56 divide-y divide-black/10 overflow-y-auto border border-black/10">
          {s.searching && s.matches.length === 0 ? <p className="p-3 text-[10px] text-black/40">Searching…</p> : s.matches.map(member => <button key={member.id || member.code} type="button" disabled={!member.code} onClick={() => s.pick(member.code)} className="flex w-full items-center justify-between gap-3 p-3 text-left disabled:opacity-50">
            <span className="min-w-0"><b className="block truncate text-xs">{member.name}</b><span className="text-[9px] text-black/40">{member.code || 'No loyalty code'} · {member.phone}</span></span><ArrowRight size={14} className="shrink-0"/>
          </button>)}
        </div>}
        <div className="my-6 flex items-center gap-3"><i className="h-px flex-1 bg-black/10"/><span className="text-[9px] font-bold text-black/35">OR</span><i className="h-px flex-1 bg-black/10"/></div>
        {s.canRegister && <button type="button" onClick={s.register} className="flex w-full items-center justify-between border border-black/10 p-4 text-left"><span><b className="block text-xs">Register a new customer</b><small className="text-[9px] text-black/40">Takes less than a minute</small></span><Plus size={16}/></button>}
      </Card>
    </div> : <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <div>
        {s.walletLoading ? <LoyaltyCardSkeleton/>
          : s.wallet ? <LoyaltyCard wallet={s.wallet} businessName={businessName} colour={cardColour}/>
            : <Card className="p-6"><p className="text-sm font-black">Member not found</p><p className="mt-1 text-xs text-black/45">{s.walletError || 'Check the code and try again.'}</p></Card>}
      </div>
      <Card className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-black/40">Member · {s.code}</p><h3 className="mt-2 text-xl font-black">{s.wallet?.name || 'Looking up member…'}</h3></div>
          <button type="button" onClick={s.reset} className="text-xs font-extrabold">Scan next →</button>
        </div>
        {s.wallet && <div className="mt-5 grid grid-cols-3 gap-2 border-y border-black/10 py-4">
          <div><p className="text-[9px] text-black/40">VISITS</p><b>{s.wallet.totalVisits}</b></div>
          <div><p className="text-[9px] text-black/40">STREAK</p><b>🔥 {s.wallet.streak}</b></div>
          <div><p className="text-[9px] text-black/40">POINTS</p><b>{s.wallet.points.toLocaleString()}</b></div>
        </div>}
        <p className="mt-6 text-[10px] font-extrabold uppercase tracking-wider text-black/40">Rewards ready to claim</p>
        {s.rewards.length === 0
          ? <div className="mt-3 flex items-center justify-between bg-[#F0F0EC] p-4"><div><b className="block text-xs">No rewards ready yet</b><span className="text-[9px] text-black/45">{s.wallet?.remaining || 'Keep visiting to unlock a reward.'}</span></div><Sparkles size={18}/></div>
          : <div className="mt-3 space-y-2">{s.rewards.map(reward => <div key={reward.id} className="flex items-center justify-between gap-3 bg-[#D7FF45] p-4">
            <span className="flex min-w-0 items-center gap-2"><Gift size={15} className="shrink-0"/><b className="truncate text-xs">{reward.label}</b></span>
            <MkButton onClick={() => s.redeem(reward.id)} loading={s.redeemingId === reward.id} className="shrink-0"><Check size={14}/>Redeem</MkButton>
          </div>)}</div>}
        <p className="mt-6 border-t border-black/10 pt-4 text-[11px] leading-5 text-black/50">Visits and spend are added automatically when you record a sale for this customer at your till.</p>
      </Card>
    </div>}

    <CustomerFormModal open={s.registering} customer={null} onClose={s.closeRegister}/>
  </div>
}
