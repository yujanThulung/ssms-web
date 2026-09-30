import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiPaginatedResponse } from '../../../lib/api/types'
import { feeStructureKeys } from '../keys'
import type { FeeStructureListParams, FeeStructureListWireItem } from '../types'

/** Drops empty values so the query key stays stable and the URL stays clean. */
export function buildListParams(
  params: FeeStructureListParams = {},
): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    out[key] = value as string | number
  }
  return out
}

export async function fetchFeeStructures(
  params: FeeStructureListParams,
): Promise<ApiPaginatedResponse<FeeStructureListWireItem>> {
  const response = await client.get<ApiPaginatedResponse<FeeStructureListWireItem>>(
    ENDPOINTS.FEE_STRUCTURES.BASE,
    { params: buildListParams(params) },
  )
  return response.data
}

/** GET /fee-structures — class-grouped list, filterable by status / year. */
export function useFeeStructures(params: FeeStructureListParams = {}) {
  return useQuery<ApiPaginatedResponse<FeeStructureListWireItem>, Error>({
    queryKey: feeStructureKeys.list(params),
    queryFn: () => fetchFeeStructures(params),
  })
}
