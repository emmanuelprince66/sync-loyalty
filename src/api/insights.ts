import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { useCurrentBusinessId } from './business'
import { asRecord, listFrom, num, str } from './http'

/**
 * Customer growth analytics, as sink-inventory's Customers › Overview and Analytics tabs:
 *  GET customer/analytics/dashboard/{business_id}/?month=YYYY-MM → { overview, charts, top_spending_customers }
 * Each overview metric carries its month-on-month change (mom_percentage, mom_point_change or mom_change).
 */

export type InsightMetric = { key: string; label: string; value: number; formatted: string; change: number; unit: 'pct' | 'pt' | 'x'; money: boolean; percent: boolean }
export type TopSpender = { id: string; rank: number; name: string; initials: string; tier: string; visits: number; lifetime: number; avgSpend: number; retention: number }
export type CustomerInsights = {
  metrics: InsightMetric[]
  retention: { month: string; rate: number }[]
  newVsReturning: { month: string; new: number; returning: number }[]
  growth: { month: string; total: number }[]
  totalCustomers: number
  ytdGrowth: string
  topSpenders: TopSpender[]
}

/** The overview metrics, in sink's order. */
const METRICS: { key: string; label: string; money?: boolean; percent?: boolean }[] = [
  { key: 'total_customers', label: 'Total customers' },
  { key: 'active_customers', label: 'Active customers' },
  { key: 'new_this_month', label: 'New this month' },
  { key: 'returning_customers', label: 'Returning' },
  { key: 'retention_rate', label: 'Retention rate', percent: true },
  { key: 'churn_rate', label: 'Churn rate', percent: true },
  { key: 'avg_lifetime_value', label: 'Avg lifetime value', money: true },
  { key: 'loyalty_members', label: 'Loyalty members' },
  { key: 'repeat_purchase_rate', label: 'Repeat purchase rate', percent: true },
  { key: 'avg_visit_frequency', label: 'Visit frequency' },
  { key: 'avg_order_value', label: 'Avg order value', money: true },
  { key: 'revenue_per_customer', label: 'Revenue per customer', money: true },
]

const getInsights = async (businessId: string, month: string): Promise<CustomerInsights> => {
  const raw = asRecord(await apiRequest<unknown>(`customer/analytics/dashboard/${businessId}/${month ? `?month=${month}` : ''}`))
  const root = asRecord(raw.data ?? raw)
  const overview = asRecord(root.overview)
  const charts = asRecord(root.charts)
  const growth = asRecord(charts.total_customer_growth)
  return {
    metrics: METRICS.map(({ key, label, money = false, percent = false }) => {
      const m = asRecord(overview[key])
      const unit = m.mom_point_change !== undefined ? 'pt' : m.mom_change !== undefined ? 'x' : 'pct'
      return { key, label, value: num(m.value), formatted: str(m.formatted), change: num(m.mom_percentage ?? m.mom_point_change ?? m.mom_change), unit, money, percent }
    }),
    retention: listFrom(charts.customer_retention, []).map(item => { const p = asRecord(item); return { month: str(p.month), rate: num(p.retention_rate) } }),
    newVsReturning: listFrom(charts.new_vs_returning, []).map(item => { const p = asRecord(item); return { month: str(p.month), new: num(p.new_customers), returning: num(p.returning_customers) } }),
    growth: listFrom(growth.chart_data, []).map(item => { const p = asRecord(item); return { month: str(p.month), total: num(p.total_customers) } }),
    totalCustomers: num(growth.total_customers),
    ytdGrowth: str(growth.ytd_growth_percentage),
    topSpenders: listFrom(root.top_spending_customers, []).map(item => {
      const c = asRecord(item)
      return { id: str(c.id), rank: num(c.rank), name: str(c.name), initials: str(c.initials), tier: str(c.tier_name), visits: num(c.visits), lifetime: num(c.lifetime_value), avgSpend: num(c.avg_spend), retention: num(c.retention_score) }
    }),
  }
}

export const useCustomerInsights = (month: string) => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({ queryKey: ['insights', businessId, month], queryFn: () => getInsights(businessId as string, month), enabled: Boolean(businessId) })
}
