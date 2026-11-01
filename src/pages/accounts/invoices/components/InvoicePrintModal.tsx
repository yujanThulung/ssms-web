import { useRef } from 'react'
import { Modal, Button, Space, Typography, Table, Divider } from 'antd'
import { Printer } from 'lucide-react'
import { colors } from '../../../../lib/designTokens'
import { formatMoney } from '../../../../features/fee-structures'
import type { Invoice, InvoiceLine } from '../../../../features/invoices'
import { InvoiceStatusTag } from './InvoiceStatusTag'

const { Title, Text } = Typography

interface InvoicePrintModalProps {
  invoice: Invoice | null
  open: boolean
  onClose: () => void
}

export function InvoicePrintModal({ invoice, open, onClose }: InvoicePrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!invoice) return null

  const handlePrint = () => {
    window.print()
  }

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 40,
      render: (_: unknown, __: unknown, idx: number) => idx + 1,
    },
    {
      title: 'Fee Particulars',
      key: 'feeCategory',
      render: (_: unknown, line: InvoiceLine) => (
        <div>
          <div style={{ fontWeight: 600 }}>{line.feeCategory?.name || 'Fee Item'}</div>
          {line.feeCategory?.code && (
            <div style={{ fontSize: 11, color: colors.muted }}>Code: {line.feeCategory.code}</div>
          )}
          {line.remarks && (
            <div style={{ fontSize: 11, color: colors.muted, fontStyle: 'italic' }}>
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
      render: (freq: string) => freq || '—',
    },
    {
      title: 'Amount',
      dataIndex: 'originalAmount',
      key: 'originalAmount',
      align: 'right' as const,
      render: (val: string | number) => formatMoney(val),
    },
    {
      title: 'Discount',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      align: 'right' as const,
      render: (val: string | number) => {
        const num = parseFloat(String(val || 0))
        return num > 0 ? (
          <span style={{ color: colors.warning }}>-{formatMoney(num)}</span>
        ) : (
          '—'
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
          <span style={{ color: colors.info }}>-{formatMoney(num)}</span>
        ) : (
          '—'
        )
      },
    },
    {
      title: 'Net Total',
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      align: 'right' as const,
      render: (val: string | number) => (
        <span style={{ fontWeight: 600 }}>{formatMoney(val)}</span>
      ),
    },
  ]

  const discountNum = parseFloat(String(invoice.discountTotal || 0))
  const scholarshipNum = parseFloat(String(invoice.scholarshipTotal || 0))
  const fineNum = parseFloat(String(invoice.fineAmount || 0))
  const prevBalanceNum = parseFloat(String(invoice.previousBalance || 0))

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={840}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Pressing Print will open your browser's print dialog
          </Text>
          <Space>
            <Button onClick={onClose}>Close</Button>
            <Button
              type="primary"
              icon={<Printer size={15} />}
              onClick={handlePrint}
              style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
            >
              Print Receipt
            </Button>
          </Space>
        </div>
      }
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 20px !important;
            background: white !important;
          }
          .ant-modal-mask, .ant-modal-wrap, .ant-modal-close, .ant-modal-footer {
            display: none !important;
          }
        }
      `}</style>

      <div
        id="printable-invoice"
        ref={printRef}
        style={{
          padding: '24px 16px',
          backgroundColor: '#ffffff',
          color: '#111827',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #15803d',
            paddingBottom: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0, color: colors.primary }}>
              SCHOOL FEE INVOICE
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Student Billing & Accounts Department
            </Text>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>
              {invoice.invoiceNumber}
            </div>
            <div style={{ marginTop: 4 }}>
              <InvoiceStatusTag status={invoice.status} />
            </div>
          </div>
        </div>

        {/* Student & Invoice Meta Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
            fontSize: 13,
          }}
        >
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>
              Student Information
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginTop: 2 }}>
              {invoice.student?.name}
            </div>
            <div style={{ marginTop: 4, color: '#374151' }}>
              <span>Admission #: </span>
              <strong>{invoice.student?.admissionNumber || '—'}</strong>
              <span style={{ margin: '0 8px' }}>|</span>
              <span>Roll #: </span>
              <strong>{invoice.student?.rollNumber || '—'}</strong>
            </div>
            <div style={{ marginTop: 2, color: '#374151' }}>
              <span>Class: </span>
              <strong>{invoice.class?.name || '—'}</strong>
              {invoice.section && (
                <>
                  <span style={{ margin: '0 8px' }}>|</span>
                  <span>Section: </span>
                  <strong>{invoice.section.name}</strong>
                </>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>
              Billing Details
            </div>
            <div style={{ marginTop: 4, color: '#374151' }}>
              <span>Academic Year: </span>
              <strong>{invoice.academicYear?.name || '—'}</strong>
            </div>
            <div style={{ marginTop: 2, color: '#374151' }}>
              <span>Billing Period: </span>
              <strong>{invoice.billingPeriod}</strong>
            </div>
            <div style={{ marginTop: 2, color: '#374151' }}>
              <span>Issue Date: </span>
              <strong>{invoice.issueDateBS} BS</strong>
              <span style={{ color: '#6b7280', fontSize: 12 }}> ({invoice.issueDate})</span>
            </div>
            <div style={{ marginTop: 2, color: '#374151' }}>
              <span>Due Date: </span>
              <strong style={{ color: colors.error }}>{invoice.dueDateBS} BS</strong>
              <span style={{ color: '#6b7280', fontSize: 12 }}> ({invoice.dueDate})</span>
            </div>
          </div>
        </div>

        {/* Lines Table */}
        <Table<InvoiceLine>
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={invoice.lines || []}
          pagination={false}
          style={{ marginBottom: 20 }}
          bordered
        />

        {/* Summary Breakdown Grid */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <div
            style={{
              width: 320,
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 12,
              fontSize: 13,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#6b7280' }}>Subtotal:</span>
              <span style={{ fontWeight: 600 }}>{formatMoney(invoice.subtotal)}</span>
            </div>

            {discountNum > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#6b7280' }}>Discounts:</span>
                <span style={{ color: colors.warning }}>-{formatMoney(discountNum)}</span>
              </div>
            )}

            {scholarshipNum > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#6b7280' }}>Scholarships:</span>
                <span style={{ color: colors.info }}>-{formatMoney(scholarshipNum)}</span>
              </div>
            )}

            {prevBalanceNum > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#6b7280' }}>Previous Balance:</span>
                <span>+{formatMoney(prevBalanceNum)}</span>
              </div>
            )}

            {fineNum > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#6b7280' }}>Fine / Late Fee:</span>
                <span style={{ color: colors.error }}>+{formatMoney(fineNum)}</span>
              </div>
            )}

            <Divider style={{ margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, marginBottom: 6 }}>
              <span style={{ fontWeight: 700 }}>Total Payable:</span>
              <span style={{ fontWeight: 700, color: colors.primary }}>
                {formatMoney(invoice.totalPayable)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#6b7280' }}>Amount Paid:</span>
              <span style={{ color: colors.success, fontWeight: 600 }}>
                {formatMoney(invoice.paidAmount)}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 14,
                backgroundColor: colors.primaryLight,
                padding: '6px 8px',
                borderRadius: 4,
                marginTop: 6,
              }}
            >
              <span style={{ fontWeight: 700, color: colors.primaryActive }}>Outstanding Due:</span>
              <span style={{ fontWeight: 700, color: colors.primaryActive }}>
                {formatMoney(invoice.outstandingAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div
            style={{
              padding: 12,
              backgroundColor: '#fefce8',
              border: '1px solid #fef08a',
              borderRadius: 6,
              fontSize: 12,
              marginBottom: 24,
            }}
          >
            <strong>Note: </strong>
            <span>{invoice.notes}</span>
          </div>
        )}

        {/* Signatures */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
            marginTop: 40,
            paddingTop: 16,
            textAlign: 'center',
            fontSize: 12,
            color: '#4b5563',
          }}
        >
          <div>
            <div style={{ borderTop: '1px dashed #9ca3af', paddingTop: 8 }}>
              {invoice.generatedBy?.name || 'System Generated'}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>Prepared By</div>
          </div>
          <div>
            <div style={{ borderTop: '1px dashed #9ca3af', paddingTop: 8 }}>
              Accountant / Cashier
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>Authorized Signature</div>
          </div>
          <div>
            <div style={{ borderTop: '1px dashed #9ca3af', paddingTop: 8 }}>
              Parent / Student
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>Acknowledgment</div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
