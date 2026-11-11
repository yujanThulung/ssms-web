import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { DashboardData } from '../types'

interface DashboardEnvelope {
  success: boolean
  message: string
  data: DashboardData
}

export function useDashboard(academicYearId?: string, enabled = true) {
  return useQuery<DashboardData, Error>({
    queryKey: [ENDPOINTS.ACCOUNTS.DASHBOARD, academicYearId || 'current'],
    queryFn: async () => {
      const response = await client.get<DashboardEnvelope>(ENDPOINTS.ACCOUNTS.DASHBOARD, {
        params: academicYearId ? { academicYearId } : undefined,
      })
      return response.data.data
    },
    enabled,
  })
}
