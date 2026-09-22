import { useEffect, useRef, useState } from 'react'
import {
  Avatar, Button, Col, Descriptions, Drawer, Image,
  Form, Modal, Row, Select, Space, Tabs,
  Typography, Spin, Tag, type TablePaginationConfig,
} from 'antd'
import type { ColumnsType } from 'antd/es/table/interface'
import type { BsDateRange } from '../../components/nepali-calendar'
import { NepaliDatePicker } from '../../components/nepali-calendar'
import { bsIsoToAdIso, adIsoToBsIso } from '../../utils/nepaliDate'
import {
  PlusOutlined, EyeOutlined, EditOutlined,
  TeamOutlined, UserOutlined, StopOutlined, BookOutlined,
  WalletOutlined, CameraOutlined, LoadingOutlined,
  FilePdfOutlined, FileTextOutlined, DeleteOutlined,
  ReloadOutlined, SwapOutlined,
} from '@ant-design/icons'
import { toast } from 'sonner'
import { colors, DRAWER, radius } from '../../lib/designTokens'
import { usePermission } from '../../context/PermissionContext'
import { FEATURES, ACTIONS } from '../../utils/permissions'
import { appConfirm } from '../../components/common/AppConfirm'
import { StatusBadge, getStatusColor } from '../../components/common/StatusBadge'
import { AppTable } from '../../components/common/AppTable'
import { TableSkeleton } from '../../components/skeleton'
import { SearchAndFilter } from '../../components/common/SearchAndFilter'
import { StatCard } from '../../components/common/StatCard'
import { StepBar } from '../../components/common/StepBar'
import { FilePreviewModal } from '../../components/common/FilePreviewModal'
import type { FilePreviewDoc } from '../../components/common/FilePreviewModal'
import { useAcademicYears } from '../../features/academic-years'
import { useClasses } from '../../features/classes'
import { useSections } from '../../features/sections'
import { useUpload } from '../../lib/api/hooks/useUpload'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useStudents, useStudent, useCreateStudent, useUploadStudentPhoto,
  useUpdateStudent, useUpdateStudentStatus,
  useDeactivateStudent, useRestoreStudent,
} from '../../features/students'
import { PersonalInfoStep } from './PersonalInfoStep'
import type {
  Student, StudentStatus, Gender, BloodGroup,
  StudentListParams,
  CreateStudentPayload, UpdateStudentPayload,
  StudentDocumentType, StudentDocument,
} from './types'
import { getAllowedTransitions, STATUS_LABELS, normalizeStudentDocuments } from './types'
import { admissionDateValidationRules } from './studentValidation'
import {
  attachStudentDocument, useAttachStudentDocument,
  useDeleteStudentDocument, useStudentDocuments,
} from '../../features/students/documents'
import type { AttachDocumentPayload } from '../../features/students/documents'
const { Title, Text } = Typography

//  Helpers 

