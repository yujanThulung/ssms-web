import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Button,
  Space,
  Row,
  Col,
  Table,
  Typography,
  Alert,
  Divider,
  Tag,
  Skeleton,
  Card,
  Dropdown,
  Tooltip,
  message,
} from 'antd'
import {
  ArrowLeft,
  Printer,
  XCircle,
  User,
  Calendar,
  AlertTriangle,
  Download,
  FileText,
  ChevronDown,
  Wallet,
  Eye,
} from 'lucide-react'
import { colors } from '../../../lib/designTokens'
import { formatMoney } from '../../../features/fee-structures'
import { usePermission } from '../../../context/PermissionContext'
import { FEATURES, ACTIONS } from '../../../utils/permissions'
import { PageHeader } from '../../../components/common/PageHeader'
import {
  useInvoice,
  canCancelInvoice,
  useDownloadInvoicePdf,
  useGenerateInvoicePdf,
  type InvoiceLine,
} from '../../../features/invoices'
import { useInvoicePayments, type Payment } from '../../../features/payments'
import { InvoiceStatusTag } from './components/InvoiceStatusTag'
import { CancelInvoiceModal } from './components/CancelInvoiceModal'
import { InvoicePrintModal } from './components/InvoicePrintModal'
import { CreatePaymentDrawer } from '../payments/components/CreatePaymentDrawer'
import { PaymentReceiptModal } from '../payments/components/PaymentReceiptModal'
import { PaymentMethodTag } from '../payments/components/PaymentMethodTag'

