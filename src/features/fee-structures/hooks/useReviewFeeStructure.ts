import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import { feeStructureKeys, invalidateFeeStructures } from '../keys'
import type { FeeStructure, ReviewFeeStructurePayload } from '../types'

/**
 * PATCH /fee-structures/:id/review
 *
 * The approver-side counterpart to useUpdateFeeStructureStatus. This endpoint
 * carries APPROVE → APPROVED, PENDING_APPROVAL → REJECTED and
 * APPROVED → ARCHIVED, and is gated on the APPROVE permission server-side.
 *
 * Like the status hook, the cached detail is patched immediately so the row
 * badge updates without waiting for the refetch.
 */
export function useReviewFeeStructure() {
  const queryClient = useQueryClient()

  return useMutation<
    ApiResponse<FeeStructure>,
    Error,
    { id: string; payload: ReviewFeeStructurePayload }
  >({
    mutationFn: ({ id, payload }) =>
      client
        .patch<ApiResponse<FeeStructure>>(ENDPOINTS.FEE_STRUCTURES.REVIEW(id), payload)
        .then((r) => r.data),
    onSuccess: (response, { id, payload }) => {
      queryClient.setQueryData<ApiResponse<FeeStructure>>(
        feeStructureKeys.detail(id),
        (previous) =>
          previous && response?.data
            ? { ...previous, data: { ...previous.data, status: payload.status } }
            : previous,
      )
      invalidateFeeStructures(queryClient)
    },
  })
}
