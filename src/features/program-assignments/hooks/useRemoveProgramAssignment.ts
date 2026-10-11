import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { RemoveAssignmentPayload } from '../types'

export function useRemoveProgramAssignment() {
  const qc = useQueryClient()

  return useMutation<ApiResponse<{ message?: string }>, Error, { id: string; payload?: RemoveAssignmentPayload }>({
    mutationFn: ({ id, payload }) =>
      client
        .delete<ApiResponse<{ message?: string }>>(ENDPOINTS.PROGRAM_ASSIGNMENTS.DETAIL(id), { data: payload })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey[0]
          return typeof key === 'string' && key.startsWith(ENDPOINTS.PROGRAM_ASSIGNMENTS.BASE)
        },
      })
    },
  })
}
