import { useState } from 'react'
import { Modal, Form, Input, Alert, Typography, Descriptions, Space } from 'antd'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { colors } from '../../../../lib/designTokens'
import { formatMoney } from '../../../../features/fee-structures'
import { useCancelInvoice, type Invoice } from '../../../../features/invoices'
import { InvoiceStatusTag } from './InvoiceStatusTag'

const { Text } = Typography
const { TextArea } = Input

interface CancelInvoiceModalProps {
  invoice: Invoice | null
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CancelInvoiceModal({
  invoice,
  open,
  onClose,
  onSuccess,
}: CancelInvoiceModalProps) {
  const [form] = Form.useForm<{ cancellationReason: string }>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutateAsync: cancelInvoice } = useCancelInvoice()

  if (!invoice) return null

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setIsSubmitting(true)
      await cancelInvoice({
        id: invoice.id,
        payload: {
          cancellationReason: values.cancellationReason.trim(),
        },
      })
      toast.success(`Invoice ${invoice.invoiceNumber} has been cancelled successfully.`)
      form.resetFields()
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to cancel invoice. Please try again.'
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title={
        <Space align="center">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: colors.errorLight,
              color: colors.error,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>
            Cancel Invoice
          </span>
        </Space>
      }
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Confirm Cancellation"
      cancelText="Keep Invoice"
      okButtonProps={{
        danger: true,
        loading: isSubmitting,
      }}
      destroyOnClose
      width={520}
    >
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <Alert
          type="warning"
          showIcon
          message="Are you sure you want to cancel this invoice?"
          description="Cancelling will mark this invoice as CANCELLED and reverse the billed amounts. This action cannot be undone."
          style={{ marginBottom: 16 }}
        />

        <div
          style={{
            backgroundColor: colors.surfaceAlt,
            padding: 12,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            marginBottom: 16,
          }}
        >
          <Descriptions size="small" column={2}>
            <Descriptions.Item label="Invoice #">
              <Text strong>{invoice.invoiceNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <InvoiceStatusTag status={invoice.status} />
            </Descriptions.Item>
            <Descriptions.Item label="Student">
              {invoice.student?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Billing Period">
              {invoice.billingPeriod}
            </Descriptions.Item>
            <Descriptions.Item label="Total Payable">
              <Text strong>{formatMoney(invoice.totalPayable)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Paid Amount">
              <Text type="secondary">{formatMoney(invoice.paidAmount)}</Text>
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
            name="cancellationReason"
            label="Cancellation Reason"
            rules={[
              { required: true, message: 'Please provide a reason for cancelling this invoice' },
              { min: 5, message: 'Reason must be at least 5 characters long' },
              { max: 500, message: 'Reason cannot exceed 500 characters' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="e.g. Student withdrew from school, duplicate invoice issued, error in fee structure..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

