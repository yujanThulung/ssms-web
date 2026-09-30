import { Tag, Tooltip, Typography } from 'antd'
import { LockOutlined, SwapOutlined } from '@ant-design/icons'
import { colors, radius } from '../../../lib/designTokens'
import {
  FEE_STRUCTURE_LIFECYCLE,
  FEE_STRUCTURE_STATUS_COLOR,
  FEE_STRUCTURE_STATUS_LABEL,
  FeeStructureStatus,
  getLifecycleIndex,
} from '../../../features/fee-structures'
import type { FeeStructureStatus as FeeStructureStatusType } from '../../../features/fee-structures'

const { Text } = Typography

interface StatusFlowProps {
  status: FeeStructureStatusType | null
}

/**
 * Horizontal tracker for the happy path only: Draft → Pending Approval →
 * Approved. Rejected and Archived are exits from that path rather than steps on
 * it, so they surface as a callout instead of a fourth/fifth node.
 */
export function StatusFlow({ status }: StatusFlowProps) {
  const current = getLifecycleIndex(status)
  const offRamp = status === FeeStructureStatus.REJECTED || status === FeeStructureStatus.ARCHIVED

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          padding: '12px 16px',
          background: colors.surfaceAlt,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          overflowX: 'auto',
        }}
      >
        {FEE_STRUCTURE_LIFECYCLE.map((step, index) => {
          const reached = index <= current
          const isCurrent = index === current

          return (
            <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '2px 4px',
                  whiteSpace: 'nowrap',
                  opacity: reached ? 1 : 0.45,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                    background: isCurrent
                      ? colors.primary
                      : reached
                        ? colors.primaryLight
                        : colors.secondary,
                    color: isCurrent
                      ? '#fff'
                      : reached
                        ? colors.primary
                        : colors.muted,
                    border: isCurrent ? 'none' : `1px solid ${reached ? colors.primaryBorder : colors.border}`,
                  }}
                >
                  {index + 1}
                </span>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isCurrent ? 600 : 400,
                    color: isCurrent ? colors.text : colors.muted,
                  }}
                >
                  {FEE_STRUCTURE_STATUS_LABEL[step]}
                </Text>
              </div>

              {index < FEE_STRUCTURE_LIFECYCLE.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    minWidth: 16,
                    height: 1,
                    margin: '0 8px',
                    background: index < current ? colors.primaryBorder : colors.border,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {offRamp && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: status === FeeStructureStatus.REJECTED ? colors.errorLight : colors.surfaceAlt,
            border: `1px solid ${status === FeeStructureStatus.REJECTED ? colors.error : colors.border}`,
            borderRadius: radius.md,
            fontSize: 13,
            color: colors.textSecondary,
          }}
        >
          <Text style={{ fontSize: 13 }}>
            Currently <Text strong>{FEE_STRUCTURE_STATUS_LABEL[status]}</Text>
            {status === FeeStructureStatus.REJECTED
              ? ' — the fee heads are editable again. Fix them and resubmit for approval.'
              : ' — this structure is closed. Set up a new draft to change the fees.'}
          </Text>
        </div>
      )}
    </div>
  )
}

interface StatusPillProps {
  status: FeeStructureStatusType | null
  /** When provided the pill becomes the control that opens the status change flow. */
  onChangeStatus?: (status: FeeStructureStatusType) => void
}

/**
 * Status badge. Pass `onChangeStatus` to make it clickable — it only becomes
 * interactive when there is somewhere legal to go from the current status.
 */
export function StatusPill({ status, onChangeStatus }: StatusPillProps) {
  if (!status) {
    return <Tag color="default" style={{ borderRadius: radius.sm, margin: 0 }}>Not set up</Tag>
  }

  const pill = (
    <Tag
      color={FEE_STRUCTURE_STATUS_COLOR[status]}
      style={{
        borderRadius: radius.sm,
        margin: 0,
        fontWeight: 500,
        cursor: onChangeStatus ? 'pointer' : undefined,
      }}
    >
      {FEE_STRUCTURE_STATUS_LABEL[status]}
    </Tag>
  )

  if (!onChangeStatus) return pill

  return (
    <Tooltip title="Click to change status">
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation()
          onChangeStatus(status)
        }}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          e.stopPropagation()
          onChangeStatus(status)
        }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        {pill}
        <SwapOutlined style={{ fontSize: 11, color: colors.muted }} />
      </span>
    </Tooltip>
  )
}

export function LockedNotice({ status }: { status: FeeStructureStatusType | null }) {
  if (!status) return null
  if (status === FeeStructureStatus.DRAFT || status === FeeStructureStatus.REJECTED) return null
  if (status === FeeStructureStatus.ARCHIVED) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        background: colors.warningLight,
        border: `1px solid ${colors.warning}`,
        borderRadius: radius.md,
        fontSize: 13,
        color: colors.textSecondary,
      }}
    >
      <LockOutlined style={{ color: colors.warning }} />
      <span>
        Fee heads are locked while pending approval. An approver has to approve or reject this
        structure from the list before the fees can change.
      </span>
    </div>
  )
}
