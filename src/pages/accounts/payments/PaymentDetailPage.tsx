import { useState, useCallback, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Space, Skeleton, Alert, message, Spin, Typography } from 'antd'
import { ArrowLeft, Download, Printer, RefreshCw, Eye } from 'lucide-react'
import { colors } from '../../../lib/designTokens'
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
            <Button onClick={() => navigate('/accounts/payments')}>Back to Payments</Button>
          }
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          backgroundColor: '#fff',
          borderBottom: `1px solid ${colors.border}`,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Space size={12}>
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/accounts/payments')}
            type="text"
          >
            Back
          </Button>
          <div>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{payment.paymentNumber}</span>
            <span style={{ marginLeft: 10 }}>
              <PaymentMethodTag method={payment.paymentMethod} />
            </span>
          </div>
        </Space>

        <Space>
          <Button
            icon={<Download size={15} />}
            onClick={handleDownload}
            loading={isDownloading}
          >
            Download Receipt
          </Button>
          <Button
            icon={<RefreshCw size={13} />}
            onClick={handleRegenerate}
            loading={isRegenerating}
          >
            Regenerate PDF
          </Button>
          {payment.receiptPdfUrl && (
            <Button
              icon={<Eye size={13} />}
              onClick={() => window.open(payment.receiptPdfUrl, '_blank', 'noopener,noreferrer')}
            >
              Cloud PDF
            </Button>
          )}
          <Button
            type="primary"
            icon={<Printer size={15} />}
            onClick={handlePrint}
            loading={isPrinting}
            style={{ backgroundColor: colors.primary }}
          >
            Print Receipt
          </Button>
        </Space>
      </div>

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

