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

export const EligibilityType = {
  MERIT_BASED: 'MERIT_BASED',
  MEANS_BASED: 'MEANS_BASED',
  SPECIAL_ACHIEVEMENT: 'SPECIAL_ACHIEVEMENT',
  STAFF_WARD: 'STAFF_WARD',
} as const
export type EligibilityType = (typeof EligibilityType)[keyof typeof EligibilityType]

// ─── Entity ───────────────────────────────────────────────────────────────────

export interface Scholarship extends BaseEntity {
  /** Auto-generated code: SCH-XXXXXXXX */
  code: string
  name: string
  description: string | null
  type: ScholarshipType
  /** Decimal string, e.g. "50.00" */
  value: string
  eligibilityType: EligibilityType
  /** Class codes the scholarship applies to — empty means all classes. */
  applicableClasses: string[]
  academicYear: string
  /** Full tuition waiver instead of a percentage / fixed reduction. */
  coverAllFees: boolean
  maxBeneficiaries: number | null
  assignedStudents: number
  /** Amount awarded so far this year — drives the KPI total. */
  awardedAmount: number
  effectiveDate: string
  effectiveDateBS: string
  expiryDate: string | null
  expiryDateBS: string | null
  status: ScholarshipStatus
}

/** Form shape — API-only fields are filled in by the save handler. */
export type ScholarshipFormValues = Omit<
  Scholarship,
  | 'id'
  | 'code'
  | 'createdAt'
  | 'updatedAt'
  | 'assignedStudents'
  | 'awardedAmount'
  | 'effectiveDate'
  | 'value'
> & {
  /** Numeric input value; the entity stores it as a decimal string. */
  value?: number
}

// ─── Mock option lists (replace with classes / academic-years APIs later) ──────

export const MOCK_ACADEMIC_YEARS = ['2083/84', '2082/83']

export const MOCK_CLASS_OPTIONS = [
  'Nursery',
  'Kindergarten',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
]

// ─── Mock records ─────────────────────────────────────────────────────────────

export const MOCK_SCHOLARSHIPS: Scholarship[] = [
  {
    id: 'sch-1',
    code: 'SCH-4F7A21C8',
    name: 'Merit Toppers Scholarship',
    description: 'Full tuition waiver for the top three students of Grade 10 in the annual examination.',
    type: ScholarshipType.PERCENTAGE,
    value: '100.00',
    eligibilityType: EligibilityType.MERIT_BASED,
    applicableClasses: ['Grade 10'],
    academicYear: '2083/84',
    coverAllFees: true,
    maxBeneficiaries: 3,
    assignedStudents: 3,
    awardedAmount: 285000,
    effectiveDate: '2083-04-01',
    effectiveDateBS: '2083-04-01',
    expiryDate: '2084-03-31',
    expiryDateBS: '2084-03-31',
    status: ScholarshipStatus.ACTIVE,
    createdAt: '2026-04-02T04:15:00.000Z',
    updatedAt: '2026-04-02T04:15:00.000Z',
  },
  {
    id: 'sch-2',
    code: 'SCH-9B30D5E1',
    name: 'Dalit Community Grant',
    description: 'Full fee support for students from Dalit and disadvantaged community households.',
    type: ScholarshipType.FIXED_AMOUNT,
    value: '45000.00',
    eligibilityType: EligibilityType.MEANS_BASED,
    applicableClasses: MOCK_CLASS_OPTIONS,
    academicYear: '2083/84',
    coverAllFees: false,
    maxBeneficiaries: 12,
    assignedStudents: 9,
    awardedAmount: 405000,
    effectiveDate: '2083-04-01',
    effectiveDateBS: '2083-04-01',
    expiryDate: null,
    expiryDateBS: null,
    status: ScholarshipStatus.ACTIVE,
    createdAt: '2026-04-05T09:40:00.000Z',
    updatedAt: '2026-06-11T06:02:00.000Z',
  },
  {
    id: 'sch-3',
    code: 'SCH-1C6E8B45',
    name: 'National Sports Award',
    description: 'Awarded to students representing the school at national level competitions.',
    type: ScholarshipType.PERCENTAGE,
    value: '50.00',
    eligibilityType: EligibilityType.SPECIAL_ACHIEVEMENT,
    applicableClasses: ['Grade 8', 'Grade 9', 'Grade 10'],
    academicYear: '2083/84',
    coverAllFees: false,
    maxBeneficiaries: 6,
    assignedStudents: 4,
    awardedAmount: 96000,
    effectiveDate: '2083-05-15',
    effectiveDateBS: '2083-05-15',
    expiryDate: '2084-01-15',
    expiryDateBS: '2084-01-15',
    status: ScholarshipStatus.ACTIVE,
    createdAt: '2026-05-18T02:20:00.000Z',
    updatedAt: '2026-05-18T02:20:00.000Z',
  },
  {
    id: 'sch-4',
    code: 'SCH-7D22F490',
    name: 'Staff Ward Concession',
    description: 'Concession for children of staff members, applied every academic year.',
    type: ScholarshipType.PERCENTAGE,
    value: '25.00',
    eligibilityType: EligibilityType.STAFF_WARD,
    applicableClasses: MOCK_CLASS_OPTIONS,
    academicYear: '2083/84',
    coverAllFees: false,
    maxBeneficiaries: null,
    assignedStudents: 7,
    awardedAmount: 74500,
    effectiveDate: '2083-04-01',
    effectiveDateBS: '2083-04-01',
    expiryDate: null,
    expiryDateBS: null,
    status: ScholarshipStatus.ACTIVE,
    createdAt: '2026-04-01T07:00:00.000Z',
    updatedAt: '2026-04-01T07:00:00.000Z',
  },
  {
    id: 'sch-5',
    code: 'SCH-3A98C207',
    name: 'Girls STEM Encouragement',
    description: 'Closed for the current session — will reopen with the new intake.',
    type: ScholarshipType.FIXED_AMOUNT,
    value: '20000.00',
    eligibilityType: EligibilityType.MERIT_BASED,
    applicableClasses: ['Grade 9', 'Grade 10'],
    academicYear: '2082/83',
    coverAllFees: false,
    maxBeneficiaries: 5,
    assignedStudents: 0,
    awardedAmount: 0,
    effectiveDate: '2082-04-01',
    effectiveDateBS: '2082-04-01',
    expiryDate: '2083-03-31',
    expiryDateBS: '2083-03-31',
    status: ScholarshipStatus.INACTIVE,
    createdAt: '2025-04-06T03:30:00.000Z',
    updatedAt: '2026-04-01T03:30:00.000Z',
  },
]