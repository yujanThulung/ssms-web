import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  AutoComplete,
  Avatar,
  Button,
  Col,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import {
  BookOutlined,
  IdcardOutlined,
  SaveOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { toast } from 'sonner'

import { colors, DRAWER, radius } from '../../../lib/designTokens'
import { useStudents } from '../../../features/students'
import { useFeeCategories } from '../../../features/fee-categories'
import { useAcademicYears } from '../../../features/academic-years'
import { useClasses } from '../../../features/classes'
import { useSections } from '../../../features/sections'
import type { SchoolClass } from '../../../features/classes'
import type { Section } from '../../../features/sections'
import {
  ADDITIONAL_FEE_REASON_LABEL,
  useCreateAdditionalFee,
  useUpdateAdditionalFee,
} from './additionalFeesData'
import type { AdditionalFeeRow } from './additionalFeesData'

const { Text, Title } = Typography

const REASON_PRESETS = [
  ...Object.entries(ADDITIONAL_FEE_REASON_LABEL).map(([_, label]) => ({
    value: label,
    label,
  })),
  { value: 'Lost ID card replacement', label: 'Lost ID card replacement' },
  { value: 'Late Fee / Payment Delay', label: 'Late Fee / Payment Delay' },
  { value: 'Property Damage / Equipment Loss', label: 'Property Damage / Equipment Loss' },
  { value: 'Transport / Route Change', label: 'Transport / Route Change' },
  { value: 'Library Fine / Book Replacement', label: 'Library Fine / Book Replacement' },
  { value: 'Excursion / Field Trip Fee', label: 'Excursion / Field Trip Fee' },
  { value: 'Certificate / Transcript Fee', label: 'Certificate / Transcript Fee' },
  { value: 'Re-examination / Special Exam Fee', label: 'Re-examination / Special Exam Fee' },
  { value: 'Uniform / Badge Replacement', label: 'Uniform / Badge Replacement' },
  { value: 'Sports Equipment Fee', label: 'Sports Equipment Fee' },
  { value: 'Laboratory Material Damage', label: 'Laboratory Material Damage' },
  { value: 'Other', label: 'Other' },
]

interface FormValues {
  studentId: string
  feeCategoryId: string
  academicYearId: string
  amount: number
  reason: string
  note: string
}

export interface AdditionalFeeDrawerProps {
  record?: AdditionalFeeRow | null
  onClose: () => void
  onDone: () => void
}

function extractList<T>(res: unknown): T[] {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (typeof res === 'object') {
    const obj = res as Record<string, unknown>
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (obj.data && typeof obj.data === 'object') {
      const nested = obj.data as Record<string, unknown>
      if (Array.isArray(nested.items)) return nested.items as T[]
      if (Array.isArray(nested.data)) return nested.data as T[]
    }
  }
  return []
}

interface StudentSummaryCardProps {
  student: {
    id: string
    firstName?: string
    lastName?: string
    admissionNumber?: string
    className?: string
    sectionName?: string
    gender?: string
    photoUrl?: string | null
    enrollment?: {
      class?: { name?: string }
      section?: { name?: string }
      academicYear?: { name?: string }
    } | null
    currentEnrollment?: {
      class?: { name?: string }
      section?: { name?: string }
      academicYear?: { name?: string }
    } | null
  }
}

function StudentSummaryCard({ student }: StudentSummaryCardProps) {
  const enrollment = student.currentEnrollment ?? student.enrollment
  const fullName = [student.firstName, student.lastName].filter(Boolean).join(' ')
  const cls = enrollment?.class?.name ?? '—'
  const section = enrollment?.section?.name ?? '—'
  const year = enrollment?.academicYear?.name ?? '—'

  const initials = [student.firstName?.[0], student.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase()

  return (
    <div
      style={{
        background: colors.primaryLight,
        border: `1px solid ${colors.primaryBorder}`,
        borderRadius: radius.lg,
        padding: '14px 16px',
        marginBottom: 20,
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}
    >
      <Avatar
        size={54}
        src={student.photoUrl ?? undefined}
        style={{
          background: colors.primary,
          fontSize: 20,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {initials || <UserOutlined />}
      </Avatar>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Title level={5} style={{ margin: 0, color: colors.text, fontSize: 15 }}>
          {fullName || '—'}
        </Title>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          <Tag
            icon={<IdcardOutlined />}
            style={{
              background: colors.surface,
              border: `1px solid ${colors.primaryBorder}`,
              color: colors.text,
              borderRadius: radius.sm,
            }}
          >
            {student.admissionNumber ?? '—'}
          </Tag>
          <Tag
            icon={<BookOutlined />}
            style={{
              background: colors.surface,
              border: `1px solid ${colors.primaryBorder}`,
              color: colors.text,
              borderRadius: radius.sm,
            }}
          >
            {cls} · {section}
          </Tag>
          <Tag
            icon={<TeamOutlined />}
            style={{
              background: colors.surface,
              border: `1px solid ${colors.primaryBorder}`,
              color: colors.text,
              borderRadius: radius.sm,
            }}
          >
            {year}
          </Tag>
        </div>
      </div>
    </div>
  )
}

export function AdditionalFeeDrawer({ record, onClose, onDone }: AdditionalFeeDrawerProps) {
  const [form] = Form.useForm<FormValues>()

  // Filter state for student selection
  const [filterYearId, setFilterYearId] = useState<string | undefined>()
  const [filterClassId, setFilterClassId] = useState<string | undefined>()
  const [filterSectionId, setFilterSectionId] = useState<string | undefined>()
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>()

  const { data: yearsData, isLoading: isLoadingYears } = useAcademicYears()
  const { data: classesData, isLoading: isLoadingClasses } = useClasses({
    academicYearId: filterYearId,
    requireAcademicYear: true,
  })
  const { data: sectionsData, isLoading: isLoadingSections } = useSections({
    classId: filterClassId,
    requireClassId: true,
  })

  // Only fetch students when we have at least one filter active
  const hasFilter = Boolean(filterYearId || filterClassId || filterSectionId)
  const { data: studentsData, isLoading: isLoadingStudents } = useStudents({
    academicYearId: filterYearId,
    classId: filterClassId,
    sectionId: filterSectionId,
    isEnrolled: true,
  })

  const { data: categoriesData, isLoading: isLoadingCategories } = useFeeCategories()

  const createFeeMutation = useCreateAdditionalFee()
  const updateFeeMutation = useUpdateAdditionalFee()
  const isPending = createFeeMutation.isPending || updateFeeMutation.isPending

  const yearOptions = useMemo(() => {
    const list = extractList<{ id: string; name: string; status?: string }>(yearsData)
    return list.map((y) => ({
      value: y.id,
      label: y.status === 'CURRENT' ? `${y.name} (Current)` : y.name,
    }))
  }, [yearsData])

  const classOptions = useMemo(() => {
    const list = extractList<SchoolClass>(classesData)
    return list.map((c) => ({ value: c.id, label: c.name }))
  }, [classesData])

  const sectionOptions = useMemo(() => {
    const list = extractList<Section>(sectionsData)
    return list.map((s) => ({ value: s.id, label: s.name }))
  }, [sectionsData])

  const studentList = useMemo(
    () => extractList<Record<string, unknown>>(studentsData),
    [studentsData],
  )

  const studentOptions = useMemo(
    () =>
      studentList.map((s) => ({
        value: s.id as string,
        label: `${s.firstName ?? ''} ${s.lastName ?? ''} (${s.admissionNumber ?? ''})`.trim(),
      })),
    [studentList],
  )

  const selectedStudent = useMemo(
    () => studentList.find((s) => s.id === selectedStudentId) ?? null,
    [studentList, selectedStudentId],
  )

  const categoryOptions = useMemo(() => {
    const list = extractList<{ id: string; name: string; frequency: string }>(categoriesData)
    return list.map((c) => ({
      value: c.id,
      label: `${c.name} (${(c.frequency || '').replace('_', ' ')})`,
    }))
  }, [categoriesData])

  // Set default current academic year on mount
  useEffect(() => {
    if (!record && yearOptions.length > 0 && !filterYearId) {
      const currentYear = yearOptions.find((y) => y.label.includes('(Current)'))
      const defaultYearId = currentYear?.value ?? yearOptions[0]?.value
      if (defaultYearId) {
        setFilterYearId(defaultYearId)
        form.setFieldValue('academicYearId', defaultYearId)
      }
    }
  }, [yearOptions, record, filterYearId, form])

  // Fill form when editing
  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        studentId: record.studentId,
        feeCategoryId: record.categoryId,
        academicYearId: record.academicYearId,
        amount: record.amount,
        reason: record.reason,
        note: record.note ?? '',
      })
      setSelectedStudentId(record.studentId)
    }
  }, [form, record])

  const handleStudentChange = (val: string) => {
    setSelectedStudentId(val)
    form.setFieldValue('studentId', val)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (record) {
        await updateFeeMutation.mutateAsync({
          id: record.id,
          payload: {
            amount: String(values.amount),
            reason: values.reason,
            note: values.note ? values.note.trim() : undefined,
          },
        })
        toast.success('Additional fee updated')
      } else {
        await createFeeMutation.mutateAsync({
          studentId: values.studentId,
          feeCategoryId: values.feeCategoryId,
          academicYearId: values.academicYearId,
          amount: String(values.amount),
          reason: values.reason,
          note: values.note ? values.note.trim() : undefined,
        })
        toast.success('Additional fee added')
      }
      onDone()
    } catch (err) {
      if ((err as { errorFields?: unknown })?.errorFields) return
      toast.error((err as Error)?.message ?? 'Could not save the additional fee')
    }
  }

  const isEditing = Boolean(record)

  return (
    <Drawer
      open
      onClose={onClose}
      width={DRAWER.widthLg}
      destroyOnHidden
      title={
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>
            {isEditing ? 'Edit Additional Fee' : 'Add Additional Fee'}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {isEditing
              ? `${record!.studentName} · ${record!.admissionNo}`
              : 'One-off charge on top of a class fee structure'}
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
            {isEditing ? 'Save Changes' : 'Add Fee'}
          </Button>
        </Space>
      }
      styles={{ body: { padding: '20px 24px' } }}
    >
      <Form form={form} layout="vertical">

        {/* ── Student Picker Section ────────────────────────── */}
        {!isEditing && (
          <>
            <div
              style={{
                background: colors.surfaceAlt,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.lg,
                padding: '14px 16px',
                marginBottom: 20,
              }}
            >
              <Text strong style={{ fontSize: 13, color: colors.text, display: 'block', marginBottom: 12 }}>
                <TeamOutlined style={{ marginRight: 6, color: colors.primary }} />
                Filter students by year / class / section
              </Text>
              <Row gutter={[12, 12]}>
                <Col span={8}>
                  <Text style={{ fontSize: 12, color: colors.muted, display: 'block', marginBottom: 4 }}>
                    Academic Year
                  </Text>
                  <Select
                    allowClear
                    placeholder="Select year"
                    style={{ width: '100%' }}
                    options={yearOptions}
                    loading={isLoadingYears}
                    value={filterYearId}
                    onChange={(val) => {
                      setFilterYearId(val)
                      setFilterClassId(undefined)
                      setFilterSectionId(undefined)
                      setSelectedStudentId(undefined)
                      form.setFieldValue('studentId', undefined)
                      form.setFieldValue('academicYearId', val)
                    }}
                  />
                </Col>
                <Col span={8}>
                  <Text style={{ fontSize: 12, color: colors.muted, display: 'block', marginBottom: 4 }}>
                    Class
                  </Text>
                  <Select
                    allowClear
                    placeholder={filterYearId ? 'Select class' : 'Pick year first'}
                    style={{ width: '100%' }}
                    options={classOptions}
                    loading={isLoadingClasses}
                    disabled={!filterYearId}
                    value={filterClassId}
                    onChange={(val) => {
                      setFilterClassId(val)
                      setFilterSectionId(undefined)
                      setSelectedStudentId(undefined)
                      form.setFieldValue('studentId', undefined)
                    }}
                  />
                </Col>
                <Col span={8}>
                  <Text style={{ fontSize: 12, color: colors.muted, display: 'block', marginBottom: 4 }}>
                    Section
                  </Text>
                  <Select
                    allowClear
                    placeholder={filterClassId ? 'Select section' : 'Pick class first'}
                    style={{ width: '100%' }}
                    options={sectionOptions}
                    loading={isLoadingSections}
                    disabled={!filterClassId}
                    value={filterSectionId}
                    onChange={(val) => {
                      setFilterSectionId(val)
                      setSelectedStudentId(undefined)
                      form.setFieldValue('studentId', undefined)
                    }}
                  />
                </Col>
              </Row>
            </div>

            <Form.Item
              name="studentId"
              label={
                <span>
                  Student
                  {hasFilter && studentOptions.length > 0 && (
                    <Tag
                      style={{ marginLeft: 8, fontSize: 11, borderRadius: radius.sm }}
                      color="green"
                    >
                      {studentOptions.length} found
                    </Tag>
                  )}
                </span>
              }
              rules={[{ required: true, message: 'Pick a student' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder={
                  hasFilter
                    ? `Search among ${studentOptions.length} students...`
                    : 'Use filters above, or search directly by name / admission no.'
                }
                options={studentOptions}
                loading={isLoadingStudents}
                notFoundContent={
                  isLoadingStudents ? (
                    <Spin size="small" />
                  ) : hasFilter ? (
                    'No students found for these filters'
                  ) : (
                    'Use the filters above to narrow down students'
                  )
                }
                onChange={handleStudentChange}
                value={selectedStudentId}
              />
            </Form.Item>

            {/* Student summary card */}
            {selectedStudent && (
              <StudentSummaryCard
                student={
                  selectedStudent as Parameters<typeof StudentSummaryCard>[0]['student']
                }
              />
            )}

            <Divider style={{ margin: '4px 0 20px' }} />
          </>
        )}

        {/* Edit mode — show student info from record */}
        {isEditing && record && (
          <div
            style={{
              background: colors.primaryLight,
              border: `1px solid ${colors.primaryBorder}`,
              borderRadius: radius.lg,
              padding: '12px 16px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Avatar
              size={40}
              style={{ background: colors.primary, fontWeight: 700, flexShrink: 0 }}
            >
              {record.studentName?.[0]?.toUpperCase() ?? <UserOutlined />}
            </Avatar>
            <div>
              <Text strong style={{ fontSize: 14, color: colors.text }}>
                {record.studentName}
              </Text>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                <Tag icon={<IdcardOutlined />} style={{ borderRadius: radius.sm }}>
                  {record.admissionNo}
                </Tag>
                <Tag icon={<BookOutlined />} style={{ borderRadius: radius.sm }}>
                  {record.className} · {record.sectionName}
                </Tag>
                <Tag icon={<TeamOutlined />} style={{ borderRadius: radius.sm }}>
                  {record.academicYearName}
                </Tag>
              </div>
            </div>
          </div>
        )}

        {/* ── Fee Details ───────────────────────────────────── */}
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              name="feeCategoryId"
              label="Fee Category"
              rules={[{ required: true, message: 'Pick a fee category' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Pick a fee category"
                options={categoryOptions}
                loading={isLoadingCategories}
                disabled={isEditing}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="academicYearId"
              label="Academic Year"
              rules={[{ required: true, message: 'Pick an academic year' }]}
            >
              <Select
                placeholder="Select academic year"
                options={yearOptions}
                loading={isLoadingYears}
                disabled={isEditing}
              />
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
            <Form.Item
              name="reason"
              label="Reason"
              rules={[{ required: true, message: 'Select or type a reason' }]}
            >
              <AutoComplete
                options={REASON_PRESETS}
                placeholder="Pick a preset or type custom text..."
                filterOption={(inputValue, option) =>
                  String(option?.label ?? '').toLowerCase().includes(inputValue.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="note" label="Note">
          <Input.TextArea
            rows={3}
            maxLength={240}
            showCount
            placeholder="Optional note for the request or audit trail"
          />
        </Form.Item>

        {!isEditing && !hasFilter && (
          <Alert
            type="info"
            showIcon
            style={{ borderRadius: radius.md }}
            message="Tip: Use the Year / Class / Section filters above to narrow down to the right student before applying the fee."
          />
        )}
      </Form>
    </Drawer>
  )
}
