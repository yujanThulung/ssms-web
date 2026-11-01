import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Drawer,
  Button,
  Form,
  Select,
  Input,
  Row,
  Col,
  Space,
  Alert,
  Tooltip,
  Divider,
} from 'antd'
import { FilePlus, Info, User, Calendar, BookOpen, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { colors, DRAWER } from '../../../../lib/designTokens'
import {
  NepaliDatePicker,
  formatBsDate,
  getTodayBsDate,
  BS_MONTH_NAMES_EN,
} from '../../../../components/nepali-calendar'
import { bsIsoToAdIso, adIsoToBsIso } from '../../../../utils/nepaliDate'
import { useAcademicYears } from '../../../../features/academic-years'
import { useClasses } from '../../../../features/classes'
import { useSections } from '../../../../features/sections'
import { useStudents } from '../../../../features/students'
import { toListArray } from '../../../../features/fee-structures'
import { useCreateInvoice, type Invoice } from '../../../../features/invoices'

const { TextArea } = Input

interface CreateInvoiceDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess?: (invoice: Invoice) => void
  initialStudentId?: string
  initialAcademicYearId?: string
  initialStudentName?: string
}

interface FormValues {
  academicYearId: string
  classId?: string
  sectionId?: string
  studentId: string
  billingPeriod: string
  issueDateBS: string
  dueDateBS: string
  notes?: string
}

function formatBsMonthYear(bsIso: string): string {
  const [year, month] = bsIso.split('-').map(Number)
  const monthName = BS_MONTH_NAMES_EN[month - 1]
  if (!year || !monthName) return bsIso
  return `${monthName} ${year}`
}

