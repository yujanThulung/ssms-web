import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiPaginatedResponse } from '../../../lib/api/types'
import type { FeeCategory, FeeCategoryListParams } from '../types'

export function useFeeCategories(params: FeeCategoryListParams = {}) {
  return useQuery<ApiPaginatedResponse<FeeCategory>, Error>({
    queryKey: [ENDPOINTS.FEE_CATEGORIES.BASE, params],
    queryFn: () =>
      client
        .get<ApiPaginatedResponse<FeeCategory>>(ENDPOINTS.FEE_CATEGORIES.BASE, { params })
        .then((r) => r.data),
  })
}
