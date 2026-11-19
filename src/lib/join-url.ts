import { joinPath } from '@/routes/paths'

/**
 * Join links, as sink's loyaltyJoinUrl: a QR someone scans, or a card that gets printed, must never
 * point at localhost (a customer's phone can't open it). On localhost, VITE_PUBLIC_SITE_URL is used
 * when set; on the live site its own address is the public one.
 */
const SITE = (import.meta.env.VITE_PUBLIC_SITE_URL ?? '').trim().replace(/\/+$/, '')
const isLocal = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin)

const publicOrigin = () => (isLocal(window.location.origin) && SITE ? SITE : window.location.origin)

/** For the QR, the printed card and the copied link. */
export const joinUrl = (token: string) => (token ? `${publicOrigin()}${joinPath(token)}` : '')

/** For opening in this browser (Preview, Landing page): keeps the dev server previewable. */
export const joinUrlHere = (token: string) => (token ? `${window.location.origin}${joinPath(token)}` : '')
