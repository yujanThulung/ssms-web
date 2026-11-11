import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Col, Empty, Row, Space, Table, Tag, Typography } from 'antd'
import { FilePlus2, Users, Wallet } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { formatMoney } from '../../features/fee-structures'
import { useInvoices, type Invoice } from '../../features/invoices'
import { usePayments, type PaymentListItem } from '../../features/payments'
import { colors } from '../../lib/designTokens'

const { Text } = Typography

export default function AccountsPage() {
  const navigate = useNavigate()
  const { data: invoiceData, isLoading: invoicesLoading } = useInvoices({ page: 1, limit: 5, sortBy: 'issueDate', sortOrder: 'DESC' })
  const { data: paymentData, isLoading: paymentsLoading } = usePayments({ page: 1, limit: 5, sortBy: 'paymentDate', sortOrder: 'DESC' })
  const invoices = useMemo(() => invoiceData?.data ?? [], [invoiceData])
  const payments = useMemo(() => paymentData?.data ?? [], [paymentData])

  const invoiceColumns = [
    { title: 'Invoice', dataIndex: 'invoiceNumber', key: 'invoiceNumber', render: (value: string, invoice: Invoice) => <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/accounts/invoices/${invoice.id}`)}>{value}</Button> },
    { title: 'Student', key: 'student', render: (_: unknown, invoice: Invoice) => invoice.student?.name || '—' },
    { title: 'Due', dataIndex: 'outstandingAmount', key: 'outstandingAmount', align: 'right' as const, render: (value: string) => formatMoney(value) },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag>{status.replaceAll('_', ' ')}</Tag> },
  ]
  const paymentColumns = [
    { title: 'Receipt', dataIndex: 'paymentNumber', key: 'paymentNumber', render: (value: string, payment: PaymentListItem) => <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/accounts/payments/${payment.id}`)}>{value}</Button> },
    { title: 'Student', key: 'student', render: (_: unknown, payment: PaymentListItem) => payment.student?.name || '—' },
    { title: 'Invoice', key: 'invoice', render: (_: unknown, payment: PaymentListItem) => payment.invoice?.invoiceNumber || '—' },
    { title: 'Paid', dataIndex: 'amount', key: 'amount', align: 'right' as const, render: (value: string) => formatMoney(value) },
  ]

  return (
    <div>
      <PageHeader title="Accounts" description="Review student invoices and payments." />
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}><Card><Button block size="large" icon={<FilePlus2 size={16} />} onClick={() => navigate('/accounts/invoices')}>New Invoice</Button></Card></Col>
        <Col xs={24} sm={8}><Card><Button block size="large" icon={<Wallet size={16} />} onClick={() => navigate('/accounts/payments')}>Pay Bill</Button></Card></Col>
        <Col xs={24} sm={8}><Card><Button block size="large" icon={<Users size={16} />} onClick={() => navigate('/accounts/fee-profiles')}>Student Accounts</Button></Card></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Recent invoices" extra={<Button type="link" onClick={() => navigate('/accounts/invoices')}>All invoices</Button>}>
            <Table<Invoice> rowKey="id" columns={invoiceColumns} dataSource={invoices} loading={invoicesLoading} pagination={false} locale={{ emptyText: <Empty description="No invoices yet" /> }} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Recent payments" extra={<Button type="link" onClick={() => navigate('/accounts/payments')}>All payments</Button>}>
            <Table<PaymentListItem> rowKey="id" columns={paymentColumns} dataSource={payments} loading={paymentsLoading} pagination={false} locale={{ emptyText: <Empty description="No payments yet" /> }} />
          </Card>
        </Col>
      </Row>
      <Space style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <Text type="secondary" style={{ fontSize: 12, color: colors.muted }}>Recent records show the latest five items.</Text>
      </Space>
    </div>
  )
}
