import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { StudentEnrollment } from '../../../pages/students/types'

export function useStudentEnrollments(studentId: string | undefined) {
  return useQuery<ApiResponse<StudentEnrollment[]>, Error>({
    queryKey: [ENDPOINTS.STUDENTS.ENROLLMENTS(studentId ?? '')],
    queryFn: () =>
      client
        .get<ApiResponse<StudentEnrollment[]>>(
          ENDPOINTS.STUDENTS.ENROLLMENTS(studentId!),
        )
        .then((r) => r.data),
    enabled: !!studentId,
  })
}
