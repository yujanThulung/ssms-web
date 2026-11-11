import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseAsString, useQueryState } from 'nuqs'
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  ChartArea,
  ChartColumn,
  ChartLine,
  ChartPie,
  CreditCard,
  Donut,
  FilePlus2,
  GraduationCap,
  Info,
  Users,
  UserPlus,
  UserRoundCheck,
  UserRoundX,
  Wallet,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { formatMoney } from '../../features/fee-structures'
import { useAcademicYears, type AcademicYear } from '../../features/academic-years'
import { useDashboard, type DashboardData } from '../../features/dashboard'
import { usePermission } from '../../context/PermissionContext'
import { FEATURES, ACTIONS, ROLES } from '../../utils/permissions'
import { colors, radius, shadow } from '../../lib/designTokens'
import {
  ChartSwitch,
  DistributionChart,
  SeriesChart,
  type ChartTypeOption,
  type DistributionDatum,
} from './DashboardCharts'
import { chartPalette } from './chartPalette'

const { Text, Title } = Typography

type DistributionType = 'donut' | 'pie' | 'bar'
type StudentsClassChartType = 'donut' | 'bar'
type FeeClassChartType = 'bar' | 'pie'
type TrendChartType = 'line' | 'area' | 'bar'
type CollectionChartType = 'bar' | 'line' | 'area'

const distributionOptions: ReadonlyArray<ChartTypeOption<DistributionType>> = [
  { value: 'donut', label: 'Donut chart', icon: <Donut size={14} /> },
  { value: 'pie', label: 'Pie chart', icon: <ChartPie size={14} /> },
  { value: 'bar', label: 'Bar chart', icon: <ChartColumn size={14} /> },
]

const studentsClassChartOptions: ReadonlyArray<ChartTypeOption<StudentsClassChartType>> = [
  { value: 'donut', label: 'Doughnut chart', icon: <Donut size={14} /> },
  { value: 'bar', label: 'Bar chart', icon: <ChartColumn size={14} /> },
]

const feeClassChartOptions: ReadonlyArray<ChartTypeOption<FeeClassChartType>> = [
  { value: 'pie', label: 'Pie chart', icon: <ChartPie size={14} /> },
  { value: 'bar', label: 'Bar chart', icon: <ChartColumn size={14} /> },
]

const trendOptions: ReadonlyArray<ChartTypeOption<TrendChartType>> = [
  { value: 'line', label: 'Line chart', icon: <ChartLine size={14} /> },
  { value: 'area', label: 'Area chart', icon: <ChartArea size={14} /> },
  { value: 'bar', label: 'Bar chart', icon: <ChartColumn size={14} /> },
]

const collectionOptions: ReadonlyArray<ChartTypeOption<CollectionChartType>> = [
  { value: 'bar', label: 'Grouped bars', icon: <ChartColumn size={14} /> },
  { value: 'line', label: 'Line chart', icon: <ChartLine size={14} /> },
  { value: 'area', label: 'Area chart', icon: <ChartArea size={14} /> },
]

function Panel({ title, subtitle, extra, children, style }: {
  title: string
  subtitle?: string
  extra?: React.ReactNode
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 650 }}>{title}</span>
          {subtitle && (
            <Tooltip title={subtitle}>
              <button
                type="button"
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'help',
                  color: colors.muted,
                  borderRadius: '50%',
                  lineHeight: 1,
                }}
                aria-label={subtitle}
              >
                <Info size={14} />
              </button>
            </Tooltip>
          )}
        </div>
      }
      extra={extra}
      style={{ borderRadius: radius.lg, borderColor: colors.border, boxShadow: shadow.card, height: '100%', ...style }}
      styles={{ body: { padding: 20 } }}
    >
      {children}
    </Card>
  )
}

