import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiPaginatedResponse } from '../../../lib/api/types'
import type { Discount, DiscountListParams } from '../types'

export function useDiscounts(params: DiscountListParams = {}) {
  return useQuery<ApiPaginatedResponse<Discount>, Error>({
    queryKey: [ENDPOINTS.DISCOUNTS.BASE, params],
    queryFn: () =>
      client
        .get<ApiPaginatedResponse<Discount>>(ENDPOINTS.DISCOUNTS.BASE, { params })
        .then((r) => r.data),
  })
}
