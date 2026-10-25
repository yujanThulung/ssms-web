import { Avatar, Col, Divider, Row, Select, Space, Switch, Tag, Typography } from 'antd'
import {
  IdcardOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'

import { colors, radius } from '../../../lib/designTokens'
import { NepaliDatePicker } from '../../../components/nepali-calendar'
import {
  FEE_STRUCTURE_STATUS_COLOR,
  FEE_STRUCTURE_STATUS_LABEL,
} from '../../../features/fee-structures'
import type { AcademicYear } from '../../../features/academic-years'
import type { FeeProfile } from '../../../features/fee-profile'
import { FieldLabel } from './FieldLabel'

const { Text, Title } = Typography

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export interface FeeProfileHeaderProps {
  profile: FeeProfile
  years: AcademicYear[]
  yearsLoading?: boolean
  academicYearId?: string
  onAcademicYearChange: (value?: string) => void
  calculationDate: string
  onCalculationDateChange: (value?: string) => void
  includeInactive: boolean
  onIncludeInactiveChange: (value: boolean) => void
  includeBillingValidation: boolean
  onIncludeBillingValidationChange: (value: boolean) => void
}

export function FeeProfileHeader({
  profile,
  years,
  yearsLoading,
  academicYearId,
  onAcademicYearChange,
  calculationDate,
  onCalculationDateChange,
  includeInactive,
  onIncludeInactiveChange,
  includeBillingValidation,
  onIncludeBillingValidationChange,
}: FeeProfileHeaderProps) {
  const structureStatus = profile.feeStructure?.status
  const structureColor = structureStatus
    ? FEE_STRUCTURE_STATUS_COLOR[structureStatus as keyof typeof FEE_STRUCTURE_STATUS_COLOR] ?? 'default'
    : 'default'
  const structureLabel = structureStatus
    ? FEE_STRUCTURE_STATUS_LABEL[structureStatus as keyof typeof FEE_STRUCTURE_STATUS_LABEL] ?? structureStatus
    : 'No structure'

  const structureTag = profile.feeStructure?.hasApprovedStructure
    ? { label: 'Approved structure', color: 'success' }
    : { label: profile.feeStructure ? structureLabel : 'No fee structure', color: structureColor }

  const yearValue = academicYearId || profile.academicYear.id
  const yearOptions = years.map((year) => ({
    label: `${year.name}${year.status === 'CURRENT' ? ' (Current)' : ''}`,
    value: year.id,
  }))

  if (!yearOptions.some((option) => option.value === yearValue)) {
    yearOptions.push({ label: profile.academicYear.name, value: profile.academicYear.id })
  }

  const yearPeriod = [profile.academicYear.startDateBs, profile.academicYear.endDateBs]
    .filter(Boolean)
    .join(' — ')

  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.xl,
        padding: 16,
        marginBottom: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <Row gutter={[16, 16]} align="middle" justify="space-between">
        <Col flex="auto">
          <Space size={14} align="start">
            <Avatar
              size={48}
              style={{
                background: colors.primaryLight,
                color: colors.primary,
                fontWeight: 700,
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {initials(profile.student.name) || <UserOutlined />}
            </Avatar>
            <div>
              <Title level={5} style={{ margin: 0, color: colors.text }}>
                {profile.student.name}
              </Title>
              <Space size={6} wrap style={{ marginTop: 8 }}>
                {profile.student.admissionNumber && (
                  <Tag icon={<IdcardOutlined />} style={{ borderRadius: radius.sm, margin: 0 }}>
                    {profile.student.admissionNumber}
                  </Tag>
                )}
                {profile.student.rollNumber && (
                  <Tag style={{ borderRadius: radius.sm, margin: 0 }}>
                    Roll {profile.student.rollNumber}
                  </Tag>
                )}
                {profile.currentClass && (
                  <Tag icon={<TeamOutlined />} style={{ borderRadius: radius.sm, margin: 0 }}>
                    {profile.currentClass.name}
                    {profile.currentClass.section ? ` · ${profile.currentClass.section}` : ''}
                  </Tag>
                )}
              </Space>
            </div>
          </Space>
        </Col>

        <Col>
          <Tag
            color={structureTag.color}
            style={{ borderRadius: radius.sm, margin: 0, fontWeight: 500 }}
          >
            {structureTag.label}
          </Tag>
        </Col>
      </Row>

      <Divider style={{ margin: '14px 0' }} />

      <Row gutter={[16, 16]} align="bottom">
        <Col xs={24} md={7}>
          <FieldLabel
            label="Academic Year"
            hint={yearPeriod ? `Active period: ${yearPeriod}` : 'Defaults to the current active academic year.'}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Current active year"
            style={{ width: '100%' }}
            options={yearOptions}
            loading={yearsLoading}
            value={yearValue}
            onChange={(value) => onAcademicYearChange(value)}
          />
        </Col>

        <Col xs={24} md={7} >
          <FieldLabel
            label="Calculation Date (BS)"
            hint="Fees are calculated against this date."
          />
          <NepaliDatePicker
            value={calculationDate}
            onChange={(value) => onCalculationDateChange(value)}
            placeholder="Today in BS"
            allowClear
            style={{ width: '100%' }}
          />
        </Col>

        <Col xs={12} md={5} style={{ paddingLeft: 24 }}>
          <FieldLabel
            label="Include inactive"
            hint="Include inactive fee lines in the calculation."
          />
          <div style={{ marginTop: 8 }}>
            <Space size={8}>
              <Switch
                size="small"
                checked={includeInactive}
                onChange={onIncludeInactiveChange}
              />
              <Text style={{ fontSize: 12 }}>
                {includeInactive ? 'Included' : 'Active only'}
              </Text>
            </Space>
          </div>
        </Col>

        <Col xs={12} md={5}>
          <FieldLabel
            label="Billing validation"
            hint="Attach billing status and period limits to each fee line."
          />
          <div style={{ marginTop: 8 }}>
            <Space size={8}>
              <Switch
                size="small"
                checked={includeBillingValidation}
                onChange={onIncludeBillingValidationChange}
              />
              <Text style={{ fontSize: 12 }}>
                {includeBillingValidation ? 'On' : 'Off'}
              </Text>
            </Space>
          </div>
        </Col>
      </Row>
    </div>
  )
}
