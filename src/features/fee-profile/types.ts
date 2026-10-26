import type { FeeFrequency } from '../fee-categories/types'

export type { FeeFrequency } from '../fee-categories/types'

export type Money = string | number | null

export interface FeeProfileStudent {
  id: string
  /** Pre-joined full name (may be provided by API directly) */
  name: string
  firstName?: string | null
  middleName?: string | null
  lastName?: string | null
  /** Some endpoints return a pre-joined fullName field */
  fullName?: string | null
  rollNumber?: string | null
  admissionNumber?: string | null
}

export interface FeeProfileAcademicYear {
  id: string
  name: string
  startDate?: string | null
  endDate?: string | null
  startDateBs?: string | null
  endDateBs?: string | null
}

export interface FeeProfileClass {
  id: string
  name: string
  section?: string | null
}

export interface FeeProfileStructure {
  id: string
  status: string
  hasApprovedStructure: boolean
}

export interface FeeProfileBillingStatus {
  canBill: boolean
  reason?: string | null
  periodIdentifier?: string | null
  alreadyBilledCount?: number | null
  maxBillingsPerYear?: number | null
}

export interface FeeProfileClassFee {
  feeCategoryId: string
  categoryName: string
  categoryCode?: string | null
  amount: Money
  frequency: FeeFrequency
  source?: string | null
  sourceId?: string | null
  billingStatus?: FeeProfileBillingStatus | null
}

export interface FeeProfileAdditionalFee {
  feeCategoryId: string
  categoryName: string
  categoryCode?: string | null
  amount: Money
  frequency: FeeFrequency
  source?: string | null
  sourceId?: string | null
  reason?: string | null
  assignedDate?: string | null
  assignedDateBS?: string | null
  billingStatus?: FeeProfileBillingStatus | null
}

export interface FeeProfileBenefit {
  assignmentId: string
  programName: string
  programCode?: string | null
  programType?: string | null
  programValue?: Money
  appliedCategories?: string[] | null
  categoryNames?: string[] | null
  benefitAmount: Money
  effectiveDate?: string | null
  effectiveDateBS?: string | null
  status?: string | null
}

export interface FeeProfileFrequencyTotals {
  grossAmount: Money
  discountAmount: Money
  scholarshipAmount: Money
  netAmount: Money
}

export interface FeeProfileCalculation {
  classFeeSubTotal: Money
  additionalFeeSubTotal: Money
  grossTotal: Money
  totalDiscounts: Money
  totalScholarships: Money
  adjustedTotal: Money
  previousBalance: Money
  finalPayable: Money
  byFrequency?: Record<string, FeeProfileFrequencyTotals> | null
}

export interface FeeProfile {
  student: FeeProfileStudent
  academicYear: FeeProfileAcademicYear
  currentClass?: FeeProfileClass | null
  feeStructure?: FeeProfileStructure | null
  classFees?: FeeProfileClassFee[] | null
  additionalFees?: FeeProfileAdditionalFee[] | null
  discounts?: FeeProfileBenefit[] | null
  scholarships?: FeeProfileBenefit[] | null
  calculation?: FeeProfileCalculation | null
  warnings?: string[] | null
  lastCalculated?: string | null
  calculationDate?: string | null
}

export interface FeeProfileParams {
  academicYearId?: string
  calculationDate?: string
  includeInactive?: boolean
  includeBillingValidation?: boolean
}

export interface EffectiveAmountParams {
  studentId: string
  feeCategoryId: string
  originalAmount: string | number
  academicYearId?: string
  calculationDate?: string
  includeInactive?: boolean
  includeBillingValidation?: boolean
}

export interface EffectiveAmountResult {
  originalAmount: Money
  effectiveAmount: Money
  applicableDiscounts: number
  applicableScholarships: number
}

export interface BillingSummaryParams {
  academicYearStartMonth?: number
  currentMonth?: number
}

export interface BillingSummary {
  totalPeriods: number
  completePeriods: number
  currentPeriod: number
  remainingPeriods: number
  periodNames: string[]
}
