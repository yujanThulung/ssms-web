import { useQuery } from '@tanstack/react-query'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'
import type { ApiResponse } from '../../../lib/api/types'
import type { ProgramType, FeeCategoryBasic } from '../types'

export function useProgramFeeCategories(
  programType: ProgramType | null | undefined,
  programId: string | null | undefined
) {
  return useQuery<ApiResponse<FeeCategoryBasic[]>, Error>({
    queryKey: [
      ENDPOINTS.PROGRAM_ASSIGNMENTS.BASE,
      'program-fee-categories',
      programType,
      programId,
    ],
    queryFn: () =>
      client
        .get<ApiResponse<FeeCategoryBasic[]>>(
          ENDPOINTS.PROGRAM_ASSIGNMENTS.PROGRAM_FEE_CATEGORIES(programType!, programId!)
        )
        .then((r) => r.data),
    enabled: Boolean(programType && programId),
  })
}