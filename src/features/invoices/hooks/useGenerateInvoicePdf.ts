import { useMutation } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { GeneratePdfResponse } from '../types'

interface GeneratePdfApiResponse {
  success: boolean
  message: string
  data: GeneratePdfResponse
}

export function useGenerateInvoicePdf() {
  return useMutation<GeneratePdfResponse, Error, string>({
    mutationFn: async (invoiceId: string) => {
      const response = await client.post<GeneratePdfApiResponse>(
        ENDPOINTS.INVOICES.GENERATE_PDF(invoiceId)
      )
      const body = response.data

      // API returns: { success: true, message: "...", data: { pdfUrl, publicId, bytes } }
      if (body && typeof body === 'object' && 'data' in body && body.data) {
        return body.data
      }
      
      // Fallback for unexpected response structure
      return body as unknown as GeneratePdfResponse
    },
  })
}
