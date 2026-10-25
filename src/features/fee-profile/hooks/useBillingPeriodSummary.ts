import { useQuery } from '@tanstack/react-query'
import { fetchBillingSummary } from '../api'
import { feeProfileKeys } from '../keys'
import type {
  BillingSummary,
  BillingSummaryParams,
  FeeFrequency,
} from '../types'

/** GET /accounts/fee-profiles/billing-summary/:frequency */
export function useBillingPeriodSummary(
  frequency: FeeFrequency,
  params: BillingSummaryParams = {},
  enabled = true,
) {
  return useQuery<BillingSummary, Error>({
    queryKey: feeProfileKeys.billingSummary(frequency, params),
    queryFn: () => fetchBillingSummary(frequency, params),
    enabled,
  })
}
