import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { FeeCategory, UpdateFeeCategoryPayload } from '../types'

export function useUpdateFeeCategory(id: string) {
  const qc = useQueryClient()

  return useMutation<ApiResponse<FeeCategory>, Error, UpdateFeeCategoryPayload>({
    mutationFn: (payload) =>
      client
        .patch<ApiResponse<FeeCategory>>(ENDPOINTS.FEE_CATEGORIES.DETAIL(id), payload)
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
