import { Html5Qrcode } from 'html5-qrcode'
import { useEffect, useId, useRef, useState } from 'react'

/** Live camera QR reader (html5-qrcode, as sink-inventory uses). Calls onScan once with the decoded text. */
export function CameraScanner({ onScan }: { onScan: (text: string) => void }) {
  const id = `qr-${useId().replace(/:/g, '')}`
  const [error, setError] = useState('')
  const handled = useRef(false)
  const onScanRef = useRef(onScan)
  useEffect(() => { onScanRef.current = onScan }, [onScan])

  useEffect(() => {
    const reader = new Html5Qrcode(id)
    let running = false
    reader.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 220, height: 220 } }, text => {
      if (handled.current) return
      handled.current = true
      onScanRef.current(text)
    }, () => undefined)
      .then(() => { running = true })
      .catch(() => setError('We couldn’t open the camera. Allow camera access, or type the member’s code instead.'))
    return () => { if (running) reader.stop().catch(() => undefined) }
  }, [id])

  return <div className="w-full">
    <div id={id} className="mx-auto aspect-square w-full max-w-[320px] overflow-hidden bg-black"/>
    {error && <p className="mt-3 text-center text-xs text-white/70">{error}</p>}
  </div>
}
