import type { ReactNode } from 'react'
import { InfoCircleOutlined } from '@ant-design/icons'

import { colors } from '../../lib/designTokens'

export interface FormHintProps {
  children: ReactNode
}

/**
 * Form.Item `extra` hint with an info marker. Only used where the field cannot
 * be understood on its own (date format, "blank means unlimited", etc.).
 */
export function FormHint({ children }: FormHintProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        color: colors.muted,
        lineHeight: 1.4,
      }}
    >
      <InfoCircleOutlined style={{ fontSize: 12, color: colors.disabled }} />
      {children}
    </span>
  )
}