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