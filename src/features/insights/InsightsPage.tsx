import { useState } from 'react'
import { format } from 'date-fns'
import { DateRangeFilter, type DateRange } from '@/components/ui/DateRangeFilter'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { useCustomerInsights, type InsightMetric } from '@/api/insights'
import { Badge, Card, EmptyBlock, ErrorBlock, PageHeading, initialsOf } from '@/components/ui/mk'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { cn } from '@/lib/cn'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { CardSkeleton } from '@/components/ui/CardSkeleton'

const axis = { fontSize: 10, fill: 'rgba(0,0,0,.45)' }
const tooltipStyle = { contentStyle: { borderRadius: 0, border: '1px solid rgba(0,0,0,.1)', fontSize: 11 }, cursor: { fill: 'rgba(0,0,0,.04)' } }

/** Churn going up is bad; everything else going up is good. */
const isGood = (metric: InsightMetric) => (metric.key === 'churn_rate' ? metric.change <= 0 : metric.change >= 0)
const changeText = (metric: InsightMetric) => `${metric.change >= 0 ? '+' : ''}${metric.change}${metric.unit === 'pt' ? 'pt' : metric.unit === 'x' ? 'x' : '%'} vs last month`

function MetricTile({ metric, money, dark }: { metric: InsightMetric; money: (value: number) => string; dark?: boolean }) {
  const value = metric.formatted || (metric.money ? money(metric.value) : metric.percent ? `${metric.value.toFixed(1).replace(/\.0$/, '')}%` : metric.value.toLocaleString())
  const good = isGood(metric)
  return <Card className={cn('p-5', dark && 'bg-black text-white')}>
    <p className={cn('text-[10px] font-extrabold uppercase tracking-wider', dark ? 'text-white/45' : 'text-black/40')}>{metric.label}</p>
    <p className="mt-3 truncate text-2xl font-black tracking-[-.04em]">{value}</p>
    <p className={cn('mt-2 inline-flex items-center gap-1 text-[10px] font-extrabold', good ? (dark ? 'text-[#D7FF45]' : 'text-[#237A49]') : 'text-[#B43A16]')}>{metric.change >= 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}{changeText(metric)}</p>
  </Card>
}

