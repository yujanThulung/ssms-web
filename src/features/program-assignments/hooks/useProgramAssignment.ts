import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { ProgramAssignment } from '../types'

export function useProgramAssignment(id: string | null | undefined) {
  return useQuery<ApiResponse<ProgramAssignment>, Error>({
    queryKey: [ENDPOINTS.PROGRAM_ASSIGNMENTS.BASE, id],
    queryFn: () =>
      client
        .get<ApiResponse<ProgramAssignment>>(ENDPOINTS.PROGRAM_ASSIGNMENTS.DETAIL(id!))
        .then((r) => r.data),
    enabled: Boolean(id),
  })
}
