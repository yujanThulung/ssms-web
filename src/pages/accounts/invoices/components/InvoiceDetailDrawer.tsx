import { useState } from 'react'
import {
  Drawer,
  Space,
  Button,
  Table,
  Typography,
  Alert,
  Divider,
  Tag,
  Row,
  Col,
  Skeleton,
} from 'antd'
import {
  Printer,
  XCircle,
  User,
  Calendar,
  AlertTriangle,
  Receipt,
  ExternalLink,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../../../lib/designTokens'
import { formatMoney } from '../../../../features/fee-structures'
import { usePermission } from '../../../../context/PermissionContext'
import { FEATURES, ACTIONS } from '../../../../utils/permissions'
import {
  useInvoice,
  canCancelInvoice,
  type InvoiceLine,
} from '../../../../features/invoices'
import { InvoiceStatusTag } from './InvoiceStatusTag'
import { CancelInvoiceModal } from './CancelInvoiceModal'
import { InvoicePrintModal } from './InvoicePrintModal'

const { Title, Text } = Typography

interface InvoiceDetailDrawerProps {
  invoiceId: string | null
  open: boolean
  onClose: () => void
  onInvoiceUpdated?: () => void
}

export function InvoiceDetailDrawer({
  invoiceId,
  open,
  onClose,
  onInvoiceUpdated,
}: InvoiceDetailDrawerProps) {
  const navigate = useNavigate()
  const { can } = usePermission()
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [printModalOpen, setPrintModalOpen] = useState(false)

  const { data: invoice, isLoading, refetch } = useInvoice(invoiceId || undefined, open)

  const canCancel =
    (can(FEATURES.INVOICE, ACTIONS.DELETE) || can(FEATURES.INVOICE, ACTIONS.CANCEL)) &&
    canCancelInvoice(invoice)

  const lineColumns = [
    {
      title: '#',
      key: 'idx',
      width: 45,
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
      width: 100,
      render: (freq: string) => (
        <span style={{ fontSize: 12, color: colors.secondaryText }}>{freq || '—'}</span>
      ),
    },
    {
      title: 'Original',
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

  return (
    <>
      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space align="center" size={10}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: colors.primaryLight,
                  color: colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Receipt size={18} />
              </div>
              <div>
                <span style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>
                  {invoice?.invoiceNumber || 'Invoice Details'}
                </span>
                {invoice && (
                  <span style={{ marginLeft: 8 }}>
                    <InvoiceStatusTag status={invoice.status} />
                  </span>
                )}
              </div>
            </Space>

            {invoice && (
              <Space>
                <Button
                  size="small"
                  icon={<ExternalLink size={13} />}
                  onClick={() => {
                    onClose()
                    navigate(`/accounts/invoices/${invoice.id}`)
                  }}
                >
                  Full Page
                </Button>
                <Button
                  size="small"
                  icon={<Printer size={13} />}
                  onClick={() => setPrintModalOpen(true)}
                >
                  Print
                </Button>
                {canCancel && (
                  <Button
                    size="small"
                    danger
                    icon={<XCircle size={13} />}
                    onClick={() => setCancelModalOpen(true)}
                  >
                    Cancel
                  </Button>
                )}
              </Space>
            )}
          </div>
        }
        open={open}
        onClose={onClose}
        width={760}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID: {invoice?.id || '—'}
            </Text>
            <Space>
              <Button onClick={onClose}>Close</Button>
              <Button
                type="primary"
                icon={<Printer size={15} />}
                onClick={() => setPrintModalOpen(true)}
                style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
              >
                Print Invoice
              </Button>
            </Space>
          </div>
        }
      >
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 12 }} />
        ) : !invoice ? (
          <Alert message="Invoice not found" type="error" showIcon />
        ) : (
          <div>
            {/* Cancelled Banner */}
            {invoice.status === 'CANCELLED' && (
              <Alert
                type="error"
                showIcon
                icon={<AlertTriangle size={18} />}
                message={
                  <span style={{ fontWeight: 600 }}>This invoice has been cancelled</span>
                }
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
                style={{ marginBottom: 20 }}
              />
            )}

            {/* Student & Class Card */}
            <div
              style={{
                backgroundColor: colors.surfaceAlt,
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <Row gutter={[16, 12]}>
                <Col xs={24} sm={12}>
                  <Space size={6} style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>
                    <User size={13} />
                    <span>STUDENT DETAILS</span>
                  </Space>
                  <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>
                    {invoice.student?.name}
                  </div>
                  <div style={{ fontSize: 13, color: colors.secondaryText, marginTop: 4 }}>
                    <span>Admission #: </span>
                    <Text strong>{invoice.student?.admissionNumber || '—'}</Text>
                    <span style={{ margin: '0 8px' }}>|</span>
                    <span>Roll #: </span>
                    <Text strong>{invoice.student?.rollNumber || '—'}</Text>
                  </div>
                  <div style={{ fontSize: 13, color: colors.secondaryText, marginTop: 2 }}>
                    <span>Class: </span>
                    <Text strong>{invoice.class?.name || '—'}</Text>
                    {invoice.section && (
                      <>
                        <span style={{ margin: '0 8px' }}>|</span>
                        <span>Section: </span>
                        <Text strong>{invoice.section.name}</Text>
                      </>
                    )}
                  </div>
                </Col>

                <Col xs={24} sm={12}>
                  <Space size={6} style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>
                    <Calendar size={13} />
                    <span>INVOICE TIMELINE</span>
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
            </div>

            {/* Line Items Table */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Title level={5} style={{ margin: 0 }}>
                  Invoice Line Items
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {invoice.lines?.length || 0} fee particular(s)
                </Text>
              </div>

              <Table<InvoiceLine>
                rowKey="id"
                size="middle"
                columns={lineColumns}
                dataSource={invoice.lines || []}
                pagination={false}
                bordered
              />
            </div>

            {/* Financial Summary */}
            <Row gutter={16} justify="end" style={{ marginBottom: 24 }}>
              <Col xs={24} sm={14} md={12}>
                <div
                  style={{
                    backgroundColor: colors.surfaceAlt,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    padding: 16,
                    fontSize: 13,
                  }}
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

                  <Divider style={{ margin: '8px 0' }} />

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
                      fontSize: 14,
                      fontWeight: 700,
                      color: colors.primaryActive,
                      marginTop: 6,
                    }}
                  >
                    <span>Outstanding Due:</span>
                    <span>{formatMoney(invoice.outstandingAmount)}</span>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Notes & Audit Info */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: 16,
                fontSize: 12,
                color: colors.muted,
              }}
            >
              {invoice.notes && (
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ color: colors.text, display: 'block', marginBottom: 4 }}>
                    Invoice Notes:
                  </Text>
                  <div
                    style={{
                      backgroundColor: '#fefce8',
                      padding: 8,
                      borderRadius: 4,
                      border: '1px solid #fef08a',
                      color: '#854d0e',
                    }}
                  >
                    {invoice.notes}
                  </div>
                </div>
              )}

              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <div>Generated By: {invoice.generatedBy?.name || 'System Admin'}</div>
                  <div>Issued On: {new Date(invoice.createdAt).toLocaleString()}</div>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <div>Last Updated: {new Date(invoice.updatedAt).toLocaleString()}</div>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Drawer>

      <CancelInvoiceModal
        invoice={invoice || null}
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onSuccess={() => {
          refetch()
          onInvoiceUpdated?.()
        }}
      />

      <InvoicePrintModal
        invoice={invoice || null}
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />
    </>
  )
}
