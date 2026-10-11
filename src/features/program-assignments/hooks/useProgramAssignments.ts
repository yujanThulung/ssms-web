import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiPaginatedResponse } from '../../../lib/api/types'
import type { ProgramAssignment, AssignmentListParams } from '../types'

export function useProgramAssignments(params: AssignmentListParams = {}) {
  return useQuery<ApiPaginatedResponse<ProgramAssignment>, Error>({
    queryKey: [ENDPOINTS.PROGRAM_ASSIGNMENTS.BASE, params],
    queryFn: () =>
      client
        .get<ApiPaginatedResponse<ProgramAssignment>>(ENDPOINTS.PROGRAM_ASSIGNMENTS.BASE, { params })
        .then((r) => r.data),
  })
}
