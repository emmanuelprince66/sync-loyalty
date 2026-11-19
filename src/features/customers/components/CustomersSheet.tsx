import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight, Crown, Plus, Search, Sprout, Star, Wallet, X } from 'lucide-react'
import { useCustomers, type Customer } from '@/api/customers'
import { initialsOf } from '@/components/ui/mk'
import { useDebounce } from '@/hooks/useDebounce'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { usePermissions } from '@/hooks/usePermissions'
import { cn } from '@/lib/cn'
import { CustomerFormModal } from './CustomerFormModal'

/** Stable avatar tint per customer, as sink's avatarTone (in the maheleKart palette). */
const TONES = ['bg-black text-[#D7FF45]', 'bg-[#FF6B3D] text-black', 'bg-[#B9A7FF] text-black', 'bg-[#52D6FF] text-black', 'bg-[#F2C94C] text-black', 'bg-[#D7FF45] text-black']
const toneOf = (seed: string) => {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return TONES[Math.abs(hash) % TONES.length]
}

/** sink's tierStyle: a chip per tier, neutral for anything unrecognised. */
const TIERS: Record<string, { icon: typeof Crown; className: string }> = {
  VIP: { icon: Crown, className: 'bg-[#F2C94C]/30 text-[#7A5A00]' },
  Gold: { icon: Crown, className: 'bg-[#F2C94C]/30 text-[#7A5A00]' },
  Silver: { icon: Star, className: 'bg-[#F0F0EC] text-black/60' },
  Bronze: { icon: Sprout, className: 'bg-[#FF6B3D]/15 text-[#A3421F]' },
}
const tierStyle = (tier: string) => TIERS[tier] ?? { icon: Sprout, className: 'bg-[#D7FF45]/40 text-black' }

const LIMIT = 20

/**
 * The customer picker that slides in from the right, as sink's POS CustomersDrawer:
 * search, Create customer, one card per customer (tier, rewards, segment, wallet) and paging.
 * Tapping a card hands the customer back; the caller decides what opens next.
 */
export function CustomersSheet({ open, onOpenChange, onSelect, selectedId }: { open: boolean; onOpenChange: (open: boolean) => void; onSelect: (customer: Customer) => void; selectedId?: string }) {
  const money = useFormatMoney()
  const { canAddCustomers } = usePermissions()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const debounced = useDebounce(search.trim(), 350)
  const query = useCustomers({ page, limit: LIMIT, search: debounced, enabled: open })
  const customers = query.data?.customers ?? []
  const pages = query.data?.pages ?? 1

  return <>
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0"/>
        <Dialog.Content className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-[420px] flex-col bg-[#F6F6F2] shadow-[-20px_0_60px_rgba(0,0,0,.25)] outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
          <div className="flex items-start justify-between gap-3 border-b border-black/10 bg-white px-5 py-4">
            <div><Dialog.Title className="text-lg font-black">Select customer</Dialog.Title><Dialog.Description className="text-[11px] text-black/45">Choose an existing customer or create a new one</Dialog.Description></div>
            <button type="button" aria-label="Close" onClick={() => onOpenChange(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-white"><X size={15}/></button>
          </div>
          <div className="space-y-3 border-b border-black/10 bg-white p-4">
            <label className="flex h-11 items-center gap-2 rounded-full bg-[#F1F1ED] px-4"><Search size={14} className="shrink-0 text-black/45"/><input autoFocus value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} placeholder="Search customers…" aria-label="Search customers" className="w-full bg-transparent text-sm outline-none"/>{query.isFetching && <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-black/30 border-t-transparent"/>}</label>
            {canAddCustomers && <button type="button" onClick={() => setCreating(true)} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-black text-xs font-extrabold text-white hover:bg-[#272727]"><Plus size={15}/>Create customer</button>}
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {query.isLoading ? Array.from({ length: 6 }, (_, index) => <div key={index} role="status" aria-label="Loading" className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-4"><span className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-[#ECECE8]"/><span className="min-w-0 flex-1 space-y-2"><span className="block h-3 w-1/2 animate-pulse bg-[#ECECE8]"/><span className="block h-2.5 w-2/3 animate-pulse bg-[#ECECE8]"/><span className="flex gap-1.5">{[14, 16, 12].map(width => <span key={width} className="h-4 animate-pulse rounded-full bg-[#ECECE8]" style={{ width: width * 4 }}/>)}</span></span></div>)
              : query.isError ? <div className="rounded-2xl bg-[#FFE6DD] p-4 text-center"><p className="text-sm font-bold text-[#B43A16]">Could not load customers.</p><button type="button" onClick={() => { void query.refetch() }} className="mt-2 text-xs font-extrabold underline">Try again</button></div>
                : customers.length === 0 ? <p className="p-6 text-center text-sm text-black/45">{debounced ? `No customers match “${debounced}”.` : 'No customers yet.'}</p>
                  : customers.map(customer => {
                    const tier = tierStyle(customer.tier)
                    const TierIcon = tier.icon
                    const active = customer.id === selectedId
                    return <button key={customer.id} type="button" onClick={() => onSelect(customer)} className={cn('flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition', active ? 'border-black bg-white ring-2 ring-[#D7FF45]' : 'border-black/10 bg-white hover:border-black')}>
                      <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-full text-xs font-extrabold', toneOf(customer.id || customer.name))}>{initialsOf(customer.name)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-extrabold">{customer.name}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-black/45">{customer.phone || 'No phone'} · {money(customer.totalSpent)} spent</span>
                        <span className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-2">
                          {customer.tier && <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold', tier.className)}><TierIcon size={11}/>{customer.tier}</span>}
                          {customer.loyaltyCode ? <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-white">{customer.loyaltyCode}</span> : <span className="rounded-full bg-[#F0F0EC] px-2 py-0.5 text-[10px] font-bold text-black/45">Not a member</span>}
                          <span className="text-[10px] text-black/40">{customer.rewardCount} rewards</span>
                          {customer.segment && <span className="rounded-full bg-[#B9A7FF]/30 px-2 py-0.5 text-[10px] font-bold">{customer.segment}</span>}
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#D7FF45]/40 px-2 py-0.5 text-[10px] font-bold"><Wallet size={11}/>{money(customer.walletBalance)}</span>
                        </span>
                      </span>
                      <ArrowRight size={16} className="shrink-0"/>
                    </button>
                  })}
          </div>
          {pages > 1 && <div className="flex items-center justify-between gap-2 border-t border-black/10 bg-white p-3">
            <button type="button" disabled={page <= 1 || query.isFetching} onClick={() => setPage(page - 1)} className="h-9 rounded-full border border-black/15 px-4 text-xs font-extrabold disabled:opacity-40">Previous</button>
            <span className="text-xs font-bold text-black/55">Page {page} of {pages}</span>
            <button type="button" disabled={page >= pages || query.isFetching} onClick={() => setPage(page + 1)} className="h-9 rounded-full border border-black/15 px-4 text-xs font-extrabold disabled:opacity-40">Next</button>
          </div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    <CustomerFormModal open={creating} customer={null} onClose={saved => { setCreating(false); if (saved) onSelect(saved) }}/>
  </>
}
