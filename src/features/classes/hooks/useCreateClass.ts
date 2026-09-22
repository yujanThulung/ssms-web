import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { SchoolClass, CreateClassPayload } from '../types'

export function useCreateClass() {
  const qc = useQueryClient()

  return useMutation<ApiResponse<SchoolClass>, Error, CreateClassPayload>({
    mutationFn: (payload) =>
      client
        .post<ApiResponse<SchoolClass>>(ENDPOINTS.CLASSES.BASE, payload)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey[0]
          return typeof key === 'string' && key.startsWith(ENDPOINTS.CLASSES.BASE)
        },
      })
    },
  })
}
