import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { Payment } from '../types'

export function usePayment(id?: string, enabled = true) {
  const isValidId = Boolean(id && id !== 'undefined' && id !== 'null')

  return useQuery<Payment, Error>({
    queryKey: [ENDPOINTS.PAYMENTS.BASE, id],
    queryFn: async () => {
      const response = await client.get(ENDPOINTS.PAYMENTS.DETAIL(id!))
      const body = response.data
      if (body && typeof body === 'object' && 'data' in body && body.data) {
        return body.data as Payment
      }
      return body as Payment
    },
    enabled: isValidId && enabled,
  })
}
