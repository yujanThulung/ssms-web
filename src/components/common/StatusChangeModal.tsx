import { useState, type ReactNode } from 'react'
import { Empty, Modal, Tag, Typography } from 'antd'

import { colors, radius } from '../../lib/designTokens'

const { Text } = Typography

export interface StatusChangeOption<TStatus extends string> {
  /** The status this option moves the record to. */
  value: TStatus
  label: string
  /** antd Tag colour for the target status chip. */
  color?: string
  /** Optional explanation shown once this option is selected. */
  help?: string
}

export interface StatusChangeModalProps<TStatus extends string> {
  open: boolean
  onClose: () => void
  /**
   * The record being changed, e.g. "Grade 5" or "Ramesh's admission". Rendered
   * into the "Current status of {subject}" line — pass null with `open={false}`.
   */
  subject?: ReactNode
  /** Rendered above the current-status chip. Defaults to "Current status of {subject}:". */
  subjectLabel?: ReactNode
  currentLabel: string
  currentColor?: string
  /**
   * Statuses reachable from `currentStatus` that the current user is actually
   * allowed to set. Callers are expected to have already filtered out both
   * illegal and unpermitted transitions — anything passed here is offered.
   */
  options: StatusChangeOption<TStatus>[]
  /** Persist the change. Rejecting keeps the modal open; the caller toasts. */
  onConfirm: (next: TStatus) => Promise<void>
  title?: string
  okText?: string
  confirmButtonStyle?: React.CSSProperties
  /** Shown when `options` is empty. */
  emptyMessage?: string
  loading?: boolean
  width?: number
}

/**
 * Generic status-change flow: shows the current status, offers the legal next
 * statuses as selectable chips, and confirms.
 *
 * The caller owns the workflow entirely — which transitions exist, which the
 * user may perform, and which endpoint persists the change. This component only
 * renders and reports the choice, so any feature with a status lifecycle can
 * reuse it without pulling in domain types.
 */
export function StatusChangeModal<TStatus extends string>({
  open,
  onClose,
  subject,
  subjectLabel,
  currentLabel,
  currentColor,
  options,
  onConfirm,
  title = 'Change Status',
  okText = 'Confirm',
  confirmButtonStyle,
  emptyMessage = 'No further transitions are allowed from this status.',
  loading,
  width = 560,
}: StatusChangeModalProps<TStatus>) {
  const [selected, setSelected] = useState<TStatus | null>(null)
  const [isPending, setPending] = useState(false)

  const handleClose = () => {
    setSelected(null)
    onClose()
  }

  const handleSubmit = async () => {
    if (!selected) return
    setPending(true)
    try {
      await onConfirm(selected)
      setSelected(null)
      // Confirming closes on success; a rejected promise keeps it open so the
      // choice can be corrected or retried.
      handleClose()
    } catch {
      // The caller owns error reporting (it toasts). Swallow here so a failed
      // save does not surface as an unhandled rejection from the click handler.
    } finally {
      setPending(false)
    }
  }

  const help = options.find((option) => option.value === selected)?.help

  return (
    <Modal
      title={title}
      open={open}
      onCancel={handleClose}
      onOk={handleSubmit}
      okText={okText}
      okButtonProps={{
        disabled: !selected,
        loading: loading ?? isPending,
        style: { background: colors.primary, ...confirmButtonStyle },
      }}
      destroyOnHidden
      width={width}
    >
      <div style={{ marginBottom: 16 }}>
        {subjectLabel ?? (
          <Text>
            Current status{subject ? <> of <strong>{subject}</strong></> : null}:
          </Text>
        )}
        <div style={{ marginTop: 6 }}>
          <Tag
            color={currentColor}
            style={{ fontSize: 13, padding: '2px 10px', borderRadius: radius.sm }}
          >
            {currentLabel}
          </Tag>
        </div>
      </div>

      {options.length === 0 ? (
        <div
          style={{
            padding: 16,
            background: colors.surfaceAlt,
            borderRadius: radius.md,
            textAlign: 'center',
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: colors.muted, fontSize: 13 }}>{emptyMessage}</span>
            }
          />
        </div>
      ) : (
        <>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Select the new status:
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            {options.map((option) => {
              const isSelected = selected === option.value
              return (
                <div
                  key={option.value}
                  onClick={() => setSelected(option.value)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: radius.md,
                    border: `2px solid ${isSelected ? colors.primary : colors.border}`,
                    background: isSelected ? colors.primaryLight : colors.surface,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <Tag color={option.color} style={{ marginRight: 6 }}>
                    {option.label}
                  </Tag>
                </div>
              )
            })}
          </div>

          {help && (
            <Text
              type="secondary"
              style={{ display: 'block', marginTop: 14, fontSize: 12, lineHeight: 1.5 }}
            >
              {help}
            </Text>
          )}
        </>
      )}
    </Modal>
  )
}
