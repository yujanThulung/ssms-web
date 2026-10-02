import { useCallback, useMemo, useState } from 'react'
import { Button, Col, Empty, Row, Space, Tabs, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  StopOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { toast } from 'sonner'

import { colors, radius } from '../../../lib/designTokens'
import { usePermission } from '../../../context/PermissionContext'
import { ACTIONS, FEATURES } from '../../../utils/permissions'
import { AppTable } from '../../../components/common/AppTable'
import { SearchAndFilter } from '../../../components/common/SearchAndFilter'
import type { SmartColumn } from '../../../components/common/SearchAndFilter'
import { StatCard } from '../../../components/common/StatCard'
import { TableSkeleton } from '../../../components/skeleton'
import { appConfirm } from '../../../components/common/AppConfirm'
import { AdditionalFeeDrawer } from './AdditionalFeeDrawer'
import {
  ADDITIONAL_FEE_REASON_LABEL,
  useAdditionalFeeList,
  useDeleteAdditionalFee,
  useUpdateAdditionalFeeStatus,
  useReviewAdditionalFee,
} from './additionalFeesData'
import { StatusChangeModal, type StatusChangeOption } from '../../../components/common/StatusChangeModal'
import type { AdditionalFeeRow } from './additionalFeesData'
import {
  FEE_FREQUENCY_COLOR,
  FeeStructureStatus,
  formatMoney,
  toListArray,
  useFeeStructures,
} from '../../../features/fee-structures'
import { useAcademicYears, type AcademicYear } from '../../../features/academic-years'

const { Title, Text } = Typography

type StatusTabKey = 'ALL' | 'ACTIVE' | 'ARCHIVED'

const TABS: { key: StatusTabKey; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'ARCHIVED', label: 'Archived' },
]

function AdditionalFeeStatusPill({ status, onClick }: { status?: string; onClick?: () => void }) {
  let color = 'default'
  let label = status || 'UNKNOWN'

  switch (status) {
    case 'ACTIVE':
    case 'APPROVED':
      color = 'success'
      label = 'Active'
      break
    case 'ARCHIVED':
      color = 'default'
      label = 'Archived'
      break
    case 'PENDING_APPROVAL':
      color = 'warning'
      label = 'Pending Approval'
      break
    case 'DRAFT':
      color = 'processing'
      label = 'Draft'
      break
    case 'REJECTED':
      color = 'error'
      label = 'Rejected'
      break
  }

  return (
    <Tag
      color={color}
      style={{ borderRadius: radius.sm, margin: 0, cursor: onClick ? 'pointer' : 'default' }}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation()
          onClick()
        }
      }}
    >
      {label}
    </Tag>
  )
}

const REASON_OPTIONS = Object.entries(ADDITIONAL_FEE_REASON_LABEL).map(([value, label]) => ({
  value,
  label,
}))

