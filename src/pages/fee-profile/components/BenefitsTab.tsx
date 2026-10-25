import { Empty, Space, Tag, Tabs, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { colors, radius } from '../../../lib/designTokens'
import { AppTable } from '../../../components/common/AppTable'
import { StatusBadge } from '../../../components/common/StatusBadge'
import { formatMoney } from '../../../features/fee-structures'
import type { FeeProfile, FeeProfileBenefit } from '../../../features/fee-profile'

const { Text } = Typography

const BENEFIT_STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  REMOVED: 'default',
}

function programValueLabel(benefit: FeeProfileBenefit) {
  const type = (benefit.programType ?? '').toUpperCase()
  if (type.includes('PERCENT')) return `${benefit.programValue ?? 0}%`
  if (type === 'FIXED' || type === 'FIXED_AMOUNT') return formatMoney(benefit.programValue)
  return benefit.programValue != null ? String(benefit.programValue) : '—'
}

function BenefitTable({
  benefits,
  emptyText,
}: {
  benefits: FeeProfileBenefit[]
  emptyText: string
}) {
  const columns: ColumnsType<FeeProfileBenefit> = [
    {
      title: 'Program',
      key: 'program',
      width: 230,
      render: (_, benefit) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{benefit.programName}</Text>
          {benefit.programCode && (
            <div style={{ fontSize: 11, color: colors.muted, fontFamily: 'monospace' }}>
              {benefit.programCode}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Type',
      key: 'programType',
      width: 110,
      render: (_, benefit) => (
        <Tag style={{ borderRadius: radius.sm, margin: 0 }}>
          {benefit.programType === 'PERCENTAGE' ? 'Percentage' : benefit.programType === 'FIXED' ? 'Fixed' : benefit.programType || '—'}
        </Tag>
      ),
    },
    {
      title: 'Value',
      key: 'programValue',
      width: 110,
      align: 'right',
      render: (_, benefit) => (
        <Text strong style={{ fontFamily: 'monospace', fontSize: 13 }}>
          {programValueLabel(benefit)}
        </Text>
      ),
    },
    {
      title: 'Applied Categories',
      key: 'categoryNames',
      width: 240,
      render: (_, benefit) => {
        const names = benefit.categoryNames ?? []
        if (names.length > 0) {
          return (
            <Space size={4} wrap>
              {names.map((name) => (
                <Tag key={name} style={{ borderRadius: radius.sm, margin: 0 }}>{name}</Tag>
              ))}
            </Space>
          )
        }
        const count = benefit.appliedCategories?.length ?? 0
        return <Text type="secondary" style={{ fontSize: 12 }}>{count > 0 ? `${count} categories` : '—'}</Text>
      },
    },
    {
      title: 'Benefit',
      key: 'benefitAmount',
      width: 130,
      align: 'right',
      render: (_, benefit) => (
        <Text strong style={{ fontFamily: 'monospace', fontSize: 13, color: colors.success }}>
          {formatMoney(benefit.benefitAmount)}
        </Text>
      ),
    },
    {
      title: 'Effective',
      key: 'effectiveDate',
      width: 130,
      render: (_, benefit) => (
        <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>
          {benefit.effectiveDateBS || benefit.effectiveDate || '—'}
        </Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 130,
      render: (_, benefit) => (
        <StatusBadge
          status={benefit.status ?? 'ACTIVE'}
          colorMap={BENEFIT_STATUS_COLOR}
        />
      ),
    },
  ]

  return (
    <AppTable<FeeProfileBenefit>
      rowKey="assignmentId"
      columns={columns}
      dataSource={benefits}
      pagination={false}
      scroll={{ x: 1080 }}
      locale={{
        emptyText: (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
        ),
      }}
    />
  )
}

export function BenefitsTab({ profile }: { profile: FeeProfile }) {
  const discounts = profile.discounts ?? []
  const scholarships = profile.scholarships ?? []

  return (
    <Tabs
      tabPlacement="left"
      defaultActiveKey="discounts"
      items={[
        {
          key: 'discounts',
          label: (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Discounts
              <Tag style={{ borderRadius: radius.pill, margin: 0, fontSize: 11 }}>
                {discounts.length}
              </Tag>
            </span>
          ),
          children: (
            <BenefitTable
              benefits={discounts}
              emptyText="No discount assignments for this year."
            />
          ),
        },
        {
          key: 'scholarships',
          label: (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Scholarships
              <Tag style={{ borderRadius: radius.pill, margin: 0, fontSize: 11 }}>
                {scholarships.length}
              </Tag>
            </span>
          ),
          children: (
            <BenefitTable
              benefits={scholarships}
              emptyText="No scholarship assignments for this year."
            />
          ),
        },
      ]}
    />
  )
}
