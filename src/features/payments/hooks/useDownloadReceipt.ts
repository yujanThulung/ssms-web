import { useMutation } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'

interface DownloadReceiptParams {
  paymentId: string
  paymentNumber: string
}

export function useDownloadReceipt() {
  return useMutation<void, Error, DownloadReceiptParams>({
    mutationFn: async ({ paymentId, paymentNumber }) => {
      const response = await client.get(ENDPOINTS.PAYMENTS.RECEIPT(paymentId), {
        responseType: 'blob',
      })

      if (response.data && response.data.type === 'application/json') {
        const text = await response.data.text()
        try {
          const json = JSON.parse(text) as { message?: string }
          throw new Error(json.message || 'Failed to download receipt PDF')
        } catch (parseErr) {
          const msg = parseErr instanceof Error ? parseErr.message : String(parseErr)
          throw new Error(text || msg || 'Failed to download receipt PDF', { cause: parseErr })
        }
      }

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const cleanNumber = paymentNumber.replace(/[^a-zA-Z0-9_-]/g, '_')
      link.download = `Receipt_${cleanNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
  })
}
