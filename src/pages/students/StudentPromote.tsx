import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Avatar,
  Button,
  Card,
  Checkbox,
  Col,
  Empty,
  Form,
  InputNumber,
  Modal,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'

import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  CheckOutlined,
  CloseCircleFilled,
  LeftOutlined,
  LoadingOutlined,
  TeamOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { colors, radius, shadow } from '../../lib/designTokens'
import { StepBar } from '../../components/common/StepBar'
import { AppTable } from '../../components/common/AppTable'
import { SearchAndFilter } from '../../components/common/SearchAndFilter'
import type { SmartColumn } from '../../components/common/SearchAndFilter'
import { useStudents, useBulkPromote } from '../../features/students'
import { useAcademicYears } from '../../features/academic-years'
import { useClasses } from '../../features/classes'
import { useSections } from '../../features/sections'

const { Title, Text } = Typography

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface StudentEnrollment {
  academicYearId: string
  academicYearName: string
  classId: string
  className: string
  sectionId: string
  sectionName: string
  rollNumber: string | number | null
}

interface Student {
  id: string
  admissionNo: string
  fullName: string
  photo: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED'
  enrollment: StudentEnrollment | null
}

type RollNumberStrategy = 'KEEP' | 'AUTO' | 'CUSTOM'

interface PromoteConfig {
  targetAcademicYearId: string
  targetClassId: string
  targetSectionId: string
  rollNumberStrategy: RollNumberStrategy
  startingRollNumber?: number
}

