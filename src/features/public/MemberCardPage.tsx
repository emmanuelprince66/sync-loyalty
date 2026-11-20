import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { Check, Download, Gift, History, Link2, Printer, Share2, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { formatActivityDate } from '@/api/http'
import { useMemberWallet, usePublicProgram } from '@/api/loyalty'
import { resolveCardColour } from '@/api/storeTheme'
import { LoyaltyCardSkeleton } from '@/components/ui/CardSkeleton'
import { LoyaltyCard } from '@/components/ui/LoyaltyCard'
import { Logo } from '@/components/ui/Logo'
import { MkButton } from '@/components/ui/mk'
import { useClipboard } from '@/hooks/useClipboard'
import { downloadElementPng, fileNameFrom, printElement } from '@/lib/card-export'

/** Remembers which programme a card belongs to, so reopening /loyalty/progress/{code} later still has the business's name and colour. */
const tokenKey = (code: string) => `mk-card-program:${code}`
const readToken = (code: string) => { try { return localStorage.getItem(tokenKey(code)) ?? '' } catch { return '' } }
const saveToken = (code: string, token: string) => { try { localStorage.setItem(tokenKey(code), token) } catch { /* private mode: the link still carries it */ } }

/**
 * Public: a member's own card by loyalty code (GET loyalty/progress/{code}/, no sign-in): the card, how
 * to keep it (download, print, save or share the link), rewards ready, the next tier and rewards used.
 * The progress response has no business details, so the business name and store colour come from the
 * programme's public join response (?p={join token}, as sink's join page themes the card).
 */
export default function MemberCardPage() {
  const { code = '' } = useParams()
  const [params] = useSearchParams()
  const linkToken = params.get('p') ?? ''
  const token = linkToken || readToken(code)
  useEffect(() => { if (code && linkToken) saveToken(code, linkToken) }, [code, linkToken])

  const wallet = useMemberWallet(code)
  const program = usePublicProgram(token || undefined)
  const w = wallet.data
  const businessName = program.data?.businessName || 'Loyalty card'
  const colour = resolveCardColour(program.data?.storeTheme ?? '')

  const cardRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<'download' | 'print' | null>(null)
  const { copy, copied } = useClipboard()
  // The link to come back to: always carries the programme, so it opens the full card anywhere.
  const cardLink = `${window.location.origin}${window.location.pathname}${token ? `?p=${encodeURIComponent(token)}` : ''}`
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const download = async () => {
    setBusy('download')
    try { await downloadElementPng(cardRef.current, fileNameFrom(w?.program || businessName, 'my_card')); toast.success('Card saved. Find it in your photos or downloads.') }
    catch { toast.error('Could not save the card. Try again.') }
    finally { setBusy(null) }
  }
  const print = async () => {
    setBusy('print')
    try { await printElement(cardRef.current, w?.program || 'Loyalty card') }
    catch { toast.error('Could not prepare the card for printing.') }
    finally { setBusy(null) }
  }
  const share = async () => {
    if (!canShare) { void copy(cardLink); return }
    try { await navigator.share({ title: w?.program || 'My loyalty card', text: `My ${businessName} loyalty card`, url: cardLink }) }
    catch { /* the share sheet was closed */ }
  }

  return <div className="min-h-[100dvh] bg-[#F6F6F2] px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
    <div className="mx-auto max-w-sm space-y-5">
      <div className="mb-2 flex justify-center"><Logo/></div>
      {wallet.isLoading ? <LoyaltyCardSkeleton/>
        : w ? <>
          <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-black/40">My wallet</p><h1 className="mt-1 text-2xl font-black tracking-[-.05em]">Hello, {w.name.split(' ')[0] || 'there'}.</h1>{w.remaining && <p className="mt-1 text-xs text-black/55">{w.remaining}</p>}</div>

          <div ref={cardRef}><LoyaltyCard wallet={w} businessName={businessName} colour={colour}/></div>

          <section aria-label="Keep your card" className="space-y-3 border border-black/10 bg-white p-4">
            <div><p className="text-sm font-black">Keep your card handy</p><p className="mt-1 text-[11px] leading-relaxed text-black/50">Save it to your phone or keep the link. Show the QR code at the counter every time you visit.</p></div>
            <MkButton onClick={() => { void download() }} loading={busy === 'download'} disabled={busy !== null} className="w-full"><Download size={14}/>Download my card</MkButton>
            <div className="grid grid-cols-2 gap-3">
              <MkButton secondary onClick={() => { void share() }} className="w-full">{canShare ? <><Share2 size={14}/>Share link</> : copied ? <><Check size={14}/>Link copied</> : <><Link2 size={14}/>Copy link</>}</MkButton>
              <MkButton secondary onClick={() => { void print() }} loading={busy === 'print'} disabled={busy !== null} className="w-full"><Printer size={14}/>Print</MkButton>
            </div>
            <p className="text-[10px] leading-relaxed text-black/40">Tip: bookmark this page or add it to your home screen to open your card any time.</p>
          </section>

          <div className="grid grid-cols-3 gap-3 text-center">
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
