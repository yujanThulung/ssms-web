import { useGet } from '../../../lib/api/hooks/useGet'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiPaginatedResponse } from '../../../lib/api/types'
import type { AcademicYear } from '../types'

interface UseAcademicYearsParams {
  limit?: number
  page?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  enabled?: boolean
}

export function useAcademicYears({
  limit,
  page,
  sortBy = 'startDate',
  sortOrder = 'DESC',
  enabled = true,
}: UseAcademicYearsParams = {}) {
  const params = new URLSearchParams({
    sortBy,
    sortOrder,
  })
  if (limit !== undefined && limit > 0) {
    params.append('limit', String(limit))
  }
  if (page !== undefined && page > 0) {
    params.append('page', String(page))
  }
  const url = `${ENDPOINTS.ACADEMIC_YEARS.LIST}?${params.toString()}`
  return useGet<ApiPaginatedResponse<AcademicYear>>(url, enabled)
}
