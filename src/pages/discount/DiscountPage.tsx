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
import { exportCsv } from '../../utils/csv'
import apiClient from '../../lib/api/client'
import { ENDPOINTS } from '../../lib/api/endpoints'
import {
    useDiscounts,
    useCreateDiscount,
    useUpdateDiscount,
    useDeleteDiscount,
    DiscountType,
    DiscountStatus,
    type Discount,
    type CreateDiscountPayload,
    type UpdateDiscountPayload,
    type DiscountSortBy,
    type DiscountSortOrder,
} from '../../features/discounts'
import type { ApiResponse } from '../../lib/api/types'
import type { DiscountFormValues } from '../../features/discounts/types'

const { Text } = Typography

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
    { label: 'Percentage (%)', value: DiscountType.PERCENTAGE },
    { label: 'Fixed Amount (Rs.)', value: DiscountType.FIXED_AMOUNT },
]

const STATUS_OPTIONS = [
    { label: 'Active', value: DiscountStatus.ACTIVE },
    { label: 'Inactive', value: DiscountStatus.INACTIVE },
]

const TYPE_LABELS: Record<string, string> = {
    [DiscountType.PERCENTAGE]: 'Percentage',
    [DiscountType.FIXED_AMOUNT]: 'Fixed Amount',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDiscountValue(type: DiscountType, value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '—'
    return type === DiscountType.PERCENTAGE
        ? `${num}%`
        : `Rs. ${num.toLocaleString('en-IN')}`
}

function columnSortOrder(
    sortBy: DiscountSortBy,
    sortOrder: DiscountSortOrder,
    key: DiscountSortBy
) {
    return sortBy === key ? (sortOrder === 'ASC' ? 'ascend' : 'descend') : null
}

const CSV_HEADERS = [
    'Code', 'Name', 'Type', 'Value', 'Can Combine',
    'Status', 'Effective Date (BS)', 'Expiry Date (BS)', 'Description', 'Created At',
]

function toCsvRow(d: Discount) {
    return [
        d.code,
        d.name,
        TYPE_LABELS[d.type] || d.type,
        parseFloat(d.value).toFixed(2),
        d.canCombine ? 'Yes' : 'No',
        d.status,
        d.effectiveDateBS || d.effectiveDate,
        d.expiryDateBS || d.expiryDate,
        d.description,
        d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '',
    ]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DiscountPage() {
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
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)
    const [viewingDiscount, setViewingDiscount] = useState<Discount | null>(null)
    const [pendingStatusId, setPendingStatusId] = useState<string | null>(null)
    const [form] = Form.useForm<DiscountFormValues>()

    // ── Data ──────────────────────────────────────────────────────────────────
    const listParams = useMemo(
        () => ({
            page,
            limit,
            search: search || undefined,
            status: statusFilter || undefined,
            type: typeFilter || undefined,
            sortBy: sortBy as DiscountSortBy,
            sortOrder,
        }),
        [page, limit, search, statusFilter, typeFilter, sortBy, sortOrder]
    )

    const { data, isLoading, isFetching } = useDiscounts(listParams)

    const discounts: Discount[] = useMemo(() => {
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
    const { mutateAsync: createDiscount, isPending: isCreating } = useCreateDiscount()
    const { mutateAsync: updateDiscount, isPending: isUpdating } = useUpdateDiscount(
        editingDiscount?.id ?? ''
    )
    const { mutateAsync: deleteDiscount } = useDeleteDiscount()

    const isSaving = isCreating || isUpdating

    /** Invalidate the discount list after a status change */
    const invalidateDiscounts = () =>
        qc.invalidateQueries({
            predicate: (q) => {
                const key = q.queryKey[0]
                return typeof key === 'string' && key.startsWith(ENDPOINTS.DISCOUNTS.BASE)
            },
        })

    // ── KPI cards ─────────────────────────────────────────────────────────────
    const kpiCards = useMemo<KpiItem[]>(() => {
        const total = meta?.total ?? discounts.length
        const active = discounts.filter((d) => d.status === DiscountStatus.ACTIVE).length
        const percentage = discounts.filter((d) => d.type === DiscountType.PERCENTAGE).length
        const fixed = discounts.filter((d) => d.type === DiscountType.FIXED_AMOUNT).length
        const combinable = discounts.filter((d) => d.canCombine).length
        return [
            {
                key: 'total',
                icon: <TagOutlined />,
                label: 'Total Discounts',
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
    }, [meta?.total, discounts])

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleOpenAdd = () => {
        setEditingDiscount(null)
        form.resetFields()
        form.setFieldsValue({ type: DiscountType.PERCENTAGE, canCombine: false })
        setDrawerOpen(true)
    }

    const handleOpenEdit = (discount: Discount) => {
        setEditingDiscount(discount)
        form.resetFields()
        form.setFieldsValue({
            name: discount.name,
            description: discount.description ?? '',
            type: discount.type,
            value: parseFloat(discount.value),
            canCombine: discount.canCombine,
            effectiveDateBS: discount.effectiveDateBS || discount.effectiveDate,
            expiryDateBS: discount.expiryDateBS || discount.expiryDate || undefined,
        })
        setDrawerOpen(true)
    }

    const handleFormSubmit = async () => {
        try {
            const values = await form.validateFields()
            const payload: CreateDiscountPayload = {
                name: values.name.trim(),
                description: values.description?.trim() || undefined,
                type: values.type,
                value: values.value,
                canCombine: values.canCombine ?? false,
                effectiveDate: values.effectiveDateBS,
                expiryDate: values.expiryDateBS || null,
            }

            if (editingDiscount) {
                const updatePayload: UpdateDiscountPayload = { ...payload }
                await updateDiscount(updatePayload)
                toast.success('Discount updated successfully')
            } else {
                await createDiscount(payload)
                toast.success('Discount created successfully')
            }

            setDrawerOpen(false)
            form.resetFields()
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'errorFields' in err) {
                toast.error('Please fix the errors in the form before submitting')
            } else {
                toast.error((err as Error)?.message ?? 'Failed to save discount')
            }
        }
    }

    /** Toggle ACTIVE ↔ INACTIVE directly — the hook is id-bound so we call the
     *  API client directly and manually invalidate, matching how the codebase
     *  already handles ad-hoc imperative mutations. */
    const handleToggleStatus = (discount: Discount) => {
        const nextStatus =
            discount.status === DiscountStatus.ACTIVE
                ? DiscountStatus.INACTIVE
                : DiscountStatus.ACTIVE
        const actionLabel = nextStatus === DiscountStatus.ACTIVE ? 'activate' : 'deactivate'

        appConfirm({
            title: `${nextStatus === DiscountStatus.ACTIVE ? 'Activate' : 'Deactivate'} Discount?`,
            content: `Are you sure you want to ${actionLabel} "${discount.name}"?`,
            okText: nextStatus === DiscountStatus.ACTIVE ? 'Activate' : 'Deactivate',
            okColor: nextStatus === DiscountStatus.ACTIVE ? 'green' : 'amber',
            onOk: async () => {
                setPendingStatusId(discount.id)
                try {
                    await apiClient.patch<ApiResponse<Discount>>(
                        ENDPOINTS.DISCOUNTS.STATUS(discount.id),
                        { status: nextStatus }
                    )
                    await invalidateDiscounts()
                    toast.success(
                        `Discount ${nextStatus === DiscountStatus.ACTIVE ? 'activated' : 'deactivated'} successfully`
                    )
                } catch (err) {
                    toast.error((err as Error)?.message ?? 'Failed to update discount status')
                } finally {
                    setPendingStatusId(null)
                }
            },
        })
    }

    const handleDelete = (discount: Discount) => {
        appConfirm({
            title: 'Delete Discount?',
            content: `Are you sure you want to delete "${discount.name}" (${discount.code})? This cannot be undone if the discount has no approved assignments.`,
            okText: 'Delete',
            okColor: 'danger',
            onOk: async () => {
                try {
                    await deleteDiscount(discount.id)
                    toast.success('Discount deleted successfully')
                } catch (err) {
                    toast.error((err as Error)?.message ?? 'Failed to delete discount')
                }
            },
        })
    }

    const handleExportCsv = () => {
        const ok = exportCsv('discounts', CSV_HEADERS, discounts.map(toCsvRow))
        if (!ok) toast.warning('No discounts available to export')
        else toast.success('Discounts exported to CSV')
    }

    const handleTableChange = (
        pagination: TablePaginationConfig,
        _filters: unknown,
        sorter: SorterResult<Discount> | SorterResult<Discount>[]
    ) => {
        if (pagination.current) setPage(pagination.current)
        if (pagination.pageSize) {
            setLimit(pagination.pageSize)
            setPage(1)
        }
        const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter
        if (!activeSorter?.order || !activeSorter.columnKey) return
        const nextSortBy = activeSorter.columnKey as DiscountSortBy
        const nextSortOrder: DiscountSortOrder =
            activeSorter.order === 'ascend' ? 'ASC' : 'DESC'
        if (nextSortBy === sortBy && nextSortOrder === sortOrder) return
        setSortBy(nextSortBy)
        setSortOrder(nextSortOrder)
        setPage(1)
    }

    // ── Filter columns ────────────────────────────────────────────────────────
    const filterColumns: SmartColumn[] = [
        { key: 'name', title: 'Discount Name / Code', isSearchable: true },
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
    const columns: ColumnsType<Discount> = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: 220,
            sorter: true,
            sortOrder: columnSortOrder(sortBy as DiscountSortBy, sortOrder, 'name'),
            render: (text: string, record: Discount) => (
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
            width: 165,
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
            render: (type: DiscountType) => (
                <Tag
                    color={type === DiscountType.PERCENTAGE ? 'purple' : 'orange'}
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
            sortOrder: columnSortOrder(sortBy as DiscountSortBy, sortOrder, 'value'),
            render: (value: string, record: Discount) => (
                <span
                    style={{
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        color: colors.primary,
                    }}
                >
                    {formatDiscountValue(record.type, value)}
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
            sortOrder: columnSortOrder(sortBy as DiscountSortBy, sortOrder, 'effectiveDate'),
            render: (_: unknown, record: Discount) => (
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {record.effectiveDateBS || record.effectiveDate || '—'}
                </span>
            ),
        },
        {
            title: 'Expiry (BS)',
            key: 'expiryDate',
            width: 130,
            render: (_: unknown, record: Discount) => (
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
            render: (status: DiscountStatus, record: Discount) => (
                <div
                    onClick={(e) => {
                        if (canUpdate) {
                            e.stopPropagation()
                            handleToggleStatus(record)
                        }
                    }}
                    title={
                        canUpdate
                            ? status === DiscountStatus.ACTIVE
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
            sortOrder: columnSortOrder(sortBy as DiscountSortBy, sortOrder, 'createdAt'),
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
            render: (_: unknown, record: Discount) => (
                <Space size={6} onClick={(e) => e.stopPropagation()}>
                    <Button
                        type="default"
                        size="small"
                        icon={<EyeOutlined />}
                        title="View details"
                        onClick={() => setViewingDiscount(record)}
                        style={{ borderRadius: radius.sm, borderColor: colors.border, color: colors.muted }}
                    />
                    {canUpdate && (
                        <Button
                            type="default"
                            size="small"
                            icon={<EditOutlined />}
                            title="Edit discount"
                            onClick={() => handleOpenEdit(record)}
                            style={{ borderRadius: radius.sm, borderColor: colors.border, color: colors.muted }}
                        />
                    )}
                    {canDelete && (
                        <Button
                            type="default"
                            size="small"
                            icon={<DeleteOutlined />}
                            title="Delete discount"
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
                title="Discounts"
                description="Percentage or fixed amount reductions, with expiry and combination rules"
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
                                Add Discount
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
                <AppTable<Discount>
                    rowKey="id"
                    columns={columns}
                    dataSource={discounts}
                    loading={isFetching}
                    onRowClick={(record) => setViewingDiscount(record)}
                    onChange={handleTableChange}
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total: meta?.total ?? discounts.length,
                        showSizeChanger: true,
                    }}
                    scroll={{ x: 1300 }}
                    locale={{ emptyText: 'No discounts found.' }}
                />
            )}

            {/* ── Add / Edit Drawer ────────────────────────────────────────── */}
            <Drawer
                title={
                    editingDiscount
                        ? `Edit Discount — ${editingDiscount.name}`
                        : 'Add Discount'
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
                            {editingDiscount ? 'Save Changes' : 'Create Discount'}
                        </Button>
                    </Space>
                }
            >
                {/* Code — generated on create, read-only once assigned */}
                {editingDiscount && (
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
                        <span style={{ color: colors.muted }}>Discount Code: </span>
                        <Tag
                            color="blue"
                            style={{ fontFamily: 'monospace', fontWeight: 600 }}
                        >
                            {editingDiscount.code}
                        </Tag>
                        <span style={{ color: colors.muted, marginLeft: 8, fontSize: 12 }}>
                            (immutable — cannot be changed)
                        </span>
                    </div>
                )}

                <Form form={form} layout="vertical" requiredMark>
                    <Form.Item
                        name="name"
                        label="Discount Name"
                        rules={[
                            { required: true, message: 'Please enter a discount name' },
                            { max: 100, message: 'Name must be at most 100 characters' },
                        ]}
                    >
                        <Input placeholder="e.g. Early Bird Discount" maxLength={100} />
                    </Form.Item>

                    <Form.Item name="description" label="Description">
                        <Input.TextArea
                            rows={3}
                            placeholder="Brief description of this discount..."
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="type"
                                label="Discount Type"
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
                                    const type = form.getFieldValue('type') as DiscountType
                                    const isPercentage = type === DiscountType.PERCENTAGE
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
                        label="Can Combine with Other Discounts"
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

            {/* ── View Details Drawer ───────────────────────────────────────── */}
            <Drawer
                title="Discount Details"
                open={!!viewingDiscount}
                onClose={() => setViewingDiscount(null)}
                size="large"
                extra={
                    viewingDiscount && canUpdate ? (
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            style={{ background: colors.primary }}
                            onClick={() => {
                                handleOpenEdit(viewingDiscount)
                                setViewingDiscount(null)
                            }}
                        >
                            Edit
                        </Button>
                    ) : null
                }
            >
                {viewingDiscount && (
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Discount Name">
                            <Text strong>{viewingDiscount.name}</Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Code">
                            <Tag
                                color="blue"
                                style={{ fontFamily: 'monospace', fontWeight: 600 }}
                            >
                                {viewingDiscount.code}
                            </Tag>
                            <Text
                                type="secondary"
                                style={{ fontSize: 12, marginLeft: 8 }}
                            >
                                auto-generated · immutable
                            </Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Description">
                            {viewingDiscount.description || (
                                <Text type="secondary">—</Text>
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="Type">
                            <Tag
                                color={
                                    viewingDiscount.type === DiscountType.PERCENTAGE
                                        ? 'purple'
                                        : 'orange'
                                }
                                style={{ borderRadius: 6, fontWeight: 500 }}
                            >
                                {TYPE_LABELS[viewingDiscount.type] || viewingDiscount.type}
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
                                {formatDiscountValue(viewingDiscount.type, viewingDiscount.value)}
                            </Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Can Combine">
                            <Tag
                                color={viewingDiscount.canCombine ? 'cyan' : 'default'}
                                style={{ borderRadius: 6 }}
                            >
                                {viewingDiscount.canCombine ? 'Yes' : 'No'}
                            </Tag>
                        </Descriptions.Item>

                        <Descriptions.Item label="Status">
                            <StatusBadge status={viewingDiscount.status} />
                        </Descriptions.Item>

                        <Descriptions.Item label="Effective Date (BS)">
                            <Text style={{ fontFamily: 'monospace' }}>
                                {viewingDiscount.effectiveDateBS || viewingDiscount.effectiveDate}
                            </Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Effective Date (AD)">
                            <Text style={{ fontFamily: 'monospace' }}>
                                {viewingDiscount.effectiveDate}
                            </Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Expiry Date (BS)">
                            <Text
                                style={{
                                    fontFamily: 'monospace',
                                    color:
                                        viewingDiscount.expiryDateBS || viewingDiscount.expiryDate
                                            ? colors.text
                                            : colors.muted,
                                }}
                            >
                                {viewingDiscount.expiryDateBS ||
                                    viewingDiscount.expiryDate ||
                                    'No expiry'}
                            </Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Expiry Date (AD)">
                            <Text
                                style={{
                                    fontFamily: 'monospace',
                                    color: viewingDiscount.expiryDate ? colors.text : colors.muted,
                                }}
                            >
                                {viewingDiscount.expiryDate || 'No expiry'}
                            </Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Created At">
                            <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                {viewingDiscount.createdAt
                                    ? new Date(viewingDiscount.createdAt).toLocaleString()
                                    : '—'}
                            </Text>
                        </Descriptions.Item>

                        <Descriptions.Item label="Last Updated">
                            <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                {viewingDiscount.updatedAt
                                    ? new Date(viewingDiscount.updatedAt).toLocaleString()
                                    : '—'}
                            </Text>
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Drawer>
        </div>
    )
}
