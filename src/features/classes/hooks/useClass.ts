import { useGet } from '../../../lib/api/hooks/useGet'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { SchoolClass } from '../types'

export function useClass(id: string | undefined) {
  return useGet<ApiResponse<SchoolClass>>(
    ENDPOINTS.CLASSES.DETAIL(id ?? ''),
    !!id,
  )
}
