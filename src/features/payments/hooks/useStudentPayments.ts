import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { Payment } from '../types'

export function useStudentPayments(studentId?: string, enabled = true) {
  const isValid = Boolean(studentId && studentId !== 'undefined')

  return useQuery<Payment[], Error>({
    queryKey: [ENDPOINTS.PAYMENTS.BY_STUDENT(studentId!), studentId],
    queryFn: async () => {
      const response = await client.get(ENDPOINTS.PAYMENTS.BY_STUDENT(studentId!))
      const body = response.data
      if (body && Array.isArray(body.data)) return body.data as Payment[]
      if (Array.isArray(body)) return body as Payment[]
      return body as Payment[]
    },
    enabled: isValid && enabled,
  })
}
