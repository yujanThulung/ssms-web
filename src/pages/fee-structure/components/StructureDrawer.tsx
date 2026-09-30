import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Drawer,
  Empty,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, SendOutlined } from '@ant-design/icons'
import { toast } from 'sonner'

import { colors, DRAWER, radius, sizing } from '../../../lib/designTokens'
import { usePermission } from '../../../context/PermissionContext'
import { ACTIONS, FEATURES } from '../../../utils/permissions'
import { appConfirm } from '../../../components/common/AppConfirm'
import { StatCard } from '../../../components/common/StatCard'
import { useFeeCategories } from '../../../features/fee-categories'
import type { FeeCategory } from '../../../features/fee-categories'
import {
  FEE_FREQUENCY_COLOR,
  FEE_STRUCTURE_ACTION_LABEL,
  FEE_STRUCTURE_ACTION_TARGET,
  FEE_STRUCTURE_STATUS_LABEL,
  formatMoney,
  getFrequencyLabel,
  getSubmitAction,
  isStructureEditable,
  sumLineTotals,
  toListArray,
  useFeeStructure,
  useFindOrCreateFeeStructure,
  useUpdateFeeStructureStatus,
} from '../../../features/fee-structures'
import type { FeeStructureLine } from '../../../features/fee-structures'
import { FeeHeadsDrawer } from './FeeHeadsDrawer'
import { LockedNotice, StatusFlow, StatusPill } from './StatusFlow'
import { isActionAllowed } from '../statusChange'
import type { StructureTarget } from '../target'

const { Text } = Typography

const TOTAL_CARDS = [
  { key: 'monthly', label: 'Monthly', color: '#1677ff', bg: '#e6f4ff' },
  { key: 'term', label: 'Per Term', color: '#722ed1', bg: '#f9f0ff' },
  { key: 'yearly', label: 'Yearly', color: '#15803d', bg: colors.primaryLight },
  { key: 'oneTime', label: 'One Time', color: '#d46b08', bg: '#fff7e6' },
] as const

export interface StructureDrawerProps {
  target: StructureTarget | null
  onClose: () => void
  /** Fired after the structure is created so the caller can refresh its list. */
  onStructureCreated?: (structureId: string) => void
}

