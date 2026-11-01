import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { Invoice, CancelInvoicePayload } from '../types'

interface CancelInvoiceVariables {
  id: string
  payload: CancelInvoicePayload
}

export function useCancelInvoice() {
  const qc = useQueryClient()

  return useMutation<Invoice, Error, CancelInvoiceVariables>({
    mutationFn: async ({ id, payload }) => {
      const response = await client.patch(ENDPOINTS.INVOICES.CANCEL(id), payload)
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

