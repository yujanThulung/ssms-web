import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiPaginatedResponse } from '../../../lib/api/types'
import type { PaymentListItem, PaymentListParams } from '../types'

export function usePayments(params: PaymentListParams = {}) {
  return useQuery<ApiPaginatedResponse<PaymentListItem>, Error>({
    queryKey: [ENDPOINTS.PAYMENTS.BASE, params],
    queryFn: async () => {
      const response = await client.get(ENDPOINTS.PAYMENTS.BASE, { params })
      const body = response.data
      if (body && Array.isArray(body.data)) {
        return {
          success: body.success ?? true,
          message: body.message ?? '',
          data: body.data,
          meta: body.meta ?? {
            page: params.page ?? 1,
            limit: params.limit ?? 10,
            total: body.data.length,
            totalPages: Math.ceil(body.data.length / (params.limit ?? 10)) || 1,
          },
        }
      }
      if (Array.isArray(body)) {
        return {
          success: true,
          message: '',
          data: body,
          meta: {
            page: params.page ?? 1,
            limit: params.limit ?? 10,
            total: body.length,
            totalPages: Math.ceil(body.length / (params.limit ?? 10)) || 1,
          },
        }
      }
      return body as ApiPaginatedResponse<PaymentListItem>
    },
  })
}
