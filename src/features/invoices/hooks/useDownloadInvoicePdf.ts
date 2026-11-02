import { useMutation } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'

interface DownloadPdfParams {
  invoiceId: string
  invoiceNumber: string
  pdfUrl?: string | null
  inline?: boolean
}

export function useDownloadInvoicePdf() {
  return useMutation<void, Error, DownloadPdfParams>({
    mutationFn: async ({ invoiceId, invoiceNumber, pdfUrl, inline = false }) => {
      // If PDF URL already exists in Cloudinary, download from there
      if (pdfUrl) {
        try {
          const response = await fetch(pdfUrl)
          if (!response.ok) {
            throw new Error('Failed to fetch PDF from cloud storage')
          }
          
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          
          const link = document.createElement('a')
          link.href = url
          const cleanNumber = invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_')
          link.download = `Invoice_${cleanNumber}.pdf`
          document.body.appendChild(link)
          link.click()
          
          // Cleanup
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          return
        } catch (err) {
          // If cloud download fails, fall back to backend generation
          console.warn('Failed to download from cloud, falling back to backend:', err)
        }
      }

      // Generate PDF from backend (first time or if cloud download failed)
      try {
        const response = await client.get(ENDPOINTS.INVOICES.PDF(invoiceId), {
          responseType: 'blob',
          params: inline ? { inline: 'true' } : undefined,
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
