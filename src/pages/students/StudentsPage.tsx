import { useRef, useState } from 'react'
import {
  Avatar, Button, Col, Descriptions, Drawer,
  Form, Input, InputNumber, Row, Select, Space, Tabs, Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined, EyeOutlined, EditOutlined,
  TeamOutlined, UserOutlined, StopOutlined, BookOutlined,
  WalletOutlined, CameraOutlined,
} from '@ant-design/icons'
import { toast } from 'sonner'
import { colors, DRAWER, radius } from '../../lib/designTokens'
import { usePermission } from '../../context/PermissionContext'
import { FEATURES, ACTIONS } from '../../utils/permissions'
import { appConfirm } from '../../components/common/AppConfirm'
import { StatusBadge } from '../../components/common/StatusBadge'
import { AppTable } from '../../components/common/AppTable'
import { SearchAndFilter } from '../../components/common/SearchAndFilter'
import { StatCard } from '../../components/common/StatCard'
import { StepBar } from '../../components/common/StepBar'

const { Title, Text } = Typography

// ─── Types ────────────────────────────────────────────────────────────────────

type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED'
type Gender = 'MALE' | 'FEMALE' | 'OTHER'

interface StudentEnrollment {
  academicYearName: string
  className: string
  sectionName: string
  rollNumber: number | null
}

