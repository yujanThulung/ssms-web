import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { Student } from '../../../pages/students/types'

export function useDeactivateStudent(id: string) {
  const qc = useQueryClient()

  return useMutation<ApiResponse<Student>, Error, void>({
    mutationFn: () =>
      client
        .patch<ApiResponse<Student>>(ENDPOINTS.STUDENTS.DEACTIVATE(id))
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ENDPOINTS.STUDENTS.BASE] })
    },
  })
}
