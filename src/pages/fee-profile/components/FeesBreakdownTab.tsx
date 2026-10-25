import { Empty, Space, Tag, Tabs, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { colors, radius } from '../../../lib/designTokens'
import { AppTable } from '../../../components/common/AppTable'
import {
  FEE_FREQUENCY_COLOR,
  FEE_FREQUENCY_LABEL,
  formatMoney,
} from '../../../features/fee-structures'
import type {
  FeeProfile,
  FeeProfileAdditionalFee,
  FeeProfileBillingStatus,
  FeeProfileClassFee,
  FeeFrequency,
} from '../../../features/fee-profile'

const { Text } = Typography

function FrequencyTag({ frequency }: { frequency: FeeFrequency }) {
  return (
    <Tag
      style={{
        borderRadius: radius.sm,
        margin: 0,
        color: '#ffffff',
        background: FEE_FREQUENCY_COLOR[frequency] ?? colors.muted,
        borderColor: 'transparent',
        fontSize: 11,
      }}
    >
      {FEE_FREQUENCY_LABEL[frequency] ?? frequency}
    </Tag>
  )
}

function BillingStatusCell({ status }: { status?: FeeProfileBillingStatus | null }) {
  if (!status) return <Text type="secondary">—</Text>

  return (
    <Space direction="vertical" size={2}>
      <Tag
        color={status.canBill ? 'success' : 'error'}
        style={{ borderRadius: radius.sm, margin: 0 }}
      >
        {status.canBill ? 'Can bill' : status.reason || 'Cannot bill'}
      </Tag>
      {status.alreadyBilledCount != null && status.maxBillingsPerYear != null && (
        <Text type="secondary" style={{ fontSize: 11 }}>
          {status.alreadyBilledCount} / {status.maxBillingsPerYear} billed
        </Text>
      )}
      {status.periodIdentifier && (
        <Text type="secondary" style={{ fontSize: 10, fontFamily: 'monospace' }}>
          {status.periodIdentifier}
        </Text>
      )}
    </Space>
  )
}

export function FeesBreakdownTab({ profile }: { profile: FeeProfile }) {
  const classFees = profile.classFees ?? []
  const additionalFees = profile.additionalFees ?? []

  const classFeeColumns: ColumnsType<FeeProfileClassFee> = [
    {
      title: 'Fee Category',
      key: 'category',
      width: 230,
      render: (_, fee) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{fee.categoryName}</Text>
          {fee.categoryCode && (
            <div style={{ fontSize: 11, color: colors.muted, fontFamily: 'monospace' }}>
              {fee.categoryCode}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      width: 130,
      align: 'right',
      render: (_, fee) => (
        <Text strong style={{ fontFamily: 'monospace', fontSize: 13 }}>
          {formatMoney(fee.amount)}
        </Text>
      ),
    },
    {
      title: 'Frequency',
      key: 'frequency',
      width: 120,
      render: (_, fee) => <FrequencyTag frequency={fee.frequency} />,
    },
    {
      title: 'Source',
      key: 'source',
      width: 150,
      render: (_, fee) => (
        <Text style={{ fontSize: 12 }}>
          {fee.source === 'FEE_STRUCTURE' || !fee.source ? 'Class structure' : fee.source}
        </Text>
      ),
    },
    {
      title: 'Billing',
      key: 'billingStatus',
      width: 190,
      render: (_, fee) => <BillingStatusCell status={fee.billingStatus} />,
    },
  ]

  const additionalFeeColumns: ColumnsType<FeeProfileAdditionalFee> = [
    {
      title: 'Fee Category',
      key: 'category',
      width: 220,
      render: (_, fee) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{fee.categoryName}</Text>
          {fee.categoryCode && (
            <div style={{ fontSize: 11, color: colors.muted, fontFamily: 'monospace' }}>
              {fee.categoryCode}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      width: 130,
      align: 'right',
      render: (_, fee) => (
        <Text strong style={{ fontFamily: 'monospace', fontSize: 13 }}>
          {formatMoney(fee.amount)}
        </Text>
      ),
    },
    {
      title: 'Frequency',
      key: 'frequency',
      width: 120,
      render: (_, fee) => <FrequencyTag frequency={fee.frequency} />,
    },
    {
      title: 'Reason',
      key: 'reason',
      width: 200,
      render: (_, fee) => (
        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
          {fee.reason || '—'}
        </Text>
      ),
    },
    {
      title: 'Assigned On',
      key: 'assignedDate',
      width: 130,
      render: (_, fee) => (
        <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>
          {fee.assignedDateBS || fee.assignedDate || '—'}
        </Text>
      ),
    },
    {
      title: 'Billing',
      key: 'billingStatus',
      width: 190,
      render: (_, fee) => <BillingStatusCell status={fee.billingStatus} />,
    },
  ]

  return (
    <Tabs
      tabPlacement="left"
      defaultActiveKey="class"
      items={[
        {
          key: 'class',
          label: (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Class Fees
              <Tag style={{ borderRadius: radius.pill, margin: 0, fontSize: 11 }}>
                {classFees.length}
              </Tag>
            </span>
          ),
          children: (
            <AppTable<FeeProfileClassFee>
              rowKey={(fee) => fee.feeCategoryId}
              columns={classFeeColumns}
              dataSource={classFees}
              pagination={false}
              scroll={{ x: 820 }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No class fees for this academic year."
                  />
                ),
              }}
            />
          ),
        },
        {
          key: 'additional',
          label: (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Additional Fees
              <Tag style={{ borderRadius: radius.pill, margin: 0, fontSize: 11 }}>
                {additionalFees.length}
              </Tag>
            </span>
          ),
          children: (
            <AppTable<FeeProfileAdditionalFee>
              rowKey={(fee) => `${fee.feeCategoryId}-${fee.sourceId ?? fee.assignedDate ?? 'row'}`}
              columns={additionalFeeColumns}
              dataSource={additionalFees}
              pagination={false}
              scroll={{ x: 990 }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No additional fees assigned to this student."
                  />
                ),
              }}
            />
          ),
        },
      ]}
    />
  )
}
