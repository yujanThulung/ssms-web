import { useMutation } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'

interface DownloadPdfParams {
  invoiceId: string
  invoiceNumber: string
}

export function useDownloadInvoicePdf() {
  return useMutation<void, Error, DownloadPdfParams>({
    mutationFn: async ({ invoiceId, invoiceNumber }) => {
      try {
        const response = await client.get(ENDPOINTS.INVOICES.PDF(invoiceId), {
          responseType: 'blob',
        })

        // Check if response is an error JSON disguised as blob
        if (response.data && response.data.type === 'application/json') {
          const text = await response.data.text()
          try {
            const json = JSON.parse(text) as { message?: string }
            throw new Error(json.message || 'Failed to download invoice PDF')
          } catch (parseErr) {
            const msg = parseErr instanceof Error ? parseErr.message : String(parseErr)
            throw new Error(text || msg || 'Failed to download invoice PDF', { cause: parseErr })
          }
        }

        // Create a blob from the PDF data
        const blob = new Blob([response.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)

        // Create a temporary link element and trigger download
        const link = document.createElement('a')
        link.href = url
        const cleanNumber = invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_')
        link.download = `Invoice_${cleanNumber}.pdf`
        document.body.appendChild(link)
        link.click()

        // Cleanup
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (err: unknown) {
        if (err instanceof Error && 'response' in err) {
          const axiosErr = err as Error & { response?: { data?: unknown } }
          if (axiosErr.response?.data instanceof Blob) {
            try {
              const text = await axiosErr.response.data.text()
              const json = JSON.parse(text) as { message?: string }
              throw new Error(json.message || 'Failed to download invoice PDF', { cause: err })
            } catch (parseErr) {
              const msg = parseErr instanceof Error ? parseErr.message : String(parseErr)
              if (msg && !msg.startsWith('Unexpected token')) {
                throw parseErr
              }
            }
          }
        }
        throw err
      }
    },
  })
}
