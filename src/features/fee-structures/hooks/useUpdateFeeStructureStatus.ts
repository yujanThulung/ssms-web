import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import { feeStructureKeys, invalidateFeeStructures } from '../keys'
import type { FeeStructure, UpdateFeeStructureStatusPayload } from '../types'

/**
 * PATCH /fee-structures/:id/status
 *
 * Illegal transitions are rejected with 409, so the UI only ever offers the
 * transitions declared in FEE_STRUCTURE_TRANSITIONS. On success the cached
 * detail is patched immediately (so the drawer reflects the new badge without
 * waiting for the refetch) and every list/detail query is invalidated.
 */
export function useUpdateFeeStructureStatus() {
  const queryClient = useQueryClient()

  return useMutation<
    ApiResponse<FeeStructure>,
    Error,
    { id: string; payload: UpdateFeeStructureStatusPayload }
  >({
    mutationFn: ({ id, payload }) =>
      client
        .patch<ApiResponse<FeeStructure>>(ENDPOINTS.FEE_STRUCTURES.STATUS(id), payload)
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
