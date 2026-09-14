import React from 'react'
import { Skeleton, Space } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { colors, radius } from '../../lib/designTokens'

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatCardVariant = 'compact' | 'default' | 'featured'
export type StatCardSize = 'small' | 'middle' | 'large'

export interface StatCardProps {
  /** Label shown above or below the value */
  label: string
  /** Main numeric or text value */
  value: React.ReactNode
  /** Ant Design icon element */
  icon?: React.ReactNode
  /** Accent / icon color */
  color?: string
  /** Icon background color */
  iconBg?: string
  /**
   * Visual variant:
   * - `compact`  — single-row inline: icon + label + value
   * - `default`  — icon box left, label + value stacked right (AcademicSession style)
   * - `featured` — large hero number, accent top border, label + icon across top
   */
  variant?: StatCardVariant
  /** Card size: affects padding, icon box size, font sizes */
  size?: StatCardSize
  /** Optional trend indicator */
  trend?: { value: number; label?: string }
  /** Show loading skeleton */
  loading?: boolean
  /** Extra content rendered below the value */
  extra?: React.ReactNode
  onClick?: () => void
  style?: React.CSSProperties
  className?: string
}

// ─── Size tokens ──────────────────────────────────────────────────────────────

const SIZE = {
  small: {
    padding: '10px 14px',
    iconBox: 32,
    iconFont: 14,
    value: 16,
    label: 11,
    trend: 11,
    br: radius.md,
  },
  middle: {
    padding: '14px 16px',
    iconBox: 40,
    iconFont: 18,
    value: 22,
    label: 12,
    trend: 12,
    br: radius.lg,
  },
  large: {
    padding: '20px 24px',
    iconBox: 52,
    iconFont: 24,
    value: 30,
    label: 13,
    trend: 13,
    br: radius.xl,
  },
} as const

function IconBox({ size, color, iconBg, icon, boxSize }: {
  size: typeof SIZE[StatCardSize]
  color: string
  iconBg: string
  icon: React.ReactNode
  boxSize?: number
}) {
  const s = boxSize ?? size.iconBox
  return (
    <div style={{
      width: s, height: s,
      borderRadius: radius.md,
      backgroundColor: iconBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color, fontSize: size.iconFont,
      flexShrink: 0,
    }}>
      {icon}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StatCard({
  label, value, icon,
  color = colors.primary,
  iconBg = colors.primaryLight,
  variant = 'default',
  size = 'middle',
  trend,
  loading = false,
  extra,
  onClick,
  style,
  className,
}: StatCardProps) {
  const cfg = SIZE[size]
  const clickable = Boolean(onClick)

  const trendUp = trend && trend.value >= 0
  const trendColor = trendUp ? colors.success : colors.error

  const base: React.CSSProperties = {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: cfg.br,
    padding: cfg.padding,
    boxSizing: 'border-box',
    transition: 'box-shadow 0.18s, border-color 0.18s',
    cursor: clickable ? 'pointer' : 'default',
    ...style,
  }

  const hover = (e: React.MouseEvent<HTMLDivElement>, on: boolean) => {
    if (clickable) e.currentTarget.style.boxShadow = on ? '0 4px 16px rgba(0,0,0,0.09)' : 'none'
  }

  // ── Compact: inline row ──────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <div className={className} style={base} onClick={onClick}
        onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon && <IconBox size={cfg} color={color} iconBg={iconBg} icon={icon} boxSize={cfg.iconBox - 6} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: cfg.label, color: colors.muted, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {label}
            </div>
            {loading ? (
              <Skeleton.Input active size="small" style={{ width: 60, height: 14, marginTop: 2 }} />
            ) : (
              <div style={{ fontSize: cfg.value - 4, fontWeight: 700, color: colors.text, lineHeight: 1.2 }}>{value}</div>
            )}
          </div>
          {trend && !loading && (
            <div style={{ fontSize: cfg.trend, color: trendColor, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, fontWeight: 600 }}>
              {trendUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        {extra}
      </div>
    )
  }

  // ── Featured: hero large number, accent top border ───────────────────────────
  if (variant === 'featured') {
    return (
      <div className={className} style={{ ...base, borderTop: `3px solid ${color}` }} onClick={onClick}
        onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ fontSize: cfg.label, fontWeight: 600, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {label}
          </div>
          {icon && <IconBox size={cfg} color={color} iconBg={iconBg} icon={icon} />}
        </div>
        {loading ? (
          <Skeleton.Input active style={{ width: 100, height: cfg.value, display: 'block' }} />
        ) : (
          <div style={{ fontSize: cfg.value, fontWeight: 700, color: colors.text, lineHeight: 1.1 }}>{value}</div>
        )}
        {trend && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: cfg.trend }}>
            <span style={{ color: trendColor, display: 'flex', alignItems: 'center', gap: 2, fontWeight: 600 }}>
              {trendUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(trend.value)}%
            </span>
            {trend.label && <span style={{ color: colors.muted }}>{trend.label}</span>}
          </div>
        )}
        {extra && <div style={{ marginTop: 10 }}>{extra}</div>}
      </div>
    )
  }

  // ── Default: icon box left, label + value stacked ────────────────────────────
  return (
    <div className={className} style={base} onClick={onClick}
      onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}
    >
      <Space align="center" size={12}>
        {icon && <IconBox size={cfg} color={color} iconBg={iconBg} icon={icon} />}
        <div>
          <div style={{ fontSize: cfg.label, color: colors.muted, lineHeight: 1.2 }}>{label}</div>
          {loading ? (
            <Skeleton.Input active size="small" style={{ width: 80, height: cfg.value - 4, marginTop: 4, display: 'block' }} />
          ) : (
            <div style={{ fontSize: cfg.value, fontWeight: 700, color: colors.text, lineHeight: 1.2, marginTop: 2 }}>{value}</div>
          )}
          {trend && !loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: cfg.trend }}>
              <span style={{ color: trendColor, display: 'flex', alignItems: 'center', gap: 2, fontWeight: 600 }}>
                {trendUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(trend.value)}%
              </span>
              {trend.label && <span style={{ color: colors.muted }}>{trend.label}</span>}
            </div>
          )}
        </div>
      </Space>
      {extra && <div style={{ marginTop: 10 }}>{extra}</div>}
    </div>
  )
}
