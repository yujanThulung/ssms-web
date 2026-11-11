import type { ReactNode } from 'react'
import { Empty, Progress, Segmented, Typography } from 'antd'
import { colors } from '../../lib/designTokens'

const { Text } = Typography

const gridColor = '#e5e7eb'
const trailColor = '#eef2f4'
const labelColor = colors.muted

export interface ChartTypeOption<T extends string> {
  value: T
  label: string
  icon: ReactNode
}

export interface DistributionDatum {
  label: string
  value: number
  color: string
}

export interface ChartSeries {
  name: string
  color: string
  values: number[]
}

function compactNumber(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return Math.round(value).toLocaleString()
}

function shorten(label: string, max = 12): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label
}

export function ChartSwitch<T extends string>({ value, onChange, options, ariaLabel }: {
  value: T
  onChange: (value: T) => void
  options: ReadonlyArray<ChartTypeOption<T>>
  ariaLabel: string
}) {
  return (
    <Segmented
      size="small"
      value={value}
      aria-label={ariaLabel}
      onChange={(next) => onChange(next as T)}
      options={options.map((option) => ({ value: option.value, icon: option.icon, title: option.label }))}
    />
  )
}

/** Donut, pie, or vertical-bar rendering of a single-value distribution. */
export function DistributionChart({ data, variant, center, centerLabel, valueFormatter = (value) => value.toLocaleString() }: {
  data: DistributionDatum[]
  variant: 'donut' | 'pie' | 'bar'
  center?: string
  centerLabel?: string
  valueFormatter?: (value: number) => string
}) {
  if (!data.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data available" />
  if (variant === 'bar') return <VerticalBars data={data} valueFormatter={valueFormatter} />

  const total = data.reduce((sum, item) => sum + item.value, 0)
  let cursor = 0
  const stops = data.map((item) => {
    const start = cursor
    cursor += total ? (item.value / total) * 100 : 0
    return `${item.color} ${start}% ${cursor}%`
  })
  const background = total ? `conic-gradient(${stops.join(', ')})` : colors.border
  const isDonut = variant === 'donut'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
      <div
        role="img"
        aria-label={`${isDonut ? 'Donut' : 'Pie'} chart${center ? `, total ${center}` : ''}`}
        style={{ width: 142, height: 142, borderRadius: '50%', background, display: 'grid', placeItems: 'center', flexShrink: 0 }}
      >
        {isDonut && (
          <div style={{ width: 92, height: 92, borderRadius: '50%', background: colors.surface, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <strong style={{ fontSize: 20, color: colors.text }}>{center ?? total.toLocaleString()}</strong>
            <Text type="secondary" style={{ fontSize: 10 }}>{centerLabel ?? 'total'}</Text>
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 130, display: 'grid', gap: 11 }}>
        {data.map((item, index) => {
          const percentage = total ? Math.round((item.value / total) * 100) : 0
          return (
            <div
              key={`${item.label}-${index}`}
              title={`${item.label}: ${valueFormatter(item.value)} (${percentage}%)`}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}
            >
              <span style={{ width: 9, height: 9, borderRadius: 3, background: item.color, flexShrink: 0 }} />
              <span style={{ color: colors.secondaryText }}>{item.label}</span>
              <strong style={{ marginLeft: 'auto', color: colors.text }}>{valueFormatter(item.value)}</strong>
              <Text type="secondary" style={{ fontSize: 11, minWidth: 32, textAlign: 'right' }}>{percentage}%</Text>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Compact horizontal bar list — the original dashboard progress style. */
export function HorizontalBarList({ data, valueFormatter = (value) => value.toLocaleString(), minColumnWidth }: {
  data: DistributionDatum[]
  valueFormatter?: (value: number) => string
  minColumnWidth?: number
}) {
  if (!data.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data available" />
  const max = Math.max(1, ...data.map((item) => item.value))
  return (
    <div style={{ display: 'grid', gap: 15, gridTemplateColumns: minColumnWidth ? `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))` : undefined }}>
      {data.map((item, index) => (
        <div key={`${item.label}-${index}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(95px, 150px) minmax(60px, 1fr) auto', gap: 12, alignItems: 'center' }}>
          <Text ellipsis title={item.label} style={{ fontSize: 12 }}>{item.label}</Text>
          <Progress
            percent={(item.value / max) * 100}
            showInfo={false}
            strokeColor={item.color}
            trailColor={trailColor}
            size="small"
          />
          <Text style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{valueFormatter(item.value)}</Text>
        </div>
      ))}
    </div>
  )
}

function VerticalBars({ data, valueFormatter }: {
  data: DistributionDatum[]
  valueFormatter: (value: number) => string
}) {
  const width = 720
  const height = 230
  const left = 44
  const right = width - 12
  const top = 14
  const rotate = data.length > 6
  const bottom = height - (rotate ? 50 : 34)
  const max = Math.max(1, ...data.map((item) => item.value))
  const step = (right - left) / data.length
  const barWidth = Math.max(4, Math.min(44, step * 0.62))

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Bar chart" style={{ width: '100%', height: height + 10, overflow: 'visible' }}>
        {[0, 1, 2, 3].map((line) => {
          const y = top + (line * (bottom - top)) / 3
          return (
            <g key={line}>
              <line x1={left} x2={right} y1={y} y2={y} stroke={gridColor} strokeDasharray="4 5" />
              <text x={left - 9} y={y + 4} textAnchor="end" fill={labelColor} fontSize="10">
                {compactNumber((max * (3 - line)) / 3)}
              </text>
            </g>
          )
        })}
        {data.map((item, index) => {
          const center = left + step * (index + 0.5)
          const barHeight = item.value ? Math.max(2, (item.value / max) * (bottom - top)) : 0
          return (
            <g key={`${item.label}-${index}`}>
              <rect
                x={center - barWidth / 2}
                y={bottom - barHeight}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={item.color}
              >
                <title>{`${item.label}: ${valueFormatter(item.value)}`}</title>
              </rect>
              {rotate ? (
                <text
                  x={center}
                  y={bottom + 16}
                  transform={`rotate(-30 ${center} ${bottom + 16})`}
                  textAnchor="end"
                  fill={labelColor}
                  fontSize="10"
                >
                  {shorten(item.label)}
                </text>
              ) : (
                <text x={center} y={bottom + 18} textAnchor="middle" fill={labelColor} fontSize="10">
                  {shorten(item.label)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** Line, area, or grouped-bar rendering of one or more series. */
export function SeriesChart({ labels, series, variant, valueFormatter = (value) => value.toLocaleString(), axisPrefix = '', height = 230 }: {
  labels: string[]
  series: ChartSeries[]
  variant: 'line' | 'area' | 'bar'
  valueFormatter?: (value: number) => string
  axisPrefix?: string
  height?: number
}) {
  if (!labels.length || !series.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data available" />

  const width = 720
  const left = 52
  const right = width - 16
  const top = 16
  const rotate = labels.length > 6
  const bottom = height - (rotate ? 50 : 34)
  const max = Math.max(1, ...series.flatMap((item) => item.values))
  const step = (right - left) / labels.length
  const barWidth = Math.max(3, Math.min(22, (step * 0.7) / Math.max(1, series.length)))
  const xFor = (index: number) => labels.length === 1 ? (left + right) / 2 : left + (index * (right - left)) / (labels.length - 1)
  const barCenterFor = (index: number) => left + step * (index + 0.5)
  const yFor = (value: number) => bottom - (value / max) * (bottom - top)

  return (
    <div>
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${variant} chart`} style={{ width: '100%', height: height + 10, overflow: 'visible' }}>
          {[0, 1, 2, 3].map((line) => {
            const y = top + (line * (bottom - top)) / 3
            return (
              <g key={line}>
                <line x1={left} x2={right} y1={y} y2={y} stroke={gridColor} strokeDasharray="4 5" />
                <text x={left - 9} y={y + 4} textAnchor="end" fill={labelColor} fontSize="10">
                  {axisPrefix}{compactNumber((max * (3 - line)) / 3)}
                </text>
              </g>
            )
          })}

          {variant === 'bar' && labels.map((label, index) => {
            const center = barCenterFor(index)
            const start = center - (barWidth * series.length) / 2
            return (
              <g key={`bar-${label}-${index}`}>
                {series.map((item, seriesIndex) => {
                  const value = item.values[index] ?? 0
                  const barHeight = value ? Math.max(2, (value / max) * (bottom - top)) : 0
                  return (
                    <rect
                      key={item.name}
                      x={start + seriesIndex * barWidth}
                      y={bottom - barHeight}
                      width={Math.max(1, barWidth - 1)}
                      height={barHeight}
                      rx={3}
                      fill={item.color}
                    >
                      <title>{`${label} · ${item.name}: ${valueFormatter(value)}`}</title>
                    </rect>
                  )
                })}
              </g>
            )
          })}

          {(variant === 'line' || variant === 'area') && series.map((item) => {
            const points = labels.map((label, index) => {
              const value = item.values[index] ?? 0
              return { label, value, x: xFor(index), y: yFor(value) }
            })
            const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ')
            const areaPath = points.length
              ? `${path} L ${points[points.length - 1].x},${bottom} L ${points[0].x},${bottom} Z`
              : ''
            return (
              <g key={item.name}>
                {variant === 'area' && <path d={areaPath} fill={item.color} opacity={0.14} />}
                <polyline
                  points={points.map((point) => `${point.x},${point.y}`).join(' ')}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {points.map((point) => (
                  <circle key={`${item.name}-${point.label}`} cx={point.x} cy={point.y} r="4" fill={colors.surface} stroke={item.color} strokeWidth="2.5">
                    <title>{`${point.label} · ${item.name}: ${valueFormatter(point.value)}`}</title>
                  </circle>
                ))}
              </g>
            )
          })}

          {labels.map((label, index) => {
            const x = variant === 'bar' ? barCenterFor(index) : xFor(index)
            return rotate ? (
              <text
                key={`label-${label}-${index}`}
                x={x}
                y={bottom + 16}
                transform={`rotate(-30 ${x} ${bottom + 16})`}
                textAnchor="end"
                fill={labelColor}
                fontSize="10"
              >
                {shorten(label)}
              </text>
            ) : (
              <text key={`label-${label}-${index}`} x={x} y={bottom + 18} textAnchor="middle" fill={labelColor} fontSize="10">
                {shorten(label)}
              </text>
            )
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 4, color: colors.muted, fontSize: 11 }}>
        {series.map((item) => (
          <span key={item.name}>
            <i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: item.color, marginRight: 6 }} />
            {item.name}
          </span>
        ))}
      </div>
    </div>
  )
}
