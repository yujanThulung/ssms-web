import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiPaginatedResponse } from '../../../lib/api/types'
import type { Scholarship, ScholarshipListParams } from '../types'

export function useScholarships(params: ScholarshipListParams = {}) {
  return useQuery<ApiPaginatedResponse<Scholarship>, Error>({
    queryKey: [ENDPOINTS.SCHOLARSHIPS.BASE, params],
    queryFn: () =>
      client
        .get<ApiPaginatedResponse<Scholarship>>(ENDPOINTS.SCHOLARSHIPS.BASE, { params })
        .then((r) => r.data),
  })
}
