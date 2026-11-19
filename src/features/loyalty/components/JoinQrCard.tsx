import { useRef, useState } from 'react'
import { Download, ExternalLink, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { isDarkColour } from '@/api/storeTheme'
import { MkButton } from '@/components/ui/mk'
import { QrCodeImage } from '@/components/ui/QrCode'
import { cn } from '@/lib/cn'

/**
 * The printable join card (sink's LoyaltyQrCard): business, programme, what it takes and what you get,
 * a stamp row for visit streaks, and the join QR. One component for the post-create screen and the
 * QR tab, so the preview, the download and the print are always the same card.
 * The QR is drawn from the join link (an SVG, so html2canvas never trips on a cross-origin image).
 */
export function JoinQrCard({ businessName, programName, rewardSummary, triggerSummary, stamps, joinUrl, colour }: {
  businessName: string
  programName: string
  rewardSummary: string
  triggerSummary: string
  stamps: number
  joinUrl: string
  colour: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<'download' | 'print' | null>(null)
  const dark = isDarkColour(colour)
  const fileName = `${(programName || 'loyalty').replace(/[^a-zA-Z0-9]+/g, '_')}_loyalty_card.png`

  const render = async () => {
    if (!cardRef.current) throw new Error('No card')
    const { default: html2canvas } = await import('html2canvas-pro')
    return html2canvas(cardRef.current, { scale: 3, backgroundColor: '#ffffff', useCORS: true, logging: false })
  }

  const download = async () => {
    setBusy('download')
    try {
      const canvas = await render()
      const link = document.createElement('a')
      link.download = fileName
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Card downloaded')
    } catch {
      toast.error('Could not prepare the card. Try again.')
    } finally { setBusy(null) }
  }

  /** Prints the card alone, sized to the page, from a hidden frame. */
  const print = async () => {
    setBusy('print')
    try {
      const image = (await render()).toDataURL('image/png')
      const frame = document.createElement('iframe')
      frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
      document.body.appendChild(frame)
      const doc = frame.contentWindow?.document
      if (!doc) throw new Error('No frame')
      doc.open()
      doc.write(`<!doctype html><title>${programName}</title><style>@page{margin:12mm}html,body{margin:0;height:100%;display:flex;align-items:center;justify-content:center}img{max-width:100%;max-height:100%}</style><img src="${image}" onload="setTimeout(function(){window.focus();window.print()},50)">`)
      doc.close()
      setTimeout(() => frame.remove(), 60_000)
    } catch {
      toast.error('Could not prepare the card for printing.')
    } finally { setBusy(null) }
  }

  const dots = Math.min(Math.max(stamps, 0), 10)
  return <div className="space-y-4">
    {/* The artwork: what gets downloaded and printed. */}
    <div ref={cardRef} className="mx-auto w-full max-w-[380px] bg-white p-3">
      <div className="overflow-hidden rounded-[22px]" style={{ background: colour }}>
        <div className={cn('p-6', dark && 'text-white')}>
          <div className="flex items-center justify-between gap-3"><span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-black', dark ? 'bg-white text-black' : 'bg-black text-white')}>{businessName.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()}</span><span className="truncate text-[11px] font-black uppercase tracking-wider">{businessName}</span></div>
          <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[.16em] opacity-70">Loyalty card</p>
          <h3 className="mt-1.5 break-words text-[26px] font-black leading-tight tracking-[-.05em]">{programName}.</h3>
          {(triggerSummary || rewardSummary) && <p className="mt-2 text-xs font-bold opacity-75">{[triggerSummary, rewardSummary].filter(Boolean).join(' · ')}</p>}
          {dots > 0 && <div className="mt-5 flex flex-wrap gap-1.5">{Array.from({ length: dots }, (_, index) => <span key={index} className={cn('grid h-7 w-7 place-items-center rounded-full border-2 text-[10px] font-black', dark ? 'border-white/60' : 'border-black/40', index === dots - 1 && (dark ? 'bg-white text-black' : 'bg-black text-white'))}>{index === dots - 1 ? '★' : index + 1}</span>)}</div>}
        </div>
        <div className="flex items-center justify-between gap-4 bg-white p-5 text-black">
          <div className="min-w-0"><p className="text-sm font-black">Scan to join</p><p className="mt-1 text-[11px] leading-snug text-black/55">No app needed. Your card opens on your phone.</p></div>
          <div className="shrink-0 bg-white p-1">{joinUrl ? <QrCodeImage value={joinUrl} size={104}/> : <div className="h-[104px] w-[104px] animate-pulse bg-[#ECECE8]"/>}</div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-center">
      <MkButton onClick={() => { void download() }} loading={busy === 'download'} disabled={!joinUrl}><Download size={14}/>Download QR code</MkButton>
      <MkButton secondary onClick={() => { void print() }} loading={busy === 'print'} disabled={!joinUrl}><Printer size={14}/>Print</MkButton>
      <MkButton secondary onClick={() => window.open(joinUrl, '_blank', 'noopener')} disabled={!joinUrl} className="col-span-2 sm:col-span-1"><ExternalLink size={14}/>Preview join page</MkButton>
    </div>
  </div>
}
