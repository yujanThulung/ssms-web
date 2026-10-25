import { useQuery } from '@tanstack/react-query'
import { fetchEffectiveFeeAmount } from '../api'
import { feeProfileKeys } from '../keys'
import type { EffectiveAmountParams, EffectiveAmountResult } from '../types'

/**
 * GET /accounts/fee-profiles/students/:studentId/effective-amount/:feeCategoryId
 *
 * Disabled until the caller supplies a complete lookup, so the calculator tab
 * does not fire a request on mount.
 */
export function useEffectiveFeeAmount(params: EffectiveAmountParams | null) {
  return useQuery<EffectiveAmountResult, Error>({
    queryKey: feeProfileKeys.effectiveAmount(params),
    queryFn: () => fetchEffectiveFeeAmount(params!),
    enabled: Boolean(
      params?.studentId &&
      params?.feeCategoryId &&
      params?.originalAmount !== '' &&
      params?.originalAmount !== undefined &&
      params?.originalAmount !== null,
    ),
  })
}
