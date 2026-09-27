import { useGet } from '../../../lib/api/hooks/useGet'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiPaginatedResponse } from '../../../lib/api/types'
import type { Section } from '../types'

interface UseSectionsParams {
  classId?: string
  /** When true (default), requires classId before fetching.
   *  Pass requireClassId=false to fetch all active sections without class filter. */
  requireClassId?: boolean
  enabled?: boolean
}

export function useSections({ classId, requireClassId = true, enabled = true }: UseSectionsParams = {}) {
  const params = new URLSearchParams({ limit: '100', sortBy: 'name', sortOrder: 'ASC', status: 'ACTIVE' })
  if (classId) params.set('classId', classId)

  const url = `${ENDPOINTS.SECTIONS.BASE}?${params.toString()}`
  const isEnabled = enabled && (requireClassId ? !!classId : true)

  return useGet<ApiPaginatedResponse<Section>>(url, isEnabled)
}
