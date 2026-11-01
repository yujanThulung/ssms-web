import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import { invalidateFeeStructures } from '../keys'
import type { FeeStructure } from '../types'

interface ApproveFeeLinePayload {
  structureId: string
  lineId: string
}

/**
 * PATCH /fee-structures/:structureId/lines/:lineId/status
 * Approves an individual fee line (changes status from PENDING_APPROVAL to APPROVED)
 */
export function useApproveFeeLine() {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<FeeStructure>, Error, ApproveFeeLinePayload>({
    mutationFn: ({ structureId, lineId }) =>
      client
        .patch<ApiResponse<FeeStructure>>(
          ENDPOINTS.FEE_STRUCTURES.LINE_DETAIL(structureId, lineId) + '/status',
          { status: 'APPROVED' },
        )
        .then((r) => r.data),
    onSuccess: () => {
      invalidateFeeStructures(queryClient)
    },
  })
}
