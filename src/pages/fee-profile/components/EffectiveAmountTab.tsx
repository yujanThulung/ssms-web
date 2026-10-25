import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Col,
  Form,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Tooltip,
  Typography,
} from 'antd'
import {
  CalculatorOutlined,
  GiftOutlined,
  InfoCircleOutlined,
  PercentageOutlined,
  WalletOutlined,
} from '@ant-design/icons'

import { colors, radius } from '../../../lib/designTokens'
import { KpiRow } from '../../../components/common/KpiRow'
import type { KpiItem } from '../../../components/common/KpiRow'
import { useFeeCategories } from '../../../features/fee-categories'
import { formatMoney, toListArray } from '../../../features/fee-structures'
import {
  toNumber,
  useEffectiveFeeAmount,
  type EffectiveAmountParams,
  type FeeProfile,
} from '../../../features/fee-profile'

const { Title } = Typography

interface EffectiveAmountOptions {
  academicYearId?: string
  calculationDate?: string
  includeInactive?: boolean
  includeBillingValidation?: boolean
}

interface FormValues {
  feeCategoryId: string
  originalAmount: number
}

export function EffectiveAmountTab({
  profile,
  options,
}: {
  profile: FeeProfile
  options: EffectiveAmountOptions
}) {
  const [form] = Form.useForm<FormValues>()
  const [lookup, setLookup] = useState<EffectiveAmountParams | null>(null)

  const { data: categoriesData, isLoading: categoriesLoading } = useFeeCategories({ limit: 200 })

  const categoryOptions = useMemo(() => {
    const map = new Map<string, { label: string; value: string }>()

    toListArray<{ id: string; name: string; code?: string; frequency?: string }>(categoriesData)
      .forEach((category) => {
        map.set(category.id, {
          label: `${category.name}${category.code ? ` (${category.code})` : ''}`,
          value: category.id,
        })
      })

    for (const fee of [...(profile.classFees ?? []), ...(profile.additionalFees ?? [])]) {
      if (!map.has(fee.feeCategoryId)) {
        map.set(fee.feeCategoryId, {
          label: `${fee.categoryName}${fee.categoryCode ? ` (${fee.categoryCode})` : ''}`,
          value: fee.feeCategoryId,
        })
      }
    }

    return Array.from(map.values())
  }, [categoriesData, profile])

  const { data, isFetching, error } = useEffectiveFeeAmount(lookup)

  const handleCalculate = async () => {
    try {
      const values = await form.validateFields()
      setLookup({
        studentId: profile.student.id,
        feeCategoryId: values.feeCategoryId,
        originalAmount: String(values.originalAmount),
        ...options,
      })
    } catch {
      // Ant Design renders the validation messages inline.
    }
  }

  const originalAmount = toNumber(data?.originalAmount)
  const effectiveAmount = toNumber(data?.effectiveAmount)
  const reduction = originalAmount - effectiveAmount

  const kpiItems: KpiItem[] = data
    ? [
        {
          key: 'original',
          label: 'Original Amount',
          value: formatMoney(data.originalAmount),
          icon: <WalletOutlined />,
          color: colors.textSecondary,
          iconBg: colors.secondary,
        },
        {
          key: 'effective',
          label: 'Effective Amount',
          value: formatMoney(data.effectiveAmount),
          icon: <CalculatorOutlined />,
          color: colors.primary,
          iconBg: colors.primaryLight,
        },
        {
          key: 'discounts',
          label: 'Discounts Applied',
          value: data.applicableDiscounts,
          icon: <PercentageOutlined />,
          color: colors.warning,
          iconBg: colors.warningLight,
        },
        {
          key: 'scholarships',
          label: 'Scholarships Applied',
          value: data.applicableScholarships,
          icon: <GiftOutlined />,
          color: colors.info,
          iconBg: colors.infoLight,
        },
      ]
    : []

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
        <Space size={6} style={{ marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0, color: colors.text, fontSize: 14 }}>
            Effective Amount Calculator
          </Title>
          <Tooltip title="Apply the student's active discounts and scholarships to any fee amount.">
            <InfoCircleOutlined
              style={{ fontSize: 12, color: colors.muted, cursor: 'help' }}
            />
          </Tooltip>
        </Space>

        <Form form={form} layout="vertical" onFinish={handleCalculate}>
          <Row gutter={[16, 0]} align="bottom">
            <Col xs={24} md={11}>
              <Form.Item
                name="feeCategoryId"
                label="Fee Category"
                rules={[{ required: true, message: 'Select a fee category' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select fee category"
                  options={categoryOptions}
                  loading={categoriesLoading}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={7}>
              <Form.Item
                name="originalAmount"
                label="Original Amount"
                rules={[{ required: true, message: 'Enter the base amount' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  addonBefore="Rs."
                  placeholder="0.00"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<CalculatorOutlined />}
                  loading={isFetching}
                  style={{ background: colors.primary, width: '100%' }}
                >
                  Calculate
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message="Could not calculate the effective amount"
          description={error.message}
          style={{ marginBottom: 20 }}
        />
      )}

      {isFetching && !data && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spin />
        </div>
      )}

      {data && (
        <>
          <KpiRow items={kpiItems} spans={{ lg: 6 }} />
          {reduction > 0 && (
            <Alert
              type="success"
              showIcon
              message={`Benefits reduce this amount by ${formatMoney(reduction)}`}
              description="Only active discounts and scholarships effective on the calculation date are applied."
              style={{ borderRadius: radius.md }}
            />
          )}
        </>
      )}
    </div>
  )
}
