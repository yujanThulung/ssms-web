import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { CheckRollNumberParams, CheckRollNumberResponse } from '../../../pages/students/types'

export function useCheckRollNumber(params?: Partial<CheckRollNumberParams>, enabled = true) {
  const academicYearId = params?.academicYearId
  const sectionId = params?.sectionId
  const rollNumber = params?.rollNumber

  return useQuery<ApiResponse<CheckRollNumberResponse>, Error>({
    queryKey: [ENDPOINTS.STUDENTS.CHECK_ROLL_NUMBER, academicYearId, sectionId, rollNumber],
    queryFn: () =>
      client
        .get<ApiResponse<CheckRollNumberResponse>>(ENDPOINTS.STUDENTS.CHECK_ROLL_NUMBER, {
          params: { academicYearId, sectionId, rollNumber },
        })
        .then((r) => r.data),
    enabled: Boolean(enabled && academicYearId && sectionId),
    staleTime: 5000,
  })
}