function getFullName(s: Student) {
  if (s.fullName) return s.fullName
  return [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ')
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

function titleCase(v?: string) {
  return v ? v.charAt(0) + v.slice(1).toLowerCase() : ''
}

function statusColor(s: StudentStatus) {
  return getStatusColor(s)
}

//  Reusable description list 

type DescRow = { label: string; value?: React.ReactNode; span?: number }

function DescList({ rows, ...rest }: { rows: DescRow[] } & React.ComponentProps<typeof Descriptions>) {
  return (
    <Descriptions bordered size="small" column={2} {...rest}>
      {rows.map(({ label, value, span }) => (
        <Descriptions.Item key={label} label={label} span={span}>
          {value || '—'}
        </Descriptions.Item>
      ))}
    </Descriptions>
  )
}

// ─── Shared option sets ───────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
]

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const BLOOD_GROUP_OPTIONS = BLOOD_GROUPS.map((g) => ({ label: g, value: g }))

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const { can } = usePermission()
  const canCreate = can(FEATURES.STUDENT, ACTIONS.CREATE)
  const canUpdate = can(FEATURES.STUDENT, ACTIONS.UPDATE)
  const canDelete = can(FEATURES.STUDENT, ACTIONS.DELETE)

  // ── list / pagination state ──────────────────────────────────────
  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string | undefined>>({})
  const [dateValues, setDateValues] = useState<Record<string, BsDateRange | null>>({})
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const admissionRange = dateValues['admissionDate'] ?? null

  const listParams: StudentListParams = {
    search: search || undefined,
    status: filterValues['status'] as StudentStatus | undefined,
    gender: filterValues['gender'] as Gender | undefined,
    bloodGroup: filterValues['bloodGroup'] as BloodGroup | undefined,
    admissionDateFrom: admissionRange?.from ? bsIsoToAdIso(admissionRange.from) : undefined,
    admissionDateTo: admissionRange?.to ? bsIsoToAdIso(admissionRange.to) : undefined,
    page, limit,
  }

  const { data, isLoading } = useStudents(listParams)
  const students = data?.data ?? []
  const meta = data?.meta

  const total = meta?.total ?? 0
  const active = students.filter((s) => s.status === 'ACTIVE').length
  const inactive = students.filter((s) => s.status === 'INACTIVE' || s.status === 'SUSPENDED').length
  const classes = new Set(students.map((s) => s.enrollment?.classId).filter(Boolean)).size

  const { id: paramStudentId } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  // ── drawer / modal state ────────────────────────────────────────────────
  const [viewStudent, setViewStudent] = useState<Student | null>(null)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [statusStudent, setStatusStudent] = useState<Student | null>(null)
  const [admissionOpen, setAdmissionOpen] = useState(false)

  const activeDetailId = (paramStudentId && paramStudentId !== 'promote')
    ? paramStudentId
    : viewStudent?.id

  const handleCloseDetail = () => {
    setViewStudent(null)
    if (paramStudentId && paramStudentId !== 'promote') {
      navigate('/students')
    }
  }

  // ── table onChange: pagination ──────────────────────────────────────────
  const handleTableChange = (
    pagination: TablePaginationConfig,
  ) => {
    if (pagination.current) setPage(pagination.current)
    if (pagination.pageSize) { setLimit(pagination.pageSize); setPage(1) }
  }

  // ── filter config ───────────────────────────────────────────────────────
  const filterColumns = [
    {
      key: 'name',
      title: 'Search',
      isSearchable: true,
      placeholder: 'Name, admission no, phone, address…',
    },
    { key: 'gender', title: 'Gender', isFilterable: true, filterWidth: 130, filterOptions: GENDER_OPTIONS },
    {
      key: 'status', title: 'Status', isFilterable: true, filterWidth: 170,
      filterOptions: Object.entries(STATUS_LABELS).map(([value, label]) => ({ label, value })),
    },
    { key: 'bloodGroup', title: 'Blood Group', isFilterable: true, filterWidth: 120, filterOptions: BLOOD_GROUP_OPTIONS },
    { key: 'admissionDate', title: 'Admission Date', isDateRange: true, dateRangeWidth: 240 },
  ]

  const mono = (v?: string | number) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v != null ? String(v) : '—'}</span>

  // ── table columns ───────────────────────────────────────────────────────
  const columns: ColumnsType<Student> = [
    {
      title: 'Photo', key: 'photo', width: 90,
      render: (_: unknown, s: Student) => (
        <Avatar size={50} src={s.photoUrl ?? undefined}
          style={{ background: colors.primaryLight, color: colors.primary, fontWeight: 700, fontSize: 12 }}>
          {initials(getFullName(s))}
        </Avatar>
      ),
    },
    {
      title: 'Student', key: 'firstName',
      render: (_: unknown, s: Student) => (
        <div style={{ fontWeight: 500, fontSize: 13 }}>{getFullName(s)}</div>
      ),
    },
    {
      title: 'Class / Section', key: 'class',
      render: (_: unknown, s: Student) => s.enrollment
        ? `${s.enrollment.className ?? ''} / ${s.enrollment.sectionName ?? ''}`
        : '—',
    },
    {
      title: 'Roll No.', key: 'rollNo', width: 90,
      render: (_: unknown, s: Student) => mono(s.enrollment?.rollNumber ?? undefined),
    },
    {
      title: 'Gender', dataIndex: 'gender', width: 90,
      render: (v: Gender) => titleCase(v),
    },
    {
      title: 'Contact', key: 'contact',
      render: (_: unknown, s: Student) => mono(s.parentPhone ?? undefined),
    },
    {
      title: 'Admission Date', dataIndex: 'admissionDate', width: 150,
      render: (v: string) => mono(v),
    },
    {
      title: 'DOB', dataIndex: 'dateOfBirth', width: 120,
      render: (v: string) => mono(v),
    },
    {
      title: 'Created', dataIndex: 'createdAt', width: 120,
      render: (v: string) => mono(v?.slice(0, 10)),
    },
    {
      title: 'Status', dataIndex: 'status',
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      title: 'Actions', key: 'actions', fixed: 'right', width: 148, align: 'center',
      render: (_: unknown, s: Student) => {
        const isTerminal = s.status === 'TRANSFERRED_OUT' || s.status === 'GRADUATED'
        const iconBtn = (props: React.ComponentProps<typeof Button>) => (
          <Button type="default" size="small"
            style={{ borderRadius: radius.sm, borderColor: colors.border, color: colors.muted, ...props.style }}
            {...props} />
        )
        return (
          <Space size={4} onClick={(e) => e.stopPropagation()}>
            {iconBtn({ icon: <EyeOutlined />, title: 'View', onClick: () => setViewStudent(s) })}
            {canUpdate && iconBtn({ icon: <EditOutlined />, title: 'Edit', onClick: () => setEditStudent(s) })}
            {canUpdate && !isTerminal && iconBtn({
              icon: <SwapOutlined />, title: 'Change Status',
              onClick: () => setStatusStudent(s), style: { color: colors.info },
            })}
            {canDelete && iconBtn({
              icon: s.deletedAt ? <ReloadOutlined /> : <DeleteOutlined />,
              title: s.deletedAt ? 'Restore' : 'Deactivate',
              onClick: () => s.deletedAt ? handleRestore(s) : handleDeactivate(s),
              style: { color: s.deletedAt ? colors.success : colors.error },
            })}
          </Space>
        )
      },
    },
  ]

  // ── action handlers ─────────────────────────────────────────────────────
  const [pendingAction, setPendingAction] = useState<{ id: string; type: 'deactivate' | 'restore' } | null>(null)

  const handleDeactivate = (s: Student) => {
    appConfirm({
      title: `Deactivate ${getFullName(s)}?`,
      content: 'This is a soft delete. The student record can be restored.',
      okText: 'Deactivate',
      okColor: 'danger',
      cancelText: 'Cancel',
      onOk: () => setPendingAction({ id: s.id, type: 'deactivate' }),
    })
  }

  const handleRestore = (s: Student) => {
    appConfirm({
      title: `Restore ${getFullName(s)}?`,
      content: 'The student record will be made visible again.',
      okText: 'Restore',
      okColor: 'primary',
      cancelText: 'Cancel',
      onOk: () => setPendingAction({ id: s.id, type: 'restore' }),
    })
  }

  const kpis = [
    { label: 'Total Students', value: total, icon: <TeamOutlined />, color: colors.primary, bg: colors.primaryLight },
    { label: 'Active Students', value: active, icon: <UserOutlined />, color: colors.success, bg: colors.successLight },
    { label: 'Inactive / Suspended', value: inactive, icon: <StopOutlined />, color: colors.error, bg: colors.errorLight },
    { label: 'Classes', value: classes, icon: <BookOutlined />, color: colors.info, bg: colors.infoLight },
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
          <Button type="primary" icon={<PlusOutlined />} style={{ background: colors.primary }}
            onClick={() => setAdmissionOpen(true)}>
            New Admission
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {kpis.map((kpi) => (
          <Col key={kpi.label} xs={12} sm={8} md={6}>
            <StatCard variant="default" size="middle" label={kpi.label} value={kpi.value}
              icon={kpi.icon} color={kpi.color} iconBg={kpi.bg} />
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <SearchAndFilter
        columns={filterColumns}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        debounceMs={400}
        filterValues={filterValues}
        onFilterChange={(key, value) => {
          setFilterValues((prev) => ({ ...prev, [key]: value }))
          setPage(1)
        }}
        dateValues={dateValues}
        onDateChange={(key, range) => {
          setDateValues((prev) => ({ ...prev, [key]: range }))
          setPage(1)
        }}
      />

      {/* Table — skeleton on first load, real table afterwards */}
      {isLoading ? (
        <TableSkeleton rows={limit} columns={10} />
      ) : (
        <AppTable<Student>
          rowKey="id"
          columns={columns}
          dataSource={students}
          loading={false}
          onRowClick={(s) => setViewStudent(s)}
          scroll={{ x: 1500 }}
          locale={{ emptyText: 'No students found.' }}
          onChange={handleTableChange as any}
          pagination={{
            current: page,
            pageSize: limit,
            total: meta?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (t) => `Total ${t} students`,
          }}
        />
      )}

      {/* Invisible action executor */}
      {pendingAction && (
        <StudentActionExecutor
          id={pendingAction.id}
          type={pendingAction.type}
          onDone={() => setPendingAction(null)}
        />
      )}

      {/* Drawers / Modals */}
      <StudentDetailDrawer
        student={viewStudent}
        studentId={activeDetailId}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onClose={handleCloseDetail}
        onEdit={(s) => { setViewStudent(null); setEditStudent(s) }}
        onStatusChange={(s) => { setViewStudent(null); setStatusStudent(s) }}
        onDeactivate={handleDeactivate}
        onRestore={handleRestore}
      />

      <StudentFormDrawer
        open={!!editStudent}
        student={editStudent}
        onClose={() => setEditStudent(null)}
      />

      <StudentFormDrawer
        open={admissionOpen}
        onClose={() => setAdmissionOpen(false)}
        onSuccess={() => setSearch('')}
      />

      <StatusChangeModal
        student={statusStudent}
        onClose={() => setStatusStudent(null)}
      />
    </div>
  )
}

// ─── INVISIBLE ACTION EXECUTOR ────────────────────────────────────────────────

function StudentActionExecutor({ id, type, onDone }: {
  id: string
  type: 'deactivate' | 'restore'
  onDone: () => void
}) {
  const { mutateAsync: deactivate } = useDeactivateStudent(id)
  const { mutateAsync: restore } = useRestoreStudent(id)

  useState(() => {
    const run = async () => {
      try {
        if (type === 'deactivate') {
          await deactivate()
          toast.success('Student deactivated')
        } else {
          await restore()
          toast.success('Student restored')
        }
      } catch (err) {
        toast.error((err as Error).message ?? `Failed to ${type}`)
      } finally {
        onDone()
      }
    }
    run()
  })

  return null
}

// ─── STUDENT DETAIL DRAWER ────────────────────────────────────────────────────

function StudentDetailDrawer({
  student: initialStudent,
  studentId: propStudentId,
  canUpdate,
  canDelete,
  onClose,
  onEdit,
  onStatusChange,
  onDeactivate,
  onRestore,
}: {
  student?: Student | null
  studentId?: string | null
  canUpdate: boolean
  canDelete: boolean
  onClose: () => void
  onEdit: (s: Student) => void
  onStatusChange: (s: Student) => void
  onDeactivate: (s: Student) => void
  onRestore: (s: Student) => void
}) {
  const activeId = propStudentId || initialStudent?.id
  const { data: detailData, isLoading } = useStudent(activeId ?? undefined)
  const student = detailData?.data ?? initialStudent

  if (!activeId) return null

  if (isLoading && !student) {
    return (
      <Drawer open={!!activeId} onClose={onClose} size={DRAWER.widthLg} title="Student Details">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      </Drawer>
    )
  }

  if (!student) return null

  const fullName = getFullName(student)
  const isTerminal = student.status === 'TRANSFERRED_OUT' || student.status === 'GRADUATED'
  const transitions = getAllowedTransitions(student.status)

  const profileRows: DescRow[] = [
    { label: 'Admission No.', span: 2, value: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{student.admissionNumber}</span> },
    { label: 'Full Name', span: 2, value: fullName },
    { label: 'Date of Birth', value: student.dateOfBirth },
    { label: 'Gender', value: titleCase(student.gender) },
    { label: 'Blood Group', value: student.bloodGroup },
    { label: 'Status', value: <StatusBadge status={student.status} /> },
    { label: 'Parent Phone', value: student.parentPhone },
    { label: 'Parent Email', value: student.parentEmail },
    { label: 'Admission Date', value: student.admissionDate },
    { label: 'Permanent Address', span: 2, value: student.addressPermanent },
    { label: 'Temporary Address', span: 2, value: student.addressTemporary },
  ]

  return (
    <Drawer
      title={
        <Space align="center">
          {student.photoUrl ? (
            <Image src={student.photoUrl} width={48} height={48}
              style={{ borderRadius: '50%', objectFit: 'cover', border: `2px solid ${colors.primaryBorder}` }}
              preview={{ mask: false }} />
          ) : (
            <Avatar size={48}
              style={{ background: colors.primaryLight, color: colors.primary, fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
              {initials(fullName)}
            </Avatar>
          )}
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{fullName}</div>
            <div style={{ fontSize: 12, color: colors.muted, fontFamily: 'monospace' }}>
              {student.admissionNumber}
            </div>
          </div>
        </Space>
      }
      open={!!activeId}
      onClose={onClose}
      size={DRAWER.widthLg}
      extra={
        <Space wrap>
          <Button icon={<WalletOutlined />} onClick={() => toast.info('Fee profile coming soon')}>
            Fee Profile
          </Button>
          {canUpdate && !isTerminal && transitions.length > 0 && (
            <Button icon={<SwapOutlined />} onClick={() => onStatusChange(student)}>
              Change Status
            </Button>
          )}
          {canUpdate && (
            <Button icon={<EditOutlined />} type="primary" style={{ background: colors.primary }}
              onClick={() => onEdit(student)}>
              Edit
            </Button>
          )}
          {canDelete && (
            student.deletedAt ? (
              <Button icon={<ReloadOutlined />} onClick={() => onRestore(student)}>Restore</Button>
            ) : (
              <Button danger icon={<DeleteOutlined />} onClick={() => onDeactivate(student)}>Deactivate</Button>
            )
          )}
        </Space>
      }
    >
      {student.photoUrl && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <Image src={student.photoUrl} width={120} height={120}
            style={{ borderRadius: 8, objectFit: 'cover', border: `2px solid ${colors.primaryBorder}`, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
            preview={{ mask: <span style={{ fontSize: 12 }}>View</span> }} />
        </div>
      )}

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
        { key: 'profile', label: 'Profile', children: <DescList rows={profileRows} /> },
        {
          key: 'documents', label: 'Documents',
          children: (
            <div style={{ paddingTop: 8 }}>
              <DocumentUploader
                studentId={student.id}
                existingDocuments={student.documents}
                pendingDocs={[]}
                onPendingDocsChange={() => {}}
              />
            </div>
          ),
        },
      ]} />
    </Drawer>
  )
}

// ─── STATUS CHANGE MODAL ──────────────────────────────────────────────────────

function StatusChangeModal({ student, onClose }: {
  student: Student | null
  onClose: () => void
}) {
  const [selected, setSelected] = useState<StudentStatus | null>(null)
  const { mutateAsync: updateStatus, isPending } = useUpdateStudentStatus(student?.id ?? '')

  const transitions = student ? getAllowedTransitions(student.status) : []

  const handleSubmit = async () => {
    if (!selected || !student) return
    try {
      await updateStatus({ status: selected })
      toast.success(`Status changed to ${STATUS_LABELS[selected]}`)
      setSelected(null)
      onClose()
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Status change failed')
    }
  }

  const handleClose = () => { setSelected(null); onClose() }

  return (
    <Modal
      title="Change Student Status"
      open={!!student}
      onCancel={handleClose}
      onOk={handleSubmit}
      okText="Confirm"
      okButtonProps={{ disabled: !selected, loading: isPending, style: { background: colors.primary } }}
      destroyOnClose
    >
      {student && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Text>Current status of <strong>{getFullName(student)}</strong>:</Text>
            <div style={{ marginTop: 6 }}>
              <Tag color={statusColor(student.status)} style={{ fontSize: 13, padding: '2px 10px' }}>
                {STATUS_LABELS[student.status]}
              </Tag>
            </div>
          </div>

          {transitions.length === 0 ? (
            <div style={{ padding: 16, background: colors.surfaceAlt, borderRadius: 8, textAlign: 'center' }}>
              <Text type="secondary">No further transitions are allowed from this status.</Text>
            </div>
          ) : (
            <>
              <Text type="secondary" style={{ fontSize: 13 }}>Select the new status:</Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                {transitions.map((s) => (
                  <div
                    key={s}
                    onClick={() => setSelected(s)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 8,
                      border: `2px solid ${selected === s ? colors.primary : colors.border}`,
                      background: selected === s ? colors.primaryLight : colors.surface,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Tag color={statusColor(s)} style={{ marginRight: 6 }}>{STATUS_LABELS[s]}</Tag>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  )
}

// ─── PROFILE PICTURE PICKER ───────────────────────────────────────────────────

export function ProfilePicturePicker({ initialUrl, onUploadComplete }: {
  initialUrl?: string | null
  onUploadComplete: (url: string, publicId: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null)
  const { mutateAsync: upload, isPending } = useUploadStudentPhoto()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    try {
      const result = await upload(file)
      onUploadComplete(result.url, result.publicId)
      toast.success('Photo uploaded')
    } catch {
      toast.error('Photo upload failed')
      setPreview(initialUrl ?? null)
    }
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
      <div
        style={{
          width: 100, height: 100, borderRadius: '50%',
          background: colors.primaryLight, border: `2px dashed ${colors.primaryBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', cursor: isPending ? 'not-allowed' : 'pointer',
        }}
        onClick={() => !isPending && inputRef.current?.click()}
      >
        {isPending
          ? <Spin indicator={<LoadingOutlined style={{ fontSize: 24, color: colors.primary }} />} />
          : preview
            ? <img src={preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <CameraOutlined style={{ fontSize: 28, color: colors.primary }} />
        }
      </div>
      <Text type="secondary" style={{ fontSize: 11, marginTop: 6 }}>
        {isPending ? 'Uploading…' : preview ? 'Click to change photo' : 'Click to upload photo'}
      </Text>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  )
}

const DOC_TYPES: { type: StudentDocumentType; label: string; accept: string; icon: React.ReactNode }[] = [
  { type: 'BIRTH_CERTIFICATE' as StudentDocumentType, label: 'Birth Certificate', accept: 'image/*,.pdf', icon: <FileTextOutlined /> },
  { type: 'TRANSFER_CERTIFICATE' as StudentDocumentType, label: 'Transfer Certificate', accept: 'image/*,.pdf', icon: <FilePdfOutlined /> },
  { type: 'REPORT_CARD' as StudentDocumentType, label: 'Report Card', accept: 'image/*,.pdf', icon: <FileTextOutlined /> },
  { type: 'ID_PROOF' as StudentDocumentType, label: 'ID Proof', accept: 'image/*,.pdf', icon: <FileTextOutlined /> },
  { type: 'OTHER' as StudentDocumentType, label: 'Other', accept: 'image/*,.pdf', icon: <FileTextOutlined /> },
]

// ─── DOCUMENT UPLOADER ────────────────────────────────────────────────────────
function DocumentUploader({
  studentId,
  existingDocuments,
  pendingDocs,
  onPendingDocsChange,
}: {
  studentId?: string
  existingDocuments?: Record<string, StudentDocument> | StudentDocument[] | null
  pendingDocs: AttachDocumentPayload[]
  onPendingDocsChange: (docs: AttachDocumentPayload[]) => void
}) {
  const { data: fallbackSavedDocs = [], isLoading } = useStudentDocuments(
    existingDocuments ? undefined : studentId
  )
  const { mutateAsync: rawUpload } = useUpload({ purpose: 'STUDENT_DOCUMENT' })
  const { mutateAsync: attach } = useAttachStudentDocument(studentId ?? '')
  const { mutateAsync: remove } = useDeleteStudentDocument(studentId ?? '')
  const [previewDoc, setPreviewDoc] = useState<FilePreviewDoc | null>(null)
  const [uploading, setUploading] = useState<StudentDocumentType | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const normalizedExisting = normalizeStudentDocuments(existingDocuments)
  const savedDocs = existingDocuments ? normalizedExisting : fallbackSavedDocs

  // Edit mode: documents already saved on the student.
  // Create mode: documents picked so far, held locally until submit.
  const docs: { documentType: StudentDocumentType; url: string; id?: string; fileName?: string }[] =
    studentId ? savedDocs : pendingDocs

  const handleFile = async (type: StudentDocumentType, label: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(type)
    try {
      // Step 1 — upload the raw file to storage right away, same as the photo picker
      const result = await rawUpload(file)
      const payload: AttachDocumentPayload = {
        documentType: type,
        url: result.url,
        publicId: result.publicId,
        fileName: file.name,
      }

      if (studentId) {
        // Step 2 — student already exists, attach immediately
        await attach(payload)
      } else {
        // Student doesn't exist yet — hold locally, attached right after creation
        onPendingDocsChange([...pendingDocs.filter((d) => d.documentType !== type), payload])
      }
      toast.success(`${label} uploaded`)
    } catch (err) {
      toast.error((err as Error)?.message ?? `Failed to upload ${label}`)
    } finally {
      setUploading(null)
      e.target.value = ''
    }
  }

  const handleRemove = (type: StudentDocumentType, label: string, documentId?: string) => {
    appConfirm({
      title: `Remove ${label}?`,
      content: 'This will permanently delete the uploaded file.',
      okText: 'Remove',
      okColor: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        if (studentId && documentId) {
          setRemoving(documentId)
          try {
            await remove(documentId)
            toast.success(`${label} removed`)
          } catch (err) {
            toast.error((err as Error)?.message ?? `Failed to remove ${label}`)
          } finally {
            setRemoving(null)
          }
        } else {
          onPendingDocsChange(pendingDocs.filter((d) => d.documentType !== type))
          toast.success(`${label} removed`)
        }
      },
    })
  }

  return (
    <div>
      <Text strong style={{ fontSize: 13 }}>Supporting Documents</Text>
      <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 12 }}>
        Accepts images or PDF, one file per document type.
      </Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DOC_TYPES.map(({ type, label, accept, icon }) => {
          const uploaded = docs.find((d) => d.documentType === type)
          const documentId = uploaded?.id
          const isUploading = uploading === type
          const isRemoving = documentId ? removing === documentId : false
          return (
            <div key={type} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px',
              border: `1px solid ${uploaded ? colors.success : colors.border}`,
              borderRadius: radius.md,
              background: uploaded ? colors.successLight : colors.surface,
              gap: 12,
            }}>
              <Space style={{ minWidth: 0, flex: 1 }}>
                <span style={{ color: uploaded ? colors.success : colors.muted, fontSize: 18, flexShrink: 0 }}>{icon}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                  {uploaded && (
                    <div style={{ marginTop: 2 }}>
                      {uploaded.fileName && (
                        <Text type="secondary" style={{ fontSize: 11, display: 'block', wordBreak: 'break-all' }}>
                          {uploaded.fileName}
                        </Text>
                      )}
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => setPreviewDoc({ url: uploaded.url, title: label, fileName: uploaded.fileName })}
                        style={{ padding: 0, height: 'auto', fontSize: 12, color: colors.primary, fontWeight: 500 }}
                      >
                        View Document
                      </Button>
                    </div>
                  )}
                </div>
              </Space>
              <Space style={{ flexShrink: 0 }}>
                {uploaded ? (
                  <>
                    <Tag color="success" style={{ margin: 0 }}>Uploaded</Tag>
                    <Button size="small" type="text" danger icon={<DeleteOutlined />}
                      loading={isRemoving} onClick={() => handleRemove(type, label, documentId)} />
                  </>
                ) : (
                  <Button size="small" loading={isUploading}
                    disabled={(!!uploading && !isUploading) || (studentId && !existingDocuments ? isLoading : false)}
                    onClick={() => inputRefs.current[type]?.click()}
                    style={{ borderColor: colors.border }}>
                    {isUploading ? 'Uploading…' : 'Upload'}
                  </Button>
                )}
                <input
                  ref={(el) => { inputRefs.current[type] = el }}
                  type="file" accept={accept} style={{ display: 'none' }}
                  onChange={(e) => handleFile(type, label, e)}
                />
              </Space>
            </div>
          )
        })}
      </div>

      {/* Document preview modal (shared component) */}
      <FilePreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  )
}
// ─── STUDENT FORM DRAWER (shared by create + edit) ────────────────────────────

const STEPS = ['Student Info', 'Academic & Documents', 'Review']

function StudentFormDrawer({ open, student, onClose, onSuccess }: {
  open: boolean
  student?: Student | null      // present => edit mode
  onClose: () => void
  onSuccess?: () => void
}) {
  const isEdit = !!student
  const [form] = Form.useForm()
  const [step, setStep] = useState(0)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoPublicId, setPhotoPublicId] = useState<string | null>(null)
  const [pendingDocs, setPendingDocs] = useState<AttachDocumentPayload[]>([])
  const [reviewValues, setReviewValues] = useState<Record<string, any>>({})

  const { mutateAsync: createStudent, isPending: isCreating } = useCreateStudent()
  const { mutateAsync: updateStudent, isPending: isUpdating } = useUpdateStudent(student?.id ?? '')
  const isSaving = isCreating || isUpdating

  const reset = () => {
    form.resetFields()
    setStep(0)
    setPhotoUrl(null)
    setPhotoPublicId(null)
    setPendingDocs([])
    setReviewValues({})
  }
  const handleClose = () => { reset(); onClose() }

  // Pre-fill in edit mode. Pickers work in BS.
  const handleAfterOpen = (isOpen: boolean) => {
    if (!isOpen || !student) return
    const getBsDateStr = (dateStr?: string | null) => {
      if (!dateStr) return undefined
      const year = parseInt(dateStr.split('-')[0], 10)
      if (!isNaN(year) && year >= 2000) return dateStr
      try {
        return adIsoToBsIso(dateStr)
      } catch {
        return dateStr
      }
    }

    form.setFieldsValue({
      firstName: student.firstName,
      middleName: student.middleName ?? '',
      lastName: student.lastName,
      dateOfBirth: getBsDateStr(student.dateOfBirth),
      gender: student.gender,
      bloodGroup: student.bloodGroup ?? undefined,
      parentPhone: student.parentPhone ?? '',
      parentEmail: student.parentEmail ?? '',
      addressPermanent: student.addressPermanent ?? '',
      addressTemporary: student.addressTemporary ?? '',
      admissionDate: getBsDateStr(student.admissionDate),
      academicYearId: (student.enrollment as any)?.academicYearId,
      classId: student.enrollment?.classId,
      sectionId: (student.enrollment as any)?.sectionId,
    })
    setPhotoUrl(student.photoUrl ?? null)
    setPhotoPublicId((student as any).photoPublicId ?? null)
  }

  const goNext = async () => {
    const fieldsByStep: Record<number, string[]> = {
      0: [
        'firstName', 'middleName', 'lastName',
        'dateOfBirth', 'gender', 'bloodGroup',
        'parentPhone', 'parentEmail',
        'addressPermanent', 'addressTemporary',
      ],
      1: isEdit ? ['academicYearId', 'classId', 'sectionId'] : ['admissionDate', 'academicYearId', 'classId', 'sectionId'],
    }

    try {
      await form.validateFields(fieldsByStep[step] ?? [])

      // Take a snapshot BEFORE moving to the Review step
      const values = form.getFieldsValue(true)

      if (step === 1) {
        // Capture the complete form state before rendering Review.
        // This prevents the review screen from depending on a conditionally
        // mounted Form/useWatch state.
        setReviewValues({ ...values })
      }

      setStep((s) => s + 1)
    } catch {
      toast.error('Please fix the highlighted errors before continuing')
    }
  }

  const onSubmit = async () => {
    try {
      await form.validateFields()
      const v = form.getFieldsValue(true)

      const base = {
        firstName: v.firstName?.trim(),
        middleName: v.middleName?.trim() || undefined,
        lastName: v.lastName?.trim(),
        dateOfBirth: v.dateOfBirth || '',
        gender: v.gender,
        bloodGroup: v.bloodGroup || undefined,
        parentEmail: v.parentEmail?.trim() || undefined,
        parentPhone: v.parentPhone?.trim(),
        addressPermanent: v.addressPermanent?.trim() || undefined,
        addressTemporary: v.addressTemporary?.trim() || undefined,
        photoUrl: photoUrl || undefined,
        photoPublicId: photoPublicId || undefined,
      }

      if (isEdit) {
        // admissionDate is not accepted by PATCH
        await updateStudent(base as UpdateStudentPayload)
        toast.success('Student updated successfully')
      } else {
        const created = await createStudent({
          ...base,
          admissionDate: v.admissionDate || '',
        } as CreateStudentPayload)

        // Documents were already uploaded to storage during Step 1;
        // now that the student exists, attach each one.
        for (const doc of pendingDocs) {
          await attachStudentDocument(created.data.id, doc)
        }
        toast.success('Student admitted successfully')
        onSuccess?.()
      }

      handleClose()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        toast.error('Please fix the highlighted errors before submitting')
      } else {
        toast.error((err as Error)?.message ?? 'Submission failed')
      }
    }
  }

  return (
    <Drawer
      title={isEdit ? `Edit — ${getFullName(student!)}` : 'New Student Admission'}
      open={open}
      onClose={handleClose}
      size="large"
      destroyOnClose
      afterOpenChange={handleAfterOpen}
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          {step > 0 && <Button onClick={() => setStep((s) => s - 1)}>Back</Button>}
          {step < STEPS.length - 1
            ? <Button type="primary" style={{ background: colors.primary }} onClick={goNext}>Save & Next</Button>
            : <Button type="primary" style={{ background: colors.primary }} loading={isSaving} onClick={onSubmit}>
              {isEdit ? 'Save Changes' : 'Submit Admission'}
            </Button>
          }
        </Space>
      }
    >
      <StepBar
        steps={STEPS.map((title) => ({ title }))}
        current={step}
        onChange={async (i) => {
          if (i > step) {
            try {
              if (step === 0) {
                await form.validateFields([
                  'firstName', 'middleName', 'lastName', 'dateOfBirth',
                  'gender', 'bloodGroup', 'parentPhone', 'parentEmail',
                  'addressPermanent', 'addressTemporary',
                ])
              } else if (step === 1) {
                await form.validateFields(
                  isEdit
                    ? ['academicYearId', 'classId', 'sectionId']
                    : ['admissionDate', 'academicYearId', 'classId', 'sectionId']
                )
              }
            } catch {
              toast.error('Please fix highlighted errors before changing step')
              return
            }
          }
          // Capture a fresh snapshot whenever we navigate to the Review step
          if (i === 2) setReviewValues({ ...form.getFieldsValue(true) })
          setStep(i)
        }}
        freeNavigation={isEdit}
      />

      <Form form={form} layout="vertical" requiredMark={false} preserve>

        {/* ── Step 0 ── */}
        {step === 0 && (
          <PersonalInfoStep
            photoUrl={photoUrl}
            onPhotoChange={(url, publicId) => {
              setPhotoUrl(url)
              setPhotoPublicId(publicId)
            }}
          />
        )}

        {/* ── Step 1 ── */}
        {step === 1 && (
          <>
            <Text strong style={{ fontSize: 13 }}>Academic Details</Text>
            <Row gutter={16} style={{ marginTop: 12, marginBottom: 4 }}>
              <Col span={12}>
                <Form.Item
                  name="admissionDate"
                  label="Admission Date (BS)"
                  rules={admissionDateValidationRules(isEdit, () => form.getFieldValue('dateOfBirth'))}
                  extra={isEdit ? 'Admission date cannot be changed.' : undefined}
                >
                  <NepaliDatePicker placeholder="मिति छान्नुहोस्" size="middle" locale="ne"
                    zIndex={1100} disabled={isEdit} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <AcademicYearSelect />
              </Col>
              <Col span={8}>
                <ClassSelect form={form} />
              </Col>
              <Col span={8}>
                <SectionSelect form={form} />
              </Col>
            </Row>
            <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 20, marginTop: 8 }}>
              <DocumentUploader
                studentId={student?.id}
                existingDocuments={student?.documents}
                pendingDocs={pendingDocs}
                onPendingDocsChange={setPendingDocs}
              />
            </div>
          </>
        )}

        {/* ── Step 2 — Review ── */}
        {step === 2 && (
          <ReviewStep
            values={reviewValues}
            photoUrl={photoUrl}
            studentId={student?.id}
            pendingDocs={pendingDocs} />
        )}
      </Form>
    </Drawer>
  )
}

// ─── REVIEW STEP ─────────────────────────────────────────────────────────────
// Standalone component so all hooks (Form.useWatch + data hooks) are called
// unconditionally — no Rules-of-Hooks violations from conditional rendering.
function ReviewStep({
  values,
  photoUrl,
  studentId,
  pendingDocs,
}: {
  values: Record<string, any>
  photoUrl: string | null
  studentId?: string,
  pendingDocs: AttachDocumentPayload[]
}) {
  const { data: savedDocuments = [] } = useStudentDocuments(studentId)
  const documents = studentId ? savedDocuments : pendingDocs
  const firstName = values?.firstName ?? ''
  const middleName = values?.middleName ?? ''
  const lastName = values?.lastName ?? ''

  const academicYearId = values?.academicYearId
  const classId = values?.classId
  const sectionId = values?.sectionId

  const { data: yearsData, isLoading: yearsLoading } = useAcademicYears()
  const { data: classesData, isLoading: classesLoading } = useClasses({
    academicYearId,
  })
  const { data: sectionsData, isLoading: sectionsLoading } = useSections({
    classId,
  })

  const yearLabel =
    yearsData?.data?.find((y) => y.id === academicYearId)?.name ?? '—'

  const classLabel =
    classesData?.data?.find((c) => c.id === classId)?.name ?? '—'

  const sectionLabel =
    sectionsData?.data?.find((s) => s.id === sectionId)?.name ?? '—'

  const fullName = [firstName, middleName, lastName]
    .filter(Boolean)
    .join(' ')

  const reviewValue = (value: unknown) => {
    if (value === undefined || value === null || value === '') return '—'
    return String(value)
  }

  return (
    <>
      <Text strong style={{ fontSize: 13 }}>
        Review & Submit
      </Text>

      {/* Profile Photo */}
      {photoUrl ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            margin: '16px 0',
          }}
        >
          <Image
            src={photoUrl}
            alt="Student"
            width={90}
            height={90}
            preview
            style={{
              borderRadius: 8,
              objectFit: 'cover',
              border: `2px solid ${colors.primaryBorder}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            }}
          />
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            margin: '16px 0',
          }}
        >
          <Avatar
            size={90}
            style={{
              background: colors.primaryLight,
              color: colors.primary,
              fontWeight: 700,
              fontSize: 24,
              border: `2px solid ${colors.primaryBorder}`,
            }}
          >
            {initials(fullName || 'Student')}
          </Avatar>
        </div>
      )}

      {/* Student Information */}
      <DescList
        rows={[
          {
            label: 'Full Name',
            value: fullName || '—',
          },
          {
            label: 'Date of Birth (BS)',
            value: reviewValue(values?.dateOfBirth),
          },
          {
            label: 'Gender',
            value: values?.gender ? titleCase(values.gender) : '—',
          },
          {
            label: 'Blood Group',
            value: reviewValue(values?.bloodGroup),
          },
          {
            label: 'Parent Phone',
            value: reviewValue(values?.parentPhone),
          },
          {
            label: 'Parent Email',
            value: reviewValue(values?.parentEmail),
          },
          {
            label: 'Permanent Address',
            value: reviewValue(values?.addressPermanent),
            span: 2,
          },
          {
            label: 'Temporary Address',
            value: reviewValue(values?.addressTemporary),
            span: 2,
          },
        ]}
        title="Student Information"
        style={{
          marginTop: 8,
          marginBottom: 16,
        }}
      />

      {/* Academic Details */}
      <DescList
        rows={[
          {
            label: 'Admission Date (BS)',
            value: reviewValue(values?.admissionDate),
          },
          {
            label: 'Admission Date (AD)',
            value: values?.admissionDate
              ? bsIsoToAdIso(values.admissionDate)
              : '—',
          },
          {
            label: 'Academic Year',
            value: yearsLoading ? <Spin size="small" /> : yearLabel,
          },
          {
            label: 'Class',
            value: classesLoading ? <Spin size="small" /> : classLabel,
          },
          {
            label: 'Section',
            value: sectionsLoading ? <Spin size="small" /> : sectionLabel,
          },
        ]}
        title="Academic Details"
        style={{
          marginBottom: 16,
        }}
      />

      {/* Documents */}
      <div
        style={{
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          padding: 16,
        }}
      >
        <Text
          strong
          style={{
            fontSize: 13,
            display: 'block',
            marginBottom: 10,
          }}
        >
          Documents
        </Text>

        {DOC_TYPES.map(({ type, label }) => {
          const uploaded = documents.some((d) => d.documentType === type)

          return (
            <div
              key={type}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <Text style={{ fontSize: 13 }}>
                {label}
              </Text>

              <Tag color={uploaded ? 'success' : 'default'}>
                {uploaded ? 'Uploaded' : 'Not uploaded'}
              </Tag>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ─── CASCADING ACADEMIC YEAR → CLASS → SECTION SELECTS ───────────────────────
// Each component reads the parent value from Form.useWatch and fetches
// the next level only when a value is selected. Clearing a parent resets
// the children automatically.

function AcademicYearSelect() {
  const { data, isLoading } = useAcademicYears()
  const years = data?.data ?? []

  const options = years.map((y) => ({
    label: `${y.name}${y.status === 'CURRENT' ? ' (Current)' : ''}`,
    value: y.id,
  }))

  return (
    <Form.Item name="academicYearId" label="Academic Year">
      <Select
        placeholder="Select academic year"
        loading={isLoading}
        options={options}
        allowClear
        showSearch
        filterOption={(input, opt) =>
          (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
        }
      />
    </Form.Item>
  )
}

function ClassSelect({ form }: { form: ReturnType<typeof Form.useForm>[0] }) {
  const academicYearId = Form.useWatch(
    'academicYearId',
    form
  ) as string | undefined

  const previousAcademicYearId = useRef<string | undefined>(undefined)

  const { data, isLoading } = useClasses({
    academicYearId,
  })

  const classes = data?.data ?? []

  useEffect(() => {
    if (
      previousAcademicYearId.current !== undefined &&
      previousAcademicYearId.current !== academicYearId
    ) {
      form.setFieldValue('classId', undefined)
      form.setFieldValue('sectionId', undefined)
    }

    previousAcademicYearId.current = academicYearId
  }, [academicYearId, form])

  const options = classes.map((c) => ({
    label: c.name,
    value: c.id,
  }))

  return (
    <Form.Item name="classId" label="Class">
      <Select
        placeholder={
          academicYearId
            ? 'Select class'
            : 'Select academic year first'
        }
        disabled={!academicYearId}
        loading={isLoading}
        options={options}
        allowClear
        showSearch
        filterOption={(input, opt) =>
          (opt?.label as string)
            ?.toLowerCase()
            .includes(input.toLowerCase())
        }
      />
    </Form.Item>
  )
}

function SectionSelect({
  form,
}: {
  form: ReturnType<typeof Form.useForm>[0]
}) {
  const classId = Form.useWatch(
    'classId',
    form
  ) as string | undefined

  const previousClassId = useRef<string | undefined>(undefined)

  const { data, isLoading } = useSections({
    classId,
  })

  const sections = data?.data ?? []

  useEffect(() => {
    if (
      previousClassId.current !== undefined &&
      previousClassId.current !== classId
    ) {
      form.setFieldValue('sectionId', undefined)
    }

    previousClassId.current = classId
  }, [classId, form])

  const options = sections.map((s) => ({
    label: s.name,
    value: s.id,
  }))

  return (
    <Form.Item name="sectionId" label="Section">
      <Select
        placeholder={
          classId
            ? 'Select section'
            : 'Select class first'
        }
        disabled={!classId}
        loading={isLoading}
        options={options}
        allowClear
        showSearch
        filterOption={(input, opt) =>
          (opt?.label as string)
            ?.toLowerCase()
            .includes(input.toLowerCase())
        }
      />
    </Form.Item>
  )
}