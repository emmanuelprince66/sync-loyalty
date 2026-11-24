import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, Check, Copy, Globe2, Link2, RefreshCw, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useCurrentBusiness, useUpdateBusiness } from '@/api/business'
import { errorMessage } from '@/api/auth'
import { useCustomDomainGate } from '@/api/plan'
import { Button } from '@/components/ui/Button'
import { Card, ErrorBlock, MkButton, PageHeading, inputClass } from '@/components/ui/mk'
import { useClipboard } from '@/hooks/useClipboard'
import { str } from '@/api/http'
import { customDomainUpgradePath } from '@/routes/paths'

const DNS_TARGET = 'store.sync360.africa'
const DOMAIN_PATTERN = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/i
const normalizeDomain = (value: string) => value.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase()

const benefits = [
  ['Looks professional', 'A branded link helps customers trust your business.'],
  ['Easy to remember', 'Customers can find your loyalty program faster.'],
  ['Your brand, not Syncgo’s', 'Make your customer-facing link yours.'],
]

export default function CustomDomainPage() {
  const navigate = useNavigate()
  const business = useCurrentBusiness()
  const gate = useCustomDomainGate()
  const update = useUpdateBusiness()
  const clipboard = useClipboard()
  const currentDomain = str(business.data?.raw.custom_domain)
  const savedDomain = normalizeDomain(currentDomain)
  const approved = business.data?.raw.custom_domain_approved === true
  const [domainInput, setDomainInput] = useState<{ savedDomain: string; value: string } | null>(null)
  const domain = domainInput?.savedDomain === savedDomain ? domainInput.value : currentDomain
  const normalized = normalizeDomain(domain)
  const valid = DOMAIN_PATTERN.test(normalized)
  const hostParts = normalized.split('.')
  const hostLabel = hostParts.length > 2 ? hostParts.slice(0, -2).join('.') : '@'
  const domainMatchesSaved = Boolean(savedDomain) && savedDomain === normalized
  const isApproved = domainMatchesSaved && approved
  const isPending = domainMatchesSaved && !approved
  const currentJoinExample = `${window.location.host}/loyalty/join/your-program`

  const saveDomain = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!valid) {
      toast.error('Enter a valid domain, such as join.yourbusiness.com.')
      return
    }
    try {
      await update.mutateAsync({ custom_domain: normalized })
      toast.success('Domain saved. We’ll check it once your DNS record is live.')
    } catch (failure) {
      toast.error(errorMessage(failure, 'Could not save your domain.'))
    }
  }

  const refreshStatus = () => { void business.refetch() }
  const copyTarget = () => { void clipboard.copy(DNS_TARGET) }

  return <div className="mx-auto max-w-5xl space-y-5">
    <PageHeading badge="CUSTOM DOMAIN" title="Get your own domain" subtitle="Your loyalty program deserves an address customers recognize."/>

    <section className="overflow-hidden rounded-3xl bg-black p-5 text-white sm:p-8">
      <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#D7FF45]">Your loyalty join link, on your brand</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="rounded-2xl bg-white/10 p-4">
          <p className="text-[9px] font-extrabold uppercase tracking-wider text-white/45">Before</p>
          <p className="mt-2 break-all text-xs font-bold text-white/75">{currentJoinExample}</p>
        </div>
        <ArrowRight size={18} className="mx-auto rotate-90 text-[#D7FF45] sm:rotate-0"/>
        <div className="rounded-2xl bg-[#D7FF45] p-4 text-black">
          <p className="text-[9px] font-extrabold uppercase tracking-wider text-black/45">After</p>
          <p className="mt-2 break-all text-xs font-black">yourbusiness.com/loyalty/join/your-program</p>
        </div>
      </div>
    </section>

    <Card className="p-5 sm:p-6">
      <h2 className="text-sm font-black">Why upgrade?</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {benefits.map(([title, description]) => <div key={title} className="flex items-start gap-3 rounded-2xl bg-[#F6F6F2] p-4">
          <Check size={16} className="mt-0.5 shrink-0 text-[#237A49]"/>
          <div><h3 className="text-xs font-black">{title}</h3><p className="mt-1 text-[10px] leading-4 text-black/50">{description}</p></div>
        </div>)}
      </div>
    </Card>

    <section>
      <div><h2 className="text-sm font-black">How to get your domain</h2><p className="mt-1 text-[11px] text-black/45">Choose the option that works for you.</p></div>
      <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-2">
        <article className="flex flex-col rounded-3xl border border-black/10 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#E8F4E7] text-[#237A49]"><Link2 size={18}/></span>
            <div><span className="text-[9px] font-extrabold uppercase tracking-wider text-black/40">Option 1</span><h3 className="mt-1 text-sm font-black">I already have a domain</h3><p className="mt-1 text-[10px] leading-4 text-black/50">Enter it below and we’ll show you how to connect it.</p></div>
          </div>
          <Button type="button" onClick={() => document.getElementById('domain-setup')?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="mt-5 w-full justify-between">I have a domain <ArrowRight size={15}/></Button>
        </article>
        <article className="flex flex-col rounded-3xl border border-black/10 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#E8F4E7] text-[#237A49]"><Globe2 size={18}/></span>
            <div><span className="text-[9px] font-extrabold uppercase tracking-wider text-black/40">Option 2</span><h3 className="mt-1 text-sm font-black">I need a domain</h3><p className="mt-1 text-[10px] leading-4 text-black/50">Buy one from any domain provider, then connect it here.</p></div>
          </div>
          <p className="mt-4 flex-1 rounded-2xl bg-[#F6F6F2] p-4 text-[11px] leading-5 text-black/55">Or contact us and we’ll help you choose, buy, and set it up.</p>
          <a href="mailto:support@sync360.africa?subject=Help%20with%20a%20custom%20domain" className="mt-4 flex min-h-11 w-full items-center justify-between rounded-xl bg-[#E8F4E7] px-4 text-xs font-black text-[#237A49]">Contact us to help me <ArrowRight size={15}/></a>
        </article>
      </div>
    </section>

    <section id="domain-setup" className="scroll-mt-6">
      {gate.isLoading || business.isLoading
        ? <Card className="animate-pulse p-6"><div className="h-5 w-48 bg-black/10"/><div className="mt-4 h-20 bg-black/10"/></Card>
        : gate.isError || business.isError
          ? <Card className="p-5"><ErrorBlock text={errorMessage(gate.error ?? business.error, 'We couldn’t load your domain settings.')} onRetry={() => { void gate.refetch(); void business.refetch() }}/></Card>
          : <Card className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#D7FF45]"><ShieldCheck size={18}/></span>
              <div><h2 className="text-sm font-black">Connect your custom domain</h2><p className="mt-1 text-[10px] leading-4 text-black/50">Use a subdomain such as <b>join.yourbusiness.com</b> for the easiest setup.</p></div>
            </div>

            {gate.branchLocked
              ? <div className="mt-5 rounded-2xl bg-[#FFF1EC] p-4"><p className="text-xs font-black">This business needs its own plan</p><p className="mt-1 text-[10px] leading-4 text-black/55">Choose a plan for this business to connect a custom domain.</p><MkButton onClick={() => navigate(customDomainUpgradePath())} className="mt-4">View plans <ArrowRight size={14}/></MkButton></div>
              : !gate.allowed
              ? <div className="mt-5 rounded-2xl bg-[#F6F6F2] p-4">
                {currentDomain && <><label htmlFor="saved-domain" className="text-[9px] font-extrabold uppercase tracking-wider text-black/45">Saved domain</label><input id="saved-domain" value={currentDomain} readOnly className={`${inputClass} mt-2 cursor-not-allowed bg-[#ECECE9]`}/><p className="mt-2 text-[10px] text-black/50">{approved ? 'This domain is approved.' : 'This domain is awaiting verification.'}</p></>}
                <p className="text-xs font-black">Custom domains are available on Sync Plus and higher.</p>
                <MkButton onClick={() => navigate(customDomainUpgradePath())} className="mt-4 w-full">Upgrade <ArrowRight size={14}/></MkButton>
              </div>
                : <form onSubmit={saveDomain} className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="custom-domain" className="text-[9px] font-extrabold uppercase tracking-wider text-black/45">Your domain</label>
                    <div className="mt-2 flex border border-black/15 bg-white focus-within:border-black">
                      <span className="flex items-center border-r border-black/10 px-3 text-xs font-bold text-black/40">https://</span>
                      <input id="custom-domain" value={domain} onChange={event => setDomainInput({ savedDomain, value: event.target.value })} placeholder="join.yourbusiness.com" autoComplete="url" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-xs font-bold outline-none placeholder:font-normal placeholder:text-black/30"/>
                    </div>
                    {domain && !valid && <p role="alert" className="mt-1 text-[10px] font-bold text-[#B43A16]">Enter a valid domain, such as join.yourbusiness.com.</p>}
                  </div>

                  {valid && <div className="rounded-2xl bg-[#F6F6F2] p-4">
                    <p className="text-[10px] font-black">Add this DNS record with your domain provider</p>
                    <div className="mt-3 grid grid-cols-[70px_1fr] gap-y-3 text-[10px] sm:grid-cols-[90px_1fr]">
                      <span className="font-bold text-black/40">Type</span><b>CNAME</b>
                      <span className="font-bold text-black/40">Host</span><b>{hostLabel}</b>
                      <span className="font-bold text-black/40">Points to</span><span className="flex min-w-0 items-center gap-2"><b className="truncate">{DNS_TARGET}</b><button type="button" onClick={copyTarget} aria-label="Copy CNAME target" className="grid h-7 w-7 shrink-0 place-items-center rounded-md hover:bg-black/5">{clipboard.copied ? <Check size={13}/> : <Copy size={13}/>}</button></span>
                    </div>
                    <p className="mt-3 text-[10px] leading-4 text-black/45">DNS changes can take up to 48 hours. Keep your existing join link active while it updates.</p>
                  </div>}

                  {isApproved && <p className="rounded-xl bg-[#E3F7E7] p-3 text-[10px] font-bold text-[#237A49]">Domain approved and live: {currentDomain}</p>}
                  {isPending && <p className="rounded-xl bg-[#FFF4D8] p-3 text-[10px] font-bold text-[#805B12]">Waiting for domain verification: {currentDomain}</p>}

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    {domainMatchesSaved && !isApproved && <Button type="button" variant="outline" onClick={refreshStatus}><RefreshCw size={14}/>Refresh status</Button>}
                    <Button type="submit" disabled={!valid} loading={update.isPending}>I’ve added the record</Button>
                  </div>
                </form>}
          </Card>}
    </section>

    <p className="flex items-start gap-2 rounded-2xl bg-white p-4 text-[10px] leading-4 text-black/45"><ShieldCheck size={14} className="mt-0.5 shrink-0"/>Need help? Email <a className="font-bold text-[#237A49]" href="mailto:support@sync360.africa">support@sync360.africa</a> and we’ll guide you through the process.</p>

    <section className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-black p-5 text-white sm:flex-row sm:items-center sm:p-6">
      <div><h2 className="text-sm font-black">Ready to make your loyalty link yours?</h2><p className="mt-1 text-[11px] leading-5 text-white/65">Upgrade to Sync Plus or higher to unlock a custom domain.</p></div>
      <MkButton onClick={() => navigate(customDomainUpgradePath())} className="w-full bg-[#D7FF45] text-black hover:bg-[#c8f52e] sm:w-auto">Upgrade <ArrowRight size={14}/></MkButton>
    </section>
  </div>
}