function MetricCard({ label, value, icon, color, iconBg, change, comparison, favorableWhen = 'up', loading }: {
  label: string
  value: React.ReactNode
  icon: React.ReactNode
  color: string
  iconBg: string
  change?: number | null
  comparison?: string
  favorableWhen?: 'up' | 'down'
  loading?: boolean
}) {
  const isFavorable = change != null && (favorableWhen === 'up' ? change >= 0 : change <= 0)
  return (
    <Card style={{ height: '100%', borderRadius: radius.lg, borderColor: colors.border, boxShadow: shadow.card }} styles={{ body: { padding: 16 } }}>
      {loading ? <Skeleton active title={false} paragraph={{ rows: 2 }} /> : <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.35 }}>{label}</Text>
          <span style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', color, background: iconBg, flexShrink: 0 }}>{icon}</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700, color: colors.text, lineHeight: 1.2 }}>{value}</div>
        {change != null ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 7, color: isFavorable ? colors.success : colors.error, fontSize: 11, fontWeight: 600 }}>
            {change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(change)}% <Text type="secondary" style={{ fontSize: 11, fontWeight: 400 }}>{comparison}</Text>
          </div>
        ) : <Text type="secondary" style={{ display: 'block', marginTop: 7, fontSize: 11 }}>No comparison data available</Text>}
      </>}
    </Card>
  )
}

