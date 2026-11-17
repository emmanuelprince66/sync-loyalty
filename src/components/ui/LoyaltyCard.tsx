import { Star } from 'lucide-react'
import type { MemberWallet } from '@/api/loyalty'
import { cn } from '@/lib/cn'
import { isDarkColour } from '@/api/storeTheme'
import { QrCodeImage } from './QrCode'

/** "6/7 Visits" → { done: 6, total: 7 }. */
export const parseProgress = (progress: string, fallbackDone = 0) => {
  const match = progress.match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)/)
  if (!match) return { done: fallbackDone, total: 0 }
  return { done: Number(match[1].replace(/,/g, '')), total: Number(match[2].replace(/,/g, '')) }
}

/**
 * The design's member card: business, programme, progress, member name/code and a QR the staff
 * scanner reads. The QR is the member's loyalty code.
 */
export function LoyaltyCard({ wallet, businessName, colour = '#D7FF45', className }: { wallet: MemberWallet; businessName: string; colour?: string; className?: string }) {
  const { done, total } = parseProgress(wallet.progress, wallet.visitCount)
  const isVisits = total > 0 && total <= 12
  const dark = isDarkColour(colour)
  // The QR holds the bare loyalty code, as sink's cards do, so sink's POS scanner and ours both read it.
  const qrValue = wallet.code
  return <div className={cn('overflow-hidden rounded-[26px]', className)} style={{ background: colour }}>
    <div className={cn('p-5', dark && 'text-white')}>
      <div className="flex items-center justify-between gap-3"><b className="truncate text-xs uppercase">{businessName}</b><Star size={16} fill="currentColor" className="shrink-0"/></div>
      <p className="mt-10 text-[9px] font-black uppercase tracking-widest">{wallet.program || 'Loyalty card'}</p>
      <h3 className="mt-2 text-3xl font-black tracking-[-.06em]">{wallet.progress || `${wallet.totalVisits} visits`}</h3>
      {isVisits && <div className="mt-5 flex gap-1.5">{Array.from({ length: total }, (_, index) => <i key={index} className={cn('h-6 flex-1 border', dark ? 'border-white' : 'border-black', index < done && (dark ? 'bg-white' : 'bg-black'))}/>)}</div>}
      {wallet.remaining && <p className="mt-4 text-xs font-bold opacity-70">{wallet.remaining}</p>}
    </div>
    <div className="flex items-end justify-between gap-3 bg-white p-4 text-black">
      <div className="min-w-0"><b className="block truncate text-[10px] uppercase">{wallet.name}</b><span className="text-[8px] text-black/45">{wallet.code}{wallet.tier ? ` · ${wallet.tier}` : ''}</span><p className="mt-3 text-[9px] font-bold">Show this code at checkout</p></div>
      <div className="shrink-0 bg-white"><QrCodeImage value={qrValue} size={72}/></div>
    </div>
  </div>
}
