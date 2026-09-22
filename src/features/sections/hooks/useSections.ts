import { useGet } from '../../../lib/api/hooks/useGet'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiPaginatedResponse } from '../../../lib/api/types'
import type { Section } from '../types'

interface UseSectionsParams {
  classId?: string
  enabled?: boolean
}

export function useSections({ classId, enabled = true }: UseSectionsParams = {}) {
  const params = new URLSearchParams({ limit: '100', sortBy: 'name', sortOrder: 'ASC', status: 'ACTIVE' })
  if (classId) params.set('classId', classId)

  const url = `${ENDPOINTS.SECTIONS.BASE}?${params.toString()}`

  return useGet<ApiPaginatedResponse<Section>>(url, enabled && !!classId)
}
