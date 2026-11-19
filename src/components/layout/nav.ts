import { BarChart3, Gift, LayoutDashboard, MessageSquare, PieChart, ScanLine, Share2, Smartphone, Trophy, Users, type LucideIcon } from 'lucide-react'
import { paths } from '@/routes/paths'

export type NavItem = { id: string; label: string; icon: LucideIcon; to: string }

/** Workspace: the business screens. */
export const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, to: paths.overview },
  { id: 'insights', label: 'Insights', icon: BarChart3, to: paths.insights },
  { id: 'loyalty', label: 'Loyalty', icon: Trophy, to: paths.loyalty },
  { id: 'customers', label: 'Customers', icon: Users, to: paths.customers },
  { id: 'segments', label: 'Segments', icon: PieChart, to: paths.segments },
  { id: 'scanner', label: 'Scanner', icon: ScanLine, to: paths.scanner },
  { id: 'rewards', label: 'Rewards', icon: Gift, to: paths.rewards },
  { id: 'messages', label: 'Messages', icon: MessageSquare, to: paths.messages },
  { id: 'referrals', label: 'Referrals', icon: Share2, to: paths.referrals },
  // Card studio is switched off: sink has none; the join card lives on each programme (QR) and takes the store colour.
  // { id: 'cardStudio', label: 'Card studio', icon: Palette, to: paths.cardStudio },
]

/** Customer view: what members see on their phones. */
export const customerNavItems: NavItem[] = [
  { id: 'wallet', label: 'Member cards', icon: Smartphone, to: paths.wallet },
]