export function StructureDrawer({ target, onClose, onStructureCreated }: StructureDrawerProps) {
  const { can } = usePermission()

  const [editorOpen, setEditorOpen] = useState(false)

  const structureId = target?.structureId ?? null
  const { data, isLoading, isFetching } = useFeeStructure(structureId)
  const { data: categoryData } = useFeeCategories({ limit: 100 })
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } = useUpdateFeeStructureStatus()
  const { mutateAsync: findOrCreate, isPending: isCreating } = useFindOrCreateFeeStructure()

  const structure = data?.data ?? null
  const status = structure?.status ?? null
  const lines = useMemo(() => structure?.lines ?? [], [structure?.lines])
  const canManage = can(FEATURES.FEE_STRUCTURE, ACTIONS.UPDATE)
  const isEditable = canManage && isStructureEditable(status)

  const categories = useMemo<FeeCategory[]>(
    () => toListArray<FeeCategory>(categoryData),
    [categoryData],
  )
  const categoryById = useMemo(() => {
    const map = new Map<string, FeeCategory>()
    for (const category of categories) map.set(category.id, category)
    return map
  }, [categories])

  const activeCategories = useMemo(
    () => categories.filter((category) => category.status === 'ACTIVE'),
    [categories],
  )

  const totals = useMemo(() => sumLineTotals(lines), [lines])

  // The creation flow stops at "Submit for Approval". Every review decision —
  // approve, reject, archive, resubmit — is made from the list by clicking the
  // status pill, so the drawer's only workflow action is the submit itself.
  const submitAction = useMemo(() => getSubmitAction(status), [status])
  const canSubmit = submitAction ? isActionAllowed(submitAction, can) : false
  const hasNoHeads = lines.length === 0

  const handleCreate = async () => {
    if (!target) return
    try {
      const response = await findOrCreate({
        academicYearId: target.academicYearId,
        classId: target.classId,
      })
      const created = response?.data
      if (created?.status && created.status !== 'DRAFT') {
        toast.info(
          `This class already has a ${FEE_STRUCTURE_STATUS_LABEL[created.status].toLowerCase()} fee structure — opening it.`,
        )
      } else {
        toast.success('Draft fee structure created')
      }
      onStructureCreated?.(created?.id ?? '')
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Failed to create fee structure')
    }
  }

  const runSubmit = () => {
    if (!structure || !submitAction) return
    const nextStatus = FEE_STRUCTURE_ACTION_TARGET[submitAction]

    appConfirm({
      title: `${FEE_STRUCTURE_ACTION_LABEL[submitAction]}?`,
      content:
        submitAction === 'RESUBMIT'
          ? 'Your revised fee heads go back to an approver for another look.'
          : 'An approver will review these fee heads. They become locked until then.',
      okText: FEE_STRUCTURE_ACTION_LABEL[submitAction],
      okColor: 'primary',
      onOk: async () => {
        try {
          await updateStatus({ id: structure.id, payload: { status: nextStatus } })
          toast.success('Submitted for approval')
        } catch (err) {
          toast.error((err as Error)?.message ?? 'Failed to submit for approval')
        }
      },
    })
  }

  const columns: ColumnsType<FeeStructureLine> = useMemo(
    () => [
      {
        title: 'Fee Head',
        key: 'category',
        render: (_, line) => {
          const category = line.feeCategory ?? categoryById.get(line.feeCategoryId)
          return (
            <div>
              <Text strong style={{ fontSize: 13 }}>
                {category?.name ?? 'Unknown fee head'}
              </Text>
              {category?.code && (
                <div style={{ fontSize: 11, color: colors.muted, fontFamily: 'monospace' }}>
                  {category.code.toUpperCase()}
                </div>
              )}
            </div>
          )
        },
      },
      {
        title: 'Frequency',
        dataIndex: 'frequency',
        width: 120,
        render: (frequency: FeeStructureLine['frequency']) => (
          <Tag
            color={FEE_FREQUENCY_COLOR[frequency] ?? 'default'}
            style={{ borderRadius: radius.sm, margin: 0 }}
          >
            {getFrequencyLabel(frequency)}
          </Tag>
        ),
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        width: 140,
        align: 'right',
        render: (amount) => (
          <Text strong style={{ fontFamily: 'monospace', fontSize: 13 }}>
            {formatMoney(amount)}
          </Text>
        ),
      },
    ],
    [categoryById],
  )

  const renderBody = () => {
    if (!target) return null

    // ── No structure yet ────────────────────────────────────────────────────
    if (!structureId) {
      return (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: colors.muted, fontSize: 13 }}>
                No fee structure set up for{' '}
                <Text strong>{target.className}</Text> in {target.academicYearName}
              </span>
            }
          >
            {can(FEATURES.FEE_STRUCTURE, ACTIONS.CREATE) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                loading={isCreating}
                onClick={handleCreate}
                style={{ background: colors.primary }}
              >
                Create Draft
              </Button>
            )}
          </Empty>
        </div>
      )
    }

    if (isLoading) {
      return <Skeleton active paragraph={{ rows: 6 }} />
    }

    if (!structure) {
      return (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Could not load this fee structure." />
        </div>
      )
    }

    return (
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        {/* Primary action sits at the top, matching the students page, so the
            flow is obvious without scrolling the fee-head table. */}
        {submitAction && canSubmit && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <Button
              type="primary"
              icon={<SendOutlined />}
              disabled={hasNoHeads}
              loading={isUpdatingStatus}
              onClick={runSubmit}
              style={{ background: colors.primary }}
            >
              {FEE_STRUCTURE_ACTION_LABEL[submitAction]}
            </Button>
          </div>
        )}

        <StatusFlow status={status} />

        {isEditable && lines.length === 0 && (
          <Alert
            type="warning"
            showIcon
            message="Add at least one fee head before submitting for approval."
          />
        )}

        <LockedNotice status={status} />

        {/* Fee-head table */}
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: `1px solid ${colors.border}`,
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <Text strong style={{ fontSize: 14 }}>Fee Heads</Text>
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                {lines.length} {lines.length === 1 ? 'head' : 'heads'} · applies to all
                sections of this class
              </Text>
            </div>
            {isEditable && (
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setEditorOpen(true)}
                style={{ background: colors.primary, height: sizing.controlHeightSm }}
              >
                Add Fee Head
              </Button>
            )}
          </div>

          <Table<FeeStructureLine>
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={lines}
            pagination={false}
            loading={isFetching && !isLoading}
            scroll={{ x: 520 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No fee heads yet"
                >
                  {isEditable && (
                    <Button type="primary" onClick={() => setEditorOpen(true)}>
                      Add the first fee head
                    </Button>
                  )}
                </Empty>
              ),
            }}
          />
        </div>

        {/* Totals */}
        {lines.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
            }}
          >
            {TOTAL_CARDS.map((card) => (
              <StatCard
                key={card.key}
                variant="compact"
                size="small"
                label={card.label}
                value={formatMoney(totals[card.key])}
                color={card.color}
                iconBg={card.bg}
              />
            ))}
          </div>
        )}
      </Space>
    )
  }

  return (
    <>
      <Drawer
        open={Boolean(target)}
        onClose={onClose}
        size={DRAWER.widthXl}
        destroyOnHidden
        title={
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>
              {target?.className ?? 'Fee Structure'}
            </div>
            <Space size={8} style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {target?.academicYearName}
              </Text>
              <StatusPill status={status} />
            </Space>
          </div>
        }
        styles={{ body: { padding: 20 } }}
      >
        {renderBody()}
      </Drawer>

      {editorOpen && structure && (
        <FeeHeadsDrawer
          key={structure.id}
          structureId={structure.id}
          lines={lines}
          categories={activeCategories}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </>
  )
}
