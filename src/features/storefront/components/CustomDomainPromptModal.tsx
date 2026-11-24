import { ArrowRight, Check } from 'lucide-react'
import { MkButton } from '@/components/ui/mk'
import { MkModal } from '@/components/ui/MkModal'

export function CustomDomainPromptModal({ open, onClose, onUpgrade }: { open: boolean; onClose: () => void; onUpgrade: () => void }) {
  const currentJoinLink = `${window.location.host}/loyalty/join/your-program`
  return <MkModal open={open} onClose={onClose} kicker="Custom domain" title="Get your own domain" description="Give customers a branded address for joining your loyalty program." size="sm"
    footer={<div className="grid w-full grid-cols-2 gap-2"><MkButton secondary onClick={onClose} className="w-full">Maybe later</MkButton><MkButton onClick={onUpgrade} className="w-full">Upgrade <ArrowRight size={14}/></MkButton></div>}>
    <div className="rounded-2xl bg-[#ECECE9] p-4">
      <p className="text-[9px] font-extrabold uppercase tracking-wider text-black/45">Your join link</p>
      <div className="mt-2 grid gap-2 text-xs font-bold">
        <p className="break-all text-black/55">{currentJoinLink}</p>
        <p className="break-all text-[#237A49]">yourbusiness.com/loyalty/join/your-program</p>
      </div>
    </div>
    <h3 className="mt-5 text-xs font-black">Why upgrade?</h3>
    <ul className="mt-3 space-y-3">
      {[
        ['Looks professional', 'A branded link helps customers trust your business.'],
        ['Easy to remember', 'Customers can find your loyalty program faster.'],
        ['Your brand, not Syncgo’s', 'Make your customer-facing link yours.'],
      ].map(([title, description]) => <li key={title} className="flex items-start gap-2.5 text-[11px] leading-5 text-black/55">
        <Check size={14} className="mt-0.5 shrink-0 text-[#237A49]"/>
        <span><strong className="text-black">{title}</strong> — {description}</span>
      </li>)}
    </ul>
  </MkModal>
}