function DashboardContent({ data, loading }: { data?: DashboardData; loading: boolean }) {
  const navigate = useNavigate()
  const methods = data?.paymentMethods.breakdown ?? []
  const genders = data?.students.byGender ?? []
  const classes = data?.students.byClass ?? []
  const collections = data?.feeCollection.byClass ?? []
  const [classChartType, setClassChartType] = useState<StudentsClassChartType>('donut')
  const [admissionChartType, setAdmissionChartType] = useState<TrendChartType>('line')
  const [paymentChartType, setPaymentChartType] = useState<DistributionType>('donut')
  const [monthlyChartType, setMonthlyChartType] = useState<CollectionChartType>('bar')
  const [feeClassChartType, setFeeClassChartType] = useState<FeeClassChartType>('pie')

  const classData: DistributionDatum[] = classes.map((item, index) => ({
    label: item.className,
    value: item.studentCount,
    color: chartPalette[index % chartPalette.length],
  }))
  const genderData: DistributionDatum[] = genders.map((item, index) => ({
    label: item.gender,
    value: item.count,
    color: chartPalette[index % chartPalette.length],
  }))
  const methodData: DistributionDatum[] = methods.map((item, index) => ({
    label: item.method,
    value: item.transactionCount,
    color: chartPalette[index % chartPalette.length],
  }))
  const collectionData: DistributionDatum[] = collections.map((item, index) => ({
    label: item.className,
    value: item.collectedAmount,
    color: chartPalette[index % chartPalette.length],
  }))
  const admissionTrend = data?.students.admissionTrend ?? []
  const monthlyCollection = data?.feeCollection.monthly ?? []
  const transactionColumns: ColumnsType<DashboardData['recentTransactions'][number]> = [
    { title: 'Student / Description', key: 'description', render: (_: unknown, item) => <div><div style={{ fontWeight: 600 }}>{item.student?.name || item.description}</div><Text type="secondary" style={{ fontSize: 11 }}>{item.student ? item.description : 'Expense'}</Text></div> },
    { title: 'Method', dataIndex: 'method', key: 'method', render: (value: string) => <Tag style={{ margin: 0, borderRadius: 12 }}>{value}</Tag> },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', render: (value: number, item) => <span style={{ color: item.type === 'EXPENSE' ? colors.error : colors.success, fontWeight: 700 }}>{item.type === 'EXPENSE' ? '−' : '+'}{formatMoney(value)}</span> },
    { title: 'Date', dataIndex: 'date', key: 'date', render: (value: string) => <Text type="secondary" style={{ fontSize: 12 }}>{new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</Text> },
    { title: '', key: 'open', align: 'right', render: (_: unknown, item) => item.type === 'INCOME' ? <Button type="text" size="small" aria-label="Open receipt" icon={<ArrowRight size={15} />} onClick={() => navigate(`/accounts/payments/${item.id}`)} /> : null },
  ]

  const summary = data?.summary
  const financialMetrics = [
    { label: 'Fees collected today', amount: summary?.feesCollectedToday.amount, change: summary?.feesCollectedToday.changePercentage, comparison: 'vs yesterday', favorableWhen: 'up' as const, icon: <Wallet size={17} />, color: '#168b74', iconBg: '#e5f5f0' },
    { label: 'Pending fees', amount: summary?.pendingFees.amount, change: summary?.pendingFees.changePercentage, comparison: 'vs last month', favorableWhen: 'down' as const, icon: <CalendarClock size={17} />, color: '#d28a24', iconBg: '#fff5df' },
    { label: 'Outstanding balance', amount: summary?.outstandingBalance.amount, change: summary?.outstandingBalance.changePercentage, comparison: 'vs last month', favorableWhen: 'down' as const, icon: <Banknote size={17} />, color: '#bd852a', iconBg: '#fff7e8' },
    { label: 'Students paid', amount: summary?.studentsPaid.count, change: summary?.studentsPaid.changePercentage, comparison: 'vs last month', favorableWhen: 'up' as const, icon: <UserRoundCheck size={17} />, color: '#438caa', iconBg: '#eaf6fb', isCount: true },
    { label: 'Students due', amount: summary?.studentsDue.count, change: summary?.studentsDue.changePercentage, comparison: 'vs last month', favorableWhen: 'down' as const, icon: <UserRoundX size={17} />, color: '#7c6ab1', iconBg: '#f3efff', isCount: true },
  ]

  const studentMetrics = [
    { label: 'Total students', value: data?.students.total, icon: <Users size={17} />, color: '#4779ba' },
    { label: 'New admissions', value: data?.students.newAdmissions, icon: <UserPlus size={17} />, color: '#4d9468' },
    { label: 'Active students', value: data?.students.active, icon: <UserRoundCheck size={17} />, color: '#7a65ac' },
    { label: 'Classes', value: data?.students.totalClasses, icon: <GraduationCap size={17} />, color: '#168b74' },
    { label: 'Sections', value: data?.students.totalSections, icon: <Users size={17} />, color: '#d28a24' },
  ]

  return <>
    <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
      {financialMetrics.map((metric) => <Col key={metric.label} xs={12} sm={8} xl={4}>
        <MetricCard label={metric.label} value={metric.amount == null ? '—' : metric.isCount ? metric.amount.toLocaleString() : formatMoney(metric.amount)} icon={metric.icon} color={metric.color} iconBg={metric.iconBg} change={metric.change} comparison={metric.comparison} favorableWhen={metric.favorableWhen} loading={loading} />
      </Col>)}
    </Row>

    <div style={{ margin: '4px 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
      <Title level={5} style={{ margin: 0 }}>Student overview</Title>
      <Tooltip title="Enrollment and admissions">
        <button
          type="button"
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'help',
            color: colors.muted,
            borderRadius: '50%',
            lineHeight: 1,
          }}
          aria-label="Enrollment and admissions"
        >
          <Info size={14} />
        </button>
      </Tooltip>
    </div>
    <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
      {studentMetrics.map((metric) => <Col key={metric.label} xs={12} sm={8} md={6} xl={24 / 5}>
        <Card style={{ height: '100%', borderRadius: radius.lg, borderColor: colors.border }} styles={{ body: { padding: '13px 15px' } }}>
          {loading ? <Skeleton active title={false} paragraph={{ rows: 1 }} /> : <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: metric.color, background: `${metric.color}17`, width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 9 }}>{metric.icon}</span>
            <div><Text type="secondary" style={{ display: 'block', fontSize: 11 }}>{metric.label}</Text><strong style={{ color: colors.text, fontSize: 18 }}>{(metric.value ?? 0).toLocaleString()}</strong></div>
          </div>}
        </Card>
      </Col>)}
    </Row>

    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={24} xl={15}>
        <Panel
          title="Students by class"
          subtitle={`${data?.academicSession.name ?? 'Selected session'} · enrolled students`}
          extra={!loading && classes.length ? <ChartSwitch ariaLabel="Students by class chart type" value={classChartType} onChange={setClassChartType} options={studentsClassChartOptions} /> : undefined}
        >
          {loading ? <Skeleton active paragraph={{ rows: 6 }} /> : classes.length ? (
            <DistributionChart data={classData} variant={classChartType} />
          ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No enrollment data for this session" />}
        </Panel>
      </Col>
      <Col xs={24} xl={9}>
        <Panel
          title="Students by gender"
          subtitle="Student record distribution"
        >
          {loading ? <Skeleton active paragraph={{ rows: 4 }} /> : genders.length ? (
            <DistributionChart
              data={genderData}
              variant="pie"
            />
          ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No gender data available" />}
        </Panel>
      </Col>
      <Col xs={24}>
        <Panel
          title="Admission trend"
          subtitle="New admissions during the selected academic year"
          extra={!loading && admissionTrend.length ? <ChartSwitch ariaLabel="Admission trend chart type" value={admissionChartType} onChange={setAdmissionChartType} options={trendOptions} /> : undefined}
        >
          {loading ? <Skeleton active paragraph={{ rows: 5 }} /> : admissionTrend.length ? (
            <SeriesChart
              labels={admissionTrend.map((point) => point.month)}
              series={[{ name: 'Admissions', color: chartPalette[0], values: admissionTrend.map((point) => point.admissions) }]}
              variant={admissionChartType}
            />
          ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No admissions in this academic year" />}
        </Panel>
      </Col>
    </Row>

    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={24} xl={9}>
        <Panel
          title="Payment methods"
          subtitle={`${(data?.paymentMethods.totalTransactions ?? 0).toLocaleString()} transactions · ${formatMoney(data?.paymentMethods.totalAmount)}`}
          extra={!loading && methods.length ? <ChartSwitch ariaLabel="Payment methods chart type" value={paymentChartType} onChange={setPaymentChartType} options={distributionOptions} /> : undefined}
        >
          {loading ? <Skeleton active paragraph={{ rows: 5 }} /> : methods.length ? (
            <DistributionChart
              data={methodData}
              variant={paymentChartType}
              center={`${data?.paymentMethods.mostUsedMethod?.percentage ?? 0}%`}
              centerLabel="top method"
            />
          ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No payment activity yet" />}
        </Panel>
      </Col>
      <Col xs={24} xl={15}>
        <Panel
          title="Monthly fee collection"
          subtitle="Billed compared with collected amounts"
          extra={!loading && monthlyCollection.length ? <ChartSwitch ariaLabel="Monthly fee collection chart type" value={monthlyChartType} onChange={setMonthlyChartType} options={collectionOptions} /> : undefined}
        >
          {loading ? <Skeleton active paragraph={{ rows: 5 }} /> : monthlyCollection.length ? (
            <SeriesChart
              labels={monthlyCollection.map((point) => point.month)}
              series={[
                { name: 'Billed', color: '#8bbce7', values: monthlyCollection.map((point) => point.billed) },
                { name: 'Collected', color: chartPalette[0], values: monthlyCollection.map((point) => point.collected) },
              ]}
              variant={monthlyChartType}
              valueFormatter={formatMoney}
              axisPrefix="Rs. "
            />
          ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No invoice or payment activity yet" />}
        </Panel>
      </Col>
      <Col xs={24}>
        <Panel
          title="Fee collection by class"
          subtitle="Collected amounts for the selected academic year"
          extra={!loading && collections.length ? <ChartSwitch ariaLabel="Fee collection by class chart type" value={feeClassChartType} onChange={setFeeClassChartType} options={feeClassChartOptions} /> : undefined}
        >
          {loading ? <Skeleton active paragraph={{ rows: 5 }} /> : collections.length ? (
            <DistributionChart data={collectionData} variant={feeClassChartType} valueFormatter={formatMoney} />
          ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No fee collections for this session" />}
        </Panel>
      </Col>
    </Row>

    <Panel title="Recent transactions" subtitle="Latest fee collections">
      {loading ? <Skeleton active paragraph={{ rows: 5 }} /> : <Table<DashboardData['recentTransactions'][number]> rowKey="id" columns={transactionColumns} dataSource={data?.recentTransactions ?? []} pagination={false} size="small" locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No transactions recorded yet" /> }} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <Tag icon={<Users size={12} />} color="blue" style={{ borderRadius: 20, paddingInline: 10 }}>{(data?.billing.totalStudentsBilled ?? 0).toLocaleString()} students billed</Tag>
        <Button type="link" style={{ marginLeft: 'auto' }} onClick={() => navigate('/accounts/payments')}>View all payments <ArrowRight size={14} /></Button>
      </div>
    </Panel>
  </>
}

export default function DashboardPage() {
  const [academicYearId, setAcademicYearId] = useQueryState('academicYearId', parseAsString.withDefault(''))
  const { data: yearsResponse, isLoading: yearsLoading } = useAcademicYears({ limit: 100 })
  const years = useMemo<AcademicYear[]>(() => yearsResponse?.data ?? [], [yearsResponse])
  const navigate = useNavigate()
  const { can, isSuperAdmin, hasRole } = usePermission()
  const isAdmin = isSuperAdmin || hasRole(ROLES.ADMIN, ROLES.SUPER_ADMIN, 'ADMIN', 'SUPER_ADMIN')
  const canViewDashboard = isAdmin || can(FEATURES.DASHBOARD, ACTIONS.VIEW) || can(FEATURES.INVOICE, ACTIONS.VIEW) || can(FEATURES.STUDENT, ACTIONS.VIEW)
  const canCreateInvoice = isAdmin || can(FEATURES.INVOICE, ACTIONS.CREATE)
  const { data, isLoading, isFetching, error, refetch } = useDashboard(academicYearId || undefined, canViewDashboard)
  const selectedSessionId = academicYearId || data?.academicSession.id

  return <div>
    <PageHeader
      title="Dashboard"
      description={data ? `${data.academicSession.name} · Financial and enrollment snapshot` : 'Financial and enrollment snapshot'}
      actions={<Space wrap>
        <Select
          aria-label="Academic year"
          value={selectedSessionId}
          loading={yearsLoading}
          placeholder="Academic year"
          style={{ minWidth: 190 }}
          onChange={(value) => setAcademicYearId(value)}
          options={years.map((year) => ({ label: `${year.name}${year.status === 'CURRENT' ? ' · Current' : ''}`, value: year.id }))}
        />
        {data?.academicSession.status && <Tag color={data.academicSession.status === 'Current' ? 'green' : 'default'}>{data.academicSession.status}</Tag>}
        <Button onClick={() => refetch()} loading={isFetching}>Refresh</Button>
        {canCreateInvoice && <Button icon={<FilePlus2 size={15} />} onClick={() => navigate('/accounts/invoices')}>New invoice</Button>}
        <Button type="primary" icon={<CreditCard size={15} />} onClick={() => navigate('/accounts/payments')} style={{ background: colors.primary }}>Pay Bill</Button>
      </Space>}
    />

    {!canViewDashboard ? (
      <Alert
        type="warning"
        showIcon
        message="Dashboard access requires dashboard or invoice viewing permission."
        style={{ marginBottom: 16 }}
      />
    ) : error ? (
      <Alert
        type="error"
        showIcon
        message="Could not load dashboard data"
        description={error.message}
        action={<Button size="small" onClick={() => refetch()}>Retry</Button>}
        style={{ marginBottom: 16 }}
      />
    ) : null}
    {canViewDashboard && !error && <DashboardContent data={data} loading={isLoading || isFetching && !data} />}
  </div>
}
