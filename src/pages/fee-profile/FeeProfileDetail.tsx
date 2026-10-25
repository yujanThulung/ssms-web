import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { Alert, Button, Drawer, Tabs } from 'antd'
import {
  ArrowLeftOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  GiftOutlined,
  PercentageOutlined,
  ReloadOutlined,
  WalletOutlined,
} from '@ant-design/icons'

import { colors, radius } from '../../lib/designTokens'
import { PageHeader } from '../../components/common/PageHeader'
import { KpiRow } from '../../components/common/KpiRow'
import type { KpiItem } from '../../components/common/KpiRow'
import { CardSkeleton } from '../../components/skeleton'
import { formatBsDate, getTodayBsDate } from '../../components/nepali-calendar'
import { useAcademicYears } from '../../features/academic-years'
import type { AcademicYear } from '../../features/academic-years'
import { formatMoney, toListArray } from '../../features/fee-structures'
import {
  buildFeeProfileWarnings,
  useFeeProfile,
} from '../../features/fee-profile'
import { FeeProfileHeader } from './components/FeeProfileHeader'
import { FeesBreakdownTab } from './components/FeesBreakdownTab'
import { BenefitsTab } from './components/BenefitsTab'
import { CalculationTab } from './components/CalculationTab'
import { BillingPeriodsTab } from './components/BillingPeriodsTab'
import { EffectiveAmountTab } from './components/EffectiveAmountTab'

export default function FeeProfileDetail({ studentId }: { studentId: string }) {
  const navigate = useNavigate()
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const todayBs = useMemo(() => formatBsDate(getTodayBsDate()), [])

  const [academicYearId, setAcademicYearId] = useQueryState('academicYearId')
  const [calculationDate, setCalculationDate] = useQueryState(
    'calculationDate',
    parseAsString.withDefault(todayBs),
  )
  const [includeInactive, setIncludeInactive] = useQueryState(
    'includeInactive',
    parseAsBoolean.withDefault(false),
  )
  const [includeBillingValidation, setIncludeBillingValidation] = useQueryState(
    'includeBillingValidation',
    parseAsBoolean.withDefault(false),
  )

  const params = useMemo(
    () => ({
      academicYearId: academicYearId || undefined,
      calculationDate: calculationDate || undefined,
      includeInactive,
      includeBillingValidation,
    }),
    [academicYearId, calculationDate, includeInactive, includeBillingValidation],
  )

  const { data: profile, isLoading, isFetching, error, refetch } = useFeeProfile(studentId, params)
  const { data: yearsData, isLoading: yearsLoading } = useAcademicYears({ limit: 100 })
  const years = useMemo<AcademicYear[]>(() => toListArray<AcademicYear>(yearsData), [yearsData])

  const warnings = useMemo(() => buildFeeProfileWarnings(profile), [profile])

  const kpiItems: KpiItem[] = profile
    ? [
      {
        key: 'gross',
        label: 'Gross Total',
        value: formatMoney(profile.calculation?.grossTotal),
        icon: <WalletOutlined />,
        color: colors.primary,
        iconBg: colors.primaryLight,
      },
      {
        key: 'discounts',
        label: 'Discounts',
        value: formatMoney(profile.calculation?.totalDiscounts),
        icon: <PercentageOutlined />,
        color: colors.warning,
        iconBg: colors.warningLight,
      },
      {
        key: 'scholarships',
        label: 'Scholarships',
        value: formatMoney(profile.calculation?.totalScholarships),
        icon: <GiftOutlined />,
        color: colors.info,
        iconBg: colors.infoLight,
      },
      {
        key: 'payable',
        label: 'Final Payable',
        value: formatMoney(profile.calculation?.finalPayable),
        icon: <CheckCircleOutlined />,
        color: colors.success,
        iconBg: colors.successLight,
      },
    ]
    : []

  return (
    <div>
      <PageHeader
        title="Fee Profile"
        description="Fee breakdown, benefits and billing status for this student"
        actions={
          <>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/accounts/fee-profiles')}
            >
              Back
            </Button>
            <Button
              icon={<CalculatorOutlined />}
              onClick={() => setCalculatorOpen(true)}
            >
              Calculate Amount
            </Button>
            <Button
              icon={<ReloadOutlined />}
              loading={isFetching}
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </>
        }
      />

      {error && (
        <Alert
          type="error"
          showIcon
          message="Could not load this fee profile"
          description={error.message}
          style={{ marginBottom: 20, borderRadius: radius.md }}
        />
      )}

      {isLoading && !profile ? (
        <CardSkeleton />
      ) : profile ? (
        <>
          <FeeProfileHeader
            profile={profile}
            years={years}
            yearsLoading={yearsLoading}
            academicYearId={academicYearId || undefined}
            onAcademicYearChange={(value) => setAcademicYearId(value || null)}
            calculationDate={calculationDate}
            onCalculationDateChange={(value) => setCalculationDate(value || null)}
            includeInactive={includeInactive}
            onIncludeInactiveChange={setIncludeInactive}
            includeBillingValidation={includeBillingValidation}
            onIncludeBillingValidationChange={setIncludeBillingValidation}
          />

          {warnings.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message="Review before billing"
              description={
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {warnings.map((warning) => (
                    <li key={warning} style={{ fontSize: 12, marginBottom: 2 }}>
                      {warning}
                    </li>
                  ))}
                </ul>
              }
              style={{ marginBottom: 20, borderRadius: radius.md }}
            />
          )}

          <KpiRow items={kpiItems} loading={isFetching} spans={{ lg: 6 }} />

          <Tabs
            size="large"
            defaultActiveKey="fees"
            destroyOnHidden={false}
            items={[
              {
                key: 'fees',
                label: `Fees (${(profile.classFees?.length ?? 0) + (profile.additionalFees?.length ?? 0)})`,
                children: <FeesBreakdownTab profile={profile} />,
              },
              {
                key: 'benefits',
                label: `Benefits (${(profile.discounts?.length ?? 0) + (profile.scholarships?.length ?? 0)})`,
                children: <BenefitsTab profile={profile} />,
              },
              {
                key: 'calculation',
                label: 'Calculation',
                children: <CalculationTab profile={profile} />,
              },
              {
                key: 'billing',
                label: 'Billing Periods',
                children: <BillingPeriodsTab key={profile.academicYear.id} profile={profile} />,
              },
            ]}
          />

          <Drawer
            title="Effective Amount Calculator"
            placement="right"
            width={720}
            open={calculatorOpen}
            onClose={() => setCalculatorOpen(false)}
            destroyOnHidden
          >
            <EffectiveAmountTab
              profile={profile}
              options={{
                academicYearId: academicYearId || undefined,
                calculationDate: calculationDate || undefined,
                includeInactive,
                includeBillingValidation,
              }}
            />
          </Drawer>
        </>
      ) : null}
    </div>
  )
}
