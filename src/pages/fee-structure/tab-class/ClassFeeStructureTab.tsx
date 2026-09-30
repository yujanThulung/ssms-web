import { useCallback, useMemo, useState } from 'react'
import { Badge, Button, Col, Empty, Row, Space, Tabs, Tooltip, Typography } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { SorterResult } from 'antd/es/table/interface'
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  InboxOutlined,
  PlusOutlined,
  StopOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { toast } from 'sonner'

import { colors, radius, TABLE } from '../../../lib/designTokens'
import { usePermission } from '../../../context/PermissionContext'
import { ACTIONS, FEATURES } from '../../../utils/permissions'
import { AppTable } from '../../../components/common/AppTable'
import { SearchAndFilter } from '../../../components/common/SearchAndFilter'
import type { SmartColumn } from '../../../components/common/SearchAndFilter'
import { StatCard } from '../../../components/common/StatCard'
import { TableSkeleton } from '../../../components/skeleton'
import { useAcademicYears } from '../../../features/academic-years'
import type { AcademicYear } from '../../../features/academic-years'
import {
  FEE_STRUCTURE_ALL_STATUSES,
  FEE_STRUCTURE_STATUS_COLOR,
  FEE_STRUCTURE_STATUS_LABEL,
  FeeStructureStatus,
  formatMoney,
  toListArray,
  useFeeStructureCounts,
  useFeeStructureRows,
  useFeeStructures,
} from '../../../features/fee-structures'
import type {
  FeeStructureListRow,
  FeeStructureStatus as FeeStructureStatusType,
} from '../../../features/fee-structures'
import { BulkSetupDrawer } from '../components/BulkSetupDrawer'
import { NewStructureDrawer } from '../components/NewStructureDrawer'
import { StatusPill } from '../components/StatusFlow'
import { StatusChangeModal } from '../../../components/common/StatusChangeModal'
import { StructureDrawer } from '../components/StructureDrawer'
import { useFeeStructureStatusChange } from '../statusChange'
import type { StatusChangeTarget } from '../statusChange'
import { targetFromRow } from '../target'
import type { StructureTarget } from '../target'

const { Title, Text } = Typography

/** `ALL` shows every status; the rest map straight onto the API's `status` filter. */
type StatusTabKey = 'ALL' | FeeStructureStatusType

const ALL = 'ALL'

/** `ALL` means "no status filter", everything else maps 1:1 onto the API value. */
function toStatusParam(key: StatusTabKey): FeeStructureStatusType | undefined {
  return key === ALL ? undefined : key
}

