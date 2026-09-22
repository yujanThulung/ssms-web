import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { Student } from '../../../pages/students/types'

export function useStudent(id?: string) {
  const isValidId = Boolean(id && id !== 'undefined')
  return useQuery<ApiResponse<Student>, Error>({
    queryKey: [ENDPOINTS.STUDENTS.BASE, id],
    queryFn: () =>
      client
        .get<ApiResponse<Student>>(ENDPOINTS.STUDENTS.DETAIL(id!))
        .then((r) => r.data),
    enabled: isValidId,
  })
}
