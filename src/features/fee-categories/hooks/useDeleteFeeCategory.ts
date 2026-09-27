import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'

export function useDeleteFeeCategory() {
  const qc = useQueryClient()

  return useMutation<ApiResponse<void>, Error, string>({
    mutationFn: (id: string) =>
      client
        .delete<ApiResponse<void>>(ENDPOINTS.FEE_CATEGORIES.DETAIL(id))
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