interface PromotionResult {
  studentId: string
  fullName: string
  admissionNo: string
  currentClass: string
  currentSection: string
  currentRoll: string | number | null
  targetClass: string
  targetSection: string
  targetRoll: string | number | null
  success: boolean
  reason?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data
// Replace these with your API/query data later.
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const MOCK_STUDENTS: Student[] = [
  {
    id: 'stu-1',
    admissionNo: 'ADM-2081-001',
    fullName: 'Aarav Sharma',
    photo: null,
    status: 'ACTIVE',
    enrollment: {
      academicYearId: 'yr-1',
      academicYearName: '2081/82',
      classId: 'cls-5',
      className: 'Class 5',
      sectionId: 'sec-a',
      sectionName: 'A',
      rollNumber: 1,
    },
  },
  {
    id: 'stu-2',
    admissionNo: 'ADM-2081-002',
    fullName: 'Priya Thapa',
    photo: null,
    status: 'ACTIVE',
    enrollment: {
      academicYearId: 'yr-1',
      academicYearName: '2081/82',
      classId: 'cls-5',
      className: 'Class 5',
      sectionId: 'sec-a',
      sectionName: 'A',
      rollNumber: 2,
    },
  },
  {
    id: 'stu-5',
    admissionNo: 'ADM-2081-004',
    fullName: 'Bikash Gurung',
    photo: null,
    status: 'ACTIVE',
    enrollment: {
      academicYearId: 'yr-1',
      academicYearName: '2081/82',
      classId: 'cls-5',
      className: 'Class 5',
      sectionId: 'sec-b',
      sectionName: 'B',
      rollNumber: 3,
    },
  },
  {
    id: 'stu-3',
    admissionNo: 'ADM-2081-003',
    fullName: 'Rohan Adhikari',
    photo: null,
    status: 'ACTIVE',
    enrollment: {
      academicYearId: 'yr-1',
      academicYearName: '2081/82',
      classId: 'cls-6',
      className: 'Class 6',
      sectionId: 'sec-b',
      sectionName: 'B',
      rollNumber: 5,
    },
  },
  {
    id: 'stu-6',
    admissionNo: 'ADM-2081-005',
    fullName: 'Anita Karki',
    photo: null,
    status: 'ACTIVE',
    enrollment: {
      academicYearId: 'yr-1',
      academicYearName: '2081/82',
      classId: 'cls-6',
      className: 'Class 6',
      sectionId: 'sec-a',
      sectionName: 'A',
      rollNumber: 1,
    },
  },
  {
    id: 'stu-7',
    admissionNo: 'ADM-2081-006',
    fullName: 'Dipesh Bhandari',
    photo: null,
    status: 'ACTIVE',
    enrollment: {
      academicYearId: 'yr-1',
      academicYearName: '2081/82',
      classId: 'cls-6',
      className: 'Class 6',
      sectionId: 'sec-a',
      sectionName: 'A',
      rollNumber: 2,
    },
  },
  {
    id: 'stu-4',
    admissionNo: 'ADM-2080-015',
    fullName: 'Sita Rai',
    photo: null,
    status: 'INACTIVE',
    enrollment: null,
  },
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const MOCK_ACADEMIC_YEARS = [
  {
    label: '2081/82',
    value: 'yr-1',
    current: true,
  },
  {
    label: '2082/83',
    value: 'yr-2',
    current: false,
  },
]

const MOCK_CLASSES = [
  { label: 'Class 1', value: 'cls-1' },
  { label: 'Class 2', value: 'cls-2' },
  { label: 'Class 3', value: 'cls-3' },
  { label: 'Class 4', value: 'cls-4' },
  { label: 'Class 5', value: 'cls-5' },
  { label: 'Class 6', value: 'cls-6' },
  { label: 'Class 7', value: 'cls-7' },
  { label: 'Class 8', value: 'cls-8' },
  { label: 'Class 9', value: 'cls-9' },
  { label: 'Class 10', value: 'cls-10' },
]

const MOCK_SECTIONS = [
  { label: 'Section A', shortLabel: 'A', value: 'sec-a' },
  { label: 'Section B', shortLabel: 'B', value: 'sec-b' },
  { label: 'Section C', shortLabel: 'C', value: 'sec-c' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getClassNumber(classId?: string) {
  if (!classId) return null

  const match = classId.match(/\d+/)
  return match ? Number(match[0]) : null
}

function getNextClassId(classId?: string) {
  const currentNumber = getClassNumber(classId)

  if (!currentNumber || currentNumber >= 10) {
    return undefined
  }

  return `cls-${currentNumber + 1}`
}

function getTargetRoll(
  student: Student,
  index: number,
  strategy: RollNumberStrategy,
  startingRollNumber?: number,
) {
  if (strategy === 'KEEP') {
    return student.enrollment?.rollNumber ?? null
  }

  if (strategy === 'CUSTOM') {
    return (startingRollNumber ?? 1) + index
  }

  return index + 1
}

const STEPS = [
  'Select students',
  'Promotion details',
  'Review & promote',
]

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function StudentPromote() {
  const navigate = useNavigate()
  const [form] = Form.useForm<PromoteConfig>()

  const [step, setStep] = useState(0)

  // ── Real data ──────────────────────────────────────────────────────────────
  // NOTE: useStudents is called further down once filter state is declared.
  // We hoist the bulkPromote mutation here.
  const { mutateAsync: bulkPromote } = useBulkPromote()

  const { data: yearsData, isPending: yearsLoading } = useAcademicYears()
  const { data: classesData, isPending: classesLoading } = useClasses({ requireAcademicYear: false })
  const { data: sectionsData, isPending: sectionsLoading } = useSections({ requireClassId: false })

  // Build option arrays from real API data
  const academicYearOptions = useMemo(() =>
    (yearsData?.data ?? []).map((y) => ({
      label: y.status === 'CURRENT' ? `${y.name} (Current)` : `${y.name} (Upcoming)`,
      value: y.id
    })),
    [yearsData],
  )

  const classOptions = useMemo(() =>
    (classesData?.data ?? []).map((c) => ({ label: c.name, value: c.id, academicYearId: c.academicYearId })),
    [classesData],
  )

  const sectionOptions = useMemo(() =>
    (sectionsData?.data ?? []).map((s) => ({ label: s.name, value: s.id, shortLabel: s.name, classId: s.classId })),
    [sectionsData],
  )


  // ── Search & filter state (server-side) ───────────────────────────────────
  const [searchInput, setSearchInput] = useState('')       // raw input value (shown in UI)
  const [debouncedSearch, setDebouncedSearch] = useState('') // sent to API after 400 ms
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>()
  const [filterClass, setFilterClass] = useState<string>()
  const [filterSection, setFilterSection] = useState<string>()
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  // Debounce search input → API param
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const handleSearchChange = useCallback((val: string) => {
    setSearchInput(val)
    setPage(1)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setDebouncedSearch(val.trim()), 400)
  }, [])
  useEffect(() => () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }, [])

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // ── Server-side student fetch (params sent to GET /students) ────────────────
  const { data: studentsData, isPending: studentsLoading } = useStudents({
    status: 'ACTIVE',
    isEnrolled: true,
    search: debouncedSearch || undefined,
    academicYearId: filterAcademicYear || undefined,
    classId: filterClass || undefined,
    sectionId: filterSection || undefined,
    page,
    limit: PAGE_SIZE,
  })

  // All students with an active enrollment
  const eligibleStudents = useMemo(() => {
    const allStudents = studentsData?.data?.items ?? []
    return allStudents.filter(
      (s) => s.status === 'ACTIVE',
    ).map((s) => {
      const en = s.currentEnrollment ?? s.enrollment
      const ayId = en?.academicYearId ?? en?.academicYear?.id
      const clsId = en?.classId ?? en?.class?.id
      const secId = en?.sectionId ?? en?.section?.id

      return {
        id: s.id,
        admissionNo: s.admissionNumber,
        fullName: s.fullName ?? [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' '),
        photo: s.photoUrl ?? null,
        status: s.status as Student['status'],
        enrollment: en ? {
          academicYearId: ayId ?? '',
          academicYearName: en.academicYearName ?? en.academicYear?.name ?? yearsData?.data?.find((y) => y.id === ayId)?.name ?? ayId ?? '',
          classId: clsId ?? '',
          className: en.className ?? en.class?.name ?? classesData?.data?.find((c) => c.id === clsId)?.name ?? clsId ?? '',
          sectionId: secId ?? '',
          sectionName: en.sectionName ?? en.section?.name ?? sectionsData?.data?.find((sec) => sec.id === secId)?.name ?? secId ?? '',
          rollNumber: en.rollNumber ?? null,
        } : null,
      }
    })
  }, [studentsData, yearsData, classesData, sectionsData])

  const isDataLoading = studentsLoading || yearsLoading || classesLoading || sectionsLoading

  // Filter-bar cascading options
  const filteredClassOptions = useMemo(() => {
    if (!filterAcademicYear) return classOptions
    return classOptions.filter((c) => c.academicYearId === filterAcademicYear)
  }, [classOptions, filterAcademicYear])

  const filteredSectionOptions = useMemo(() => {
    if (!filterClass) return []
    return sectionOptions.filter((s) => s.classId === filterClass)
  }, [sectionOptions, filterClass])

  // Promotion
  const [promotionConfig, setPromotionConfig] =
    useState<PromoteConfig | null>(null)

  // Confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [progressIndex, setProgressIndex] = useState(-1)
  const [results, setResults] = useState<PromotionResult[] | null>(null)

  // Step 2 Form Watchers for Cascading Dropdowns
  const targetAcademicYearId = Form.useWatch('targetAcademicYearId', form)
  const targetClassId = Form.useWatch('targetClassId', form)

  const step2ClassOptions = useMemo(() => {
    if (!targetAcademicYearId) return []
    return classOptions.filter(c => c.academicYearId === targetAcademicYearId)
  }, [classOptions, targetAcademicYearId])

  const step2SectionOptions = useMemo(() => {
    if (!targetClassId) return []
    return sectionOptions.filter(s => s.classId === targetClassId)
  }, [sectionOptions, targetClassId])

  // Step 3 (review) local dropdowns — independent of step 2 form
  const [reviewTargetClassId, setReviewTargetClassId] = useState<string | undefined>()
  const [reviewTargetSectionId, setReviewTargetSectionId] = useState<string | undefined>()

  // review step class/section options (same cascade logic)
  const reviewClassOptions = useMemo(() => {
    if (!promotionConfig?.targetAcademicYearId) return classOptions
    return classOptions.filter(c => c.academicYearId === promotionConfig.targetAcademicYearId)
  }, [classOptions, promotionConfig])

  const reviewSectionOptions = useMemo(() => {
    if (!reviewTargetClassId) return []
    return sectionOptions.filter(s => s.classId === reviewTargetClassId)
  }, [sectionOptions, reviewTargetClassId])

  // ── Students from API (already filtered server-side) ──────────────────
  // filteredStudents = what's shown in the current page of the table
  const filteredStudents = eligibleStudents  // eligibleStudents is already the page slice

  // Total count from API meta (for server-side pagination)
  const totalStudents = studentsData?.meta?.total ?? studentsData?.data?.items?.length ?? 0

  // Cache seen students so selections survive page changes
  const studentCacheRef = useRef<Map<string, Student>>(new Map())
  useEffect(() => {
    eligibleStudents.forEach((s) => studentCacheRef.current.set(s.id, s))
  }, [eligibleStudents])

  const selectedStudents = useMemo(
    () =>
      selectedIds
        .map((id) => studentCacheRef.current.get(id))
        .filter((s): s is Student => s !== undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedIds, eligibleStudents], // re-run when new page loads
  )

  const selectedCount = selectedStudents.length

  const allVisibleSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((student) =>
      selectedIds.includes(student.id),
    )

  const someVisibleSelected =
    filteredStudents.some((student) =>
      selectedIds.includes(student.id),
    ) && !allVisibleSelected

  const selectedClassIds = useMemo(
    () =>
      [
        ...new Set(
          selectedStudents
            .map((student) => student.enrollment?.classId)
            .filter(Boolean),
        ),
      ],
    [selectedStudents],
  )

  const selectedSectionIds = useMemo(
    () =>
      [
        ...new Set(
          selectedStudents
            .map((student) => student.enrollment?.sectionId)
            .filter(Boolean),
        ),
      ],
    [selectedStudents],
  )

  const suggestedClassId = useMemo(() => {
    if (selectedClassIds.length !== 1) return undefined
    return getNextClassId(selectedClassIds[0])
  }, [selectedClassIds])

  const targetYear = promotionConfig
    ? academicYearOptions.find(
      (item) =>
        item.value === promotionConfig.targetAcademicYearId,
    )
    : undefined

  const targetClass = promotionConfig
    ? classOptions.find(
      (item) => item.value === promotionConfig.targetClassId,
    )
    : undefined

  const targetSection = promotionConfig
    ? sectionOptions.find(
      (item) => item.value === promotionConfig.targetSectionId,
    )
    : undefined

  const passedCount =
    results?.filter((result) => result.success).length ?? 0

  const failedCount =
    results?.filter((result) => !result.success).length ?? 0

  const isComplete = results !== null

  // ───────────────────────────────────────────────────────────────────────────
  // Selection actions
  // ───────────────────────────────────────────────────────────────────────────

  const toggleStudent = (studentId: string) => {
    setSelectedIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    )
  }

  const toggleVisibleStudents = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(
        filteredStudents.map((student) => student.id),
      )

      setSelectedIds((current) =>
        current.filter((id) => !visibleIds.has(id)),
      )

      return
    }

