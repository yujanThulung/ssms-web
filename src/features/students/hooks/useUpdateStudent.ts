import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { Student, UpdateStudentPayload } from '../../../pages/students/types'

export function useUpdateStudent(id: string) {
  const qc = useQueryClient()

  return useMutation<ApiResponse<Student>, Error, UpdateStudentPayload>({
    mutationFn: (payload) =>
      client
        .patch<ApiResponse<Student>>(ENDPOINTS.STUDENTS.DETAIL(id), payload)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ENDPOINTS.STUDENTS.BASE] })
    },
  })
}
