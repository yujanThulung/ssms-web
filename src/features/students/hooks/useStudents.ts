import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiPaginatedResponse } from '../../../lib/api/types'
import type { Student, StudentListParams } from '../../../pages/students/types'

export function useStudents(params: StudentListParams = {}) {
  return useQuery<ApiPaginatedResponse<Student>, Error>({
    queryKey: [ENDPOINTS.STUDENTS.BASE, params],
    queryFn: () =>
      client
        .get<ApiPaginatedResponse<Student>>(ENDPOINTS.STUDENTS.BASE, { params })
        .then((r) => r.data),
  })
}
