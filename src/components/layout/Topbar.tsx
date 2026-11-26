import { Bell, Menu } from 'lucide-react'
// import { cn } from '@/lib/cn' // only used by the KYC badge, switched off for now
import { useMobileSidebar, useTopbar } from './hooks'
import { InstallAppButton } from '@/components/pwa/InstallPrompt'
import { ProfileMenu } from './ProfileMenu'

/** Same bar as SyncShip, CLIQBOOK and Payments: greeting + business, notifications, profile. Pages carry their own titles. */
export function Topbar() {
  const bar = useTopbar()
  const { openMenu } = useMobileSidebar()
  return <header className="sticky top-0 z-20 flex h-[76px] shrink-0 items-center justify-between gap-3 border-b border-black/10 bg-white/95 px-4 backdrop-blur-md sm:px-5 md:px-8">
    <button type="button" aria-label="Open menu" onClick={openMenu} className="shrink-0 rounded-full border border-black/10 bg-white p-2.5 hover:bg-[#F2F2EF] lg:hidden"><Menu size={17}/></button>
    <div className="min-w-0 flex-1">
      {/* Phones: "Welcome back," sits above the name so the full name fits. */}
      {bar.firstName && <p className="text-[10px] font-semibold leading-none text-black/45 sm:hidden">Welcome back,</p>}
      <div className="mt-1 flex min-w-0 items-center gap-1.5 sm:mt-0 sm:gap-2">
        <p className="min-w-0 truncate text-sm font-extrabold sm:text-[19px] sm:tracking-[-0.02em]">
          <span className="hidden sm:inline">Welcome back{bar.firstName && ', '}</span>
          {bar.firstName ? <span className="bg-[linear-gradient(transparent_62%,#D7FF45_62%)] px-0.5">{bar.firstName}</span> : <span className="sm:hidden">Welcome back</span>}
        </p>
        {/* KYC is switched off in maheleKart for now (commented out, not deleted).
        {bar.verification && <button type="button" onClick={bar.goToKyc} className={cn('shrink-0 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-extrabold sm:px-2 sm:text-[11px]', bar.verification.ok ? 'bg-[#D7FF45] text-black' : 'bg-[#FFF7DF] text-[#8F5F00]')}>{bar.verification.text}</button>}
        */}
      </div>
      <p className="hidden truncate text-[11px] font-semibold text-black/45 sm:block">{bar.businessName ? `Managing ${bar.businessName}` : 'Dashboard overview'} · {bar.date}</p>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      {/* Phones: icon only, so the greeting keeps its room. */}
      <InstallAppButton className="max-sm:w-10 max-sm:justify-center max-sm:px-0 max-sm:[&>span]:sr-only"/>
      <span className="relative rounded-full border border-black/10 bg-white p-2.5 text-black/55" role="status" aria-label={bar.unread > 0 ? `${bar.unread} unread notifications` : 'No unread notifications'}>
        <Bell size={17}/>{bar.unread > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#FF6B3D] ring-2 ring-white"/>}
      </span>
      <span className="hidden h-7 w-px bg-black/10 sm:block" aria-hidden="true"/>
      <ProfileMenu/>
    </div>
  </header>
}
