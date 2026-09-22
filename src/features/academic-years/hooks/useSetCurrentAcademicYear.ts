import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'

export function useSetCurrentAcademicYear() {
  const qc = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      client.post(ENDPOINTS.ACADEMIC_YEARS.SET_CURRENT(id)).then(() => undefined),
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
