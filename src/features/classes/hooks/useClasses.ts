import { useGet } from '../../../lib/api/hooks/useGet'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiPaginatedResponse } from '../../../lib/api/types'
import type { SchoolClass } from '../types'

interface UseClassesParams {
  academicYearId?: string
  /** When true (default), requires academicYearId before fetching.
   *  Pass requireAcademicYear=false to fetch all active classes without year filter. */
  requireAcademicYear?: boolean
  enabled?: boolean
  limit?: number
  page?: number
}

export function useClasses({
  academicYearId,
  requireAcademicYear = true,
  enabled = true,
  limit,
  page,
}: UseClassesParams = {}) {
  const params = new URLSearchParams({ sortBy: 'name', sortOrder: 'ASC', status: 'ACTIVE' })
  if (academicYearId) params.set('academicYearId', academicYearId)
  if (limit !== undefined && limit > 0) params.set('limit', String(limit))
  if (page !== undefined && page > 0) params.set('page', String(page))

  const url = `${ENDPOINTS.CLASSES.BASE}?${params.toString()}`
  const isEnabled = enabled && (requireAcademicYear ? !!academicYearId : true)

  return useGet<ApiPaginatedResponse<SchoolClass>>(url, isEnabled)
}