interface Student {
  id: string
  admissionNo: string
  fullName: string
  dob: string
  gender: Gender
  bloodGroup: string | null
  phone: string | null
  email: string | null
  permanentAddress: string | null
  temporaryAddress: string | null
  photo: string | null
  status: StudentStatus
  admissionDate: string
  createdAt: string
  guardianName: string | null
  guardianPhone: string | null
  fatherName: string | null
  motherName: string | null
  enrollment: StudentEnrollment | null
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_STUDENTS: Student[] = [
  {
    id: 'stu-1', admissionNo: 'ADM-2081-001', fullName: 'Aarav Sharma',
    dob: '2012-04-15', gender: 'MALE', bloodGroup: 'B+',
    phone: '9841000001', email: 'aarav@example.com',
    permanentAddress: 'Kathmandu-10, Bagmati', temporaryAddress: 'Koteshwor, Kathmandu',
    photo: null, status: 'ACTIVE', admissionDate: '2081-04-01', createdAt: '2025-04-01T00:00:00Z',
    guardianName: 'Ram Sharma', guardianPhone: '9800000001',
    fatherName: 'Ram Sharma', motherName: 'Gita Sharma',
    enrollment: { academicYearName: '2081/82', className: 'Class 5', sectionName: 'A', rollNumber: 1 },
  },
  {
    id: 'stu-2', admissionNo: 'ADM-2081-002', fullName: 'Priya Thapa',
    dob: '2013-07-22', gender: 'FEMALE', bloodGroup: 'O+',
    phone: '9841000002', email: null,
    permanentAddress: 'Lalitpur-3, Bagmati', temporaryAddress: null,
    photo: null, status: 'ACTIVE', admissionDate: '2081-04-01', createdAt: '2025-04-01T00:00:00Z',
    guardianName: 'Sita Thapa', guardianPhone: '9800000002',
    fatherName: 'Bishnu Thapa', motherName: 'Sita Thapa',
    enrollment: { academicYearName: '2081/82', className: 'Class 5', sectionName: 'A', rollNumber: 2 },
  },
  {
    id: 'stu-3', admissionNo: 'ADM-2081-003', fullName: 'Rohan Adhikari',
    dob: '2011-11-05', gender: 'MALE', bloodGroup: 'A+',
    phone: '9841000003', email: null,
    permanentAddress: 'Bhaktapur-5, Bagmati', temporaryAddress: 'Bhaktapur',
    photo: null, status: 'ACTIVE', admissionDate: '2081-04-01', createdAt: '2025-04-01T00:00:00Z',
    guardianName: 'Hari Adhikari', guardianPhone: '9800000003',
    fatherName: 'Hari Adhikari', motherName: 'Kamala Adhikari',
    enrollment: { academicYearName: '2081/82', className: 'Class 6', sectionName: 'B', rollNumber: 5 },
  },
  {
    id: 'stu-4', admissionNo: 'ADM-2080-015', fullName: 'Sita Rai',
    dob: '2010-02-18', gender: 'FEMALE', bloodGroup: null,
    phone: null, email: null,
    permanentAddress: 'Pokhara-8, Gandaki', temporaryAddress: null,
    photo: null, status: 'INACTIVE', admissionDate: '2080-04-01', createdAt: '2024-04-01T00:00:00Z',
    guardianName: 'Bina Rai', guardianPhone: '9800000004',
    fatherName: null, motherName: 'Bina Rai',
    enrollment: null,
  },
  {
    id: 'stu-5', admissionNo: 'ADM-2081-004', fullName: 'Bikash Gurung',
    dob: '2012-09-30', gender: 'MALE', bloodGroup: 'AB+',
    phone: '9841000005', email: null,
    permanentAddress: 'Chitwan-4, Bagmati', temporaryAddress: null,
    photo: null, status: 'ACTIVE', admissionDate: '2081-04-01', createdAt: '2025-04-01T00:00:00Z',
    guardianName: 'Dhan Gurung', guardianPhone: '9800000005',
    fatherName: 'Dhan Gurung', motherName: 'Maya Gurung',
    enrollment: { academicYearName: '2081/82', className: 'Class 5', sectionName: 'B', rollNumber: 3 },
  },
  {
    id: 'stu-6', admissionNo: 'ADM-2081-005', fullName: 'Anita Karki',
    dob: '2013-01-12', gender: 'FEMALE', bloodGroup: 'B-',
    phone: '9841000006', email: 'anita@example.com',
    permanentAddress: 'Kathmandu-15, Bagmati', temporaryAddress: 'Kathmandu-15',
    photo: null, status: 'ACTIVE', admissionDate: '2081-04-01', createdAt: '2025-04-01T00:00:00Z',
    guardianName: 'Prem Karki', guardianPhone: '9800000006',
    fatherName: 'Prem Karki', motherName: 'Sarita Karki',
    enrollment: { academicYearName: '2081/82', className: 'Class 6', sectionName: 'A', rollNumber: 1 },
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const { can } = usePermission()
  const canCreate = can(FEATURES.STUDENT, ACTIONS.CREATE)
  const canUpdate = can(FEATURES.STUDENT, ACTIONS.UPDATE)

  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS)
  const [q, setQ] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string | undefined>>({})
  const [viewStudent, setViewStudent] = useState<Student | null>(null)
  const [admissionOpen, setAdmissionOpen] = useState(false)

  const statusFilter = filterValues['status']
  const genderFilter = filterValues['gender']
  const classFilter = filterValues['class']
  const academicYearFilter = filterValues['academicYear']

  const classOptions = [...new Set(students.map((s) => s.enrollment?.className).filter(Boolean))]
    .map((c) => ({ label: c!, value: c! }))
  const yearOptions = [...new Set(students.map((s) => s.enrollment?.academicYearName).filter(Boolean))]
    .map((y) => ({ label: y!, value: y! }))

  const filtered = students.filter((s) => {
    if (statusFilter && s.status !== statusFilter) return false
    if (genderFilter && s.gender !== genderFilter) return false
    if (classFilter && s.enrollment?.className !== classFilter) return false
    if (academicYearFilter && s.enrollment?.academicYearName !== academicYearFilter) return false
    if (q) {
      const ql = q.toLowerCase()
      return s.fullName.toLowerCase().includes(ql) || s.admissionNo.toLowerCase().includes(ql)
    }
    return true
  })

  const total = students.length
  const active = students.filter((s) => s.status === 'ACTIVE').length
  const inactive = total - active
  const classes = new Set(students.map((s) => s.enrollment?.className).filter(Boolean)).size

  const handleDeactivate = (s: Student) => {
    const isActive = s.status === 'ACTIVE'
    appConfirm({
      title: `${isActive ? 'Deactivate' : 'Activate'} ${s.fullName}?`,
      content: isActive
        ? 'The student will be marked as inactive and removed from active enrollments.'
        : 'The student will be marked as active again.',
      okText: isActive ? 'Deactivate' : 'Activate',
      okColor: isActive ? 'danger' : 'primary',
      cancelText: 'Cancel',
      onOk: () => {
        setStudents((prev) =>
          prev.map((st) => st.id === s.id ? { ...st, status: isActive ? 'INACTIVE' : 'ACTIVE' } : st)
        )
        toast.success(`${s.fullName} ${isActive ? 'deactivated' : 'activated'}`)
        // If the detail drawer is open for this student, update it
        if (viewStudent?.id === s.id) {
          setViewStudent((prev) => prev ? { ...prev, status: isActive ? 'INACTIVE' : 'ACTIVE' } : null)
        }
      },
    })
  }

  const filterColumns = [
    { key: 'name', title: 'Name / Admission No', isSearchable: true },
    { key: 'academicYear', title: 'Academic Year', isFilterable: true, filterWidth: 160, filterOptions: yearOptions },
    { key: 'class', title: 'Class', isFilterable: true, filterWidth: 150, filterOptions: classOptions },
    {
      key: 'gender', title: 'Gender', isFilterable: true, filterWidth: 130,
      filterOptions: [
        { label: 'Male', value: 'MALE' },
        { label: 'Female', value: 'FEMALE' },
        { label: 'Other', value: 'OTHER' },
      ],
    },
    {
      key: 'status', title: 'Status', isFilterable: true, filterWidth: 140,
      filterOptions: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
        { label: 'Graduated', value: 'GRADUATED' },
        { label: 'Transferred', value: 'TRANSFERRED' },
      ],
    },
  ]

