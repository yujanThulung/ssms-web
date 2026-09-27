import { useMemo, useState } from 'react'
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
    Tag,
    Typography,
} from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { SorterResult } from 'antd/es/table/interface'
import {
    AppstoreOutlined,
    CheckCircleOutlined,
    DownloadOutlined,
    EditOutlined,
    EyeOutlined,
    PlusOutlined,
    SyncOutlined,
} from '@ant-design/icons'
import { toast } from 'sonner'

import { colors, radius } from '../../lib/designTokens'
import { usePermission } from '../../context/PermissionContext'
import { FEATURES, ACTIONS } from '../../utils/permissions'
import { StatusBadge } from '../../components/common/StatusBadge'
import { AppTable } from '../../components/common/AppTable'
import { SearchAndFilter } from '../../components/common/SearchAndFilter'
import type { SmartColumn } from '../../components/common/SearchAndFilter'
import { StatCard } from '../../components/common/StatCard'
import { appConfirm } from '../../components/common/AppConfirm'
import { TableSkeleton } from '../../components/skeleton'
import {
    useFeeCategories,
    useCreateFeeCategory,
    useToggleFeeCategoryStatus,
    useUpdateFeeCategory,
} from '../../features/fee-categories'
import {
    FeeFrequency,
    FeeCategoryStatus,
    type FeeCategory,
    type CreateFeeCategoryPayload,
    type UpdateFeeCategoryPayload,
    type FeeCategoryFormValues,
    type FeeCategorySortBy,
    type FeeCategorySortOrder,
} from '../../features/fee-categories'

const { Title, Text } = Typography

const FREQUENCY_OPTIONS = [
    { label: 'One Time', value: FeeFrequency.ONE_TIME },
    { label: 'Monthly', value: FeeFrequency.MONTHLY },
    { label: 'Term', value: FeeFrequency.TERM },
    { label: 'Yearly', value: FeeFrequency.YEARLY },
]

const FREQUENCY_LABELS: Record<string, string> = {
    [FeeFrequency.ONE_TIME]: 'One Time',
    [FeeFrequency.MONTHLY]: 'Monthly',
    [FeeFrequency.TERM]: 'Term',
    [FeeFrequency.YEARLY]: 'Yearly',
}

const STATUS_OPTIONS = [
    { label: 'Active', value: FeeCategoryStatus.ACTIVE },
    { label: 'Inactive', value: FeeCategoryStatus.INACTIVE },
]

function formatCurrency(amount?: number | string | null) {
    if (amount == null || amount === '') return 'Rs. 0'
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(num)) return 'Rs. 0'
    return `Rs. ${num.toLocaleString('en-IN')}`
}

function columnSortOrder(
    sortBy: FeeCategorySortBy,
    sortOrder: FeeCategorySortOrder,
    key: FeeCategorySortBy
) {
    return sortBy === key ? (sortOrder === 'ASC' ? 'ascend' : 'descend') : null
}

