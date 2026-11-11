import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { Payment, CreatePaymentPayload } from '../types'

export function useCreatePayment() {
  const qc = useQueryClient()

  return useMutation<Payment, Error, CreatePaymentPayload>({
    mutationFn: async (payload) => {
      const response = await client.post(ENDPOINTS.PAYMENTS.BASE, payload)
      const body = response.data
      if (body && typeof body === 'object' && 'data' in body && body.data) {
        return body.data as Payment
      }
      return body as Payment
    },
    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey[0]
          return typeof key === 'string' && key.startsWith(ENDPOINTS.PAYMENTS.BASE)
        },
      })
      // Also invalidate invoices (payment changes invoice status)
      qc.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey[0]
          return typeof key === 'string' && key.startsWith(ENDPOINTS.INVOICES.BASE)
        },
      })
    },
  })
}
