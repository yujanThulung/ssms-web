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
import { useQueryClient } from '@tanstack/react-query'
import {
    CheckCircleOutlined,
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    EyeOutlined,
    LinkOutlined,
    PercentageOutlined,
    PlusOutlined,
    TagOutlined,
    TrophyOutlined,
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
import { TableSkeleton } from '../../components/skeleton'
import { NepaliDatePicker } from '../../components/nepali-calendar'
import { StatusChangeModal } from '../../components/common/StatusChangeModal'
import { exportCsv } from '../../utils/csv'
import apiClient from '../../lib/api/client'
import { ENDPOINTS } from '../../lib/api/endpoints'
import {
    useScholarships,
    useCreateScholarship,
    useUpdateScholarship,
    useDeleteScholarship,
    ScholarshipType,
    ScholarshipStatus,
    type Scholarship,
    type CreateScholarshipPayload,
    type UpdateScholarshipPayload,
    type ScholarshipSortBy,
    type ScholarshipSortOrder,
} from '../../features/scholarships'
import type { ApiResponse } from '../../lib/api/types'
import type { ScholarshipFormValues } from '../../features/scholarships/types'

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

const TYPE_LABELS: Record<string, string> = {
    [ScholarshipType.PERCENTAGE]: 'Percentage',
    [ScholarshipType.FIXED_AMOUNT]: 'Fixed Amount',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatScholarshipValue(type: ScholarshipType, value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '—'
    return type === ScholarshipType.PERCENTAGE
        ? `${num}%`
        : `Rs. ${num.toLocaleString('en-IN')}`
}

function columnSortOrder(
    sortBy: ScholarshipSortBy,
    sortOrder: ScholarshipSortOrder,
    key: ScholarshipSortBy
) {
    return sortBy === key ? (sortOrder === 'ASC' ? 'ascend' : 'descend') : null
}

const CSV_HEADERS = [
    'Code', 'Name', 'Type', 'Value', 'Can Combine',
    'Status', 'Effective Date (BS)', 'Expiry Date (BS)', 'Description', 'Created At',
]

function toCsvRow(s: Scholarship) {
    return [
        s.code,
        s.name,
        TYPE_LABELS[s.type] || s.type,
        parseFloat(s.value).toFixed(2),
        s.canCombine ? 'Yes' : 'No',
        s.status,
        s.effectiveDateBS || s.effectiveDate,
        s.expiryDateBS || s.expiryDate,
        s.description,
        s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '',
    ]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScholarshipPage() {
    const { can } = usePermission()
    const canCreate = can(FEATURES.DISCOUNT_SCHOLARSHIP, ACTIONS.CREATE)
    const canUpdate = can(FEATURES.DISCOUNT_SCHOLARSHIP, ACTIONS.UPDATE)
    const canDelete = can(FEATURES.DISCOUNT_SCHOLARSHIP, ACTIONS.DELETE)
    const qc = useQueryClient()

    // ── URL query state ───────────────────────────────────────────────────────
    const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))
    const [statusFilter, setStatusFilter] = useQueryState('status')
    const [typeFilter, setTypeFilter] = useQueryState('type')
    const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
    const [limit, setLimit] = useQueryState('limit', parseAsInteger.withDefault(10))
    const [sortBy, setSortBy] = useQueryState('sortBy', parseAsString.withDefault('createdAt'))
    const [sortOrder, setSortOrder] = useQueryState(
        'sortOrder',
        parseAsStringLiteral(['ASC', 'DESC'] as const).withDefault('DESC')
    )

    // ── Drawer state ──────────────────────────────────────────────────────────
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null)
    const [viewingScholarship, setViewingScholarship] = useState<Scholarship | null>(null)
    const [statusScholarship, setStatusScholarship] = useState<Scholarship | null>(null)
    const [pendingStatusId, setPendingStatusId] = useState<string | null>(null)
    const [form] = Form.useForm<ScholarshipFormValues>()

    // ── Data ──────────────────────────────────────────────────────────────────
    const listParams = useMemo(
        () => ({
            page,
            limit,
            search: search || undefined,
            status: statusFilter || undefined,
            type: typeFilter || undefined,
            sortBy: sortBy as ScholarshipSortBy,
            sortOrder,
        }),
        [page, limit, search, statusFilter, typeFilter, sortBy, sortOrder]
    )

    const { data, isLoading, isFetching } = useScholarships(listParams)

    const scholarships: Scholarship[] = useMemo(() => {
        if (!data) return []
        if (Array.isArray(data.data)) return data.data
        return []
    }, [data])

    const meta = useMemo(() => {
        if (data && typeof data === 'object' && 'meta' in data) {
            return (data as unknown as Record<string, unknown>).meta as
                | { total?: number }
                | undefined
        }
        return undefined
    }, [data])

    // ── Mutations ─────────────────────────────────────────────────────────────
    const { mutateAsync: createScholarship, isPending: isCreating } = useCreateScholarship()
    const { mutateAsync: updateScholarship, isPending: isUpdating } = useUpdateScholarship(
        editingScholarship?.id ?? ''
    )
    const { mutateAsync: deleteScholarship } = useDeleteScholarship()

    const isSaving = isCreating || isUpdating

    /** Invalidate the scholarship list after a status change */
    const invalidateScholarships = () =>
        qc.invalidateQueries({
            predicate: (q) => {
                const key = q.queryKey[0]
                return typeof key === 'string' && key.startsWith(ENDPOINTS.SCHOLARSHIPS.BASE)
            },
        })

    // ── KPI cards ─────────────────────────────────────────────────────────────
    const kpiCards = useMemo<KpiItem[]>(() => {
        const total = meta?.total ?? scholarships.length
        const active = scholarships.filter((s) => s.status === ScholarshipStatus.ACTIVE).length
        const percentage = scholarships.filter((s) => s.type === ScholarshipType.PERCENTAGE).length
        const fixed = scholarships.filter((s) => s.type === ScholarshipType.FIXED_AMOUNT).length
        const combinable = scholarships.filter((s) => s.canCombine).length
        return [
            {
                key: 'total',
                icon: <TrophyOutlined />,
                label: 'Total Scholarships',
                value: total,
                color: colors.primary,
                iconBg: colors.primaryLight,
            },
            {
                key: 'active',
                icon: <CheckCircleOutlined />,
                label: 'Active',
                value: active,
                color: colors.success,
                iconBg: colors.successLight,
            },
            {
                key: 'percentage',
                icon: <PercentageOutlined />,
                label: 'Percentage',
                value: percentage,
                color: colors.info,
                iconBg: colors.infoLight,
            },
            {
                key: 'fixed',
                icon: <TagOutlined />,
                label: 'Fixed Amount',
                value: fixed,
                color: colors.warning,
                iconBg: colors.warningLight,
            },
            {
                key: 'combinable',
                icon: <LinkOutlined />,
                label: 'Combinable',
                value: combinable,
                color: colors.muted,
                iconBg: colors.secondary,
            },
        ]
    }, [meta?.total, scholarships])

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleOpenAdd = () => {
        setEditingScholarship(null)
        form.resetFields()
        form.setFieldsValue({ type: ScholarshipType.PERCENTAGE, canCombine: false })
        setDrawerOpen(true)
    }

    const handleOpenEdit = (scholarship: Scholarship) => {
        setEditingScholarship(scholarship)
        form.resetFields()
        form.setFieldsValue({
            name: scholarship.name,
            description: scholarship.description ?? '',
            type: scholarship.type,
            value: parseFloat(scholarship.value),
            canCombine: scholarship.canCombine,
            effectiveDateBS: scholarship.effectiveDateBS || scholarship.effectiveDate,
            expiryDateBS: scholarship.expiryDateBS || scholarship.expiryDate || undefined,
        })
        setDrawerOpen(true)
    }

    const handleFormSubmit = async () => {
        try {
            const values = await form.validateFields()
            const payload: CreateScholarshipPayload = {
                name: values.name.trim(),
                description: values.description?.trim() || undefined,
                type: values.type,
                value: values.value,
                canCombine: values.canCombine ?? false,
                effectiveDate: values.effectiveDateBS,
                expiryDate: values.expiryDateBS || null,
            }

            if (editingScholarship) {
                const updatePayload: UpdateScholarshipPayload = { ...payload }
                await updateScholarship(updatePayload)
                toast.success('Scholarship updated successfully')
            } else {
                await createScholarship(payload)
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
        }
    }

    // handleToggleStatus removed in favor of StatusChangeModal inline confirm

    const handleDelete = (scholarship: Scholarship) => {
        appConfirm({
            title: 'Delete Scholarship?',
            content: `Are you sure you want to delete "${scholarship.name}" (${scholarship.code})? This cannot be undone if the scholarship has no approved assignments.`,
            okText: 'Delete',
            okColor: 'danger',
            onOk: async () => {
                try {
                    await deleteScholarship(scholarship.id)
                    toast.success('Scholarship deleted successfully')
                } catch (err) {
                    toast.error((err as Error)?.message ?? 'Failed to delete scholarship')
                }
            },
        })
    }

    const handleExportCsv = () => {
        const ok = exportCsv('scholarships', CSV_HEADERS, scholarships.map(toCsvRow))
        if (!ok) toast.warning('No scholarships available to export')
        else toast.success('Scholarships exported to CSV')
    }

    const handleTableChange = (
        pagination: TablePaginationConfig,
        _filters: unknown,
        sorter: SorterResult<Scholarship> | SorterResult<Scholarship>[]
    ) => {
        if (pagination.current) setPage(pagination.current)
        if (pagination.pageSize) {
            setLimit(pagination.pageSize)
            setPage(1)
        }
        const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter
        if (!activeSorter?.order || !activeSorter.columnKey) return
        const nextSortBy = activeSorter.columnKey as ScholarshipSortBy
        const nextSortOrder: ScholarshipSortOrder =
            activeSorter.order === 'ascend' ? 'ASC' : 'DESC'
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
            key: 'type',
            title: 'Type',
            isFilterable: true,
            filterWidth: 170,
            filterOptions: TYPE_OPTIONS,
        },
    ]

    // ── Table columns ─────────────────────────────────────────────────────────
    const columns: ColumnsType<Scholarship> = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: 220,
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
            width: 175,
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
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            width: 140,
            render: (type: ScholarshipType) => (
                <Tag
                    color={type === ScholarshipType.PERCENTAGE ? 'purple' : 'orange'}
                    style={{ borderRadius: 6, fontWeight: 500 }}
                >
                    {TYPE_LABELS[type] || type}
                </Tag>
            ),
        },
        {
            title: 'Value',
            dataIndex: 'value',
            key: 'value',
            width: 130,
            sorter: true,
            sortOrder: columnSortOrder(sortBy as ScholarshipSortBy, sortOrder, 'value'),
            render: (value: string, record: Scholarship) => (
                <span
                    style={{
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        color: colors.primary,
                    }}
                >
                    {formatScholarshipValue(record.type, value)}
                </span>
            ),
        },
        {
            title: 'Can Combine',
            dataIndex: 'canCombine',
            key: 'canCombine',
            width: 120,
            render: (v: boolean) => (
                <Tag color={v ? 'cyan' : 'default'} style={{ borderRadius: 6 }}>
                    {v ? 'Yes' : 'No'}
                </Tag>
            ),
        },
        {
            title: 'Effective (BS)',
            key: 'effectiveDate',
            width: 140,
            sorter: true,
            sortOrder: columnSortOrder(sortBy as ScholarshipSortBy, sortOrder, 'effectiveDate'),
            render: (_: unknown, record: Scholarship) => (
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {record.effectiveDateBS || record.effectiveDate || '—'}
                </span>
            ),
        },
        {
            title: 'Expiry (BS)',
            key: 'expiryDate',
            width: 130,
            render: (_: unknown, record: Scholarship) => (
                <span
                    style={{
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: record.expiryDateBS || record.expiryDate ? colors.text : colors.muted,
                    }}
                >
                    {record.expiryDateBS || record.expiryDate || 'No expiry'}
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
                            setStatusScholarship(record)
                        }
                    }}
                    title={canUpdate ? 'Change Status' : undefined}
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

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div>
            {/* ── Header ───────────────────────────────────────────────────── */}
            <PageHeader
                title="Scholarships"
                description="Percentage or fixed amount merit awards, with expiry and combination rules"
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
            <KpiRow items={kpiCards} loading={isLoading} />

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
                    type: typeFilter || undefined,
                }}
                onFilterChange={(key, val) => {
                    if (key === 'status') setStatusFilter(val || null)
                    if (key === 'type') setTypeFilter(val || null)
                    setPage(1)
                }}
            />

            {/* ── Table ────────────────────────────────────────────────────── */}
            {isLoading ? (
                <div
                    style={{
                        backgroundColor: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 12,
                        overflow: 'hidden',
                    }}
                >
                    <TableSkeleton rows={Math.min(limit, 5)} columns={8} />
                </div>
            ) : (
                <AppTable<Scholarship>
                    rowKey="id"
                    columns={columns}
                    dataSource={scholarships}
                    loading={isFetching}
                    onRowClick={(record) => setViewingScholarship(record)}
                    onChange={handleTableChange}
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total: meta?.total ?? scholarships.length,
                        showSizeChanger: true,
                    }}
                    scroll={{ x: 1300 }}
                    locale={{ emptyText: 'No scholarships found.' }}
                />
            )}

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
                        <Tag
                            color="blue"
                            style={{ fontFamily: 'monospace', fontWeight: 600 }}
                        >
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
                        <Input placeholder="e.g. Merit Scholarship 2082" maxLength={100} />
                    </Form.Item>

                    <Form.Item name="description" label="Description">
                        <Input.TextArea
                            rows={3}
                            placeholder="Brief description of this scholarship..."
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="type"
                                label="Scholarship Type"
                                rules={[{ required: true, message: 'Please select a type' }]}
                            >
                                <Select
                                    placeholder="Select type"
                                    options={TYPE_OPTIONS}
                                    onChange={() => {
                                        // Reset value when type changes to avoid invalid range
                                        form.setFieldValue('value', undefined)
                                    }}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            {/* Re-renders when type changes so validation bounds update */}
                            <Form.Item shouldUpdate={(prev, curr) => prev.type !== curr.type} noStyle>
                                {() => {
                                    const type = form.getFieldValue('type') as ScholarshipType
                                    const isPercentage = type === ScholarshipType.PERCENTAGE
                                    return (
                                        <Form.Item
                                            name="value"
                                            label={isPercentage ? 'Percentage (%)' : 'Fixed Amount (Rs.)'}
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
                        name="canCombine"
                        label="Can Combine with Other Programs"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="Yes" unCheckedChildren="No" />
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

            <StatusChangeModal<ScholarshipStatus>
                open={!!statusScholarship}
                onClose={() => setStatusScholarship(null)}
                subject={statusScholarship?.name}
                currentLabel={statusScholarship?.status === ScholarshipStatus.ACTIVE ? 'Active' : 'Inactive'}
                currentColor={statusScholarship?.status === ScholarshipStatus.ACTIVE ? 'success' : 'warning'}
                options={
                    statusScholarship?.status === ScholarshipStatus.ACTIVE
                        ? [
                              {
                                  value: ScholarshipStatus.INACTIVE,
                                  label: 'Inactive',
                                  color: 'warning',
                                  help: 'The scholarship will no longer be available for new assignments. Existing assignments remain unaffected.',
                              },
                          ]
                        : [
                              {
                                  value: ScholarshipStatus.ACTIVE,
                                  label: 'Active',
                                  color: 'success',
                                  help: 'The scholarship will become available for new student assignments.',
                              },
                          ]
                }
                onConfirm={async (nextStatus) => {
                    if (!statusScholarship) return
                    setPendingStatusId(statusScholarship.id)
                    try {
                        await apiClient.patch<ApiResponse<Scholarship>>(
                            ENDPOINTS.SCHOLARSHIPS.STATUS(statusScholarship.id),
                            { status: nextStatus }
                        )
                        await invalidateScholarships()
                        toast.success(
                            `Scholarship ${nextStatus === ScholarshipStatus.ACTIVE ? 'activated' : 'deactivated'} successfully`
                        )
                    } catch (err) {
                        toast.error((err as Error)?.message ?? 'Failed to update scholarship status')
                        throw err
                    } finally {
                        setPendingStatusId(null)
                    }
                }}
            />

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
                            <Tag
                                color="blue"
                                style={{ fontFamily: 'monospace', fontWeight: 600 }}
                            >
                                {viewingScholarship.code}
                            </Tag>
                            <Text
                                type="secondary"
                                style={{ fontSize: 12, marginLeft: 8 }}
                            >
                                auto-generated · immutable
                            </Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Description">
                            {viewingScholarship.description || (
                                <Text type="secondary">—</Text>
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="Type">
                            <Tag
                                color={
                                    viewingScholarship.type === ScholarshipType.PERCENTAGE
                                        ? 'purple'
                                        : 'orange'
                                }
                                style={{ borderRadius: 6, fontWeight: 500 }}
                            >
                                {TYPE_LABELS[viewingScholarship.type] || viewingScholarship.type}
                            </Tag>
                        </Descriptions.Item>

                        <Descriptions.Item label="Value">
                            <Text
                                strong
                                style={{
                                    fontFamily: 'monospace',
                                    color: colors.primary,
                                    fontSize: 15,
                                }}
                            >
                                {formatScholarshipValue(viewingScholarship.type, viewingScholarship.value)}
                            </Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Can Combine">
                            <Tag
                                color={viewingScholarship.canCombine ? 'cyan' : 'default'}
                                style={{ borderRadius: 6 }}
                            >
                                {viewingScholarship.canCombine ? 'Yes' : 'No'}
                            </Tag>
                        </Descriptions.Item>

                        <Descriptions.Item label="Status">
                            <StatusBadge status={viewingScholarship.status} />
                        </Descriptions.Item>

                        <Descriptions.Item label="Effective Date (BS)">
                            <Text style={{ fontFamily: 'monospace' }}>
                                {viewingScholarship.effectiveDateBS || viewingScholarship.effectiveDate}
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
                    </Descriptions>
                )}
            </Drawer>
        </div>
    )
}