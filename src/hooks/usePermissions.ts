import { useMemo } from 'react'
import { ACCESS, PAGE_AREAS, type AccessArea } from '@/lib/access-map'
import { allows, isAdminLike, isOwnerLogin, ruleForPath, type AccessSubject } from '@/lib/sink-permissions'
import { useAuthStore } from '@/stores/auth-store'

/** What this login may do in maheleKart: sink's checks (owner bypass → checklist → flag → role rule) per area. */
export const permissionsFor = (subject: AccessSubject) => {
  const can = (area: AccessArea) => allows(ACCESS[area], subject)
  const isOwner = isOwnerLogin(subject.role)
  return {
    isOwner,
    isAdminLike: isAdminLike(subject.role ?? undefined) || isOwner,
    canOpen: (path: string) => { const area = ruleForPath(path, PAGE_AREAS); return area ? can(area) : true },
    canViewLoyalty: can('loyalty'),
    canManageLoyalty: can('manageLoyalty'),
    canScan: can('scanner'),
    canViewRewards: can('rewards'),
    canViewCustomers: can('customers'),
    canAddCustomers: can('addCustomers'),
    canEditCustomers: can('editCustomers'),
    canDeleteCustomers: can('deleteCustomers'),
    canViewMessages: can('messages'),
    canSendMessages: can('sendMessages'),
    canBuyCredits: can('buyCredits'),
    canManageSetup: can('setup'),
  }
}

export type Permissions = ReturnType<typeof permissionsFor>

/** What the signed-in user may see and do, from their role and the permissions their login carries. */
export const usePermissions = (): Permissions => {
  const role = useAuthStore(state => state.user?.role)
  const permissions = useAuthStore(state => state.user?.permissions)
  return useMemo(() => permissionsFor({ role, permissions }), [role, permissions])
}
