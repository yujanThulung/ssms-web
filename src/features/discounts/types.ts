import type { BaseEntity } from '../../lib/api/types'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
} as const
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType]

export const DiscountStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const
export type DiscountStatus = (typeof DiscountStatus)[keyof typeof DiscountStatus]

// ─── Entity ───────────────────────────────────────────────────────────────────

export interface Discount extends BaseEntity {
  /** Auto-generated code: DISC-XXXXXXXX */
  code: string
  name: string
  description: string | null
  type: DiscountType
  /** Decimal string from backend e.g. "10.00" */
  value: string
  canCombine: boolean
  status: DiscountStatus
  /** AD date YYYY-MM-DD */
  effectiveDate: string
  /** BS date YYYY-MM-DD */
  effectiveDateBS: string
  /** AD date YYYY-MM-DD | null */
  expiryDate: string | null
  /** BS date YYYY-MM-DD | null */
  expiryDateBS: string | null
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateDiscountPayload {
  name: string
  description?: string
  type: DiscountType
  value: number
  canCombine?: boolean
  /** BS date YYYY-MM-DD */
  effectiveDate: string
  /** BS date YYYY-MM-DD (optional) */
  expiryDate?: string | null
}

export interface UpdateDiscountPayload {
  name?: string
  description?: string
  type?: DiscountType
  value?: number
  canCombine?: boolean
  effectiveDate?: string
  expiryDate?: string | null
}

export interface ChangeDiscountStatusPayload {
  status: DiscountStatus
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export interface DiscountFormValues {
  name: string
  description?: string
  type: DiscountType
  value: number
  canCombine: boolean
  /** effectiveDate in AD (dayjs object stored as string for form) */
  effectiveDateBS: string
  expiryDateBS?: string | null
}

// ─── Query params ─────────────────────────────────────────────────────────────

export type DiscountSortBy = 'name' | 'effectiveDate' | 'value' | 'createdAt'
export type DiscountSortOrder = 'ASC' | 'DESC'

export interface DiscountListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  type?: string
  sortBy?: DiscountSortBy
  sortOrder?: DiscountSortOrder
}
