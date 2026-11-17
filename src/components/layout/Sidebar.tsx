import { HelpCircle, LogOut, MoreHorizontal, Settings, ShieldCheck, Shuffle, X, type LucideIcon } from 'lucide-react'
import { useRef, type CSSProperties } from 'react'
import { NavLink } from 'react-router'
import { Logo } from '@/components/ui/Logo'
import { useDismiss } from '@/hooks/useDismiss'
import { usePermissions } from '@/hooks/usePermissions'
import { cn } from '@/lib/cn'
import { paths } from '@/routes/paths'
import { useMobileSidebar, useSidebar } from './hooks'
import { customerNavItems, navItems, type NavItem } from './nav'

type SidebarModel = ReturnType<typeof useSidebar>

const footerLink = 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white'

/**
 * Active colours are inline and untransitioned: animating out of the hover state could leave
 * the background stuck transparent with the text already its final colour, hiding the link.
 */
const activeLinkStyle = ({ isActive }: { isActive: boolean }): CSSProperties | undefined =>
  isActive ? { backgroundColor: '#1F1F1F', color: '#FFFFFF' } : undefined

function MenuItem({ icon: Icon, label, danger, onClick }: { icon: LucideIcon; label: string; danger?: boolean; onClick: () => void }) {
  return <button type="button" role="menuitem" onClick={onClick} className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition-colors', danger ? 'text-[#B43A16] hover:bg-[#FFE6DD]' : 'text-black/70 hover:bg-[#F0F0EC]')}>
    <Icon size={15}/>{label}
  </button>
}

/** The user row (as in the other apps); opens KYC, Switch business and Log out upward. */
function AccountBlock({ model }: { model: SidebarModel }) {
  const rootRef = useRef<HTMLDivElement>(null)
  useDismiss(rootRef, model.menuOpen, model.closeMenu)
  return <div ref={rootRef} className="relative mt-3 border-t border-white/10 pt-4">
    <button type="button" aria-haspopup="menu" aria-expanded={model.menuOpen} onClick={model.toggleMenu} className="flex w-full items-center gap-3 rounded-xl px-2 text-left">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#D7FF45] text-xs font-extrabold text-black">{model.userInitials}</span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-extrabold text-white">{model.fullName}</span>
        <span className="block truncate text-[10px] text-white/45">{model.businessName}</span>
      </span>
      <MoreHorizontal size={17} className="ml-auto shrink-0 text-white/45"/>
    </button>
    {model.menuOpen && <div role="menu" className="absolute bottom-full left-0 right-0 z-40 mb-2 rounded-2xl border border-black/10 bg-white p-1.5 shadow-[0_20px_50px_rgba(0,0,0,.25)]">
      <div className="rounded-xl bg-[#F6F6F2] px-3 py-2.5">
        <p className="truncate text-xs font-extrabold text-black">{model.fullName}</p>
        <p className="mt-0.5 truncate text-[10px] text-black/45">{model.email}</p>
        <p className="mt-1 text-[9px] font-extrabold uppercase tracking-wider text-black">{model.roleLabel}</p>
      </div>
      <div className="mt-1 flex flex-col gap-0.5">
        <MenuItem icon={ShieldCheck} label="KYC verification" onClick={model.goToKyc}/>
        <MenuItem icon={Shuffle} label="Switch business" onClick={model.switchBusiness}/>
        <div className="mx-2 my-0.5 border-t border-black/10"/>
        <MenuItem icon={LogOut} label="Log out" danger onClick={model.signOut}/>
      </div>
    </div>}
  </div>
}

function NavSection({ title, items, onNavigate }: { title: string; items: NavItem[]; onNavigate: () => void }) {
  if (items.length === 0) return null
  return <div>
    <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/40">{title}</p>
    <nav className="flex flex-col gap-1" aria-label={title}>
      {items.map(({ id, label, icon: Icon, to }) => <NavLink
        key={id}
        to={to}
        end={to === paths.overview}
        onClick={onNavigate}
        className={({ isActive }) => cn('relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold', isActive ? 'bg-[#1F1F1F] text-white before:absolute before:-left-3 before:h-[22px] before:w-[3px] before:rounded-r before:bg-[#D7FF45]' : 'text-white/60 transition-colors hover:bg-white/10 hover:text-white')}
        style={activeLinkStyle}
      >
        {({ isActive }) => <><Icon size={17} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-[#D7FF45]' : undefined}/><span>{label}</span></>}
      </NavLink>)}
    </nav>
  </div>
}

/** The sidebar, laid out as in SyncShip / CLIQBOOK / Payments: static on large screens, a slide-in drawer below that. */
export function Sidebar() {
  const model = useSidebar()
  const { open, close } = useMobileSidebar()
  const { canOpen, canManageSetup } = usePermissions()
  const { verification } = model
  const drawerRef = useRef<HTMLElement>(null)
  // On large screens the sidebar is always there, so this only ever dismisses the drawer.
  useDismiss(drawerRef, open, close)

  return <>
    {open && <button type="button" aria-label="Close menu" onClick={close} className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"/>}
    <aside ref={drawerRef} className={cn('fixed inset-y-0 left-0 z-40 flex w-[248px] max-w-[85vw] flex-col bg-black text-white shadow-[15px_0_50px_rgba(0,0,0,.24)] transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none', open ? 'translate-x-0' : '-translate-x-full')}>
      <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 px-5">
        <Logo inverse/>
        <button type="button" aria-label="Close menu" onClick={close} className="rounded-lg p-2 text-white hover:bg-white/10 lg:hidden"><X size={18}/></button>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <NavSection title="Workspace" items={navItems.filter(item => canOpen(item.to))} onNavigate={close}/>
        <NavSection title="Customer view" items={customerNavItems.filter(item => canOpen(item.to))} onNavigate={close}/>
      </div>

      <div className="mt-auto shrink-0 border-t border-white/10 px-3 pb-4 pt-4">
        {verification.loaded && !verification.complete && <button type="button" onClick={model.goToKyc} className="mx-1 mb-4 block w-[calc(100%-0.5rem)] rounded-xl border border-white/10 bg-[#141414] p-4 text-left">
          <span className="mb-3 flex items-center justify-between">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#D7FF45]/15 text-[#D7FF45]"><ShieldCheck size={16}/></span>
            <span className="text-[10px] font-extrabold text-[#D7FF45]">{verification.percent}%</span>
          </span>
          <span className="block text-xs font-extrabold text-white">Finish verification</span>
          <span className="mt-1 block text-[10px] leading-4 text-white/50">Verify your business to unlock everything.</span>
          <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-[#D7FF45]" style={{ width: `${verification.percent}%` }}/></span>
        </button>}
        <button type="button" onClick={model.openHelp} className={footerLink}><HelpCircle size={17}/> Help & support</button>
        {canManageSetup && <button type="button" onClick={model.openSettings} className={footerLink}><Settings size={17}/> Settings</button>}
        <AccountBlock model={model}/>
      </div>
    </aside>
  </>
}
