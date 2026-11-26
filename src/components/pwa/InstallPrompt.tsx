import { Check, Download, Share, SquarePlus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { closeInstallSheet, openInstallSheet, useInstallPrompt } from './useInstallPrompt'

const DISMISS_KEY = 'synccard.installPrompt.dismissedAt'
/** After "Not now" the sheet stays away this long on its own; the Install app buttons still open it. */
const DISMISS_FOR_MS = 3 * 24 * 60 * 60 * 1000
const SHOW_AFTER_MS = 1200
const DASHBOARD_SHOW_AFTER_MS = 5000

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY))
    return Number.isFinite(at) && at > 0 && Date.now() - at < DISMISS_FOR_MS
  } catch {
    return false
  }
}

function rememberDismiss() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* private mode / storage off: hide for this visit only */ }
}

const BENEFITS = ['Your card and points one tap away', 'Opens full screen, like any app', 'Free, no app store needed']

/** The iPhone steps, numbered, with the icons people actually see in Safari. */
function IosSteps() {
  const steps = [
    <>Tap <Share aria-hidden="true" className="mx-0.5 inline h-[18px] w-[18px] -translate-y-px align-middle text-[#1367D8]"/> <b>Share</b> in Safari’s toolbar</>,
    <>Choose <SquarePlus aria-hidden="true" className="mx-0.5 inline h-[18px] w-[18px] -translate-y-px align-middle"/> <b>Add to Home Screen</b></>,
    <>Tap <b>Add</b>. Sync Card is now on your home screen.</>,
  ]
  return <ol className="mt-4 space-y-2.5">
    {steps.map((step, index) => <li key={index} className="flex items-center gap-3 rounded-2xl bg-[#F6F6F2] px-3 py-2.5 text-[13px] leading-snug text-black">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-black text-[11px] font-black text-[#D7FF45]">{index + 1}</span>
      <span className="min-w-0">{step}</span>
    </li>)}
  </ol>
}

/**
 * "Get the Sync Card app": a bottom sheet over a dimmed page, shown shortly after any page opens (customers'
 * card and join pages included) and whenever an Install app button is tapped. Chrome/Edge (Android, desktop) get
 * a big Install button; iPhone/iPad Safari get the Share → Add to Home Screen steps. Never shown once installed;
 * "Not now" keeps it away for 3 days. Mounted once in main.tsx.
 */
export function InstallPrompt() {
  const { mode, requested, install } = useInstallPrompt()
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState(dismissedRecently)
  const primary = useRef<HTMLButtonElement>(null)

  // Shown on its own only while no other dialog is open (e.g. an upgrade prompt), so the two never stack.
  useEffect(() => {
    let id = 0
    const check = () => {
      if (document.querySelector('[role="dialog"]')) { id = window.setTimeout(check, 2000); return }
      setReady(true)
    }
    // Customer pages (card, join) open it quickly. The business dashboard may open its own prompts
    // (e.g. custom domain) once its data loads, so it waits longer there and then checks again.
    const customerPage = window.location.pathname.startsWith('/loyalty/')
    id = window.setTimeout(check, customerPage ? SHOW_AFTER_MS : DASHBOARD_SHOW_AFTER_MS)
    return () => window.clearTimeout(id)
  }, [])

  const open = Boolean(mode) && (requested || (ready && !dismissed))

  useEffect(() => {
    if (!open) return
    primary.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') notNow() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!open) return null

  function notNow() { rememberDismiss(); setDismissed(true); closeInstallSheet() }
  const onInstall = async () => {
    const outcome = await install()
    if (outcome === 'dismissed') notNow()
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
    <button type="button" aria-label="Close" tabIndex={-1} onClick={notNow} className="absolute inset-0 animate-in fade-in bg-black/45 backdrop-blur-[2px]"/>
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-title"
      className="relative w-full max-w-[440px] animate-in slide-in-from-bottom-6 fade-in rounded-t-[28px] bg-white p-5 shadow-[0_-12px_50px_rgba(0,0,0,.25)] sm:rounded-[28px] sm:p-6"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
    >
      <span className="mx-auto mb-4 block h-1.5 w-10 rounded-full bg-black/15 sm:hidden" aria-hidden="true"/>
      <button type="button" onClick={notNow} aria-label="Close" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-black/55 hover:bg-[#F0F0EC] hover:text-black">
        <X size={18} aria-hidden="true"/>
      </button>

      <div className="flex items-center gap-4 pr-8">
        <img src="/icons/icon-192.png" alt="" width={64} height={64} className="h-16 w-16 shrink-0 rounded-[18px] border border-black/10 shadow-sm"/>
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-black/45">Free app</p>
          <h2 id="install-title" className="mt-0.5 text-xl font-black leading-tight tracking-[-.03em] text-black">Get the Sync Card app</h2>
        </div>
      </div>

      {mode === 'prompt'
        ? <>
          <ul className="mt-4 space-y-2">
            {BENEFITS.map(text => <li key={text} className="flex items-center gap-2.5 text-[13px] font-semibold text-black/75">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#D7FF45] text-black"><Check size={12} strokeWidth={3} aria-hidden="true"/></span>{text}
            </li>)}
          </ul>
          <button ref={primary} type="button" onClick={() => { void onInstall() }} className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-black text-[15px] font-black text-white transition hover:bg-[#272727] active:scale-[.98]">
            <Download size={18} aria-hidden="true"/> Install the app
          </button>
        </>
        : <>
          <p className="mt-3 text-[13px] leading-snug text-black/60">Add Sync Card to your home screen in three taps. It opens full screen, like any app.</p>
          <IosSteps/>
          <button ref={primary} type="button" onClick={notNow} className="mt-5 flex h-[52px] w-full items-center justify-center rounded-full bg-black text-[15px] font-black text-white transition hover:bg-[#272727] active:scale-[.98]">Got it</button>
        </>}
      <button type="button" onClick={notNow} className="mt-2 h-10 w-full rounded-full text-[13px] font-extrabold text-black/55 hover:text-black">Not now</button>
    </section>
  </div>
}

/** Always-visible way back to the sheet: a bright pill for the app header. Hidden when installing isn't possible. */
export function InstallAppButton({ className }: { className?: string }) {
  const { mode } = useInstallPrompt()
  if (!mode) return null
  return <button type="button" onClick={openInstallSheet} className={cn('inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#D7FF45] px-3.5 text-xs font-black text-black shadow-[0_0_0_3px_rgba(215,255,69,.35)] transition hover:brightness-95 active:scale-[.98]', className)}>
    <Download size={15} aria-hidden="true"/><span>Install app</span>
  </button>
}

/** A full-width card for customer pages (member card, join): the app, what it gives, and the Install button. */
export function InstallAppCard({ className }: { className?: string }) {
  const { mode } = useInstallPrompt()
  if (!mode) return null
  return <section aria-label="Get the Sync Card app" className={cn('flex items-center gap-3 rounded-[22px] bg-black p-4 text-white', className)}>
    <img src="/icons/icon-192.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-[14px] bg-white"/>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-black">Get the Sync Card app</p>
      <p className="mt-0.5 text-[11px] leading-snug text-white/60">Your card on your home screen, one tap away.</p>
    </div>
    <button type="button" onClick={openInstallSheet} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#D7FF45] px-4 text-xs font-black text-black transition hover:brightness-95 active:scale-[.98]">
      <Download size={15} aria-hidden="true"/>Install
    </button>
  </section>
}
