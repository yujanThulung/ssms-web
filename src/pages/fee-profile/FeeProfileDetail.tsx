import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { Alert, Button, Drawer, Tabs, Table, Typography } from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CalculatorOutlined,
  ReloadOutlined,
  WalletOutlined,
} from '@ant-design/icons'

import { colors, radius } from '../../lib/designTokens'
import { PageHeader } from '../../components/common/PageHeader'
import { KpiRow } from '../../components/common/KpiRow'
import type { KpiItem } from '../../components/common/KpiRow'
import { CardSkeleton } from '../../components/skeleton'
import { formatBsDate, getTodayBsDate } from '../../components/nepali-calendar'
import { useAcademicYears } from '../../features/academic-years'
import type { AcademicYear } from '../../features/academic-years'
import { formatMoney, toListArray } from '../../features/fee-structures'
import {
  buildFeeProfileWarnings,
  useFeeProfile,
} from '../../features/fee-profile'
import { FeeProfileHeader } from './components/FeeProfileHeader'
import { FeesBreakdownTab } from './components/FeesBreakdownTab'
import { BenefitsTab } from './components/BenefitsTab'
import { CalculationTab } from './components/CalculationTab'
import { BillingPeriodsTab } from './components/BillingPeriodsTab'
import { EffectiveAmountTab } from './components/EffectiveAmountTab'
import { StudentInvoicesTab } from './components/StudentInvoicesTab'
import { useStudentPayments, type Payment } from '../../features/payments'
import { useInvoices, type Invoice } from '../../features/invoices'
import { useStudent } from '../../features/students'

