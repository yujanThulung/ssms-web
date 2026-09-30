import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
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
 * Cheap `limit: 1` probes — one per status plus one unfiltered — so the status
 * sub-tabs and KPI cards can show real counts without the user having to visit
 * each tab first.
 */
export function useFeeStructureCounts(
  academicYearId?: string,
  search?: string,
): FeeStructureCounts {
  const results = useQueries({
    queries: [
      {
        queryKey: feeStructureKeys.list({ limit: 1, academicYearId, search }),
        queryFn: () => fetchFeeStructures({ limit: 1, academicYearId, search }),
        staleTime: 60_000,
      },
      ...FEE_STRUCTURE_ALL_STATUSES.map((status) => ({
        queryKey: feeStructureKeys.list({ limit: 1, status, academicYearId, search }),
        queryFn: () => fetchFeeStructures({ limit: 1, status, academicYearId, search }),
        staleTime: 60_000,
      })),
    ],
  })

  return useMemo(() => {
    const [overall, ...byStatus] = results

    const counts: Record<FeeStructureStatusType, number> = { ...ZERO_COUNTS }
    FEE_STRUCTURE_ALL_STATUSES.forEach((status, index) => {
      counts[status] = byStatus[index]?.data?.meta?.total ?? 0
    })

    const total = overall.data?.meta?.total ?? 0
    const structured = FEE_STRUCTURE_ALL_STATUSES.reduce(
      (sum, status) => sum + counts[status],
      0,
    )

    return {
      total,
      notSetUp: Math.max(total - structured, 0),
      byStatus: counts,
      isLoading: results.some((result) => result.isLoading),
    }
  }, [results])
}
