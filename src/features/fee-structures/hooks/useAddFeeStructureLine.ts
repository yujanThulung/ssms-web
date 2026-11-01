import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import { invalidateFeeStructures } from '../keys'
import type { FeeStructure, FeeStructureLinePayload } from '../types'

/**
 * POST /fee-structures/:id/lines
 * 
 * Can be used on DRAFT, REJECTED, or APPROVED structures.
 * When adding to an APPROVED structure, the backend creates the line
 * with PENDING_APPROVAL status, requiring approval before it affects invoices.
 */
export function useAddFeeStructureLine(structureId: string) {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<FeeStructure>, Error, FeeStructureLinePayload>({
    mutationFn: (payload) =>
      client
        .post<ApiResponse<FeeStructure>>(ENDPOINTS.FEE_STRUCTURES.LINES(structureId), {
          ...payload,
          amount: String(payload.amount),
        })
        .then((r) => r.data),
    onSuccess: () => {
      invalidateFeeStructures(queryClient)
    },
  })
}
