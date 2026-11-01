import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { Invoice } from '../types'

export function useInvoice(id?: string, enabled = true) {
  const isValidId = Boolean(id && id !== 'undefined' && id !== 'null')

  return useQuery<Invoice, Error>({
    queryKey: [ENDPOINTS.INVOICES.BASE, id],
    queryFn: async () => {
      const response = await client.get(ENDPOINTS.INVOICES.DETAIL(id!))
      const body = response.data
      // Normalize if wrapped in { success: true, data: { ... } }
      if (body && typeof body === 'object' && 'data' in body && body.data) {
        return body.data as Invoice
      }
      return body as Invoice
    },
    enabled: isValidId && enabled,
  })
}

