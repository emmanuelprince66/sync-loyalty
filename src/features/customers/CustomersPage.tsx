import { Activity, Download, Plus, Search, Upload, Users, WalletCards } from 'lucide-react'
import { useNavigate } from 'react-router'
import { paths } from '@/routes/paths'
import { Badge, Card, EmptyBlock, ErrorBlock, Metric, MetricSkeleton, MkButton, PageHeading } from '@/components/ui/mk'
import { Pagination } from '@/components/ui/Pagination'
import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import { CustomerFormModal } from './components/CustomerFormModal'
import { useCustomersPage } from './hooks/useCustomersPage'
import { TableSkeleton } from '@/components/ui/TableSkeleton'

const icons = [Users, Activity, WalletCards]

export default function CustomersPage() {
  const page = useCustomersPage()
  const navigate = useNavigate()
  return <div className="space-y-5">
    <PageHeading title="Customers" subtitle="People building habits with your business." actions={<>
      <DateRangeFilter value={page.range} onChange={page.setRange} className="w-full sm:w-56"/>
      <MkButton secondary onClick={page.exportCsv} disabled={page.rows.length === 0}><Download size={14}/>Export members</MkButton>
      {page.canAdd && <MkButton secondary onClick={() => navigate(paths.importCustomers)}><Upload size={14}/>Import</MkButton>}
      {page.canAdd && <MkButton onClick={page.openForm}><Plus size={14}/>Add customer</MkButton>}
    </>}/>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1">
      {page.statsLoading
        ? Array.from({ length: 3 }, (_, index) => <MetricSkeleton key={index}/>)
        : page.metrics.map((metric, index) => <Metric key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} icon={icons[index]}/>)}
    </div>

    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 p-4">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-[#F1F1ED] px-4 sm:max-w-[320px]"><Search size={14}/><input value={page.search} onChange={event => page.setSearch(event.target.value)} className="w-full bg-transparent text-xs outline-none" placeholder="Search name, phone or email"/></label>
        <select aria-label="Filter customers" value={page.status} onChange={event => page.setStatus(event.target.value as typeof page.status)} className="h-10 rounded-full border border-black/10 bg-white px-3 text-[10px] font-bold">
          {page.statusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>
      {page.isError
        ? <ErrorBlock text="We couldn’t load your customers." onRetry={page.retry}/>
        : page.isLoading
          ? <TableSkeleton rows={6} columns={[{ thumbnail: true, flex: true, twoLine: true }, { pill: true, hiddenOnMobile: true }, { width: 'w-12', hiddenOnMobile: true }, { width: 'w-24' }, { width: 'w-28', twoLine: true, hiddenOnMobile: true }, { width: 'w-6', alignRight: true }]}/>
          : page.rows.length === 0
            ? <EmptyBlock title="No customers found" text={page.search ? 'Try another name, phone or email.' : 'Customers appear here when they buy from you or join a loyalty program.'} action={page.canAdd && !page.search && <MkButton onClick={page.openForm}><Plus size={14}/>Add customer</MkButton>}/>
            : <>
              <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[800px] text-left text-xs">
                <thead className="bg-[#F7F7F4] text-[9px] uppercase tracking-wider text-black/45"><tr><th className="px-5 py-3">Customer</th><th>Tier</th><th>Orders</th><th>Lifetime spend</th><th>Loyalty progress</th><th/></tr></thead>
                <tbody>{page.rows.map(row => <tr key={row.customer.id} className="border-t border-black/10">
                  <td className="px-5 py-4"><button type="button" onClick={() => page.open(row.customer)} className="text-left"><b className="block">{row.customer.name}</b><span className="text-[9px] text-black/40">{[row.code, row.customer.phone].filter(Boolean).join(' · ')}</span></button></td>
                  <td>{row.tier ? <Badge tone="gray">{row.tier}</Badge> : '—'}</td>
                  <td className="font-black">{row.customer.ordersCount}</td>
                  <td className="font-black">{page.money(row.customer.totalSpent)}</td>
                  <td>{row.target ? <Badge tone={row.visits >= row.target ? 'lime' : 'gray'}>{row.visits >= row.target ? 'Ready' : `${row.target - row.visits} to go`}</Badge> : <span className="text-black/35">Not a member</span>}</td>
                  <td className="pr-5 text-right"><button type="button" onClick={() => page.open(row.customer)} className="font-extrabold">View →</button></td>
                </tr>)}</tbody>
              </table></div>
              <div className="divide-y divide-black/10 md:hidden">{page.rows.map(row => <button key={row.customer.id} type="button" onClick={() => page.open(row.customer)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                <div className="min-w-0"><b className="block truncate text-xs">{row.customer.name}</b><span className="block truncate text-[9px] text-black/40">{row.code || row.customer.phone}</span></div>
                <div className="shrink-0 text-right"><b className="block text-xs">{page.money(row.customer.totalSpent)}</b>{row.target > 0 && <span className="text-[9px] text-black/45">{row.visits}/{row.target} visits</span>}</div>
              </button>)}</div>
            </>}
      {page.pages > 1 && <Pagination currentPage={page.page} totalPages={page.pages} onPageChange={page.setPage}/>}
    </Card>

    <CustomerFormModal open={page.formOpen} customer={null} onClose={page.closeForm}/>
  </div>
}
