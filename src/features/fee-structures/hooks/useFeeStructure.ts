import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import { feeStructureKeys } from '../keys'
import type { FeeStructure } from '../types'

/** GET /fee-structures/:id — structure detail including its fee-head lines. */
export function useFeeStructure(id: string | null | undefined) {
  return useQuery<ApiResponse<FeeStructure>, Error>({
    queryKey: feeStructureKeys.detail(id),
    queryFn: () =>
      client
        .get<ApiResponse<FeeStructure>>(ENDPOINTS.FEE_STRUCTURES.DETAIL(id!))
        .then((r) => r.data),
    enabled: !!id,
  })
}
