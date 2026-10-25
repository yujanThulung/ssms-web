import { useQuery } from '@tanstack/react-query'
import { fetchFeeProfile } from '../api'
import { feeProfileKeys } from '../keys'
import type { FeeProfile, FeeProfileParams } from '../types'

/** GET /accounts/fee-profiles/students/:studentId */
export function useFeeProfile(
  studentId: string | null | undefined,
  params: FeeProfileParams = {},
) {
  return useQuery<FeeProfile, Error>({
    queryKey: feeProfileKeys.detail(studentId ?? '', params),
    queryFn: () => fetchFeeProfile(studentId!, params),
    enabled: Boolean(studentId),
  })
}
