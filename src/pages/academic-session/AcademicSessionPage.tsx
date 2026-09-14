import { useState } from 'react'
import {
    Alert,
    Button,
    Card,
    Col,
    Drawer,
    Dropdown,
    Form,
    Input,
    Row,
    Skeleton,
    Space,
    Timeline,
    Typography,
} from 'antd'
import { NepaliDateRangePicker, type BsDateRange } from '../../components/nepali-calendar'
import { StatCard } from '../../components/common/StatCard'
import { StatusBadge, getStatusColor } from '../../components/common/StatusBadge'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import {
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    PlusOutlined,
    MoreOutlined,
    EyeOutlined,
    EditOutlined,
    CopyOutlined,
    InboxOutlined,
} from '@ant-design/icons'
import { toast } from 'sonner'

import { AppTable } from '../../components/common/AppTable'
import { TableSkeleton } from '../../components/skeleton'
import { SearchAndFilter } from '../../components/common/SearchAndFilter'
import { appConfirm } from '../../components/common/AppConfirm'
import { bsIsoToAdIso, adIsoToBsIso, formatBsDateFromAd } from '../../utils/nepaliDate'
import { colors, DRAWER } from '../../lib/designTokens'
import { useQueryClient } from '@tanstack/react-query'
import client from '../../lib/api/client'
import { useGet } from '../../lib/api/hooks/useGet'
import { ENDPOINTS } from '../../lib/api/endpoints'

import { type ApiResponse, type ApiPaginatedResponse } from '../../lib/api/types'
import { usePermission } from '../../context/PermissionContext'
import { FEATURES, ACTIONS } from '../../utils/permissions'

const { Title, Text } = Typography

type SessionStatus = 'CURRENT' | 'UPCOMING' | 'ARCHIVED'

export interface AcademicSession {
    id: string
    createdAt: string
    updatedAt: string
    deletedAt: string | null
    name: string
    startDate: string
    endDate: string
    status: SessionStatus
}

interface AcademicYearSummary {
    rotalSessions: number
    currentSession: {
        id: string
        name: string
    }
    upcommingSession: number
}

