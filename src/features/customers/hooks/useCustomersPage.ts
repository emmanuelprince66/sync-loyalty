import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { CUSTOMER_STATUS_OPTIONS, useCustomers, type Customer, type CustomerStatusFilter } from '@/api/customers'
import { useLoyaltyCustomers } from '@/api/loyalty'
import { useDebounce } from '@/hooks/useDebounce'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { usePermissions } from '@/hooks/usePermissions'
import { downloadCsv } from '@/lib/csv'
import { customerPath } from '@/routes/paths'
import { toApiDate, type DateRange } from '@/components/ui/DateRangeFilter'

/** sink only searches from three characters. */
const MIN_SEARCH = 3

/** Customers (customer/{business_id}) joined with their loyalty progress (loyalty/customers/{business_id}). */
export function useCustomersPage() {
  const navigate = useNavigate()
  const money = useFormatMoney()
  const { canAddCustomers } = usePermissions()
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState<CustomerStatusFilter>('')
  const [range, setRangeState] = useState<DateRange | undefined>()
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const debounced = useDebounce(searchInput.trim(), 400)
  const search = debounced.length >= MIN_SEARCH ? debounced : ''

  const customers = useCustomers({ page, search, status, startDate: toApiDate(range?.from), endDate: toApiDate(range?.to) })
  const loyalty = useLoyaltyCustomers()
  const progress = useMemo(() => new Map((loyalty.data ?? []).map(member => [member.id, member])), [loyalty.data])

  const rows = (customers.data?.customers ?? []).map(customer => {
    const member = progress.get(customer.id)
    return { customer, code: member?.code || customer.code, tier: member?.tier || customer.tier, visits: member?.visits ?? 0, target: member?.target ?? 0 }
  })
  const summary = customers.data?.summary
  const members = loyalty.data?.length ?? 0

  return {
    rows,
    isLoading: customers.isLoading,
    isFetching: customers.isFetching,
    isError: customers.isError,
    retry: () => { void customers.refetch() },
    metrics: [
      { label: 'Total customers', value: summary ? summary.count.toLocaleString() : '—', detail: '' },
      { label: 'Loyalty members', value: loyalty.isLoading ? '—' : members.toLocaleString(), detail: summary?.count ? `${Math.round((members / summary.count) * 100)}% of customers` : '' },
      { label: 'Lifetime spend', value: summary ? money(summary.totalSpend) : '—', detail: '' },
    ],
    statsLoading: customers.isLoading,
    search: searchInput,
    setSearch: (value: string) => { setSearchInput(value); setPage(1) },
    status,
    range,
    setRange: (next: DateRange | undefined) => { setRangeState(next); setPage(1) },
    statusOptions: CUSTOMER_STATUS_OPTIONS,
    setStatus: (value: CustomerStatusFilter) => { setStatus(value); setPage(1) },
    page,
    pages: customers.data?.pages ?? 1,
    setPage,
    canAdd: canAddCustomers,
    formOpen,
    openForm: () => setFormOpen(true),
    closeForm: () => setFormOpen(false),
    open: (customer: Customer) => navigate(customerPath(customer.id)),
    exportCsv: () => downloadCsv('customers.csv',
      ['Name', 'Phone', 'Email', 'Loyalty code', 'Tier', 'Lifetime spend', 'Orders'],
      rows.map(row => [row.customer.name, row.customer.phone, row.customer.email, row.code, row.tier, row.customer.totalSpent, row.customer.ordersCount])),
    money,
  }
}
