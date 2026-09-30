import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type { FeeFrequency } from '../../../features/fee-categories/types'
import { FeeStructureStatus } from '../../../features/fee-structures'

/**
 * Student additional fees have no backend endpoints yet, so this module is a
 * self-contained in-memory stand-in. Everything here is deliberately shaped like
 * the real list response (items + meta) so swapping in React Query later only
 * touches this file.
 */

export type AdditionalFeeReason = 'LATE_FEE' | 'DAMAGE' | 'REISSUE_CARD' | 'TRANSPORT' | 'OTHER'

export const ADDITIONAL_FEE_REASON_LABEL: Record<AdditionalFeeReason, string> = {
  LATE_FEE: 'Late Fee',
  DAMAGE: 'Damage / Loss',
  REISSUE_CARD: 'Re-issue Card',
  TRANSPORT: 'Transport Change',
  OTHER: 'Other',
}

export type AdditionalFeeStatus =
  | typeof FeeStructureStatus.DRAFT
  | typeof FeeStructureStatus.PENDING_APPROVAL
  | typeof FeeStructureStatus.APPROVED
  | typeof FeeStructureStatus.ARCHIVED

export interface AdditionalFeeRow {
  id: string
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  sectionName: string
  academicYearName: string
  categoryName: string
  frequency: FeeFrequency
  amount: number
  reason: AdditionalFeeReason
  note: string | null
  status: AdditionalFeeStatus
  createdAt: string
}

