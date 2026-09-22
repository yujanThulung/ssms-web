import { Tag } from 'antd'

interface StatusBadgeProps {
  status: string
  /** Optional custom color mapping for specific status values */
  colorMap?: Record<string, string>
}

export const DEFAULT_COLOR_MAP: Record<string, string> = {
  // generic
  ACTIVE:          'success',
  INACTIVE:        'default',
  CURRENT:         'success',
  UPCOMING:        'warning',
  ARCHIVED:        'default',
  // student-specific
  ADMITTED:        'blue',
  SUSPENDED:       'orange',
  TRANSFERRED_OUT: 'purple',
  GRADUATED:       'cyan',
}

export function getStatusColor(status: string, colorMap?: Record<string, string>) {
  if (!status) return 'default'
  const upperStatus = status.toUpperCase()
  return colorMap?.[upperStatus] || DEFAULT_COLOR_MAP[upperStatus] || 'default'
}

export function StatusBadge({ status, colorMap }: StatusBadgeProps) {
  if (!status) return null

  const color = getStatusColor(status, colorMap)
  // Handle SNAKE_CASE  "Transferred Out"
  const label = status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')

  return (
    <Tag color={color} style={{ borderRadius: 6, margin: 0 }}>
      {label}
    </Tag>
  )
}
