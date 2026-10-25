import client from '../../lib/api/client'
import { ENDPOINTS } from '../../lib/api/endpoints'
import type {
  BillingSummary,
  BillingSummaryParams,
  EffectiveAmountParams,
  EffectiveAmountResult,
  FeeFrequency,
  FeeProfile,
  FeeProfileParams,
} from './types'
import { unwrapApiData } from './utils'

function cleanParams(params: FeeProfileParams): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {}
  if (params.academicYearId) out.academicYearId = params.academicYearId
  if (params.calculationDate) out.calculationDate = params.calculationDate
  if (params.includeInactive !== undefined) out.includeInactive = params.includeInactive
  if (params.includeBillingValidation !== undefined) {
    out.includeBillingValidation = params.includeBillingValidation
  }
  return out
}

export async function fetchFeeProfile(
  studentId: string,
  params: FeeProfileParams = {},
): Promise<FeeProfile> {
  const response = await client.get(
    ENDPOINTS.FEE_PROFILES.STUDENT(studentId),
    { params: cleanParams(params) },
  )
  return unwrapApiData<FeeProfile>(response.data)
}

export async function fetchEffectiveFeeAmount(
  params: EffectiveAmountParams,
): Promise<EffectiveAmountResult> {
  const query: Record<string, string | boolean> = {
    originalAmount: String(params.originalAmount),
  }
  if (params.academicYearId) query.academicYearId = params.academicYearId
  if (params.calculationDate) query.calculationDate = params.calculationDate
  if (params.includeInactive !== undefined) query.includeInactive = params.includeInactive
  if (params.includeBillingValidation !== undefined) {
    query.includeBillingValidation = params.includeBillingValidation
  }

  const response = await client.get(
    ENDPOINTS.FEE_PROFILES.EFFECTIVE_AMOUNT(params.studentId, params.feeCategoryId),
    { params: query },
  )
  return unwrapApiData<EffectiveAmountResult>(response.data)
}

export async function fetchBillingSummary(
  frequency: FeeFrequency,
  params: BillingSummaryParams = {},
): Promise<BillingSummary> {
  const query: Record<string, number> = {}
  if (params.academicYearStartMonth !== undefined) {
    query.academicYearStartMonth = params.academicYearStartMonth
  }
  if (params.currentMonth !== undefined) {
    query.currentMonth = params.currentMonth
  }

  const response = await client.get(
    ENDPOINTS.FEE_PROFILES.BILLING_SUMMARY(frequency),
    { params: query },
  )
  return unwrapApiData<BillingSummary>(response.data)
}
