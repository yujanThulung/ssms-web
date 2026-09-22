import { useGet } from '../../../lib/api/hooks/useGet'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { AcademicYearSummary } from '../types'

export function useAcademicYearSummary() {
  return useGet<ApiResponse<AcademicYearSummary>>(ENDPOINTS.ACADEMIC_YEARS.SUMMARY)
}
