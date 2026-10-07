import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { Scholarship, CreateScholarshipPayload } from '../types'

export function useCreateScholarship() {
  const qc = useQueryClient()

  return useMutation<ApiResponse<Scholarship>, Error, CreateScholarshipPayload>({
    mutationFn: (payload) =>
      client
        .post<ApiResponse<Scholarship>>(ENDPOINTS.SCHOLARSHIPS.BASE, payload)
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
