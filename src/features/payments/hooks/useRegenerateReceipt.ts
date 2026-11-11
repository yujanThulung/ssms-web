import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { RegenerateReceiptResponse } from '../types'

export function useRegenerateReceipt() {
  const qc = useQueryClient()

  return useMutation<RegenerateReceiptResponse, Error, string>({
    mutationFn: async (paymentId: string) => {
      const response = await client.post(ENDPOINTS.PAYMENTS.REGENERATE_RECEIPT(paymentId))
      return response.data as RegenerateReceiptResponse
    },
    onSuccess: (_data, paymentId) => {
      qc.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey[0]
          return typeof key === 'string' && key.includes(paymentId)
        },
      })
    },
  })
}