export default function FeeProfileDetail({ studentId }: { studentId: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const backToList = () => navigate((location.state as { from?: string } | null)?.from || '/accounts/fee-profiles')
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const todayBs = useMemo(() => formatBsDate(getTodayBsDate()), [])

  const [academicYearId, setAcademicYearId] = useQueryState('academicYearId')
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('invoices'))
  const [calculationDate, setCalculationDate] = useQueryState(
    'calculationDate',
    parseAsString.withDefault(todayBs),
  )
  const [includeInactive, setIncludeInactive] = useQueryState(
    'includeInactive',
    parseAsBoolean.withDefault(false),
  )
  const [includeBillingValidation, setIncludeBillingValidation] = useQueryState(
    'includeBillingValidation',
    parseAsBoolean.withDefault(false),
  )

  const params = useMemo(
    () => ({
      academicYearId: academicYearId || undefined,
      calculationDate: calculationDate || undefined,
      includeInactive,
      includeBillingValidation,
    }),
    [academicYearId, calculationDate, includeInactive, includeBillingValidation],
  )

  const { data: profile, isLoading, isFetching, error, refetch } = useFeeProfile(studentId, params)
  const { data: studentRes } = useStudent(studentId)
  const studentPhoto = profile?.student?.photoUrl || studentRes?.data?.photoUrl || null
  const { data: invoicesData } = useInvoices({ studentId, academicYearId: academicYearId || undefined, limit: 100 })
  const accountInvoices = useMemo<Invoice[]>(() => toListArray<Invoice>(invoicesData), [invoicesData])
  const { data: yearsData, isLoading: yearsLoading } = useAcademicYears({ limit: 100 })
  const years = useMemo<AcademicYear[]>(() => toListArray<AcademicYear>(yearsData), [yearsData])

  const warnings = useMemo(() => buildFeeProfileWarnings(profile), [profile])

  const kpiItems: KpiItem[] = profile
    ? (() => {
        const activeInvoices = accountInvoices.filter((invoice) => invoice.status !== 'CANCELLED')
        const billed = activeInvoices.reduce((sum, invoice) => sum + Number(invoice.totalPayable || 0), 0)
        const paid = activeInvoices.reduce((sum, invoice) => sum + Number(invoice.paidAmount || 0), 0)
        const outstanding = activeInvoices.reduce((sum, invoice) => sum + Number(invoice.outstandingAmount || 0), 0)
        const overdue = activeInvoices.filter((invoice) => invoice.status === 'OVERDUE').length
        return [
          { key: 'billed', label: 'Billed', value: formatMoney(billed), icon: <WalletOutlined />, color: colors.primary, iconBg: colors.primaryLight },
          { key: 'paid', label: 'Paid', value: formatMoney(paid), icon: <CheckCircleOutlined />, color: colors.success, iconBg: colors.successLight },
          { key: 'outstanding', label: 'Outstanding', value: formatMoney(outstanding), icon: <ClockCircleOutlined />, color: colors.warning, iconBg: colors.warningLight },
          { key: 'overdue', label: 'Overdue invoices', value: overdue, icon: <ExclamationCircleOutlined />, color: colors.error, iconBg: colors.errorLight },
        ]
      })()
    : []

  return (
    <div>
      <PageHeader
        title="Fee Profile"
        description="Fee breakdown, benefits and billing status for this student"
        actions={
          <>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={backToList}
            >
              Back
            </Button>
            <Button
              icon={<CalculatorOutlined />}
              onClick={() => setCalculatorOpen(true)}
            >
              Calculate Amount
            </Button>
            <Button
              icon={<ReloadOutlined />}
              loading={isFetching}
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </>
        }
      />

      {error && (
        <Alert
          type="error"
          showIcon
          message="Could not load this fee profile"
          description={error.message}
          style={{ marginBottom: 20, borderRadius: radius.md }}
        />
      )}

      {isLoading && !profile ? (
        <CardSkeleton />
      ) : profile ? (
        <>
          <FeeProfileHeader
            profile={profile}
            studentPhoto={studentPhoto}
            years={years}
            yearsLoading={yearsLoading}
            academicYearId={academicYearId || undefined}
            onAcademicYearChange={(value) => setAcademicYearId(value || null)}
            calculationDate={calculationDate}
            onCalculationDateChange={(value) => setCalculationDate(value || null)}
            includeInactive={includeInactive}
            onIncludeInactiveChange={setIncludeInactive}
            includeBillingValidation={includeBillingValidation}
            onIncludeBillingValidationChange={setIncludeBillingValidation}
          />

          {warnings.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message="Review before billing"
              description={
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {warnings.map((warning) => (
                    <li key={warning} style={{ fontSize: 12, marginBottom: 2 }}>
                      {warning}
                    </li>
                  ))}
                </ul>
              }
              style={{ marginBottom: 20, borderRadius: radius.md }}
            />
          )}

          <KpiRow items={kpiItems} loading={isFetching} spans={{ lg: 6 }} />

          <Tabs
            size="large"
            activeKey={tab}
            onChange={setTab}
            destroyOnHidden={false}
            items={[
              {
                key: 'invoices',
                label: 'Invoices',
                children: (
                  <StudentInvoicesTab
                    profile={profile}
                    academicYearId={academicYearId || undefined}
                  />
                ),
              },
              {
                key: 'payments',
                label: 'Payments',
                children: <StudentPaymentsTab studentId={profile.student.id} />,
              },
              {
                key: 'fees',
                label: `Fees (${(profile.classFees?.length ?? 0) + (profile.additionalFees?.length ?? 0)})`,
                children: <FeesBreakdownTab profile={profile} />,
              },
              {
                key: 'benefits',
                label: `Benefits (${(profile.discounts?.length ?? 0) + (profile.scholarships?.length ?? 0)})`,
                children: <BenefitsTab profile={profile} />,
              },
              {
                key: 'calculation',
                label: 'Calculation',
                children: <CalculationTab profile={profile} />,
              },
              {
                key: 'billing',
                label: 'Billing Periods',
                children: <BillingPeriodsTab key={profile.academicYear.id} profile={profile} />,
              },
            ]}
          />

          <Drawer
            title="Effective Amount Calculator"
            placement="right"
            width={720}
            open={calculatorOpen}
            onClose={() => setCalculatorOpen(false)}
            destroyOnHidden
          >
            <EffectiveAmountTab
              profile={profile}
              options={{
                academicYearId: academicYearId || undefined,
                calculationDate: calculationDate || undefined,
                includeInactive,
                includeBillingValidation,
              }}
            />
          </Drawer>
        </>
      ) : null}
    </div>
  )
}

function StudentPaymentsTab({ studentId }: { studentId: string }) {
  const { data = [], isLoading } = useStudentPayments(studentId)
  const columns = [
    { title: 'Receipt', dataIndex: 'paymentNumber', key: 'paymentNumber', render: (value: string, payment: Payment) => <a href={`/accounts/payments/${payment.id}`}>{value}</a> },
    { title: 'Date', dataIndex: 'paymentDateBS', key: 'paymentDateBS', render: (value: string) => `${value} BS` },
    { title: 'Invoice', key: 'invoice', render: (_: unknown, payment: Payment) => <a href={`/accounts/invoices/${payment.invoice.id}`}>{payment.invoice.invoiceNumber}</a> },
    { title: 'Method', dataIndex: 'paymentMethod', key: 'paymentMethod' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right' as const, render: (value: string) => formatMoney(value) },
    { title: 'Outstanding after', dataIndex: 'invoiceOutstandingAfter', key: 'invoiceOutstandingAfter', align: 'right' as const, render: (value: string) => formatMoney(value) },
  ]
  return <Table<Payment> rowKey="id" columns={columns} dataSource={data} loading={isLoading} pagination={{ pageSize: 10, showSizeChanger: true }} locale={{ emptyText: <Typography.Text type="secondary">No payments recorded for this student.</Typography.Text> }} />
}
