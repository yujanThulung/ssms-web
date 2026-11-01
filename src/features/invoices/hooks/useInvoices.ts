import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiPaginatedResponse } from '../../../lib/api/types'
import type { Invoice, InvoiceListParams } from '../types'

export function useInvoices(params: InvoiceListParams = {}) {
  return useQuery<ApiPaginatedResponse<Invoice>, Error>({
    queryKey: [ENDPOINTS.INVOICES.BASE, params],
    queryFn: async () => {
      const response = await client.get(ENDPOINTS.INVOICES.BASE, { params })
      const body = response.data

      // Normalize in case body is { data: [...], meta: {...} } or { success: true, data: [...], meta: {...} }
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

      // In case body itself is an array
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

      return body as ApiPaginatedResponse<Invoice>
    },
  })
}

