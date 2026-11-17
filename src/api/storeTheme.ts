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

/** A stored store_theme (hex or preset key) as a hex. */
export const resolveCardColour = (value: string, themes: StoreTheme[]) => {
  const trimmed = value.trim()
  if (HEX.test(trimmed)) return trimmed
  return themes.find(theme => theme.key === trimmed)?.primary || DEFAULT_CARD_COLOUR
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

/** True when white text reads better on this colour (sink's onBase: contrast with white of 4.5 or more). */
export const isDarkColour = (hex: string) => {
  const v = hex.replace('#', '')
  const full = v.length === 3 ? v.split('').map(c => c + c).join('') : v
  const channel = (i: number) => { const c = parseInt(full.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  const lum = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4)
  return 1.05 / (lum + 0.05) >= 4.5
}
