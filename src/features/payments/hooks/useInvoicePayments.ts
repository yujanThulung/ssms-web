import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { Payment } from '../types'

export function useInvoicePayments(invoiceId?: string, enabled = true) {
  const isValid = Boolean(invoiceId && invoiceId !== 'undefined')

  return useQuery<Payment[], Error>({
    queryKey: [ENDPOINTS.PAYMENTS.BY_INVOICE(invoiceId!), invoiceId],
    queryFn: async () => {
      const response = await client.get(ENDPOINTS.PAYMENTS.BY_INVOICE(invoiceId!))
      const body = response.data
      if (body && Array.isArray(body.data)) return body.data as Payment[]
      if (Array.isArray(body)) return body as Payment[]
      return body as Payment[]
    },
    enabled: isValid && enabled,
  })
}
