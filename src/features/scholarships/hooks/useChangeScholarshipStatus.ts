import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { Scholarship, ChangeScholarshipStatusPayload } from '../types'

export function useChangeScholarshipStatus(id: string) {
  const qc = useQueryClient()

  return useMutation<ApiResponse<Scholarship>, Error, ChangeScholarshipStatusPayload>({
    mutationFn: (payload) =>
      client
        .patch<ApiResponse<Scholarship>>(ENDPOINTS.SCHOLARSHIPS.STATUS(id), payload)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey[0]
          return typeof key === 'string' && key.startsWith(ENDPOINTS.SCHOLARSHIPS.BASE)
        },
      })
    },
  })
}
