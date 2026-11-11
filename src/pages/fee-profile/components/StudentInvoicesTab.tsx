import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Space, Typography, Tooltip, Empty, Row, Col, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  Receipt,
  Plus,
  Eye,
  Printer,
  XCircle,
  Calendar,
  Wallet,
  CheckCircle2,
  Clock,
  Download,
} from 'lucide-react'
import { colors } from '../../../lib/designTokens'
import { usePermission } from '../../../context/PermissionContext'
import { FEATURES, ACTIONS } from '../../../utils/permissions'
import { AppTable } from '../../../components/common/AppTable'
import { TableSkeleton } from '../../../components/skeleton'
import { StatCard } from '../../../components/common/StatCard'
import { formatMoney, toListArray } from '../../../features/fee-structures'
import type { Payment } from '../../../features/payments'
import {
  useInvoices,
  canCancelInvoice,
  useDownloadInvoicePdf,
  type Invoice,
} from '../../../features/invoices'
import type { FeeProfile } from '../../../features/fee-profile'
import { InvoiceStatusTag } from '../../accounts/invoices/components/InvoiceStatusTag'
import { CreateInvoiceDrawer } from '../../accounts/invoices/components/CreateInvoiceDrawer'
import { CancelInvoiceModal } from '../../accounts/invoices/components/CancelInvoiceModal'
import { InvoicePrintModal } from '../../accounts/invoices/components/InvoicePrintModal'
import { CreatePaymentDrawer } from '../../accounts/payments/components/CreatePaymentDrawer'
import { PaymentReceiptModal } from '../../accounts/payments/components/PaymentReceiptModal'

const { Title, Text } = Typography

interface StudentInvoicesTabProps {
  profile: FeeProfile
  academicYearId?: string
}

