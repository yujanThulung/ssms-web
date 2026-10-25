import { useMemo, useState } from 'react'
import {
  Alert,
  Col,
  Empty,
  InputNumber,
  Progress,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd'
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  HourglassOutlined,
} from '@ant-design/icons'

import { colors, radius } from '../../../lib/designTokens'
import { KpiRow } from '../../../components/common/KpiRow'
import type { KpiItem } from '../../../components/common/KpiRow'
import { getTodayBsDate } from '../../../components/nepali-calendar'
import { FEE_FREQUENCY_OPTIONS } from '../../../features/fee-structures'
import {
  type FeeFrequency,
  type FeeProfile,
  useBillingPeriodSummary,
} from '../../../features/fee-profile'
import { FieldLabel } from './FieldLabel'

const { Text, Title } = Typography

function monthFromIso(value?: string | null) {
  if (!value) return undefined
  const month = Number(value.split('-')[1])
  return Number.isInteger(month) && month >= 1 && month <= 12 ? month : undefined
}

export function BillingPeriodsTab({ profile }: { profile: FeeProfile }) {
  const defaultStartMonth =
    monthFromIso(profile.academicYear.startDateBs) ??
    monthFromIso(profile.academicYear.startDate) ??
    1
  const today = getTodayBsDate()

  const [frequency, setFrequency] = useState<FeeFrequency>('MONTHLY')
  const [startMonth, setStartMonth] = useState<number>(defaultStartMonth)
  const [currentMonth, setCurrentMonth] = useState<number>(today.month)

  const { data, isLoading, isFetching, error } = useBillingPeriodSummary(frequency, {
    academicYearStartMonth: startMonth,
    currentMonth,
  })

  const kpiItems: KpiItem[] = useMemo(
    () => [
      {
        key: 'total',
        label: 'Total Periods',
        value: data?.totalPeriods ?? 0,
        icon: <CalendarOutlined />,
        color: colors.primary,
        iconBg: colors.primaryLight,
      },
      {
        key: 'complete',
        label: 'Complete',
        value: data?.completePeriods ?? 0,
        icon: <CheckCircleOutlined />,
        color: colors.success,
        iconBg: colors.successLight,
      },
      {
        key: 'current',
        label: 'Current Period',
        value: data?.currentPeriod ?? '—',
        icon: <ClockCircleOutlined />,
        color: colors.info,
        iconBg: colors.infoLight,
      },
      {
        key: 'remaining',
        label: 'Remaining',
        value: data?.remainingPeriods ?? 0,
        icon: <HourglassOutlined />,
        color: colors.warning,
        iconBg: colors.warningLight,
      },
    ],
    [data],
  )

  const progress = data && data.totalPeriods > 0
    ? Math.round((data.completePeriods / data.totalPeriods) * 100)
    : 0

  const frequencyHint =
    frequency === 'MONTHLY'
      ? 'One period per calendar month across the academic year.'
      : frequency === 'TERM'
        ? 'Three terms: months 1–4, 5–8 and 9–12.'
        : 'A single billing period for the whole academic year.'

  return (
    <div>
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.xl,
          padding: 18,
          marginBottom: 20,
        }}
      >
        <Title level={5} style={{ margin: '0 0 14px', color: colors.text, fontSize: 14 }}>
          Billing Period Summary
        </Title>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <FieldLabel label="Frequency" hint={frequencyHint} />
            <Select
              value={frequency}
              onChange={(value) => setFrequency(value)}
              options={FEE_FREQUENCY_OPTIONS}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={8}>
            <FieldLabel
              label="Academic year starts in"
              hint="Month the academic year begins, used to order billing periods."
            />
            <InputNumber
              min={1}
              max={12}
              value={startMonth}
              onChange={(value) => setStartMonth(value ?? 1)}
              addonBefore="Month"
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={8}>
            <FieldLabel
              label="Current month"
              hint="Periods up to this month count as current or complete."
            />
            <InputNumber
              min={1}
              max={12}
              value={currentMonth}
              onChange={(value) => setCurrentMonth(value ?? 1)}
              addonBefore="Month"
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </div>

      {error ? (
        <Alert
          type="error"
          showIcon
          message="Could not load billing periods"
          description={error.message}
          style={{ marginBottom: 20 }}
        />
      ) : (
        <>
          <KpiRow items={kpiItems} loading={isLoading || isFetching} spans={{ lg: 6 }} />

          {!isLoading && data ? (
            <div
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.xl,
                padding: 18,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                <Text strong style={{ fontSize: 13 }}>Progress</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {data.completePeriods} of {data.totalPeriods} periods complete
                </Text>
              </div>
              <Progress percent={progress} strokeColor={colors.primary} />

              <div style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 11, color: colors.muted, display: 'block', marginBottom: 10 }}>
                  Periods
                </Text>
                <Space size={[6, 6]} wrap>
                  {data.periodNames.map((name, index) => {
                    const periodNumber = index + 1
                    const isComplete = periodNumber <= data.completePeriods
                    const isCurrent = periodNumber === data.currentPeriod
                    return (
                      <Tag
                        key={`${name}-${periodNumber}`}
                        color={isCurrent ? 'blue' : isComplete ? 'success' : 'default'}
                        style={{
                          borderRadius: radius.sm,
                          margin: 0,
                          fontWeight: isCurrent ? 600 : 400,
                        }}
                      >
                        {name}
                      </Tag>
                    )
                  })}
                </Space>
              </div>
            </div>
          ) : !isLoading ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No billing period summary available."
            />
          ) : null}
        </>
      )}
    </div>
  )
}
