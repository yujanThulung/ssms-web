import type { BaseEntity } from '../../lib/api/types'

export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-'

export interface Student extends BaseEntity {
  admissionNo: string
  firstName: string
  middleName?: string | null
  lastName: string
  fullName: string
  dob: string
  gender: Gender
  bloodGroup?: BloodGroup | null
  phone?: string | null
  email?: string | null
  address?: string | null
  photo?: string | null
  status: StudentStatus
  admissionDate: string

  // Current enrollment (populated by backend)
  enrollment?: StudentEnrollment | null

  // Guardian
  guardian?: Guardian | null
}

export interface StudentEnrollment extends BaseEntity {
  studentId: string
  academicYearId: string
  academicYearName?: string
  classId: string
  className?: string
  sectionId: string
  sectionName?: string
  rollNumber?: number | null
  status: 'ACTIVE' | 'INACTIVE'
}

export interface Guardian {
  id?: string
  fatherName?: string | null
  motherName?: string | null
  guardianName?: string | null
  relationship?: string | null
  phone?: string | null
  email?: string | null
  occupation?: string | null
  address?: string | null
}

// ─── Form types ───────────────────────────────────────────────────────────────

export type AdmissionStep = 'info' | 'academic' | 'documents'

export interface AdmissionFormValues {
  // Step 1 — Student info
  firstName: string
  middleName?: string
  lastName: string
  dob: string
  gender: Gender
  bloodGroup?: BloodGroup
  phone?: string
  email?: string
  address?: string

  // Step 2 — Academic
  admissionNo: string
  admissionDate: string
  academicYearId: string
  classId: string
  sectionId: string
  rollNumber?: number

  // Step 2 — Guardian
  fatherName?: string
  motherName?: string
  guardianName?: string
  relationship?: string
  guardianPhone?: string
  guardianEmail?: string
  occupation?: string
  guardianAddress?: string
}
