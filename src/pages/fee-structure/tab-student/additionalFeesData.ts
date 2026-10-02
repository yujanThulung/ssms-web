import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiPaginatedResponse } from '../../../lib/api/types'
import type { FeeFrequency } from '../../../features/fee-categories/types'

export type AdditionalFeeReason = 'LATE_FEE' | 'DAMAGE' | 'REISSUE_CARD' | 'TRANSPORT' | 'OTHER' | string

export const ADDITIONAL_FEE_REASON_LABEL: Record<string, string> = {
  LATE_FEE: 'Late Fee',
  DAMAGE: 'Damage / Loss',
  REISSUE_CARD: 'Re-issue Card',
  TRANSPORT: 'Transport Change',
  OTHER: 'Other',
}

export type AdditionalFeeStatus = 'ACTIVE' | 'ARCHIVED' | 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | string

export interface AdditionalFeeRow {
  id: string
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  sectionName: string
  academicYearId: string
  academicYearName: string
  categoryId: string
  categoryName: string
  frequency: FeeFrequency
  amount: number
  reason: string
  note?: string | null
  status: AdditionalFeeStatus
  assignedDate?: string
  createdAt: string
}

export interface AdditionalFeeListParams {
  page?: number
  limit?: number
  studentId?: string
  academicYearId?: string
  status?: string
  search?: string
  reason?: string
}

export interface CreateAdditionalFeePayload {
  studentId: string
  feeCategoryId: string
  academicYearId: string
  amount: number | string
  reason: string
  note?: string
}

export interface UpdateAdditionalFeePayload {
  amount?: number | string
  reason?: string
  note?: string
}

export interface UpdateAdditionalFeeStatusPayload {
  status: string
}

export interface ReviewAdditionalFeePayload {
  status: string
  reviewNote?: string
}

function cleanParams(params: AdditionalFeeListParams): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  for (const [key, val] of Object.entries(params)) {
    if (val === undefined || val === null || val === '' || val === 'ALL') continue
    out[key] = val as string | number
  }
  return out
}

export async function fetchAdditionalFees(
  params: AdditionalFeeListParams = {},
): Promise<ApiPaginatedResponse<AdditionalFeeRow>> {
  const response = await client.get<ApiPaginatedResponse<AdditionalFeeRow>>(
    ENDPOINTS.ADDITIONAL_FEES.BASE,
    { params: cleanParams(params) },
  )
  return response.data
}

export async function createAdditionalFeeApi(payload: CreateAdditionalFeePayload) {
  const response = await client.post(ENDPOINTS.ADDITIONAL_FEES.BASE, payload)
  return response.data
}

export async function updateAdditionalFeeApi(id: string, payload: UpdateAdditionalFeePayload) {
  const response = await client.patch(ENDPOINTS.ADDITIONAL_FEES.DETAIL(id), payload)
  return response.data
}

export async function updateAdditionalFeeStatusApi(
  id: string,
  payload: UpdateAdditionalFeeStatusPayload,
) {
  const response = await client.patch(ENDPOINTS.ADDITIONAL_FEES.STATUS(id), payload)
  return response.data
}

export async function reviewAdditionalFeeApi(
  id: string,
  payload: ReviewAdditionalFeePayload,
) {
  const response = await client.patch(ENDPOINTS.ADDITIONAL_FEES.REVIEW(id), payload)
  return response.data
}

export async function archiveAdditionalFeeApi(id: string) {
  try {
    const response = await client.patch(ENDPOINTS.ADDITIONAL_FEES.ARCHIVE(id))
    return response.data
  } catch {
    const response = await client.delete(ENDPOINTS.ADDITIONAL_FEES.DETAIL(id))
    return response.data
  }
}

/** Hook to fetch paginated list of additional fees */
export function useAdditionalFeeList(params: AdditionalFeeListParams = {}) {
  const query = useQuery<ApiPaginatedResponse<AdditionalFeeRow>, Error>({
    queryKey: [ENDPOINTS.ADDITIONAL_FEES.BASE, params],
    queryFn: () => fetchAdditionalFees(params),
  })

  return {
    items: query.data?.data ?? [],
    meta: query.data?.meta ?? { page: params.page ?? 1, limit: params.limit ?? 10, total: 0, totalPages: 0 },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  }
}

/** Hook for creating a student additional fee */
export function useCreateAdditionalFee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAdditionalFeePayload) => createAdditionalFeeApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENDPOINTS.ADDITIONAL_FEES.BASE] })
    },
  })
}

/** Hook for updating an additional fee */
export function useUpdateAdditionalFee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAdditionalFeePayload }) =>
      updateAdditionalFeeApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENDPOINTS.ADDITIONAL_FEES.BASE] })
    },
  })
}

/** Hook for changing status of an additional fee */
export function useUpdateAdditionalFeeStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAdditionalFeeStatusPayload }) =>
      updateAdditionalFeeStatusApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENDPOINTS.ADDITIONAL_FEES.BASE] })
    },
  })
}

/** Hook for reviewing an additional fee */
export function useReviewAdditionalFee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReviewAdditionalFeePayload }) =>
      reviewAdditionalFeeApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENDPOINTS.ADDITIONAL_FEES.BASE] })
    },
  })
}

/** Hook for archiving / removing an additional fee */
export function useDeleteAdditionalFee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => archiveAdditionalFeeApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENDPOINTS.ADDITIONAL_FEES.BASE] })
    },
  })
}
