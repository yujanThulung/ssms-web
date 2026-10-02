import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { feeStructureKeys } from '../keys'
import { FEE_STRUCTURE_ALL_STATUSES } from '../constants'
import type { FeeStructureStatus as FeeStructureStatusType } from '../types'
import { fetchFeeStructures } from './useFeeStructures'

const ZERO_COUNTS: Record<FeeStructureStatusType, number> = {
  DRAFT: 0,
  PENDING_APPROVAL: 0,
  APPROVED: 0,
  REJECTED: 0,
  ARCHIVED: 0,
}

export interface FeeStructureCounts {
  /** Total classes returned for the year, regardless of status. */
  total: number
  /** Classes that have no structure at all. */
  notSetUp: number
  byStatus: Record<FeeStructureStatusType, number>
  isLoading: boolean
}

/**
 * Single `limit: 1` probe for overall total count.
 * Status counts are populated on-demand as tabs are visited or cached.
 */
export function useFeeStructureCounts(
  academicYearId?: string,
  search?: string,
  currentStatus?: FeeStructureStatusType,
  currentTotal?: number,
): FeeStructureCounts {
  const queryClient = useQueryClient()

  const overallQuery = useQuery({
    queryKey: feeStructureKeys.list({ limit: 1, academicYearId, search }),
    queryFn: () => fetchFeeStructures({ limit: 1, academicYearId, search }),
    staleTime: 60_000,
  })

  return useMemo(() => {
    const total = overallQuery.data?.meta?.total ?? (currentStatus === undefined ? currentTotal : 0) ?? 0

    const counts: Record<FeeStructureStatusType, number> = { ...ZERO_COUNTS }

    FEE_STRUCTURE_ALL_STATUSES.forEach((status) => {
      if (currentStatus === status && currentTotal !== undefined) {
        counts[status] = currentTotal
      } else {
        const queriesData = queryClient.getQueriesData<{ meta?: { total?: number } }>({
          queryKey: feeStructureKeys.lists(),
        })
        for (const [key, qData] of queriesData) {
          const params = key[2] as Record<string, unknown> | undefined
          if (
            params?.status === status &&
            params?.academicYearId === academicYearId &&
            params?.search === search &&
            qData?.meta?.total !== undefined
          ) {
            counts[status] = qData.meta.total
            break
          }
        }
      }
    })

    const structured = FEE_STRUCTURE_ALL_STATUSES.reduce(
      (sum, status) => sum + counts[status],
      0,
    )

    return {
      total,
      notSetUp: Math.max(total - structured, 0),
      byStatus: counts,
      isLoading: overallQuery.isLoading,
    }
  }, [overallQuery.data, overallQuery.isLoading, academicYearId, search, currentStatus, currentTotal, queryClient])
}

