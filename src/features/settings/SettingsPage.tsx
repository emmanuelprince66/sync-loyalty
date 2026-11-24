import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Crown, Globe2, PenLine, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useDeleteTier, useSaveTier, useTiers, type LoyaltyTier, type TierInput } from '@/api/loyalty'
import { CARD_COLOURS, Card, EmptyBlock, MkButton, PageHeading, inputClass, labelClass } from '@/components/ui/mk'
import { cn } from '@/lib/cn'
import { paths } from '@/routes/paths'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { StoreColourPicker } from '@/features/loyalty/components/StoreColourPicker'
import { MkModal } from '@/components/ui/MkModal'

const emptyTier = (rank: number): TierInput => ({ name: '', rank, metric: 'SPEND', threshold: '', color: '#D7FF45' })

/** Settings: membership tiers and links to custom-domain and billing controls. */
function useSettings() {
  const navigate = useNavigate()
  const tiers = useTiers()
  const save = useSaveTier()
  const remove = useDeleteTier()
  const [editing, setEditing] = useState<{ id?: string; input: TierInput } | null>(null)
  const list = tiers.data ?? []
  return {
    tiers: list,
    isLoading: tiers.isLoading,
    editing,
    add: () => setEditing({ input: emptyTier(list.length + 1) }),
    edit: (tier: LoyaltyTier) => setEditing({ id: tier.id, input: { name: tier.name, rank: tier.rank, metric: tier.metric, threshold: String(tier.threshold), color: tier.color } }),
    change: (patch: Partial<TierInput>) => setEditing(current => (current ? { ...current, input: { ...current.input, ...patch } } : current)),
    cancel: () => setEditing(null),
    saving: save.isPending,
    save: () => {
      if (!editing) return
      if (!editing.input.name.trim()) return toast.error('Name the tier.')
      if (editing.input.threshold === '' || Number(editing.input.threshold) < 0) return toast.error('Enter the threshold to reach this tier.')
      save.mutate(editing, { onSuccess: () => { toast.success('Tier saved'); setEditing(null) }, onError: error => toast.error(errorMessage(error, 'Could not save the tier.')) })
    },
    removingId: remove.isPending ? remove.variables ?? '' : '',
    remove: (id: string) => remove.mutate(id, { onSuccess: () => toast.success('Tier removed'), onError: error => toast.error(errorMessage(error, 'Could not remove the tier.')) }),
    goToKyc: () => navigate(paths.kyc),
    goToPlan: () => navigate(paths.plan),
    goToCustomDomain: () => navigate(paths.customDomain),
  }
}

