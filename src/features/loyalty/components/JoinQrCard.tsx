import { forwardRef, useRef, useState } from 'react'
import { Check, Copy, Download, ExternalLink, Printer, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { useLoyaltyTheme, type LoyaltyTheme } from '@/api/storeTheme'
import { MkButton } from '@/components/ui/mk'
import { QrCodeImage } from '@/components/ui/QrCode'
import { useClipboard } from '@/hooks/useClipboard'
import { cn } from '@/lib/cn'

/** Stamps drawn on the card. A long streak would make it too tall to print on one page; the reward box still states the real target. */
const MAX_STAMPS = 8

type CardContent = {
  businessName: string
  programName: string
  rewardSummary: string
  triggerSummary: string
  stamps: number
  joinUrl: string
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'MK'

/**
 * The artwork customers scan, laid out as sink's LoyaltyQrCard: store-colour header with the business,
 * the programme and its stamp row, the reward, the join QR, and a store-colour footer.
 * Everything is drawn from the store colour (business.store_theme), so it matches the storefront.
 * The QR is an SVG made from the join link (never the backend's qr_url image, which encodes the bare
 * token and has no CORS headers, so html2canvas can't export it).
 */
const CardArtwork = forwardRef<HTMLDivElement, CardContent & { theme: LoyaltyTheme; className?: string }>(function CardArtwork({ businessName, programName, rewardSummary, triggerSummary, stamps, joinUrl, theme, className }, ref) {
  const dots = Math.min(Math.max(stamps, 0), MAX_STAMPS)
  const onBaseSoft = theme.onBase === '#ffffff' ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.1)'
  return <div ref={ref} className={cn('overflow-hidden rounded-[22px] border border-black/10 bg-white text-black', className)}>
    <div className="relative px-5 pb-5 pt-5" style={{ backgroundImage: `linear-gradient(135deg, ${theme.base}, ${theme.dark})`, color: theme.onBase }}>
      <p className="text-[9px] font-extrabold uppercase tracking-[.2em] opacity-70">Loyalty card</p>
      <p className="mt-1 truncate pr-12 text-[22px] font-black leading-tight tracking-[-.04em]">{businessName}</p>
      <span className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full text-[11px] font-black" style={{ background: onBaseSoft }}>{initials(businessName)}</span>
    </div>

    <div className="px-5 py-5">
      <p className="break-words text-base font-black leading-snug tracking-[-.02em]">{programName}</p>

      {dots > 0 && <>
        <p className="mt-4 text-[9px] font-extrabold uppercase tracking-[.16em] text-black/40">Your progress</p>
        <div className="mt-2 flex flex-wrap items-start gap-2">
          {Array.from({ length: dots }, (_, index) => <div key={index} className="flex flex-col items-center gap-1">
            <span className="grid h-8 w-8 place-items-center rounded-full border-2 text-[11px] font-black" style={{ borderColor: theme.surfaceBorder, color: theme.qrFg }}>{index + 1}</span>
            <span className="text-[7px] font-bold text-black/40">Visit {index + 1}</span>
          </div>)}
          <div className="flex flex-col items-center gap-1">
            <span className="grid h-8 w-8 place-items-center rounded-full text-sm" style={{ background: theme.base, color: theme.onBase }}><Trophy size={14}/></span>
            <span className="text-[7px] font-bold text-black/40">Reward</span>
          </div>
        </div>
      </>}

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: theme.surfaceBorder, background: theme.surface }}>
        <div className="min-w-0">
          <p className="text-[9px] font-extrabold uppercase tracking-[.16em]" style={{ color: theme.qrFg }}>Your reward</p>
          <p className="mt-0.5 break-words text-lg font-black leading-tight">{rewardSummary || 'Reward'}</p>
          <p className="mt-0.5 text-[10px] text-black/50">{triggerSummary ? `After ${triggerSummary}` : 'Complete the streak'}</p>
        </div>
        <span className="shrink-0 text-2xl" aria-hidden="true">🎉</span>
      </div>

      <div className="mt-3 flex items-center gap-4 rounded-2xl bg-[#F4F4F0] p-4">
        <div className="shrink-0 rounded-lg bg-white p-1.5">{joinUrl ? <QrCodeImage value={joinUrl} size={96} fgColor={theme.qrFg} title={`Scan to join ${programName}`}/> : <div className="h-24 w-24 animate-pulse bg-[#ECECE8]"/>}</div>
        <div className="min-w-0">
          <p className="text-sm font-black" style={{ color: theme.qrFg }}>Scan to join</p>
          <p className="mt-1 text-[10px] leading-relaxed text-black/55">No app needed. Scan with your camera and your card opens on your phone.</p>
        </div>
      </div>
    </div>

    <div className="flex items-center justify-between gap-3 px-5 py-2.5" style={{ background: theme.base, color: theme.onBase }}>
      <p className="text-[9px] font-extrabold opacity-90">Powered by maheleKart</p>
      <p className="truncate text-[9px] opacity-70">{triggerSummary || 'Loyalty'}</p>
    </div>
  </div>
})

