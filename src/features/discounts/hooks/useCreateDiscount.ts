import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { Discount, CreateDiscountPayload } from '../types'

export function useCreateDiscount() {
  const qc = useQueryClient()

  return useMutation<ApiResponse<Discount>, Error, CreateDiscountPayload>({
    mutationFn: (payload) =>
      client
        .post<ApiResponse<Discount>>(ENDPOINTS.DISCOUNTS.BASE, payload)
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
