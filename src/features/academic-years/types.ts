import type { BaseEntity } from '../../lib/api/types'

export type AcademicYearStatus = 'CURRENT' | 'UPCOMING' | 'ARCHIVED'

export interface AcademicYear extends BaseEntity {
  name: string
  startDate: string
  endDate: string
  status: AcademicYearStatus
}

export interface AcademicYearSummary {
  totalSessions: number
  currentSession: {
    id: string
    name: string
  } | null
  upcomingSession: number
}

export interface CreateAcademicYearPayload {
  name: string
  startDate: string
  endDate: string
}

export type UpdateAcademicYearPayload = Partial<CreateAcademicYearPayload>
