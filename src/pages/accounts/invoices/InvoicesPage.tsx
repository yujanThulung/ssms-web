import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  parseAsInteger,
  parseAsString,
  useQueryState,
} from 'nuqs'
import {
  Avatar,
  Button,
  Dropdown,
  Space,
  Tag,
  Tooltip,
} from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { SorterResult } from 'antd/es/table/interface'
import {
  Receipt,
  Plus,
  Download,
  Eye,
  Printer,
  XCircle,
  MoreVertical,
  Calendar,
  AlertTriangle,
  Wallet,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { colors } from '../../../lib/designTokens'
import { usePermission } from '../../../context/PermissionContext'
import { FEATURES, ACTIONS } from '../../../utils/permissions'
import { PageHeader } from '../../../components/common/PageHeader'
import { KpiRow, type KpiItem } from '../../../components/common/KpiRow'
import { AppTable } from '../../../components/common/AppTable'
import { SearchAndFilter, type SmartColumn } from '../../../components/common/SearchAndFilter'
import { TableSkeleton } from '../../../components/skeleton'
import { exportCsv } from '../../../utils/csv'
import { formatMoney, toListArray } from '../../../features/fee-structures'
import { useAcademicYears } from '../../../features/academic-years'
import { useClasses } from '../../../features/classes'
import { useSections } from '../../../features/sections'
import {
  useInvoices,
  canCancelInvoice,
  useDownloadInvoicePdf,
  useGenerateInvoicePdf,
  type Invoice,
  type InvoiceListParams,
} from '../../../features/invoices'
import { InvoiceStatusTag } from './components/InvoiceStatusTag'
import { CreateInvoiceDrawer } from './components/CreateInvoiceDrawer'
import { CancelInvoiceModal } from './components/CancelInvoiceModal'
import { InvoicePrintModal } from './components/InvoicePrintModal'

export default function InvoicesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { can } = usePermission()

  const canCreate = can(FEATURES.INVOICE, ACTIONS.CREATE)
  const canDelete = can(FEATURES.INVOICE, ACTIONS.DELETE) || can(FEATURES.INVOICE, ACTIONS.CANCEL)

  // ── URL Query State ────────────────────────────────────────────────────────
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const [limit, setLimit] = useQueryState('limit', parseAsInteger.withDefault(10))
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))
  const [status, setStatus] = useQueryState('status', parseAsString.withDefault(''))
  const [academicYearId, setAcademicYearId] = useQueryState('academicYearId', parseAsString.withDefault(''))
  const [classId, setClassId] = useQueryState('classId', parseAsString.withDefault(''))
  const [sectionId, setSectionId] = useQueryState('sectionId', parseAsString.withDefault(''))
  const [billingPeriod] = useQueryState('billingPeriod', parseAsString.withDefault(''))
  const [sortBy, setSortBy] = useQueryState('sortBy', parseAsString.withDefault('issueDate'))
  const [sortOrder, setSortOrder] = useQueryState<'ASC' | 'DESC'>('sortOrder', parseAsString.withDefault('DESC') as any)

  // ── Modals & Drawers ────────────────────────────────────────────────────────
  const [createDrawerOpen, setCreateModalOpen] = useState(false)
  const [cancelModalInvoice, setCancelModalInvoice] = useState<Invoice | null>(null)
  const [printModalInvoice, setPrintModalInvoice] = useState<Invoice | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)

  const { mutateAsync: downloadPdf } = useDownloadInvoicePdf()
  const { mutateAsync: generatePdf } = useGenerateInvoicePdf()

  const handleDownloadInvoice = async (inv: Invoice) => {
    try {
      setDownloadingId(inv.id)
      await downloadPdf({ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, pdfUrl: inv.pdfUrl })
      toast.success(`Invoice ${inv.invoiceNumber} PDF downloaded`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to download invoice PDF')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleViewInvoice = (inv: Invoice) => {
    navigate(`/accounts/invoices/${inv.id}`, { state: { from: `${location.pathname}${location.search}` } })
  }

  const handleGenerateInvoicePdf = async (inv: Invoice) => {
    try {
      setGeneratingId(inv.id)
      await generatePdf(inv.id)
      toast.success('Invoice PDF regenerated successfully')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to regenerate PDF')
    } finally {
      setGeneratingId(null)
    }
  }

  // ── Filter Lookups ─────────────────────────────────────────────────────────
  const { data: yearsData } = useAcademicYears({ limit: 50 })
  const academicYears = useMemo(() => toListArray<any>(yearsData), [yearsData])

  const { data: classesData } = useClasses({ limit: 100 })
  const classes = useMemo(() => toListArray<any>(classesData), [classesData])

  const { data: sectionsData } = useSections({
    classId: classId || undefined,
    requireClassId: false,
  })
  const sections = useMemo(() => toListArray<any>(sectionsData), [sectionsData])

  // ── Query Invoices ─────────────────────────────────────────────────────────
  const queryParams: InvoiceListParams = useMemo(() => {
    const params: InvoiceListParams = {
      page,
      limit,
      search: search.trim() || undefined,
      status: status || undefined,
      academicYearId: academicYearId || undefined,
      classId: classId || undefined,
      sectionId: sectionId || undefined,
      billingPeriod: billingPeriod || undefined,
      sortBy: (sortBy as any) || 'issueDate',
      sortOrder: (sortOrder as any) || 'DESC',
    }
    return params
  }, [page, limit, search, status, academicYearId, classId, sectionId, billingPeriod, sortBy, sortOrder])

  const { data: invoicesRes, isLoading, isFetching, refetch } = useInvoices(queryParams)

  const invoices = useMemo<Invoice[]>(() => {
    return toListArray<Invoice>(invoicesRes)
  }, [invoicesRes])

  const paginationMeta = invoicesRes?.meta ?? {
    total: invoices.length,
    page,
    limit,
    totalPages: Math.ceil(invoices.length / limit) || 1,
  }

  // ── KPI Metrics ────────────────────────────────────────────────────────────
  const kpis: KpiItem[] = useMemo(() => {
    let totalInvoiced = 0
    let totalPaid = 0
    let totalOutstanding = 0
    let overdueCount = 0

    invoices.forEach((inv) => {
      const payable = parseFloat(String(inv.totalPayable || 0))
      const paid = parseFloat(String(inv.paidAmount || 0))
      const out = parseFloat(String(inv.outstandingAmount || 0))

      if (inv.status !== 'CANCELLED') {
        if (Number.isFinite(payable)) totalInvoiced += payable
        if (Number.isFinite(paid)) totalPaid += paid
        if (Number.isFinite(out)) totalOutstanding += out
      }
      if (inv.status === 'OVERDUE') {
        overdueCount++
      }
    })

    return [
      {
        key: 'total',
        label: 'Total Invoices',
        value: paginationMeta.total,
        icon: <Receipt size={18} />,
        color: colors.primary,
        iconBg: colors.primaryLight,
      },
      {
        key: 'invoiced',
        label: 'Invoiced (this page)',
        value: formatMoney(totalInvoiced),
        icon: <Wallet size={18} />,
        color: colors.info,
        iconBg: colors.infoLight,
      },
      {
        key: 'paid',
        label: 'Collected (this page)',
        value: formatMoney(totalPaid),
        icon: <CheckCircle2 size={18} />,
        color: colors.success,
        iconBg: colors.successLight,
      },
      {
        key: 'outstanding',
        label: 'Outstanding (this page)',
        value: formatMoney(totalOutstanding),
        icon: <Clock size={18} />,
        color: colors.warning,
        iconBg: colors.warningLight,
      },
      {
        key: 'overdue',
        label: 'Overdue (this page)',
        value: overdueCount,
        icon: <AlertTriangle size={18} />,
        color: colors.error,
        iconBg: colors.errorLight,
      },
    ]
  }, [invoices, paginationMeta.total])

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const handleExportCsv = () => {
    if (invoices.length === 0) {
      toast.info('No invoice data to export.')
      return
    }

    const headers = [
      'Invoice Number',
      'Student Name',
      'Admission Number',
      'Roll Number',
      'Class',
      'Section',
      'Academic Year',
      'Billing Period',
      'Issue Date (BS)',
      'Issue Date (AD)',
      'Due Date (BS)',
      'Due Date (AD)',
      'Subtotal',
      'Discounts',
      'Scholarships',
      'Total Payable',
      'Paid Amount',
      'Outstanding Amount',
      'Status',
    ]

    const rows = invoices.map((inv) => [
      inv.invoiceNumber,
      inv.student?.name || '',
      inv.student?.admissionNumber || '',
      inv.student?.rollNumber || '',
      inv.class?.name || '',
      inv.section?.name || '',
      inv.academicYear?.name || '',
      inv.billingPeriod,
      inv.issueDateBS,
      inv.issueDate,
      inv.dueDateBS,
      inv.dueDate,
      inv.subtotal,
      inv.discountTotal,
      inv.scholarshipTotal,
      inv.totalPayable,
      inv.paidAmount,
      inv.outstandingAmount,
      inv.status,
    ])

    const exported = exportCsv('invoices_export', headers, rows)
    if (exported) {
      toast.success('Invoices exported successfully.')
    }
  }

  // ── Smart Filter Columns ───────────────────────────────────────────────────
  const filterColumns: SmartColumn[] = useMemo(() => {
    return [
      {
        key: 'search',
        title: 'Invoice / Student / Period',
        isSearchable: true,
      },
      {
        key: 'status',
        title: 'Status',
        isFilterable: true,
        filterWidth: 150,
        filterOptions: [
          { label: 'All Statuses', value: '' },
          { label: 'Unpaid', value: 'UNPAID' },
          { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
          { label: 'Paid', value: 'PAID' },
          { label: 'Overdue', value: 'OVERDUE' },
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ],
      },
      {
        key: 'academicYearId',
        title: 'Academic Year',
        isFilterable: true,
        filterWidth: 170,
        filterOptions: [
          { label: 'All Academic Years', value: '' },
          ...academicYears.map((y: any) => ({
            label: y.name,
            value: y.id,
          })),
        ],
      },
      {
        key: 'classId',
        title: 'Class',
        isFilterable: true,
        filterWidth: 140,
        filterOptions: [
          { label: 'All Classes', value: '' },
          ...classes.map((c: any) => ({
            label: c.name,
            value: c.id,
          })),
        ],
      },
      {
        key: 'sectionId',
        title: 'Section',
        isFilterable: true,
        filterWidth: 140,
        filterOptions: [
          { label: 'All Sections', value: '' },
          ...sections.map((s: any) => ({
            label: s.name,
            value: s.id,
          })),
        ],
      },
    ]
  }, [academicYears, classes, sections])

  // Filter change handler
  const handleFilterChange = (key: string, value: string | undefined) => {
    setPage(1)
    if (key === 'status') setStatus(value || '')
    if (key === 'academicYearId') setAcademicYearId(value || '')
    if (key === 'classId') {
      setClassId(value || '')
      setSectionId('')
    }
    if (key === 'sectionId') setSectionId(value || '')
  }

  // ── Table Columns ──────────────────────────────────────────────────────────
  const columns: ColumnsType<Invoice> = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      sorter: true,
      render: (num: string, record: Invoice) => (
        <Space size={8}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: colors.surfaceAlt,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.primary,
            }}
          >
            <Receipt size={14} />
          </div>
          <div>
            <span
              onClick={(e) => {
                e.stopPropagation()
                handleViewInvoice(record)
              }}
              style={{
                fontWeight: 600,
                color: colors.primary,
                cursor: 'pointer',
              }}
            >
              {num}
            </span>
            <div style={{ fontSize: 11, color: colors.muted }}>
              {record.academicYear?.name}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Student',
      key: 'student',
      render: (_: unknown, record: Invoice) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar
            size={32}
            style={{
              backgroundColor: colors.primaryLight,
              color: colors.primary,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {record.student?.name?.charAt(0) || 'S'}
          </Avatar>
          <div>
            <a href={`/accounts/fee-profiles/${record.student?.id}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); navigate(`/accounts/fee-profiles/${record.student?.id}`) }} style={{ fontWeight: 600, color: colors.primary }}>{record.student?.name}</a>
            <div style={{ fontSize: 11, color: colors.muted }}>
              {record.student?.admissionNumber ? `Adm: ${record.student.admissionNumber}` : ''}
              {record.student?.rollNumber ? ` • Roll: ${record.student.rollNumber}` : ''}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Class / Sec',
      key: 'classSection',
      render: (_: unknown, record: Invoice) => (
        <Space size={4}>
          <Tag style={{ borderRadius: 4, margin: 0 }}>{record.class?.name || '—'}</Tag>
          {record.section && (
            <Tag color="cyan" style={{ borderRadius: 4, margin: 0 }}>
              {record.section.name}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Period',
      dataIndex: 'billingPeriod',
      key: 'billingPeriod',
      render: (period: string) => (
        <Tag color="blue" style={{ borderRadius: 4, margin: 0 }}>
          {period}
        </Tag>
      ),
    },
    {
      title: 'Issue Date',
      key: 'issueDate',
      sorter: true,
      render: (_: unknown, record: Invoice) => (
        <Tooltip title={`AD: ${record.issueDate}`}>
          <Space size={4} style={{ fontSize: 13 }}>
            <Calendar size={13} color={colors.muted} />
            <span>{record.issueDateBS} BS</span>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Due Date',
      key: 'dueDate',
      sorter: true,
      render: (_: unknown, record: Invoice) => {
        const isOverdue = record.status === 'OVERDUE'
        return (
          <Tooltip title={`AD: ${record.dueDate}`}>
            <span
              style={{
                fontSize: 13,
                fontWeight: isOverdue ? 600 : 400,
                color: isOverdue ? colors.error : colors.secondaryText,
              }}
            >
              {record.dueDateBS} BS
            </span>
          </Tooltip>
        )
      },
    },
    {
      title: 'Total Payable',
      dataIndex: 'totalPayable',
      key: 'totalPayable',
      sorter: true,
      align: 'right' as const,
      render: (val: string | number) => (
        <span style={{ fontWeight: 700, color: colors.text, fontSize: 13 }}>
          {formatMoney(val)}
        </span>
      ),
    },
    {
      title: 'Paid / Due',
      key: 'paidDue',
      align: 'right' as const,
      render: (_: unknown, record: Invoice) => {
        const paid = parseFloat(String(record.paidAmount || 0))
        const due = parseFloat(String(record.outstandingAmount || 0))
        return (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: colors.success, fontWeight: 500 }}>
              Paid: {formatMoney(paid)}
            </div>
            {due > 0 ? (
              <div style={{ fontSize: 12, color: colors.error, fontWeight: 600 }}>
                Due: {formatMoney(due)}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: colors.muted }}>Fully cleared</div>
            )}
          </div>
        )
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (stat: string) => <InvoiceStatusTag status={stat} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: unknown, record: Invoice) => {
        const eligibleForCancel = canDelete && canCancelInvoice(record)

        const menuItems = [
          {
            key: 'view',
            label: 'View invoice',
            icon: <Eye size={14} />,
            onClick: () => handleViewInvoice(record),
          },
          {
            key: 'print-modal',
            label: 'Print invoice',
            icon: <Printer size={14} />,
            onClick: () => setPrintModalInvoice(record),
          },
          { type: 'divider' as const },
          {
            key: 'download',
            label: 'Download PDF',
            icon: <Download size={14} />,
            disabled: downloadingId === record.id,
            onClick: () => handleDownloadInvoice(record),
          },
          {
            key: 'generate-pdf',
            label: 'Regenerate PDF',
            icon: <FileText size={14} />,
            disabled: generatingId === record.id,
            onClick: () => handleGenerateInvoicePdf(record),
          },
          ...(eligibleForCancel
            ? [
                {
                  type: 'divider' as const,
                },
                {
                  key: 'cancel',
                  label: 'Cancel Invoice',
                  danger: true,
                  icon: <XCircle size={14} />,
                  onClick: () => setCancelModalInvoice(record),
                },
              ]
            : []),
        ]

        return (
          <Space onClick={(e) => e.stopPropagation()}>
            <Tooltip title="View invoice">
              <Button
                type="text"
                size="small"
                icon={<Eye size={15} color={colors.secondaryText} />}
                onClick={() => handleViewInvoice(record)}
              />
            </Tooltip>
            <Tooltip title="Download PDF">
              <Button
                type="text"
                size="small"
                loading={downloadingId === record.id}
                icon={<Download size={15} color={colors.secondaryText} />}
                onClick={() => handleDownloadInvoice(record)}
              />
            </Tooltip>
            <Tooltip title="Print invoice">
              <Button
                type="text"
                size="small"
                icon={<Printer size={15} color={colors.secondaryText} />}
                onClick={() => setPrintModalInvoice(record)}
              />
            </Tooltip>
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <Button
                type="text"
                size="small"
                icon={<MoreVertical size={15} color={colors.secondaryText} />}
              />
            </Dropdown>
          </Space>
        )
      },
    },
  ]

  // ── Table Pagination & Sorter Change ───────────────────────────────────────
  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, any>,
    sorter: SorterResult<Invoice> | SorterResult<Invoice>[],
  ) => {
    if (pagination.current && pagination.current !== page) {
      setPage(pagination.current)
    }
    if (pagination.pageSize && pagination.pageSize !== limit) {
      setLimit(pagination.pageSize)
      setPage(1)
    }

    if (!Array.isArray(sorter) && sorter.field) {
      const fieldMap: Record<string, string> = {
        invoiceNumber: 'invoiceNumber',
        issueDate: 'issueDate',
        dueDate: 'dueDate',
        totalPayable: 'totalPayable',
      }
      const mapped = fieldMap[sorter.field as string] || 'issueDate'
      setSortBy(mapped)
      setSortOrder(sorter.order === 'ascend' ? 'ASC' : 'DESC')
    }
  }

  return (
    <div>
      <PageHeader
        title="Student Invoices"
        description="Issue, track and reconcile student fee invoices and billing periods"
        actions={
          <Space>
            <Button
              icon={<Download size={15} />}
              onClick={handleExportCsv}
              disabled={invoices.length === 0}
            >
              Export CSV
            </Button>
            {canCreate && (
              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={() => setCreateModalOpen(true)}
                style={{
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                }}
              >
                Generate Invoice
              </Button>
            )}
          </Space>
        }
      />

      {/* KPI Cards */}
      <KpiRow items={kpis} loading={isLoading} />

      {/* Search and Filters */}
      <div style={{ marginBottom: 16 }}>
        <SearchAndFilter
          columns={filterColumns}
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val)
            setPage(1)
          }}
          searchPlaceholder="Search invoice #, student name, billing period..."
          filterValues={{
            status,
            academicYearId,
            classId,
            sectionId,
          }}
          onFilterChange={handleFilterChange}
          extra={
            (search || status || academicYearId || classId || sectionId) && (
              <Button
                type="link"
                size="small"
                onClick={() => {
                  setSearch('')
                  setStatus('')
                  setAcademicYearId('')
                  setClassId('')
                  setSectionId('')
                  setPage(1)
                }}
              >
                Reset filters
              </Button>
            )
          }
        />
      </div>

      {/* Invoices Table */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={9} />
      ) : (
        <AppTable<Invoice>
          rowKey="id"
          columns={columns}
          dataSource={invoices}
          pagination={{
            current: page,
            pageSize: limit,
            total: paginationMeta.total,
          }}
          onChange={handleTableChange}
            onRowClick={(record) => handleViewInvoice(record)}
          loading={isFetching}
        />
      )}

      {/* Modals & Drawers */}
      <CreateInvoiceDrawer
        open={createDrawerOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={(created) => {
          refetch()
          handleViewInvoice(created as Invoice)
        }}
      />


      <CancelInvoiceModal
        invoice={cancelModalInvoice}
        open={Boolean(cancelModalInvoice)}
        onClose={() => setCancelModalInvoice(null)}
        onSuccess={() => refetch()}
      />

      <InvoicePrintModal
        invoice={printModalInvoice}
        open={Boolean(printModalInvoice)}
        onClose={() => setPrintModalInvoice(null)}
      />
    </div>
  )
}
