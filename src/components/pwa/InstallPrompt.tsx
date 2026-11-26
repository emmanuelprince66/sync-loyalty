import { Download, Share, SquarePlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useInstallPrompt } from './useInstallPrompt'

const DISMISS_KEY = 'synccard.installPrompt.dismissedAt'
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000
const SHOW_AFTER_MS = 2500

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

/**
 * "Download the Sync Card app" banner. Chrome/Edge (Android, desktop): an Install button that opens the
 * browser's install dialog. iPhone/iPad Safari: Share → Add to Home Screen steps. Hidden when the app is
 * already running installed, and for 7 days after "Not now". Mounted once in main.tsx.
 */
export function InstallPrompt() {
  const { mode, install } = useInstallPrompt()
  const [ready, setReady] = useState(false)
  const [hidden, setHidden] = useState(dismissedRecently)

  // A short delay so it doesn't jump in while the page is still loading.
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), SHOW_AFTER_MS)
    return () => window.clearTimeout(id)
  }, [])

  if (!ready || hidden || !mode) return null

  const notNow = () => { rememberDismiss(); setHidden(true) }
  const onInstall = async () => {
    const outcome = await install()
    if (outcome === 'dismissed') notNow()
  }

  return <section
    role="dialog"
    aria-modal="false"
    aria-labelledby="install-prompt-title"
    aria-describedby="install-prompt-body"
    className="fixed inset-x-3 z-40 mx-auto max-w-[420px] animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-[#E3E3DF] bg-white p-4 shadow-[0_18px_50px_rgba(0,0,0,.18)] sm:inset-x-auto sm:right-5 sm:mx-0 sm:w-[380px]"
    style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
  >
    <div className="flex items-start gap-3">
      <img src="/icons/icon-192.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl border border-[#E3E3DF]"/>
      <div className="min-w-0 flex-1">
        <h2 id="install-prompt-title" className="text-[15px] font-black text-[#000000]">Download the Sync Card app</h2>
        <div id="install-prompt-body" className="mt-0.5 text-[13px] leading-snug text-[#66665F]">
          {mode === 'prompt'
            ? 'Open your card in one tap from your home screen, faster and full screen.'
            : <>Tap <Share aria-hidden="true" className="mx-0.5 inline h-4 w-4 -translate-y-px align-middle text-[#1367D8]"/> <b className="text-[#000000]">Share</b>, then <SquarePlus aria-hidden="true" className="mx-0.5 inline h-4 w-4 -translate-y-px align-middle"/> <b className="text-[#000000]">Add to Home Screen</b>.</>}
        </div>
      </div>
      <button type="button" onClick={notNow} aria-label="Close" className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#66665F] hover:bg-[#F0F0EC] hover:text-[#000000]">
        <X size={17} aria-hidden="true"/>
      </button>
    </div>
    <div className="mt-3 flex justify-end gap-2">
      <Button variant="ghost" onClick={notNow}>Not now</Button>
      {mode === 'prompt' && <Button onClick={() => { void onInstall() }}><Download size={17} aria-hidden="true"/> Install</Button>}
    </div>
  </section>
}
