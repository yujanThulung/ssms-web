import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { AcademicYear, UpdateAcademicYearPayload } from '../types'

export function useUpdateAcademicYear(id: string) {
  const qc = useQueryClient()

  return useMutation<ApiResponse<AcademicYear>, Error, UpdateAcademicYearPayload>({
    mutationFn: (payload) =>
      client
        .patch<ApiResponse<AcademicYear>>(ENDPOINTS.ACADEMIC_YEARS.DETAIL(id), payload)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey[0]
          return (
            typeof key === 'string' &&
            (key.startsWith(ENDPOINTS.ACADEMIC_YEARS.LIST) ||
              key.startsWith(ENDPOINTS.ACADEMIC_YEARS.SUMMARY))
          )
        },
      })
    },
  })
}
