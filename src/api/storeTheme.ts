import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './query-keys'
import { requireBusinessId, useCurrentBusiness } from './business'
import { apiFormRequest, asRecord, str } from './http'
import { apiRequest } from '@/lib/api-client'

/**
 * The loyalty card's colour, the way sink-inventory does it: a card carries the business's
 * store colour (`business.store_theme`), so a card a customer scans matches the storefront.
 *  GET   business/store_themes/  → { default, themes: [{ key, label, primary, … }] }
 *  PATCH business/{id}/          multipart, store_theme = a hex ("#D7FF45") or a preset key ("emerald")
 * Newer stores save a hex; older ones a preset key, which is resolved through the themes list.
 */

export type StoreTheme = { key: string; label: string; primary: string }

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
/** The design's own card colour, used until the business has a store colour. */
export const DEFAULT_CARD_COLOUR = '#D7FF45'

const getStoreThemes = async (): Promise<{ themes: StoreTheme[]; defaultKey: string }> => {
  const raw = asRecord(await apiRequest<unknown>('business/store_themes/'))
  const root = asRecord(raw.data ?? raw)
  const list = root.themes ?? root.results ?? root
  const toTheme = (value: unknown, fallbackKey = ''): StoreTheme => {
    const item = asRecord(value)
    return { key: str(item.key) || str(item.id) || fallbackKey, label: str(item.label) || str(item.name), primary: str(item.primary) }
  }
  const themes = Array.isArray(list)
    ? list.map(item => toTheme(item))
    : Object.entries(asRecord(list)).filter(([, value]) => value && typeof value === 'object').map(([key, value]) => toTheme(value, key))
  return { themes: themes.filter(theme => HEX.test(theme.primary)), defaultKey: str(root.default) }
}

export const useStoreThemes = () => useQuery({ queryKey: ['store-themes'], queryFn: getStoreThemes, staleTime: 60 * 60 * 1000 })

/** sink's FALLBACK_STORE_THEMES: older stores saved one of these keys. Lets public pages (no sign-in, so no themes list) resolve them. */
const PRESETS: Record<string, string> = { emerald: '#047857', royal: '#1D4ED8', plum: '#7E22CE', indigo: '#4338CA', violet: '#6D28D9', rose: '#BE123C', sunset: '#C2410C', bronze: '#92400E', amber: '#B45309', teal: '#0F766E', charcoal: '#334155' }

/** A stored store_theme (hex or preset key) as a hex. */
export const resolveCardColour = (value: string, themes: StoreTheme[] = []) => {
  const trimmed = value.trim()
  if (HEX.test(trimmed)) return trimmed
  return themes.find(theme => theme.key === trimmed)?.primary || PRESETS[trimmed] || DEFAULT_CARD_COLOUR
}

/** The current business's card colour. */
export const useCardColour = () => {
  const business = useCurrentBusiness()
  const themes = useStoreThemes()
  const stored = str(business.data?.raw.store_theme)
  return stored ? resolveCardColour(stored, themes.data?.themes ?? []) : DEFAULT_CARD_COLOUR
}

/** Saves the card colour as the business's store colour (multipart PATCH, as sink's store settings sends it). */
const saveStoreTheme = (hex: string) => {
  const form = new FormData()
  form.append('store_theme', hex)
  return apiFormRequest<unknown>(`business/${requireBusinessId()}/`, 'PATCH', form)
}

export const useSaveCardColour = () => {
  const client = useQueryClient()
  return useMutation({ mutationFn: saveStoreTheme, onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.business }) })
}

const rgb = (hex: string) => {
  const v = hex.replace('#', '')
  const full = v.length === 3 ? v.split('').map(c => c + c).join('') : v
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16))
}
const toHex = (channels: number[]) => `#${channels.map(c => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('')}`
/** `hex` moved `amount` (0–1) of the way to `target`. */
const mix = (hex: string, target: string, amount: number) => { const a = rgb(hex), b = rgb(target); return toHex(a.map((c, i) => c + (b[i] - c) * amount)) }
const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map(c => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrastWithWhite = (hex: string) => 1.05 / (luminance(hex) + 0.05)

/** True when white text reads better on this colour (sink's onBase: contrast with white of 4.5 or more). */
export const isDarkColour = (hex: string) => contrastWithWhite(hex) >= 4.5

/**
 * sink's LoyaltyTheme: every card, QR and accent is drawn from the one store colour.
 *  base     the store colour (card header, footer, reward stamp)
 *  dark     base darkened (the header's gradient end)
 *  onBase   text on base (black or white, whichever reads)
 *  surface  a pale tint (the reward box); surfaceBorder its border, and the stamp rings
 *  qrFg     base darkened until it clears 7:1 on white, so the QR carries the brand without costing a scan
 */
export type LoyaltyTheme = { base: string; dark: string; onBase: string; surface: string; surfaceBorder: string; qrFg: string }

export const buildLoyaltyTheme = (colour: string): LoyaltyTheme => {
  const base = HEX.test(colour) ? colour : DEFAULT_CARD_COLOUR
  let qrFg = base
  for (let step = 1; contrastWithWhite(qrFg) < 7 && step <= 12; step += 1) qrFg = mix(base, '#000000', step / 12)
  return {
    base,
    dark: mix(base, '#000000', 0.28),
    onBase: isDarkColour(base) ? '#ffffff' : '#000000',
    surface: mix(base, '#ffffff', 0.86),
    surfaceBorder: mix(base, '#ffffff', 0.55),
    qrFg,
  }
}

/** The current store's theme (business.store_theme). */
export const useLoyaltyTheme = () => {
  const colour = useCardColour()
  return useMemo(() => buildLoyaltyTheme(colour), [colour])
}
