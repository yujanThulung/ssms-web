import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { FeeCategory, CreateFeeCategoryPayload } from '../types'

export function useCreateFeeCategory() {
  const qc = useQueryClient()

  return useMutation<ApiResponse<FeeCategory>, Error, CreateFeeCategoryPayload>({
    mutationFn: (payload) =>
      client
        .post<ApiResponse<FeeCategory>>(ENDPOINTS.FEE_CATEGORIES.BASE, payload)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey[0]
          return typeof key === 'string' && key.startsWith(ENDPOINTS.FEE_CATEGORIES.BASE)
        },
      })
    },
  })
}
