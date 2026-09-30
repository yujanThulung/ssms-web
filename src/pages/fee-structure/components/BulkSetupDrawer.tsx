import { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Col,
  Drawer,
  Empty,
  InputNumber,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import { toast } from 'sonner'

import { colors, radius } from '../../../lib/designTokens'
import { StepBar } from '../../../components/common/StepBar'
import { usePermission } from '../../../context/PermissionContext'
import { ACTIONS, FEATURES } from '../../../utils/permissions'
import { useAcademicYears } from '../../../features/academic-years'
import { useClasses } from '../../../features/classes'
import { useFeeCategories } from '../../../features/fee-categories'
import type { AcademicYear } from '../../../features/academic-years'
import type { SchoolClass } from '../../../features/classes'
import type { FeeCategory } from '../../../features/fee-categories'
import {
  FEE_FREQUENCY_COLOR,
  getFrequencyLabel,
  toListArray,
  toNumber,
  useBulkSetupFeeStructures,
} from '../../../features/fee-structures'
import type { BulkSetupFeeStructuresPayload } from '../../../features/fee-structures'

const { Text } = Typography

const STEPS = [{ title: 'Choose Classes' }, { title: 'Fee Heads & Amounts' }]

/** categoryId -> amount applied to every selected class. */
type AmountMap = Record<string, number>

export interface BulkSetupDrawerProps {
  onClose: () => void
  onDone: () => void
}

/**
 * Seeds several classes at once: pick the classes, multiselect the fee heads,
 * then give each head one amount. Frequency comes from the fee head itself, so
 * the API call is a single POST /fee-structures/bulk-setup.
 */
export function BulkSetupDrawer({ onClose, onDone }: BulkSetupDrawerProps) {
  const { can } = usePermission()
  const canCreate = can(FEATURES.FEE_STRUCTURE, ACTIONS.CREATE)

  const [step, setStep] = useState(0)
  const [academicYearId, setAcademicYearId] = useState<string | undefined>()
  const [classIds, setClassIds] = useState<string[]>([])
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [amounts, setAmounts] = useState<AmountMap>({})

  const { data: yearData, isLoading: isLoadingYears } = useAcademicYears({ limit: 100 })
  const { data: classData, isFetching: isLoadingClasses } = useClasses({ academicYearId })
  const { data: categoryData, isLoading: isLoadingCategories } = useFeeCategories({
    limit: 100,
    status: 'ACTIVE',
  })

  const { mutateAsync: bulkSetup, isPending } = useBulkSetupFeeStructures()

  const years = useMemo<AcademicYear[]>(() => toListArray<AcademicYear>(yearData), [yearData])
  const allClasses = useMemo<SchoolClass[]>(
    () => toListArray<SchoolClass>(classData),
    [classData],
  )
  const allCategories = useMemo<FeeCategory[]>(
    () => toListArray<FeeCategory>(categoryData).filter((c) => c.status === 'ACTIVE'),
    [categoryData],
  )

  const categories = useMemo(
    () => allCategories.filter((c) => categoryIds.includes(c.id)),
    [allCategories, categoryIds],
  )

  const setAmount = useCallback((categoryId: string, value: number) => {
    setAmounts((prev) => ({ ...prev, [categoryId]: value }))
  }, [])

  const handleCategoriesChange = (next: string[]) => {
    setCategoryIds(next)
    // Seed each newly picked head with its default amount.
    setAmounts((prev) => {
      const merged = { ...prev }
      for (const id of next) {
        if (merged[id] === undefined) {
          const category = allCategories.find((c) => c.id === id)
          merged[id] = toNumber(category?.defaultAmount)
        }
      }
      return merged
    })
  }

  const filled = useMemo(
    () => categories.filter((c) => (amounts[c.id] ?? 0) > 0),
    [categories, amounts],
  )

  const perClassTotals = useMemo(() => {
    const totals: Record<string, number> = { MONTHLY: 0, TERM: 0, YEARLY: 0, ONE_TIME: 0 }
    for (const category of filled) {
      const bucket = category.frequency
      if (bucket in totals) totals[bucket] += amounts[category.id] ?? 0
    }
    return totals
  }, [filled, amounts])

  const handleSubmit = async () => {
    if (!academicYearId) return
    if (filled.length === 0) {
      toast.warning('Enter an amount for at least one fee head.')
      return
    }

    const lines = filled.map((category) => ({
      feeCategoryId: category.id,
      amount: String(amounts[category.id] ?? 0),
    }))

    const payload: BulkSetupFeeStructuresPayload = {
      academicYearId,
      classes: classIds.map((classId) => ({ classId, lines })),
    }

    try {
      await bulkSetup(payload)
      toast.success(
        `Applied ${lines.length} fee head${lines.length === 1 ? '' : 's'} to ${classIds.length} class${classIds.length === 1 ? '' : 'es'}`,
      )
      onDone()
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Bulk setup failed')
    }
  }

  const canContinue = academicYearId && classIds.length > 0

  return (
    <Drawer
      open
      onClose={onClose}
      size="large"
      title={
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>Bulk Fee Setup</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Apply the same fee heads to many classes in a single call
          </Text>
        </div>
      }
      extra={
        <Space>
          {step === 1 && (
            <Button onClick={() => setStep(0)} disabled={isPending}>Back</Button>
          )}
          <Button onClick={onClose} disabled={isPending}>Cancel</Button>
          {step === 0 ? (
            <Button
              type="primary"
              disabled={!canContinue}
              onClick={() => setStep(1)}
              style={{ background: colors.primary }}
            >
              Next: Set Amounts
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              loading={isPending}
              disabled={!canCreate || filled.length === 0}
              onClick={handleSubmit}
              style={{ background: colors.primary }}
            >
              Apply to {classIds.length} Class{classIds.length === 1 ? '' : 'es'}
            </Button>
          )}
        </Space>
      }
      styles={{ body: { padding: 20 } }}
    >
      <Text
        type="secondary"
        style={{ display: 'block', marginBottom: 12, fontSize: 12 }}
      >
        {step === 1
          ? `${classIds.length} class${classIds.length === 1 ? '' : 'es'} · ${filled.length} fee head${filled.length === 1 ? '' : 's'} with an amount`
          : 'Each class ends up with one structure that applies to all of its sections.'}
      </Text>

      <StepBar
        steps={STEPS}
        current={step}
        onChange={setStep}
        freeNavigation={false}
        style={{ marginBottom: 20 }}
      />

      {step === 0 ? (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
              Academic Year
            </Text>
            <Select
              style={{ width: '100%' }}
              placeholder="Select academic year"
              loading={isLoadingYears}
              value={academicYearId}
              onChange={(value) => {
                setAcademicYearId(value)
                setClassIds([])
              }}
              options={years.map((year) => ({
                value: year.id,
                label: year.status === 'CURRENT' ? `${year.name} (Current)` : year.name,
              }))}
            />
          </Col>

          <Col span={24}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <Text strong style={{ fontSize: 13 }}>Classes</Text>
              {allClasses.length > 0 && (
                <Button
                  size="small"
                  type="link"
                  style={{ padding: 0, height: 'auto' }}
                  onClick={() =>
                    setClassIds(
                      classIds.length === allClasses.length ? [] : allClasses.map((c) => c.id),
                    )
                  }
                >
                  {classIds.length === allClasses.length
                    ? 'Clear selection'
                    : `Select all (${allClasses.length})`}
                </Button>
              )}
            </div>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder={
                academicYearId ? 'Select one or more classes' : 'Select an academic year first'
              }
              disabled={!academicYearId}
              loading={isLoadingClasses}
              value={classIds}
              onChange={setClassIds}
              maxTagCount="responsive"
              showSearch
              optionFilterProp="label"
              options={allClasses.map((item) => ({ value: item.id, label: item.name }))}
              notFoundContent={
                academicYearId
                  ? 'No classes found for this academic year'
                  : 'Select an academic year first'
              }
            />
            {classIds.length > 0 && (
              <Space size={6} wrap style={{ marginTop: 10 }}>
                {allClasses
                  .filter((item) => classIds.includes(item.id))
                  .map((item) => (
                    <Tag key={item.id} style={{ borderRadius: radius.sm, margin: 0 }}>
                      {item.name}
                    </Tag>
                  ))}
              </Space>
            )}
          </Col>
        </Row>
      ) : (
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
              Fee Heads to include
            </Text>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder={isLoadingCategories ? 'Loading fee heads…' : 'Multiselect fee heads'}
              loading={isLoadingCategories}
              value={categoryIds}
              onChange={handleCategoriesChange}
              maxTagCount="responsive"
              showSearch
              optionFilterProp="label"
              options={allCategories.map((category) => ({
                value: category.id,
                label: `${category.name} · ${getFrequencyLabel(category.frequency)}`,
              }))}
              notFoundContent="No active fee heads. Create fee categories first."
            />
          </div>

          {categoryIds.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Select one or more fee heads to set their amounts"
            />
          ) : (
            <div
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: radius.lg,
                overflow: 'hidden',
              }}
            >
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderTop: index === 0 ? 'none' : `1px solid ${colors.border}`,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <Text strong style={{ fontSize: 13 }}>{category.name}</Text>
                    <div>
                      <Tag
                        color={FEE_FREQUENCY_COLOR[category.frequency] ?? 'default'}
                        style={{ borderRadius: radius.sm, margin: '6px 0 0', fontSize: 11 }}
                      >
                        {getFrequencyLabel(category.frequency)}
                      </Tag>
                    </div>
                  </div>
                  <InputNumber
                    min={0}
                    precision={2}
                    addonBefore="Rs."
                    style={{ width: 200 }}
                    value={amounts[category.id] ?? 0}
                    onChange={(value) => setAmount(category.id, value ?? 0)}
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          )}

          {filled.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 16,
                padding: 16,
                background: colors.surfaceAlt,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.lg,
              }}
            >
              <Statistic
                title="Monthly / class"
                value={perClassTotals.MONTHLY}
                prefix="Rs."
                precision={2}
                valueStyle={{ fontSize: 18, fontWeight: 700 }}
              />
              <Statistic
                title="Per Term / class"
                value={perClassTotals.TERM}
                prefix="Rs."
                precision={2}
                valueStyle={{ fontSize: 18, fontWeight: 700 }}
              />
              <Statistic
                title="Yearly / class"
                value={perClassTotals.YEARLY}
                prefix="Rs."
                precision={2}
                valueStyle={{ fontSize: 18, fontWeight: 700 }}
              />
              <Statistic
                title="One Time / class"
                value={perClassTotals.ONE_TIME}
                prefix="Rs."
                precision={2}
                valueStyle={{ fontSize: 18, fontWeight: 700 }}
              />
            </div>
          )}

          <Alert
            type="info"
            showIcon
            style={{ background: colors.surfaceAlt }}
            message={
              <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 1.5 }}>
                Each amount is applied to <Text strong>all {classIds.length}</Text> selected classes.
                Existing structures for these classes are updated, not duplicated. Amounts of{' '}
                <Text strong>0</Text> are skipped.
              </Text>
            }
          />
        </Space>
      )}
    </Drawer>
  )
}
