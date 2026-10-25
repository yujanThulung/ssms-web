import type { CSSProperties } from 'react'
import { Space, Tooltip, Typography } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'

import { colors } from '../../../lib/designTokens'

const { Text } = Typography

export function FieldLabel({
  label,
  hint,
  style,
}: {
  label: string
  hint?: string
  style?: CSSProperties
}) {
  return (
    <Space size={4} style={{ marginBottom: 4, ...style }}>
      <Text style={{ fontSize: 11, color: colors.muted }}>{label}</Text>
      {hint && (
        <Tooltip title={hint}>
          <InfoCircleOutlined
            style={{ fontSize: 11, color: colors.muted, cursor: 'help' }}
          />
        </Tooltip>
      )}
    </Space>
  )
}
