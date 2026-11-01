import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import { feeStructureKeys } from '../keys'
import type { FeeFrequency } from '../types'

export interface PendingLineItem {
  lineId: string
  structureId: string
  className: string
  classCode: string | null
  academicYearName: string
  categoryName: string
  categoryCode: string | null
  amount: string | number
  frequency: FeeFrequency
  createdAt: string
}

/**
 * Fee lines added to already-approved structures that still need their own
 * approval decision.
 *
 * This uses the dedicated, unpaginated `/fee-structures/pending-lines`
 * endpoint. Fetching `GET /fee-structures?status=APPROVED` and filtering in the
 * browser would silently miss lines once the school has more than one page of
 * approved structures (the list endpoint defaults to 10 and caps at 100).
 */
export function usePendingLines(academicYearId?: string) {
  const query = useQuery<ApiResponse<PendingLineItem[]>, Error>({
    queryKey: feeStructureKeys.pendingLines(academicYearId),
    queryFn: () =>
      client
        .get<ApiResponse<PendingLineItem[]>>(ENDPOINTS.FEE_STRUCTURES.PENDING_LINES, {
          params: academicYearId ? { academicYearId } : undefined,
        })
        .then((response) => response.data),
  })

  const pendingLines = query.data?.data ?? []

  return {
    pendingLines,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    count: pendingLines.length,
  }
}
