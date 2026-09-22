import { useGet } from '../../../lib/api/hooks/useGet'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { Section } from '../types'

export function useSection(id: string | undefined) {
  return useGet<ApiResponse<Section>>(
    ENDPOINTS.SECTIONS.DETAIL(id ?? ''),
    !!id,
  )
}
