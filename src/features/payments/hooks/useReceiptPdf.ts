import { useQuery } from '@tanstack/react-query'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import { fetchReceiptPdfBlob } from '../utils/printReceipt'

/**
 * Fetch the official receipt PDF (backend/Cloudinary) for a payment
 * as a Blob. Re-fetches automatically when the receipt is regenerated,
 * because the regenerate mutation invalidates keys containing paymentId.
 */
export function useReceiptPdf(paymentId?: string, enabled = true) {
  return useQuery<Blob, Error>({
    queryKey: [ENDPOINTS.PAYMENTS.RECEIPT(paymentId || '')],
    queryFn: () => fetchReceiptPdfBlob(paymentId!),
    enabled: Boolean(paymentId) && enabled,
    // Receipts are immutable unless explicitly regenerated
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
  })
}
