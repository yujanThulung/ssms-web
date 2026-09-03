export interface PaginatedResponse<T>{
    data: T[]
    total: number
    page: number
    pageSize: number
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