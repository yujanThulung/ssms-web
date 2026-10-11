import { useEffect, useMemo, useRef, useState } from 'react'
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs'
import type { FormInstance } from 'antd'
import {
  Avatar,
  Button,
  Col,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { SorterResult } from 'antd/es/table/interface'
import {
  Award,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck,
  PauseCircle,
  Plus,
  Trash2,
  XCircle,
  Edit,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

import { colors, radius } from '../../lib/designTokens'
import { usePermission } from '../../context/PermissionContext'
import { FEATURES, ACTIONS } from '../../utils/permissions'
import { AppTable } from '../../components/common/AppTable'
import { SearchAndFilter } from '../../components/common/SearchAndFilter'
import type { SmartColumn } from '../../components/common/SearchAndFilter'
import { KpiRow } from '../../components/common/KpiRow'
import type { KpiItem } from '../../components/common/KpiRow'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusChangeModal } from '../../components/common/StatusChangeModal'
import { TableSkeleton } from '../../components/skeleton'
import { NepaliDatePicker } from '../../components/nepali-calendar'
import { exportCsv } from '../../utils/csv'

import {
  useProgramAssignments,
  useCreateProgramAssignment,
  useUpdateProgramAssignment,
  useReviewProgramAssignment,
  useRemoveProgramAssignment,
  useProgramFeeCategories,
  useToggleAssignmentStatus,
  ProgramType,
  AssignmentStatus,
  ProgramValueType,
  type ProgramAssignment,
  type CreateAssignmentPayload,
  type AssignmentFormValues,
} from '../../features/program-assignments'
import { useDiscounts } from '../../features/discounts'
import { useScholarships } from '../../features/scholarships'
import { useAcademicYears } from '../../features/academic-years'
import { toListArray } from '../../features/fee-structures'
import { useStudents } from '../../features/students'
import { useClasses } from '../../features/classes'
import { useSections } from '../../features/sections'

const { Text } = Typography

// ─── Status Configuration ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AssignmentStatus,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  [AssignmentStatus.ACTIVE]: {
    label: 'Active',
    color: colors.success,
    bg: colors.successLight,
    border: '#b7eb8f',
    icon: <CheckCircle2 size={13} />,
  },
  [AssignmentStatus.PENDING_APPROVAL]: {
    label: 'Pending Approval',
    color: colors.warning,
    bg: colors.warningLight,
    border: '#ffe58f',
    icon: <Clock size={13} />,
  },
  [AssignmentStatus.INACTIVE]: {
    label: 'Inactive',
    color: colors.info,
    bg: colors.infoLight,
    border: '#bae6fd',
    icon: <PauseCircle size={13} />,
  },
  [AssignmentStatus.REJECTED]: {
    label: 'Rejected',
    color: colors.error,
    bg: colors.errorLight,
    border: '#ffbb96',
    icon: <XCircle size={13} />,
  },
  [AssignmentStatus.REMOVED]: {
    label: 'Removed',
    color: colors.muted,
    bg: colors.secondary,
    border: '#d9d9d9',
    icon: <Trash2 size={13} />,
  },
}

function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: colors.muted,
    bg: colors.secondary,
    border: colors.border,
    icon: null,
  }

  return (
    <Tag
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        color: config.color,
        backgroundColor: config.bg,
        borderColor: config.border,
        borderRadius: 6,
        fontWeight: 500,
        padding: '2px 8px',
      }}
    >
      {config.icon}
      {config.label}
    </Tag>
  )
}

