import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryState } from 'nuqs'
import { Avatar, Button, Space, Tooltip } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { SorterResult } from 'antd/es/table/interface'
import {
  Receipt,
  Plus,
  Download,
  Eye,
  Printer,
  Wallet,
  CheckCircle2,
  TrendingDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { colors } from '../../../lib/designTokens'
import { usePermission } from '../../../context/PermissionContext'
import { FEATURES, ACTIONS } from '../../../utils/permissions'
import { PageHeader } from '../../../components/common/PageHeader'
import { KpiRow, type KpiItem } from '../../../components/common/KpiRow'
import { AppTable } from '../../../components/common/AppTable'
import { SearchAndFilter, type SmartColumn } from '../../../components/common/SearchAndFilter'
import type { BsDateRange } from '../../../components/nepali-calendar'
import { TableSkeleton } from '../../../components/skeleton'
import { formatMoney } from '../../../features/fee-structures'
import { useAcademicYears } from '../../../features/academic-years'
import { bsIsoToAdIso } from '../../../utils/nepaliDate'
import {
  usePayments,
  useDownloadReceipt,
  type Payment,
  type PaymentListItem,
  type PaymentListParams,
} from '../../../features/payments'
import { PaymentMethodTag } from './components/PaymentMethodTag'
import { CreatePaymentDrawer } from './components/CreatePaymentDrawer'
import { PaymentReceiptModal } from './components/PaymentReceiptModal'

export default function PaymentsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { can } = usePermission()
  const canCreate = can(FEATURES.PAYMENT, ACTIONS.CREATE)

  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const [limit, setLimit] = useQueryState('limit', parseAsInteger.withDefault(10))
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))
  const [paymentMethod, setPaymentMethod] = useQueryState('paymentMethod', parseAsString.withDefault(''))
  const [academicYearId, setAcademicYearId] = useQueryState('academicYearId', parseAsString.withDefault(''))
  const [dateFromBs, setDateFromBs] = useQueryState('dateFromBs', parseAsString.withDefault(''))
  const [dateToBs, setDateToBs] = useQueryState('dateToBs', parseAsString.withDefault(''))
  const dateRange: BsDateRange | null = dateFromBs || dateToBs ? { from: dateFromBs || undefined, to: dateToBs || undefined } : null
  const [sortBy, setSortBy] = useQueryState('sortBy', parseAsString.withDefault('paymentDate'))
  const [sortOrder, setSortOrder] = useQueryState(
    'sortOrder',
    parseAsStringEnum(['ASC', 'DESC'] as const).withDefault('DESC'),
  )

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null)

  const dateFrom = dateRange?.from ? bsIsoToAdIso(dateRange.from) : undefined
  const dateTo = dateRange?.to ? bsIsoToAdIso(dateRange.to) : undefined

  const queryParams = useMemo<PaymentListParams>(
    () => ({
      page,
      limit,
      ...(search ? { search } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
      ...(academicYearId ? { academicYearId } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      sortBy: sortBy as PaymentListParams['sortBy'],
      sortOrder,
    }),
    [page, limit, search, paymentMethod, academicYearId, dateFrom, dateTo, sortBy, sortOrder],
  )

  const { data, isLoading, isFetching, refetch } = usePayments(queryParams)
  const { data: yearsData } = useAcademicYears({ limit: 50 })
  const academicYears = useMemo(() => yearsData?.data ?? [], [yearsData])
  const { mutateAsync: downloadReceipt } = useDownloadReceipt()

  const payments = useMemo(() => data?.data ?? [], [data])
  const meta = data?.meta
  const total = meta?.total ?? 0

  // KPIs
  const kpis = useMemo<KpiItem[]>(() => {
    const totalAmt = payments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0)
    const cashCount = payments.filter((p) => p.paymentMethod === 'CASH').length
    const bankCount = payments.filter((p) => p.paymentMethod === 'BANK_TRANSFER').length
    return [
      {
        key: 'collected',
        label: 'Collected (this page)',
        value: formatMoney(totalAmt),
        icon: <Wallet size={18} />,
        color: colors.primary,
        iconBg: colors.primaryLight,
      },
      {
        key: 'total',
        label: 'Matching payments',
        value: total,
        icon: <Receipt size={18} />,
        color: colors.success,
        iconBg: colors.successLight,
      },
      {
        key: 'cash',
        label: 'Cash payments (this page)',
        value: cashCount,
        icon: <CheckCircle2 size={18} />,
        color: '#16a34a',
      },
      {
        key: 'bank',
        label: 'Bank transfers (this page)',
        value: bankCount,
        icon: <TrendingDown size={18} />,
        color: '#2563eb',
      },
    ]
  }, [payments, total])

  const filterColumns = useMemo<SmartColumn[]>(
    () => [
      {
        key: 'search',
        title: 'Receipt # / Student / Invoice',
        isSearchable: true,
      },
      {
        key: 'paymentMethod',
        title: 'Method',
        isFilterable: true,
        filterWidth: 150,
        filterOptions: [
          { label: 'All Methods', value: '' },
          { label: 'Cash', value: 'CASH' },
          { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
          { label: 'Cheque', value: 'CHEQUE' },
          { label: 'Digital Wallet', value: 'DIGITAL_WALLET' },
          { label: 'Other', value: 'OTHER' },
        ],
      },
      {
        key: 'academicYearId',
        title: 'Academic Year',
        isFilterable: true,
        filterWidth: 170,
        filterOptions: [
          { label: 'All Years', value: '' },
          ...academicYears.map((ay) => ({ label: ay.name, value: ay.id })),
        ],
      },
      {
        key: 'paymentDate',
        title: 'Payment Date',
        isDateRange: true,
        dateRangeWidth: 300,
      },
    ],
    [academicYears],
  )

  const handleFilterChange = (key: string, value: string | undefined) => {
    setPage(1)
    if (key === 'paymentMethod') setPaymentMethod(value || '')
    if (key === 'academicYearId') setAcademicYearId(value || '')
  }

  const columns = useMemo<ColumnsType<PaymentListItem>>(
    () => [
      {
        title: '#',
        key: 'idx',
        width: 48,
        render: (_: unknown, __: unknown, idx: number) => (
          <span style={{ color: colors.muted, fontSize: 12 }}>{(page - 1) * limit + idx + 1}</span>
        ),
      },
      {
        title: 'Receipt No.',
        dataIndex: 'paymentNumber',
        key: 'paymentNumber',
        sorter: true,
        sortOrder: sortBy === 'paymentNumber' ? (sortOrder === 'ASC' ? 'ascend' : 'descend') : undefined,
        render: (num: string, row: PaymentListItem) => (
          <a href={`/accounts/payments/${row.id}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); navigate(`/accounts/payments/${row.id}`, { state: { from: `${location.pathname}${location.search}` } }) }} style={{ fontFamily: 'monospace', fontWeight: 600, color: colors.primary, fontSize: 13 }}>{num}</a>
        ),
      },
      {
        title: 'Student',
        key: 'student',
        sorter: true,
        sortOrder: sortBy === 'studentName' ? (sortOrder === 'ASC' ? 'ascend' : 'descend') : undefined,
        render: (_: unknown, row: PaymentListItem) => (
          <Space size={8}>
            <Avatar size={28} style={{ backgroundColor: colors.primary, fontSize: 11 }}>
              {row.student?.name ? row.student.name.charAt(0).toUpperCase() : 'S'}
            </Avatar>
            <a href={`/accounts/fee-profiles/${row.student?.id}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); navigate(`/accounts/fee-profiles/${row.student?.id}`) }} style={{ fontWeight: 600, color: colors.primary }}>{row.student?.name || '—'}</a>
          </Space>
        ),
      },
      {
        title: 'Invoice',
        key: 'invoice',
        render: (_: unknown, row: PaymentListItem) => (
          <a href={`/accounts/invoices/${row.invoice?.id}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); navigate(`/accounts/invoices/${row.invoice?.id}`) }} style={{ fontFamily: 'monospace', fontSize: 12, color: colors.primary }}>{row.invoice?.invoiceNumber || '—'}</a>
        ),
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        sorter: true,
        sortOrder: sortBy === 'amount' ? (sortOrder === 'ASC' ? 'ascend' : 'descend') : undefined,
        align: 'right' as const,
        render: (val: string) => (
          <span style={{ fontWeight: 700, color: colors.success }}>{formatMoney(val)}</span>
        ),
      },
      {
        title: 'Method',
        key: 'paymentMethod',
        render: (_: unknown, row: PaymentListItem) => <PaymentMethodTag method={row.paymentMethod} />,
      },
      {
        title: 'Date',
        dataIndex: 'paymentDateBS',
        key: 'paymentDate',
        sorter: true,
        sortOrder: sortBy === 'paymentDate' ? (sortOrder === 'ASC' ? 'ascend' : 'descend') : undefined,
        render: (bs: string, row: PaymentListItem) => (
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{bs} BS</div>
            <div style={{ fontSize: 11, color: colors.muted }}>{row.paymentDate}</div>
          </div>
        ),
      },
      {
        title: 'Outstanding After',
        dataIndex: 'invoiceOutstandingAfter',
        key: 'invoiceOutstandingAfter',
        align: 'right' as const,
        render: (val: string) => {
          const num = parseFloat(val)
          return num <= 0 ? (
            <span style={{ color: colors.success, fontWeight: 600, fontSize: 12 }}>✓ Paid</span>
          ) : (
            <span style={{ color: colors.error, fontSize: 12 }}>{formatMoney(num)}</span>
          )
        },
      },
      {
        title: 'Collected By',
        key: 'collectedBy',
        render: (_: unknown, row: PaymentListItem) => (
          <span style={{ fontSize: 12, color: colors.secondaryText }}>{row.collectedBy?.name || '—'}</span>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        align: 'right' as const,
        width: 120,
        render: (_: unknown, row: PaymentListItem) => (
          <Space size={0} onClick={(e) => e.stopPropagation()}>
            <Tooltip title="View Receipt">
              <Button
                type="text"
                size="small"
                icon={<Eye size={15} color={colors.secondaryText} />}
                onClick={() => navigate(`/accounts/payments/${row.id}`, { state: { from: `${location.pathname}${location.search}` } })}
              />
            </Tooltip>
            <Tooltip title="Print Receipt">
              <Button
                type="text"
                size="small"
                icon={<Printer size={15} color={colors.secondaryText} />}
                onClick={() =>
                  setReceiptPayment(row as unknown as Payment)
                }
              />
            </Tooltip>
            <Tooltip title="Download Receipt">
              <Button
                type="text"
                size="small"
                icon={<Download size={15} color={colors.secondaryText} />}
                onClick={async () => {
                  try {
                    await downloadReceipt({ paymentId: row.id, paymentNumber: row.paymentNumber })
                    toast.success('Receipt downloaded')
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Download failed')
                  }
                }}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [sortBy, sortOrder, page, limit, downloadReceipt],
  )

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: unknown,
    sorter: SorterResult<PaymentListItem> | SorterResult<PaymentListItem>[],
  ) => {
    if (pagination.current) setPage(pagination.current)
    if (pagination.pageSize) setLimit(pagination.pageSize)
    const s = Array.isArray(sorter) ? sorter[0] : sorter
    if (s && s.columnKey) {
      setSortBy(String(s.columnKey))
      setSortOrder(s.order === 'ascend' ? 'ASC' : 'DESC')
    }
  }

  return (
    <div>
      <PageHeader
        title="Payments & Receipts"
        description={`${total} payment${total !== 1 ? 's' : ''} recorded`}
        actions={
          canCreate ? (
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => setCreateDrawerOpen(true)}
              style={{ backgroundColor: colors.primary }}
            >
              Pay Bill
            </Button>
          ) : undefined
        }
      />

      <KpiRow items={kpis} loading={isLoading} />

      <SearchAndFilter
        columns={filterColumns}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v)
          setPage(1)
        }}
        searchPlaceholder="Search receipt #, student, invoice..."
        filterValues={{
          paymentMethod,
          academicYearId,
        }}
        onFilterChange={handleFilterChange}
        dateValues={{ paymentDate: dateRange }}
        onDateChange={(_key, range) => {
          setDateFromBs(range?.from || '')
          setDateToBs(range?.to || '')
          setPage(1)
        }}
      />

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (
        <AppTable<PaymentListItem>
          rowKey="id"
          columns={columns}
          dataSource={payments}
          loading={isFetching && !isLoading}
          onChange={handleTableChange}
          onRow={(row) => ({
            onClick: () => navigate(`/accounts/payments/${row.id}`, { state: { from: `${location.pathname}${location.search}` } }),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            showSizeChanger: true,
            showTotal: (t) => `${t} payments`,
          }}
        />
      )}

      <CreatePaymentDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={(created) => {
          setCreateDrawerOpen(false)
          setReceiptPayment(created)
          refetch()
        }}
      />


      {/* Shown after a successful payment or via the row Print button */}
      <PaymentReceiptModal
        payment={receiptPayment}
        open={Boolean(receiptPayment)}
        onClose={() => setReceiptPayment(null)}
      />
    </div>
  )
}

