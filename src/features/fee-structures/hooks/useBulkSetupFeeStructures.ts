import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import { invalidateFeeStructures } from '../keys'
import type {
  BulkSetupFeeStructuresPayload,
  FeeStructure,
} from '../types'

/**
 * POST /fee-structures/bulk-setup
 * Applies a class × fee-head amount matrix in one call — used to seed many
 * classes at once instead of one drawer at a time.
 */
export function useBulkSetupFeeStructures() {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<FeeStructure[]>, Error, BulkSetupFeeStructuresPayload>({
    mutationFn: (payload) =>
      client
        .post<ApiResponse<FeeStructure[]>>(ENDPOINTS.FEE_STRUCTURES.BULK_SETUP, {
          ...payload,
          classes: payload.classes.map((entry) => ({
            classId: entry.classId,
            lines: entry.lines.map((line) => ({ ...line, amount: String(line.amount) })),
          })),
        })
        .then((r) => r.data),
    onSuccess: () => {
      invalidateFeeStructures(queryClient)
    },
  })
}
