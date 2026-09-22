import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { Section, UpdateSectionPayload } from '../types'

export function useUpdateSection(id: string) {
  const qc = useQueryClient()

  return useMutation<ApiResponse<Section>, Error, UpdateSectionPayload>({
    mutationFn: (payload) =>
      client
        .patch<ApiResponse<Section>>(ENDPOINTS.SECTIONS.DETAIL(id), payload)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey[0]
          return typeof key === 'string' && key.startsWith(ENDPOINTS.SECTIONS.BASE)
        },
      })
    },
  })
}
