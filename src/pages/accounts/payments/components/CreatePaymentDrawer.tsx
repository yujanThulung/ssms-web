import { useState, useEffect } from 'react'
import {
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Alert,
} from 'antd'
import { DollarSign } from 'lucide-react'
import { colors } from '../../../../lib/designTokens'
import { useInvoices, type Invoice } from '../../../../features/invoices'
import {
  useCreatePayment,
  type CreatePaymentPayload,
  type Payment,
  type PaymentMethod,
} from '../../../../features/payments'

interface CreatePaymentDrawerProps {
  open: boolean
  onClose: () => void
  /** Called with the newly created payment (used to show the receipt). */
  onSuccess?: (payment: Payment) => void
  invoiceId?: string
  invoiceNumber?: string
  outstandingAmount?: number
  studentName?: string
}

const PAYMENT_METHOD_OPTIONS: { label: string; value: PaymentMethod }[] = [
  { label: 'Cash', value: 'CASH' },
  { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
  { label: 'Cheque', value: 'CHEQUE' },
  { label: 'Digital Wallet', value: 'DIGITAL_WALLET' },
  { label: 'Other', value: 'OTHER' },
]

export function CreatePaymentDrawer({
  open,
  onClose,
  onSuccess,
  invoiceId: propInvoiceId,
  invoiceNumber: propInvoiceNumber,
  outstandingAmount: propOutstandingAmount,
  studentName: propStudentName,
}: CreatePaymentDrawerProps) {
  const [form] = Form.useForm()
  const [error, setError] = useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [debouncedInvoiceSearch, setDebouncedInvoiceSearch] = useState('')
  const { mutateAsync: createPayment, isPending } = useCreatePayment()

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedInvoiceSearch(invoiceSearch), 300)
    return () => window.clearTimeout(timer)
  }, [invoiceSearch])

  // If no invoice was passed, fetch unpaid/partially paid invoices for the dropdown
  const { data: invoicesData, isLoading: loadingInvoices } = useInvoices({
    limit: 50,
    search: debouncedInvoiceSearch.trim() || undefined,
  })

  const availableInvoices = (invoicesData?.data || []).filter(
    (inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED',
  )

  const activeInvoiceId = propInvoiceId || selectedInvoice?.id
  const activeInvoiceNumber = propInvoiceNumber || selectedInvoice?.invoiceNumber
  const activeStudentName = propStudentName || selectedInvoice?.student?.name
  const activeOutstanding =
    propOutstandingAmount !== undefined
      ? propOutstandingAmount
      : selectedInvoice
        ? parseFloat(String(selectedInvoice.outstandingAmount || 0))
        : undefined

  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({
        invoiceId: propInvoiceId || undefined,
        paymentMethod: 'CASH',
        amount: propOutstandingAmount || undefined,
      })
    }
  }, [open, propInvoiceId, propOutstandingAmount, form])

  const handleInvoiceSelect = (invId: string) => {
    const found = availableInvoices.find((i) => i.id === invId)
    setSelectedInvoice(found || null)
    if (found) {
      const out = parseFloat(String(found.outstandingAmount || 0))
      form.setFieldValue('amount', out > 0 ? out : undefined)
    }
  }

  const handleSubmit = async (values: CreatePaymentPayload) => {
    setError(null)
    try {
      const created = await createPayment({
        invoiceId: values.invoiceId || activeInvoiceId!,
        amount: Number(values.amount),
        paymentMethod: values.paymentMethod,
        remarks: values.remarks || undefined,
      })
      onSuccess?.(created)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payment')
    }
  }

  return (
    <Drawer
      title={
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
            <DollarSign size={18} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Pay Bill</div>
            {activeInvoiceNumber && (
              <div style={{ fontSize: 12, color: colors.muted }}>
                Invoice: {activeInvoiceNumber} {activeStudentName ? `(${activeStudentName})` : ''}
              </div>
            )}
          </div>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={520}
      destroyOnClose
      afterOpenChange={(visible) => {
        if (!visible) {
          // Clear local state once the drawer has finished closing so the
          // next open starts fresh (setState is allowed in event handlers).
          setError(null)
          setSelectedInvoice(null)
          setInvoiceSearch('')
        }
      }}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            loading={isPending}
            onClick={() => form.submit()}
            style={{ backgroundColor: colors.primary }}
          >
            Pay Bill
          </Button>
        </Space>
      }
    >
      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError(null)}
        />
      )}

      {/* Invoice Selector if not preselected */}
      {!propInvoiceId && (
        <div style={{ marginBottom: 16 }}>
          <Form.Item
            label="Select Invoice to Pay"
            required
            help={!selectedInvoice ? 'Choose an invoice to collect payment against' : undefined}
          >
            <Select
              showSearch
              filterOption={false}
              onSearch={setInvoiceSearch}
              placeholder="Search by Invoice # or Student Name"
              loading={loadingInvoices}
              value={selectedInvoice?.id}
              onChange={handleInvoiceSelect}
              options={availableInvoices.map((inv) => ({
                value: inv.id,
                label: `${inv.invoiceNumber} — ${inv.student?.name} (Due: Rs. ${parseFloat(String(inv.outstandingAmount || 0)).toFixed(2)})`,
              }))}
            />
          </Form.Item>
        </div>
      )}

      {/* Outstanding info card */}
      {activeOutstanding !== undefined && (
        <div
          style={{
            backgroundColor: colors.primaryLight,
            border: `1px solid ${colors.primary}`,
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: colors.muted }}>Outstanding Balance</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: colors.primary }}>
              Rs. {activeOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <Button
            size="small"
            type="link"
            onClick={() => form.setFieldValue('amount', activeOutstanding)}
          >
            Pay Full Amount
          </Button>
        </div>
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {propInvoiceId && (
          <Form.Item name="invoiceId" hidden>
            <Input />
          </Form.Item>
        )}

        <Form.Item
          label="Payment Amount (NPR)"
          name="amount"
          rules={[
            { required: true, message: 'Amount is required' },
            {
              validator: (_, val) => {
                if (!val || val <= 0) return Promise.reject(new Error('Amount must be greater than 0'))
                if (activeOutstanding !== undefined && val > activeOutstanding) {
                  return Promise.reject(
                    new Error(`Amount cannot exceed outstanding balance (Rs. ${activeOutstanding.toFixed(2)})`),
                  )
                }
                return Promise.resolve()
              },
            },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0.01}
            precision={2}
            placeholder="Enter payment amount"
            prefix="Rs."
          />
        </Form.Item>

        <Form.Item
          label="Payment Method"
          name="paymentMethod"
          rules={[{ required: true, message: 'Payment method is required' }]}
        >
          <Select placeholder="Select payment method" options={PAYMENT_METHOD_OPTIONS} />
        </Form.Item>

        <Form.Item label="Remarks" name="remarks">
          <Input.TextArea rows={3} placeholder="e.g. Partial payment / tuition fee" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

