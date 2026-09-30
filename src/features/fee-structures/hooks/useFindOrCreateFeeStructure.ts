import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import { invalidateFeeStructures } from '../keys'
import type { FeeStructure, FindOrCreateFeeStructurePayload } from '../types'

/**
 * POST /fee-structures/find-or-create
 * Idempotent: returns the existing structure (even APPROVED/ARCHIVED) for the
 * class+year pair, so it is safe to call on every "open" of a class.
 */
export function useFindOrCreateFeeStructure() {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<FeeStructure>, Error, FindOrCreateFeeStructurePayload>({
    mutationFn: (payload) =>
      client
        .post<ApiResponse<FeeStructure>>(ENDPOINTS.FEE_STRUCTURES.FIND_OR_CREATE, payload)
        .then((r) => r.data),
    onSuccess: () => {
      invalidateFeeStructures(queryClient)
    },
  })
}
