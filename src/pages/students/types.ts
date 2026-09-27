import type { BaseEntity } from '../../lib/api/types'
export type { UploadResponse } from '../../lib/api/types'

export type StudentStatus =
  | 'ADMITTED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'TRANSFERRED_OUT'
  | 'GRADUATED'

export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-'

// ─── API response shape ────────────────────────────────────────────────────

export interface StudentStats {
  totalStudents: number
  activeStudents: number
  inactiveOrSuspended: number
  classes: number
}

export interface StudentListData {
  items: Student[]
  stats: StudentStats
}

export interface Student extends BaseEntity {
  admissionNumber: string
  firstName: string
  middleName?: string | null
  lastName: string
  fullName?: string        // may be computed by backend
  dateOfBirth: string
  gender: Gender
  bloodGroup?: BloodGroup | null
  parentEmail?: string | null
  parentPhone?: string | null
  fatherName?: string | null
  motherName?: string | null
  guardianName?: string | null
  guardianRelation?: string | null
  guardianPhone?: string | null
  guardianEmail?: string | null
  addressPermanent?: string | null
  addressTemporary?: string | null
  photoUrl?: string | null
  photoPublicId?: string | null
  admissionDate: string
  status: StudentStatus
  enrollment?: StudentEnrollment | null
  currentEnrollment?: StudentEnrollment | null
  documents?: Record<string, StudentDocument> | StudentDocument[] | null
}

export interface StudentEnrollment extends BaseEntity {
  studentId: string
  academicYearId: string
  academicYearName?: string
  academicYear?: {
    id: string
    name: string
    status?: string
  }
  classId: string
  className?: string
  class?: {
    id: string
    name: string
    code?: string
  }
  sectionId: string
  sectionName?: string
  section?: {
    id: string
    name: string
    code?: string
  }
  rollNumber?: string | number | null
  status?: 'ACTIVE' | 'INACTIVE'
  isCurrent?: boolean
}

// ─── List query params ─────────────────────────────────────────────────────

export type StudentSortBy = 'firstName' | 'lastName' | 'admissionDate' | 'dateOfBirth' | 'createdAt'
export type SortOrder = 'ASC' | 'DESC'

export interface StudentListParams {
  search?: string
  status?: StudentStatus
  gender?: Gender
  bloodGroup?: BloodGroup
  admissionDateFrom?: string   // ISO AD: 2026-01-01
  admissionDateTo?: string     // ISO AD: 2026-12-31
  academicYearId?: string
  classId?: string
  sectionId?: string
  sortBy?: StudentSortBy
  sortOrder?: SortOrder
  isEnrolled?: boolean
  page?: number
  limit?: number
}

export interface CheckRollNumberParams {
  academicYearId: string
  sectionId: string
  rollNumber?: string | number
}

export interface CheckRollNumberResponse {
  isAvailable: boolean
  nextAvailableRollNumber: string
  usedRollNumbers: string[]
}

// ─── Create / upload types ──────────────────────────────────────────────────

export interface CreateStudentPayload {
  firstName: string
  middleName?: string
  lastName: string
  dateOfBirth: string
  gender: Gender
  bloodGroup?: BloodGroup
  parentEmail?: string
  parentPhone: string
  fatherName?: string
  motherName?: string
  guardianName?: string
  guardianRelation?: string
  guardianPhone?: string
  guardianEmail?: string
  addressPermanent?: string
  addressTemporary?: string
  admissionDate: string
  photoUrl?: string
  photoPublicId?: string
  // Required Academic Placement Fields
  academicYearId: string
  classId: string
  sectionId: string
  // Optional
  rollNumber?: string | number
}

// Every field is optional — send only what changed
export type UpdateStudentPayload = Partial<Omit<CreateStudentPayload, 'admissionDate'>>

// ─── Enrollment types ─────────────────────────────────────────────────────────

export interface CreateEnrollmentPayload {
  academicYearId: string
  classId: string
  sectionId: string
  rollNumber?: string | number
  startDate?: string              // BS ISO e.g. "2083-04-01"
}

export interface BulkPromoteStudent {
  studentId: string
  rollNumber?: string | number
}

export interface BulkPromotePayload {
  students: BulkPromoteStudent[]
  academicYearId: string
  classId: string
  sectionId: string
  startDate?: string
  autoAssignRollNumbers?: boolean
}

// ─── Status transitions ─────────────────────────────────────────────────────

/**
 * Valid next-states for each current status.
 * Source of truth mirrored from the backend transition rules.
 */
export const STATUS_TRANSITIONS: Record<StudentStatus, StudentStatus[]> = {
  ADMITTED: ['ACTIVE'],
  ACTIVE: ['INACTIVE', 'SUSPENDED', 'TRANSFERRED_OUT', 'GRADUATED'],
  INACTIVE: ['ACTIVE'],
  SUSPENDED: ['ACTIVE'],
  TRANSFERRED_OUT: [],
  GRADUATED: [],
}

export function getAllowedTransitions(current: StudentStatus): StudentStatus[] {
  return STATUS_TRANSITIONS[current] ?? []
}

export const STATUS_LABELS: Record<StudentStatus, string> = {
  ADMITTED: 'Admitted',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
  TRANSFERRED_OUT: 'Transferred Out',
  GRADUATED: 'Graduated',
}

// ─── Form types ───────────────────────────────────────────────────────────────

export interface AdmissionFormValues {
  // Step 0 — Student info
  firstName: string
  middleName?: string
  lastName: string
  dateOfBirth: string
  gender: Gender
  bloodGroup?: BloodGroup
  parentEmail?: string
  parentPhone: string
  fatherName?: string
  motherName?: string
  guardianName?: string
  guardianRelation?: string
  guardianPhone?: string
  guardianEmail?: string
  addressPermanent?: string
  addressTemporary?: string

  // Step 1 — Academic
  admissionDate: string
  academicYearId: string
  classId: string
  sectionId: string
  rollNumber?: string | number
}


export const StudentDocumentType = {
  BIRTH_CERTIFICATE: 'BIRTH_CERTIFICATE',
  TRANSFER_CERTIFICATE: 'TRANSFER_CERTIFICATE',
  REPORT_CARD: 'REPORT_CARD',
  ID_PROOF: 'ID_PROOF',
  OTHER: 'OTHER',
} as const
export type StudentDocumentType = (typeof StudentDocumentType)[keyof typeof StudentDocumentType]

export interface StudentDocument {
  id: string
  studentId?: string
  documentType: StudentDocumentType
  fileName: string
  url: string
  publicId: string
  createdAt: string
  updatedAt?: string
  deletedAt?: string | null
}

export function normalizeStudentDocuments(
  docsInput?: Record<string, StudentDocument> | StudentDocument[] | null
): StudentDocument[] {
  if (!docsInput) return []
  if (Array.isArray(docsInput)) return docsInput
  if (typeof docsInput === 'object') {
    return Object.values(docsInput).filter(
      (doc): doc is StudentDocument => Boolean(doc && typeof doc === 'object' && doc?.url)
    )
  }
  return []
}