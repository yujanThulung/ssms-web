import { useCallback, useMemo, useState } from 'react'
import { Button, Col, Empty, Row, Space, Tabs, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
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
import { appConfirm } from '../../../components/common/AppConfirm'
import { StatusPill } from '../components/StatusFlow'
import { AdditionalFeeDrawer } from './AdditionalFeeDrawer'
import {
  ADDITIONAL_FEE_REASON_LABEL,
  useAdditionalFeeCounts,
  useAdditionalFeeList,
  useDeleteAdditionalFee,
} from './additionalFeesData'
import type {
  AdditionalFeeReason,
  AdditionalFeeRow,
  AdditionalFeeStatus,
} from './additionalFeesData'
import { FEE_FREQUENCY_COLOR, FEE_STRUCTURE_STATUS_LABEL, FeeStructureStatus, formatMoney, useFeeStructureCounts } from '../../../features/fee-structures'

const { Title, Text } = Typography

type StatusTabKey = 'ALL' | AdditionalFeeStatus

const ALL: StatusTabKey = 'ALL'

const TABS: { key: StatusTabKey; label: string }[] = [
  { key: ALL, label: 'All' },
  { key: FeeStructureStatus.DRAFT, label: FEE_STRUCTURE_STATUS_LABEL[FeeStructureStatus.DRAFT] },
  {
    key: FeeStructureStatus.PENDING_APPROVAL,
    label: FEE_STRUCTURE_STATUS_LABEL[FeeStructureStatus.PENDING_APPROVAL],
  },
  {
    key: FeeStructureStatus.APPROVED,
    label: FEE_STRUCTURE_STATUS_LABEL[FeeStructureStatus.APPROVED],
  },
  {
    key: FeeStructureStatus.ARCHIVED,
    label: FEE_STRUCTURE_STATUS_LABEL[FeeStructureStatus.ARCHIVED],
  },
]

const REASON_OPTIONS = Object.entries(ADDITIONAL_FEE_REASON_LABEL).map(([value, label]) => ({
  value,
  label,
}))

export function AdditionalFeesTab() {
  const { can } = usePermission()
  const canCreate = can(FEATURES.FEE_STRUCTURE, ACTIONS.CREATE)
  const canUpdate = can(FEATURES.FEE_STRUCTURE, ACTIONS.UPDATE)
  const canDelete = can(FEATURES.FEE_STRUCTURE, ACTIONS.DELETE)

  const [statusTab, setStatusTab] = useState<StatusTabKey>(ALL)
  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string | undefined>>({})
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [editing, setEditing] = useState<AdditionalFeeRow | null>(null)
  const [creating, setCreating] = useState(false)

  const params = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      status: statusTab,
      reason: filterValues['reason'] as AdditionalFeeReason | undefined,
    }),
    [page, limit, search, statusTab, filterValues],
  )

  const { items, meta } = useAdditionalFeeList(params)
  const counts = useAdditionalFeeCounts()
  const removeFee = useDeleteAdditionalFee()

  /**
   * A student additional fee sits on top of a class fee structure, so it can
   * only be added where that structure is APPROVED. Counted from the real API
   * rather than the demo seed above, so the gate reflects live data.
   */
  const structureCounts = useFeeStructureCounts(filterValues['academicYearId'])
  const approvedCount = structureCounts.byStatus[FeeStructureStatus.APPROVED]
  const canApply = approvedCount > 0

  const filterColumns: SmartColumn[] = useMemo(
    () => [
      { key: 'student', title: 'Student', isSearchable: true },
      { key: 'reason', title: 'Reason', isFilterable: true, filterOptions: REASON_OPTIONS },
    ],
    [],
  )

  const handleDelete = useCallback(
    (row: AdditionalFeeRow) => {
      appConfirm({
        title: 'Remove additional fee?',
        content: `${formatMoney(row.amount)} ${row.categoryName} for ${row.studentName} will be removed.`,
        okText: 'Remove',
        okColor: 'danger',
        onOk: () => {
          try {
            removeFee(row.id)
            toast.success('Additional fee removed')
          } catch (err) {
            toast.error((err as Error)?.message ?? 'Could not remove the fee')
          }
        },
      })
    },
    [removeFee],
  )

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
              {row.admissionNo} · {row.className}-{row.sectionName}
            </div>
          </div>
        ),
      },
      {
        title: 'Fee Head',
        key: 'categoryName',
        width: 170,
        render: (_, row) => (
          <Space size={6}>
            <Text style={{ fontSize: 13 }}>{row.categoryName}</Text>
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
        width: 150,
        render: (_, row) => (
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {ADDITIONAL_FEE_REASON_LABEL[row.reason]}
          </Text>
        ),
      },
      {
        title: 'Status',
        key: 'status',
        width: 150,
        render: (_, row) => <StatusPill status={row.status} />,
      },
      {
        title: 'Added On',
        key: 'createdAt',
        width: 120,
        render: (_, row) => (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {new Date(row.createdAt).toISOString().slice(0, 10)}
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
            <Tooltip title={row.status === FeeStructureStatus.DRAFT ? 'Edit' : 'View'}>
              <Button
                size="small"
                icon={<EditOutlined />}
                disabled={row.status !== FeeStructureStatus.DRAFT || !canUpdate}
                onClick={() => setEditing(row)}
                style={{ borderRadius: radius.sm, borderColor: colors.border, color: colors.muted }}
              />
            </Tooltip>
            {canDelete && (
              <Tooltip title="Remove">
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

  const tabCount = (key: StatusTabKey) =>
    key === ALL ? counts.total : counts.byStatus[key as AdditionalFeeStatus]

  return (
    <div>
      {/* Header — actions up here, matching the fee-category module. */}
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
            value={counts.total}
            icon={<AppstoreOutlined />}
            color={colors.primary}
            iconBg={colors.primaryLight}
          />
        </Col>
        <Col xs={12} sm={8} md={6}>
          <StatCard
            variant="default"
            size="middle"
            label="Total Collected"
            value={formatMoney(counts.collected)}
            icon={<WalletOutlined />}
            color={colors.success}
            iconBg={colors.successLight}
          />
        </Col>
        <Col xs={12} sm={8} md={6}>
          <StatCard
            variant="default"
            size="middle"
            label="Pending Approval"
            value={counts.byStatus.PENDING_APPROVAL}
            icon={<ClockCircleOutlined />}
            color={colors.warning}
            iconBg={colors.warningLight}
          />
        </Col>
        <Col xs={12} sm={8} md={6}>
          <StatCard
            variant="default"
            size="middle"
            label="Approved"
            value={counts.byStatus.APPROVED}
            icon={<CheckCircleOutlined />}
            color={colors.success}
            iconBg={colors.successLight}
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
        items={TABS.map((tab) => ({ key: tab.key, label: `${tab.label} (${tabCount(tab.key)})` }))}
      />

      <AppTable<AdditionalFeeRow>
        rowKey={(row) => row.id}
        columns={columns}
        dataSource={items}
        onRowClick={(row) => canUpdate && setEditing(row)}
        pagination={{
          current: page,
          pageSize: limit,
          total: meta.total,
          showSizeChanger: false,
        }}
        scroll={{ x: 1150 }}
        locale={{
          emptyText: (
            <Empty description="No additional fees recorded yet for these filters." />
          ),
        }}
      />

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
    </div>
  )
}
