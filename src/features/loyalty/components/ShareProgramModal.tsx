import { useProgram, useProgramQr, type LoyaltyProgram } from '@/api/loyalty'
import { EmptyBlock } from '@/components/ui/mk'
import { MkModal } from '@/components/ui/MkModal'
import { joinUrl as publicJoinUrl, joinUrlHere } from '@/lib/join-url'
import { useBusinessDataStore } from '@/stores/business-data-store'
import { JoinQrCard } from './JoinQrCard'

/**
 * sink's Share Campaign modal (the list card's QR button): the same join card as after creating,
 * read from GET loyalty/programs/single/{id}/ (qr_details.token), with GET …/{id}/qr/ as the fallback.
 */
export function ShareProgramModal({ program, onClose }: { program: LoyaltyProgram | null; onClose: () => void }) {
  const detail = useProgram(program?.id || undefined)
  const qr = useProgramQr(program?.id || undefined)
  const businessName = useBusinessDataStore(state => state.businessData?.name) || 'Your business'
  const token = detail.data?.token || qr.data?.token || ''
  const p = detail.data?.program ?? program
  const loading = (detail.isLoading || qr.isLoading) && !token

  return <MkModal open={Boolean(program)} onClose={onClose} kicker="Join QR" title="Share campaign" description="The card customers scan to join. Download it, print it, or share the link." size="md">
    {loading
      ? <div className="space-y-3"><div className="h-[118px] animate-pulse bg-[#ECECE8]"/><div className="h-10 animate-pulse bg-[#ECECE8]"/><div className="grid grid-cols-2 gap-2"><div className="h-10 animate-pulse rounded-full bg-[#ECECE8]"/><div className="h-10 animate-pulse rounded-full bg-[#ECECE8]"/></div></div>
      : !token
        ? <EmptyBlock title="No QR code yet" text="This program’s join QR hasn’t been generated. Check back shortly."/>
        : <JoinQrCard businessName={businessName} programName={p?.name ?? ''} rewardSummary={p?.rewardSummary ?? ''} triggerSummary={p?.triggerSummary ?? ''} stamps={p?.visitTarget ?? 0} joinUrl={publicJoinUrl(token)} previewUrl={joinUrlHere(token)}/>}
  </MkModal>
}