/**
 * The join card with its actions (sink's LoyaltyQrCard): copy link, download PNG, print, preview.
 *  compact  a short summary row; the full artwork is laid out off-screen and is what gets downloaded
 *           and printed (for modals, as sink's Share Campaign)
 *  full     the artwork itself, on show (the QR code tab)
 * Preview, download and print are always the same card.
 */
export function JoinQrCard({ variant = 'compact', previewUrl, ...content }: CardContent & { variant?: 'compact' | 'full'; previewUrl?: string }) {
  const theme = useLoyaltyTheme()
  const cardRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<'download' | 'print' | null>(null)
  const { copy, copied } = useClipboard()
  const { joinUrl, programName } = content
  const fileName = `${(programName || 'loyalty').replace(/[^a-zA-Z0-9]+/g, '_')}_loyalty_card.png`

  const render = async () => {
    if (!cardRef.current) throw new Error('No card')
    const { default: html2canvas } = await import('html2canvas-pro')
    return html2canvas(cardRef.current, { scale: 3, backgroundColor: null, logging: false })
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

  /** Prints the card alone, centred on the page, from a hidden frame (no pop-up to block). */
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
      doc.write(`<!doctype html><title>${programName.replace(/</g, '')}</title><style>@page{margin:12mm}html,body{margin:0;height:100%;display:flex;align-items:center;justify-content:center}img{width:340px;max-width:100%}</style><img src="${image}" onload="setTimeout(function(){window.focus();window.print()},50)">`)
      doc.close()
      setTimeout(() => frame.remove(), 60_000)
    } catch {
      toast.error('Could not prepare the card for printing.')
    } finally { setBusy(null) }
  }

  const ready = Boolean(joinUrl)
  return <div className="flex w-full min-w-0 flex-col gap-3">
    {variant === 'full'
      ? <CardArtwork ref={cardRef} {...content} theme={theme} className="mx-auto w-full max-w-[360px]"/>
      : <>
        <div className="flex w-full min-w-0 items-center gap-3 border border-black/10 bg-white p-3 sm:gap-4 sm:p-4">
          <div className="shrink-0 border border-black/10 bg-white p-1.5">{ready ? <QrCodeImage value={joinUrl} size={88} fgColor={theme.qrFg} title={`Scan to join ${programName}`}/> : <div className="h-[88px] w-[88px] animate-pulse bg-[#ECECE8]"/>}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black">{programName}</p>
            <p className="mt-0.5 truncate text-xs text-black/45">{content.businessName}</p>
            <p className="mt-2 truncate text-sm font-black" style={{ color: theme.qrFg }}>{content.rewardSummary || 'Reward'}</p>
            {content.triggerSummary && <p className="truncate text-[11px] text-black/45">After {content.triggerSummary}</p>}
          </div>
        </div>
        {/* The export target: laid out (html2canvas can't draw display:none) inside a zero-size box, so
            it never widens the modal. Not `fixed`: the modal's transform would make it scroll with it. */}
        <div aria-hidden="true" className="pointer-events-none h-0 w-0 overflow-hidden"><CardArtwork ref={cardRef} {...content} theme={theme} className="w-[360px]"/></div>
      </>}

    {ready && <button type="button" onClick={() => { void copy(joinUrl) }} title="Copy the join link" className="flex w-full min-w-0 items-center justify-between gap-3 border border-black/15 bg-white py-2 pl-3.5 pr-2 text-left transition hover:border-black">
      <span className="min-w-0 flex-1 truncate font-mono text-[11px] leading-6 text-black/60">{joinUrl}</span>
      <span className={cn('grid h-7 w-7 shrink-0 place-items-center', copied ? 'text-[#237A49]' : 'text-black/45')}>{copied ? <Check size={14}/> : <Copy size={14}/>}</span>
    </button>}

    <div className="grid w-full min-w-0 grid-cols-1 gap-2 min-[400px]:grid-cols-2">
      <MkButton onClick={() => { void download() }} loading={busy === 'download'} disabled={!ready || busy !== null} className="w-full"><Download size={14}/>Download card</MkButton>
      <MkButton secondary onClick={() => { void print() }} loading={busy === 'print'} disabled={!ready || busy !== null} className="w-full"><Printer size={14}/>Print card</MkButton>
    </div>
    <MkButton secondary onClick={() => window.open(previewUrl || joinUrl, '_blank', 'noopener,noreferrer')} disabled={!ready} className="w-full"><ExternalLink size={14}/>Preview customer sign-up page</MkButton>
  </div>
}
