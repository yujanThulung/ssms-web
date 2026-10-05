import { useMemo, useState } from 'react'
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs'
import {
    Button,
    Col,
    Descriptions,
    Drawer,
    Form,
    Input,
    InputNumber,
    Row,
    Select,
    Space,
    Switch,
    Tag,
    Tooltip,
    Typography,
} from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { SorterResult } from 'antd/es/table/interface'
import {
    CheckCircleOutlined,
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    EyeOutlined,
    PercentageOutlined,
    PlusOutlined,
    TeamOutlined,
    TrophyOutlined,
    WalletOutlined,
} from '@ant-design/icons'
import { toast } from 'sonner'

import { colors, radius } from '../../lib/designTokens'
import { usePermission } from '../../context/PermissionContext'
import { FEATURES, ACTIONS } from '../../utils/permissions'
import { StatusBadge } from '../../components/common/StatusBadge'
import { AppTable } from '../../components/common/AppTable'
import { SearchAndFilter } from '../../components/common/SearchAndFilter'
import type { SmartColumn } from '../../components/common/SearchAndFilter'
import { KpiRow } from '../../components/common/KpiRow'
import type { KpiItem } from '../../components/common/KpiRow'
import { PageHeader } from '../../components/common/PageHeader'
import { appConfirm } from '../../components/common/AppConfirm'
import { FormHint } from '../../components/common/FormHint'
import { NepaliDatePicker } from '../../components/nepali-calendar'
import { exportCsv } from '../../utils/csv'
import {
    EligibilityType,
    MOCK_ACADEMIC_YEARS,
    MOCK_CLASS_OPTIONS,
    MOCK_SCHOLARSHIPS,
    ScholarshipStatus,
    ScholarshipType,
    type Scholarship,
    type ScholarshipFormValues,
} from './mockData'

const { Text } = Typography

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
    { label: 'Percentage (%)', value: ScholarshipType.PERCENTAGE },
    { label: 'Fixed Amount (Rs.)', value: ScholarshipType.FIXED_AMOUNT },
]

const STATUS_OPTIONS = [
    { label: 'Active', value: ScholarshipStatus.ACTIVE },
    { label: 'Inactive', value: ScholarshipStatus.INACTIVE },
]

const ELIGIBILITY_OPTIONS = [
    { label: 'Merit Based', value: EligibilityType.MERIT_BASED },
    { label: 'Means Based', value: EligibilityType.MEANS_BASED },
    { label: 'Special Achievement', value: EligibilityType.SPECIAL_ACHIEVEMENT },
    { label: 'Staff Ward', value: EligibilityType.STAFF_WARD },
]

const ACADEMIC_YEAR_OPTIONS = MOCK_ACADEMIC_YEARS.map((year) => ({ label: year, value: year }))
const CLASS_OPTIONS = MOCK_CLASS_OPTIONS.map((name) => ({ label: name, value: name }))

const TYPE_LABELS: Record<string, string> = {
    [ScholarshipType.PERCENTAGE]: 'Percentage',
    [ScholarshipType.FIXED_AMOUNT]: 'Fixed Amount',
}

const ELIGIBILITY_LABELS: Record<string, string> = {
    [EligibilityType.MERIT_BASED]: 'Merit Based',
    [EligibilityType.MEANS_BASED]: 'Means Based',
    [EligibilityType.SPECIAL_ACHIEVEMENT]: 'Special Achievement',
    [EligibilityType.STAFF_WARD]: 'Staff Ward',
}

