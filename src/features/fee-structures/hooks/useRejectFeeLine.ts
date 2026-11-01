import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import { invalidateFeeStructures } from '../keys'
import type { FeeStructure } from '../types'

interface RejectFeeLinePayload {
  structureId: string
  lineId: string
}

/**
 * PATCH /fee-structures/:structureId/lines/:lineId/status
 * Rejects an individual fee line (changes status from PENDING_APPROVAL to REJECTED)
 */
export function useRejectFeeLine() {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<FeeStructure>, Error, RejectFeeLinePayload>({
    mutationFn: ({ structureId, lineId }) =>
      client
        .patch<ApiResponse<FeeStructure>>(
          ENDPOINTS.FEE_STRUCTURES.LINE_DETAIL(structureId, lineId) + '/status',
          { status: 'REJECTED' },
        )
        .then((r) => r.data),
    onSuccess: () => {
      invalidateFeeStructures(queryClient)
    },
  })
}
