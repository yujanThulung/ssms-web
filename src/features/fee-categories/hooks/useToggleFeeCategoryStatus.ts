import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { FeeCategory } from '../types'

export function useToggleFeeCategoryStatus() {
  const qc = useQueryClient()

  return useMutation<
    ApiResponse<FeeCategory>,
    Error,
    { id: string; currentStatus: 'ACTIVE' | 'INACTIVE' }
  >({
    mutationFn: async ({ id, currentStatus }) => {
      const endpoint = currentStatus === 'ACTIVE'
        ? ENDPOINTS.FEE_CATEGORIES.DEACTIVATE(id)
        : ENDPOINTS.FEE_CATEGORIES.ACTIVATE(id)

      try {
        const response = await client.patch<ApiResponse<FeeCategory>>(endpoint)
        return response.data
      } catch {
        // Fallback to PATCH /fee-categories/:id if dedicated toggle endpoint isn't supported
        const fallbackStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
        const response = await client.patch<ApiResponse<FeeCategory>>(
          ENDPOINTS.FEE_CATEGORIES.DETAIL(id),
          { status: fallbackStatus }
        )
        return response.data
      }
    },
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