/** sink's Customers › Overview + Analytics: growth KPIs, three charts and the top spenders. */
export default function InsightsPage() {
  const money = useFormatMoney()
  const [range, setRange] = useState<DateRange | undefined>()
  // As sink's Customers screen: one date control, and the analytics take the month of its start.
  const month = format(range?.from ?? new Date(), 'yyyy-MM')
  const insights = useCustomerInsights(month)
  const d = insights.data

  return <div className="space-y-5">
    <PageHeading badge="INSIGHTS" title="How your customers are growing." subtitle="Retention, lifetime value and who your best customers are."
      actions={<DateRangeFilter value={range} onChange={setRange} max={new Date()} className="w-full sm:w-56"/>}/>

    {insights.isError ? <Card><ErrorBlock text="We couldn’t load your insights." onRetry={() => { void insights.refetch() }}/></Card>
      : <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {insights.isLoading || !d ? Array.from({ length: 8 }, (_, index) => <CardSkeleton key={index} footer={0} dark={index === 0}/>)
            : d.metrics.map((metric, index) => <MetricTile key={metric.key} metric={metric} money={money} dark={index === 0}/>)}
        </div>

        {d && <div className="grid gap-5 xl:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-start justify-between"><div><h3 className="text-sm font-black">Customer growth</h3><p className="mt-1 text-[11px] text-black/45">{format(range?.from ?? new Date(), 'MMMM yyyy')} · {d.totalCustomers.toLocaleString()} customers{d.ytdGrowth ? ` · ${d.ytdGrowth} this year` : ''}</p></div><Badge>Total</Badge></div>
            <div className="mt-4 h-60">{d.growth.length === 0 ? <EmptyBlock title="No data yet" text="Growth shows once you have customers."/> : <ResponsiveContainer width="100%" height="100%"><LineChart data={d.growth}><CartesianGrid stroke="rgba(0,0,0,.06)" vertical={false}/><XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false}/><YAxis tick={axis} axisLine={false} tickLine={false} width={36}/><Tooltip {...tooltipStyle}/><Line type="monotone" dataKey="total" name="Customers" stroke="#000" strokeWidth={2.5} dot={false}/></LineChart></ResponsiveContainer>}</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-start justify-between"><div><h3 className="text-sm font-black">New vs returning</h3><p className="mt-1 text-[11px] text-black/45">Who bought each month</p></div><div className="flex gap-3 text-[10px] font-bold"><span className="flex items-center gap-1"><i className="h-2 w-2 bg-black"/>Returning</span><span className="flex items-center gap-1"><i className="h-2 w-2 bg-[#D7FF45]"/>New</span></div></div>
            <div className="mt-4 h-60">{d.newVsReturning.length === 0 ? <EmptyBlock title="No data yet" text="This fills in as customers buy."/> : <ResponsiveContainer width="100%" height="100%"><BarChart data={d.newVsReturning}><CartesianGrid stroke="rgba(0,0,0,.06)" vertical={false}/><XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false}/><YAxis tick={axis} axisLine={false} tickLine={false} width={36}/><Tooltip {...tooltipStyle}/><Bar dataKey="returning" name="Returning" stackId="a" fill="#000"/><Bar dataKey="new" name="New" stackId="a" fill="#D7FF45"/></BarChart></ResponsiveContainer>}</div>
          </Card>
          <Card className="p-5 xl:col-span-2">
            <h3 className="text-sm font-black">Retention</h3><p className="mt-1 text-[11px] text-black/45">Share of customers who came back</p>
            <div className="mt-4 h-52">{d.retention.length === 0 ? <EmptyBlock title="No data yet" text="Retention shows after your second month."/> : <ResponsiveContainer width="100%" height="100%"><LineChart data={d.retention}><CartesianGrid stroke="rgba(0,0,0,.06)" vertical={false}/><XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false}/><YAxis tick={axis} axisLine={false} tickLine={false} width={36} unit="%"/><Tooltip {...tooltipStyle}/><Line type="monotone" dataKey="rate" name="Retention %" stroke="#FF6B3D" strokeWidth={2.5} dot={{ r: 3, fill: '#FF6B3D' }}/></LineChart></ResponsiveContainer>}</div>
          </Card>
        </div>}

        {insights.isLoading && <Card className="overflow-hidden"><div className="border-b border-black/10 p-5"><h3 className="text-sm font-black">Top spenders</h3></div><TableSkeleton rows={5} columns={[{ width: 'w-6' }, { thumbnail: true, flex: true, twoLine: true }, { width: 'w-10' }, { width: 'w-24' }, { width: 'w-20', hiddenOnMobile: true }, { width: 'w-24', hiddenOnMobile: true }]}/></Card>}
        {d && <Card className="overflow-hidden">
          <div className="border-b border-black/10 p-5"><h3 className="text-sm font-black">Top spenders</h3><p className="mt-1 text-[11px] text-black/45">Your most valuable customers</p></div>
          {d.topSpenders.length === 0 ? <EmptyBlock title="No spenders yet" text="Customers appear here once they buy."/>
            : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs">
              <thead className="bg-[#F7F7F4] text-[10px] uppercase tracking-wider text-black/45"><tr><th className="px-5 py-3">#</th><th>Customer</th><th>Visits</th><th>Lifetime value</th><th>Avg spend</th><th>Retention</th></tr></thead>
              <tbody>{d.topSpenders.map(row => <tr key={row.id || row.rank} className="border-t border-black/10">
                <td className="px-5 py-3 font-black">{row.rank}</td>
                <td><span className="flex items-center gap-3 py-1"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#F0F0EC] text-[10px] font-black">{row.initials || initialsOf(row.name)}</span><span><b className="block">{row.name}</b>{row.tier && <span className="text-[10px] text-black/45">{row.tier}</span>}</span></span></td>
                <td>{row.visits}</td><td className="font-black">{money(row.lifetime)}</td><td>{money(row.avgSpend)}</td>
                <td><span className="flex items-center gap-2"><span className="h-1.5 w-16 overflow-hidden rounded-full bg-black/10"><span className="block h-full bg-black" style={{ width: `${Math.min(100, row.retention)}%` }}/></span>{row.retention.toFixed(0)}</span></td>
              </tr>)}</tbody>
            </table></div>}
        </Card>}
      </>}
  </div>
}
