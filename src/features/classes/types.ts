import type { BaseEntity } from '../../lib/api/types'
import type { AcademicYear } from '../academic-years/types'

export type ClassStatus = 'ACTIVE' | 'INACTIVE'

export interface SchoolClass extends BaseEntity {
  academicYearId: string
  academicYear?: AcademicYear
  name: string
  code: string
  status: ClassStatus
}

export interface CreateClassPayload {
  name: string
  academicYearId: string
  status?: ClassStatus
}

export type UpdateClassPayload = Partial<CreateClassPayload>

export interface ClassListParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  search?: string
  status?: ClassStatus
  academicYearId?: string
}
