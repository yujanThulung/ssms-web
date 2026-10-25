import { Empty, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { colors, radius } from '../../../lib/designTokens'
import { AppTable } from '../../../components/common/AppTable'
import {
  FEE_FREQUENCY_COLOR,
  FEE_FREQUENCY_LABEL,
  formatMoney,
} from '../../../features/fee-structures'
import type { FeeProfile, FeeProfileFrequencyTotals } from '../../../features/fee-profile'

const { Text, Title } = Typography

interface FrequencyRow extends FeeProfileFrequencyTotals {
  key: string
  frequency: string
}

function SummaryRow({
  label,
  value,
  emphasis = false,
  muted = false,
}: {
  label: string
  value: string
  emphasis?: boolean
  muted?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: emphasis ? '12px 14px' : '9px 2px',
        borderTop: emphasis ? 'none' : `1px solid ${colors.border}`,
        background: emphasis ? colors.primaryLight : 'transparent',
        borderRadius: emphasis ? radius.md : 0,
        marginTop: emphasis ? 8 : 0,
      }}
    >
      <Text
        strong={emphasis}
        style={{
          fontSize: emphasis ? 13 : 12,
          color: muted ? colors.muted : emphasis ? colors.primary : colors.textSecondary,
        }}
      >
        {label}
      </Text>
      <Text
        strong={emphasis}
        style={{
          fontSize: emphasis ? 18 : 13,
          fontFamily: 'monospace',
          color: emphasis ? colors.primary : muted ? colors.muted : colors.text,
        }}
      >
        {value}
      </Text>
    </div>
  )
}

export function CalculationTab({ profile }: { profile: FeeProfile }) {
  const calculation = profile.calculation

  if (!calculation) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No calculation available for this fee profile."
      />
    )
  }

  const frequencyRows: FrequencyRow[] = Object.entries(calculation.byFrequency ?? {}).map(
    ([frequency, totals]) => ({
      key: frequency,
      frequency,
      ...totals,
    }),
  )

  const columns: ColumnsType<FrequencyRow> = [
    {
      title: 'Frequency',
      key: 'frequency',
      width: 140,
      render: (_, row) => (
        <Tag
          style={{
            borderRadius: radius.sm,
            margin: 0,
            color: '#ffffff',
            background: FEE_FREQUENCY_COLOR[row.frequency] ?? colors.muted,
            borderColor: 'transparent',
          }}
        >
          {FEE_FREQUENCY_LABEL[row.frequency] ?? row.frequency}
        </Tag>
      ),
    },
    {
      title: 'Gross',
      key: 'grossAmount',
      align: 'right',
      width: 140,
      render: (_, row) => (
        <Text style={{ fontFamily: 'monospace', fontSize: 13 }}>
          {formatMoney(row.grossAmount)}
        </Text>
      ),
    },
    {
      title: 'Discounts',
      key: 'discountAmount',
      align: 'right',
      width: 140,
      render: (_, row) => (
        <Text style={{ fontFamily: 'monospace', fontSize: 13, color: colors.warning }}>
          {formatMoney(row.discountAmount)}
        </Text>
      ),
    },
    {
      title: 'Scholarships',
      key: 'scholarshipAmount',
      align: 'right',
      width: 140,
      render: (_, row) => (
        <Text style={{ fontFamily: 'monospace', fontSize: 13, color: colors.info }}>
          {formatMoney(row.scholarshipAmount)}
        </Text>
      ),
    },
    {
      title: 'Net',
      key: 'netAmount',
      align: 'right',
      width: 140,
      render: (_, row) => (
        <Text strong style={{ fontFamily: 'monospace', fontSize: 13, color: colors.primary }}>
          {formatMoney(row.netAmount)}
        </Text>
      ),
    },
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        alignItems: 'start',
      }}
    >
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.xl,
          padding: 18,
        }}
      >
        <Title level={5} style={{ margin: '0 0 12px', color: colors.text, fontSize: 14 }}>
          Calculation Summary
        </Title>
        <SummaryRow label="Class fee subtotal" value={formatMoney(calculation.classFeeSubTotal)} />
        <SummaryRow label="Additional fee subtotal" value={formatMoney(calculation.additionalFeeSubTotal)} />
        <SummaryRow label="Gross total" value={formatMoney(calculation.grossTotal)} />
        <SummaryRow label="Discounts" value={`- ${formatMoney(calculation.totalDiscounts)}`} muted />
        <SummaryRow label="Scholarships" value={`- ${formatMoney(calculation.totalScholarships)}`} muted />
        <SummaryRow label="Adjusted total" value={formatMoney(calculation.adjustedTotal)} />
        <SummaryRow label="Previous balance" value={formatMoney(calculation.previousBalance)} muted />
        <SummaryRow label="Final payable" value={formatMoney(calculation.finalPayable)} emphasis />
        {profile.lastCalculated && (
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 12 }}>
            Last calculated {new Date(profile.lastCalculated).toLocaleString()}
          </Text>
        )}
      </div>

      <div>
        <Title level={5} style={{ margin: '0 0 12px', color: colors.text, fontSize: 14 }}>
          Breakdown by Frequency
        </Title>
        <AppTable<FrequencyRow>
          rowKey="key"
          columns={columns}
          dataSource={frequencyRows}
          pagination={false}
          scroll={{ x: 700 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No frequency breakdown available."
              />
            ),
          }}
        />
      </div>
    </div>
  )
}
