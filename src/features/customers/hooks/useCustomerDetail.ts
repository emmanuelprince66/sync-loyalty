import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useCustomer, useCustomerTransactions, useDeleteCustomer } from '@/api/customers'
import { useLoyaltyCustomers, useMemberWallet } from '@/api/loyalty'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { usePermissions } from '@/hooks/usePermissions'
import { paths } from '@/routes/paths'

/** One customer: profile (customer/single), loyalty card (loyalty/progress by their code), recent activity (customer/transactions). */
export function useCustomerDetail() {
  const { customerId = '' } = useParams()
  const navigate = useNavigate()
  const money = useFormatMoney()
  const { canEditCustomers, canDeleteCustomers, canScan } = usePermissions()
  const detail = useCustomer(customerId)
  const loyalty = useLoyaltyCustomers()
  const member = (loyalty.data ?? []).find(item => item.id === customerId)
  const code = member?.code || detail.data?.customer.code || ''
  const wallet = useMemberWallet(code)
  const activity = useCustomerTransactions(customerId, { page: 1, limit: 8, type: 'ALL' })
  const remove = useDeleteCustomer()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const d = detail.data
  return {
    isLoading: detail.isLoading,
    isError: detail.isError,
    retry: () => { void detail.refetch() },
    customer: d?.customer ?? null,
    code,
    stats: d ? [
      { label: 'Lifetime spend', value: money(d.totalSpend) },
      { label: 'Total orders', value: d.totalOrders.toLocaleString() },
      { label: 'Average basket', value: money(d.averageBasket) },
    ] : [],
    tier: member?.tier || d?.tier || '',
    wallet: wallet.data ?? null,
    walletLoading: Boolean(code) && wallet.isLoading,
    activity: (activity.data?.rows ?? []).map(item => ({ id: item.id, title: item.title || item.type, amount: money(item.amount), inflow: item.flow === 'INFLOW', date: item.createdAt })),
    activityLoading: activity.isLoading,
    canEdit: canEditCustomers,
    canDelete: canDeleteCustomers,
    canScan,
    editing,
    edit: () => setEditing(true),
    closeEdit: () => setEditing(false),
    confirmDelete,
    askDelete: () => setConfirmDelete(true),
    cancelDelete: () => setConfirmDelete(false),
    deleting: remove.isPending,
    remove: () => remove.mutate(customerId, {
      onSuccess: () => { toast.success('Customer deleted'); navigate(paths.customers) },
      onError: error => toast.error(errorMessage(error, 'Could not delete the customer.')),
    }),
    back: () => navigate(paths.customers),
    checkIn: () => navigate(`${paths.scanner}?code=${encodeURIComponent(code)}`),
  }
}
