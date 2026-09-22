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
}

export function useClasses({
  academicYearId,
  requireAcademicYear = true,
  enabled = true,
}: UseClassesParams = {}) {
  const params = new URLSearchParams({ limit: '100', sortBy: 'name', sortOrder: 'ASC', status: 'ACTIVE' })
  if (academicYearId) params.set('academicYearId', academicYearId)

  const url = `${ENDPOINTS.CLASSES.BASE}?${params.toString()}`
  const isEnabled = enabled && (requireAcademicYear ? !!academicYearId : true)

  return useGet<ApiPaginatedResponse<SchoolClass>>(url, isEnabled)
}