  const columns: ColumnsType<Student> = [
    {
      title: 'Photo',
      key: 'photo',
      width: 76,
      render: (_: unknown, s: Student) => (
        <Avatar
          size={36}
          src={s.photo ?? undefined}
          style={{ background: colors.primaryLight, color: colors.primary, fontWeight: 700, fontSize: 12 }}
        >
          {initials(s.fullName)}
        </Avatar>
      ),
    },
    {
      title: 'Student',
      key: 'student',
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
      render: (_: unknown, s: Student) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{s.fullName}</div>
          {/* <div style={{ fontFamily: 'monospace', fontSize: 11, color: colors.muted }}>{s.admissionNo}</div> */}
        </div>
      ),
    },
    {
      title: 'Academic Year',
      key: 'academicYear',
      render: (_: unknown, s: Student) => s.enrollment?.academicYearName ?? '—',
    },
    {
      title: 'Class',
      key: 'class',
      sorter: (a, b) => (a.enrollment?.className ?? '').localeCompare(b.enrollment?.className ?? ''),
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
      title: 'Gender',
      dataIndex: 'gender',
      render: (v: Gender) => v.charAt(0) + v.slice(1).toLowerCase(),
    },
    {
      title: 'Guardian',
      key: 'guardian',
      render: (_: unknown, s: Student) => s.guardianName ?? <span style={{ color: colors.muted }}>—</span>,
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: unknown, s: Student) => (
        <span style={{ fontFamily: 'monospace' }}>{s.phone ?? s.guardianPhone ?? '—'}</span>
      ),
    },
    {
      title: 'Admission Date',
      dataIndex: 'admissionDate',
      width: 160,
      sorter: (a, b) => a.admissionDate.localeCompare(b.admissionDate),
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 130,
      align: 'center',
      render: (_: unknown, s: Student) => (
        <Space size={4} onClick={(e) => e.stopPropagation()}>
          <Button
            type="default" size="small" icon={<EyeOutlined />} title="View"
            onClick={() => setViewStudent(s)}
            style={{ borderRadius: radius.sm, borderColor: colors.border, color: colors.muted }}
          />
          <Button
            type="default" size="small" icon={<WalletOutlined />} title="Fee Profile"
            onClick={() => toast.info('Fee profile coming soon')}
            style={{ borderRadius: radius.sm, borderColor: colors.border, color: colors.muted }}
          />
          {canUpdate && (
            <Button
              type="default" size="small"
              icon={<StopOutlined />}
              title={s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              onClick={() => handleDeactivate(s)}
              style={{ borderRadius: radius.sm, borderColor: colors.border, color: s.status === 'ACTIVE' ? colors.error : colors.success }}
            />
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0, color: colors.text }}>Student Management</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Search, filter and manage every enrolled student</Text>
        </div>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} style={{ background: colors.primary }} onClick={() => setAdmissionOpen(true)}>
            New Admission
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Students', value: total, icon: <TeamOutlined />, color: colors.primary, bg: colors.primaryLight },
          { label: 'Active Students', value: active, icon: <UserOutlined />, color: colors.success, bg: colors.successLight },
          { label: 'Inactive', value: inactive, icon: <StopOutlined />, color: colors.error, bg: colors.errorLight },
          { label: 'Classes', value: classes, icon: <BookOutlined />, color: colors.info, bg: colors.infoLight },
        ].map((kpi) => (
          <Col key={kpi.label} xs={12} sm={8} md={6}>
            <StatCard variant="default" size="middle" label={kpi.label} value={kpi.value} icon={kpi.icon} color={kpi.color} iconBg={kpi.bg} />
          </Col>
        ))}
      </Row>

      {/* Filter + Table */}
      <SearchAndFilter
        columns={filterColumns}
        searchValue={q}
        onSearchChange={setQ}
        debounceMs={300}
        filterValues={filterValues}
        onFilterChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
      />
      <AppTable<Student>
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        onRowClick={(s) => setViewStudent(s)}
        scroll={{ x: 1200 }}
        locale={{ emptyText: 'No students found.' }}
      />

      <StudentDetailDrawer
        student={viewStudent}
        canUpdate={canUpdate}
        onClose={() => setViewStudent(null)}
        onDeactivate={handleDeactivate}
      />
      <NewAdmissionDrawer
        open={admissionOpen}
        onClose={() => setAdmissionOpen(false)}
      />
    </div>
  )
}

