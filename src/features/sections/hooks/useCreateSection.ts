import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { Section, CreateSectionPayload } from '../types'

export function useCreateSection() {
  const qc = useQueryClient()

  return useMutation<ApiResponse<Section>, Error, CreateSectionPayload>({
    mutationFn: (payload) =>
      client
        .post<ApiResponse<Section>>(ENDPOINTS.SECTIONS.BASE, payload)
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