export default function FeeCategoryPage() {
    const { can } = usePermission()
    const canCreate = can(FEATURES.ACCOUNT, ACTIONS.CREATE)
    const canUpdate = can(FEATURES.ACCOUNT, ACTIONS.UPDATE)

    const [search, setSearch] = useState('')
    const [filterValues, setFilterValues] = useState<Record<string, string | undefined>>({})
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [sortBy, setSortBy] = useState<FeeCategorySortBy>('createdAt')
    const [sortOrder, setSortOrder] = useState<FeeCategorySortOrder>('DESC')

    const [drawerOpen, setDrawerOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<FeeCategory | null>(null)
    const [viewingCategory, setViewingCategory] = useState<FeeCategory | null>(null)
    const [form] = Form.useForm<FeeCategoryFormValues>()

    const listParams = useMemo(
        () => ({
            page,
            limit,
            search: search || undefined,
            frequency: filterValues['frequency'],
            status: filterValues['status'],
            sortBy,
            sortOrder,
        }),
        [page, limit, search, filterValues, sortBy, sortOrder]
    )

    const { data, isLoading, isFetching } = useFeeCategories(listParams)

    const categories: FeeCategory[] = useMemo(() => {
        if (!data) return []
        if (Array.isArray(data)) return data
        if (Array.isArray(data.data)) return data.data
        const rawData = data.data as unknown as Record<string, unknown> | undefined
        if (rawData && typeof rawData === 'object' && 'items' in rawData && Array.isArray(rawData.items)) {
            return rawData.items as FeeCategory[]
        }
        const rootData = data as unknown as Record<string, unknown>
        if (typeof rootData === 'object' && 'items' in rootData && Array.isArray(rootData.items)) {
            return rootData.items as FeeCategory[]
        }
        return []
    }, [data])

    const meta = useMemo(() => {
        if (data && typeof data === 'object' && 'meta' in data) {
            return (data as unknown as Record<string, unknown>).meta as { total?: number } | undefined
        }
        return undefined
    }, [data])

    const { mutateAsync: createCategory, isPending: isCreating } = useCreateFeeCategory()
    const { mutateAsync: updateCategory, isPending: isUpdating } = useUpdateFeeCategory(editingCategory?.id ?? '')
    const { mutateAsync: toggleStatus } = useToggleFeeCategoryStatus()

    const isSaving = isCreating || isUpdating

    const kpiCards = useMemo(() => {
        const total = meta?.total ?? categories.length
        const active = categories.filter((c) => c.status === FeeCategoryStatus.ACTIVE).length
        const oneTime = categories.filter((c) => c.frequency === FeeFrequency.ONE_TIME).length
        const recurring = categories.filter((c) => c.frequency !== FeeFrequency.ONE_TIME).length
        return [
            { icon: <AppstoreOutlined />, label: 'Total Categories', value: total, color: colors.primary, bg: colors.primaryLight },
            { icon: <CheckCircleOutlined />, label: 'Active', value: active, color: colors.success, bg: colors.successLight },
            { icon: <SyncOutlined />, label: 'One Time', value: oneTime, color: colors.info, bg: colors.infoLight },
            { icon: <SyncOutlined />, label: 'Recurring', value: recurring, color: colors.warning, bg: colors.warningLight },
        ]
    }, [meta?.total, categories])

    const handleOpenAdd = () => {
        setEditingCategory(null)
        form.resetFields()
        form.setFieldsValue({ frequency: FeeFrequency.MONTHLY, defaultAmount: 0 })
        setDrawerOpen(true)
    }

    const handleOpenEdit = (category: FeeCategory) => {
        setEditingCategory(category)
        form.resetFields()
        form.setFieldsValue({
            name: category.name,
            frequency: category.frequency,
            defaultAmount: parseFloat(category.defaultAmount),
            description: category.description ?? '',
            status: category.status,
        })
        setDrawerOpen(true)
    }

    const handleFormSubmit = async () => {
        try {
            const values = await form.validateFields()
            const payload: CreateFeeCategoryPayload = {
                name: values.name.trim(),
                frequency: values.frequency,
                defaultAmount: String(values.defaultAmount ?? 0),
                description: values.description?.trim() || undefined,
            }
            if (editingCategory) {
                const updatePayload: UpdateFeeCategoryPayload = { ...payload, status: values.status }
                await updateCategory(updatePayload)
                toast.success('Fee category updated successfully')
            } else {
                await createCategory(payload)
                toast.success('Fee category created successfully')
            }
            setDrawerOpen(false)
            form.resetFields()
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'errorFields' in err) {
                toast.error('Please fix the errors in the form before submitting')
            } else {
                toast.error((err as Error)?.message ?? 'Failed to save fee category')
            }
        }
    }

    const handleToggleStatus = (category: FeeCategory) => {
        const nextStatus = category.status === FeeCategoryStatus.ACTIVE ? FeeCategoryStatus.INACTIVE : FeeCategoryStatus.ACTIVE
        const actionLabel = nextStatus === FeeCategoryStatus.ACTIVE ? 'activate' : 'deactivate'
        appConfirm({
            title: `${nextStatus === FeeCategoryStatus.ACTIVE ? 'Activate' : 'Deactivate'} Fee Category?`,
            content: `Are you sure you want to ${actionLabel} "${category.name}"?`,
            okText: nextStatus === FeeCategoryStatus.ACTIVE ? 'Activate' : 'Deactivate',
            okColor: nextStatus === FeeCategoryStatus.ACTIVE ? 'green' : 'amber',
            onOk: async () => {
                try {
                    await toggleStatus({ id: category.id, currentStatus: category.status })
                    toast.success(`Fee category ${nextStatus === FeeCategoryStatus.ACTIVE ? 'activated' : 'deactivated'} successfully`)
                } catch (err) {
                    toast.error((err as Error)?.message ?? 'Failed to update category status')
                }
            },
        })
    }

    const handleExportCsv = () => {
        if (!categories.length) { toast.warning('No fee categories available to export'); return }
        const headers = ['Name', 'Code', 'Frequency', 'Default Amount', 'Status', 'Description', 'Created At']
        const csvRows = categories.map((c) => [
            `"${(c.name || '').replace(/"/g, '""')}"`,
            `"${(c.code || '').replace(/"/g, '""')}"`,
            `"${FREQUENCY_LABELS[c.frequency] || c.frequency}"`,
            c.defaultAmount,
            c.status,
            `"${(c.description || '').replace(/"/g, '""')}"`,
            c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
        ])
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n')
        const link = document.createElement('a')
        link.setAttribute('href', encodeURI(csvContent))
        link.setAttribute('download', `fee_categories_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Fee categories exported to CSV')
    }

    const handleTableChange = (
        pagination: TablePaginationConfig,
        _filters: unknown,
        sorter: SorterResult<FeeCategory> | SorterResult<FeeCategory>[]
    ) => {
        if (pagination.current) setPage(pagination.current)
        if (pagination.pageSize) { setLimit(pagination.pageSize); setPage(1) }

        const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter
        if (!activeSorter?.order || !activeSorter.columnKey) return

        const nextSortBy = activeSorter.columnKey as FeeCategorySortBy
        const nextSortOrder: FeeCategorySortOrder = activeSorter.order === 'ascend' ? 'ASC' : 'DESC'
        if (nextSortBy === sortBy && nextSortOrder === sortOrder) return

        setSortBy(nextSortBy)
        setSortOrder(nextSortOrder)
        setPage(1)
    }

    const filterColumns: SmartColumn[] = [
        { key: 'name', title: 'Category Name', isSearchable: true },
        { key: 'frequency', title: 'Frequency', isFilterable: true, filterWidth: 150, filterOptions: FREQUENCY_OPTIONS },
        { key: 'status', title: 'Status', isFilterable: true, filterWidth: 140, filterOptions: STATUS_OPTIONS },
    ]

    const columns: ColumnsType<FeeCategory> = [
        {
            title: 'Category Name',
            dataIndex: 'name',
            key: 'name',
            width: 230,
            sorter: true,
            sortOrder: columnSortOrder(sortBy, sortOrder, 'name'),
            render: (text: string, record: FeeCategory) => (
                <div>
                    <span style={{ fontWeight: 500 }}>{text}</span>
                    {record.description && (
                        <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{record.description}</div>
                    )}
                </div>
            ),
        },
        {
            title: 'Code',
            dataIndex: 'code',
            key: 'code',
            width: 160,
            sorter: true,
            sortOrder: columnSortOrder(sortBy, sortOrder, 'code'),
            render: (code?: string) =>
                code
                    ? <span style={{ fontFamily: 'monospace' }}>{code.toUpperCase()}</span>
                    : <span style={{ color: colors.muted }}>—</span>,
        },
        {
            title: 'Frequency',
            dataIndex: 'frequency',
            key: 'frequency',
            width: 120,
            render: (freq: string) => (
                <Tag style={{ borderRadius: 6, fontWeight: 500 }}>{FREQUENCY_LABELS[freq] || freq}</Tag>
            ),
        },
        {
            title: 'Default Amount',
            dataIndex: 'defaultAmount',
            key: 'defaultAmount',
            align: 'right',
            width: 150,
            render: (amt: number | string) => (
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatCurrency(amt)}</span>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            render: (status: FeeCategoryStatus, record: FeeCategory) => (
                <div
                    onClick={(e) => { if (canUpdate) { e.stopPropagation(); handleToggleStatus(record) } }}
                    title={canUpdate ? (status === FeeCategoryStatus.ACTIVE ? 'Click to deactivate' : 'Click to activate') : undefined}
                    style={{ display: 'inline-block', cursor: canUpdate ? 'pointer' : 'default' }}
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
            sortOrder: columnSortOrder(sortBy, sortOrder, 'createdAt'),
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
            width: 100,
            align: 'center',
            render: (_, record: FeeCategory) => (
                <Space size={6} onClick={(e) => e.stopPropagation()}>
                    <Button
                        type="default" size="small" icon={<EyeOutlined />} title="View details"
                        onClick={() => setViewingCategory(record)}
                        style={{ borderRadius: radius.sm, borderColor: colors.border, color: colors.muted }}
                    />
                    {canUpdate && (
                        <Button
                            type="default" size="small" icon={<EditOutlined />} title="Edit category"
                            onClick={() => handleOpenEdit(record)}
                            style={{ borderRadius: radius.sm, borderColor: colors.border, color: colors.muted }}
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
                    <Title level={4} style={{ margin: 0, color: colors.text }}>Fee Categories</Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Reusable fee heads with codes, frequency, and default amounts
                    </Text>
                </div>
                <Space>
                    <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>Export CSV</Button>
                    {canCreate && (
                        <Button type="primary" icon={<PlusOutlined />} style={{ background: colors.primary }} onClick={handleOpenAdd}>
                            Add Category
                        </Button>
                    )}
                </Space>
            </div>

            {/* KPI Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {kpiCards.map((kpi) => (
                    <Col key={kpi.label} xs={12} sm={8} md={6} lg={4}>
                        <StatCard
                            variant="default"
                            size="middle"
                            label={kpi.label}
                            value={kpi.value}
                            icon={kpi.icon}
                            color={kpi.color}
                            iconBg={kpi.bg}
                            loading={isLoading}
                        />
                    </Col>
                ))}
            </Row>

            {/* Search & Filter */}
            <SearchAndFilter
                columns={filterColumns}
                searchValue={search}
                onSearchChange={(val) => { setSearch(val); setPage(1) }}
                debounceMs={300}
                filterValues={filterValues}
                onFilterChange={(key, val) => { setFilterValues((prev) => ({ ...prev, [key]: val })); setPage(1) }}
            />

            {/* Table */}
            {isLoading ? (
                <div style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
                    <TableSkeleton rows={Math.min(limit, 5)} columns={6} />
                </div>
            ) : (
                <AppTable<FeeCategory>
                    rowKey="id"
                    columns={columns}
                    dataSource={categories}
                    loading={isFetching}
                    onRowClick={(record) => setViewingCategory(record)}
                    onChange={handleTableChange}
                    pagination={{ current: page, pageSize: limit, total: meta?.total ?? categories.length, showSizeChanger: true }}
                    scroll={{ x: 900 }}
                    locale={{ emptyText: 'No fee categories found.' }}
                />
            )}

            {/* Add / Edit Drawer */}
            <Drawer
                title={editingCategory ? 'Edit Fee Category' : 'Add Fee Category'}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                size="large"
                destroyOnClose
                extra={
                    <Space>
                        <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
                        <Button type="primary" style={{ background: colors.primary }} loading={isSaving} onClick={handleFormSubmit}>
                            {editingCategory ? 'Save Changes' : 'Create Category'}
                        </Button>
                    </Space>
                }
            >
                <Form form={form} layout="vertical" requiredMark={true}>
                    <Form.Item name="name" label="Category Name" rules={[{ required: true, message: 'Please enter category name' }, { min: 2, message: 'Name must be at least 2 characters' }]}>
                        <Input placeholder="e.g. Monthly Tuition Fee" maxLength={100} />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="frequency" label="Frequency" rules={[{ required: true, message: 'Please select frequency' }]}>
                                <Select placeholder="Select frequency" options={FREQUENCY_OPTIONS} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="defaultAmount" label="Default Amount" rules={[{ required: true, message: 'Please enter default amount' }]}>
                                <InputNumber style={{ width: '100%' }} min={0} addonBefore="Rs." placeholder="0.00" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} placeholder="Brief description of this fee head..." maxLength={300} showCount />
                    </Form.Item>
                    {editingCategory && (
                        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                            <Select options={STATUS_OPTIONS} />
                        </Form.Item>
                    )}
                </Form>
            </Drawer>

            {/* View Details Drawer */}
            <Drawer title="Fee Category Details" open={!!viewingCategory} onClose={() => setViewingCategory(null)} size="large">
                {viewingCategory && (
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Category Name"><Text strong>{viewingCategory.name}</Text></Descriptions.Item>
                        <Descriptions.Item label="Category Code">
                            {viewingCategory.code
                                ? <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{viewingCategory.code.toUpperCase()}</Tag>
                                : '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Frequency">{FREQUENCY_LABELS[viewingCategory.frequency] || viewingCategory.frequency}</Descriptions.Item>
                        <Descriptions.Item label="Default Amount">
                            <Text strong style={{ fontFamily: 'monospace' }}>{formatCurrency(viewingCategory.defaultAmount)}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Status"><StatusBadge status={viewingCategory.status} /></Descriptions.Item>
                        <Descriptions.Item label="Description">{viewingCategory.description || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Created At">
                            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                {viewingCategory.createdAt ? new Date(viewingCategory.createdAt).toLocaleString() : '—'}
                            </span>
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Drawer>
        </div>
    )
}
