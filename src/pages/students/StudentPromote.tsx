import { useState, useMemo } from 'react'
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Empty,
  Form,
  InputNumber,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { colors, radius, shadow } from '../../lib/designTokens'
import { StepBar } from '../../components/common/StepBar'
import { StatCard } from '../../components/common/StatCard'
import { appConfirm } from '../../components/common/AppConfirm'

const { Title, Text } = Typography

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentEnrollment {
  academicYearId: string
  academicYearName: string
  classId: string
  className: string
  sectionId: string
  sectionName: string
  rollNumber: number | null
}

interface Student {
  id: string
  admissionNo: string
  fullName: string
  photo: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED'
  enrollment: StudentEnrollment | null
}

interface PromoteConfig {
  targetAcademicYearId: string
  targetClassId: string
  targetSectionId: string
  resetRollNumbers: boolean
}

interface PromotionResult {
  studentId: string
  fullName: string
  admissionNo: string
  success: boolean
  reason?: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_STUDENTS: Student[] = [
  { id: 'stu-1', admissionNo: 'ADM-2081-001', fullName: 'Aarav Sharma', photo: null, status: 'ACTIVE', enrollment: { academicYearId: 'yr-1', academicYearName: '2081/82', classId: 'cls-5', className: 'Class 5', sectionId: 'sec-a', sectionName: 'A', rollNumber: 1 } },
  { id: 'stu-2', admissionNo: 'ADM-2081-002', fullName: 'Priya Thapa', photo: null, status: 'ACTIVE', enrollment: { academicYearId: 'yr-1', academicYearName: '2081/82', classId: 'cls-5', className: 'Class 5', sectionId: 'sec-a', sectionName: 'A', rollNumber: 2 } },
  { id: 'stu-5', admissionNo: 'ADM-2081-004', fullName: 'Bikash Gurung', photo: null, status: 'ACTIVE', enrollment: { academicYearId: 'yr-1', academicYearName: '2081/82', classId: 'cls-5', className: 'Class 5', sectionId: 'sec-b', sectionName: 'B', rollNumber: 3 } },
  { id: 'stu-3', admissionNo: 'ADM-2081-003', fullName: 'Rohan Adhikari', photo: null, status: 'ACTIVE', enrollment: { academicYearId: 'yr-1', academicYearName: '2081/82', classId: 'cls-6', className: 'Class 6', sectionId: 'sec-b', sectionName: 'B', rollNumber: 5 } },
  { id: 'stu-6', admissionNo: 'ADM-2081-005', fullName: 'Anita Karki', photo: null, status: 'ACTIVE', enrollment: { academicYearId: 'yr-1', academicYearName: '2081/82', classId: 'cls-6', className: 'Class 6', sectionId: 'sec-a', sectionName: 'A', rollNumber: 1 } },
  { id: 'stu-7', admissionNo: 'ADM-2081-006', fullName: 'Dipesh Bhandari', photo: null, status: 'ACTIVE', enrollment: { academicYearId: 'yr-1', academicYearName: '2081/82', classId: 'cls-6', className: 'Class 6', sectionId: 'sec-a', sectionName: 'A', rollNumber: 2 } },
  { id: 'stu-4', admissionNo: 'ADM-2080-015', fullName: 'Sita Rai', photo: null, status: 'INACTIVE', enrollment: null },
]

const MOCK_ACADEMIC_YEARS = [
  { label: '2081/82 (Current)', value: 'yr-1' },
  { label: '2082/83 (Next)', value: 'yr-2' },
]

const MOCK_CLASSES = [
  { label: 'Class 1',  value: 'cls-1' },
  { label: 'Class 2',  value: 'cls-2' },
  { label: 'Class 3',  value: 'cls-3' },
  { label: 'Class 4',  value: 'cls-4' },
  { label: 'Class 5',  value: 'cls-5' },
  { label: 'Class 6',  value: 'cls-6' },
  { label: 'Class 7',  value: 'cls-7' },
  { label: 'Class 8',  value: 'cls-8' },
  { label: 'Class 9',  value: 'cls-9' },
  { label: 'Class 10', value: 'cls-10' },
]

const MOCK_SECTIONS = [
  { label: 'Section A', value: 'sec-a' },
  { label: 'Section B', value: 'sec-b' },
  { label: 'Section C', value: 'sec-c' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

const STEPS = ['Select Students', 'Promotion Target', 'Review & Confirm']

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function StudentPromote() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form] = Form.useForm<PromoteConfig>()

  // ── Step 1 state ─────────────────────────────────────────────────────────
  const [filterClass, setFilterClass] = useState<string | undefined>()
  const [filterSection, setFilterSection] = useState<string | undefined>()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // ── Step 3 state ─────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<PromotionResult[] | null>(null)

  // ── Derived ───────────────────────────────────────────────────────────────
  const eligibleStudents = useMemo(
    () => MOCK_STUDENTS.filter((s) => s.status === 'ACTIVE' && s.enrollment !== null),
    [],
  )

  const filteredStudents = useMemo(() => {
    return eligibleStudents.filter((s) => {
      if (filterClass && s.enrollment?.classId !== filterClass) return false
      if (filterSection && s.enrollment?.sectionId !== filterSection) return false
      return true
    })
  }, [eligibleStudents, filterClass, filterSection])

  const selectedStudents = useMemo(
    () => eligibleStudents.filter((s) => selectedIds.includes(s.id)),
    [eligibleStudents, selectedIds],
  )

  const classOptions = useMemo(() => {
    const ids = [...new Set(eligibleStudents.map((s) => s.enrollment!.classId))]
    return MOCK_CLASSES.filter((c) => ids.includes(c.value))
  }, [eligibleStudents])

  const sectionOptions = useMemo(() => {
    const ids = [...new Set(eligibleStudents.map((s) => s.enrollment!.sectionId))]
    return MOCK_SECTIONS.filter((s) => ids.includes(s.value))
  }, [eligibleStudents])

  // ── Navigation ────────────────────────────────────────────────────────────

  const goNext = async () => {
    if (step === 0) {
      if (selectedIds.length === 0) {
        toast.error('Please select at least one student to promote.')
        return
      }
      setStep(1)
      return
    }

    if (step === 1) {
      try {
        await form.validateFields()
        setStep(2)
      } catch {
        toast.error('Please fill in all required fields.')
      }
      return
    }
  }

  const goBack = () => setStep((s) => Math.max(0, s - 1))

  const handleSubmit = () => {
    const values = form.getFieldsValue()
    const targetYear = MOCK_ACADEMIC_YEARS.find((y) => y.value === values.targetAcademicYearId)?.label ?? '—'
    const targetClass = MOCK_CLASSES.find((c) => c.value === values.targetClassId)?.label ?? '—'
    const targetSection = MOCK_SECTIONS.find((s) => s.value === values.targetSectionId)?.label ?? '—'

    appConfirm({
      title: `Promote ${selectedStudents.length} student${selectedStudents.length !== 1 ? 's' : ''}?`,
      content: `They will be enrolled in ${targetClass} – ${targetSection} for ${targetYear}. This cannot be undone.`,
      okText: 'Yes, Promote',
      okColor: 'primary',
      cancelText: 'Cancel',
      onOk: () => runPromotion(),
    })
  }

  const runPromotion = async () => {
    setSubmitting(true)
    // Simulate API call — replace with real mutation
    await new Promise((r) => setTimeout(r, 1200))
    const mockResults: PromotionResult[] = selectedStudents.map((s, i) => ({
      studentId: s.id,
      fullName: s.fullName,
      admissionNo: s.admissionNo,
      // Simulate one failure for demo realism
      success: i !== 99,
    }))
    setResults(mockResults)
    setSubmitting(false)

    const passed = mockResults.filter((r) => r.success).length
    const failed = mockResults.length - passed
    if (failed === 0) {
      toast.success(`${passed} student${passed !== 1 ? 's' : ''} promoted successfully.`)
    } else {
      toast.warning(`${passed} promoted, ${failed} failed. Review the results below.`)
    }
  }

  // ── Column defs ───────────────────────────────────────────────────────────

  const selectColumns: ColumnsType<Student> = [
    {
      title: () => (
        <Checkbox
          checked={filteredStudents.length > 0 && filteredStudents.every((s) => selectedIds.includes(s.id))}
          indeterminate={
            filteredStudents.some((s) => selectedIds.includes(s.id)) &&
            !filteredStudents.every((s) => selectedIds.includes(s.id))
          }
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds((prev) => [...new Set([...prev, ...filteredStudents.map((s) => s.id)])])
            } else {
              const filteredIds = new Set(filteredStudents.map((s) => s.id))
              setSelectedIds((prev) => prev.filter((id) => !filteredIds.has(id)))
            }
          }}
        />
      ),
      key: 'select',
      width: 48,
      render: (_: unknown, s: Student) => (
        <Checkbox
          checked={selectedIds.includes(s.id)}
          onChange={(e) => {
            setSelectedIds((prev) =>
              e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id),
            )
          }}
        />
      ),
    },
    {
      title: 'Student',
      key: 'student',
      render: (_: unknown, s: Student) => (
        <Space>
          <Avatar
            size={32}
            src={s.photo ?? undefined}
            style={{ background: colors.primaryLight, color: colors.primary, fontWeight: 700, fontSize: 11 }}
          >
            {initials(s.fullName)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{s.fullName}</div>
            <div style={{ fontSize: 11, color: colors.muted, fontFamily: 'monospace' }}>{s.admissionNo}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Class',
      key: 'class',
      render: (_: unknown, s: Student) => s.enrollment?.className ?? '—',
    },
    {
      title: 'Section',
      key: 'section',
      width: 90,
      render: (_: unknown, s: Student) => s.enrollment?.sectionName ?? '—',
    },
    {
      title: 'Roll No.',
      key: 'rollNo',
      width: 90,
      render: (_: unknown, s: Student) => (
        <span style={{ fontFamily: 'monospace' }}>{s.enrollment?.rollNumber ?? '—'}</span>
      ),
    },
    {
      title: 'Academic Year',
      key: 'year',
      render: (_: unknown, s: Student) => s.enrollment?.academicYearName ?? '—',
    },
  ]

  const resultColumns: ColumnsType<PromotionResult> = [
    {
      title: 'Student',
      key: 'student',
      render: (_: unknown, r: PromotionResult) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{r.fullName}</div>
          <div style={{ fontSize: 11, color: colors.muted, fontFamily: 'monospace' }}>{r.admissionNo}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      render: (_: unknown, r: PromotionResult) =>
        r.success ? (
          <Tag icon={<CheckCircleOutlined />} color="success">Promoted</Tag>
        ) : (
          <Tooltip title={r.reason ?? 'Promotion failed'}>
            <Tag icon={<CloseCircleOutlined />} color="error">Failed</Tag>
          </Tooltip>
        ),
    },
    {
      title: 'Reason',
      key: 'reason',
      render: (_: unknown, r: PromotionResult) =>
        r.success ? (
          <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
        ) : (
          <Text type="danger" style={{ fontSize: 12 }}>{r.reason ?? 'Unknown error'}</Text>
        ),
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  const values = form.getFieldsValue()
  const targetYear = MOCK_ACADEMIC_YEARS.find((y) => y.value === values.targetAcademicYearId)?.label
  const targetClass = MOCK_CLASSES.find((c) => c.value === values.targetClassId)?.label
  const targetSection = MOCK_SECTIONS.find((s) => s.value === values.targetSectionId)?.label

  const isDone = results !== null
  const passedCount = results?.filter((r) => r.success).length ?? 0
  const failedCount = (results?.length ?? 0) - passedCount

  return (
    <div style={{ padding: 24 }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0, color: colors.text }}>Promote Students</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Bulk-promote active students to a new academic year, class, and section.
          </Text>
        </div>
        <Button onClick={() => navigate('/students')}>Back to Students</Button>
      </div>

      {/* KPI row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: 'Eligible Students', value: eligibleStudents.length, color: colors.primary, bg: colors.primaryLight, icon: <TeamOutlined /> },
          { label: 'Selected', value: selectedIds.length, color: colors.info, bg: colors.infoLight, icon: <CheckCircleOutlined /> },
          ...(isDone
            ? [
                { label: 'Promoted', value: passedCount, color: colors.success, bg: colors.successLight, icon: <ArrowRightOutlined /> },
                { label: 'Failed', value: failedCount, color: colors.error, bg: colors.errorLight, icon: <WarningOutlined /> },
              ]
            : []),
        ].map((kpi) => (
          <Col key={kpi.label} xs={12} sm={8} md={6}>
            <StatCard variant="default" size="middle" label={kpi.label} value={kpi.value} icon={kpi.icon} color={kpi.color} iconBg={kpi.bg} />
          </Col>
        ))}
      </Row>

      {/* Step bar */}
      <StepBar
        steps={STEPS.map((title) => ({ title }))}
        current={step}
        onChange={(i) => { if (!isDone) setStep(i) }}
      />

      {/* ── Step 0: Select Students ───────────────────────────────────────── */}
      {step === 0 && (
        <Card
          style={{ borderRadius: radius.lg, boxShadow: shadow.card, borderColor: colors.border }}
          styles={{ body: { padding: 0 } }}
        >
          {/* Filter bar */}
          <div style={{
            display: 'flex', gap: 12, padding: '16px 20px',
            borderBottom: `1px solid ${colors.border}`, flexWrap: 'wrap', alignItems: 'center',
          }}>
            <FilterOutlined style={{ color: colors.muted }} />
            <Select
              allowClear
              placeholder="Filter by class"
              style={{ width: 160 }}
              options={classOptions}
              value={filterClass}
              onChange={(v) => { setFilterClass(v); setFilterSection(undefined) }}
            />
            <Select
              allowClear
              placeholder="Filter by section"
              style={{ width: 160 }}
              options={sectionOptions}
              value={filterSection}
              onChange={setFilterSection}
            />
            {selectedIds.length > 0 && (
              <Badge count={selectedIds.length} color={colors.primary}>
                <Tag
                  closable
                  onClose={() => setSelectedIds([])}
                  style={{ cursor: 'default', fontWeight: 500, margin: 0 }}
                >
                  {selectedIds.length} selected
                </Tag>
              </Badge>
            )}
          </div>

          <Table<Student>
            rowKey="id"
            columns={selectColumns}
            dataSource={filteredStudents}
            size="middle"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            locale={{ emptyText: <Empty description="No eligible students found." /> }}
            onRow={(s) => ({
              style: { cursor: 'pointer', background: selectedIds.includes(s.id) ? colors.primaryLight : undefined },
              onClick: () =>
                setSelectedIds((prev) =>
                  prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id],
                ),
            })}
          />
        </Card>
      )}

      {/* ── Step 1: Promotion Target ──────────────────────────────────────── */}
      {step === 1 && (
        <Card
          title={<Text strong>Set Promotion Target</Text>}
          style={{ borderRadius: radius.lg, boxShadow: shadow.card, borderColor: colors.border, maxWidth: 680 }}
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
            message={`${selectedStudents.length} student${selectedStudents.length !== 1 ? 's' : ''} will be promoted to the target year, class, and section.`}
          />

          <Form form={form} layout="vertical" requiredMark={false}>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="targetAcademicYearId"
                  label="Target Academic Year"
                  rules={[{ required: true, message: 'Please select an academic year.' }]}
                >
                  <Select placeholder="Select academic year" options={MOCK_ACADEMIC_YEARS} size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="targetClassId"
                  label="Target Class"
                  rules={[{ required: true, message: 'Please select a class.' }]}
                >
                  <Select placeholder="Select class" options={MOCK_CLASSES} size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="targetSectionId"
                  label="Target Section"
                  rules={[{ required: true, message: 'Please select a section.' }]}
                >
                  <Select placeholder="Select section" options={MOCK_SECTIONS} size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="startingRollNumber" label="Starting Roll Number (optional)">
                  <InputNumber min={1} style={{ width: '100%' }} size="large" placeholder="e.g. 1" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="resetRollNumbers" valuePropName="checked" label=" ">
                  <Checkbox style={{ paddingTop: 6 }}>
                    Auto-assign roll numbers sequentially
                  </Checkbox>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      )}

      {/* ── Step 2: Review & Confirm (before submit) ──────────────────────── */}
      {step === 2 && !isDone && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Target summary */}
          <Card
            title={<Text strong>Promotion Summary</Text>}
            style={{ borderRadius: radius.lg, boxShadow: shadow.card, borderColor: colors.border }}
          >
            <Descriptions bordered size="small" column={3}>
              <Descriptions.Item label="Academic Year">{targetYear ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Class">{targetClass ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Section">{targetSection ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Students to Promote" span={3}>
                <Text strong style={{ color: colors.primary }}>{selectedStudents.length}</Text>
              </Descriptions.Item>
            </Descriptions>

            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              style={{ marginTop: 16 }}
              message="Once confirmed, each selected student will receive a new enrollment record for the target year. Existing enrollments remain unchanged."
            />
          </Card>

          {/* Students preview */}
          <Card
            title={<Text strong>Students to be Promoted ({selectedStudents.length})</Text>}
            style={{ borderRadius: radius.lg, boxShadow: shadow.card, borderColor: colors.border }}
            styles={{ body: { padding: 0 } }}
          >
            <Table<Student>
              rowKey="id"
              columns={selectColumns.slice(1)} // drop checkbox col in review
              dataSource={selectedStudents}
              size="small"
              pagination={false}
              scroll={{ y: 320 }}
              locale={{ emptyText: <Empty description="No students selected." /> }}
            />
          </Card>
        </div>
      )}

      {/* ── Step 2: Results (after submit) ───────────────────────────────── */}
      {step === 2 && isDone && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {failedCount === 0 ? (
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              message={`All ${passedCount} student${passedCount !== 1 ? 's' : ''} promoted successfully to ${targetClass} – ${targetSection} (${targetYear}).`}
            />
          ) : (
            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              message={`${passedCount} promoted successfully. ${failedCount} failed — review the table below.`}
            />
          )}

          <Card
            title={<Text strong>Promotion Results</Text>}
            style={{ borderRadius: radius.lg, boxShadow: shadow.card, borderColor: colors.border }}
            styles={{ body: { padding: 0 } }}
          >
            <Table<PromotionResult>
              rowKey="studentId"
              columns={resultColumns}
              dataSource={results ?? []}
              size="small"
              pagination={false}
            />
          </Card>

          <div style={{ display: 'flex', gap: 12 }}>
            <Button type="primary" style={{ background: colors.primary }} onClick={() => navigate('/students')}>
              Back to Students
            </Button>
            <Button
              onClick={() => {
                setResults(null)
                setSelectedIds([])
                setStep(0)
                form.resetFields()
                setFilterClass(undefined)
                setFilterSection(undefined)
              }}
            >
              Start New Promotion
            </Button>
          </div>
        </div>
      )}

      {/* ── Footer navigation ─────────────────────────────────────────────── */}
      {!isDone && (
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 12,
          marginTop: 24, paddingTop: 20, borderTop: `1px solid ${colors.border}`,
        }}>
          {step > 0 && <Button onClick={goBack}>Back</Button>}
          {step < STEPS.length - 1 && (
            <Button type="primary" style={{ background: colors.primary }} onClick={goNext}>
              {step === 0 ? `Next — ${selectedIds.length} selected` : 'Review'}
            </Button>
          )}
          {step === STEPS.length - 1 && (
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              style={{ background: colors.primary }}
              loading={submitting}
              onClick={handleSubmit}
            >
              Confirm &amp; Promote
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
