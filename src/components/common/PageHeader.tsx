import { Space, Typography } from 'antd'
import type { ReactNode } from 'react'

import { colors } from '../../lib/designTokens'

const { Title, Text } = Typography

export interface PageHeaderProps {
  title: ReactNode
  /** Short supporting line under the title. */
  description?: ReactNode
  /** Buttons rendered on the right — export, primary action, etc. */
  actions?: ReactNode
  style?: React.CSSProperties
}

/**
 * Standard page header for every list screen: title, supporting line and a
 * right-aligned action cluster that wraps on narrow screens.
 */
export function PageHeader({ title, description, actions, style }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12,
        ...style,
      }}
    >
      <div>
        <Title level={4} style={{ margin: 0, color: colors.text }}>
          {title}
        </Title>
        {description ? (
          <Text type="secondary" style={{ fontSize: 13 }}>
            {description}
          </Text>
        ) : null}
      </div>
      {actions ? <Space wrap>{actions}</Space> : null}
    </div>
  )
}