export function CreateInvoiceDrawer({
  open,
  onClose,
  onSuccess,
  initialStudentId,
  initialAcademicYearId,
  initialStudentName,
}: CreateInvoiceDrawerProps) {
  const [form] = Form.useForm<FormValues>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutateAsync: createInvoice } = useCreateInvoice()

  // Track parent values for cascade
  const selectedAcademicYear = Form.useWatch('academicYearId', form)
  const selectedClassId = Form.useWatch('classId', form)
  const selectedSectionId = Form.useWatch('sectionId', form)
  const selectedIssueDate = Form.useWatch('issueDateBS', form)

  const prevYear = useRef<string | undefined>(undefined)
  const prevClass = useRef<string | undefined>(undefined)
  const lastAutoBillingPeriod = useRef<string | undefined>(undefined)

  // 1. Academic Years
  const { data: yearsData, isLoading: yearsLoading } = useAcademicYears({ limit: 50 })
  const academicYears = useMemo(() => {
    const list = toListArray<any>(yearsData)
    return list
  }, [yearsData])

  // Current academic year default
  const currentAcademicYear = useMemo(() => {
    return academicYears.find((y: any) => y.status === 'CURRENT' || y.isCurrent)
  }, [academicYears])

  // 2. Classes & Sections
  const { data: classesData, isLoading: classesLoading } = useClasses({ limit: 100 })
  const classes = useMemo(() => toListArray<any>(classesData), [classesData])

  const { data: sectionsData, isLoading: sectionsLoading } = useSections({
    classId: selectedClassId,
    requireClassId: false,
  })
  const sections = useMemo(() => toListArray<any>(sectionsData), [sectionsData])

  // 3. Students
  const { data: studentsData, isLoading: studentsLoading } = useStudents({
    academicYearId: selectedAcademicYear || undefined,
    classId: selectedClassId || undefined,
    sectionId: selectedSectionId || undefined,
    status: 'ACTIVE',
  })

  const students = useMemo(() => {
    const raw = studentsData?.data
    let list: any[] = []
    if (raw && Array.isArray((raw as any).items)) {
      list = [...(raw as any).items]
    } else if (Array.isArray(raw)) {
      list = [...raw]
    }
    if (initialStudentId && !list.some((s) => s.id === initialStudentId)) {
      list.unshift({
        id: initialStudentId,
        firstName: initialStudentName || 'Selected Student',
        lastName: '',
      })
    }
    return list
  }, [studentsData, initialStudentId, initialStudentName])

  // Calculate default BS dates
  const { defaultIssueDate, defaultDueDate } = useMemo(() => {
    try {
      const todayBs = formatBsDate(getTodayBsDate())
      const adDate = new Date(bsIsoToAdIso(todayBs))
      adDate.setDate(adDate.getDate() + 14)
      const dueBs = adIsoToBsIso(adDate.toISOString().slice(0, 10))
      return { defaultIssueDate: todayBs, defaultDueDate: dueBs }
    } catch {
      return { defaultIssueDate: '2081-01-01', defaultDueDate: '2081-01-15' }
    }
  }, [])

  // Set default initial values when opened
  useEffect(() => {
    if (open) {
      const defaultBillingPeriod = formatBsMonthYear(defaultIssueDate)
      lastAutoBillingPeriod.current = defaultBillingPeriod
      form.setFieldsValue({
        academicYearId:
          initialAcademicYearId || currentAcademicYear?.id || (academicYears[0]?.id ?? undefined),
        studentId: initialStudentId,
        issueDateBS: defaultIssueDate,
        dueDateBS: defaultDueDate,
        billingPeriod: defaultBillingPeriod,
      })
    }
  }, [
    open,
    initialAcademicYearId,
    initialStudentId,
    currentAcademicYear,
    academicYears,
    defaultIssueDate,
    defaultDueDate,
    form,
  ])

  // Keep the billing period in sync with the issue date until the user edits it manually
  useEffect(() => {
    if (!open || !selectedIssueDate) return
    const generated = formatBsMonthYear(selectedIssueDate)
    const current = form.getFieldValue('billingPeriod') as string | undefined
    if (!current || current === lastAutoBillingPeriod.current) {
      lastAutoBillingPeriod.current = generated
      form.setFieldValue('billingPeriod', generated)
    }
  }, [selectedIssueDate, open, form])

  // Cascade reset
  useEffect(() => {
    if (prevYear.current !== undefined && prevYear.current !== selectedAcademicYear) {
      form.setFieldsValue({
        classId: undefined,
        sectionId: undefined,
        studentId: initialStudentId,
      })
    }
    prevYear.current = selectedAcademicYear
  }, [selectedAcademicYear, initialStudentId, form])

  useEffect(() => {
    if (prevClass.current !== undefined && prevClass.current !== selectedClassId) {
      form.setFieldsValue({ sectionId: undefined, studentId: initialStudentId })
    }
    prevClass.current = selectedClassId
  }, [selectedClassId, initialStudentId, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setIsSubmitting(true)

      const payload = {
        studentId: values.studentId,
        academicYearId: values.academicYearId,
        billingPeriod: values.billingPeriod.trim(),
        issueDateBS: values.issueDateBS,
        dueDateBS: values.dueDateBS,
        notes: values.notes?.trim() || undefined,
      }

      const created = await createInvoice(payload)
      toast.success(`Invoice ${created.invoiceNumber || 'created'} generated successfully!`)
      form.resetFields()
      onSuccess?.(created)
      onClose()
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Failed to create invoice. Please check the requirements and try again.'
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      size={DRAWER.widthLg}
      destroyOnHidden
      title={
        <Space align="center">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: colors.primaryLight,
              color: colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FilePlus size={18} />
          </div>
          <div>
            <span style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>
              Generate Student Invoice
            </span>
            <div style={{ fontSize: 12, fontWeight: 400, color: colors.muted }}>
              Issue a new fee invoice based on the approved fee structure
            </div>
          </div>
        </Space>
      }
      extra={
        <Space>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="primary"
            icon={<FilePlus size={15} />}
            loading={isSubmitting}
            onClick={handleSubmit}
            style={{
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            }}
          >
            Generate Invoice
          </Button>
        </Space>
      }
      styles={{ body: { padding: '20px 24px' } }}
    >
      <Alert
        type="info"
        showIcon
        icon={<Info size={16} />}
        message="Invoice fee line items and totals are calculated automatically based on the student's enrolled class fee structure, discounts, and active program assignments."
        style={{ marginBottom: 20 }}
      />

      <Form form={form} layout="vertical" requiredMark="optional">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="academicYearId"
                label={
                  <Space size={4}>
                    <Calendar size={14} color={colors.muted} />
                    <span>Academic Year</span>
                  </Space>
                }
                rules={[{ required: true, message: 'Please select an academic year' }]}
              >
                <Select
                  placeholder="Select Academic Year"
                  loading={yearsLoading}
                  options={academicYears.map((y: any) => ({
                    label: `${y.name} ${y.status === 'CURRENT' ? '(Current)' : ''}`,
                    value: y.id,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={6}>
              <Form.Item
                name="classId"
                label={
                  <Space size={4}>
                    <BookOpen size={14} color={colors.muted} />
                    <span>Filter Class</span>
                  </Space>
                }
              >
                <Select
                  placeholder="All classes"
                  allowClear
                  loading={classesLoading}
                  options={classes.map((c: any) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={6}>
              <Form.Item
                name="sectionId"
                label={
                  <Space size={4}>
                    <Layers size={14} color={colors.muted} />
                    <span>Filter Section</span>
                  </Space>
                }
              >
                <Select
                  placeholder="All sections"
                  allowClear
                  disabled={!selectedClassId}
                  loading={sectionsLoading}
                  options={sections.map((s: any) => ({
                    label: s.name,
                    value: s.id,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="studentId"
            label={
              <Space size={4}>
                <User size={14} color={colors.muted} />
                <span>Student</span>
              </Space>
            }
            rules={[{ required: true, message: 'Please select a student' }]}
            help={
              students.length === 0 && !studentsLoading
                ? 'No active students found with current filters.'
                : undefined
            }
          >
            <Select
              placeholder="Search or select student..."
              showSearch
              loading={studentsLoading}
              filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
              options={students.map((s: any) => {
                const roll = s.rollNumber ? ` • Roll: ${s.rollNumber}` : ''
                const adm = s.admissionNumber ? ` • Adm: ${s.admissionNumber}` : ''
                const cls = s.currentClass?.name ? ` (${s.currentClass.name})` : ''
                return {
                  label: `${s.firstName} ${s.lastName}${cls}${roll}${adm}`,
                  value: s.id,
                }
              })}
            />
          </Form.Item>

          <Divider style={{ margin: '16px 0' }} />

          <Form.Item
            name="billingPeriod"
            label={
              <Space size={4}>
                <span>Billing Month</span>
                <Tooltip title="Auto-filled from the issue date (e.g. Shrawan 2081) and used to label the invoice and prevent duplicate invoices for the same student and academic year. You can edit it. It does not change the fee amounts.">
                  <Info
                    size={14}
                    color={colors.muted}
                    style={{ cursor: 'help' }}
                    aria-label="Billing month information"
                  />
                </Tooltip>
              </Space>
            }
            rules={[
              { required: true, message: 'Please specify the billing month' },
              { max: 100, message: 'Billing month is too long' },
            ]}
          >
            <Input placeholder="e.g. Shrawan 2081" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="issueDateBS"
                label="Issue Date (BS)"
                rules={[
                  { required: true, message: 'Please select an issue date' },
                  { pattern: /^\d{4}-\d{2}-\d{2}$/, message: 'Date must be YYYY-MM-DD' },
                ]}
              >
                <NepaliDatePicker placeholder="YYYY-MM-DD" showAdEquivalent />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="dueDateBS"
                label="Due Date (BS)"
                rules={[
                  { required: true, message: 'Please select a due date' },
                  { pattern: /^\d{4}-\d{2}-\d{2}$/, message: 'Date must be YYYY-MM-DD' },
                ]}
              >
                <NepaliDatePicker placeholder="YYYY-MM-DD" showAdEquivalent />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Invoice Notes (Optional)"
            rules={[{ max: 500, message: 'Notes cannot exceed 500 characters' }]}
          >
            <TextArea
              rows={3}
              placeholder="e.g. First term installment, includes lab and library fees..."
              maxLength={500}
              showCount
            />
          </Form.Item>
      </Form>
    </Drawer>
  )
}
