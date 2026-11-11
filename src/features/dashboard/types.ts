export interface DashboardMetric {
  amount: number | null
  changePercentage: number | null
}

export interface DashboardCountMetric {
  count: number
  changePercentage: number | null
}

export interface DashboardData {
  academicSession: { id: string; name: string; status: string }
  summary: {
    feesCollectedToday: DashboardMetric
    pendingFees: DashboardMetric
    monthlyExpenses: DashboardMetric
    outstandingBalance: DashboardMetric
    studentsPaid: DashboardCountMetric
    studentsDue: DashboardCountMetric
  }
  students: {
    total: number
    newAdmissions: number
    active: number
    totalClasses: number
    totalSections: number
    byClass: Array<{ classId: string; className: string; studentCount: number }>
    byGender: Array<{ gender: string; count: number; percentage: number }>
    admissionTrend: Array<{ month: string; admissions: number }>
  }
  feeCollection: {
    monthly: Array<{ month: string; billed: number; collected: number }>
    byClass: Array<{ classId: string; className: string; collectedAmount: number }>
    totals: { billed: number; collected: number }
  }
  paymentMethods: {
    totalTransactions: number
    totalAmount: number
    mostUsedMethod: null | { method: string; transactionCount: number; amount: number; percentage: number }
    breakdown: Array<{ method: string; transactionCount: number; amount: number; percentage: number }>
  }
  recentTransactions: Array<{
    id: string
    type: 'INCOME' | 'EXPENSE'
    student: { id: string; name: string } | null
    description: string
    method: string
    amount: number
    date: string
  }>
  billing: { totalStudentsBilled: number; studentsPaid: number; studentsDue: number }
  metadata?: { monthlyExpensesAvailable?: boolean; monthlyExpensesReason?: string }
}

