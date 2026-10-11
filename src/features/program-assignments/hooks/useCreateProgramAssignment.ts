import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { ProgramAssignment, CreateAssignmentPayload } from '../types'

export function useCreateProgramAssignment() {
  const qc = useQueryClient()

  return useMutation<ApiResponse<ProgramAssignment>, Error, CreateAssignmentPayload>({
    mutationFn: (payload) =>
      client
        .post<ApiResponse<ProgramAssignment>>(ENDPOINTS.PROGRAM_ASSIGNMENTS.BASE, payload)
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
