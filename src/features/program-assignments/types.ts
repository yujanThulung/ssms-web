export const ProgramType = {
  DISCOUNT: 'DISCOUNT',
  SCHOLARSHIP: 'SCHOLARSHIP',
} as const
export type ProgramType = (typeof ProgramType)[keyof typeof ProgramType]

export const ProgramValueType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED',
} as const
export type ProgramValueType = (typeof ProgramValueType)[keyof typeof ProgramValueType]

export const AssignmentStatus = {
  ACTIVE: 'ACTIVE',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  INACTIVE: 'INACTIVE',
  REJECTED: 'REJECTED',
  REMOVED: 'REMOVED',
} as const
export type AssignmentStatus = (typeof AssignmentStatus)[keyof typeof AssignmentStatus]

export interface StudentBasic {
  id: string
  firstName: string
  lastName: string
  admissionNumber?: string
  rollNumber?: string
}

export interface AcademicYearBasic {
  id: string
  name: string
  startDate?: string
}

export interface FeeCategoryBasic {
  id: string
  name: string
  code?: string
}

export interface DiscountBasic {
  id: string
  name: string
  code?: string
}

export interface ScholarshipBasic {
  id: string
  name: string
  code?: string
}

export interface UserBasic {
  id: string
  firstName: string
  lastName: string
}

export interface ProgramAssignment {
  id: string
  studentId: string
  academicYearId: string
  programType: ProgramType
  discountId?: string | null
  scholarshipId?: string | null

  // Snapshot fields
  programName: string
  programCode: string
  programValue: string
  programValueType: ProgramValueType

  // Amount & Dates
  originalAmount: string
  assignedDate?: string
  assignedDateBS?: string
  effectiveDate: string
  effectiveDateBS?: string
  expiryDate?: string | null
  expiryDateBS?: string | null

  // Audit & Workflow
  assignedBy?: string
  assignmentReason?: string | null
  status: AssignmentStatus
  reviewedBy?: string | null
  reviewedAt?: string | null
  reviewNote?: string | null
  removedBy?: string | null
  removalReason?: string | null

  // Relations
  student?: StudentBasic
  academicYear?: AcademicYearBasic
  feeCategories?: FeeCategoryBasic[]
  discount?: DiscountBasic
  scholarship?: ScholarshipBasic
  assignedByUser?: UserBasic
  reviewedByUser?: UserBasic
  removedByUser?: UserBasic

  // Timestamps
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface CreateAssignmentPayload {
  studentId: string
  academicYearId: string
  feeCategoryIds: string[]
  programType: ProgramType
  discountId?: string
  scholarshipId?: string
  effectiveDate: string
  expiryDate?: string | null
  assignmentReason?: string
}

export interface UpdateAssignmentPayload {
  originalAmount?: number
  effectiveDate?: string
  reason?: string
}

export interface ReviewAssignmentPayload {
  status: 'APPROVED' | 'REJECTED'
  reviewNote?: string
}

export interface RemoveAssignmentPayload {
  removalReason?: string
}

export interface AssignmentListParams {
  page?: number
  limit?: number
  studentId?: string
  academicYearId?: string
  feeCategoryId?: string
  programType?: ProgramType
  discountId?: string
  scholarshipId?: string
  status?: AssignmentStatus
  sortBy?: 'effectiveDate' | 'createdAt' | 'status' | string
  sortOrder?: 'ASC' | 'DESC'
  search?: string
}

export interface AssignmentFormValues {
  studentId: string
  academicYearId: string
  feeCategoryIds: string[]
  programType: ProgramType
  discountId?: string
  scholarshipId?: string
  effectiveDateBS: string
  expiryDateBS?: string
  assignmentReason?: string
}
