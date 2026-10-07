import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiPaginatedResponse } from '../../../lib/api/types'
import type { FeeCategory, FeeCategoryListParams } from '../types'

export function useFeeCategories(params: FeeCategoryListParams = {}) {
  const cleanedParams = { ...params }
  if (cleanedParams.limit !== undefined && cleanedParams.limit <= 0) {
    delete cleanedParams.limit
  }
  if (cleanedParams.page !== undefined && cleanedParams.page <= 0) {
    delete cleanedParams.page
  }

  return useQuery<ApiPaginatedResponse<FeeCategory>, Error>({
    queryKey: [ENDPOINTS.FEE_CATEGORIES.BASE, cleanedParams],
    queryFn: () =>
      client
        .get<ApiPaginatedResponse<FeeCategory>>(ENDPOINTS.FEE_CATEGORIES.BASE, { params: cleanedParams })
        .then((r) => r.data),
  })
}
