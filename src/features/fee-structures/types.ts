import type { BaseEntity } from '../../lib/api/types'
import type { AcademicYear } from '../academic-years/types'
import type { SchoolClass } from '../classes/types'
import type { FeeCategory, FeeFrequency } from '../fee-categories/types'

// Frequency vocabulary is owned by fee-categories — re-use it instead of
// declaring a second, drifting copy of the same union.
export { FeeFrequency } from '../fee-categories/types'

// ─── Status ───────────────────────────────────────────────────────────────────

export const FeeStructureStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED',
} as const

export type FeeStructureStatus = (typeof FeeStructureStatus)[keyof typeof FeeStructureStatus]

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface FeeStructureLine extends BaseEntity {
  feeStructureId: string
  feeCategoryId: string
  amount: number | string
  frequency: FeeFrequency
  feeCategory?: FeeCategory | null
}

export interface FeeStructure extends BaseEntity {
  academicYearId: string
  classId: string
  status: FeeStructureStatus
  academicYear?: AcademicYear | null
  class?: SchoolClass | null
  lines?: FeeStructureLine[] | null
}

// ─── List wire shapes ─────────────────────────────────────────────────────────

/** Numeric-ish value as returned by the API (strings are the norm for decimals). */
export type Money = string | number | null

export interface FeeStructureTotals {
  monthly: number
  term: number
  yearly: number
  oneTime: number
}

/** Per-frequency totals attached to a structure summary inside a list row. */
export interface FeeStructureListStructure {
  id: string
  status: FeeStructureStatus
  lines?: FeeStructureLine[] | null
  feeCategories?: string[] | null
  monthlyTotal?: Money
  termTotal?: Money
  yearlyTotal?: Money
  oneTimeTotal?: Money
  studentsAssigned?: number | null
  createdAt?: string | null
}

export interface FeeStructureAggregateTotals {
  monthlyTotal?: Money
  termTotal?: Money
  yearlyTotal?: Money
  oneTimeTotal?: Money
}

export interface FeeStructureClassRef {
  id: string
  name: string
  code?: string | null
}

export interface FeeStructureYearRef {
  id: string
  name: string
}

/**
 * Grouped wire shape — one entry per class, holding the class' structures.
 *
 * Every nested field is optional on purpose: the API omits `structures` (and
 * sometimes `aggregateTotals`) for classes that have no structure yet, and
 * older builds returned a flat structure list instead. `toListRow` normalises
 * both so no screen ever indexes into an absent array.
 */
export interface FeeStructureGroupedListItem {
  class?: FeeStructureClassRef | null
  academicYear?: FeeStructureYearRef | null
  structures?: FeeStructureListStructure[] | null
  aggregateTotals?: FeeStructureAggregateTotals | null
}

/** Flat wire shape — one entry per structure (alternative to the grouped shape). */
export interface FeeStructureFlatListItem extends FeeStructureListStructure {
  classId: string
  academicYearId: string
  class?: FeeStructureClassRef | null
  academicYear?: FeeStructureYearRef | null
}

export type FeeStructureListWireItem =
  | FeeStructureGroupedListItem
  | FeeStructureFlatListItem

// ─── Normalised view model ────────────────────────────────────────────────────

/** A single, fully-guaranteed table row. One class = one row. */
export interface FeeStructureListRow {
  /** Collision-free React key. */
  rowKey: string
  classId: string
  className: string
  classCode: string | null
  academicYearId: string
  academicYearName: string
  structure: FeeStructureListStructure | null
  status: FeeStructureStatus | null
  lineCount: number
  studentsAssigned: number
  totals: FeeStructureTotals
  createdAt: string | null
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface FeeStructureLinePayload {
  feeCategoryId: string
  amount: number | string
  frequency: FeeFrequency
}

export interface FindOrCreateFeeStructurePayload {
  academicYearId: string
  classId: string
}

export interface UpdateFeeStructureStatusPayload {
  status: FeeStructureStatus
}

/**
 * Body for PATCH /fee-structures/:id/review — a different endpoint from
 * /status, gated on the APPROVE action rather than UPDATE.
 */
export interface ReviewFeeStructurePayload {
  status: FeeStructureStatus
}

export interface UpdateFeeStructureLinePayload {
  structureId: string
  lineId: string
  amount?: number | string
  frequency?: FeeFrequency
}

export interface FeeStructureListParams {
  page?: number
  limit?: number
  search?: string
  status?: FeeStructureStatus
  academicYearId?: string
  classId?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface BulkSetupLinePayload {
  feeCategoryId: string
  amount: number | string
}

export interface BulkSetupClassPayload {
  classId: string
  lines: BulkSetupLinePayload[]
}

export interface BulkSetupFeeStructuresPayload {
  academicYearId: string
  classes: BulkSetupClassPayload[]
}
