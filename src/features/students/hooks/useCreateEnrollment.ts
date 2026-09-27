import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { StudentEnrollment, CreateEnrollmentPayload } from '../../../pages/students/types'

export function useCreateEnrollment(studentId: string) {
  const qc = useQueryClient()

  return useMutation<ApiResponse<StudentEnrollment>, Error, CreateEnrollmentPayload>({
    mutationFn: (payload) =>
      client
        .post<ApiResponse<StudentEnrollment>>(
          ENDPOINTS.STUDENTS.ENROLLMENTS(studentId),
          payload,
        )
        .then((r) => r.data),
    onSuccess: () => {
      // Refresh the student detail and list so enrollment shows immediately
      qc.invalidateQueries({ queryKey: [ENDPOINTS.STUDENTS.BASE] })
      qc.invalidateQueries({ queryKey: [ENDPOINTS.STUDENTS.DETAIL(studentId)] })
      qc.invalidateQueries({ queryKey: [ENDPOINTS.STUDENTS.ENROLLMENTS(studentId)] })
    },
  })
}
