import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { PageLoader } from '@/components/ui/misc'
import { CreateLoyaltyModal } from '@/features/loyalty/components/CreateLoyaltyModal'
import { usePermissionsSync } from '@/hooks/usePermissionsSync'
import { usePreloadAppShell } from '@/routes/usePreloadAppShell'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

/** The design's shell: black sidebar + off-white column with the header stuck to its top. */
export function AppLayout() {
  usePreloadAppShell()
  usePermissionsSync()
  return <div className="flex h-[100dvh] overflow-hidden bg-[#F6F6F2] text-black">
    <Sidebar/>
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <Topbar/>
      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-5 lg:p-7 xl:p-8"><Suspense fallback={<PageLoader/>}><Outlet/></Suspense></main>
    </div>
    <CreateLoyaltyModal/>
  </div>
}
