import type { BaseEntity } from '../../lib/api/types'

export type InvoiceStatus =
  | 'DRAFT'
  | 'UNPAID'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED'

export const INVOICE_STATUS = {
  DRAFT: 'DRAFT',
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const

export interface InvoiceFeeCategory {
  id: string
  name: string
  code: string
}

export interface InvoiceLine {
  id: string
  feeCategory: InvoiceFeeCategory
  sourceType: string
  sourceId?: string
  frequency?: string
  originalAmount: string | number
  discountAmount: string | number
  scholarshipAmount: string | number
  netAmount: string | number
  quantity: number
  lineTotal: string | number
  remarks?: string | null
  adjustments?: unknown[]
}

export interface InvoiceStudent {
  id: string
  name: string
  admissionNumber?: string
  rollNumber?: string
  photoUrl?: string
}

export interface InvoiceAcademicYear {
  id: string
  name: string
}

export interface InvoiceClass {
  id: string
  name: string
}

export interface InvoiceSection {
  id: string
  name: string
}

export interface InvoiceUserRef {
  id: string
  name: string
  email?: string
}

export interface Invoice extends Partial<BaseEntity> {
  id: string
  invoiceNumber: string
  student: InvoiceStudent
  academicYear: InvoiceAcademicYear
  class: InvoiceClass
  section?: InvoiceSection | null
  billingPeriod: string
  issueDate: string
  issueDateBS: string
  dueDate: string
  dueDateBS: string
  subtotal: string | number
  discountTotal: string | number
  scholarshipTotal: string | number
  fineAmount: string | number
  previousBalance: string | number
  totalPayable: string | number
  paidAmount: string | number
  outstandingAmount: string | number
  status: InvoiceStatus
  notes?: string | null
  lines?: InvoiceLine[]
  generatedBy?: InvoiceUserRef
  cancelledBy?: InvoiceUserRef
  cancelledAt?: string
  cancellationReason?: string
  createdAt: string
  updatedAt: string
}

export interface InvoiceListParams {
  page?: number
  limit?: number
  search?: string
  studentId?: string
  academicYearId?: string
  classId?: string
  sectionId?: string
  status?: InvoiceStatus | string
  billingPeriod?: string
  sortBy?: 'invoiceNumber' | 'studentName' | 'issueDate' | 'dueDate' | 'totalPayable' | 'status'
  sortOrder?: 'ASC' | 'DESC'
  [key: string]: unknown
}

export interface CreateInvoicePayload {
  studentId: string
  academicYearId: string
  billingPeriod: string
  issueDateBS: string
  dueDateBS: string
  notes?: string
}

export interface CancelInvoicePayload {
  cancellationReason: string
}

export interface InvoiceStats {
  total: number
  totalPayable: number
  paidAmount: number
  outstandingAmount: number
  overdueCount: number
}

/** Check if invoice is eligible for cancellation according to business rules */
export function canCancelInvoice(
  invoice?: { status?: InvoiceStatus | string; paidAmount?: string | number } | null,
): boolean {
  if (!invoice || !invoice.status) return false
  const upper = invoice.status.toUpperCase()
  const cancellableStatus = ['UNPAID', 'OVERDUE', 'DRAFT'].includes(upper)
  const paid = parseFloat(String(invoice.paidAmount ?? 0))
  return cancellableStatus && (!Number.isFinite(paid) || paid <= 0)
}

