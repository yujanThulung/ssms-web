import { useState } from 'react'
import { Button, Empty, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { toast } from 'sonner'

import { colors, radius } from '../../../lib/designTokens'
import { TableSkeleton } from '../../../components/skeleton'
import { usePermission } from '../../../context/PermissionContext'
import { ACTIONS, FEATURES } from '../../../utils/permissions'
import { appConfirm } from '../../../components/common/AppConfirm'
import {
  FEE_FREQUENCY_COLOR,
  formatMoney,
  getFrequencyLabel,
  useApproveFeeLine,
  usePendingLines,
  useRejectFeeLine,
} from '../../../features/fee-structures'
import type { PendingLineItem } from '../../../features/fee-structures'

const { Text } = Typography

export function PendingLinesSection({ academicYearId }: { academicYearId?: string }) {
  const { can } = usePermission()
  const canApprove = can(FEATURES.FEE_STRUCTURE, ACTIONS.APPROVE)

  const { pendingLines, isLoading } = usePendingLines(academicYearId)
  const { mutateAsync: approveLine, isPending: isApproving } = useApproveFeeLine()
  const { mutateAsync: rejectLine, isPending: isRejecting } = useRejectFeeLine()

  // Tracks the exact row + action currently running so only the clicked
  // button shows the spinner. `isPending` alone is shared by every row.
  const [activeAction, setActiveAction] = useState<{
    lineId: string
    action: 'approve' | 'reject'
  } | null>(null)
  const isBusy = isApproving || isRejecting

  const handleApprove = (item: PendingLineItem) => {
    appConfirm({
      title: 'Approve Fee Line?',
      content: (
        <div>
          <Text>
            Approve <Text strong>{item.categoryName}</Text> for{' '}
            <Text strong>{item.className}</Text>?
          </Text>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Once approved, this fee line will be included in new invoices for students in{' '}
              {item.className}.
            </Text>
          </div>
        </div>
      ),
      okText: 'Approve',
      okColor: 'primary',
      onOk: async () => {
        setActiveAction({ lineId: item.lineId, action: 'approve' })
        try {
          await approveLine({ structureId: item.structureId, lineId: item.lineId })
          toast.success(`${item.categoryName} approved and added to active fees`)
        } catch (err) {
          toast.error((err as Error)?.message ?? 'Failed to approve fee line')
        } finally {
          setActiveAction(null)
        }
      },
    })
  }

  const handleReject = (item: PendingLineItem) => {
    appConfirm({
      title: 'Reject Fee Line?',
      content: (
        <div>
          <Text>
            Reject <Text strong>{item.categoryName}</Text> for{' '}
            <Text strong>{item.className}</Text>?
          </Text>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              The fee line will be marked as rejected. The creator can edit and resubmit it, or
              remove it.
            </Text>
          </div>
        </div>
      ),
      okText: 'Reject',
      okColor: 'danger',
      onOk: async () => {
        setActiveAction({ lineId: item.lineId, action: 'reject' })
        try {
          await rejectLine({ structureId: item.structureId, lineId: item.lineId })
          toast.success(`${item.categoryName} rejected`)
        } catch (err) {
          toast.error((err as Error)?.message ?? 'Failed to reject fee line')
        } finally {
          setActiveAction(null)
        }
      },
    })
  }

  const columns: ColumnsType<PendingLineItem> = [
    {
      title: 'Class',
      key: 'class',
      width: 200,
      render: (_, item) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {item.className}
          </Text>
          <div style={{ fontSize: 11, color: colors.muted }}>{item.academicYearName}</div>
        </div>
      ),
    },
    {
      title: 'Fee Head',
      key: 'feeHead',
      render: (_, item) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {item.categoryName}
          </Text>
          {item.categoryCode && (
            <div style={{ fontSize: 11, color: colors.muted, fontFamily: 'monospace' }}>
              {item.categoryCode.toUpperCase()}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      width: 120,
      render: (frequency: string) => (
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
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      align: 'center',
      fixed: 'right',
      render: (_, item) => {
        const approvingThis =
          isBusy && activeAction?.lineId === item.lineId && activeAction.action === 'approve'
        const rejectingThis =
          isBusy && activeAction?.lineId === item.lineId && activeAction.action === 'reject'

        return (
          <Space size={8}>
            {canApprove && (
              <>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  loading={approvingThis}
                  disabled={isBusy && !approvingThis}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleApprove(item)
                  }}
                  style={{ background: colors.success, borderColor: colors.success }}
                >
                  Approve
                </Button>
                <Button
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  loading={rejectingThis}
                  disabled={isBusy && !rejectingThis}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleReject(item)
                  }}
                >
                  Reject
                </Button>
              </>
            )}
          </Space>
        )
      },
    },
  ]

  if (isLoading) {
    return (
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          overflow: 'hidden',
        }}
      >
        <TableSkeleton rows={4} columns={5} />
      </div>
    )
  }

  if (pendingLines.length === 0) {
    return (
      <div
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
        }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: colors.muted, fontSize: 13 }}>
              No individual fee lines pending approval
            </span>
          }
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            When fee lines are added to approved structures, they'll appear here for review.
          </Text>
        </Empty>
      </div>
    )
  }

  return (
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
          padding: '12px 16px',
          borderBottom: `1px solid ${colors.border}`,
          background: colors.warningLight,
        }}
      >
        <Text strong style={{ fontSize: 14 }}>
          Individual Fee Lines Pending Approval
        </Text>
        <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
          {pendingLines.length} {pendingLines.length === 1 ? 'line' : 'lines'} added to approved
          structures
        </Text>
      </div>

      <Table<PendingLineItem>
        rowKey={(item) => item.lineId}
        size="small"
        columns={columns}
        dataSource={pendingLines}
        pagination={false}
        scroll={{ x: 800 }}
      />
    </div>
  )
}
