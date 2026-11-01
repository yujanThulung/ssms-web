import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import { invalidateFeeStructures } from '../keys'
import type { FeeStructure, UpdateFeeStructureLinePayload } from '../types'

/**
 * PATCH /fee-structures/:id/lines/:lineId
 * 
 * Can be used on DRAFT, REJECTED, or APPROVED structures.
 * When updating a line on an APPROVED structure, the backend handles
 * the approval workflow appropriately.
 */
export function useUpdateFeeStructureLine() {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<FeeStructure>, Error, UpdateFeeStructureLinePayload>({
    mutationFn: ({ structureId, lineId, ...payload }) =>
      client
        .patch<ApiResponse<FeeStructure>>(
          ENDPOINTS.FEE_STRUCTURES.LINE_DETAIL(structureId, lineId),
          { ...payload, ...(payload.amount != null ? { amount: String(payload.amount) } : {}) },
        )
        .then((r) => r.data),
    onSuccess: () => {
      invalidateFeeStructures(queryClient)
    },
  })
}
