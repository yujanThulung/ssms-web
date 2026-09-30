import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import { invalidateFeeStructures } from '../keys'
import type { FeeStructure } from '../types'

/** DELETE /fee-structures/:id/lines/:lineId — only valid while DRAFT. */
export function useRemoveFeeStructureLine(structureId: string) {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<FeeStructure>, Error, string>({
    mutationFn: (lineId) =>
      client
        .delete<ApiResponse<FeeStructure>>(
          ENDPOINTS.FEE_STRUCTURES.LINE_DETAIL(structureId, lineId),
        )
        .then((r) => r.data),
    onSuccess: () => {
      invalidateFeeStructures(queryClient)
    },
  })
}
