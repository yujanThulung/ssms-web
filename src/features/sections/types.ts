import type { BaseEntity } from '../../lib/api/types'
import type { SchoolClass } from '../classes/types'

export interface Section extends BaseEntity {
  classId: string
  class?: SchoolClass
  name: string
  code: string
  capacity: number | null
  classTeacherId: string | null
  status: 'ACTIVE' | 'INACTIVE'
}

export interface CreateSectionPayload {
  classId: string
  name: string
}

export interface UpdateSectionPayload {
  name?: string
  capacity?: number | null
  status?: 'ACTIVE' | 'INACTIVE'
}

export interface SectionListParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  search?: string
  status?: 'ACTIVE' | 'INACTIVE'
  classId?: string
}
