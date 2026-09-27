import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiPaginatedItemsResponse } from '../../../lib/api/types'
import type { Student, StudentStats, StudentListParams } from '../../../pages/students/types'

export function useStudents(params: StudentListParams = {}) {
  return useQuery<ApiPaginatedItemsResponse<Student, StudentStats>, Error>({
    queryKey: [ENDPOINTS.STUDENTS.BASE, params],
    queryFn: () =>
      client
        .get<ApiPaginatedItemsResponse<Student, StudentStats>>(ENDPOINTS.STUDENTS.BASE, { params })
        .then((r) => r.data),
  })
}