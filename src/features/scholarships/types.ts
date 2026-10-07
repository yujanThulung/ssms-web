import type { BaseEntity } from '../../lib/api/types'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const ScholarshipType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
} as const
export type ScholarshipType = (typeof ScholarshipType)[keyof typeof ScholarshipType]

export const ScholarshipStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const
export type ScholarshipStatus = (typeof ScholarshipStatus)[keyof typeof ScholarshipStatus]

export const ScholarshipCategory = {
  MERIT: 'MERIT',
  NEED_BASED: 'NEED_BASED',
  ATTENDANCE: 'ATTENDANCE',
  PERFORMANCE: 'PERFORMANCE',
  SPORTS: 'SPORTS',
  CUSTOM: 'CUSTOM',
} as const
export type ScholarshipCategory = (typeof ScholarshipCategory)[keyof typeof ScholarshipCategory]

// ─── Entity ───────────────────────────────────────────────────────────────────

export interface Scholarship extends BaseEntity {
  /** Auto-generated code: SCHOL-XXXXXXXX */
  code: string
  name: string
  description: string | null
  category: ScholarshipCategory
  type: ScholarshipType
  /** Decimal string from backend e.g. "25.00" */
  value: string
  canCombine: boolean
  status: ScholarshipStatus
  /** AD date YYYY-MM-DD */
  effectiveDate: string
  /** BS date YYYY-MM-DD */
  effectiveDateBS: string
  /** AD date YYYY-MM-DD | null */
  expiryDate: string | null
  /** BS date YYYY-MM-DD | null */
  expiryDateBS: string | null
  academicYear: {
    id: string
    name: string
    startDate?: string
  }
  feeCategories: {
    id: string
    name: string
    code?: string
  }[]
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateScholarshipPayload {
  name: string
  description?: string
  category: ScholarshipCategory
  type: ScholarshipType
  value: number
  canCombine?: boolean
  /** BS date YYYY-MM-DD */
  effectiveDate: string
  /** BS date YYYY-MM-DD (optional) */
  expiryDate?: string | null
  academicYearId: string
  feeCategoryIds: string[]
}

export interface UpdateScholarshipPayload {
  name?: string
  description?: string
  category?: ScholarshipCategory
  type?: ScholarshipType
  value?: number
  canCombine?: boolean
  effectiveDate?: string
  expiryDate?: string | null
  academicYearId?: string
  feeCategoryIds?: string[]
}

export interface ChangeScholarshipStatusPayload {
  status: ScholarshipStatus
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export interface ScholarshipFormValues {
  name: string
  description?: string
  category: ScholarshipCategory
  type: ScholarshipType
  value: number
  canCombine: boolean
  /** effectiveDate in BS */
  effectiveDateBS: string
  expiryDateBS?: string | null
  academicYearId: string
  feeCategoryIds: string[]
}

// ─── Query params ─────────────────────────────────────────────────────────────

export type ScholarshipSortBy = 'name' | 'effectiveDate' | 'value' | 'createdAt'
export type ScholarshipSortOrder = 'ASC' | 'DESC'

export interface ScholarshipListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  type?: string
  category?: string
  academicYearId?: string
  feeCategoryId?: string
  sortBy?: ScholarshipSortBy
  sortOrder?: ScholarshipSortOrder
}
