import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'
import { requireBusinessId } from './business'
import { loyaltyKeys } from './loyalty'
import { queryKeys } from './query-keys'

/**
 * Recording a visit, sink-inventory's way: a sale with the customer on it (POS RecieptPage →
 * POST sale/{business_id}/). The backend counts the visit and spend toward the customer's loyalty
 * from the sale; there is no separate "visit" call. A ready reward rides on the same sale as
 * `loyalty_reward_id`: the backend zeroes that item, marks the reward REDEEMED and records it.
 */

export type SaleMethod = 'CASH' | 'POS' | 'CARD'
export type SaleLine = { id: string; type: 'PRODUCT' | 'SERVICE'; quantity: number; unitPrice: number }
export type VisitSaleInput = { customerId: string; lines: SaleLine[]; method: SaleMethod; rewardId?: string }

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const recordVisitSale = (input: VisitSaleInput) => {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `visit-${Date.now()}`
  const attendant = useAuthStore.getState().user?.id
  return apiRequest<unknown>(`sale/${requireBusinessId()}/`, {
    method: 'POST',
    body: {
      client_sale_id: id,
      idempotency_key: `visit-${id}`,
      date: today(),
      method: input.method,
      description: 'Loyalty visit',
      customer: input.customerId,
      ...(attendant ? { attendant } : {}),
      products: input.lines.map(line => ({ id: line.id, type: line.type, quantity: String(line.quantity), unit_price: line.unitPrice.toFixed(2) })),
      ...(input.rewardId ? { loyalty_reward_id: input.rewardId } : {}),
    },
  })
}

export const useRecordVisit = () => {
  const client = useQueryClient()
  return useMutation({
    mutationFn: recordVisitSale,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: loyaltyKeys.all })
      void client.invalidateQueries({ queryKey: queryKeys.customers })
    },
  })
}
