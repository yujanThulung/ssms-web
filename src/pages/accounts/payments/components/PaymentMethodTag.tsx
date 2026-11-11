import { Tag } from 'antd'
import type { PaymentMethod } from '../../../../features/payments'

const METHOD_CONFIG: Record<PaymentMethod, { label: string; color: string }> = {
  CASH: { label: 'Cash', color: 'green' },
  BANK_TRANSFER: { label: 'Bank Transfer', color: 'blue' },
  CHEQUE: { label: 'Cheque', color: 'orange' },
  DIGITAL_WALLET: { label: 'Digital Wallet', color: 'purple' },
  OTHER: { label: 'Other', color: 'default' },
}

export function PaymentMethodTag({ method }: { method: PaymentMethod }) {
  const config = METHOD_CONFIG[method] ?? { label: method, color: 'default' }
  return <Tag color={config.color} style={{ borderRadius: 4, fontSize: 12 }}>{config.label}</Tag>
}

