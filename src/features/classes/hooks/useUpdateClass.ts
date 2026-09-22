import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { SchoolClass, UpdateClassPayload } from '../types'

export function useUpdateClass(id: string) {
  const qc = useQueryClient()

  return useMutation<ApiResponse<SchoolClass>, Error, UpdateClassPayload>({
    mutationFn: (payload) =>
      client
        .patch<ApiResponse<SchoolClass>>(ENDPOINTS.CLASSES.DETAIL(id), payload)
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