export function StudentInvoicesTab({ profile, academicYearId }: StudentInvoicesTabProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { can } = usePermission()

  const canCreate = can(FEATURES.INVOICE, ACTIONS.CREATE)
  const canDelete = can(FEATURES.INVOICE, ACTIONS.DELETE) || can(FEATURES.INVOICE, ACTIONS.CANCEL)
  const canRecordPayment = can(FEATURES.PAYMENT, ACTIONS.CREATE)

  const [createDrawerOpen, setCreateModalOpen] = useState(false)
  const [cancelModalInvoice, setCancelModalInvoice] = useState<Invoice | null>(null)
  const [printModalInvoice, setPrintModalInvoice] = useState<Invoice | null>(null)
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null)
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null)

  const canPayInvoice = (record: Invoice) =>
    canRecordPayment &&
    record.status !== 'CANCELLED' &&
    parseFloat(String(record.outstandingAmount || 0)) > 0

  const { data: invoicesRes, isLoading, isFetching, refetch } = useInvoices({
    studentId: profile.student.id,
    academicYearId: academicYearId || profile.academicYear.id,
    limit: 50,
  })

  const { mutateAsync: downloadPdf, isPending: isDownloading } = useDownloadInvoicePdf()

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      await downloadPdf({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      })
      message.success('Invoice PDF downloaded successfully')
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Failed to download invoice PDF'
      )
    }
  }

  const invoices = useMemo<Invoice[]>(() => {
    return toListArray<Invoice>(invoicesRes)
  }, [invoicesRes])

  // Student metrics
  const stats = useMemo(() => {
    let totalInvoiced = 0
    let totalPaid = 0
    let totalOutstanding = 0

    invoices.forEach((inv) => {
      if (inv.status !== 'CANCELLED') {
        const payable = parseFloat(String(inv.totalPayable || 0))
        const paid = parseFloat(String(inv.paidAmount || 0))
        const out = parseFloat(String(inv.outstandingAmount || 0))

        if (Number.isFinite(payable)) totalInvoiced += payable
        if (Number.isFinite(paid)) totalPaid += paid
        if (Number.isFinite(out)) totalOutstanding += out
      }
    })

    return { totalInvoiced, totalPaid, totalOutstanding }
  }, [invoices])

  const columns: ColumnsType<Invoice> = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (num: string, record: Invoice) => (
        <Space size={8}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: colors.surfaceAlt,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.primary,
            }}
          >
            <Receipt size={14} />
          </div>
          <div>
            <span
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/accounts/invoices/${record.id}`, { state: { from: `${location.pathname}${location.search}` } })
              }}
              style={{
                fontWeight: 600,
                color: colors.primary,
                cursor: 'pointer',
              }}
            >
              {num}
            </span>
            <div style={{ fontSize: 11, color: colors.muted }}>
              {record.billingPeriod}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Issue Date',
      key: 'issueDate',
      render: (_: unknown, record: Invoice) => (
        <Tooltip title={`AD: ${record.issueDate}`}>
          <Space size={4} style={{ fontSize: 13 }}>
            <Calendar size={13} color={colors.muted} />
            <span>{record.issueDateBS} BS</span>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Due Date',
      key: 'dueDate',
      render: (_: unknown, record: Invoice) => {
        const isOverdue = record.status === 'OVERDUE'
        return (
          <Tooltip title={`AD: ${record.dueDate}`}>
            <span
              style={{
                fontSize: 13,
                fontWeight: isOverdue ? 600 : 400,
                color: isOverdue ? colors.error : colors.secondaryText,
              }}
            >
              {record.dueDateBS} BS
            </span>
          </Tooltip>
        )
      },
    },
    {
      title: 'Total Payable',
      dataIndex: 'totalPayable',
      key: 'totalPayable',
      align: 'right' as const,
      render: (val: string | number) => (
        <span style={{ fontWeight: 600, color: colors.text, fontSize: 13 }}>
          {formatMoney(val)}
        </span>
      ),
    },
    {
      title: 'Paid Amount',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      align: 'right' as const,
      render: (val: string | number) => (
        <span style={{ color: colors.success, fontWeight: 500, fontSize: 13 }}>
          {formatMoney(val)}
        </span>
      ),
    },
    {
      title: 'Outstanding Due',
      dataIndex: 'outstandingAmount',
      key: 'outstandingAmount',
      align: 'right' as const,
      render: (val: string | number) => {
        const num = parseFloat(String(val || 0))
        return num > 0 ? (
          <span style={{ color: colors.error, fontWeight: 600, fontSize: 13 }}>
            {formatMoney(num)}
          </span>
        ) : (
          <span style={{ color: colors.muted, fontSize: 12 }}>Cleared</span>
        )
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (stat: string) => <InvoiceStatusTag status={stat} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      width: 200,
      render: (_: unknown, record: Invoice) => {
        const eligibleForCancel = canDelete && canCancelInvoice(record)
        const eligibleForPay = canPayInvoice(record)

        return (
          <Space size={0} onClick={(e) => e.stopPropagation()}>
            <Tooltip title="View details">
              <Button
                type="text"
                size="small"
                icon={<Eye size={15} color={colors.secondaryText} />}
                onClick={() => navigate(`/accounts/invoices/${record.id}`, { state: { from: `${location.pathname}${location.search}` } })}
              />
            </Tooltip>
            {eligibleForPay && (
              <Tooltip title="Pay Bill">
                <Button
                  type="text"
                  size="small"
                  icon={<Wallet size={15} color={colors.success} />}
                  onClick={() => setPayInvoice(record)}
                />
              </Tooltip>
            )}
            <Tooltip title="Print Invoice">
              <Button
                type="text"
                size="small"
                icon={<Printer size={15} color={colors.secondaryText} />}
                onClick={() => setPrintModalInvoice(record)}
              />
            </Tooltip>
            <Tooltip title="Download PDF">
              <Button
                type="text"
                size="small"
                loading={isDownloading}
                icon={<Download size={15} color={colors.secondaryText} />}
                onClick={() => handleDownloadPdf(record)}
              />
            </Tooltip>
            {eligibleForCancel && (
              <Tooltip title="Cancel Invoice">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<XCircle size={15} />}
                  onClick={() => setCancelModalInvoice(record)}
                />
              </Tooltip>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <div>
      {/* Top summary cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <StatCard
            variant="default"
            size="small"
            label="Total Invoiced"
            value={formatMoney(stats.totalInvoiced)}
            icon={<Wallet size={16} />}
            color={colors.info}
            iconBg={colors.infoLight}
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            variant="default"
            size="small"
            label="Total Paid"
            value={formatMoney(stats.totalPaid)}
            icon={<CheckCircle2 size={16} />}
            color={colors.success}
            iconBg={colors.successLight}
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            variant="default"
            size="small"
            label="Outstanding Balance"
            value={formatMoney(stats.totalOutstanding)}
            icon={<Clock size={16} />}
            color={stats.totalOutstanding > 0 ? colors.error : colors.muted}
            iconBg={stats.totalOutstanding > 0 ? colors.errorLight : colors.surfaceAlt}
            loading={isLoading}
          />
        </Col>
      </Row>

      {/* Action Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <Title level={5} style={{ margin: 0 }}>
            Invoices & Billing History
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Official invoices and payment records issued to {profile.student?.name}
          </Text>
        </div>

        {canCreate && (
          <Button
            type="primary"
            icon={<Plus size={15} />}
            onClick={() => setCreateModalOpen(true)}
            style={{
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            }}
          >
            Generate Invoice
          </Button>
        )}
      </div>

      {/* Invoices List / Table */}
      {isLoading ? (
        <TableSkeleton rows={4} columns={7} />
      ) : invoices.length === 0 ? (
        <div
          style={{
            padding: '48px 16px',
            backgroundColor: '#ffffff',
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            textAlign: 'center',
          }}
        >
          <Empty
            description={
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: colors.text, marginBottom: 4 }}>
                  No Invoices Issued Yet
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  This student has not been issued any invoices for the selected academic year.
                </Text>
              </div>
            }
          >
            {canCreate && (
              <Button
                type="primary"
                icon={<Plus size={15} />}
                onClick={() => setCreateModalOpen(true)}
                style={{
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  marginTop: 12,
                }}
              >
                Generate First Invoice
              </Button>
            )}
          </Empty>
        </div>
      ) : (
        <AppTable<Invoice>
          rowKey="id"
          columns={columns}
          dataSource={invoices}
          pagination={false}
          onRowClick={(record) => navigate(`/accounts/invoices/${record.id}`, { state: { from: `${location.pathname}${location.search}` } })}
          loading={isFetching}
        />
      )}

      {/* Modals & Drawers */}
      <CreateInvoiceDrawer
        open={createDrawerOpen}
        onClose={() => setCreateModalOpen(false)}
        initialStudentId={profile.student?.id}
        initialStudentName={profile.student?.name}
        initialAcademicYearId={academicYearId || profile.academicYear?.id}
        onSuccess={() => refetch()}
      />


      <CancelInvoiceModal
        invoice={cancelModalInvoice}
        open={Boolean(cancelModalInvoice)}
        onClose={() => setCancelModalInvoice(null)}
        onSuccess={() => refetch()}
      />

      <InvoicePrintModal
        invoice={printModalInvoice}
        open={Boolean(printModalInvoice)}
        onClose={() => setPrintModalInvoice(null)}
      />

      {/* Record a payment directly from the student's fee profile */}
      <CreatePaymentDrawer
        open={Boolean(payInvoice)}
        onClose={() => setPayInvoice(null)}
        invoiceId={payInvoice?.id}
        invoiceNumber={payInvoice?.invoiceNumber}
        outstandingAmount={
          payInvoice ? parseFloat(String(payInvoice.outstandingAmount || 0)) : undefined
        }
        studentName={payInvoice?.student?.name || profile.student?.name}
        onSuccess={(created) => {
          setPayInvoice(null)
          setReceiptPayment(created)
          refetch()
        }}
      />

      {/* Official receipt PDF, shown after recording a payment */}
      <PaymentReceiptModal
        payment={receiptPayment}
        open={Boolean(receiptPayment)}
        onClose={() => setReceiptPayment(null)}
      />
    </div>
  )
}