export default function AcademicSessionPage() {
    // Summary Query
    const { data: summaryResponse, isLoading: summaryLoading, isFetching: summaryFetching } = useGet<ApiResponse<AcademicYearSummary>>(ENDPOINTS.ACADEMIC_YEARS.SUMMARY)
    const summary = summaryResponse?.data
    const isSummaryLoading = summaryLoading || summaryFetching

    // Table / Filter State
    const [q, setQ] = useState('')
    const [filterValues, setFilterValues] = useState<Record<string, string | undefined>>({})
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [sortBy, setSortBy] = useState<string>('startDate')
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')

    const statusFilter = filterValues['status'] as SessionStatus | undefined

    // List Query
    const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
    })

    if (q) queryParams.append('search', q)
    if (statusFilter) queryParams.append('status', statusFilter)

    const { data: listResponse, isLoading: isTableLoading, isFetching: isTableFetching } = useGet<ApiPaginatedResponse<AcademicSession>>(
        `${ENDPOINTS.ACADEMIC_YEARS.LIST}?${queryParams.toString()}`
    )

    const rows = listResponse?.data || []
    const meta = listResponse?.meta

    const current = rows.find((s) => s.status === 'CURRENT')

    // Drawer / Mutation State
    const queryClient = useQueryClient()
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [editing, setEditing] = useState<AcademicSession | null>(null)
    const [viewing, setViewing] = useState<AcademicSession | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [form] = Form.useForm<{ name: string; range: BsDateRange | undefined }>()

    const invalidateAcademicData = () => {
        queryClient.invalidateQueries({
            predicate: (query) => {
                const key = query.queryKey[0]
                return (
                    typeof key === 'string' &&
                    (key.startsWith(ENDPOINTS.ACADEMIC_YEARS.LIST) ||
                        key.startsWith(ENDPOINTS.ACADEMIC_YEARS.SUMMARY))
                )
            },
        })
    }

    const filterColumns = [
        { key: 'name', title: 'Academic Year', isSearchable: true },
        {
            key: 'status',
            title: 'Status',
            isFilterable: true,
            filterWidth: 130,
            filterOptions: [
                { label: 'Current', value: 'CURRENT' },
                { label: 'Upcoming', value: 'UPCOMING' },
                { label: 'Archived', value: 'ARCHIVED' },
            ],
        },
    ]

    const openAdd = () => {
        setEditing(null)
        form.resetFields()
        setDrawerOpen(true)
    }

    const openEdit = (s: AcademicSession) => {
        setEditing(s)
        // Convert stored AD dates to BS for the picker
        form.setFieldsValue({
            name: s.name,
            range: { from: adIsoToBsIso(s.startDate), to: adIsoToBsIso(s.endDate) },
        })
        setDrawerOpen(true)
    }

    const onSubmit = async () => {
        try {
            const values = await form.validateFields()
            const range = values.range
            if (!range?.from || !range?.to) {
                form.setFields([{ name: 'range', errors: ['Please select session dates'] }])
                return
            }
            setIsSubmitting(true)
            // Convert BS dates to AD before sending to API
            const payload = {
                name: values.name.trim(),
                startDate: bsIsoToAdIso(range.from),
                endDate: bsIsoToAdIso(range.to),
            }

            if (editing) {
                await client.patch(ENDPOINTS.ACADEMIC_YEARS.DETAIL(editing.id), payload)
                toast.success('Academic session updated successfully')
            } else {
                await client.post(ENDPOINTS.ACADEMIC_YEARS.BASE, payload)
                toast.success('Academic session created successfully')
            }
            invalidateAcademicData()
            setDrawerOpen(false)
        } catch (err: any) {
            if (err?.errorFields) return
            toast.error(err?.response?.data?.message || err?.message || 'Operation failed')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSetCurrent = (s: AcademicSession) => {
        appConfirm({
            title: `Set ${s.name} as current session?`,
            content: 'This will set this academic session as the active session for the school system.',
            okText: 'Set as Current',
            okColor: 'green',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await client.post(ENDPOINTS.ACADEMIC_YEARS.SET_CURRENT(s.id))
                    toast.success(`Academic session ${s.name} is now current`)
                    invalidateAcademicData()
                } catch (err: any) {
                    toast.error(err?.response?.data?.message || err?.message || 'Failed to set as current session')
                }
            },
        })
    }

    const cloneSession = (s: AcademicSession) => {
        appConfirm({
            title: `Clone academic session ${s.name}?`,
            content: `This will duplicate ${s.name} into a new academic session.`,
            okText: 'Clone',
            okColor: 'green',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await client.post(ENDPOINTS.ACADEMIC_YEARS.CLONE(s.id))
                    toast.success(`Academic session ${s.name} cloned successfully`)
                    invalidateAcademicData()
                } catch (err: any) {
                    toast.error(err?.response?.data?.message || err?.message || 'Failed to clone academic session')
                }
            },
        })
    }

    const archiveSession = (s: AcademicSession) => {
        appConfirm({
            title: 'Archive this academic session?',
            content: 'Archived sessions cannot be used for new transactions.',
            okText: 'Archive',
            okColor: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await client.post(ENDPOINTS.ACADEMIC_YEARS.ARCHIVE(s.id))
                    toast.success('Academic session archived')
                    invalidateAcademicData()
                } catch (err: any) {
                    toast.error(err?.response?.data?.message || err?.message || 'Failed to archive academic session')
                }
            },
        })
    }

    const { can } = usePermission()
    const canCreate = can(FEATURES.ACADEMIC_YEAR, ACTIONS.CREATE)
    const canUpdate = can(FEATURES.ACADEMIC_YEAR, ACTIONS.UPDATE)
    const canArchive = can(FEATURES.ACADEMIC_YEAR, ACTIONS.ARCHIVE)
    const canApprove = can(FEATURES.ACADEMIC_YEAR, ACTIONS.APPROVE)

    const columns: ColumnsType<AcademicSession> = [
        {
            title: 'Academic Year',
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            render: (text: string) => <div style={{ fontWeight: 500 }}>{text}</div>,
        },
        {
            title: 'Start Date',
            dataIndex: 'startDate',
            key: 'startDate',
            sorter: true,
        },
        {
            title: 'End Date',
            dataIndex: 'endDate',
            key: 'endDate',
            sorter: true,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (val: SessionStatus) => <StatusBadge status={val} />,
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 90,
            render: (_, r) => {
                const actionMenuItems: MenuProps['items'] = [
                    {
                        key: 'view',
                        label: 'View',
                        icon: <EyeOutlined />,
                        onClick: () => setViewing(r),
                    },
                    ...(canApprove && r.status !== 'CURRENT'
                        ? [
                            {
                                key: 'set-current',
                                label: <span style={{ color: colors.primary, fontWeight: 500 }}>Set as Current</span>,
                                icon: <CheckCircleOutlined style={{ color: colors.primary }} />,
                                onClick: () => handleSetCurrent(r),
                            },
                        ]
                        : []),
                    ...(canUpdate
                        ? [
                            {
                                key: 'edit',
                                label: 'Edit',
                                icon: <EditOutlined />,
                                onClick: () => openEdit(r),
                            },
                        ]
                        : []),
                    ...(canCreate
                        ? [
                            {
                                key: 'clone',
                                label: 'Clone',
                                icon: <CopyOutlined />,
                                onClick: () => cloneSession(r),
                            },
                        ]
                        : []),
                    ...(canArchive
                        ? [
                            {
                                key: 'archive',
                                label: 'Archive',
                                danger: true,
                                icon: <InboxOutlined />,
                                disabled: r.status === 'ARCHIVED',
                                onClick: () => archiveSession(r),
                            },
                        ]
                        : []),
                ]

                return (
                    <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown menu={{ items: actionMenuItems }} trigger={['click']} placement="bottomRight">
                            <Button type="text" icon={<MoreOutlined />} />
                        </Dropdown>
                    </div>
                )
            },
        },
    ]

    return (
        <div style={{ padding: 24 }}>
            {/* Top Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                    flexWrap: 'wrap',
                    gap: 12,
                }}
            >
                <div>
                    <Title level={4} style={{ margin: 0, color: colors.text }}>
                        Academic Session
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        The academic year drives fee structures, invoices and reports
                    </Text>
                </div>
                {canCreate && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
                        Add session
                    </Button>
                )}
            </div>

            {/* KPI Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <StatCard
                        variant="default"
                        size="middle"
                        label="Total Sessions"
                        value={isSummaryLoading ? <Skeleton.Input active size="small" style={{ width: 44, height: 20 }} /> : (summary?.rotalSessions ?? 0)}
                        icon={<CalendarOutlined />}
                        color={colors.primary}
                        iconBg={colors.primaryLight}
                    />
                </Col>
                <Col xs={24} sm={8}>
                    <StatCard
                        variant="default"
                        size="middle"
                        label="Current Session"
                        value={isSummaryLoading ? <Skeleton.Input active size="small" style={{ width: 90, height: 20 }} /> : (summary?.currentSession?.name ?? '—')}
                        icon={<CheckCircleOutlined />}
                        color={colors.success}
                        iconBg={colors.successLight}
                    />
                </Col>
                <Col xs={24} sm={8}>
                    <StatCard
                        variant="default"
                        size="middle"
                        label="Upcoming"
                        value={isSummaryLoading ? <Skeleton.Input active size="small" style={{ width: 44, height: 20 }} /> : (summary?.upcommingSession ?? 0)}
                        icon={<ClockCircleOutlined />}
                        color={colors.warning}
                        iconBg={colors.warningLight}
                    />
                </Col>
            </Row>

            {/* Filter & Main Content Layout */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                    {/* Filter Bar */}
                    <SearchAndFilter
                        columns={filterColumns}
                        searchValue={q}
                        onSearchChange={setQ}
                        debounceMs={300}
                        filterValues={filterValues}
                        onFilterChange={(key, value) => {
                            setFilterValues((prev) => ({ ...prev, [key]: value }))
                            setPage(1) // Reset page on filter change
                        }}
                    />

                    {/* Table Skeleton or AppTable */}
                    {isTableLoading || isTableFetching ? (
                        <div
                            style={{
                                backgroundColor: colors.surface,
                                border: `1px solid ${colors.border}`,
                                borderRadius: 12,
                                overflow: 'hidden',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                            }}
                        >
                            <TableSkeleton rows={Math.min(limit, 5)} columns={5} />
                        </div>
                    ) : (
                        <AppTable<AcademicSession>
                            onRowClick={(r) => setViewing(r)}
                            rowKey="id"
                            columns={columns}
                            dataSource={rows}
                            onChange={(pagination, _filters, sorter: any) => {
                                setPage(pagination.current || 1)
                                setLimit(pagination.pageSize || 10)

                                if (sorter && sorter.field) {
                                    setSortBy(sorter.field)
                                    setSortOrder(sorter.order === 'ascend' ? 'ASC' : 'DESC')
                                }
                            }}
                            pagination={{
                                current: page,
                                pageSize: limit,
                                total: meta?.total || 0,
                                showSizeChanger: true,
                            }}
                        />
                    )}
                </Col>

                {/* Timeline & Summary Side Panel */}
                <Col xs={24} lg={8}>
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        <Alert
                            type="info"
                            showIcon
                            message="Current session"
                            description={
                                isTableLoading || isTableFetching ? (
                                    <Skeleton.Input active size="small" style={{ width: 180, height: 16, marginTop: 4 }} />
                                ) : current ? (
                                    `${current.name} · ${current.startDate} to ${current.endDate}`
                                ) : (
                                    'No current session set'
                                )
                            }
                        />
                        <Card size="small" title="Session timeline" style={{ borderRadius: 8, borderColor: colors.border }}>
                            {isTableLoading || isTableFetching ? (
                                <div style={{ padding: '8px 0' }}>
                                    <Skeleton active paragraph={{ rows: 3 }} title={false} />
                                </div>
                            ) : rows.length === 0 ? (
                                <div style={{ padding: '16px 0', textAlign: 'center', color: colors.muted, fontSize: 13 }}>
                                    No sessions available
                                </div>
                            ) : (
                                <Timeline
                                    style={{ marginTop: 12 }}
                                    items={rows
                                        .slice()
                                        .sort((a, b) => b.startDate.localeCompare(a.startDate))
                                        .map((s) => ({
                                            color: getStatusColor(s.status),
                                            children: (
                                                <span>
                                                    <strong>{s.name}</strong> — {s.status}
                                                </span>
                                            ),
                                        }))}
                                />
                            )}
                        </Card>
                    </Space>
                </Col>
            </Row>

            {/* Add / Edit Drawer */}
            <Drawer
                title={editing ? 'Edit academic session' : 'Add academic session'}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                width={DRAWER.width}
                footer={
                    <div style={{ textAlign: 'right', paddingBottom: 24, paddingRight: 8 }}>
                        <Button type="primary" onClick={onSubmit} loading={isSubmitting} style={{ minWidth: 120 }}>
                            Save
                        </Button>
                    </div>
                }
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label="Academic year" rules={[{ required: true, message: 'Please enter academic year' }]}>
                        <Input placeholder="2027 / 2028" size="large" />
                    </Form.Item>
                    <Form.Item
                        name="range"
                        label="Session dates (Nepali / BS calendar)"
                        rules={[{ required: true, message: 'Please select session dates' }]}
                    >
                        <NepaliDateRangePicker
                            locale="ne"
                            numberOfMonths={2}
                            placeholder="मितिको दायरा छान्नुहोस्"
                            primaryColor="#16a34a"
                            zIndex={1200}
                        />
                    </Form.Item>
                </Form>
            </Drawer>

            {/* View Details Drawer */}
            <Drawer
                title="Session details"
                open={!!viewing}
                onClose={() => setViewing(null)}
                width={DRAWER.width}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingBottom: 16 }}>
                        {canUpdate && viewing && (
                            <Button
                                icon={<EditOutlined />}
                                onClick={() => {
                                    const s = viewing
                                    setViewing(null)
                                    openEdit(s)
                                }}
                            >
                                Edit
                            </Button>
                        )}
                        {canApprove && viewing && viewing.status !== 'CURRENT' && (
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={() => {
                                    const s = viewing
                                    setViewing(null)
                                    handleSetCurrent(s)
                                }}
                            >
                                Set as Current
                            </Button>
                        )}
                    </div>
                }
            >
                {viewing ? (
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        <div>
                            <Text type="secondary">Academic Year</Text>
                            <div style={{ fontSize: 16, fontWeight: 600 }}>{viewing.name}</div>
                        </div>
                        <div>
                            <Text type="secondary">Start Date</Text>
                            <div style={{ fontWeight: 500 }}>{formatBsDateFromAd(viewing.startDate)}</div>
                            <div style={{ fontSize: 12, color: colors.muted }}>({viewing.startDate})</div>
                        </div>
                        <div>
                            <Text type="secondary">End Date</Text>
                            <div style={{ fontWeight: 500 }}>{formatBsDateFromAd(viewing.endDate)}</div>
                            <div style={{ fontSize: 12, color: colors.muted }}>({viewing.endDate})</div>
                        </div>
                        <div>
                            <Text type="secondary">Status</Text>
                            <div style={{ marginTop: 4 }}>
                                <StatusBadge status={viewing.status} />
                            </div>
                        </div>
                    </Space>
                ) : null}
            </Drawer>
        </div>
    )
}
