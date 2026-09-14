import type { BaseEntity } from '../../lib/api/types'

export type ClassStatus = 'ACTIVE' | 'INACTIVE'
export type AcademicYearStatus = 'CURRENT' | 'UPCOMING' | 'ARCHIVED'

export interface AcademicYear extends BaseEntity {
  name: string
  startDate: string
  endDate: string
  status: AcademicYearStatus
}

export interface SchoolClass extends BaseEntity {
  academicYearId: string
  academicYear?: AcademicYear
  name: string
  code: string
  status: ClassStatus
}

export interface Section extends BaseEntity {
  classId: string
  name: string
  code: string
  capacity: number | null
  classTeacherId: string | null
  status: 'ACTIVE' | 'INACTIVE'
}

export interface MockTeacher {
  id: string
  name: string
  department: string
  status: 'Active' | 'Inactive'
}
