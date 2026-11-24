import { ArrowRight } from 'lucide-react'
import { useProgram, type LoyaltyProgram } from '@/api/loyalty'
import { MkButton } from '@/components/ui/mk'
import { MkModal } from '@/components/ui/MkModal'
import { joinUrl as publicJoinUrl, joinUrlHere } from '@/lib/join-url'
import { useBusinessDataStore } from '@/stores/business-data-store'
import { JoinQrCard } from './JoinQrCard'
import { useCurrentBusiness } from '@/api/business'
import { str } from '@/api/http'

/**
 * sink's ProgrammeCreated: right after creating, the card customers scan to join, ready to download,
 * print or preview. The join token isn't in the create response, so it's read from the programme
 * detail (qr_details.token), as sink does.
 */
export function ProgramCreatedModal({ program, onClose, onView }: { program: LoyaltyProgram | null; onClose: () => void; onView: () => void }) {
  const detail = useProgram(program?.id || undefined)
  const business = useCurrentBusiness()
  const businessName = useBusinessDataStore(state => state.businessData?.name) || 'Your business'
  const token = detail.data?.token ?? ''
  const approvedDomain = business.data?.raw.custom_domain_approved === true ? str(business.data.raw.custom_domain) : undefined
  const joinUrl = publicJoinUrl(token, approvedDomain)
  const p = detail.data?.program ?? program

  return <MkModal open={Boolean(program)} onClose={onClose} kicker="🎉 Program created" title={`${program?.name ?? 'Your program'} is live`} description="Here’s the card your customers scan to join. Download it, print it, or check the sign-up page." size="md"
    footer={<MkButton onClick={onView}>View program<ArrowRight size={14}/></MkButton>}>
    <JoinQrCard businessName={businessName} programName={p?.name ?? ''} rewardSummary={p?.rewardSummary ?? ''} triggerSummary={p?.triggerSummary ?? ''} stamps={p?.visitTarget ?? 0} joinUrl={joinUrl} previewUrl={joinUrlHere(token)}/>
    {detail.isError && <p className="mt-3 text-center text-[11px] font-bold text-[#B43A16]">We couldn’t load the join link yet. Open the program’s QR code tab to get it.</p>}
  </MkModal>
}
