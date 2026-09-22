import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { CreateStudentPayload, Student } from '../../../pages/students/types'

export function useCreateStudent() {
  const qc = useQueryClient()

  return useMutation<ApiResponse<Student>, Error, CreateStudentPayload>({
    mutationFn: (payload) =>
      client
        .post<ApiResponse<Student>>(ENDPOINTS.STUDENTS.BASE, payload)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ENDPOINTS.STUDENTS.BASE] })
    },
  })
}