function formatProgramValue(type: ProgramValueType | string, val: string | number): string {
  const num = typeof val === 'string' ? parseFloat(val) : val
  if (isNaN(num)) return '—'
  return type === ProgramValueType.PERCENTAGE ? `${num}%` : `Rs. ${num.toLocaleString('en-IN')}`
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

// ─── Student Selector Sub-components ─────────────────────────────────────────

/**
 * Renders cascading Academic Year → Class → Section → Student selects.
 * Mirrors the StudentPromote pattern.
 */
function StudentSelectorFields({
  form,
  disabled = false,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: FormInstance<any>
  disabled?: boolean
}) {
  const selectedAcademicYear = Form.useWatch('academicYearId', form) as string | undefined
  const selectedClassId = Form.useWatch('_classId', form) as string | undefined
  const selectedSectionId = Form.useWatch('_sectionId', form) as string | undefined

  const prevYear = useRef<string | undefined>(undefined)
  const prevClass = useRef<string | undefined>(undefined)
  const prevSection = useRef<string | undefined>(undefined)

  const { data: yearsRes } = useAcademicYears()
  const { data: classesRes, isLoading: classesLoading } = useClasses({
    academicYearId: selectedAcademicYear,
    requireAcademicYear: false,
  })
  const { data: sectionsRes, isLoading: sectionsLoading } = useSections({
    classId: selectedClassId,
    requireClassId: false,
  })
  const { data: studentsRes, isLoading: studentsLoading } = useStudents({
    academicYearId: selectedAcademicYear || undefined,
    classId: selectedClassId || undefined,
    sectionId: selectedSectionId || undefined,
    status: 'ACTIVE',
  })

  // Cascade: reset child selects on parent change
  useEffect(() => {
    if (prevYear.current !== undefined && prevYear.current !== selectedAcademicYear) {
      form.setFieldsValue({ _classId: undefined, _sectionId: undefined, studentId: undefined })
    }
    prevYear.current = selectedAcademicYear
  }, [selectedAcademicYear, form])

  useEffect(() => {
    if (prevClass.current !== undefined && prevClass.current !== selectedClassId) {
      form.setFieldsValue({ _sectionId: undefined, studentId: undefined })
    }
    prevClass.current = selectedClassId
  }, [selectedClassId, form])

  useEffect(() => {
    if (prevSection.current !== undefined && prevSection.current !== selectedSectionId) {
      form.setFieldValue('studentId', undefined)
    }
    prevSection.current = selectedSectionId
  }, [selectedSectionId, form])

  const yearOptions = (yearsRes?.data ?? []).map((y) => ({
    label: `${y.name}${y.status === 'CURRENT' ? ' (Current)' : ''}`,
    value: y.id,
  }))

  const classOptions = (classesRes?.data ?? []).map((c) => ({
    label: c.name,
    value: c.id,
  }))

  const sectionOptions = (sectionsRes?.data ?? []).map((s) => ({
    label: s.name,
    value: s.id,
  }))

  const studentOptions = (studentsRes?.data?.items ?? []).map((s) => {
    const fullName = s.fullName ?? [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ')
    const adm = s.admissionNumber ? `(${s.admissionNumber})` : ''
    return {
      label: `${fullName} ${adm}`.trim(),
      value: s.id,
      fullName,
      admissionNumber: s.admissionNumber,
      photoUrl: s.photoUrl,
    }
  })

  return (
    <>
      {/* Row 1: Academic Year + Class */}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="academicYearId"
            label="Academic Year"
            rules={[{ required: true, message: 'Please select academic year' }]}
          >
            <Select
              placeholder="Select academic year"
              options={yearOptions}
              disabled={disabled}
              allowClear
              showSearch
              filterOption={(input, opt) =>
                (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="_classId" label="Class">
            <Select
              placeholder={selectedAcademicYear ? 'Select class' : 'Select academic year first'}
              options={classOptions}
              disabled={disabled || !selectedAcademicYear}
              loading={classesLoading}
              allowClear
              showSearch
              filterOption={(input, opt) =>
                (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Row 2: Section + Student */}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="_sectionId" label="Section">
            <Select
              placeholder={selectedClassId ? 'Select section' : 'Select class first'}
              options={sectionOptions}
              disabled={disabled || !selectedClassId}
              loading={sectionsLoading}
              allowClear
              showSearch
              filterOption={(input, opt) =>
                (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="studentId"
            label="Student"
            rules={[{ required: true, message: 'Please select a student' }]}
          >
            <Select
              placeholder={selectedAcademicYear ? 'Select student' : 'Select academic year first'}
              disabled={disabled || !selectedAcademicYear}
              loading={studentsLoading}
              allowClear
              showSearch
              filterOption={(input, opt) =>
                (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              optionRender={(opt) => {
                const item = studentOptions.find((s) => s.value === opt.value)
                return (
                  <Space size={10}>
                    <Avatar
                      size={28}
                      src={item?.photoUrl ?? undefined}
                      icon={!item?.photoUrl ? <User size={14} /> : undefined}
                      style={{ background: colors.primaryLight, color: colors.primary, flexShrink: 0 }}
                    >
                      {!item?.photoUrl && item?.fullName ? initials(item.fullName) : undefined}
                    </Avatar>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{item?.fullName}</div>
                      {item?.admissionNumber && (
                        <div style={{ fontFamily: 'monospace', fontSize: 11, color: colors.muted }}>
                          {item.admissionNumber}
                        </div>
                      )}
                    </div>
                  </Space>
                )
              }}
              options={studentOptions}
              notFoundContent={
                studentsLoading ? (
                  <Skeleton active paragraph={{ rows: 2 }} />
                ) : (
                  <div style={{ textAlign: 'center', color: colors.muted, padding: 12 }}>
                    {selectedAcademicYear
                      ? 'No students found for selected filters'
                      : 'Select an academic year to list students'}
                  </div>
                )
              }
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROGRAM_TYPE_OPTIONS = [
  { label: 'Discount', value: ProgramType.DISCOUNT },
  { label: 'Scholarship', value: ProgramType.SCHOLARSHIP },
]

const STATUS_FILTER_OPTIONS = [
  { label: 'Active', value: AssignmentStatus.ACTIVE },
  { label: 'Pending Approval', value: AssignmentStatus.PENDING_APPROVAL },
  { label: 'Inactive', value: AssignmentStatus.INACTIVE },
  { label: 'Rejected', value: AssignmentStatus.REJECTED },
  { label: 'Removed', value: AssignmentStatus.REMOVED },
]

const CSV_HEADERS = [
  'Student Name', 'Admission No.', 'Program Type', 'Program Name',
  'Program Code', 'Value', 'Original Amount', 'Effective Date (BS)',
  'Expiry Date (BS)', 'Status', 'Academic Year', 'Assignment Reason', 'Created At',
]

function toCsvRow(a: ProgramAssignment) {
  const studentName = a.student ? `${a.student.firstName} ${a.student.lastName}` : '—'
  return [
    studentName,
    a.student?.admissionNumber || '—',
    a.programType,
    a.programName,
    a.programCode,
    formatProgramValue(a.programValueType, a.programValue),
    a.originalAmount ? `Rs. ${parseFloat(a.originalAmount).toFixed(2)}` : '—',
    a.effectiveDateBS || a.effectiveDate || '—',
    a.expiryDateBS || a.expiryDate || '—',
    a.status,
    a.academicYear?.name || '—',
    a.assignmentReason || '',
    a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '',
  ]
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProgramAssignmentsPage() {
  const { can } = usePermission()
  const canCreate =
    can(FEATURES.PROGRAM_ASSIGNMENT, ACTIONS.CREATE) ||
    can(FEATURES.PROGRAM_ASSIGNMENT, ACTIONS.ASSIGN)
  const canUpdate = can(FEATURES.PROGRAM_ASSIGNMENT, ACTIONS.UPDATE)
  const canApprove = can(FEATURES.PROGRAM_ASSIGNMENT, ACTIONS.APPROVE)
  const canDelete = can(FEATURES.PROGRAM_ASSIGNMENT, ACTIONS.DELETE)

  // ── URL query params ──
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))
  const [statusFilter, setStatusFilter] = useQueryState('status')
  const [programTypeFilter, setProgramTypeFilter] = useQueryState('programType')
  const [academicYearFilter, setAcademicYearFilter] = useQueryState('academicYearId')
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const [limit, setLimit] = useQueryState('limit', parseAsInteger.withDefault(10))
  const [sortBy, setSortBy] = useQueryState('sortBy', parseAsString.withDefault('createdAt'))
  const [sortOrder, setSortOrder] = useQueryState(
    'sortOrder',
    parseAsStringLiteral(['ASC', 'DESC'] as const).withDefault('DESC')
  )

  const TAB_STATUSES: AssignmentStatus[] = [
    AssignmentStatus.ACTIVE,
    AssignmentStatus.PENDING_APPROVAL,
    AssignmentStatus.INACTIVE,
  ]

  const activeStatusTab: AssignmentStatus =
    statusFilter && TAB_STATUSES.includes(statusFilter as AssignmentStatus)
      ? (statusFilter as AssignmentStatus)
      : AssignmentStatus.ACTIVE

  // ── UI states ──
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<ProgramAssignment | null>(null)
  const [viewingAssignment, setViewingAssignment] = useState<ProgramAssignment | null>(null)
  const [reviewingAssignment, setReviewingAssignment] = useState<ProgramAssignment | null>(null)
  const [removingAssignment, setRemovingAssignment] = useState<ProgramAssignment | null>(null)
  const [statusAssignment, setStatusAssignment] = useState<ProgramAssignment | null>(null)
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null)

  const [form] = Form.useForm<AssignmentFormValues & { _classId?: string; _sectionId?: string }>()
  const [reviewForm] = Form.useForm<{ status: 'APPROVED' | 'REJECTED'; reviewNote?: string }>()
  const [removeForm] = Form.useForm<{ removalReason?: string }>()

  const watchProgramType = Form.useWatch('programType', form)
  const watchDiscountId = Form.useWatch('discountId', form)
  const watchScholarshipId = Form.useWatch('scholarshipId', form)
  const reviewDecision = Form.useWatch('status', reviewForm)

  // ── Data fetching ──
  const listParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      status: (statusFilter as AssignmentStatus) || AssignmentStatus.ACTIVE,
      programType: (programTypeFilter as ProgramType) || undefined,
      academicYearId: academicYearFilter || undefined,
      sortBy,
      sortOrder,
    }),
    [page, limit, search, statusFilter, programTypeFilter, academicYearFilter, sortBy, sortOrder]
  )

  const { data, isLoading, isFetching } = useProgramAssignments(listParams)

  const assignments: ProgramAssignment[] = data?.data ?? []
  const meta = data?.meta

  // ── Reference data for filters ──
  const { data: academicYearsRes } = useAcademicYears()
  const { data: discountsRes } = useDiscounts({ limit: 200, status: 'ACTIVE' })
  const { data: scholarshipsRes } = useScholarships({ limit: 200, status: 'ACTIVE' })

  const academicYearOptions = useMemo(
    () =>
      toListArray(academicYearsRes).map((ay: { id: string; name: string; status: string }) => ({
        label: `${ay.name}${ay.status === 'CURRENT' ? ' (Current)' : ''}`,
        value: ay.id,
      })),
    [academicYearsRes]
  )

  // Applicable fee categories for the selected discount/scholarship program
  const selectedProgramId =
    watchProgramType === ProgramType.DISCOUNT
      ? watchDiscountId
      : watchProgramType === ProgramType.SCHOLARSHIP
        ? watchScholarshipId
        : undefined

  const {
    data: programFeeCategoriesRes,
    isFetching: programFeeCategoriesLoading,
  } = useProgramFeeCategories(watchProgramType, selectedProgramId)

  // Only fee categories applicable to the selected program are offered, so the
  // user can never pick an invalid combination.
  const applicableFeeCategoryOptions = useMemo(
    () =>
      toListArray<{ id: string; name: string }>(programFeeCategoriesRes).map((fc) => ({
        label: fc.name,
        value: fc.id,
      })),
    [programFeeCategoriesRes]
  )

  // While editing, the record's saved categories may include ones the current
  // program lookup no longer returns. Merge those in by name so the select
  // renders labels instead of raw ids.
  const feeCategorySelectOptions = useMemo(() => {
    const optionMap = new Map<string, { label: string; value: string }>()
    applicableFeeCategoryOptions.forEach((opt) => optionMap.set(opt.value, opt))
    editingAssignment?.feeCategories?.forEach((fc) => {
      if (fc?.id && typeof fc.name === 'string') {
        optionMap.set(fc.id, { label: fc.name, value: fc.id })
      }
    })
    return Array.from(optionMap.values())
  }, [applicableFeeCategoryOptions, editingAssignment])

  const discountOptions = useMemo(() => {
    return toListArray(discountsRes).map((d: { id: string; name: string; code: string; type: string; value: number }) => ({
      label: `${d.name} (${d.code}) — ${formatProgramValue(d.type, d.value)}`,
      value: d.id,
    }))
  }, [discountsRes])

  const scholarshipOptions = useMemo(() => {
    return toListArray(scholarshipsRes).map((s: { id: string; name: string; code: string; type: string; value: number }) => ({
      label: `${s.name} (${s.code}) — ${formatProgramValue(s.type, s.value)}`,
      value: s.id,
    }))
  }, [scholarshipsRes])

  // ── Mutations ──
  const { mutateAsync: createAssignment, isPending: isCreating } = useCreateProgramAssignment()
  const { mutateAsync: updateAssignment, isPending: isUpdating } = useUpdateProgramAssignment(
    editingAssignment?.id ?? ''
  )
  const { mutateAsync: reviewAssignment, isPending: isReviewing } = useReviewProgramAssignment()
  const { mutateAsync: removeAssignment, isPending: isRemoving } = useRemoveProgramAssignment()
  const { mutateAsync: toggleAssignmentStatus } = useToggleAssignmentStatus()

  const isSaving = isCreating || isUpdating

  // ── KPI cards ──
  const kpiCards = useMemo<KpiItem[]>(() => {
    const total = meta?.total ?? assignments.length
    const active = assignments.filter((a) => a.status === AssignmentStatus.ACTIVE).length
    const pending = assignments.filter((a) => a.status === AssignmentStatus.PENDING_APPROVAL).length
    const inactive = assignments.filter((a) => a.status === AssignmentStatus.INACTIVE).length
    const rejected = assignments.filter((a) => a.status === AssignmentStatus.REJECTED).length
    const removed = assignments.filter((a) => a.status === AssignmentStatus.REMOVED).length

    return [
      { key: 'total', icon: <Award size={18} />, label: 'Total', value: total, color: colors.primary, iconBg: colors.primaryLight },
      { key: 'active', icon: <CheckCircle2 size={18} />, label: 'Active', value: active, color: colors.success, iconBg: colors.successLight },
      { key: 'pending', icon: <Clock size={18} />, label: 'Pending', value: pending, color: colors.warning, iconBg: colors.warningLight },
      { key: 'inactive', icon: <PauseCircle size={18} />, label: 'Inactive', value: inactive, color: colors.info, iconBg: colors.infoLight },
      { key: 'rejected', icon: <XCircle size={18} />, label: 'Rejected', value: rejected, color: colors.error, iconBg: colors.errorLight },
      { key: 'removed', icon: <Trash2 size={18} />, label: 'Removed', value: removed, color: colors.muted, iconBg: colors.secondary },
    ]
  }, [meta?.total, assignments])

  // ── Handlers ──
  const handleStatusTabChange = (key: string) => {
    setStatusFilter(key as AssignmentStatus)
    setSearch('')
    setProgramTypeFilter(null)
    setAcademicYearFilter(null)
    setPage(1)
  }

  const handleOpenCreate = () => {
    setEditingAssignment(null)
    form.resetFields()
    form.setFieldsValue({ programType: ProgramType.DISCOUNT })
    setDrawerOpen(true)
  }

  const handleOpenEdit = (record: ProgramAssignment) => {
    setEditingAssignment(record)
    form.resetFields()
    form.setFieldsValue({
      studentId: record.studentId,
      academicYearId: record.academicYearId,
      feeCategoryIds: record.feeCategories?.map((fc) => fc.id) || [],
      programType: record.programType,
      discountId: record.discountId || undefined,
      scholarshipId: record.scholarshipId || undefined,
      effectiveDateBS: record.effectiveDateBS || record.effectiveDate,
      expiryDateBS: record.expiryDateBS || record.expiryDate || undefined,
      assignmentReason: record.assignmentReason || undefined,
    })
    setDrawerOpen(true)
  }

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (values.programType === ProgramType.DISCOUNT && !values.discountId) {
        toast.error('Please select a discount program')
        return
      }
      if (values.programType === ProgramType.SCHOLARSHIP && !values.scholarshipId) {
        toast.error('Please select a scholarship program')
        return
      }

      if (editingAssignment) {
        await updateAssignment({
          effectiveDate: values.effectiveDateBS,
          reason: values.assignmentReason,
        })
        toast.success('Assignment updated successfully')
      } else {
        const payload: CreateAssignmentPayload = {
          studentId: values.studentId,
          academicYearId: values.academicYearId,
          feeCategoryIds: values.feeCategoryIds,
          programType: values.programType,
          discountId: values.programType === ProgramType.DISCOUNT ? values.discountId : undefined,
          scholarshipId: values.programType === ProgramType.SCHOLARSHIP ? values.scholarshipId : undefined,
          effectiveDate: values.effectiveDateBS,
          expiryDate: values.expiryDateBS || null,
          assignmentReason: values.assignmentReason,
        }
        await createAssignment(payload)
        toast.success('Program assignment created successfully')
      }

      setDrawerOpen(false)
      form.resetFields()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        toast.error('Please check all required fields')
      } else {
        toast.error((err as Error)?.message ?? 'Failed to save assignment')
      }
    }
  }

  const handleReviewSubmit = async () => {
    if (!reviewingAssignment) return
    try {
      const values = await reviewForm.validateFields()
      await reviewAssignment({ id: reviewingAssignment.id, payload: values })
      toast.success(`Assignment ${values.status === 'APPROVED' ? 'approved' : 'rejected'} successfully`)
      setReviewingAssignment(null)
      reviewForm.resetFields()
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Failed to review assignment')
    }
  }

  const handleRemoveSubmit = async () => {
    if (!removingAssignment) return
    try {
      const values = await removeForm.validateFields()
      await removeAssignment({ id: removingAssignment.id, payload: { removalReason: values.removalReason } })
      toast.success('Assignment removed successfully')
      setRemovingAssignment(null)
      removeForm.resetFields()
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Failed to remove assignment')
    }
  }

  const handleToggleStatus = (record: ProgramAssignment) => {
    setStatusAssignment(record)
  }

  const handleStatusChangeConfirm = async (nextStatus: AssignmentStatus) => {
    if (!statusAssignment) return
    setPendingStatusId(statusAssignment.id)
    try {
      await toggleAssignmentStatus({ id: statusAssignment.id, status: nextStatus })
      toast.success(
        nextStatus === AssignmentStatus.INACTIVE
          ? 'Assignment deactivated'
          : 'Assignment activated'
      )
      setStatusAssignment(null)
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Failed to update assignment status')
      throw err
    } finally {
      setPendingStatusId(null)
    }
  }

  const handleExportCsv = () => {
    const ok = exportCsv('program-assignments', CSV_HEADERS, assignments.map(toCsvRow))
    if (!ok) toast.warning('No assignments to export')
    else toast.success('Exported to CSV')
  }

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: unknown,
    sorter: SorterResult<ProgramAssignment> | SorterResult<ProgramAssignment>[]
  ) => {
    if (pagination.current) setPage(pagination.current)
    if (pagination.pageSize) { setLimit(pagination.pageSize); setPage(1) }
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter
    if (!activeSorter?.order || !activeSorter.columnKey) return
    setSortBy(activeSorter.columnKey as string)
    setSortOrder(activeSorter.order === 'ascend' ? 'ASC' : 'DESC')
    setPage(1)
  }

  // ── Filter columns for SearchAndFilter ──
  const filterColumns: SmartColumn[] = [
    { key: 'search', title: 'Student / Program Name', isSearchable: true },
    { key: 'status', title: 'Status', isFilterable: true, filterWidth: 160, filterOptions: STATUS_FILTER_OPTIONS },
    { key: 'programType', title: 'Program Type', isFilterable: true, filterWidth: 150, filterOptions: PROGRAM_TYPE_OPTIONS },
    { key: 'academicYearId', title: 'Academic Year', isFilterable: true, filterWidth: 160, filterOptions: academicYearOptions },
  ]

  // ── Table columns ──
  const columns: ColumnsType<ProgramAssignment> = [
    {
      title: 'Student',
      key: 'student',
      width: 200,
      render: (_: unknown, record: ProgramAssignment) => {
        const fullName = record.student
          ? `${record.student.firstName} ${record.student.lastName}`
          : '—'
        return (
          <Space size={10}>
            <Avatar
              size={36}
              icon={<User size={16} />}
              style={{ background: colors.primaryLight, color: colors.primary, flexShrink: 0 }}
            >
              {fullName !== '—' ? initials(fullName) : undefined}
            </Avatar>
            <div>
              <div style={{ fontWeight: 600, color: colors.text, lineHeight: 1.3 }}>{fullName}</div>
              {record.student?.admissionNumber && (
                <div style={{ fontSize: 11, color: colors.muted, fontFamily: 'monospace' }}>
                  {record.student.admissionNumber}
                </div>
              )}
            </div>
          </Space>
        )
      },
    },
    {
      title: 'Program',
      key: 'programName',
      width: 200,
      render: (_: unknown, record: ProgramAssignment) => (
        <div>
          <Tooltip title={record.programName}>
            <span style={{ fontWeight: 500, display: 'block', maxWidth: 175, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.programName}
            </span>
          </Tooltip>
          <div style={{ marginTop: 2 }}>
            <Tag
              color={record.programType === ProgramType.DISCOUNT ? 'purple' : 'blue'}
              style={{ borderRadius: 6, fontSize: 11 }}
            >
              {record.programType}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Code',
      key: 'programCode',
      width: 120,
      render: (_: unknown, record: ProgramAssignment) => (
        <Tag color="blue" style={{ fontFamily: 'monospace', borderRadius: 6, fontSize: 12 }}>
          {record.programCode}
        </Tag>
      ),
    },
    {
      title: 'Value',
      key: 'programValue',
      width: 120,
      render: (_: unknown, record: ProgramAssignment) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: colors.primary }}>
          {formatProgramValue(record.programValueType, record.programValue)}
        </span>
      ),
    },
    {
      title: 'Fee Categories',
      dataIndex: 'feeCategories',
      key: 'feeCategories',
      width: 180,
      render: (categories: any[]) =>
        categories && categories.length > 0 ? (
          <Space size={4} wrap>
            {categories.map((c) => (
              <Tag key={c.id} style={{ borderRadius: 6, margin: 0 }}>{c.name}</Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Effective (BS)',
      key: 'effectiveDate',
      width: 130,
      sorter: true,
      render: (_: unknown, record: ProgramAssignment) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {record.effectiveDateBS || record.effectiveDate || '—'}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: AssignmentStatus, record: ProgramAssignment) => {
        const isPending = status === AssignmentStatus.PENDING_APPROVAL
        const canToggle =
          canUpdate && status === AssignmentStatus.ACTIVE
        const clickable = canToggle || (canApprove && isPending)
        return (
          <div
            onClick={(e) => {
              if (!clickable) return
              e.stopPropagation()
              if (canToggle) {
                handleToggleStatus(record)
              } else if (isPending) {
                setReviewingAssignment(record)
                reviewForm.setFieldsValue({ status: 'APPROVED' })
              }
            }}
            title={
              canToggle
                ? 'Change Status'
                : isPending && canApprove
                  ? 'Review (Approve/Reject)'
                  : undefined
            }
            style={{
              display: 'inline-block',
              cursor: clickable ? 'pointer' : 'default',
              opacity: pendingStatusId === record.id ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <AssignmentStatusBadge status={status} />
          </div>
        )
      },
    },
    {
      title: 'Academic Year',
      key: 'academicYear',
      width: 130,
      render: (_: unknown, record: ProgramAssignment) => record.academicYear?.name || '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 180,
      align: 'center',
      render: (_: unknown, record: ProgramAssignment) => (
        <Space size={6} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View details">
            <Button
              type="default"
              size="small"
              icon={<Eye size={14} />}
              onClick={() => setViewingAssignment(record)}
              style={{ borderRadius: radius.sm, borderColor: colors.border, color: colors.muted }}
            />
          </Tooltip>

          {canApprove && record.status === AssignmentStatus.PENDING_APPROVAL && (
            <Tooltip title="Review (Approve/Reject)">
              <Button
                type="default"
                size="small"
                icon={<FileCheck size={14} />}
                onClick={() => {
                  setReviewingAssignment(record)
                  reviewForm.setFieldsValue({ status: 'APPROVED' })
                }}
                style={{ borderRadius: radius.sm, borderColor: colors.warning, color: colors.warning }}
              />
            </Tooltip>
          )}

          {canUpdate && record.status === AssignmentStatus.ACTIVE && (
            <Tooltip title="Deactivate (set inactive)">
              <Button
                type="default"
                size="small"
                icon={<PauseCircle size={14} />}
                onClick={() => handleToggleStatus(record)}
                style={{ borderRadius: radius.sm, borderColor: colors.info, color: colors.info }}
              />
            </Tooltip>
          )}

          {canUpdate && record.status === AssignmentStatus.PENDING_APPROVAL && (
            <Tooltip title="Edit assignment">
              <Button
                type="default"
                size="small"
                icon={<Edit size={14} />}
                onClick={() => handleOpenEdit(record)}
                style={{ borderRadius: radius.sm, borderColor: colors.border, color: colors.muted }}
              />
            </Tooltip>
          )}

          {canDelete &&
            (record.status === AssignmentStatus.ACTIVE ||
              record.status === AssignmentStatus.PENDING_APPROVAL) && (
              <Tooltip title="Remove assignment">
                <Button
                  type="default"
                  size="small"
                  icon={<Trash2 size={14} />}
                  danger
                  onClick={() => { setRemovingAssignment(record); removeForm.resetFields() }}
                  style={{ borderRadius: radius.sm }}
                />
              </Tooltip>
            )}
        </Space>
      ),
    },
  ]

  // ── Render ──
  return (
    <div>
      {/* ── Header ── */}
      <PageHeader
        title="Program Assignments"
        description="Assign discounts and scholarships to individual students with approval workflows and full audit trail"
        actions={
          <>
            <Button icon={<Download size={15} />} onClick={handleExportCsv}>Export CSV</Button>
            {canCreate && (
              <Button
                type="primary"
                icon={<Plus size={15} />}
                style={{ background: colors.primary }}
                onClick={handleOpenCreate}
              >
                Assign Program
              </Button>
            )}
          </>
        }
      />

      {/* ── Status Tabs: Active / Pending Approval / Inactive ── */}
      <Tabs
        activeKey={activeStatusTab}
        onChange={handleStatusTabChange}
        size="large"
        style={{ marginBottom: 16 }}
        items={[
          {
            key: AssignmentStatus.ACTIVE,
            label: 'Active',
          },
          {
            key: AssignmentStatus.PENDING_APPROVAL,
            label: 'Pending Approval',
          },
          {
            key: AssignmentStatus.INACTIVE,
            label: 'Inactive',
          },
        ]}
      />

      {/* ── KPI Cards ── */}
      <KpiRow items={kpiCards} loading={isLoading} />

      {/* ── Search & Filter ── */}
      <SearchAndFilter
        columns={filterColumns}
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setPage(1) }}
        debounceMs={300}
        filterValues={{
          status: statusFilter || undefined,
          programType: programTypeFilter || undefined,
          academicYearId: academicYearFilter || undefined,
        }}
        onFilterChange={(key, val) => {
          if (key === 'status') setStatusFilter(val || null)
          if (key === 'programType') setProgramTypeFilter(val || null)
          if (key === 'academicYearId') setAcademicYearFilter(val || null)
          setPage(1)
        }}
      />

      {/* ── Table ── */}
      {isLoading ? (
        <div style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <TableSkeleton rows={Math.min(limit, 5)} columns={8} />
        </div>
      ) : (
        <AppTable<ProgramAssignment>
          rowKey="id"
          columns={columns}
          dataSource={assignments}
          loading={isFetching}
          onRowClick={(record) => setViewingAssignment(record)}
          onChange={handleTableChange}
          pagination={{
            current: page,
            pageSize: limit,
            total: meta?.total ?? assignments.length,
            showSizeChanger: true,
          }}
          scroll={{ x: 1300 }}
          locale={{ emptyText: 'No program assignments found.' }}
        />
      )}

      {/* ── Create / Edit Drawer ── */}
      <Drawer
        title={
          editingAssignment
            ? `Edit Assignment — ${editingAssignment.programName}`
            : 'Assign Program to Student'
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        size="large"
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              style={{ background: colors.primary }}
              loading={isSaving}
              onClick={handleFormSubmit}
            >
              {editingAssignment ? 'Save Changes' : 'Create Assignment'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" requiredMark>
          {/* ── Student Selection: Cascading Academic Year → Class → Section → Student ── */}
          {!editingAssignment && (
            <>
              <StudentSelectorFields form={form} disabled={false} />
            </>
          )}

          {editingAssignment && (
            <div
              style={{
                marginBottom: 20,
                padding: '12px 14px',
                background: colors.surfaceAlt,
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ fontSize: 11, color: colors.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Student
              </div>
              <div style={{ fontWeight: 600 }}>
                {editingAssignment.student
                  ? `${editingAssignment.student.firstName} ${editingAssignment.student.lastName}`
                  : editingAssignment.studentId}
              </div>
              {editingAssignment.student?.admissionNumber && (
                <div style={{ fontSize: 12, color: colors.muted, fontFamily: 'monospace' }}>
                  {editingAssignment.student.admissionNumber}
                </div>
              )}
            </div>
          )}

          {/* ── Program Type ── */}
          <Row gutter={16}>
            <Col span={editingAssignment ? 24 : 12}>
              <Form.Item
                name="programType"
                label="Program Type"
                rules={[{ required: true, message: 'Please select program type' }]}
              >
                <Select
                  placeholder="Select type"
                  options={PROGRAM_TYPE_OPTIONS}
                  disabled={Boolean(editingAssignment)}
                  onChange={() => {
                    form.setFieldValue('discountId', undefined)
                    form.setFieldValue('scholarshipId', undefined)
                    form.setFieldValue('feeCategoryIds', undefined)
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Discount / Scholarship Selector ── */}
          {watchProgramType === ProgramType.DISCOUNT && (
            <Form.Item
              name="discountId"
              label="Select Discount Program"
              rules={[{ required: true, message: 'Please select a discount' }]}
            >
              <Select
                showSearch
                placeholder="Choose active discount program…"
                options={discountOptions}
                disabled={Boolean(editingAssignment)}
                onChange={() => form.setFieldValue('feeCategoryIds', undefined)}
                filterOption={(input, opt) =>
                  (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          )}

          {watchProgramType === ProgramType.SCHOLARSHIP && (
            <Form.Item
              name="scholarshipId"
              label="Select Scholarship Program"
              rules={[{ required: true, message: 'Please select a scholarship' }]}
            >
              <Select
                showSearch
                placeholder="Choose active scholarship program…"
                options={scholarshipOptions}
                disabled={Boolean(editingAssignment)}
                onChange={() => form.setFieldValue('feeCategoryIds', undefined)}
                filterOption={(input, opt) =>
                  (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          )}

          {/* ── Fee Categories ── */}
          <Form.Item
            name="feeCategoryIds"
            label="Applicable Fee Categories"
            extra={
              selectedProgramId
                ? programFeeCategoriesLoading
                  ? 'Loading applicable categories…'
                  : undefined
                : watchProgramType
                  ? 'Select a discount or scholarship program to see applicable fee categories.'
                  : 'Select program type and then a program to see applicable fee categories.'
            }
            rules={[{ required: true, message: 'Select at least one fee category' }]}
          >
            <Select
              mode="multiple"
              placeholder={
                selectedProgramId
                  ? programFeeCategoriesLoading
                    ? 'Loading…'
                    : 'Select fee categories to cover…'
                  : watchProgramType
                    ? 'Select a program first'
                    : 'Select program type first'
              }
              options={feeCategorySelectOptions}
              disabled={Boolean(editingAssignment) || !selectedProgramId}
              loading={programFeeCategoriesLoading}
            />
          </Form.Item>

          {/* ── Dates ── */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="effectiveDateBS"
                label="Effective Date (BS)"
                rules={[{ required: true, message: 'Please select effective date' }]}
              >
                <NepaliDatePicker placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expiryDateBS" label="Expiry Date (BS) — Optional">
                <NepaliDatePicker placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Assignment Reason ── */}
          <Form.Item name="assignmentReason" label="Assignment Reason / Notes">
            <Input.TextArea
              rows={3}
              placeholder="e.g. Merit award, early registration discount…"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Drawer>

      {/* ── Review Modal ── */}
      <Modal
        title="Review Program Assignment"
        open={Boolean(reviewingAssignment)}
        onCancel={() => setReviewingAssignment(null)}
        onOk={handleReviewSubmit}
        confirmLoading={isReviewing}
        okText="Submit Review"
        destroyOnClose
      >
        {reviewingAssignment && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: colors.surfaceAlt, borderRadius: 8 }}>
              <div style={{ fontWeight: 600 }}>
                {reviewingAssignment.student
                  ? `${reviewingAssignment.student.firstName} ${reviewingAssignment.student.lastName}`
                  : reviewingAssignment.studentId}
              </div>
              <div style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                {reviewingAssignment.programName} ({reviewingAssignment.programCode})
              </div>
              <div style={{ color: colors.primary, fontWeight: 700, marginTop: 4 }}>
                {formatProgramValue(reviewingAssignment.programValueType, reviewingAssignment.programValue)}
              </div>
            </div>
            <Form form={reviewForm} layout="vertical">
              <Form.Item name="status" label="Decision" rules={[{ required: true, message: 'Please select a decision' }]}>
                <Radio.Group buttonStyle="solid">
                  <Radio.Button
                    value="APPROVED"
                    style={{ color: reviewDecision === 'APPROVED' ? '#ffffff' : colors.success }}
                  >
                    ✓ Approve
                  </Radio.Button>
                  <Radio.Button
                    value="REJECTED"
                    style={{ color: reviewDecision === 'REJECTED' ? '#ffffff' : colors.error }}
                  >
                    ✗ Reject
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="reviewNote" label="Review Note">
                <Input.TextArea rows={3} placeholder="Reason for approval or rejection…" maxLength={500} showCount />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* ── Remove Modal ── */}
      <Modal
        title="Remove Assignment"
        open={Boolean(removingAssignment)}
        onCancel={() => setRemovingAssignment(null)}
        onOk={handleRemoveSubmit}
        confirmLoading={isRemoving}
        okText="Remove"
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        {removingAssignment && (
          <div>
            <p style={{ color: colors.error }}>
              This will mark the assignment as <strong>REMOVED</strong>. It will not be physically deleted.
            </p>
            <div style={{ marginBottom: 16, padding: '8px 12px', background: colors.surfaceAlt, borderRadius: 8, fontSize: 13 }}>
              <strong>Student:</strong>{' '}
              {removingAssignment.student
                ? `${removingAssignment.student.firstName} ${removingAssignment.student.lastName}`
                : '—'}
              <br />
              <strong>Program:</strong> {removingAssignment.programName}
            </div>
            <Form form={removeForm} layout="vertical">
              <Form.Item name="removalReason" label="Removal Reason">
                <Input.TextArea rows={3} placeholder="Reason for removal…" maxLength={500} showCount />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* ── View Details Drawer ── */}
      <Drawer
        title="Assignment Details"
        open={Boolean(viewingAssignment)}
        onClose={() => setViewingAssignment(null)}
        size="large"
      >
        {viewingAssignment && (
          <Space direction="vertical" style={{ width: '100%' }} size={20}>
            <Descriptions title="Student & Assignment" bordered column={2} size="small">
              <Descriptions.Item label="Student Name">
                {viewingAssignment.student
                  ? `${viewingAssignment.student.firstName} ${viewingAssignment.student.lastName}`
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Admission No.">
                <span style={{ fontFamily: 'monospace' }}>
                  {viewingAssignment.student?.admissionNumber || '—'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Academic Year">
                {viewingAssignment.academicYear?.name || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <AssignmentStatusBadge status={viewingAssignment.status} />
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="Program Details" bordered column={2} size="small">
              <Descriptions.Item label="Program Name">{viewingAssignment.programName}</Descriptions.Item>
              <Descriptions.Item label="Program Code">
                <Tag color="blue" style={{ fontFamily: 'monospace' }}>{viewingAssignment.programCode}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Type">{viewingAssignment.programType}</Descriptions.Item>
              <Descriptions.Item label="Value">
                <strong style={{ color: colors.primary }}>
                  {formatProgramValue(viewingAssignment.programValueType, viewingAssignment.programValue)}
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Base Amount">
                {viewingAssignment.originalAmount
                  ? `Rs. ${parseFloat(viewingAssignment.originalAmount).toLocaleString('en-IN')}`
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Effective Date">
                {viewingAssignment.effectiveDateBS || viewingAssignment.effectiveDate || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Expiry Date">
                {viewingAssignment.expiryDateBS || viewingAssignment.expiryDate || 'No expiry'}
              </Descriptions.Item>
              <Descriptions.Item label="Fee Categories" span={2}>
                <Space size={4} wrap>
                  {viewingAssignment.feeCategories?.map((fc) => (
                    <Tag key={fc.id}>{fc.name}</Tag>
                  )) || '—'}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="Audit Trail" bordered column={1} size="small">
              <Descriptions.Item label="Assignment Reason">
                {viewingAssignment.assignmentReason || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Assigned By">
                {viewingAssignment.assignedByUser
                  ? `${viewingAssignment.assignedByUser.firstName} ${viewingAssignment.assignedByUser.lastName}`
                  : viewingAssignment.assignedBy || '—'}
              </Descriptions.Item>
              {viewingAssignment.reviewedAt && (
                <>
                  <Descriptions.Item label="Reviewed At">
                    {new Date(viewingAssignment.reviewedAt).toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Review Note">
                    {viewingAssignment.reviewNote || '—'}
                  </Descriptions.Item>
                </>
              )}
              {viewingAssignment.removalReason && (
                <Descriptions.Item label="Removal Reason">
                  {viewingAssignment.removalReason}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Assigned Date">
                {viewingAssignment.assignedDateBS || (viewingAssignment.assignedDate ? new Date(viewingAssignment.assignedDate).toLocaleDateString() : '—')}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Drawer>

      {/* ── Status Change Modal (Active ↔ Inactive) ── */}
      <StatusChangeModal<AssignmentStatus>
        open={Boolean(statusAssignment)}
        onClose={() => setStatusAssignment(null)}
        subject={
          statusAssignment
            ? `${statusAssignment.programName} — ${
                statusAssignment.student
                  ? `${statusAssignment.student.firstName} ${statusAssignment.student.lastName}`
                  : statusAssignment.studentId
              }`
            : undefined
        }
        currentLabel={
          statusAssignment?.status === AssignmentStatus.ACTIVE
            ? 'Active'
            : statusAssignment?.status === AssignmentStatus.INACTIVE
              ? 'Inactive'
              : ''
        }
        currentColor={
          statusAssignment?.status === AssignmentStatus.ACTIVE ? 'success' : 'warning'
        }
        options={
          statusAssignment?.status === AssignmentStatus.ACTIVE
            ? [
                {
                  value: AssignmentStatus.INACTIVE,
                  label: 'Inactive',
                  color: 'warning',
                  help: 'The assignment will be temporarily disabled. The record remains intact and can be re-activated anytime.',
                },
              ]
            : [
                {
                  value: AssignmentStatus.ACTIVE,
                  label: 'Active',
                  color: 'success',
                  help: 'The assignment will be re-enabled and take effect for the student.',
                },
              ]
        }
        onConfirm={handleStatusChangeConfirm}
        loading={pendingStatusId === statusAssignment?.id}
        okText={statusAssignment?.status === AssignmentStatus.ACTIVE ? 'Deactivate' : 'Activate'}
      />
    </div>
  )
}
