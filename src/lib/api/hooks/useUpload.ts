import { useMutation } from '@tanstack/react-query'
import client from '../client'
import { ENDPOINTS } from '../endpoints'
import type { ApiResponse, UploadPurpose, UploadResponse } from '../types'

export interface UploadOptions {
  purpose: UploadPurpose
  /** Form field name sent to the server. Defaults to "file". */
  fieldName?: string
}

/**
 * Generic file upload hook.
 *
 * Usage:
 *   const { mutateAsync: upload, isPending } = useUpload({ purpose: 'STUDENT_PHOTO' })
 *   const result = await upload(file)  // → { url, publicId }
 *
 * Works for any UploadPurpose — student photos, teacher photos, invoice PDFs, etc.
 */
export function useUpload({ purpose, fieldName = 'file' }: UploadOptions) {
  return useMutation<UploadResponse, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append(fieldName, file)

      const res = await client.post<ApiResponse<UploadResponse>>(
        ENDPOINTS.UPLOADS.BASE,
        formData,
        {
          params: { purpose },
          // Let the browser set the correct multipart boundary automatically
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      )

      return res.data.data
    },
  })
}
