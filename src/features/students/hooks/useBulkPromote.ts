import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { BulkPromotePayload, StudentEnrollment } from '../../../pages/students/types'

export function useBulkPromote() {
  const qc = useQueryClient()

  return useMutation<ApiResponse<StudentEnrollment[]>, Error, BulkPromotePayload>({
    mutationFn: (payload) =>
      client
        .post<ApiResponse<StudentEnrollment[]>>(
          ENDPOINTS.STUDENTS.BULK_PROMOTE,
          payload,
        )
        .then((r) => r.data),
    onSuccess: () => {
      // Invalidate the student list so enrollment data refreshes
      qc.invalidateQueries({ queryKey: [ENDPOINTS.STUDENTS.BASE] })
    },
  })
}
