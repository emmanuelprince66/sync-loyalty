import { useState } from 'react'
import { Check, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { isDarkColour, useCardColour, useSaveCardColour, useStoreThemes } from '@/api/storeTheme'
import { CARD_COLOURS } from '@/components/ui/mk'
import { cn } from '@/lib/cn'

/**
 * The store colour (business.store_theme), as sink sets it: one colour for the storefront and every
 * loyalty card and QR. Picking one saves it to the business straight away, and every card redraws.
 * Swatches are the backend's store themes (business/store_themes/), falling back to the design's colours.
 */
export function StoreColourPicker({ canEdit = true, className }: { canEdit?: boolean; className?: string }) {
  const current = useCardColour()
  const themes = useStoreThemes()
  const save = useSaveCardColour()
  const [pending, setPending] = useState<string | null>(null)
  // The store's own colour always leads, so the one in use shows as selected even if it isn't a preset.
  const swatches = [...new Set([current, ...(themes.data?.themes.map(theme => theme.primary) ?? []), ...CARD_COLOURS].map(hex => hex.toUpperCase()))].slice(0, 14)
  const shown = (pending ?? current).toUpperCase()

  const pick = (hex: string) => {
    if (!canEdit || hex.toUpperCase() === current.toUpperCase()) return
    setPending(hex)
    save.mutate(hex, {
      onSuccess: () => toast.success('Store colour saved. Every loyalty card now uses it.'),
      onError: error => toast.error(errorMessage(error, 'Could not save the colour.')),
      onSettled: () => setPending(null),
    })
  }

  return <div className={className}>
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-[#D7FF45]"><Palette size={15}/></span>
      <div className="min-w-0"><p className="text-sm font-black">Store colour</p><p className="mt-0.5 text-[11px] leading-relaxed text-black/45">Your storefront, loyalty cards and join QR codes all use this colour.</p></div>
    </div>
    <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Store colour">
      {swatches.map(hex => {
        const selected = hex === shown
        return <button key={hex} type="button" role="radio" aria-checked={selected} aria-label={`Colour ${hex}`} disabled={!canEdit || save.isPending} onClick={() => pick(hex)}
          className={cn('grid h-9 w-9 place-items-center rounded-full border-2 p-0.5 transition disabled:cursor-not-allowed', selected ? 'border-black' : 'border-transparent hover:border-black/25', !canEdit && !selected && 'opacity-50')}>
          <i className="grid h-full w-full place-items-center rounded-full border border-black/10" style={{ background: hex }}>{selected && <Check size={13} className={isDarkColour(hex) ? 'text-white' : 'text-black'}/>}</i>
        </button>
      })}
      {canEdit && <label className="relative grid h-9 cursor-pointer place-items-center rounded-full border border-dashed border-black/25 px-3 text-[10px] font-extrabold text-black/55 hover:border-black" title="Pick any colour">
        Custom
        <input type="color" value={shown.length === 7 ? shown.toLowerCase() : '#d7ff45'} onChange={event => setPending(event.target.value)} onBlur={event => pick(event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Custom colour"/>
      </label>}
    </div>
    {save.isPending && <p className="mt-2 text-[10px] font-bold text-black/45">Saving…</p>}
  </div>
}
