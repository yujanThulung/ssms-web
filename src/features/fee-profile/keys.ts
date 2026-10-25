import type {
  BillingSummaryParams,
  EffectiveAmountParams,
  FeeProfileParams,
} from './types'

export const feeProfileKeys = {
  all: ['fee-profiles'] as const,
  details: () => [...feeProfileKeys.all, 'detail'] as const,
  detail: (studentId: string, params: FeeProfileParams = {}) =>
    [...feeProfileKeys.details(), studentId, params] as const,
  effectiveAmounts: () => [...feeProfileKeys.all, 'effective-amount'] as const,
  effectiveAmount: (params: EffectiveAmountParams | null) =>
    [...feeProfileKeys.effectiveAmounts(), params] as const,
  billingSummaries: () => [...feeProfileKeys.all, 'billing-summary'] as const,
  billingSummary: (frequency: string, params: BillingSummaryParams = {}) =>
    [...feeProfileKeys.billingSummaries(), frequency, params] as const,
}