const ELIGIBILITY_COLORS: Record<string, string> = {
    [EligibilityType.MERIT_BASED]: 'gold',
    [EligibilityType.MEANS_BASED]: 'blue',
    [EligibilityType.SPECIAL_ACHIEVEMENT]: 'cyan',
    [EligibilityType.STAFF_WARD]: 'purple',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ScholarshipSortBy = 'name' | 'value' | 'assignedStudents' | 'createdAt'
type SortOrder = 'ASC' | 'DESC'

function formatMoney(value: number | string | null | undefined): string {
    if (value == null || value === '') return 'Rs. 0'
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (Number.isNaN(num)) return 'Rs. 0'
    return `Rs. ${num.toLocaleString('en-IN')}`
}

function formatScholarshipValue(record: Scholarship): string {
    if (record.coverAllFees) return 'Full Fee'
    const num = parseFloat(record.value)
    if (Number.isNaN(num)) return '—'
    return record.type === ScholarshipType.PERCENTAGE
        ? `${num}%`
        : formatMoney(num)
}

function formatClassScope(classes: string[]): string {
    if (classes.length === 0 || classes.length >= MOCK_CLASS_OPTIONS.length) return 'All Classes'
    if (classes.length <= 2) return classes.join(', ')
    return `${classes.slice(0, 2).join(', ')} +${classes.length - 2} more`
}

function columnSortOrder(sortBy: ScholarshipSortBy, sortOrder: SortOrder, key: ScholarshipSortBy) {
    return sortBy === key ? (sortOrder === 'ASC' ? 'ascend' : 'descend') : null
}

const CSV_HEADERS = [
    'Code', 'Name', 'Eligibility', 'Type', 'Value', 'Classes', 'Academic Year',
    'Assigned', 'Quota', 'Awarded (Rs.)', 'Status', 'Effective Date (BS)', 'Expiry Date (BS)',
]

function toCsvRow(s: Scholarship) {
    return [
        s.code,
        s.name,
        ELIGIBILITY_LABELS[s.eligibilityType],
        TYPE_LABELS[s.type],
        s.coverAllFees ? 'Full Fee' : s.type === ScholarshipType.PERCENTAGE ? `${s.value}%` : `Rs. ${s.value}`,
        formatClassScope(s.applicableClasses),
        s.academicYear,
        s.assignedStudents,
        s.maxBeneficiaries ?? 'Unlimited',
        s.awardedAmount,
        s.status,
        s.effectiveDateBS || s.effectiveDate,
        s.expiryDateBS || s.expiryDate,
    ]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScholarshipPage() {
    const { can } = usePermission()
    const canCreate = can(FEATURES.DISCOUNT_SCHOLARSHIP, ACTIONS.CREATE)
    const canUpdate = can(FEATURES.DISCOUNT_SCHOLARSHIP, ACTIONS.UPDATE)
    const canDelete = can(FEATURES.DISCOUNT_SCHOLARSHIP, ACTIONS.DELETE)

    // Mock store — swap for the scholarships API hooks once the endpoints exist.
    const [scholarships, setScholarships] = useState<Scholarship[]>(MOCK_SCHOLARSHIPS)

    // ── URL query state ───────────────────────────────────────────────────────
    const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))
    const [statusFilter, setStatusFilter] = useQueryState('status')
    const [eligibilityFilter, setEligibilityFilter] = useQueryState('eligibility')
    const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
    const [limit, setLimit] = useQueryState('limit', parseAsInteger.withDefault(10))
    const [sortBy, setSortBy] = useQueryState('sortBy', parseAsString.withDefault('createdAt'))
    const [sortOrder, setSortOrder] = useQueryState(
        'sortOrder',
        parseAsStringLiteral(['ASC', 'DESC'] as const).withDefault('DESC'),
    )

    // ── Drawer state ──────────────────────────────────────────────────────────
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null)
    const [viewingScholarship, setViewingScholarship] = useState<Scholarship | null>(null)
    const [pendingStatusId, setPendingStatusId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [form] = Form.useForm<ScholarshipFormValues>()

    // ── Filtering + sorting ───────────────────────────────────────────────────
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase()
        const rows = scholarships.filter((s) => {
            if (term && !`${s.name} ${s.code}`.toLowerCase().includes(term)) return false
            if (statusFilter && s.status !== statusFilter) return false
            if (eligibilityFilter && s.eligibilityType !== eligibilityFilter) return false
            return true
        })

        const key = sortBy as ScholarshipSortBy
        const direction = sortOrder === 'ASC' ? 1 : -1
        return [...rows].sort((a, b) => {
            if (key === 'value') return (parseFloat(a.value) - parseFloat(b.value)) * direction
            if (key === 'assignedStudents') return (a.assignedStudents - b.assignedStudents) * direction
            if (key === 'createdAt') return (Date.parse(a.createdAt) - Date.parse(b.createdAt)) * direction
            return a.name.localeCompare(b.name) * direction
        })
    }, [scholarships, search, statusFilter, eligibilityFilter, sortBy, sortOrder])

    const paged = useMemo(() => {
        const start = (page - 1) * limit
        return filtered.slice(start, start + limit)
    }, [filtered, page, limit])

    // ── KPI cards ─────────────────────────────────────────────────────────────
    const kpiCards = useMemo<KpiItem[]>(() => {
        const active = scholarships.filter((s) => s.status === ScholarshipStatus.ACTIVE)
        const beneficiaries = scholarships.reduce((sum, s) => sum + s.assignedStudents, 0)
        const awarded = scholarships.reduce((sum, s) => sum + s.awardedAmount, 0)
        const fullFee = active.filter((s) => s.coverAllFees).length
        return [
            {
                key: 'total',
                icon: <TrophyOutlined />,
                label: 'Total Scholarships',
                value: scholarships.length,
                color: colors.primary,
                iconBg: colors.primaryLight,
            },
            {
                key: 'active',
                icon: <CheckCircleOutlined />,
                label: 'Active',
                value: active.length,
                color: colors.success,
                iconBg: colors.successLight,
            },
            {
                key: 'full-fee',
                icon: <PercentageOutlined />,
                label: 'Full Fee Waivers',
                value: fullFee,
                color: colors.info,
                iconBg: colors.infoLight,
            },
            {
                key: 'beneficiaries',
                icon: <TeamOutlined />,
                label: 'Beneficiaries',
                value: beneficiaries,
                color: colors.warning,
                iconBg: colors.warningLight,
            },
            {
                key: 'awarded',
                icon: <WalletOutlined />,
                label: 'Awarded Amount',
                value: formatMoney(awarded),
                color: colors.muted,
                iconBg: colors.secondary,
            },
        ]
    }, [scholarships])

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleOpenAdd = () => {
        setEditingScholarship(null)
        form.resetFields()
        form.setFieldsValue({
            type: ScholarshipType.PERCENTAGE,
            coverAllFees: false,
            eligibilityType: EligibilityType.MERIT_BASED,
            academicYear: MOCK_ACADEMIC_YEARS[0],
            applicableClasses: [],
        })
        setDrawerOpen(true)
    }

    const handleOpenEdit = (scholarship: Scholarship) => {
        setEditingScholarship(scholarship)
        form.resetFields()
        form.setFieldsValue({
            name: scholarship.name,
            description: scholarship.description ?? undefined,
            type: scholarship.type,
            value: parseFloat(scholarship.value),
            coverAllFees: scholarship.coverAllFees,
            eligibilityType: scholarship.eligibilityType,
            academicYear: scholarship.academicYear,
            applicableClasses: scholarship.applicableClasses,
            maxBeneficiaries: scholarship.maxBeneficiaries ?? undefined,
            effectiveDateBS: scholarship.effectiveDateBS || scholarship.effectiveDate,
            expiryDateBS: scholarship.expiryDateBS || scholarship.expiryDate || undefined,
        })
        setDrawerOpen(true)
    }

    const handleFormSubmit = async () => {
        try {
            const values = await form.validateFields()
            setIsSaving(true)

            if (editingScholarship) {
                setScholarships((prev) =>
                    prev.map((s) =>
                        s.id === editingScholarship.id
                            ? {
                                ...s,
                                ...values,
                                description: values.description?.trim() || null,
                                value: (values.value ?? 0).toFixed(2),
                                applicableClasses: values.applicableClasses ?? [],
                                maxBeneficiaries: values.maxBeneficiaries ?? null,
                                effectiveDate: values.effectiveDateBS,
                                expiryDateBS: values.expiryDateBS ?? null,
                                expiryDate: values.expiryDateBS ?? null,
                                updatedAt: new Date().toISOString(),
                            }
                            : s,
                    ),
                )
                toast.success('Scholarship updated successfully')
            } else {
                const now = new Date().toISOString()
                setScholarships((prev) => [
                    {
                        ...values,
                        id: `sch-${Date.now()}`,
                        code: `SCH-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
                        description: values.description?.trim() || null,
                        value: (values.value ?? 0).toFixed(2),
                        applicableClasses: values.applicableClasses ?? [],
                        maxBeneficiaries: values.maxBeneficiaries ?? null,
                        effectiveDate: values.effectiveDateBS,
                        expiryDateBS: values.expiryDateBS ?? null,
                        expiryDate: values.expiryDateBS ?? null,
                        assignedStudents: 0,
                        awardedAmount: 0,
                        status: ScholarshipStatus.ACTIVE,
                        createdAt: now,
                        updatedAt: now,
                    },
                    ...prev,
                ])
                toast.success('Scholarship created successfully')
            }

            setDrawerOpen(false)
            form.resetFields()
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'errorFields' in err) {
                toast.error('Please fix the errors in the form before submitting')
            } else {
                toast.error((err as Error)?.message ?? 'Failed to save scholarship')
            }
        } finally {
            setIsSaving(false)
        }
    }

    const handleToggleStatus = (scholarship: Scholarship) => {
        const nextStatus =
            scholarship.status === ScholarshipStatus.ACTIVE
                ? ScholarshipStatus.INACTIVE
                : ScholarshipStatus.ACTIVE
        const activating = nextStatus === ScholarshipStatus.ACTIVE

        appConfirm({
            title: `${activating ? 'Activate' : 'Deactivate'} Scholarship?`,
            content: `Are you sure you want to ${activating ? 'activate' : 'deactivate'} "${scholarship.name}"?`,
            okText: activating ? 'Activate' : 'Deactivate',
            okColor: activating ? 'green' : 'amber',
            onOk: async () => {
                setPendingStatusId(scholarship.id)
                try {
                    await new Promise((resolve) => setTimeout(resolve, 250))
                    setScholarships((prev) =>
                        prev.map((s) =>
                            s.id === scholarship.id
                                ? { ...s, status: nextStatus, updatedAt: new Date().toISOString() }
                                : s,
                        ),
                    )
                    toast.success(`Scholarship ${activating ? 'activated' : 'deactivated'} successfully`)
                } catch (err) {
                    toast.error((err as Error)?.message ?? 'Failed to update scholarship status')
                } finally {
                    setPendingStatusId(null)
                }
            },
        })
    }

    const handleDelete = (scholarship: Scholarship) => {
        appConfirm({
            title: 'Delete Scholarship?',
            content: `Are you sure you want to delete "${scholarship.name}" (${scholarship.code})? This cannot be undone once assignments exist.`,
            okText: 'Delete',
            okColor: 'danger',
            onOk: async () => {
                try {
                    await new Promise((resolve) => setTimeout(resolve, 250))
                    setScholarships((prev) => prev.filter((s) => s.id !== scholarship.id))
                    toast.success('Scholarship deleted successfully')
                } catch (err) {
                    toast.error((err as Error)?.message ?? 'Failed to delete scholarship')
                }
            },
        })
    }

    const handleExportCsv = () => {
        const ok = exportCsv('scholarships', CSV_HEADERS, filtered.map(toCsvRow))
        if (!ok) toast.warning('No scholarships available to export')
        else toast.success('Scholarships exported to CSV')
    }

    const handleTableChange = (
        pagination: TablePaginationConfig,
        _filters: unknown,
        sorter: SorterResult<Scholarship> | SorterResult<Scholarship>[],
    ) => {
        if (pagination.current) setPage(pagination.current)
        if (pagination.pageSize) {
            setLimit(pagination.pageSize)
            setPage(1)
        }
        const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter
        if (!activeSorter?.order || !activeSorter.columnKey) return
        const nextSortBy = activeSorter.columnKey as ScholarshipSortBy
        const nextSortOrder: SortOrder = activeSorter.order === 'ascend' ? 'ASC' : 'DESC'
        if (nextSortBy === sortBy && nextSortOrder === sortOrder) return
        setSortBy(nextSortBy)
        setSortOrder(nextSortOrder)
        setPage(1)
    }

    // ── Filter columns ────────────────────────────────────────────────────────
    const filterColumns: SmartColumn[] = [
        { key: 'name', title: 'Scholarship Name / Code', isSearchable: true },
        {
            key: 'status',
            title: 'Status',
            isFilterable: true,
            filterWidth: 140,
            filterOptions: STATUS_OPTIONS,
        },
        {
            key: 'eligibility',
            title: 'Eligibility',
            isFilterable: true,
            filterWidth: 190,
            filterOptions: ELIGIBILITY_OPTIONS,
        },
    ]

    // ── Table columns ─────────────────────────────────────────────────────────
    const columns: ColumnsType<Scholarship> = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: 230,
            sorter: true,
            sortOrder: columnSortOrder(sortBy as ScholarshipSortBy, sortOrder, 'name'),
            render: (text: string, record: Scholarship) => (
                <div>
                    <span style={{ fontWeight: 500 }}>{text}</span>
                    {record.description && (
                        <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                            {record.description}
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Code',
            dataIndex: 'code',
            key: 'code',
            width: 160,
            render: (code?: string) =>
                code ? (
                    <Tooltip title="Auto-generated · immutable">
                        <Tag
                            color="blue"
                            style={{
                                fontFamily: 'monospace',
                                fontWeight: 600,
                                borderRadius: 6,
                                cursor: 'default',
                                letterSpacing: '0.02em',
                            }}
                        >
                            {code}
                        </Tag>
                    </Tooltip>
                ) : (
                    <span style={{ color: colors.muted }}>—</span>
                ),
        },
        {
            title: 'Eligibility',
            dataIndex: 'eligibilityType',
            key: 'eligibilityType',
            width: 165,
            render: (eligibility: EligibilityType) => (
                <Tag color={ELIGIBILITY_COLORS[eligibility]} style={{ borderRadius: 6, fontWeight: 500 }}>
                    {ELIGIBILITY_LABELS[eligibility] || eligibility}
                </Tag>
            ),
        },
        {
            title: 'Benefit',
            key: 'value',
            width: 140,
            sorter: true,
            sortOrder: columnSortOrder(sortBy as ScholarshipSortBy, sortOrder, 'value'),
            render: (_: unknown, record: Scholarship) => (
                <span
                    style={{
                        fontFamily: record.coverAllFees ? 'inherit' : 'monospace',
                        fontWeight: 600,
                        color: colors.primary,
                    }}
                >
                    {formatScholarshipValue(record)}
                </span>
            ),
        },
        {
            title: 'Applies To',
            dataIndex: 'applicableClasses',
            key: 'applicableClasses',
            width: 180,
            render: (classes: string[]) => (
                <Tooltip title={classes.length ? classes.join(', ') : 'All classes'}>
                    <span style={{ color: colors.textSecondary, cursor: 'default' }}>
                        {formatClassScope(classes ?? [])}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: 'Academic Year',
            dataIndex: 'academicYear',
            key: 'academicYear',
            width: 130,
            render: (year: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{year}</span>,
        },
        {
            title: 'Beneficiaries',
            dataIndex: 'assignedStudents',
            key: 'assignedStudents',
            width: 145,
            sorter: true,
            sortOrder: columnSortOrder(
                sortBy as ScholarshipSortBy,
                sortOrder,
                'assignedStudents',
            ),
            render: (assigned: number, record: Scholarship) => (
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {assigned}
                    <span style={{ color: colors.muted }}>
                        {' / '}
                        {record.maxBeneficiaries ?? '∞'}
                    </span>
                </span>
            ),
        },
        {
            title: 'Awarded',
            dataIndex: 'awardedAmount',
            key: 'awardedAmount',
            width: 130,
            align: 'right',
            render: (amount: number) => (
                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 500 }}>
                    {formatMoney(amount)}
                </span>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            render: (status: ScholarshipStatus, record: Scholarship) => (
                <div
                    onClick={(e) => {
                        if (canUpdate) {
                            e.stopPropagation()
                            handleToggleStatus(record)
                        }
                    }}
                    title={
                        canUpdate
                            ? status === ScholarshipStatus.ACTIVE
                                ? 'Click to deactivate'
                                : 'Click to activate'
                            : undefined
                    }
                    style={{
                        display: 'inline-block',
                        cursor: canUpdate ? 'pointer' : 'default',
                        opacity: pendingStatusId === record.id ? 0.5 : 1,
                        transition: 'opacity 0.2s',
                    }}
                >
                    <StatusBadge status={status} />
                </div>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 120,
            sorter: true,
            sortOrder: columnSortOrder(sortBy as ScholarshipSortBy, sortOrder, 'createdAt'),
            render: (v: string) => (
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {v ? new Date(v).toLocaleDateString() : '—'}
                </span>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: canDelete ? 120 : 80,
            align: 'center',
            render: (_: unknown, record: Scholarship) => (
                <Space size={6} onClick={(e) => e.stopPropagation()}>
                    <Button
                        type="default"
                        size="small"
                        icon={<EyeOutlined />}
                        title="View details"
                        onClick={() => setViewingScholarship(record)}
                        style={{ borderRadius: radius.sm, borderColor: colors.border, color: colors.muted }}
                    />
                    {canUpdate && (
                        <Button
                            type="default"
                            size="small"
                            icon={<EditOutlined />}
                            title="Edit scholarship"
                            onClick={() => handleOpenEdit(record)}
                            style={{ borderRadius: radius.sm, borderColor: colors.border, color: colors.muted }}
                        />
                    )}
                    {canDelete && (
                        <Button
                            type="default"
                            size="small"
                            icon={<DeleteOutlined />}
                            title="Delete scholarship"
                            danger
                            onClick={() => handleDelete(record)}
                            style={{ borderRadius: radius.sm }}
                        />
                    )}
                </Space>
            ),
        },
    ]

    return (
        <div>
            {/* ── Header ───────────────────────────────────────────────────── */}
            <PageHeader
                title="Scholarships"
                description="Eligibility, benefit value, class scope and beneficiaries"
                actions={
                    <>
                        <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
                            Export CSV
                        </Button>
                        {canCreate && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                style={{ background: colors.primary }}
                                onClick={handleOpenAdd}
                            >
                                Add Scholarship
                            </Button>
                        )}
                    </>
                }
            />

            {/* ── KPI Cards ─────────────────────────────────────────────────── */}
            <KpiRow items={kpiCards} />

            {/* ── Search & Filter ───────────────────────────────────────────── */}
            <SearchAndFilter
                columns={filterColumns}
                searchValue={search}
                onSearchChange={(val) => {
                    setSearch(val)
                    setPage(1)
                }}
                debounceMs={300}
                filterValues={{
                    status: statusFilter || undefined,
                    eligibility: eligibilityFilter || undefined,
                }}
                onFilterChange={(key, val) => {
                    if (key === 'status') setStatusFilter(val || null)
                    if (key === 'eligibility') setEligibilityFilter(val || null)
                    setPage(1)
                }}
            />

            {/* ── Table ────────────────────────────────────────────────────── */}
            <AppTable<Scholarship>
                rowKey="id"
                columns={columns}
                dataSource={paged}
                onChange={handleTableChange}
                onRowClick={(record) => setViewingScholarship(record)}
                pagination={{
                    current: page,
                    pageSize: limit,
                    total: filtered.length,
                    showSizeChanger: true,
                }}
                scroll={{ x: 1500 }}
                locale={{ emptyText: 'No scholarships found.' }}
            />

            {/* ── Add / Edit Drawer ────────────────────────────────────────── */}
            <Drawer
                title={
                    editingScholarship
                        ? `Edit Scholarship — ${editingScholarship.name}`
                        : 'Add Scholarship'
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
                            {editingScholarship ? 'Save Changes' : 'Create Scholarship'}
                        </Button>
                    </Space>
                }
            >
                {/* Code — generated on create, read-only once assigned */}
                {editingScholarship && (
                    <div
                        style={{
                            marginBottom: 20,
                            padding: '10px 14px',
                            background: colors.surfaceAlt,
                            borderRadius: 8,
                            border: `1px solid ${colors.border}`,
                            fontSize: 13,
                        }}
                    >
                        <span style={{ color: colors.muted }}>Scholarship Code: </span>
                        <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            {editingScholarship.code}
                        </Tag>
                        <span style={{ color: colors.muted, marginLeft: 8, fontSize: 12 }}>
                            (immutable — cannot be changed)
                        </span>
                    </div>
                )}

                <Form form={form} layout="vertical" requiredMark>
                    <Form.Item
                        name="name"
                        label="Scholarship Name"
                        rules={[
                            { required: true, message: 'Please enter a scholarship name' },
                            { max: 100, message: 'Name must be at most 100 characters' },
                        ]}
                    >
                        <Input placeholder="e.g. Merit Toppers Scholarship" maxLength={100} />
                    </Form.Item>

                    <Form.Item name="description" label="Description">
                        <Input.TextArea
                            rows={3}
                            placeholder="Brief description of who this scholarship is for..."
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="eligibilityType"
                                label="Eligibility Type"
                                rules={[{ required: true, message: 'Please select an eligibility type' }]}
                            >
                                <Select placeholder="Select eligibility" options={ELIGIBILITY_OPTIONS} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="academicYear"
                                label="Academic Year"
                                rules={[{ required: true, message: 'Please select an academic year' }]}
                            >
                                <Select placeholder="Select academic year" options={ACADEMIC_YEAR_OPTIONS} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="type"
                                label="Benefit Type"
                                rules={[{ required: true, message: 'Please select a type' }]}
                            >
                                <Select
                                    placeholder="Select type"
                                    options={TYPE_OPTIONS}
                                    onChange={() => form.setFieldValue('value', undefined)}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            {/* Re-renders on type change so validation bounds update */}
                            <Form.Item shouldUpdate={(prev, curr) => prev.type !== curr.type} noStyle>
                                {() => {
                                    const isPercentage = form.getFieldValue('type') === ScholarshipType.PERCENTAGE
                                    return (
                                        <Form.Item
                                            name="value"
                                            label={isPercentage ? 'Benefit (%)' : 'Benefit Amount (Rs.)'}
                                            rules={[
                                                { required: true, message: 'Please enter a value' },
                                                {
                                                    type: 'number',
                                                    min: 0.01,
                                                    max: isPercentage ? 100 : undefined,
                                                    message: isPercentage
                                                        ? 'Percentage must be between 0 and 100'
                                                        : 'Amount must be greater than 0',
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                min={0}
                                                max={isPercentage ? 100 : undefined}
                                                addonAfter={isPercentage ? '%' : 'Rs.'}
                                                placeholder={isPercentage ? '0 – 100' : '0.00'}
                                                precision={2}
                                            />
                                        </Form.Item>
                                    )
                                }}
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="coverAllFees"
                        label="Full Fee Waiver"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="Yes" unCheckedChildren="No" />
                    </Form.Item>

                    <Form.Item
                        name="applicableClasses"
                        label="Applicable Classes"
                        extra={<FormHint>Leave empty to apply to every class</FormHint>}
                    >
                        <Select
                            mode="multiple"
                            allowClear
                            placeholder="All classes"
                            options={CLASS_OPTIONS}
                            maxTagCount="responsive"
                        />
                    </Form.Item>

                    <Form.Item name="maxBeneficiaries" label="Beneficiary Quota">
                        <InputNumber style={{ width: '100%' }} min={0} placeholder="Unlimited" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="effectiveDateBS"
                                label="Effective Date (BS)"
                                rules={[{ required: true, message: 'Please select the effective date' }]}
                                extra={<FormHint>Nepali calendar — YYYY-MM-DD</FormHint>}
                            >
                                <NepaliDatePicker
                                    size="middle"
                                    zIndex={1100}
                                    style={{ width: '100%' }}
                                    placeholder="Select effective date"
                                    showAdEquivalent
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="expiryDateBS"
                                label="Expiry Date (BS)"
                                extra={<FormHint>Leave blank for no expiry</FormHint>}
                            >
                                <NepaliDatePicker
                                    size="middle"
                                    zIndex={1100}
                                    style={{ width: '100%' }}
                                    placeholder="No expiry"
                                    showAdEquivalent
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Drawer>

            {/* ── View Details Drawer ───────────────────────────────────────── */}
            <Drawer
                title="Scholarship Details"
                open={!!viewingScholarship}
                onClose={() => setViewingScholarship(null)}
                size="large"
                extra={
                    viewingScholarship && canUpdate ? (
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            style={{ background: colors.primary }}
                            onClick={() => {
                                handleOpenEdit(viewingScholarship)
                                setViewingScholarship(null)
                            }}
                        >
                            Edit
                        </Button>
                    ) : null
                }
            >
                {viewingScholarship && (
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Scholarship Name">
                            <Text strong>{viewingScholarship.name}</Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Code">
                            <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                {viewingScholarship.code}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                auto-generated · immutable
                            </Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Description">
                            {viewingScholarship.description || <Text type="secondary">—</Text>}
                        </Descriptions.Item>

                        <Descriptions.Item label="Eligibility Type">
                            <Tag
                                color={ELIGIBILITY_COLORS[viewingScholarship.eligibilityType]}
                                style={{ borderRadius: 6, fontWeight: 500 }}
                            >
                                {ELIGIBILITY_LABELS[viewingScholarship.eligibilityType]}
                            </Tag>
                        </Descriptions.Item>

                        <Descriptions.Item label="Benefit">
                            <Text
                                strong
                                style={{
                                    fontFamily: viewingScholarship.coverAllFees ? 'inherit' : 'monospace',
                                    color: colors.primary,
                                    fontSize: 15,
                                }}
                            >
                                {formatScholarshipValue(viewingScholarship)}
                            </Text>
                            {viewingScholarship.coverAllFees ? (
                                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                    full tuition waiver
                                </Text>
                            ) : null}
                        </Descriptions.Item>

                        <Descriptions.Item label="Academic Year">
                            <Text style={{ fontFamily: 'monospace' }}>{viewingScholarship.academicYear}</Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Applicable Classes">
                            {formatClassScope(viewingScholarship.applicableClasses)}
                        </Descriptions.Item>

                        <Descriptions.Item label="Beneficiaries">
                            <Text style={{ fontFamily: 'monospace' }}>
                                {viewingScholarship.assignedStudents} assigned
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                quota {viewingScholarship.maxBeneficiaries ?? 'unlimited'}
                            </Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Awarded Amount">
                            <Text strong style={{ fontFamily: 'monospace' }}>
                                {formatMoney(viewingScholarship.awardedAmount)}
                            </Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Status">
                            <StatusBadge status={viewingScholarship.status} />
                        </Descriptions.Item>

                        <Descriptions.Item label="Effective Date (BS)">
                            <Text style={{ fontFamily: 'monospace' }}>
                                {viewingScholarship.effectiveDateBS || viewingScholarship.effectiveDate}
                            </Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Effective Date (AD)">
                            <Text style={{ fontFamily: 'monospace' }}>
                                {viewingScholarship.effectiveDate}
                            </Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Expiry Date (BS)">
                            <Text
                                style={{
                                    fontFamily: 'monospace',
                                    color:
                                        viewingScholarship.expiryDateBS || viewingScholarship.expiryDate
                                            ? colors.text
                                            : colors.muted,
                                }}
                            >
                                {viewingScholarship.expiryDateBS ||
                                    viewingScholarship.expiryDate ||
                                    'No expiry'}
                            </Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Expiry Date (AD)">
                            <Text
                                style={{
                                    fontFamily: 'monospace',
                                    color: viewingScholarship.expiryDate ? colors.text : colors.muted,
                                }}
                            >
                                {viewingScholarship.expiryDate || 'No expiry'}
                            </Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Created At">
                            <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                {new Date(viewingScholarship.createdAt).toLocaleString()}
                            </Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Last Updated">
                            <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                {new Date(viewingScholarship.updatedAt).toLocaleString()}
                            </Text>
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Drawer>
        </div>
    )
}