export default function SettingsPage() {
  const s = useSettings()
  return <div className="space-y-5">
    <PageHeading title="Settings" subtitle="Your store colour, membership tiers, custom domain and plan."/>
    <Card className="p-5"><StoreColourPicker/></Card>
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-black/10 p-5"><div><h3 className="text-sm font-black">Membership tiers</h3><p className="mt-1 text-[10px] text-black/45">Members move up as their lifetime spend or visits grow</p></div><MkButton onClick={s.add}><Plus size={14}/>Add tier</MkButton></div>
      {s.isLoading ? <TableSkeleton header={false} rows={3} columns={[{ thumbnail: true, flex: true, twoLine: true }, { width: 'w-20', alignRight: true }]}/>
        : s.tiers.length === 0 && !s.editing ? <EmptyBlock title="No tiers yet" text="Add tiers like Bronze, Silver and Gold to recognise your best customers."/>
          : s.tiers.map(tier => <div key={tier.id} className="flex items-center justify-between gap-3 border-b border-black/10 p-4 last:border-0">
            <div className="flex min-w-0 items-center gap-3"><span className="h-8 w-8 shrink-0 rounded-full" style={{ background: tier.color }}/><div className="min-w-0"><p className="truncate text-xs font-black">{tier.rank}. {tier.name}</p><p className="text-[9px] text-black/40">From {tier.metric === 'SPEND' ? `₦${tier.threshold.toLocaleString()} spent` : `${tier.threshold} visits`}</p></div></div>
            <div className="flex gap-2"><button type="button" aria-label={`Edit ${tier.name}`} onClick={() => s.edit(tier)} className="grid h-8 w-8 place-items-center rounded-full border border-black/10"><PenLine size={13}/></button><button type="button" aria-label={`Remove ${tier.name}`} disabled={s.removingId === tier.id} onClick={() => s.remove(tier.id)} className="grid h-8 w-8 place-items-center rounded-full border border-black/10 disabled:opacity-50"><Trash2 size={13}/></button></div>
          </div>)}
    </Card>
    <MkModal open={Boolean(s.editing)} onClose={s.cancel} kicker="Membership tiers" title={s.editing?.id ? 'Edit tier' : 'New tier'} size="sm" footer={<><MkButton secondary onClick={s.cancel}>Cancel</MkButton><MkButton onClick={s.save} loading={s.saving}>Save tier</MkButton></>}>
      {s.editing && <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label><span className={labelClass}>Tier name</span><input value={s.editing.input.name} onChange={event => s.change({ name: event.target.value })} placeholder="e.g. Gold" className={cn(inputClass, 'mt-2')}/></label>
          <label><span className={labelClass}>Rank</span><input inputMode="numeric" value={s.editing.input.rank} onChange={event => s.change({ rank: Number(event.target.value.replace(/\D/g, '')) || 1 })} className={cn(inputClass, 'mt-2')}/></label>
          <label><span className={labelClass}>Reached by</span><select value={s.editing.input.metric} onChange={event => s.change({ metric: event.target.value as TierInput['metric'] })} className={cn(inputClass, 'mt-2')}><option value="SPEND">Lifetime spend</option><option value="VISITS">Lifetime visits</option></select></label>
          <label><span className={labelClass}>{s.editing.input.metric === 'SPEND' ? 'Spend from (₦)' : 'Visits from'}</span><input inputMode="numeric" value={s.editing.input.threshold} onChange={event => s.change({ threshold: event.target.value.replace(/\D/g, '') })} className={cn(inputClass, 'mt-2')}/></label>
        </div>
        <div><span className={labelClass}>Badge colour</span><div className="mt-2 flex gap-2">{CARD_COLOURS.map(colour => <button key={colour} type="button" aria-label={`Colour ${colour}`} onClick={() => s.change({ color: colour })} className={cn('h-8 w-8 rounded-full border-2', s.editing?.input.color === colour ? 'border-black p-1' : 'border-transparent')}><i className="block h-full w-full rounded-full" style={{ background: colour }}/></button>)}</div></div>
      </div>}
    </MkModal>
    <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#D7FF45]"><Globe2 size={16}/></span><div className="min-w-0"><p className="text-sm font-black">Custom domain</p><p className="text-[10px] text-black/45">Give customers a branded link to join your loyalty program.</p></div></div>
      <MkButton secondary onClick={s.goToCustomDomain}>Manage domain</MkButton>
    </Card>
    {/* KYC is switched off in maheleKart for now (commented out, not deleted).
    <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#D7FF45]"><ShieldCheck size={16}/></span><div><p className="text-sm font-black">Business verification</p><p className="text-[10px] text-black/45">Complete KYC to buy message credits from your wallet.</p></div></div>
      <MkButton secondary onClick={s.goToKyc}>Open KYC</MkButton>
    </Card>
    */}
    <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-[#D7FF45]"><Crown size={16}/></span><div className="min-w-0"><p className="text-sm font-black">Plan & billing</p><p className="text-[10px] text-black/45">Your Sync360 plan, shared usage and upgrades. Loyalty is unlimited on every plan.</p></div></div>
      <MkButton secondary onClick={s.goToPlan}>View plan</MkButton>
    </Card>
  </div>
}
