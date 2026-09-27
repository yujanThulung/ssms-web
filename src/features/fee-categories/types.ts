import type { BaseEntity } from '../../lib/api/types'

export const FeeFrequency = {
  ONE_TIME: 'ONE_TIME',
  MONTHLY: 'MONTHLY',
  TERM: 'TERM',
  YEARLY: 'YEARLY',
} as const

export type FeeFrequency = (typeof FeeFrequency)[keyof typeof FeeFrequency]

export const FeeCategoryStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const

export type FeeCategoryStatus = (typeof FeeCategoryStatus)[keyof typeof FeeCategoryStatus]

export type FeeCategoryFrequency = FeeFrequency

export interface FeeCategory extends BaseEntity {
  name: string
  code: string
  frequency: FeeFrequency
  defaultAmount: string
  description?: string | null
  status: FeeCategoryStatus
}

export interface CreateFeeCategoryPayload {
  name: string
  frequency: FeeFrequency
  defaultAmount: string
  description?: string
}

export interface UpdateFeeCategoryPayload {
  name?: string
  frequency?: FeeFrequency
  defaultAmount?: string
  description?: string
  status?: FeeCategoryStatus
}

export interface FeeCategoryFormValues {
  name: string
  frequency: FeeFrequency
  defaultAmount?: number | null
  description?: string
  status?: FeeCategoryStatus
}

export type FeeCategorySortBy = 'name' | 'code' | 'createdAt'

export type FeeCategorySortOrder = 'ASC' | 'DESC'

export interface FeeCategoryListParams {
  page?: number
  limit?: number
  search?: string
  frequency?: string
  status?: string
  sortBy?: FeeCategorySortBy
  sortOrder?: FeeCategorySortOrder
}
