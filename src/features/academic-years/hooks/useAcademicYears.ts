import { useGet } from '../../../lib/api/hooks/useGet'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiPaginatedResponse } from '../../../lib/api/types'
import type { AcademicYear } from '../types'

interface UseAcademicYearsParams {
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  enabled?: boolean
}

export function useAcademicYears({
  limit = 10,
  sortBy = 'startDate',
  sortOrder = 'DESC',
  enabled = true,
}: UseAcademicYearsParams = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
    sortBy,
    sortOrder,
  })
  const url = `${ENDPOINTS.ACADEMIC_YEARS.LIST}?${params.toString()}`
  return useGet<ApiPaginatedResponse<AcademicYear>>(url, enabled)
}
