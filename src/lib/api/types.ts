export interface ApiMeta {
    page: number
    limit: number
    total: number
    totalPages: number
}

export interface ApiPaginatedResponse<T> {
    success: boolean
    message: string
    data: T[]
    meta: ApiMeta
}

export interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
}

export interface ListParams{
    page?: number
    pageSize?: number
    search?: string
    [key: string]: unknown
}

export interface ApiError{
    message: string
}

export interface TokenPair{
    access_token: string
    refresh_token: string
}

export interface BaseEntity {
    id: string
    createdAt: string
    updatedAt: string
    deletedAt?: string | null
}

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * All valid upload purposes.
 * Add new values here as you expand to teacher photos, invoice PDFs, etc.
 */
export type UploadPurpose =
  | 'STUDENT_PHOTO'
  | 'TEACHER_PHOTO'
  | 'INVOICE_PDF'
  | 'DOCUMENT'
  | 'STUDENT_DOCUMENT'
  | 'LOGO'

export interface UploadResponse {
  url: string
  publicId: string
}