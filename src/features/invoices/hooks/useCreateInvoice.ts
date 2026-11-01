import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { Invoice, CreateInvoicePayload } from '../types'

export function useCreateInvoice() {
  const qc = useQueryClient()

  return useMutation<Invoice, Error, CreateInvoicePayload>({
    mutationFn: async (payload) => {
      const response = await client.post(ENDPOINTS.INVOICES.BASE, payload)
      const body = response.data
      if (body && typeof body === 'object' && 'data' in body && body.data) {
        return body.data as Invoice
      }
      return body as Invoice
    },
    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey[0]
          return typeof key === 'string' && key.startsWith(ENDPOINTS.INVOICES.BASE)
        },
      })
    },
  })
}