export function AdditionalFeesTab() {
  const { can } = usePermission()
  const canCreate = can(FEATURES.FEE_STRUCTURE, ACTIONS.CREATE)
  const canUpdate = can(FEATURES.FEE_STRUCTURE, ACTIONS.UPDATE)
  const canDelete = can(FEATURES.FEE_STRUCTURE, ACTIONS.DELETE)

  const [statusTab, setStatusTab] = useState<StatusTabKey>('ALL')
  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string | undefined>>({})
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [editing, setEditing] = useState<AdditionalFeeRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [statusChanging, setStatusChanging] = useState<AdditionalFeeRow | null>(null)

  const academicYearId = filterValues['academicYearId']

  const params = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      academicYearId,
      status: statusTab === 'ALL' ? undefined : statusTab,
      reason: filterValues['reason'],
    }),
    [page, limit, search, academicYearId, statusTab, filterValues],
  )

  const { items, meta, isLoading, isFetching } = useAdditionalFeeList(params)
  const deleteFeeMutation = useDeleteAdditionalFee()
  const updateStatusMutation = useUpdateAdditionalFeeStatus()
  const reviewFeeMutation = useReviewAdditionalFee()

  const { data: yearData } = useAcademicYears({ limit: 100 })
  const years = useMemo<AcademicYear[]>(
    () => toListArray<AcademicYear>(yearData),
    [yearData],
  )

  const approvedStructuresQuery = useFeeStructures({
    limit: 1,
    status: FeeStructureStatus.APPROVED,
    academicYearId,
  })
  const canApply = (approvedStructuresQuery.data?.meta?.total ?? 0) > 0

  const filterColumns: SmartColumn[] = useMemo(
    () => [
      { key: 'student', title: 'Student', isSearchable: true },
      {
        key: 'academicYearId',
        title: 'Academic Year',
        isFilterable: true,
        filterWidth: 200,
        filterOptions: years.map((year) => ({
          label: year.status === 'CURRENT' ? `${year.name} (Current)` : year.name,
          value: year.id,
        })),
      },
      // { key: 'reason', title: 'Reason', isFilterable: true, filterOptions: REASON_OPTIONS },
    ],
    [years],
  )

  const handleDelete = useCallback(
    (row: AdditionalFeeRow) => {
      appConfirm({
        title: 'Archive / remove additional fee?',
        content: `${formatMoney(row.amount)} ${row.categoryName} for ${row.studentName} will be archived.`,
        okText: 'Archive',
        okColor: 'danger',
        onOk: async () => {
          try {
            await deleteFeeMutation.mutateAsync(row.id)
            toast.success('Additional fee archived')
          } catch (err) {
            toast.error((err as Error)?.message ?? 'Could not remove the fee')
          }
        },
      })
    },
    [deleteFeeMutation],
  )

  const statusOptions = useMemo<StatusChangeOption<string>[]>(() => {
    if (!statusChanging) return []
    const current = statusChanging.status
    const opts: StatusChangeOption<string>[] = []

    if (current === 'DRAFT') {
      opts.push({ value: 'PENDING_APPROVAL', label: 'Request Approval', color: 'warning' })
      opts.push({ value: 'ACTIVE', label: 'Mark Active', color: 'success' })
    } else if (current === 'PENDING_APPROVAL') {
      opts.push({ value: 'APPROVED', label: 'Approve', color: 'success' })
      opts.push({ value: 'REJECTED', label: 'Reject', color: 'error' })
    } else if (current === 'APPROVED') {
      opts.push({ value: 'ACTIVE', label: 'Mark Active', color: 'success' })
    } else if (current === 'ACTIVE' || current === 'REJECTED') {
      opts.push({ value: 'ARCHIVED', label: 'Archive', color: 'default' })
    }
    return opts
  }, [statusChanging])

  const handleStatusConfirm = async (next: string) => {
    if (!statusChanging) return
    try {
      if (next === 'APPROVED' || next === 'REJECTED') {
        await reviewFeeMutation.mutateAsync({
          id: statusChanging.id,
          payload: { status: next },
        })
      } else {
        await updateStatusMutation.mutateAsync({
          id: statusChanging.id,
          payload: { status: next },
        })
      }
      toast.success('Status updated')
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Could not update status')
      throw err
    }
  }

  const columns: ColumnsType<AdditionalFeeRow> = useMemo(
    () => [
      {
        title: 'Student',
        key: 'student',
        width: 210,
        render: (_, row) => (
          <div>
            <Text strong style={{ fontSize: 13 }}>{row.studentName}</Text>
            <div style={{ fontSize: 11, color: colors.muted }}>
              {row.admissionNo} {row.className ? `· ${row.className}` : ''} {row.sectionName ? `-${row.sectionName}` : ''}
            </div>
          </div>
        ),
      },
      {
        title: 'Fee Category',
        key: 'categoryName',
        width: 170,
        render: (_, row) => (
          <Space size={6}>
            <Text style={{ fontSize: 13 }}>{row.categoryName}</Text>
            {row.frequency && (
              <Text
                style={{
                  fontSize: 10,
                  color: '#ffffff',
                  background: FEE_FREQUENCY_COLOR[row.frequency] ?? colors.muted,
                  padding: '1px 6px',
                  borderRadius: radius.sm,
                }}
              >
                {row.frequency.replace('_', ' ')}
              </Text>
            )}
          </Space>
        ),
      },
      {
        title: 'Amount',
        key: 'amount',
        width: 130,
        align: 'right',
        render: (_, row) => (
          <Text strong style={{ fontFamily: 'monospace', fontSize: 13 }}>
            {formatMoney(row.amount)}
          </Text>
        ),
      },
      {
        title: 'Reason',
        key: 'reason',
        width: 160,
        render: (_, row) => (
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {ADDITIONAL_FEE_REASON_LABEL[row.reason] ?? row.reason}
          </Text>
        ),
      },
      {
        title: 'Status',
        key: 'status',
        width: 120,
        render: (_, row) => (
          <AdditionalFeeStatusPill
            status={row.status}
            onClick={canUpdate && row.status !== 'ARCHIVED' ? () => setStatusChanging(row) : undefined}
          />
        ),
      },
      {
        title: 'Added On',
        key: 'createdAt',
        width: 120,
        render: (_, row) => (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {row.createdAt ? new Date(row.createdAt).toISOString().slice(0, 10) : '—'}
          </Text>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        fixed: 'right',
        width: 96,
        align: 'center',
        render: (_, row) => (
          <Space size={6} onClick={(e) => e.stopPropagation()}>
            <Tooltip title="Edit">
              <Button
                size="small"
                icon={<EditOutlined />}
                disabled={!canUpdate || row.status === 'ARCHIVED'}
                onClick={(e) => {
                  e.stopPropagation()
                  setEditing(row)
                }}
                style={{ borderRadius: radius.sm, borderColor: colors.border, color: colors.muted }}
              />
            </Tooltip>
            {canDelete && row.status !== 'ARCHIVED' && (
              <Tooltip title="Archive">
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(row)}
                  style={{ borderRadius: radius.sm }}
                />
              </Tooltip>
            )}
          </Space>
        ),
      },
    ],
    [canUpdate, canDelete, handleDelete],
  )

  const totalAmountSum = useMemo(
    () => items.reduce((sum, item) => sum + (item.amount || 0), 0),
    [items],
  )

  const handleTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) setPage(pagination.current)
    if (pagination.pageSize) setLimit(pagination.pageSize)
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, color: colors.text }}>
            Student Additional Fees
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            One-off charges on top of a class fee structure
          </Text>
        </div>
        {canCreate && (
          <Tooltip
            title={
              canApply
                ? undefined
                : 'No approved class fee structure yet. Approve one on the Class Fee Structure tab first.'
            }
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!canApply}
              onClick={() => setCreating(true)}
              style={{ background: colors.primary }}
            >
              Add Additional Fee
            </Button>
          </Tooltip>
        )}
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={6}>
          <StatCard
            variant="default"
            size="middle"
            label="Total Records"
            value={meta.total}
            icon={<AppstoreOutlined />}
            color={colors.primary}
            iconBg={colors.primaryLight}
            loading={isLoading}
          />
        </Col>
        <Col xs={12} sm={8} md={6}>
          <StatCard
            variant="default"
            size="middle"
            label="Page Amount Total"
            value={formatMoney(totalAmountSum)}
            icon={<WalletOutlined />}
            color={colors.success}
            iconBg={colors.successLight}
            loading={isLoading}
          />
        </Col>
        <Col xs={12} sm={8} md={6}>
          <StatCard
            variant="default"
            size="middle"
            label="Active Fees"
            value={items.filter((i) => i.status === 'ACTIVE').length}
            icon={<CheckCircleOutlined />}
            color={colors.success}
            iconBg={colors.successLight}
            loading={isLoading}
          />
        </Col>
        <Col xs={12} sm={8} md={6}>
          <StatCard
            variant="default"
            size="middle"
            label="Archived"
            value={items.filter((i) => i.status === 'ARCHIVED').length}
            icon={<StopOutlined />}
            color={colors.muted}
            iconBg={colors.secondary}
            loading={isLoading}
          />
        </Col>
      </Row>

      <SearchAndFilter
        columns={filterColumns}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        debounceMs={300}
        filterValues={filterValues}
        onFilterChange={(key, value) => {
          setFilterValues((prev) => ({ ...prev, [key]: value }))
          setPage(1)
        }}
      />

      <Tabs
        activeKey={statusTab}
        onChange={(key) => {
          setStatusTab(key as StatusTabKey)
          setPage(1)
        }}
        style={{ marginBottom: 16 }}
        items={TABS.map((tab) => ({ key: tab.key, label: tab.label }))}
      />

      {isLoading ? (
        <div
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <TableSkeleton rows={Math.min(limit, 5)} columns={7} />
        </div>
      ) : (
        <AppTable<AdditionalFeeRow>
          rowKey={(row) => row.id}
          columns={columns}
          dataSource={items}
          loading={isFetching}
          onChange={handleTableChange}
          onRowClick={(row) => canUpdate && row.status !== 'ARCHIVED' && setEditing(row)}
          pagination={{
            current: page,
            pageSize: limit,
            total: meta.total,
            showSizeChanger: true,
          }}
          scroll={{ x: 1150 }}
          locale={{
            emptyText: (
              <Empty description="No additional fees recorded yet for these filters." />
            ),
          }}
        />
      )}

      {creating && (
        <AdditionalFeeDrawer
          onClose={() => setCreating(false)}
          onDone={() => setCreating(false)}
        />
      )}

      {editing && (
        <AdditionalFeeDrawer
          record={editing}
          onClose={() => setEditing(null)}
          onDone={() => setEditing(null)}
        />
      )}

      <StatusChangeModal
        open={Boolean(statusChanging)}
        onClose={() => setStatusChanging(null)}
        subject={`${formatMoney(statusChanging?.amount || 0)} fee for ${statusChanging?.studentName}`}
        currentLabel={statusChanging?.status || 'UNKNOWN'}
        currentColor={
          statusChanging?.status === 'ACTIVE' || statusChanging?.status === 'APPROVED' ? 'success' :
            statusChanging?.status === 'PENDING_APPROVAL' ? 'warning' :
              statusChanging?.status === 'REJECTED' ? 'error' :
                statusChanging?.status === 'DRAFT' ? 'processing' : 'default'
        }
        options={statusOptions}
        onConfirm={handleStatusConfirm}
      />
    </div>
  )
}
