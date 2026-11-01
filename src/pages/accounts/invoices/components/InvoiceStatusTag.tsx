import { Tag } from 'antd'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import type { InvoiceStatus } from '../../../../features/invoices'
import { colors } from '../../../../lib/designTokens'

interface InvoiceStatusTagProps {
  status: InvoiceStatus | string
  style?: React.CSSProperties
}

export function getInvoiceStatusMeta(status: string) {
  const upper = (status || '').toUpperCase()
  switch (upper) {
    case 'PAID':
      return {
        label: 'Paid',
        color: colors.success,
        bg: colors.successLight,
        border: '#bbf7d0',
        icon: <CheckCircle2 size={13} style={{ marginRight: 4 }} />,
      }
    case 'PARTIALLY_PAID':
      return {
        label: 'Partially Paid',
        color: colors.info,
        bg: colors.infoLight,
        border: '#bae6fd',
        icon: <Clock size={13} style={{ marginRight: 4 }} />,
      }
    case 'UNPAID':
      return {
        label: 'Unpaid',
        color: colors.warning,
        bg: colors.warningLight,
        border: '#fde68a',
        icon: <AlertCircle size={13} style={{ marginRight: 4 }} />,
      }
    case 'OVERDUE':
      return {
        label: 'Overdue',
        color: colors.error,
        bg: colors.errorLight,
        border: '#fecaca',
        icon: <AlertTriangle size={13} style={{ marginRight: 4 }} />,
      }
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        color: '#6b7280',
        bg: '#f3f4f6',
        border: '#e5e7eb',
        icon: <XCircle size={13} style={{ marginRight: 4 }} />,
      }
    case 'DRAFT':
    default:
      return {
        label: upper === 'DRAFT' ? 'Draft' : upper || 'Unknown',
        color: '#4b5563',
        bg: '#f9fafb',
        border: '#e5e7eb',
        icon: <FileText size={13} style={{ marginRight: 4 }} />,
      }
  }
}

export function InvoiceStatusTag({ status, style }: InvoiceStatusTagProps) {
  const meta = getInvoiceStatusMeta(status)

  return (
    <Tag
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 999,
        fontWeight: 500,
        fontSize: 12,
        color: meta.color,
        backgroundColor: meta.bg,
        border: `1px solid ${meta.border}`,
        margin: 0,
        ...style,
      }}
    >
      {meta.icon}
      {meta.label}
    </Tag>
  )
}