function exportCsv(rows: FeeStructureListRow[], filename: string): boolean {
  if (rows.length === 0) return false

  const header = [
    'Class',
    'Academic Year',
    'Status',
    'Fee Heads',
    'Monthly',
    'Per Term',
    'Yearly',
    'One Time',
    'Students',
  ]
  const body = rows.map((row) => [
    row.className,
    row.academicYearName,
    row.status ? FEE_STRUCTURE_STATUS_LABEL[row.status] : 'Not set up',
    String(row.lineCount),
    String(row.totals.monthly),
    String(row.totals.term),
    String(row.totals.yearly),
    String(row.totals.oneTime),
    String(row.studentsAssigned),
  ])

  const csv = [header, ...body]
    .map((line) => line.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const link = document.createElement('a')
  link.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURI(csv)}`)
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  return true
}

export function ClassFeeStructureTab() {
  const { can } = usePermission()
  const canCreate = can(FEATURES.FEE_STRUCTURE, ACTIONS.CREATE)
  const canUpdate = can(FEATURES.FEE_STRUCTURE, ACTIONS.UPDATE)

  const [statusTab, setStatusTab] = useState<StatusTabKey>(ALL)
  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string | undefined>>({})
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<number>(TABLE.pageSize)
  const [sortBy, setSortBy] = useState('className')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC')

  const [target, setTarget] = useState<StructureTarget | null>(null)
  const [statusTarget, setStatusTarget] = useState<StatusChangeTarget | null>(null)
  const [pendingCreate, setPendingCreate] = useState<StructureTarget | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)

  const academicYearId = filterValues['academicYearId']
  const listParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      status: toStatusParam(statusTab),
      academicYearId,
      sortBy,
      sortOrder,
    }),
    [page, limit, search, statusTab, academicYearId, sortBy, sortOrder],
  )

  const { data, isLoading, isFetching } = useFeeStructures(listParams)
  const { rows } = useFeeStructureRows(data)
  const counts = useFeeStructureCounts(academicYearId, search || undefined)

  const { data: yearData } = useAcademicYears({ limit: 100 })
  const years = useMemo<AcademicYear[]>(
    () => toListArray<AcademicYear>(yearData),
    [yearData],
  )

  /**
   * A structure created from the "Set up" cell lands in the tab the user is not
   * looking at, so promote it into the open drawer rather than refetching.
   */
  const activeTarget = useMemo<StructureTarget | null>(() => {
    if (!pendingCreate) return target
    if (target && target.classId === pendingCreate.classId && target.structureId === null) {
      return pendingCreate
    }
    return target
  }, [target, pendingCreate])

  const openStructure = useCallback((row: FeeStructureListRow) => {
    setPendingCreate(null)
    setTarget(targetFromRow(row))
  }, [])

  const startSetup = useCallback((row: FeeStructureListRow) => {
    setPendingCreate(null)
    setTarget({
      classId: row.classId,
      className: row.className,
      academicYearId: row.academicYearId,
      academicYearName: row.academicYearName,
      structureId: null,
    })
  }, [])

  /** Clicking the status pill opens the review flow — see StatusChangeModal. */
  const openStatusChange = useCallback((row: FeeStructureListRow) => {
    if (!row.structure || !row.status) return
    setStatusTarget({
      structureId: row.structure.id,
      className: row.className,
      academicYearName: row.academicYearName,
      status: row.status,
    })
  }, [])

  const statusChange = useFeeStructureStatusChange(statusTarget)

  const kpis = useMemo(
    () => [
      {
        key: 'total',
        label: 'Classes',
        value: counts.total,
        icon: <AppstoreOutlined />,
        color: colors.primary,
        bg: colors.primaryLight,
      },
      {
        key: 'notSetUp',
        label: 'Not Set Up',
        value: counts.notSetUp,
        icon: <InboxOutlined />,
        color: colors.muted,
        bg: colors.secondary,
      },
      {
        key: 'draft',
        label: 'Draft',
        value: counts.byStatus.DRAFT,
        icon: <EditOutlined />,
        color: colors.info,
        bg: colors.infoLight,
      },
      {
        key: 'pending',
        label: 'Pending Approval',
        value: counts.byStatus.PENDING_APPROVAL,
        icon: <ClockCircleOutlined />,
        color: colors.warning,
        bg: colors.warningLight,
      },
      {
        key: 'approved',
        label: 'Approved',
        value: counts.byStatus.APPROVED,
        icon: <CheckCircleOutlined />,
        color: colors.success,
        bg: colors.successLight,
      },
    ],
    [counts],
  )

  const statusTabs = useMemo(
    () => [
      { key: ALL, label: 'All', count: counts.total, icon: <AppstoreOutlined /> },
      ...FEE_STRUCTURE_ALL_STATUSES.map((status) => ({
        key: status as StatusTabKey,
        label: FEE_STRUCTURE_STATUS_LABEL[status],
        count: counts.byStatus[status],
        icon:
          status === FeeStructureStatus.APPROVED ? (
            <CheckCircleOutlined />
          ) : status === FeeStructureStatus.PENDING_APPROVAL ? (
            <ClockCircleOutlined />
          ) : status === FeeStructureStatus.REJECTED ? (
            <CloseCircleOutlined />
          ) : status === FeeStructureStatus.ARCHIVED ? (
            <StopOutlined />
          ) : (
            <EditOutlined />
          ),
      })),
    ],
    [counts],
  )

  const filterColumns: SmartColumn[] = useMemo(
    () => [
      { key: 'className', title: 'Class', isSearchable: true },
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
    ],
    [years],
  )

  const columns: ColumnsType<FeeStructureListRow> = useMemo(
    () => [
      {
        title: 'Class',
        key: 'className',
        width: 210,
        sorter: true,
        sortOrder: sortBy === 'className' ? (sortOrder === 'ASC' ? 'ascend' : 'descend') : null,
        render: (_, row) => (
          <div>
            <Text strong style={{ fontSize: 13 }}>{row.className}</Text>
            <div style={{ fontSize: 11, color: colors.muted }}>{row.academicYearName}</div>
          </div>
        ),
      },
      {
        title: 'Status',
        key: 'status',
        width: 170,
        render: (_, row) => (
          <StatusPill
            status={row.status}
            onChangeStatus={row.structure ? () => openStatusChange(row) : undefined}
          />
        ),
      },
      {
        title: 'Fee Heads',
        key: 'lineCount',
        width: 110,
        align: 'center',
        render: (_, row) =>
          row.structure ? (
            <Text style={{ fontSize: 13 }}>{row.lineCount}</Text>
          ) : canCreate ? (
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={(e) => {
                e.stopPropagation()
                startSetup(row)
              }}
            >
              Set up
            </Button>
          ) : (
            <Text type="secondary">—</Text>
          ),
      },
      {
        title: 'Monthly',
        key: 'monthly',
        width: 125,
        align: 'right',
        render: (_, row) => <MoneyCell value={row.totals.monthly} />,
      },
      {
        title: 'Per Term',
        key: 'term',
        width: 125,
        align: 'right',
        render: (_, row) => <MoneyCell value={row.totals.term} />,
      },
      {
        title: 'Yearly',
        key: 'yearly',
        width: 125,
        align: 'right',
        render: (_, row) => <MoneyCell value={row.totals.yearly} />,
      },
      {
        title: 'One Time',
        key: 'oneTime',
        width: 125,
        align: 'right',
        render: (_, row) => <MoneyCell value={row.totals.oneTime} />,
      },
      {
        title: 'Students',
        key: 'students',
        width: 100,
        align: 'center',
        render: (_, row) =>
          row.structure ? (
            <Text style={{ fontSize: 13 }}>{row.studentsAssigned}</Text>
          ) : (
            <Text type="secondary">—</Text>
          ),
      },
      {
        title: 'Actions',
        key: 'actions',
        fixed: 'right',
        width: 100,
        align: 'center',
        render: (_, row) => (
          <Space size={6} onClick={(e) => e.stopPropagation()}>
            <Tooltip title={row.structure ? 'View / manage' : 'Set up fee structure'}>
              <Button
                size="small"
                icon={row.structure ? <EyeOutlined /> : <PlusOutlined />}
                onClick={() => openStructure(row)}
                style={{ borderRadius: radius.sm, borderColor: colors.border, color: colors.muted }}
              />
            </Tooltip>
            {row.structure && row.status === FeeStructureStatus.DRAFT && canUpdate && (
              <Tooltip title="Edit fee heads">
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openStructure(row)}
                  style={{ borderRadius: radius.sm, borderColor: colors.border, color: colors.muted }}
                />
              </Tooltip>
            )}
          </Space>
        ),
      },
    ],
    [canCreate, canUpdate, sortBy, sortOrder, openStructure, startSetup, openStatusChange],
  )

  const handleExport = () => {
    if (exportCsv(rows, 'fee-structures')) toast.success('Exported CSV')
    else toast.warning('Nothing to export')
  }

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: unknown,
    sorter: SorterResult<FeeStructureListRow> | SorterResult<FeeStructureListRow>[],
  ) => {
    if (pagination.current) setPage(pagination.current)
    if (pagination.pageSize) {
      setLimit(pagination.pageSize)
      setPage(1)
    }

    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter
    if (!activeSorter?.order || !activeSorter.columnKey) return
    setSortBy(String(activeSorter.columnKey))
    setSortOrder(activeSorter.order === 'ascend' ? 'ASC' : 'DESC')
    setPage(1)
  }

  const activeTabLabel =
    statusTab === ALL
      ? 'All Structures'
      : FEE_STRUCTURE_STATUS_LABEL[statusTab as FeeStructureStatusType]

  return (
    <div>
      {/* Header — actions live up here, matching the students page, rather than
          inside the search bar. */}
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
            {activeTabLabel}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Fee heads per class — one structure applies to every section
          </Text>
        </div>
        <Space wrap>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Export CSV
          </Button>
          {canCreate && (
            <Button icon={<ThunderboltOutlined />} onClick={() => setBulkOpen(true)}>
              Bulk Setup
            </Button>
          )}
          {canCreate && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setNewOpen(true)}
              style={{ background: colors.primary }}
            >
              New Fee Structure
            </Button>
          )}
        </Space>
      </div>

      {/* KPI cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {kpis.map((kpi) => (
          <Col key={kpi.key} xs={12} sm={8} md={Math.floor(24 / kpis.length)}>
            <StatCard
              variant="default"
              size="small"
              label={kpi.label}
              value={kpi.value}
              icon={kpi.icon}
              color={kpi.color}
              iconBg={kpi.bg}
              loading={counts.isLoading || isLoading}
            />
          </Col>
        ))}
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

      {/* Status sub-tabs */}
      <Tabs
        activeKey={statusTab}
        onChange={(key) => {
          setStatusTab(key as StatusTabKey)
          setPage(1)
        }}
        style={{ marginBottom: 16 }}
        items={statusTabs.map((tab) => {
          // Only Pending Approval is an actionable review queue, so it is the
          // only tab carrying a count — as a red notification badge. The rest
          // are plain labels.
          const isReviewQueue = tab.key === FeeStructureStatus.PENDING_APPROVAL
          const label = (
            <span>
              {tab.icon} {tab.label}
            </span>
          )

          return {
            key: tab.key,
            label: isReviewQueue ? (
              <Badge
                count={tab.count}
                overflowCount={999}
                offset={[8, -2]}
                style={{
                  backgroundColor: tab.count > 0 ? colors.error : colors.border,
                  color: '#fff',
                  boxShadow: 'none',
                }}
              >
                {label}
              </Badge>
            ) : (
              label
            ),
          }
        })}
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
          <TableSkeleton rows={Math.min(limit, 5)} columns={8} />
        </div>
      ) : (
        <AppTable<FeeStructureListRow>
          rowKey={(row) => row.rowKey}
          columns={columns}
          dataSource={rows}
          loading={isFetching}
          onChange={handleTableChange}
          onRowClick={openStructure}
          pagination={{
            current: page,
            pageSize: limit,
            total:
              statusTab === ALL
                ? counts.total
                : counts.byStatus[statusTab as FeeStructureStatusType] || rows.length,
            showSizeChanger: true,
          }}
          scroll={{ x: 1150 }}
          locale={{
            emptyText: (
              <Empty
                description={
                  search || academicYearId
                    ? `No ${activeTabLabel.toLowerCase()} match these filters.`
                    : statusTab === ALL
                      ? 'No classes found for this academic year.'
                      : `No ${activeTabLabel.toLowerCase()} fee structures right now.`
                }
              >
                {canCreate && statusTab === ALL && !search && (
                  <Space>
                    <Button type="primary" onClick={() => setNewOpen(true)}>
                      New Fee Structure
                    </Button>
                    <Button onClick={() => setBulkOpen(true)}>Bulk Setup</Button>
                  </Space>
                )}
              </Empty>
            ),
          }}
        />
      )}

      <StructureDrawer
        target={activeTarget}
        onClose={() => {
          setTarget(null)
          setPendingCreate(null)
        }}
        onStructureCreated={(structureId) => {
          if (!target || !structureId) return
          setPendingCreate({ ...target, structureId })
        }}
      />

      {newOpen && (
        <NewStructureDrawer
          onClose={() => setNewOpen(false)}
          onCreated={(created) => {
            setNewOpen(false)
            setPendingCreate(null)
            setTarget(created.structureId ? created : null)
            if (!created.structureId) {
              toast.error('Structure was created but the response did not include its id.')
            }
          }}
        />
      )}

      {bulkOpen && (
        <BulkSetupDrawer
          onClose={() => setBulkOpen(false)}
          onDone={() => setBulkOpen(false)}
        />
      )}

      <StatusChangeModal
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        subject={
          statusTarget ? (
            <>
              {statusTarget.className} in {statusTarget.academicYearName}
            </>
          ) : undefined
        }
        currentLabel={
          statusTarget ? FEE_STRUCTURE_STATUS_LABEL[statusTarget.status] : ''
        }
        currentColor={
          statusTarget ? FEE_STRUCTURE_STATUS_COLOR[statusTarget.status] : undefined
        }
        options={statusChange.options}
        onConfirm={statusChange.handleConfirm}
        title="Change Fee Structure Status"
        loading={statusChange.isPending}
        emptyMessage={statusChange.emptyMessage}
      />
    </div>
  )
}

function MoneyCell({ value }: { value: number }) {
  if (!value) return <Text type="secondary">—</Text>
  return <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatMoney(value)}</Text>
}
