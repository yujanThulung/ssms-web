import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { AcademicYear, CreateAcademicYearPayload } from '../types'

export function useCreateAcademicYear() {
  const qc = useQueryClient()

  return useMutation<ApiResponse<AcademicYear>, Error, CreateAcademicYearPayload>({
    mutationFn: (payload) =>
      client
        .post<ApiResponse<AcademicYear>>(ENDPOINTS.ACADEMIC_YEARS.BASE, payload)
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
