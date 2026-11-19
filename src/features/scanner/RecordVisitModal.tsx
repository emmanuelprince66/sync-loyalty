import { useState } from 'react'
import { Gift, Minus, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useRewardItems, type MemberWallet } from '@/api/loyalty'
import { useRecordVisit, type SaleMethod } from '@/api/sales'
import { MkButton } from '@/components/ui/mk'
import { MkModal } from '@/components/ui/MkModal'
import { useDebounce } from '@/hooks/useDebounce'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { cn } from '@/lib/cn'

type Line = { id: string; name: string; type: 'PRODUCT' | 'SERVICE'; price: number; quantity: number }
const METHODS: { value: SaleMethod; label: string }[] = [{ value: 'CASH', label: 'Cash' }, { value: 'POS', label: 'POS' }, { value: 'CARD', label: 'Card' }]

/**
 * Record a visit the way sink-inventory's POS does: ring up what the member bought as a sale with them
 * as the customer. The backend adds the visit and spend to their loyalty progress from that sale, and
 * redeems a ready reward attached to it.
 */
export function RecordVisitModal({ open, onClose, wallet }: { open: boolean; onClose: () => void; wallet: MemberWallet }) {
  const money = useFormatMoney()
  const record = useRecordVisit()
  const [type, setType] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT')
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 300)
  const items = useRewardItems(type, debounced, open)
  const [lines, setLines] = useState<Line[]>([])
  const [method, setMethod] = useState<SaleMethod>('CASH')
  const [rewardId, setRewardId] = useState('')
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)

  const add = (item: { id: string; name: string; price: number }) => setLines(current => {
    const found = current.find(line => line.id === item.id)
    return found ? current.map(line => (line.id === item.id ? { ...line, quantity: line.quantity + 1 } : line)) : [...current, { ...item, type, quantity: 1 }]
  })
  const change = (id: string, by: number) => setLines(current => current.map(line => (line.id === id ? { ...line, quantity: Math.max(1, line.quantity + by) } : line)))
  const reset = () => { setLines([]); setSearch(''); setRewardId(''); setMethod('CASH') }
  const close = () => { reset(); onClose() }

  const submit = () => {
    if (!wallet.customerId) return toast.error('This card isn’t linked to a customer record, so the visit can’t be saved.')
    if (lines.length === 0) return toast.error('Add what they bought.')
    record.mutate({ customerId: wallet.customerId, method, rewardId: rewardId || undefined, lines: lines.map(line => ({ id: line.id, type: line.type, quantity: line.quantity, unitPrice: line.price })) }, {
      onSuccess: () => { toast.success(`Visit recorded for ${wallet.name}${rewardId ? ' and reward redeemed' : ''}`); close() },
      onError: error => toast.error(errorMessage(error, 'Could not record the visit.')),
    })
  }

  return <MkModal open={open} onClose={close} kicker={wallet.name} title="Record visit" description="Ring up what they bought. Their visit and spend count toward their loyalty." size="lg"
    footer={<><MkButton secondary onClick={close}>Cancel</MkButton><MkButton onClick={submit} loading={record.isPending} disabled={lines.length === 0}>Record visit · {money(total)}</MkButton></>}>
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-extrabold uppercase tracking-wider text-black/45">What did they buy?</p>
          <div className="inline-flex rounded-full bg-[#EEEEEA] p-1">{(['PRODUCT', 'SERVICE'] as const).map(item => <button key={item} type="button" onClick={() => setType(item)} className={cn('rounded-full px-3 py-1.5 text-[10px] font-extrabold', type === item ? 'bg-black text-white' : 'text-black/45')}>{item === 'PRODUCT' ? 'Products' : 'Services'}</button>)}</div>
        </div>
        <label className="mt-2 flex h-11 items-center gap-2 border border-black/15 bg-white px-3 focus-within:border-black"><Search size={14} className="text-black/40"/><input value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search your ${type === 'PRODUCT' ? 'products' : 'services'}`} className="w-full bg-transparent text-xs outline-none"/></label>
        <div className="mt-2 max-h-44 divide-y divide-black/10 overflow-y-auto border border-black/10 bg-white">
          {items.isLoading ? <p className="p-3 text-[11px] text-black/40">Loading…</p>
            : (items.data ?? []).length === 0 ? <p className="p-3 text-[11px] text-black/40">Nothing found. Add it to your inventory to ring it up.</p>
              : (items.data ?? []).map(item => <button key={item.id} type="button" onClick={() => add(item)} className="flex w-full items-center justify-between gap-3 p-3 text-left text-xs hover:bg-[#F6F6F2]"><span className="truncate font-bold">{item.name}</span><span className="flex shrink-0 items-center gap-2 text-black/55">{money(item.price)}<Plus size={14} className="text-black"/></span></button>)}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-black/45">This visit</p>
        {lines.length === 0 ? <p className="mt-2 border border-dashed border-black/15 p-4 text-center text-[11px] text-black/45">Tap items above to add them.</p>
          : <div className="mt-2 divide-y divide-black/10 border border-black/10 bg-white">{lines.map(line => <div key={line.id} className="flex items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1"><b className="block truncate text-xs">{line.name}</b><span className="text-[10px] text-black/45">{money(line.price)} each</span></div>
            <div className="flex shrink-0 items-center gap-1.5"><button type="button" aria-label="One less" onClick={() => change(line.id, -1)} className="grid h-8 w-8 place-items-center rounded-full border border-black/15"><Minus size={13}/></button><b className="w-6 text-center text-xs">{line.quantity}</b><button type="button" aria-label="One more" onClick={() => change(line.id, 1)} className="grid h-8 w-8 place-items-center rounded-full border border-black/15"><Plus size={13}/></button></div>
            <b className="w-20 shrink-0 text-right text-xs">{money(line.price * line.quantity)}</b>
            <button type="button" aria-label={`Remove ${line.name}`} onClick={() => setLines(current => current.filter(item => item.id !== line.id))} className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-[#F0F0EC]"><Trash2 size={13}/></button>
          </div>)}</div>}
      </div>

      {wallet.availableRewards.length > 0 && <div>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-black/45">Apply a reward</p>
        <div className="mt-2 space-y-2">{wallet.availableRewards.map(reward => <button key={reward.id} type="button" aria-pressed={rewardId === reward.id} onClick={() => setRewardId(current => (current === reward.id ? '' : reward.id))} className={cn('flex w-full items-center gap-2 p-3 text-left text-xs font-black', rewardId === reward.id ? 'bg-[#D7FF45]' : 'border border-black/15 bg-white')}><Gift size={14}/>{reward.label}<span className="ml-auto text-[10px] font-bold text-black/45">{rewardId === reward.id ? 'Applied' : 'Tap to apply'}</span></button>)}</div>
        <p className="mt-1.5 text-[10px] text-black/45">A free item still needs to be in the visit above; the backend makes it free.</p>
      </div>}

      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-black/45">Paid by</p>
        <div className="mt-2 grid grid-cols-3 gap-2">{METHODS.map(item => <button key={item.value} type="button" aria-pressed={method === item.value} onClick={() => setMethod(item.value)} className={cn('h-11 text-xs font-extrabold', method === item.value ? 'bg-black text-white' : 'border border-black/15 bg-white')}>{item.label}</button>)}</div>
      </div>
    </div>
  </MkModal>
}
