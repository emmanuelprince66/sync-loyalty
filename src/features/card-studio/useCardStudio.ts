import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { usePrograms, useProgramQr } from '@/api/loyalty'
import { joinPath } from '@/routes/paths'
import { useBusinessDataStore } from '@/stores/business-data-store'
import { errorMessage } from '@/api/auth'
import { useCardColour, useSaveCardColour } from '@/api/storeTheme'

export const TEMPLATES = ['Bold type', 'Minimal', 'Playful'] as const

/** Card studio: the in-store QR poster for a programme, exported as a PNG (html2canvas-pro, as sink-inventory uses). */
export function useCardStudio() {
  const [params, setParams] = useSearchParams()
  const programs = usePrograms()
  const list = programs.data ?? []
  const programId = params.get('program') || list[0]?.id || ''
  const program = list.find(item => item.id === programId)
  const qr = useProgramQr(programId || undefined)
  const business = useBusinessDataStore(state => state.businessData)

  const [template, setTemplate] = useState(0)
  const [colourOverride, setColourOverride] = useState<string | null>(null)
  const [headline, setHeadline] = useState('')
  const [exporting, setExporting] = useState(false)
  const posterRef = useRef<HTMLDivElement>(null)

  const storeColour = useCardColour()
  const saveColour = useSaveCardColour()
  const colour = colourOverride ?? storeColour
  const joinUrl = qr.data?.token ? `${window.location.origin}${joinPath(qr.data.token)}` : ''

  return {
    programs: list,
    programsLoading: programs.isLoading,
    programId,
    selectProgram: (id: string) => setParams({ program: id }, { replace: true }),
    program,
    template, setTemplate,
    colour,
    savingColour: saveColour.isPending,
    /** The card carries the store colour (as in sink), so a new pick is saved to the business. */
    setColour: (value: string) => {
      setColourOverride(value)
      saveColour.mutate(value, {
        onSuccess: () => toast.success('Card colour saved. Your storefront uses it too.'),
        onError: error => { setColourOverride(null); toast.error(errorMessage(error, 'Could not save the colour.')) },
      })
    },
    headline: headline || (program ? `${program.name}.` : 'Your habit pays.'),
    setHeadline,
    subline: program ? [program.triggerSummary, program.rewardSummary].filter(Boolean).join('. ') : 'Join our loyalty program.',
    businessName: business?.name || 'Your business',
    businessInitials: (business?.name || 'B').split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase(),
    joinUrl,
    qrImage: qr.data?.qrUrl ?? '',
    qrLoading: qr.isLoading,
    posterRef,
    exporting,
    exportPoster: async () => {
      if (!posterRef.current) return
      setExporting(true)
      try {
        const { default: html2canvas } = await import('html2canvas-pro')
        const canvas = await html2canvas(posterRef.current, { scale: 3, backgroundColor: '#ffffff', useCORS: true })
        const link = document.createElement('a')
        link.download = `${(program?.name || 'loyalty').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-poster.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      } catch {
        toast.error('Could not export the poster. Try again.')
      } finally {
        setExporting(false)
      }
    },
  }
}
