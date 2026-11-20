import { Suspense } from 'react'
import { useSearchParams } from 'react-router'
import { EmbeddedPage, PageHeading, Tabs } from '@/components/ui/mk'
import { CardGridSkeleton } from '@/components/ui/CardSkeleton'
import { usePermissions } from '@/hooks/usePermissions'
import { pages } from '@/routes/pages'
import { paths } from '@/routes/paths'

type HubTab = 'customers' | 'segments'

/**
 * Customers, with Segments as a tab instead of its own sidebar item. The tab is in the address
 * (?tab=segments), so /segments redirects here and a refresh keeps the tab.
 */
export default function CustomersHubPage() {
  const [params, setParams] = useSearchParams()
  const { canOpen } = usePermissions()
  const options: { value: HubTab; label: string }[] = [
    { value: 'customers', label: 'Customers' },
    ...(canOpen(paths.segments) ? [{ value: 'segments' as const, label: 'Segments' }] : []),
  ]
  const tab: HubTab = options.find(option => option.value === params.get('tab'))?.value ?? 'customers'
  const setTab = (next: HubTab) => setParams(next === 'customers' ? {} : { tab: next }, { replace: true })

  return <div className="space-y-5">
    <PageHeading title="Customers" subtitle="People building habits with your business, and the groups they fall into."/>
    {options.length > 1 && <Tabs options={options} value={tab} onChange={setTab}/>}
    <EmbeddedPage>
      <Suspense fallback={<CardGridSkeleton count={3} gridClassName="grid gap-4 md:grid-cols-3" footer={2}/>}>
        {tab === 'segments' ? <pages.SegmentsPage/> : <pages.CustomersPage/>}
      </Suspense>
    </EmbeddedPage>
  </div>
}