// ─── STUDENT DETAIL DRAWER ───────────────────────────────────────────────────

function StudentDetailDrawer({ student, canUpdate, onClose, onDeactivate }: {
  student: Student | null
  canUpdate: boolean
  onClose: () => void
  onDeactivate: (s: Student) => void
}) {
  if (!student) return null

  return (
    <Drawer
      title={
        <Space>
          <Avatar
            size={40}
            src={student.photo ?? undefined}
            style={{ background: colors.primaryLight, color: colors.primary, fontWeight: 700, fontSize: 14 }}
          >
            {initials(student.fullName)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{student.fullName}</div>
            <div style={{ fontSize: 12, color: colors.muted, fontWeight: 400, fontFamily: 'monospace' }}>
              {student.admissionNo}
            </div>
          </div>
        </Space>
      }
      open={!!student}
      onClose={onClose}
      size={DRAWER.widthLg}
      extra={
        canUpdate && (
          <Space>
            <Button icon={<WalletOutlined />} onClick={() => toast.info('Fee profile coming soon')}>
              Fee Profile
            </Button>
            <Button
              danger={student.status === 'ACTIVE'}
              icon={<StopOutlined />}
              onClick={() => { onDeactivate(student); onClose() }}
            >
              {student.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </Button>
            <Button type="primary" icon={<EditOutlined />} style={{ background: colors.primary }}
              onClick={() => toast.info('Edit coming soon')}>
              Edit
            </Button>
          </Space>
        )
      }
    >
      {/* Enrollment banner */}
      {student.enrollment ? (
        <div style={{ padding: 16, background: colors.primaryLight, border: `1px solid ${colors.primaryBorder}`, borderRadius: 8, marginBottom: 20 }}>
          <Text strong style={{ fontSize: 13, color: colors.primary }}>Current Enrollment</Text>
          <Descriptions column={2} size="small" style={{ marginTop: 8 }}>
            <Descriptions.Item label="Academic Year">{student.enrollment.academicYearName}</Descriptions.Item>
            <Descriptions.Item label="Class">{student.enrollment.className}</Descriptions.Item>
            <Descriptions.Item label="Section">Section {student.enrollment.sectionName}</Descriptions.Item>
            <Descriptions.Item label="Roll No.">{student.enrollment.rollNumber ?? '—'}</Descriptions.Item>
          </Descriptions>
        </div>
      ) : (
        <div style={{ padding: 16, background: colors.warningLight, border: `1px solid ${colors.warning}40`, borderRadius: 8, marginBottom: 20 }}>
          <Text style={{ color: colors.warning, fontSize: 13 }}>No active enrollment for this student.</Text>
        </div>
      )}

      <Tabs items={[
        {
          key: 'profile',
          label: 'Profile',
          children: (
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Admission No." span={2}>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{student.admissionNo}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Full Name" span={2}>{student.fullName}</Descriptions.Item>
              <Descriptions.Item label="Date of Birth">{student.dob}</Descriptions.Item>
              <Descriptions.Item label="Gender">{student.gender.charAt(0) + student.gender.slice(1).toLowerCase()}</Descriptions.Item>
              <Descriptions.Item label="Blood Group">{student.bloodGroup ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Phone">{student.phone ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Email">{student.email ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Admission Date">{student.admissionDate}</Descriptions.Item>
              <Descriptions.Item label="Status"><StatusBadge status={student.status} /></Descriptions.Item>
              <Descriptions.Item label="Permanent Address" span={2}>{student.permanentAddress ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Temporary Address" span={2}>{student.temporaryAddress ?? '—'}</Descriptions.Item>
            </Descriptions>
          ),
        },
        {
          key: 'guardian',
          label: 'Guardian',
          children: (
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Father Name">{student.fatherName ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Mother Name">{student.motherName ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Guardian Name" span={2}>{student.guardianName ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Guardian Phone">{student.guardianPhone ?? '—'}</Descriptions.Item>
            </Descriptions>
          ),
        },
        {
          key: 'documents',
          label: 'Documents',
          children: (
            <div style={{ padding: 32, textAlign: 'center', background: colors.surfaceAlt, borderRadius: 8, border: `1px solid ${colors.border}` }}>
              <Text type="secondary">Document management coming soon.</Text>
            </div>
          ),
        },
      ]} />
    </Drawer>
  )
}

// ─── PROFILE PICTURE PICKER ───────────────────────────────────────────────────

function ProfilePicturePicker({ value, onChange }: {
  value?: string | null
  onChange?: (url: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(value ?? null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    onChange?.(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
      <div
        style={{
          width: 96, height: 96, borderRadius: '50%',
          background: colors.primaryLight, border: `2px dashed ${colors.primaryBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', cursor: 'pointer', position: 'relative',
        }}
        onClick={() => inputRef.current?.click()}
      >
        {preview
          ? <img src={preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <CameraOutlined style={{ fontSize: 28, color: colors.primary }} />
        }
      </div>
      <Text type="secondary" style={{ fontSize: 11, marginTop: 6 }}>Click to upload photo</Text>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  )
}

// ─── NEW ADMISSION DRAWER ─────────────────────────────────────────────────────

const STEPS = ['Student Info', 'Academic & Guardian', 'Review']

function NewAdmissionDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form] = Form.useForm()
  const [step, setStep] = useState(0)
  const [photo, setPhoto] = useState<string | null>(null)

  const reset = () => { form.resetFields(); setStep(0); setPhoto(null) }
  const handleClose = () => { reset(); onClose() }

  const goNext = async () => {
    const fieldsByStep: Record<number, string[]> = {
      0: ['firstName', 'lastName', 'dob', 'gender'],
      1: ['admissionNo', 'admissionDate', 'academicYearId', 'classId', 'sectionId', 'guardianPhone'],
    }
    try {
      await form.validateFields(fieldsByStep[step] ?? [])
      setStep((s) => s + 1)
    } catch {
      toast.error('Please fix the highlighted errors before continuing')
    }
  }

  const onSubmit = async () => {
    try {
      await form.validateFields()
      toast.success('Admission submitted — API integration coming soon')
      handleClose()
    } catch {
      toast.error('Please fix the highlighted errors')
    }
  }

  // Review summary
  const values = Form.useWatch([], form) ?? {}

  return (
    <Drawer
      title="New Student Admission"
      open={open}
      onClose={handleClose}
      size={DRAWER.widthXl}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          {step > 0 && <Button onClick={() => setStep((s) => s - 1)}>Back</Button>}
          {step < STEPS.length - 1
            ? <Button type="primary" style={{ background: colors.primary }} onClick={goNext}>Save & Next</Button>
            : <Button type="primary" style={{ background: colors.primary }} onClick={onSubmit}>Submit Admission</Button>
          }
        </Space>
      }
    >
      {/* Step bar */}
      <StepBar
        steps={STEPS.map((title) => ({ title }))}
        current={step}
        onChange={setStep}
      />

      <Form form={form} layout="vertical" requiredMark={false}>

        {step === 0 && (
          <>
            <ProfilePicturePicker value={photo} onChange={setPhoto} />

            <Text strong style={{ fontSize: 13 }}>Personal Information</Text>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={8}>
                <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="First name" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="middleName" label="Middle Name">
                  <Input placeholder="Middle name" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="Last name" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="dob" label="Date of Birth" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="YYYY-MM-DD" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="gender" label="Gender" rules={[{ required: true, message: 'Required' }]}>
                  <Select placeholder="Select gender" options={[
                    { label: 'Male', value: 'MALE' },
                    { label: 'Female', value: 'FEMALE' },
                    { label: 'Other', value: 'OTHER' },
                  ]} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="bloodGroup" label="Blood Group">
                  <Select allowClear placeholder="Select blood group"
                    options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((g) => ({ label: g, value: g }))}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="phone" label="Contact Number">
                  <Input placeholder="Phone number" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="email" label="Email">
                  <Input placeholder="Email address" type="email" />
                </Form.Item>
              </Col>
            </Row>

            <Text strong style={{ fontSize: 13 }}>Address</Text>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}>
                <Form.Item name="permanentAddress" label="Permanent Address">
                  <Input.TextArea rows={2} placeholder="Permanent address (e.g. Kathmandu-10, Bagmati)" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="temporaryAddress" label="Temporary Address">
                  <Input.TextArea rows={2} placeholder="Temporary address (if different from permanent)" />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {/* ── Step 2: Academic & Guardian ── */}
        {step === 1 && (
          <>
            <Text strong style={{ fontSize: 13 }}>Academic Details</Text>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={8}>
                <Form.Item name="admissionNo" label="Admission Number" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="ADM-2081-001" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="admissionDate" label="Admission Date" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="YYYY-MM-DD" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="academicYearId" label="Academic Year" rules={[{ required: true, message: 'Required' }]}>
                  <Select placeholder="Select academic year"
                    options={[{ label: '2081/82 (Current)', value: 'mock-year-1' }]}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="classId" label="Class" rules={[{ required: true, message: 'Required' }]}>
                  <Select placeholder="Select class" options={[
                    { label: 'Class 5', value: 'cls-5' },
                    { label: 'Class 6', value: 'cls-6' },
                  ]} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="sectionId" label="Section" rules={[{ required: true, message: 'Required' }]}>
                  <Select placeholder="Select section" options={[
                    { label: 'Section A', value: 'sec-a' },
                    { label: 'Section B', value: 'sec-b' },
                  ]} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="rollNumber" label="Roll Number">
                  <InputNumber min={1} style={{ width: '100%' }} placeholder="e.g. 1" />
                </Form.Item>
              </Col>
            </Row>

            <Text strong style={{ fontSize: 13 }}>Parent / Guardian</Text>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={8}>
                <Form.Item name="fatherName" label="Father Name">
                  <Input placeholder="Father's full name" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="motherName" label="Mother Name">
                  <Input placeholder="Mother's full name" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="guardianName" label="Guardian Name">
                  <Input placeholder="Guardian's name" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="guardianPhone" label="Guardian Contact" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="Guardian phone number" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="guardianEmail" label="Guardian Email">
                  <Input placeholder="Guardian email" type="email" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="relationship" label="Relationship">
                  <Select allowClear placeholder="Relationship to student" options={[
                    { label: 'Father', value: 'Father' },
                    { label: 'Mother', value: 'Mother' },
                    { label: 'Grandparent', value: 'Grandparent' },
                    { label: 'Uncle / Aunt', value: 'Uncle/Aunt' },
                    { label: 'Sibling', value: 'Sibling' },
                    { label: 'Other', value: 'Other' },
                  ]} />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {/* ── Step 3: Review ── */}
        {step === 2 && (
          <>
            <Text strong style={{ fontSize: 13 }}>Review & Submit</Text>
            <Descriptions bordered size="small" column={2} style={{ marginTop: 12, marginBottom: 20 }} title="Student Information">
              <Descriptions.Item label="Name">
                {[values.firstName, values.middleName, values.lastName].filter(Boolean).join(' ') || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Date of Birth">{(values as any).dob || '—'}</Descriptions.Item>
              <Descriptions.Item label="Gender">{(values as any).gender || '—'}</Descriptions.Item>
              <Descriptions.Item label="Blood Group">{(values as any).bloodGroup || '—'}</Descriptions.Item>
              <Descriptions.Item label="Phone">{(values as any).phone || '—'}</Descriptions.Item>
              <Descriptions.Item label="Email">{(values as any).email || '—'}</Descriptions.Item>
              <Descriptions.Item label="Permanent Address" span={2}>{(values as any).permanentAddress || '—'}</Descriptions.Item>
              <Descriptions.Item label="Temporary Address" span={2}>{(values as any).temporaryAddress || '—'}</Descriptions.Item>
            </Descriptions>
            <Descriptions bordered size="small" column={2} title="Academic & Guardian">
              <Descriptions.Item label="Admission No.">{(values as any).admissionNo || '—'}</Descriptions.Item>
              <Descriptions.Item label="Admission Date">{(values as any).admissionDate || '—'}</Descriptions.Item>
              <Descriptions.Item label="Class">{(values as any).classId || '—'}</Descriptions.Item>
              <Descriptions.Item label="Section">{(values as any).sectionId || '—'}</Descriptions.Item>
              <Descriptions.Item label="Roll Number">{(values as any).rollNumber || '—'}</Descriptions.Item>
              <Descriptions.Item label="Guardian Phone">{(values as any).guardianPhone || '—'}</Descriptions.Item>
            </Descriptions>
          </>
        )}

      </Form>
    </Drawer>
  )
}
