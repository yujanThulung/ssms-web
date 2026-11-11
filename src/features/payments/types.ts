export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'DIGITAL_WALLET' | 'OTHER'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  DIGITAL_WALLET: 'Digital Wallet',
  OTHER: 'Other',
}

export interface PaymentStudentRef {
  id: string
  name: string
  admissionNumber?: string
}

export interface PaymentInvoiceRef {
  id: string
  invoiceNumber: string
}

export interface PaymentAcademicYearRef {
  id: string
  name: string
}

export interface PaymentCollectedByRef {
  id: string
  name: string
}

export interface Payment {
  id: string
  paymentNumber: string
  invoice: PaymentInvoiceRef
  student: PaymentStudentRef
  academicYear: PaymentAcademicYearRef
  amount: string
  paymentMethod: PaymentMethod
  reference?: string
  remarks?: string
  paymentDate: string
  paymentDateBS: string
  collectedBy: PaymentCollectedByRef
  collectedAt: string
  receiptPdfUrl?: string
  receiptPdfPublicId?: string
  receiptGeneratedAt?: string
  invoiceTotalPayable: string
  invoicePaidBefore: string
  invoicePaidAfter: string
  invoiceOutstandingAfter: string
  createdAt: string
  updatedAt: string
}

export interface PaymentListItem {
  id: string
  paymentNumber: string
  student: { id: string; name: string }
  invoice: { id: string; invoiceNumber: string }
  amount: string
  paymentMethod: PaymentMethod
  paymentDate: string
  paymentDateBS: string
  collectedBy: { id: string; name: string }
  invoiceOutstandingAfter: string
  createdAt: string
}

export interface PaymentListParams {
  page?: number
  limit?: number
  search?: string
  studentId?: string
  invoiceId?: string
  academicYearId?: string
  paymentMethod?: PaymentMethod | string
  dateFrom?: string
  dateTo?: string
  collectedBy?: string
  sortBy?: 'paymentNumber' | 'paymentDate' | 'amount' | 'studentName'
  sortOrder?: 'ASC' | 'DESC'
  [key: string]: unknown
}

export interface CreatePaymentPayload {
  invoiceId: string
  amount: number
  paymentMethod: PaymentMethod
  remarks?: string
}

export interface RegenerateReceiptResponse {
  success: boolean
  message: string
  data: {
    pdfUrl: string
    publicId: string
    uploadedAt?: string
  }
}

export interface ReceiptInfo {
  receiptPdfUrl: string | null
  receiptPdfPublicId: string | null
  receiptGeneratedAt: string | null
}