const { Text } = Typography

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const backToList = () => navigate((location.state as { from?: string } | null)?.from || '/accounts/invoices')
  const { can } = usePermission()

  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false)
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null)

  const { data: invoice, isLoading, refetch } = useInvoice(id)
  const { mutateAsync: downloadPdf, isPending: isDownloading } = useDownloadInvoicePdf()
  const { mutateAsync: generatePdf, isPending: isGenerating } = useGenerateInvoicePdf()

  // Payments recorded against this invoice
  const { data: invoicePayments, isLoading: loadingPayments } = useInvoicePayments(
    invoice?.id || id
  )

  const canCancel =
    (can(FEATURES.INVOICE, ACTIONS.DELETE) || can(FEATURES.INVOICE, ACTIONS.CANCEL)) &&
    canCancelInvoice(invoice)

  const outstandingNum = parseFloat(String(invoice?.outstandingAmount || 0))
  const canRecordPayment =
    can(FEATURES.PAYMENT, ACTIONS.CREATE) &&
    Boolean(invoice) &&
    invoice?.status !== 'CANCELLED' &&
    outstandingNum > 0

  const handleDownloadPdf = async () => {
    if (!invoice) return

    try {
      await downloadPdf({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        pdfUrl: invoice.pdfUrl,
      })
      message.success('Invoice PDF downloaded successfully')
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Failed to download invoice PDF'
      )
    }
  }

  const handleGeneratePdf = async () => {
    if (!invoice) return

    try {
      await generatePdf(invoice.id)
      message.success('Invoice PDF regenerated successfully')
      await refetch()
      setPrintModalOpen(true)
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Failed to regenerate invoice PDF'
      )
    }
  }

  const lineColumns = [
    {
      title: '#',
      key: 'idx',
      width: 50,
      render: (_: unknown, __: unknown, idx: number) => (
        <span style={{ color: colors.muted }}>{idx + 1}</span>
      ),
    },
    {
      title: 'Fee Particulars',
      key: 'category',
      render: (_: unknown, line: InvoiceLine) => (
        <div>
          <div style={{ fontWeight: 600, color: colors.text }}>
            {line.feeCategory?.name || 'Fee Item'}
          </div>
          <Space size={6} style={{ marginTop: 2 }}>
            {line.feeCategory?.code && (
              <Tag style={{ fontSize: 10, borderRadius: 4, margin: 0 }}>
                {line.feeCategory.code}
              </Tag>
            )}
            {line.sourceType && (
              <span style={{ fontSize: 11, color: colors.muted }}>
                {line.sourceType.replace('_', ' ')}
              </span>
            )}
          </Space>
          {line.remarks && (
            <div style={{ fontSize: 12, color: colors.muted, fontStyle: 'italic', marginTop: 2 }}>
              {line.remarks}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
      width: 120,
      render: (freq: string) => (
        <span style={{ fontSize: 12, color: colors.secondaryText }}>{freq || '—'}</span>
      ),
    },
    {
      title: 'Original Amount',
      dataIndex: 'originalAmount',
      key: 'originalAmount',
      align: 'right' as const,
      render: (val: string | number) => (
        <span style={{ fontSize: 13 }}>{formatMoney(val)}</span>
      ),
    },
    {
      title: 'Discount',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      align: 'right' as const,
      render: (val: string | number) => {
        const num = parseFloat(String(val || 0))
        return num > 0 ? (
          <span style={{ color: colors.warning, fontSize: 13 }}>-{formatMoney(num)}</span>
        ) : (
          <span style={{ color: colors.muted }}>—</span>
        )
      },
    },
    {
      title: 'Scholarship',
      dataIndex: 'scholarshipAmount',
      key: 'scholarshipAmount',
      align: 'right' as const,
      render: (val: string | number) => {
        const num = parseFloat(String(val || 0))
        return num > 0 ? (
          <span style={{ color: colors.info, fontSize: 13 }}>-{formatMoney(num)}</span>
        ) : (
          <span style={{ color: colors.muted }}>—</span>
        )
      },
    },
    {
      title: 'Line Total',
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      align: 'right' as const,
      render: (val: string | number) => (
        <span style={{ fontWeight: 600, color: colors.text, fontSize: 13 }}>
          {formatMoney(val)}
        </span>
      ),
    },
  ]

  const discountNum = parseFloat(String(invoice?.discountTotal || 0))
  const scholarshipNum = parseFloat(String(invoice?.scholarshipTotal || 0))
  const fineNum = parseFloat(String(invoice?.fineAmount || 0))
  const prevBalanceNum = parseFloat(String(invoice?.previousBalance || 0))

  const paymentColumns = [
    {
      title: 'Receipt No.',
      dataIndex: 'paymentNumber',
      key: 'paymentNumber',
      render: (num: string, payment: Payment) => (
        <a href={`/accounts/payments/${payment.id}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); navigate(`/accounts/payments/${payment.id}`) }} style={{ fontFamily: 'monospace', fontWeight: 600, color: colors.primary, fontSize: 13 }}>{num}</a>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'paymentDateBS',
      key: 'paymentDate',
      render: (bs: string, p: Payment) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{bs} BS</div>
          <div style={{ fontSize: 11, color: colors.muted }}>{p.paymentDate}</div>
        </div>
      ),
    },
    {
      title: 'Method',
      key: 'paymentMethod',
      render: (_: unknown, p: Payment) => <PaymentMethodTag method={p.paymentMethod} />,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (val: string) => (
        <span style={{ fontWeight: 700, color: colors.success }}>{formatMoney(val)}</span>
      ),
    },
    {
      title: 'Collected By',
      key: 'collectedBy',
      render: (_: unknown, p: Payment) => (
        <span style={{ fontSize: 12, color: colors.secondaryText }}>
          {p.collectedBy?.name || '—'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      width: 120,
      render: (_: unknown, p: Payment) => (
        <Space size={0}>
          <Tooltip title="View Receipt">
            <Button
              type="text"
              size="small"
              icon={<Eye size={14} />}
              onClick={() => navigate(`/accounts/payments/${p.id}`)}
            />
          </Tooltip>
          <Tooltip title="Print Receipt">
            <Button
              type="text"
              size="small"
              icon={<Printer size={14} />}
              onClick={() => setReceiptPayment(p)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={
          <Space align="center" size={12}>
            <Button
              type="text"
              icon={<ArrowLeft size={18} />}
              onClick={backToList}
            />
            <span>{invoice?.invoiceNumber || 'Invoice Details'}</span>
            {invoice && <InvoiceStatusTag status={invoice.status} />}
          </Space>
        }
        description="Detailed breakdown of fee components, discounts, and billing schedule"
        actions={
          invoice && (
            <Space>
              {canRecordPayment && (
                <Button
                  icon={<Wallet size={15} />}
                  onClick={() => setPaymentDrawerOpen(true)}
                >
                  Pay Bill
                </Button>
              )}
              <Button
                icon={<Download size={15} />}
                onClick={handleDownloadPdf}
                loading={isDownloading}
              >
                Download PDF
              </Button>
              <Button
                type="primary"
                icon={<Printer size={15} />}
                onClick={() => setPrintModalOpen(true)}
              >
                Print Invoice
              </Button>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'generate',
                      label: 'Regenerate PDF',
                      icon: <FileText size={15} />,
                      onClick: handleGeneratePdf,
                      disabled: isDownloading || isGenerating,
                    },
                    ...(canCancel
                      ? [
                          {
                            type: 'divider' as const,
                          },
                          {
                            key: 'cancel',
                            label: 'Cancel Invoice',
                            danger: true,
                            icon: <XCircle size={15} />,
                            onClick: () => setCancelModalOpen(true),
                          },
                        ]
                      : []),
                  ],
                }}
                trigger={['click']}
              >
                <Button loading={isGenerating}>
                  More <ChevronDown size={14} style={{ marginLeft: 4 }} />
                </Button>
              </Dropdown>
            </Space>
          )
        }
      />

      {isLoading ? (
        <Card>
          <Skeleton active paragraph={{ rows: 14 }} />
        </Card>
      ) : !invoice ? (
        <Alert
          message="Invoice Not Found"
          description="The requested invoice does not exist or may have been removed."
          type="error"
          showIcon
          action={
            <Button onClick={backToList}>Back to Invoices</Button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Cancelled Banner */}
          {invoice.status === 'CANCELLED' && (
            <Alert
              type="error"
              showIcon
              icon={<AlertTriangle size={18} />}
              message={<span style={{ fontWeight: 600 }}>This invoice has been cancelled</span>}
              description={
                <div style={{ marginTop: 4, fontSize: 13 }}>
                  <div>
                    <strong>Reason: </strong>
                    {invoice.cancellationReason || 'No reason provided'}
                  </div>
                  {invoice.cancelledBy && (
                    <div style={{ marginTop: 2, color: colors.muted }}>
                      Cancelled by: {invoice.cancelledBy.name}
                      {invoice.cancelledAt
                        ? ` on ${new Date(invoice.cancelledAt).toLocaleString()}`
                        : ''}
                    </div>
                  )}
                </div>
              }
            />
          )}

          {/* Student & Timeline Card */}
          <Card style={{ borderRadius: 12, border: `1px solid ${colors.border}` }}>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Space size={6} style={{ color: colors.muted, fontSize: 12, marginBottom: 6 }}>
                  <User size={14} />
                  <span>STUDENT INFORMATION</span>
                </Space>
                <a href={`/accounts/fee-profiles/${invoice.student?.id}`} onClick={(event) => { event.preventDefault(); navigate(`/accounts/fee-profiles/${invoice.student?.id}`) }} style={{ display: 'inline-block', fontSize: 18, fontWeight: 700, color: colors.primary }}>
                  {invoice.student?.name}
                </a>
                <div style={{ fontSize: 13, color: colors.secondaryText, marginTop: 4 }}>
                  <span>Admission Number: </span>
                  <Text strong>{invoice.student?.admissionNumber || '—'}</Text>
                  <span style={{ margin: '0 10px' }}>|</span>
                  <span>Roll Number: </span>
                  <Text strong>{invoice.student?.rollNumber || '—'}</Text>
                </div>
                <div style={{ fontSize: 13, color: colors.secondaryText, marginTop: 2 }}>
                  <span>Class: </span>
                  <Text strong>{invoice.class?.name || '—'}</Text>
                  {invoice.section && (
                    <>
                      <span style={{ margin: '0 10px' }}>|</span>
                      <span>Section: </span>
                      <Text strong>{invoice.section.name}</Text>
                    </>
                  )}
                </div>
              </Col>

              <Col xs={24} md={12}>
                <Space size={6} style={{ color: colors.muted, fontSize: 12, marginBottom: 6 }}>
                  <Calendar size={14} />
                  <span>BILLING TIMELINE</span>
                </Space>
                <div style={{ fontSize: 13, color: colors.secondaryText }}>
                  <span>Academic Year: </span>
                  <Text strong>{invoice.academicYear?.name || '—'}</Text>
                </div>
                <div style={{ fontSize: 13, color: colors.secondaryText, marginTop: 2 }}>
                  <span>Billing Period: </span>
                  <Tag color="blue" style={{ borderRadius: 4, margin: 0 }}>
                    {invoice.billingPeriod}
                  </Tag>
                </div>
                <div style={{ fontSize: 13, color: colors.secondaryText, marginTop: 4 }}>
                  <span>Issue Date: </span>
                  <Text strong>{invoice.issueDateBS} BS</Text>
                  <span style={{ color: colors.muted, fontSize: 12 }}> ({invoice.issueDate})</span>
                </div>
                <div style={{ fontSize: 13, color: colors.secondaryText, marginTop: 2 }}>
                  <span>Due Date: </span>
                  <Text strong style={{ color: colors.error }}>
                    {invoice.dueDateBS} BS
                  </Text>
                  <span style={{ color: colors.muted, fontSize: 12 }}> ({invoice.dueDate})</span>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Lines Table */}
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>Fee Line Items</span>
                <span style={{ fontSize: 12, fontWeight: 400, color: colors.muted }}>
                  {invoice.lines?.length || 0} particular(s)
                </span>
              </div>
            }
            style={{ borderRadius: 12, border: `1px solid ${colors.border}` }}
          >
            <Table<InvoiceLine>
              rowKey="id"
              columns={lineColumns}
              dataSource={invoice.lines || []}
              pagination={false}
              bordered
            />
          </Card>

          {/* Financial Breakdown */}
          <Row gutter={20} justify="end">
            <Col xs={24} sm={16} md={12} lg={10}>
              <Card
                title={<span style={{ fontSize: 15, fontWeight: 600 }}>Payment Summary</span>}
                style={{ borderRadius: 12, border: `1px solid ${colors.border}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: colors.muted }}>Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>{formatMoney(invoice.subtotal)}</span>
                </div>

                {discountNum > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: colors.muted }}>Discounts:</span>
                    <span style={{ color: colors.warning }}>-{formatMoney(discountNum)}</span>
                  </div>
                )}

                {scholarshipNum > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: colors.muted }}>Scholarships:</span>
                    <span style={{ color: colors.info }}>-{formatMoney(scholarshipNum)}</span>
                  </div>
                )}

                {prevBalanceNum > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: colors.muted }}>Previous Balance:</span>
                    <span>+{formatMoney(prevBalanceNum)}</span>
                  </div>
                )}

                {fineNum > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: colors.muted }}>Late Fee / Fine:</span>
                    <span style={{ color: colors.error }}>+{formatMoney(fineNum)}</span>
                  </div>
                )}

                <Divider style={{ margin: '10px 0' }} />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  <span>Total Payable:</span>
                  <span style={{ color: colors.primary }}>
                    {formatMoney(invoice.totalPayable)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: colors.muted }}>Amount Paid:</span>
                  <span style={{ color: colors.success, fontWeight: 600 }}>
                    {formatMoney(invoice.paidAmount)}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    backgroundColor: colors.primaryLight,
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 15,
                    fontWeight: 700,
                    color: colors.primaryActive,
                    marginTop: 8,
                  }}
                >
                  <span>Outstanding Due:</span>
                  <span>{formatMoney(invoice.outstandingAmount)}</span>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Payment History */}
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>Payment History</span>
                <span style={{ fontSize: 12, fontWeight: 400, color: colors.muted }}>
                  {(invoicePayments?.length || 0)} payment
                  {(invoicePayments?.length || 0) !== 1 ? 's' : ''} against this invoice
                </span>
              </div>
            }
            style={{ borderRadius: 12, border: `1px solid ${colors.border}` }}
          >
            <Table<Payment>
              rowKey="id"
              size="middle"
              columns={paymentColumns}
              dataSource={invoicePayments || []}
              loading={loadingPayments}
              pagination={false}
              locale={{
                emptyText:
                  outstandingNum > 0
                    ? 'No payments recorded yet for this invoice.'
                    : undefined,
              }}
            />
          </Card>

          {/* Notes & Audit Info */}
          <Card style={{ borderRadius: 12, border: `1px solid ${colors.border}` }}>
            {invoice.notes && (
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ color: colors.text, display: 'block', marginBottom: 4 }}>
                  Invoice Notes:
                </Text>
                <div
                  style={{
                    backgroundColor: '#fefce8',
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid #fef08a',
                    color: '#854d0e',
                    fontSize: 13,
                  }}
                >
                  {invoice.notes}
                </div>
              </div>
            )}

            <Row gutter={[16, 8]} style={{ fontSize: 12, color: colors.muted }}>
              <Col span={12}>
                <div>Generated By: {invoice.generatedBy?.name || 'System Admin'}</div>
                <div>Issued On: {new Date(invoice.createdAt).toLocaleString()}</div>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <div>Last Updated: {new Date(invoice.updatedAt).toLocaleString()}</div>
              </Col>
            </Row>
          </Card>
        </div>
      )}

      <CancelInvoiceModal
        invoice={invoice || null}
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <InvoicePrintModal
        invoice={invoice || null}
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />

      <CreatePaymentDrawer
        open={paymentDrawerOpen}
        onClose={() => setPaymentDrawerOpen(false)}
        invoiceId={invoice?.id}
        invoiceNumber={invoice?.invoiceNumber}
        outstandingAmount={outstandingNum > 0 ? outstandingNum : undefined}
        studentName={invoice?.student?.name}
        onSuccess={(created) => {
          setPaymentDrawerOpen(false)
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
