import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { Discount, ChangeDiscountStatusPayload } from '../types'

export function useChangeDiscountStatus(id: string) {
  const qc = useQueryClient()

  return useMutation<ApiResponse<Discount>, Error, ChangeDiscountStatusPayload>({
    mutationFn: (payload) =>
      client
        .patch<ApiResponse<Discount>>(ENDPOINTS.DISCOUNTS.STATUS(id), payload)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey[0]
          return typeof key === 'string' && key.startsWith(ENDPOINTS.DISCOUNTS.BASE)
        },
      })
    },
  })
}