    setSelectedIds((current) => [
      ...new Set([
        ...current,
        ...filteredStudents.map((student) => student.id),
      ]),
    ])
  }

  const clearSelection = () => {
    setSelectedIds([])
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Step navigation
  // ───────────────────────────────────────────────────────────────────────────

  // Detect if selected students come from multiple classes or sections
  const isMixedSelection = selectedClassIds.length > 1 || selectedSectionIds.length > 1

  const continueFromSelection = () => {
    if (selectedCount === 0) {
      toast.error('Select at least one student to continue.')
      return
    }

    // Show a confirmation modal — stronger warning for mixed class/section
    setConfirmModalOpen(true)
  }

  const proceedAfterConfirm = () => {
    setConfirmModalOpen(false)

    const defaultClass =
      suggestedClassId ??
      (selectedClassIds.length === 1
        ? selectedClassIds[0]
        : undefined)

    // Pre-fill suggested starting roll number (lowest existing + 1 or 1)
    const existingRolls = selectedStudents
      .map((s) => s.enrollment?.rollNumber)
      .filter((r): r is number => typeof r === 'number')
    const suggestedStartRoll = existingRolls.length > 0 ? Math.max(...existingRolls) + 1 : 1

    form.setFieldsValue({
      targetAcademicYearId: academicYearOptions[0]?.value,
      targetClassId: defaultClass,
      targetSectionId:
        selectedSectionIds.length === 1
          ? selectedSectionIds[0]
          : undefined,
      rollNumberStrategy: 'AUTO',
      startingRollNumber: suggestedStartRoll,
    })

    setStep(1)
  }

  const continueFromDetails = async () => {
    try {
      const values = await form.validateFields()

      if (
        values.rollNumberStrategy === 'CUSTOM' &&
        !values.startingRollNumber
      ) {
        toast.error('Enter the starting roll number.')
        return
      }

      setPromotionConfig(values)
      // Pre-populate review dropdowns with step-2 selections
      setReviewTargetClassId(values.targetClassId)
      setReviewTargetSectionId(values.targetSectionId)
      setStep(2)
    } catch {
      // Ant Design displays field-level validation.
    }
  }

  const goBack = () => {
    if (step === 0) {
      navigate('/students')
      return
    }

    setStep((current) => current - 1)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Promotion
  // ───────────────────────────────────────────────────────────────────────────



  const runPromotion = async (
    studentsToPromote = selectedStudents,
  ) => {
    if (!promotionConfig || studentsToPromote.length === 0) {
      return
    }

    setSubmitting(true)
    setProgressIndex(0)
    setResults(null)

    try {
      const isAuto = promotionConfig.rollNumberStrategy === 'AUTO'
      const isKeep = promotionConfig.rollNumberStrategy === 'KEEP'

      const students = studentsToPromote.map((s, index) => ({
        studentId: s.id,
        rollNumber:
          isAuto
            ? undefined
            : isKeep
              ? (s.enrollment?.rollNumber ?? undefined)
              : (promotionConfig.startingRollNumber ?? 1) + index,
      }))

      const response = await bulkPromote({
        students,
        academicYearId: promotionConfig.targetAcademicYearId,
        classId: promotionConfig.targetClassId,
        sectionId: promotionConfig.targetSectionId,
        autoAssignRollNumbers: isAuto,
      })

      const targetClassLabel = classOptions.find(
        (c) => c.value === promotionConfig.targetClassId,
      )?.label ?? 'Target class'

      const targetSectionLabel = sectionOptions.find(
        (s) => s.value === promotionConfig.targetSectionId,
      )?.label ?? '—'

      // Map API response enrollments back to the UI PromotionResult shape
      const generatedResults: PromotionResult[] = studentsToPromote.map(
        (student, index) => {
          const apiEnrollment = response.data?.[index]
          return {
            studentId: student.id,
            fullName: student.fullName,
            admissionNo: student.admissionNo,
            currentClass: student.enrollment?.className ?? '—',
            currentSection: student.enrollment?.sectionName ?? '—',
            currentRoll: student.enrollment?.rollNumber ?? null,
            targetClass: targetClassLabel,
            targetSection: targetSectionLabel,
            targetRoll: apiEnrollment?.rollNumber ?? null,
            success: true,
          }
        },
      )

      setProgressIndex(studentsToPromote.length)
      setResults(generatedResults)

      toast.success(
        `${generatedResults.length} student${generatedResults.length === 1 ? '' : 's'
        } promoted successfully.`,
      )
    } catch (err: unknown) {
      const message = (err as Error)?.message ?? 'Promotion failed'
      const failedResults: PromotionResult[] = studentsToPromote.map(
        (student) => ({
          studentId: student.id,
          fullName: student.fullName,
          admissionNo: student.admissionNo,
          currentClass: student.enrollment?.className ?? '—',
          currentSection: student.enrollment?.sectionName ?? '—',
          currentRoll: student.enrollment?.rollNumber ?? null,
          targetClass: classOptions.find((c) => c.value === promotionConfig.targetClassId)?.label ?? '—',
          targetSection: sectionOptions.find((s) => s.value === promotionConfig.targetSectionId)?.label ?? '—',
          targetRoll: null,
          success: false,
          reason: message,
        }),
      )
      setResults(failedResults)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePromote = () => {
    if (!promotionConfig) return

    runPromotion()
  }

  const retryFailed = () => {
    if (!results) return

    const failedIds = results
      .filter((result) => !result.success)
      .map((result) => result.studentId)

    const failedStudents = eligibleStudents.filter((student) =>
      failedIds.includes(student.id),
    )

    runPromotion(failedStudents)
  }

  const startNewPromotion = () => {
    setStep(0)
    setSelectedIds([])
    setSearchInput('')
    setPage(1)
    setFilterAcademicYear(undefined)
    setFilterClass(undefined)
    setFilterSection(undefined)
    setPromotionConfig(null)
    setResults(null)
    setSubmitting(false)
    setProgressIndex(-1)
    form.resetFields()
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Student table
  // ───────────────────────────────────────────────────────────────────────────

  const studentColumns: ColumnsType<Student> = [
    {
      title: (
        <Checkbox
          checked={allVisibleSelected}
          indeterminate={someVisibleSelected}
          onChange={toggleVisibleStudents}
        />
      ),
      key: 'selection',
      width: 52,
      render: (_, student) => (
        <Checkbox
          checked={selectedIds.includes(student.id)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleStudent(student.id)}
        />
      ),
    },
    {
      title: 'Student',
      key: 'student',
      render: (_, student) => (
        <Space size={12}>
          <Avatar
            size={40}
            src={student.photo ?? undefined}
            icon={!student.photo ? <UserOutlined /> : undefined}
            style={{
              background: colors.primaryLight,
              color: colors.primary,
              fontWeight: 700,
            }}
          >
            {!student.photo && initials(student.fullName)}
          </Avatar>

          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 14,
                color: colors.text,
                lineHeight: 1.4,
              }}
            >
              {student.fullName}
            </div>

            <div
              style={{
                fontSize: 11,
                color: colors.muted,
                fontFamily: 'monospace',
                marginTop: 2,
              }}
            >
              {student.admissionNo}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Current class',
      key: 'class',
      render: (_, student) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {student.enrollment?.className ?? '—'}
          </Text>
          <div
            style={{
              fontSize: 11,
              color: colors.muted,
            }}
          >
            {student.enrollment?.academicYearName ?? '—'}
          </div>
        </div>
      ),
    },
    {
      title: 'Section',
      key: 'section',
      width: 100,
      render: (_, student) => (
        <Tag
          style={{
            margin: 0,
            borderRadius: 6,
          }}
        >
          {student.enrollment?.sectionName ?? '—'}
        </Tag>
      ),
    },
    {
      title: 'Roll',
      key: 'roll',
      width: 90,
      render: (_, student) => (
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 600,
          }}
        >
          {student.enrollment?.rollNumber ?? '—'}
        </span>
      ),
    },
  ]

  const filterColumns: SmartColumn[] = useMemo(() => [
    { key: 'search', title: 'Name or Admission No.', isSearchable: true },
    { key: 'academicYearId', title: 'Academic Year', isFilterable: true, filterOptions: academicYearOptions, filterWidth: 200 },
    { key: 'classId', title: 'Class', isFilterable: true, filterOptions: filteredClassOptions, filterWidth: 200 },
    { key: 'sectionId', title: 'Section', isFilterable: true, filterOptions: filteredSectionOptions, filterWidth: 200 },
  ], [academicYearOptions, filteredClassOptions, filteredSectionOptions])

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100%',
        padding: '24px 24px 100px',
        background: colors.background,
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────────
          Header
      ───────────────────────────────────────────────────────────────────── */}

      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 20,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/students')}
              style={{
                padding: 0,
                height: 28,
                marginBottom: 8,
                color: colors.muted,
              }}
            >
              Back to Students
            </Button>

            <Title
              level={3}
              style={{
                margin: 0,
                color: colors.text,
                fontWeight: 700,
              }}
            >
              Promote Students
            </Title>

            <Text
              type="secondary"
              style={{
                display: 'block',
                marginTop: 4,
                fontSize: 13,
              }}
            >
              Move students into their new academic year,
              class and section.
            </Text>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 8,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: colors.success,
              }}
            />

            <Text
              type="secondary"
              style={{ fontSize: 12 }}
            >
              Current academic year
            </Text>

            <Text strong style={{ fontSize: 12 }}>
              2081/82
            </Text>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            Progress
        ─────────────────────────────────────────────────────────────────── */}

        {!isComplete && (
          <Card
            bordered={false}
            style={{
              borderRadius: radius.lg,
              boxShadow: shadow.card,
              marginBottom: 20,
            }}
            styles={{
              body: {
                padding: '16px 20px',
              },
            }}
          >
            <StepBar
              steps={STEPS.map((title) => ({ title }))}
              current={step}
              onChange={(index) => {
                if (index <= step) {
                  setStep(index)
                }
              }}
            />
          </Card>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            STEP 1 — Select Students
        ─────────────────────────────────────────────────────────────────── */}

        {step === 0 && !isComplete && (
          <>
            <Card
              bordered={false}
              style={{
                borderRadius: radius.lg,
                boxShadow: shadow.card,
                overflow: 'hidden',
                marginBottom: 20,
              }}
              styles={{ body: { padding: 0 } }}
            >
              {/* Intro */}
              <div style={{ padding: '22px 24px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <Title level={5} style={{ margin: 0, color: colors.text }}>Select students</Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>Choose the active students you want to promote.</Text>
                  </div>
                  <Tag icon={<TeamOutlined />} color="blue" style={{ margin: 0, padding: '4px 10px', borderRadius: 7 }}>
                    {selectedCount} selected
                  </Tag>
                </div>
              </div>
            </Card>

            <SearchAndFilter
              columns={filterColumns}
              searchValue={searchInput}
              onSearchChange={handleSearchChange}
              filterValues={{ academicYearId: filterAcademicYear, classId: filterClass, sectionId: filterSection }}
              onFilterChange={(key, val) => {
                setPage(1)
                if (key === 'academicYearId') {
                  setFilterAcademicYear(val)
                  setFilterClass(undefined)
                  setFilterSection(undefined)
                } else if (key === 'classId') {
                  setFilterClass(val)
                  setFilterSection(undefined)
                } else if (key === 'sectionId') {
                  setFilterSection(val)
                }
              }}
              style={{ marginBottom: 20 }}
            />

            {isDataLoading ? (
              /* ── Skeleton loading rows ─────────────────────────────────── */
              <Card
                bordered={false}
                style={{ borderRadius: radius.lg, boxShadow: shadow.card, overflow: 'hidden' }}
                styles={{ body: { padding: 0 } }}
              >
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}` }}>
                  <Skeleton.Input active style={{ width: 160, height: 20 }} />
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 20px',
                      borderBottom: i < 5 ? `1px solid ${colors.border}` : undefined,
                    }}
                  >
                    <Skeleton.Avatar active size={40} />
                    <div style={{ flex: 1 }}>
                      <Skeleton active paragraph={{ rows: 1, width: '60%' }} title={{ width: '40%' }} style={{ margin: 0 }} />
                    </div>
                    <Skeleton.Input active style={{ width: 90, height: 20 }} />
                    <Skeleton.Input active style={{ width: 60, height: 20 }} />
                  </div>
                ))}
              </Card>
            ) : (
              /* ── Real student table ────────────────────────────────────── */
              <AppTable<Student>
                rowKey="id"
                columns={studentColumns}
                dataSource={filteredStudents}
                loading={studentsLoading}
                size="middle"
                pagination={{
                  current: page,
                  pageSize: PAGE_SIZE,
                  total: totalStudents,
                  showSizeChanger: false,
                  showTotal: (total) => `${total} student${total === 1 ? '' : 's'}`,
                  onChange: (p) => setPage(p),
                }}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <div>
                          <Text style={{ display: 'block' }}>No students found</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>Try changing your search or filters.</Text>
                        </div>
                      }
                    />
                  ),
                }}
                onRow={(student) => ({
                  onClick: () => toggleStudent(student.id),
                  style: {
                    background: selectedIds.includes(student.id) ? colors.primaryLight : undefined,
                  },
                })}
                title={() => (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <Space size={8}>
                      <Checkbox
                        checked={allVisibleSelected}
                        indeterminate={someVisibleSelected}
                        onChange={toggleVisibleStudents}
                      />
                      <Text strong style={{ fontSize: 13 }}>Select visible</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
                      </Text>
                    </Space>
                    {selectedCount > 0 && (
                      <Button type="link" danger onClick={clearSelection} style={{ padding: 0, fontSize: 12 }}>
                        Clear selection
                      </Button>
                    )}
                  </div>
                )}
              /> /* end AppTable */
            )} {/* end isDataLoading ternary */}

            {/* Bottom action */}
            <div
              style={{
                position: 'sticky',
                bottom: 16,
                zIndex: 10,
                marginTop: 16,
              }}
            >
              <Card
                bordered={false}
                style={{
                  borderRadius: 12,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                  border: `1px solid ${colors.border}`,
                }}
                styles={{
                  body: {
                    padding: '12px 16px',
                  },
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <Text
                      strong
                      style={{
                        display: 'block',
                        fontSize: 14,
                      }}
                    >
                      {selectedCount === 0
                        ? 'No students selected'
                        : `${selectedCount} student${selectedCount === 1
                          ? ''
                          : 's'
                        } selected`}
                    </Text>

                    <Text
                      type="secondary"
                      style={{
                        fontSize: 12,
                      }}
                    >
                      Select students to continue
                    </Text>
                  </div>

                  <Button
                    type="primary"
                    size="large"
                    disabled={selectedCount === 0}
                    onClick={continueFromSelection}
                    icon={<ArrowRightOutlined />}
                    iconPosition="end"
                    style={{
                      background: colors.primary,
                      minWidth: 150,
                    }}
                  >
                    Continue
                  </Button>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            STEP 2 — Promotion Details
        ─────────────────────────────────────────────────────────────────── */}

        {step === 1 && !isComplete && (
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
          >
            <Row gutter={[20, 20]}>
              <Col xs={24} lg={16}>
                <Card
                  bordered={false}
                  style={{
                    borderRadius: radius.lg,
                    boxShadow: shadow.card,
                  }}
                >
                  <div style={{ marginBottom: 24 }}>
                    <Title
                      level={5}
                      style={{
                        margin: 0,
                        color: colors.text,
                      }}
                    >
                      Where should they go?
                    </Title>

                    <Text
                      type="secondary"
                      style={{
                        fontSize: 13,
                      }}
                    >
                      Set the new academic year, class and
                      section.
                    </Text>
                  </div>

                  {/* Current → Target */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'minmax(0, 1fr) 50px minmax(0, 1fr)',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 28,
                    }}
                  >
                    <div
                      style={{
                        padding: 18,
                        borderRadius: 10,
                        background: colors.background,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <Text
                        type="secondary"
                        style={{
                          display: 'block',
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          marginBottom: 8,
                        }}
                      >
                        Current
                      </Text>

                      <Text
                        strong
                        style={{
                          display: 'block',
                          fontSize: 17,
                        }}
                      >
                        {selectedClassIds.length === 1
                          ? classOptions.find(
                            (item) =>
                              item.value ===
                              selectedClassIds[0],
                          )?.label
                          : 'Multiple classes'}
                      </Text>

                      <Text
                        type="secondary"
                        style={{
                          fontSize: 12,
                        }}
                      >
                        {selectedSectionIds.length === 1
                          ? sectionOptions.find(
                            (item) =>
                              item.value ===
                              selectedSectionIds[0],
                          )?.label
                          : 'Multiple sections'}
                      </Text>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background:
                          colors.primaryLight,
                        color: colors.primary,
                      }}
                    >
                      <ArrowRightOutlined />
                    </div>

                    <div
                      style={{
                        padding: 18,
                        borderRadius: 10,
                        background: colors.primaryLight,
                        border: `1px solid ${colors.primary}33`,
                      }}
                    >
                      <Text
                        style={{
                          display: 'block',
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          marginBottom: 8,
                          color: colors.primary,
                        }}
                      >
                        New
                      </Text>

                      <Text
                        strong
                        style={{
                          display: 'block',
                          fontSize: 17,
                          color: colors.primary,
                        }}
                      >
                        Choose destination
                      </Text>

                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.primary,
                        }}
                      >
                        Next enrollment
                      </Text>
                    </div>
                  </div>

                  <Row gutter={[16, 4]}>
                    <Col xs={24}>
                      <Form.Item
                        name="targetAcademicYearId"
                        label="Academic year"
                        rules={[
                          {
                            required: true,
                            message:
                              'Select an academic year.',
                          },
                        ]}
                      >
                        <Select
                          size="large"
                          placeholder="Select academic year"
                          options={academicYearOptions}
                          onChange={() => {
                            form.setFieldsValue({ targetClassId: undefined, targetSectionId: undefined })
                          }}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        name="targetClassId"
                        label="Target class"
                        rules={[
                          {
                            required: true,
                            message:
                              'Select the target class.',
                          },
                        ]}
                      >
                        <Select
                          showSearch
                          size="large"
                          placeholder="Select class"
                          options={step2ClassOptions}
                          optionFilterProp="label"
                          onChange={() => {
                            form.setFieldsValue({ targetSectionId: undefined })
                          }}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        name="targetSectionId"
                        label="Target section"
                        rules={[
                          {
                            required: true,
                            message:
                              'Select the target section.',
                          },
                        ]}
                      >
                        <Select
                          size="large"
                          placeholder="Select section"
                          options={step2SectionOptions}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Roll number */}
                  <div
                    style={{
                      marginTop: 8,
                      padding: 18,
                      borderRadius: 10,
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div style={{ marginBottom: 14 }}>
                      <Text
                        strong
                        style={{
                          display: 'block',
                          fontSize: 14,
                        }}
                      >
                        Roll numbers
                      </Text>

                      <Text
                        type="secondary"
                        style={{
                          fontSize: 12,
                        }}
                      >
                        Choose how roll numbers should be
                        assigned in the new class.
                      </Text>
                    </div>

                    <Form.Item
                      name="rollNumberStrategy"
                      style={{ marginBottom: 0 }}
                      rules={[
                        {
                          required: true,
                          message:
                            'Select a roll number strategy.',
                        },
                      ]}
                    >
                      <Select
                        size="large"
                        options={[
                          {
                            label:
                              'Keep existing roll numbers',
                            value: 'KEEP',
                          },
                          {
                            label:
                              'Assign automatically from 1',
                            value: 'AUTO',
                          },
                          {
                            label:
                              'Start from a custom number',
                            value: 'CUSTOM',
                          },
                        ]}
                      />
                    </Form.Item>

                    <Form.Item
                      noStyle
                      shouldUpdate={(
                        previous,
                        current,
                      ) =>
                        previous.rollNumberStrategy !==
                        current.rollNumberStrategy
                      }
                    >
                      {({ getFieldValue }) =>
                        getFieldValue(
                          'rollNumberStrategy',
                        ) === 'CUSTOM' ? (
                          <Form.Item
                            name="startingRollNumber"
                            label="Starting roll number"
                            style={{
                              marginTop: 16,
                              marginBottom: 0,
                            }}
                            rules={[
                              {
                                required: true,
                                message:
                                  'Enter a starting roll number.',
                              },
                              {
                                type: 'number',
                                min: 1,
                                message:
                                  'Roll number must be at least 1.',
                              },
                            ]}
                          >
                            <InputNumber
                              min={1}
                              size="large"
                              style={{
                                width: '100%',
                              }}
                              placeholder="e.g. 1"
                            />
                          </Form.Item>
                        ) : null
                      }
                    </Form.Item>
                  </div>
                </Card>
              </Col>

              {/* Right summary */}
              <Col xs={24} lg={8}>
                <div
                  style={{
                    position: 'sticky',
                    top: 20,
                  }}
                >
                  <Card
                    bordered={false}
                    style={{
                      borderRadius: radius.lg,
                      boxShadow: shadow.card,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 20,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background:
                            colors.primaryLight,
                          color: colors.primary,
                        }}
                      >
                        <TeamOutlined />
                      </div>

                      <div>
                        <Text
                          strong
                          style={{
                            display: 'block',
                          }}
                        >
                          Promotion summary
                        </Text>

                        <Text
                          type="secondary"
                          style={{
                            fontSize: 12,
                          }}
                        >
                          {selectedCount} students
                        </Text>
                      </div>
                    </div>

                    <Statistic
                      title="Students selected"
                      value={selectedCount}
                      valueStyle={{
                        color: colors.primary,
                        fontWeight: 700,
                      }}
                    />

                    <div
                      style={{
                        height: 1,
                        background: colors.border,
                        margin: '18px 0',
                      }}
                    />

                    <Text
                      type="secondary"
                      style={{
                        display: 'block',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        marginBottom: 8,
                      }}
                    >
                      Selected students
                    </Text>

                    <div
                      style={{
                        maxHeight: 250,
                        overflowY: 'auto',
                      }}
                    >
                      {selectedStudents.map(
                        (student) => (
                          <div
                            key={student.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '8px 0',
                            }}
                          >
                            <Avatar
                              size={30}
                              style={{
                                background:
                                  colors.primaryLight,
                                color: colors.primary,
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                            >
                              {initials(
                                student.fullName,
                              )}
                            </Avatar>

                            <div
                              style={{
                                minWidth: 0,
                              }}
                            >
                              <Text
                                strong
                                style={{
                                  display: 'block',
                                  fontSize: 12,
                                  overflow:
                                    'hidden',
                                  textOverflow:
                                    'ellipsis',
                                  whiteSpace:
                                    'nowrap',
                                }}
                              >
                                {student.fullName}
                              </Text>

                              <Text
                                type="secondary"
                                style={{
                                  fontSize: 10,
                                }}
                              >
                                {
                                  student.enrollment
                                    ?.className
                                }{' '}
                                •{' '}
                                {
                                  student.enrollment
                                    ?.sectionName
                                }
                              </Text>
                            </div>
                          </div>
                        ),
                      )}
                    </div>

                    <Alert
                      type="info"
                      showIcon
                      style={{
                        marginTop: 16,
                      }}
                      message="Existing enrollment records will remain unchanged."
                    />
                  </Card>
                </div>
              </Col>
            </Row>

            {/* Navigation */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                marginTop: 20,
              }}
            >
              <Button
                size="large"
                icon={<LeftOutlined />}
                onClick={goBack}
              >
                Back
              </Button>

              <Button
                type="primary"
                size="large"
                onClick={continueFromDetails}
                style={{
                  background: colors.primary,
                  minWidth: 150,
                }}
              >
                Review changes
                <ArrowRightOutlined />
              </Button>
            </div>
          </Form>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            STEP 3 — Review
        ─────────────────────────────────────────────────────────────────── */}

        {step === 2 && !isComplete && !submitting && (
          <>
            <Card
              bordered={false}
              style={{
                borderRadius: radius.lg,
                boxShadow: shadow.card,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <Title
                    level={4}
                    style={{
                      margin: 0,
                      color: colors.text,
                    }}
                  >
                    Review promotion
                  </Title>

                  <Text
                    type="secondary"
                    style={{
                      fontSize: 13,
                    }}
                  >
                    Check the changes before creating the
                    new enrollments.
                  </Text>
                </div>

                <Tag
                  color="blue"
                  style={{
                    margin: 0,
                    padding: '5px 10px',
                    borderRadius: 7,
                  }}
                >
                  {selectedCount} students
                </Tag>
              </div>
            </Card>

            {/* Destination summary */}
            <Card
              bordered={false}
              style={{
                borderRadius: radius.lg,
                boxShadow: shadow.card,
                marginBottom: 20,
              }}
            >
              <Text
                type="secondary"
                style={{
                  display: 'block',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 16,
                }}
              >
                Promotion destination
              </Text>

              <Row
                gutter={[16, 16]}
                align="middle"
              >
                <Col xs={24} md={10}>
                  <div
                    style={{
                      padding: 18,
                      borderRadius: 10,
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <Text
                      type="secondary"
                      style={{
                        display: 'block',
                        fontSize: 11,
                      }}
                    >
                      CURRENT
                    </Text>

                    <Text
                      strong
                      style={{
                        display: 'block',
                        marginTop: 6,
                        fontSize: 16,
                      }}
                    >
                      {selectedClassIds.length === 1
                        ? MOCK_CLASSES.find(
                          (item) =>
                            item.value ===
                            selectedClassIds[0],
                        )?.label
                        : 'Multiple classes'}
                    </Text>

                    <Text
                      type="secondary"
                      style={{
                        fontSize: 12,
                      }}
                    >
                      {selectedSectionIds.length === 1
                        ? MOCK_SECTIONS.find(
                          (item) =>
                            item.value ===
                            selectedSectionIds[0],
                        )?.label
                        : 'Multiple sections'}
                    </Text>
                  </div>
                </Col>

                <Col
                  xs={24}
                  md={4}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background:
                        colors.primaryLight,
                      color: colors.primary,
                    }}
                  >
                    <ArrowRightOutlined />
                  </div>
                </Col>

                <Col xs={24} md={10}>
                  <div
                    style={{
                      padding: 18,
                      borderRadius: 10,
                      background: colors.primaryLight,
                      border: `1px solid ${colors.primary}33`,
                    }}
                  >
                    <Text
                      style={{
                        display: 'block',
                        fontSize: 11,
                        color: colors.primary,
                      }}
                    >
                      NEW
                    </Text>

                    <Text
                      strong
                      style={{
                        display: 'block',
                        marginTop: 6,
                        fontSize: 16,
                        color: colors.primary,
                      }}
                    >
                      {targetClass?.label ?? '—'}
                    </Text>

                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.primary,
                      }}
                    >
                      {targetSection?.label ?? '—'} •{' '}
                      {targetYear?.label ?? '—'}
                    </Text>
                  </div>
                </Col>
              </Row>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  marginTop: 18,
                }}
              >
                <Tag>
                  {selectedCount} students
                </Tag>

                <Tag>
                  {promotionConfig?.rollNumberStrategy ===
                    'KEEP'
                    ? 'Keep existing roll numbers'
                    : promotionConfig?.rollNumberStrategy ===
                      'CUSTOM'
                      ? `Roll numbers start from ${promotionConfig.startingRollNumber
                      }`
                      : 'Automatically assign roll numbers'}
                </Tag>
              </div>
            </Card>

            {/* Student changes — review table with inline class/section selectors */}
            <Card
              bordered={false}
              style={{
                borderRadius: radius.lg,
                boxShadow: shadow.card,
                marginBottom: 20,
              }}
              styles={{ body: { padding: 0 } }}
            >
              <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <Text strong>Students being promoted</Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 3 }}>
                      Review each student's destination below.
                    </Text>
                  </div>
                  {/* Inline class & section dropdowns */}
                  <Space wrap>
                    <Select
                      size="middle"
                      placeholder="Select class"
                      style={{ minWidth: 150 }}
                      value={reviewTargetClassId}
                      options={reviewClassOptions}
                      onChange={(val) => {
                        setReviewTargetClassId(val)
                        setReviewTargetSectionId(undefined)
                        if (promotionConfig) {
                          setPromotionConfig({ ...promotionConfig, targetClassId: val, targetSectionId: '' })
                        }
                      }}
                      allowClear
                    />
                    <Select
                      size="middle"
                      placeholder="Select section"
                      style={{ minWidth: 140 }}
                      value={reviewTargetSectionId}
                      options={reviewSectionOptions}
                      disabled={!reviewTargetClassId}
                      onChange={(val) => {
                        setReviewTargetSectionId(val)
                        if (promotionConfig) {
                          setPromotionConfig({ ...promotionConfig, targetSectionId: val })
                        }
                      }}
                      allowClear
                    />
                  </Space>
                </div>
              </div>

              <AppTable<Student>
                rowKey="id"
                dataSource={selectedStudents}
                pagination={false}
                size="middle"
                style={{ borderRadius: 0 }}
                columns={[
                  {
                    title: 'Student',
                    key: 'student',
                    render: (_, student) => (
                      <Space size={10}>
                        <Avatar
                          size={34}
                          style={{ background: colors.primaryLight, color: colors.primary, fontSize: 10, fontWeight: 700 }}
                        >
                          {initials(student.fullName)}
                        </Avatar>
                        <div>
                          <Text strong style={{ fontSize: 13 }}>{student.fullName}</Text>
                          <div style={{ fontSize: 10, color: colors.muted, fontFamily: 'monospace' }}>
                            {student.admissionNo}
                          </div>
                        </div>
                      </Space>
                    ),
                  },
                  {
                    title: 'Current',
                    key: 'current',
                    render: (_, student) => (
                      <div>
                        <Text style={{ fontSize: 12 }}>
                          {student.enrollment?.className} • {student.enrollment?.sectionName}
                        </Text>
                        <div style={{ fontSize: 11, color: colors.muted }}>
                          Roll {student.enrollment?.rollNumber ?? '—'}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: '',
                    key: 'arrow',
                    width: 50,
                    align: 'center',
                    render: () => <ArrowRightOutlined style={{ color: colors.muted }} />,
                  },
                  {
                    title: 'New',
                    key: 'new',
                    render: (_, student) => {
                      const index = selectedStudents.findIndex((item) => item.id === student.id)
                      const effectiveTargetClass = reviewTargetClassId
                        ? classOptions.find(c => c.value === reviewTargetClassId)
                        : targetClass
                      const effectiveTargetSection = reviewTargetSectionId
                        ? sectionOptions.find(s => s.value === reviewTargetSectionId)
                        : targetSection
                      const effectiveConfig = promotionConfig

                      const targetRoll = effectiveConfig
                        ? getTargetRoll(student, index, effectiveConfig.rollNumberStrategy, effectiveConfig.startingRollNumber)
                        : null

                      const hasClass = !!effectiveTargetClass
                      const hasSection = !!effectiveTargetSection

                      return (
                        <div>
                          {hasClass && hasSection ? (
                            <>
                              <Text strong style={{ fontSize: 12, color: colors.primary }}>
                                {effectiveTargetClass?.label ?? '—'} • {effectiveTargetSection?.shortLabel ?? effectiveTargetSection?.label ?? '—'}
                              </Text>
                              <div style={{ fontSize: 11, color: colors.muted }}>
                                Roll {targetRoll ?? '—'}
                              </div>
                            </>
                          ) : (
                            <Skeleton active paragraph={false} title={{ width: 120 }} style={{ margin: 0 }} />
                          )}
                        </div>
                      )
                    },
                  },
                ]}
              />
            </Card>

            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              style={{
                marginTop: 20,
              }}
              message="What will happen?"
              description={
                <>
                  A new enrollment record will be created
                  for each selected student in{' '}
                  <strong>
                    {targetYear?.label} •{' '}
                    {targetClass?.label} •{' '}
                    {targetSection?.label}
                  </strong>
                  . Existing enrollment records will not be
                  modified.
                </>
              }
            />

            {/* Navigation */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                marginTop: 20,
              }}
            >
              <Button
                size="large"
                icon={<LeftOutlined />}
                onClick={goBack}
              >
                Back
              </Button>

              <Button
                type="primary"
                size="large"
                icon={<CheckOutlined />}
                onClick={handlePromote}
                disabled={!reviewTargetClassId || !reviewTargetSectionId}
                style={{
                  background: colors.primary,
                  minWidth: 190,
                }}
              >
                Promote {selectedCount} student
                {selectedCount === 1 ? '' : 's'}
              </Button>
            </div>
          </>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            CONFIRMATION MODAL
        ─────────────────────────────────────────────────────────────────── */}
        <Modal
          open={confirmModalOpen}
          onCancel={() => setConfirmModalOpen(false)}
          footer={null}
          centered
          width={isMixedSelection ? 500 : 440}
          styles={{
            body: {
              padding: 0,
              overflow: 'hidden',
              borderRadius: 16,
            },
          }}
        >
          {isMixedSelection ? (
            // ── MIXED CLASS/SECTION — Strong warning ──────────────────────
            <div>
              {/* Red banner header */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
                  padding: '28px 28px 22px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px',
                    fontSize: 28,
                    color: '#fff',
                  }}
                >
                  <WarningOutlined />
                </div>
                <Text
                  style={{
                    display: 'block',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#fff',
                    marginBottom: 6,
                  }}
                >
                  Mixed Class & Section Detected!
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                  You've selected students from <strong style={{ color: '#fff' }}>{selectedClassIds.length} different class{selectedClassIds.length > 1 ? 'es' : ''}</strong> and{' '}
                  <strong style={{ color: '#fff' }}>{selectedSectionIds.length} different section{selectedSectionIds.length > 1 ? 's' : ''}</strong>.
                </Text>
              </div>

              {/* Body */}
              <div style={{ padding: '20px 28px 24px' }}>
                <Alert
                  type="error"
                  showIcon
                  style={{ marginBottom: 16, borderRadius: 8 }}
                  message="Are you sure you want to continue?"
                  description="You are about to promote students from multiple different classes and/or sections into a single destination class. This is usually not intended. Please double-check your selection."
                />

                {/* Breakdown chips */}
                <div style={{ marginBottom: 20 }}>
                  <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>Selected from</Text>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedClassIds.map((cid) => {
                      const cls = classOptions.find(c => c.value === cid)
                      return (
                        <Tag key={cid} color="error" style={{ margin: 0, fontWeight: 600 }}>
                          {cls?.label ?? cid}
                        </Tag>
                      )
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <Button size="large" onClick={() => setConfirmModalOpen(false)} style={{ minWidth: 100 }}>
                    Cancel
                  </Button>
                  <Button
                    size="large"
                    danger
                    type="primary"
                    icon={<ArrowRightOutlined />}
                    iconPosition="end"
                    onClick={proceedAfterConfirm}
                    style={{ minWidth: 130 }}
                  >
                    Yes, proceed
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // ── SAME CLASS/SECTION — Simple confirmation ──────────────────
            <div style={{ padding: '28px 28px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: colors.primaryLight,
                    color: colors.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  <TeamOutlined />
                </div>
                <div>
                  <Text strong style={{ fontSize: 16, display: 'block' }}>Confirm Promotion</Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {selectedCount} student{selectedCount !== 1 ? 's' : ''} from{' '}
                    <strong>
                      {classOptions.find(c => c.value === selectedClassIds[0])?.label ?? 'this class'}
                    </strong>
                  </Text>
                </div>
              </div>

              <Text type="secondary" style={{ display: 'block', fontSize: 13, marginBottom: 20 }}>
                You're about to promote <strong>{selectedCount} student{selectedCount !== 1 ? 's' : ''}</strong> to the next step. You'll set the destination class and section on the next screen.
              </Text>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <Button size="large" onClick={() => setConfirmModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="large"
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  iconPosition="end"
                  onClick={proceedAfterConfirm}
                  style={{ background: colors.primary, minWidth: 120 }}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* ───────────────────────────────────────────────────────────────────
            PROCESSING
        ─────────────────────────────────────────────────────────────────── */}

        {submitting && (
          <Card
            bordered={false}
            style={{
              borderRadius: radius.lg,
              boxShadow: shadow.card,
            }}
          >
            <div
              style={{
                textAlign: 'center',
                padding: '36px 20px 28px',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                  background: colors.primaryLight,
                  color: colors.primary,
                  fontSize: 25,
                }}
              >
                <LoadingOutlined spin />
              </div>

              <Title
                level={4}
                style={{
                  margin: 0,
                }}
              >
                Promoting students...
              </Title>

              <Text
                type="secondary"
                style={{
                  display: 'block',
                  marginTop: 6,
                }}
              >
                Please don't close this page while the
                promotion is being processed.
              </Text>

              <div
                style={{
                  maxWidth: 620,
                  margin: '28px auto 0',
                  textAlign: 'left',
                }}
              >
                {selectedStudents.map(
                  (student, index) => {
                    const completed =
                      progressIndex > index

                    const processing =
                      progressIndex === index

                    return (
                      <div
                        key={student.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '11px 12px',
                          borderBottom: `1px solid ${colors.border}`,
                        }}
                      >
                        {completed ? (
                          <CheckCircleFilled
                            style={{
                              color: colors.success,
                              fontSize: 18,
                            }}
                          />
                        ) : processing ? (
                          <LoadingOutlined
                            spin
                            style={{
                              color: colors.primary,
                              fontSize: 18,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              border: `2px solid ${colors.border}`,
                            }}
                          />
                        )}

                        <div style={{ flex: 1 }}>
                          <Text
                            strong={
                              processing ||
                              completed
                            }
                            style={{
                              fontSize: 13,
                            }}
                          >
                            {student.fullName}
                          </Text>

                          <div
                            style={{
                              fontSize: 10,
                              color: colors.muted,
                            }}
                          >
                            {student.admissionNo}
                          </div>
                        </div>

                        <Text
                          type="secondary"
                          style={{
                            fontSize: 11,
                          }}
                        >
                          {completed
                            ? 'Completed'
                            : processing
                              ? 'Processing'
                              : 'Waiting'}
                        </Text>
                      </div>
                    )
                  },
                )}
              </div>
            </div>
          </Card>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            RESULT
        ─────────────────────────────────────────────────────────────────── */}

        {isComplete && !submitting && (
          <>
            <Card
              bordered={false}
              style={{
                borderRadius: radius.lg,
                boxShadow: shadow.card,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px 20px',
                }}
              >
                {failedCount === 0 ? (
                  <>
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        background:
                          colors.successLight,
                        color: colors.success,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 18px',
                        fontSize: 36,
                      }}
                    >
                      <CheckCircleFilled />
                    </div>

                    <Title
                      level={3}
                      style={{
                        margin: 0,
                      }}
                    >
                      Promotion complete
                    </Title>

                    <Text
                      type="secondary"
                      style={{
                        display: 'block',
                        marginTop: 6,
                        fontSize: 14,
                      }}
                    >
                      All {passedCount} student
                      {passedCount === 1
                        ? ''
                        : 's'} were successfully
                      promoted.
                    </Text>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        background:
                          colors.warningLight ??
                          '#fff7e6',
                        color:
                          colors.warning ??
                          '#faad14',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 18px',
                        fontSize: 36,
                      }}
                    >
                      <WarningOutlined />
                    </div>

                    <Title
                      level={3}
                      style={{
                        margin: 0,
                      }}
                    >
                      Promotion partially complete
                    </Title>

                    <Text
                      type="secondary"
                      style={{
                        display: 'block',
                        marginTop: 6,
                        fontSize: 14,
                      }}
                    >
                      {passedCount} succeeded and{' '}
                      {failedCount} failed.
                    </Text>
                  </>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                    marginTop: 20,
                  }}
                >
                  <Tag
                    icon={<CheckCircleOutlined />}
                    color="success"
                    style={{
                      padding: '5px 10px',
                    }}
                  >
                    {passedCount} promoted
                  </Tag>

                  {failedCount > 0 && (
                    <Tag
                      icon={<CloseCircleFilled />}
                      color="error"
                      style={{
                        padding: '5px 10px',
                      }}
                    >
                      {failedCount} failed
                    </Tag>
                  )}
                </div>

                <div
                  style={{
                    marginTop: 18,
                    padding: 14,
                    borderRadius: 10,
                    background: colors.background,
                    display: 'inline-block',
                  }}
                >
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                    }}
                  >
                    Destination
                  </Text>

                  <Text
                    strong
                    style={{
                      display: 'block',
                      marginTop: 3,
                    }}
                  >
                    {targetYear?.label} •{' '}
                    {targetClass?.label} •{' '}
                    {targetSection?.label}
                  </Text>
                </div>
              </div>
            </Card>

            <AppTable<PromotionResult>
              rowKey="studentId"
              dataSource={results ?? []}
              pagination={false}
              title={() => (
                <div>
                  <Text strong>Promotion results</Text>
                  <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 3 }}>
                    Detailed status for each student.
                  </Text>
                </div>
              )}
              columns={[
                {
                  title: 'Student',
                  key: 'student',
                  render: (_, result) => (
                    <Space size={10}>
                      <Avatar
                        size={34}
                        style={{ background: colors.primaryLight, color: colors.primary, fontSize: 10, fontWeight: 700 }}
                      >
                        {initials(result.fullName)}
                      </Avatar>
                      <div>
                        <Text strong style={{ fontSize: 13 }}>{result.fullName}</Text>
                        <div style={{ fontSize: 10, color: colors.muted, fontFamily: 'monospace' }}>
                          {result.admissionNo}
                        </div>
                      </div>
                    </Space>
                  ),
                },
                {
                  title: 'Destination',
                  key: 'destination',
                  render: (_, result) => (
                    <div>
                      <Text style={{ fontSize: 12 }}>
                        {result.targetClass} • {result.targetSection}
                      </Text>
                      <div style={{ fontSize: 11, color: colors.muted }}>
                        Roll {result.targetRoll ?? '—'}
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Status',
                  key: 'status',
                  width: 150,
                  render: (_, result) =>
                    result.success ? (
                      <Tag icon={<CheckCircleOutlined />} color="success">Promoted</Tag>
                    ) : (
                      <Tag icon={<CloseCircleFilled />} color="error">Failed</Tag>
                    ),
                },
                {
                  title: 'Reason',
                  key: 'reason',
                  render: (_, result) =>
                    result.success ? (
                      <Text type="secondary" style={{ fontSize: 12 }}>Successfully enrolled</Text>
                    ) : (
                      <Text type="danger" style={{ fontSize: 12 }}>{result.reason ?? 'Promotion failed'}</Text>
                    ),
                },
              ]}
            />

            {/* Result actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                marginTop: 20,
              }}
            >
              <Button
                size="large"
                onClick={() => navigate('/students')}
              >
                Back to Students
              </Button>

              <Space wrap>
                {failedCount > 0 && (
                  <Button
                    size="large"
                    danger
                    onClick={retryFailed}
                  >
                    Retry failed
                  </Button>
                )}

                <Button
                  type="primary"
                  size="large"
                  onClick={startNewPromotion}
                  style={{
                    background: colors.primary,
                  }}
                >
                  Promote more students
                </Button>
              </Space>
            </div>
          </>
        )}
      </div>
    </div>
  )
}