import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { ProgramAssignment, AssignmentStatus } from '../types'

export function useToggleAssignmentStatus() {
  const qc = useQueryClient()

  return useMutation<
    ApiResponse<ProgramAssignment>,
    Error,
    { id: string; status: AssignmentStatus }
  >({
    mutationFn: ({ id, status }) =>
      client
        .patch<ApiResponse<ProgramAssignment>>(ENDPOINTS.PROGRAM_ASSIGNMENTS.TOGGLE_STATUS(id), { status })
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