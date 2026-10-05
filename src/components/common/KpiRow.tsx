import { Col, Row } from 'antd'
import type { ReactNode } from 'react'

import { StatCard } from './StatCard'

export interface KpiItem {
  key: string
  label: string
  value: ReactNode
  icon?: ReactNode
  color?: string
  iconBg?: string
  trend?: { value: number; label?: string }
}

export interface KpiRowProps {
  items: KpiItem[]
  loading?: boolean
  /** antd Col spans — defaults suit 4–6 cards on one desktop row. */
  spans?: { xs?: number; sm?: number; md?: number; lg?: number }
  style?: React.CSSProperties
}

/**
 * Standard responsive KPI grid. Every metric card in the app goes through this
 * so card size, padding and spacing stay identical across screens.
 */
export function KpiRow({ items, loading, spans, style }: KpiRowProps) {
  const span = { xs: 12, sm: 8, md: 6, lg: 4, ...spans }

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24, ...style }}>
      {items.map((item) => (
        <Col key={item.key} xs={span.xs} sm={span.sm} md={span.md} lg={span.lg}>
          <StatCard
            variant="default"
            size="middle"
            label={item.label}
            value={item.value}
            icon={item.icon}
            color={item.color}
            iconBg={item.iconBg}
            trend={item.trend}
            loading={loading}
          />
        </Col>
      ))}
    </Row>
  )
}