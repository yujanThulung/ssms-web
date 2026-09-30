import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
} from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { toast } from 'sonner'
import dayjs, { type Dayjs } from 'dayjs'

import { colors, DRAWER, radius } from '../../../lib/designTokens'
import {
  FEE_FREQUENCY_COLOR,
  FEE_FREQUENCY_OPTIONS,
  FEE_STRUCTURE_STATUS_LABEL,
  formatMoney,
  getFrequencyLabel,
} from '../../../features/fee-structures'
import { FeeStructureStatus } from '../../../features/fee-structures'
import {
  ADDITIONAL_FEE_REASON_LABEL,
  useAdditionalFeeHeads,
  useAdditionalFeeStudents,
  useCreateAdditionalFee,
  useUpdateAdditionalFee,
} from './additionalFeesData'
import type { FeeFrequency } from '../../../features/fee-categories/types'
import type { AdditionalFeeInput, AdditionalFeeRow } from './additionalFeesData'

const { Text } = Typography

const REASON_OPTIONS = Object.entries(ADDITIONAL_FEE_REASON_LABEL).map(([value, label]) => ({
  value,
  label,
}))

const STATUS_OPTIONS = [
  FeeStructureStatus.DRAFT,
  FeeStructureStatus.PENDING_APPROVAL,
  FeeStructureStatus.APPROVED,
].map((value) => ({ value, label: FEE_STRUCTURE_STATUS_LABEL[value] }))

interface FormValues {
  studentId: string
  categoryName: string
  frequency: AdditionalFeeInput['frequency']
  amount: number
  reason: AdditionalFeeInput['reason']
  note: string
  status: AdditionalFeeInput['status']
  appliesFrom: Dayjs
}

export interface AdditionalFeeDrawerProps {
  /** Present when editing; absent when creating. */
  record?: AdditionalFeeRow | null
  onClose: () => void
  onDone: () => void
}

export function AdditionalFeeDrawer({ record, onClose, onDone }: AdditionalFeeDrawerProps) {
  const [form] = Form.useForm<FormValues>()
  const [isPending, setPending] = useState(false)
  const students = useAdditionalFeeStudents()
  const heads = useAdditionalFeeHeads()

  const studentOptions = useMemo(
    () =>
      students.map((student) => ({
        value: student.id,
        label: student.label,
        group: `${student.className} - ${student.sectionName}`,
      })),
    [students],
  )

  const headOptions = useMemo(
    () => [
      ...heads.map((head) => ({
        value: head.name,
        label: head.name,
        frequency: head.frequency as FeeFrequency,
      })),
      ...FEE_FREQUENCY_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
        frequency: option.value,
      })),
    ],
    [heads],
  )
  const createFee = useCreateAdditionalFee()
  const updateFee = useUpdateAdditionalFee()

  const amount = Form.useWatch('amount', form)
  const frequency = Form.useWatch('frequency', form)

  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        studentId: record.studentId,
        categoryName: record.categoryName,
        frequency: record.frequency,
        amount: record.amount,
        reason: record.reason,
        note: record.note ?? '',
        status: record.status,
        appliesFrom: dayjs(record.createdAt),
      })
    }
  }, [form, record])

  const frequencyHint = useMemo(() => {
    if (!frequency || !amount) return null
    return `${formatMoney(amount)} × ${getFrequencyLabel(frequency).toLowerCase()}`
  }, [frequency, amount])

  const toInput = (values: FormValues): AdditionalFeeInput => ({
    studentId: values.studentId,
    categoryName: values.categoryName.trim(),
    frequency: values.frequency,
    amount: values.amount,
    reason: values.reason,
    note: values.note ?? '',
    status: values.status,
    academicYearName: record?.academicYearName ?? '2082-2083',
  })

  const handleSubmit = async () => {
    const values = await form.validateFields()

    setPending(true)
    try {
      if (record) {
        updateFee(record.id, toInput(values))
        toast.success('Additional fee updated')
      } else {
        createFee(toInput(values))
        toast.success('Additional fee added')
      }
      onDone()
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Could not save the additional fee')
    } finally {
      setPending(false)
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      size={DRAWER.width}
      destroyOnHidden
      title={
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>
            {record ? 'Edit Additional Fee' : 'Add Additional Fee'}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record
              ? `${record.studentName} · ${record.admissionNo}`
              : 'A one-off charge on top of the class fee structure'}
          </Text>
        </div>
      }
      extra={
        <Space>
          <Button onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={isPending}
            onClick={handleSubmit}
            style={{ background: colors.primary }}
          >
            {record ? 'Save Changes' : 'Add Fee'}
          </Button>
        </Space>
      }
      styles={{ body: { padding: 20 } }}
    >
      <Form form={form} layout="vertical" initialValues={{ status: FeeStructureStatus.DRAFT }}>
        <Form.Item name="studentId" label="Student" rules={[{ required: true, message: 'Pick a student' }]}>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Search by name or admission no."
            options={studentOptions}
            notFoundContent="No students found"
          />
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              name="categoryName"
              label="Fee Head"
              rules={[{ required: true, message: 'Enter a fee head' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Pick or type a fee head"
                options={headOptions.map((option) => ({ value: option.value, label: option.label }))}
                onChange={(value: string) => {
                  const match = headOptions.find((option) => option.value === value)
                  if (match) form.setFieldValue('frequency', match.frequency)
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="frequency"
              label="Frequency"
              rules={[{ required: true, message: 'Pick a frequency' }]}
            >
              <Select options={FEE_FREQUENCY_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              name="amount"
              label="Amount"
              rules={[{ required: true, message: 'Enter an amount' }]}
            >
              <InputNumber
                min={0}
                precision={2}
                addonBefore="Rs."
                style={{ width: '100%' }}
                placeholder="0.00"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="appliesFrom" label="Applies From">
              <DatePicker
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
                disabled={Boolean(record)}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="reason" label="Reason" rules={[{ required: true, message: 'Pick a reason' }]}>
          <Select options={REASON_OPTIONS} />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: 'Pick a status' }]}
          extra="Only drafts can be edited later."
        >
          <Select options={STATUS_OPTIONS} />
        </Form.Item>

        <Form.Item name="note" label="Note">
          <Input.TextArea rows={3} maxLength={240} showCount placeholder="Optional note for the audit trail" />
        </Form.Item>

        {frequencyHint && (
          <Alert
            type="info"
            showIcon
            style={{ background: colors.surfaceAlt, borderRadius: radius.md }}
            message={
              <Space size={8} wrap>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Charged as</Text>
                <Text strong style={{ fontSize: 12 }}>{frequencyHint}</Text>
                {frequency && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: '#ffffff',
                      background: FEE_FREQUENCY_COLOR[frequency] ?? colors.muted,
                      padding: '1px 6px',
                      borderRadius: radius.sm,
                    }}
                  >
                    {getFrequencyLabel(frequency)}
                  </Text>
                )}
              </Space>
            }
          />
        )}
      </Form>
    </Drawer>
  )
}
