import { useState } from 'react'
import { Link } from 'react-router'
import { Check, Search, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useCustomerSearch, type Customer } from '@/api/customers'
import { useAddParticipant } from '@/api/referrals'
import { MkButton, initialsOf, labelClass } from '@/components/ui/mk'
import { MkModal } from '@/components/ui/MkModal'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { cn } from '@/lib/cn'
import { paths } from '@/routes/paths'

/**
 * sink's AddParticipantForm: enrols an EXISTING customer, picked from the customer search
 * (GET customer/{business_id}/?search), so nobody gets a duplicate record. The endpoint takes
 * name/phone/email rather than a customer id, so the chosen customer's details are what's posted.
 */
export function AddParticipantModal({ programmeId, onClose }: { programmeId: string; onClose: () => void }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [error, setError] = useState('')
  const { customers, isLoading, isError } = useCustomerSearch(search, { limit: 20 })
  const add = useAddParticipant()

  const submit = () => {
    setError('')
    if (!selected) return setError('Pick a customer to enrol.')
    // Phone is the one field the API can't mint for itself; the referral link is sent by SMS.
    if (!selected.phone.trim()) return setError(`${selected.name} has no phone number saved. Add one on their profile first — the referral link is sent by SMS.`)
    add.mutate({ programmeId, name: selected.name, phone: selected.phone, email: selected.email }, {
      onSuccess: () => { toast.success('Participant added'); onClose() },
      onError: failure => toast.error(errorMessage(failure, 'Could not add the participant')),
    })
  }

  return <MkModal open onClose={onClose} kicker="Referrals" title="Enrol a Customer"
    footer={<><MkButton secondary onClick={onClose}>Cancel</MkButton><MkButton onClick={submit} loading={add.isPending} disabled={!selected}><span className="truncate">{selected ? `Enrol ${selected.name}` : 'Enrol customer'}</span></MkButton></>}>
    <div className="flex min-w-0 flex-col gap-4">
      <div>
        <span className={labelClass}>Choose a customer</span>
        <label className="mt-2 flex h-11 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-black/15 focus-within:ring-black">
          <Search size={14} className="shrink-0 text-black/45"/>
          <input value={search} onChange={event => { setSearch(event.target.value); setSelected(null) }} placeholder="Search by name, phone or email..." aria-label="Search customers" className="w-full min-w-0 bg-transparent text-xs outline-none"/>
        </label>
      </div>

      <div className="flex max-h-[320px] min-w-0 flex-col gap-2 overflow-y-auto">
        {isLoading ? <TableSkeleton header={false} rows={4} columns={[{ thumbnail: true, flex: true, twoLine: true }]}/>
          : isError ? <p className="border border-dashed border-black/15 px-4 py-10 text-center text-xs text-black/50">We couldn’t load your customers. Try again.</p>
            : customers.length === 0 ? <div className="border border-dashed border-black/15 px-4 py-10 text-center">
              <p className="text-sm font-black">{search ? 'No customers match that search' : 'No customers yet'}</p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-black/45">{search ? 'Try a different name or phone number.' : 'Add a customer first, then enrol them here.'}</p>
              {!search && <Link to={paths.customers} className="mt-3 inline-flex items-center gap-1.5 text-xs font-extrabold underline-offset-2 hover:underline"><UserPlus size={14}/>Go to Customers</Link>}
            </div>
              : customers.map(customer => {
                const isSelected = selected?.id === customer.id
                return <button key={customer.id} type="button" onClick={() => { setSelected(customer); setError('') }} aria-pressed={isSelected} className={cn('flex w-full min-w-0 items-center gap-3 border bg-white p-3 text-left transition', isSelected ? 'border-black bg-[#D7FF45]/30' : 'border-black/10 hover:border-black')}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F0F0EC] text-[11px] font-black">{initialsOf(customer.name)}</span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-sm">{customer.name}</b>
                    <span className="mt-0.5 block truncate text-[11px] text-black/45">{customer.phone || 'No phone saved'}{customer.email ? ` · ${customer.email}` : ''}</span>
                  </span>
                  {isSelected && <Check size={16} className="shrink-0"/>}
                </button>
              })}
      </div>

      {error && <p role="alert" className="bg-[#FFE6DD] px-3 py-2 text-xs font-bold text-[#B43A16]">{error}</p>}
    </div>
  </MkModal>
}