export interface AdditionalFeeListResponse {
  items: AdditionalFeeRow[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export interface AdditionalFeeListParams {
  page?: number
  limit?: number
  search?: string
  status?: AdditionalFeeStatus | 'ALL'
  classId?: string
  reason?: AdditionalFeeReason
}

const STUDENTS = [
  { id: 'stu-001', admissionNo: 'ADM-1041', name: 'Aarav Sharma', className: 'Grade 5', sectionName: 'A' },
  { id: 'stu-002', admissionNo: 'ADM-1042', name: 'Diya Karki', className: 'Grade 5', sectionName: 'B' },
  { id: 'stu-003', admissionNo: 'ADM-1043', name: 'Nirajan Thapa', className: 'Grade 6', sectionName: 'A' },
  { id: 'stu-004', admissionNo: 'ADM-1044', name: 'Sneha Rai', className: 'Grade 6', sectionName: 'B' },
  { id: 'stu-005', admissionNo: 'ADM-1045', name: 'Bibek Gurung', className: 'Grade 7', sectionName: 'A' },
  { id: 'stu-006', admissionNo: 'ADM-1046', name: 'Pratiksha Adhikari', className: 'Grade 7', sectionName: 'B' },
  { id: 'stu-007', admissionNo: 'ADM-1047', name: 'Rohan Bhattarai', className: 'Grade 8', sectionName: 'A' },
  { id: 'stu-008', admissionNo: 'ADM-1048', name: 'Anisha Shrestha', className: 'Grade 8', sectionName: 'B' },
  { id: 'stu-009', admissionNo: 'ADM-1049', name: 'Kiran Basnet', className: 'Grade 9', sectionName: 'A' },
  { id: 'stu-010', admissionNo: 'ADM-1050', name: 'Megna Pokharel', className: 'Grade 9', sectionName: 'B' },
  { id: 'stu-011', admissionNo: 'ADM-1051', name: 'Sujan Tamang', className: 'Grade 10', sectionName: 'A' },
  { id: 'stu-012', admissionNo: 'ADM-1052', name: 'Ritu Joshi', className: 'Grade 10', sectionName: 'B' },
] as const

const HEADS = [
  { name: 'Library', frequency: 'ONE_TIME' as FeeFrequency },
  { name: 'Science Lab', frequency: 'TERM' as FeeFrequency },
  { name: 'Sports', frequency: 'YEARLY' as FeeFrequency },
  { name: 'Bus Pass', frequency: 'MONTHLY' as FeeFrequency },
]

const REASONS: AdditionalFeeReason[] = ['LATE_FEE', 'DAMAGE', 'REISSUE_CARD', 'TRANSPORT', 'OTHER']

const STATUSES: AdditionalFeeStatus[] = [
  FeeStructureStatus.DRAFT,
  FeeStructureStatus.PENDING_APPROVAL,
  FeeStructureStatus.APPROVED,
  FeeStructureStatus.ARCHIVED,
]

const ACADEMIC_YEARS = ['2081-2082', '2082-2083'] as const

/** Deterministic seed so the demo table is stable across reloads. */
function seed(): AdditionalFeeRow[] {
  const rows: AdditionalFeeRow[] = []
  const now = Date.now()

  for (let index = 0; index < 42; index += 1) {
    const student = STUDENTS[index % STUDENTS.length]
    const head = HEADS[index % HEADS.length]
    const status = STATUSES[index % STATUSES.length]
    const amount = 250 + ((index * 137) % 20) * 100

    rows.push({
      id: `af-${String(index + 1).padStart(3, '0')}`,
      studentId: student.id,
      studentName: student.name,
      admissionNo: student.admissionNo,
      className: student.className,
      sectionName: student.sectionName,
      academicYearName: ACADEMIC_YEARS[index % ACADEMIC_YEARS.length],
      categoryName: head.name,
      frequency: head.frequency,
      amount,
      reason: REASONS[index % REASONS.length],
      note: index % 4 === 0 ? 'Requested by class teacher.' : null,
      status,
      createdAt: new Date(now - index * 86_400_000).toISOString(),
    })
  }

  return rows
}

let rows: AdditionalFeeRow[] = seed()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getVersion = () => version
let version = 0

function commit(next: AdditionalFeeRow[]) {
  rows = next
  version += 1
  emit()
}

export function useAdditionalFeeStudents() {
  return useMemo(
    () => STUDENTS.map((student) => ({ ...student, label: `${student.name} · ${student.admissionNo}` })),
    [],
  )
}

export function useAdditionalFeeHeads() {
  return useMemo(
    () => HEADS.map((head) => ({ ...head, label: `${head.name} · ${head.frequency}` })),
    [],
  )
}

export function useAdditionalFeeList(params: AdditionalFeeListParams) {
  useSyncExternalStore(subscribe, getVersion, getVersion)

  return useMemo<AdditionalFeeListResponse>(() => {
    const page = params.page ?? 1
    const limit = params.limit ?? 10
    const search = params.search?.trim().toLowerCase() ?? ''

    const filtered = rows.filter((row) => {
      if (params.status && params.status !== 'ALL' && row.status !== params.status) return false
      if (params.reason && row.reason !== params.reason) return false
      if (params.classId && !row.className.endsWith(params.classId)) return false
      if (!search) return true

      return (
        row.studentName.toLowerCase().includes(search) ||
        row.admissionNo.toLowerCase().includes(search) ||
        row.categoryName.toLowerCase().includes(search)
      )
    })

    const start = (page - 1) * limit

    return {
      items: filtered.slice(start, start + limit),
      meta: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.max(Math.ceil(filtered.length / limit), 1),
      },
    }
  }, [params.page, params.limit, params.search, params.status, params.classId, params.reason])
}

export function useAdditionalFeeCounts() {
  useSyncExternalStore(subscribe, getVersion, getVersion)

  return useMemo(() => {
    const byStatus = { DRAFT: 0, PENDING_APPROVAL: 0, APPROVED: 0, ARCHIVED: 0 } as Record<
      AdditionalFeeStatus,
      number
    >
    let collected = 0

    for (const row of rows) {
      byStatus[row.status] += 1
      collected += row.amount
    }

    return { total: rows.length, byStatus, collected }
  }, [])
}

export interface AdditionalFeeInput {
  studentId: string
  categoryName: string
  frequency: FeeFrequency
  amount: number
  reason: AdditionalFeeReason
  note: string
  status: AdditionalFeeStatus
  academicYearName: string
}

export function useCreateAdditionalFee() {
  return useCallback((input: AdditionalFeeInput) => {
    const student = STUDENTS.find((item) => item.id === input.studentId)
    if (!student) throw new Error('Pick a student before saving')

    const row: AdditionalFeeRow = {
      id: `af-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      admissionNo: student.admissionNo,
      className: student.className,
      sectionName: student.sectionName,
      academicYearName: input.academicYearName,
      categoryName: input.categoryName,
      frequency: input.frequency,
      amount: input.amount,
      reason: input.reason,
      note: input.note.trim() || null,
      status: input.status,
      createdAt: new Date().toISOString(),
    }

    commit([row, ...rows])
    return row
  }, [])
}

export function useUpdateAdditionalFee() {
  return useCallback((id: string, input: AdditionalFeeInput) => {
    const index = rows.findIndex((row) => row.id === id)
    if (index === -1) throw new Error('That record no longer exists')

    const current = rows[index]
    const student = STUDENTS.find((item) => item.id === input.studentId)

    const next = rows.slice()
    next[index] = {
      ...current,
      ...input,
      note: input.note.trim() || null,
      studentId: student?.id ?? current.studentId,
      studentName: student?.name ?? current.studentName,
      admissionNo: student?.admissionNo ?? current.admissionNo,
      className: student?.className ?? current.className,
      sectionName: student?.sectionName ?? current.sectionName,
    }

    commit(next)
    return next[index]
  }, [])
}

export function useDeleteAdditionalFee() {
  return useCallback((id: string) => {
    const next = rows.filter((row) => row.id !== id)
    if (next.length === rows.length) throw new Error('That record no longer exists')
    commit(next)
  }, [])
}

/** Test/demo helper: put the seed data back. */
export function resetAdditionalFees() {
  commit(seed())
}
