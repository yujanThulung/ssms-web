import { useState, useCallback, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Button, Space, Skeleton, Alert, message, Spin, Typography, Card, Dropdown, Row, Col } from 'antd'
import { Download, Printer, RefreshCw, Eye, ChevronDown } from 'lucide-react'
import { colors } from '../../../lib/designTokens'
import { formatMoney } from '../../../features/fee-structures'
import { PageHeader } from '../../../components/common/PageHeader'
import {
  usePayment,
  useDownloadReceipt,
  useRegenerateReceipt,
  useReceiptPdf,
  fetchReceiptPdfBlob,
  printPdfBlob,
  printReceipt,
} from '../../../features/payments'
import schoolLogo from '../../../assets/logo.png'
import { PaymentMethodTag } from './components/PaymentMethodTag'

const { Text } = Typography

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const backToList = () => navigate((location.state as { from?: string } | null)?.from || '/accounts/payments')
  const [isPrinting, setIsPrinting] = useState(false)

  const { data: payment, isLoading, isError } = usePayment(id)
  const { mutateAsync: downloadReceipt, isPending: isDownloading } = useDownloadReceipt()
  const { mutateAsync: regenerateReceipt, isPending: isRegenerating } = useRegenerateReceipt()

  // Official backend PDF
  const {
    data: pdfBlob,
    error: pdfError,
    refetch: refetchPdf,
  } = useReceiptPdf(id)

  const pdfUrl = useMemo(
    () => (pdfBlob ? window.URL.createObjectURL(pdfBlob) : null),
    [pdfBlob],
  )

  // Free the object URL when it is replaced or on unmount (external cleanup only)
  useEffect(() => {
    return () => {
      if (pdfUrl) window.URL.revokeObjectURL(pdfUrl)
    }
  }, [pdfUrl])

  const handleDownload = async () => {
    if (!payment) return
    try {
      await downloadReceipt({ paymentId: payment.id, paymentNumber: payment.paymentNumber })
      message.success('Receipt downloaded successfully')
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to download receipt')
    }
  }

  const handleRegenerate = async () => {
    if (!payment) return
    try {
      await regenerateReceipt(payment.id)
      message.success('Receipt PDF regenerated and uploaded to cloud')
      refetchPdf()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to regenerate receipt')
    }
  }

  const handlePrint = useCallback(async () => {
    if (!payment) return
    setIsPrinting(true)
    try {
      // Print the backend-generated PDF for consistency
      const blob = pdfBlob ?? (await fetchReceiptPdfBlob(payment.id))
      await printPdfBlob(blob)
    } catch {
      // Fallback to the client-side receipt layout
      try {
        await printReceipt(payment, schoolLogo)
      } catch {
        message.error('Failed to print receipt')
      }
    } finally {
      setIsPrinting(false)
    }
  }, [payment, pdfBlob])

  if (isLoading) {
    return (
      <div style={{ padding: 32 }}>
        <Skeleton active paragraph={{ rows: 16 }} />
      </div>
    )
  }

  if (isError || !payment) {
    return (
      <div style={{ padding: 32 }}>
        <Alert
          type="error"
          message="Payment not found"
          description="The payment you are looking for does not exist or you don't have permission to view it."
          showIcon
          action={
            <Button onClick={() => backToList()}>Back to Payments</Button>
          }
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title={<Space>{payment.paymentNumber}<PaymentMethodTag method={payment.paymentMethod} /></Space>}
        description="Payment receipt and allocation details"
        actions={<Space wrap>
          <Button
            icon={<Download size={15} />}
            onClick={handleDownload}
            loading={isDownloading}
          >
            Download Receipt
          </Button>
          <Button
            type="primary"
            icon={<Printer size={15} />}
            onClick={handlePrint}
            loading={isPrinting}
            style={{ backgroundColor: colors.primary }}
          >
            Print Receipt
          </Button>
          <Dropdown menu={{ items: [
            { key: 'regenerate', label: 'Regenerate PDF', icon: <RefreshCw size={14} />, onClick: handleRegenerate, disabled: isRegenerating },
            ...(payment.receiptPdfUrl ? [{ key: 'cloud', label: 'Open cloud PDF', icon: <Eye size={14} />, onClick: () => window.open(payment.receiptPdfUrl, '_blank', 'noopener,noreferrer') }] : []),
          ] }} trigger={['click']}><Button loading={isRegenerating}>More <ChevronDown size={14} /></Button></Dropdown>
        </Space>}
      />

      <Card style={{ margin: '0 24px 16px', borderRadius: 12, borderColor: colors.border }}>
        <Row gutter={[20, 16]}>
          <Col xs={12} md={6}><Text type="secondary">Amount paid</Text><div style={{ fontSize: 20, fontWeight: 700, color: colors.success }}>{formatMoney(payment.amount)}</div></Col>
          <Col xs={12} md={6}><Text type="secondary">Student</Text><div><Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/accounts/fee-profiles/${payment.student.id}`)}>{payment.student.name}</Button></div></Col>
          <Col xs={12} md={6}><Text type="secondary">Invoice</Text><div><Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/accounts/invoices/${payment.invoice.id}`)}>{payment.invoice.invoiceNumber}</Button></div></Col>
          <Col xs={12} md={6}><Text type="secondary">Payment date · Collected by</Text><div>{payment.paymentDateBS} BS · {payment.collectedBy?.name || '—'}</div></Col>
          <Col xs={12} md={6}><Text type="secondary">Outstanding after payment</Text><div style={{ fontWeight: 600 }}>{formatMoney(payment.invoiceOutstandingAfter)}</div></Col>
        </Row>
      </Card>

      {/* Receipt preview */}
      {pdfError ? (
        <div style={{ padding: 24 }}>
          <Alert message="Could not load the receipt PDF" description={pdfError.message} type="error" showIcon />
        </div>
      ) : !pdfUrl ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <Spin size="large" />
          <Text type="secondary">Preparing receipt PDF…</Text>
        </div>
      ) : (
        <iframe
          src={pdfUrl}
          title="Receipt Preview"
          style={{
            flex: 1,
            width: '100%',
            border: 'none',
            minHeight: 'calc(100vh - 65px)',
            backgroundColor: '#f5f5f5',
          }}
        />
      )}
    </div>
  )
}

