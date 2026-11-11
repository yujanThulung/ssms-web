import { useCallback, useEffect, useMemo, useState } from 'react'
import { Drawer, Space, Button, Skeleton, Alert, message, Spin, Typography } from 'antd'
import {
  Receipt,
  Download,
  RefreshCw,
  Printer,
  ExternalLink,
  Eye,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../../../lib/designTokens'
import {
  usePayment,
  useDownloadReceipt,
  useRegenerateReceipt,
  useReceiptPdf,
  fetchReceiptPdfBlob,
  printPdfBlob,
  printReceipt,
} from '../../../../features/payments'
import schoolLogo from '../../../../assets/logo.png'
import { PaymentMethodTag } from './PaymentMethodTag'

const { Text } = Typography

interface PaymentDetailDrawerProps {
  paymentId: string | null
  open: boolean
  onClose: () => void
}

export function PaymentDetailDrawer({ paymentId, open, onClose }: PaymentDetailDrawerProps) {
  const navigate = useNavigate()
  const [isPrinting, setIsPrinting] = useState(false)

  const { data: payment, isLoading } = usePayment(paymentId || undefined, open)
  const { mutateAsync: downloadReceipt, isPending: isDownloading } = useDownloadReceipt()
  const { mutateAsync: regenerateReceipt, isPending: isRegenerating } = useRegenerateReceipt()

  // Official backend PDF
  const {
    data: pdfBlob,
    error: pdfError,
    refetch: refetchPdf,
  } = useReceiptPdf(paymentId || undefined, open)

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
      message.success('Receipt PDF regenerated successfully')
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

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Space align="center" size={10}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: colors.primaryLight,
                color: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Receipt size={18} />
            </div>
            <div>
              <span style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>
                {payment?.paymentNumber || 'Payment Receipt'}
              </span>
              {payment && (
                <span style={{ marginLeft: 8 }}>
                  <PaymentMethodTag method={payment.paymentMethod} />
                </span>
              )}
            </div>
          </Space>

          {payment && (
            <Space>
              <Button
                size="small"
                icon={<ExternalLink size={13} />}
                onClick={() => {
                  onClose()
                  navigate(`/accounts/payments/${payment.id}`)
                }}
              >
                Full Page
              </Button>
              <Button
                size="small"
                icon={<RefreshCw size={13} />}
                onClick={handleRegenerate}
                loading={isRegenerating}
              >
                Regenerate
              </Button>
              {payment.receiptPdfUrl && (
                <Button
                  size="small"
                  icon={<Eye size={13} />}
                  onClick={() =>
                    window.open(payment.receiptPdfUrl, '_blank', 'noopener,noreferrer')
                  }
                >
                  Cloud PDF
                </Button>
              )}
            </Space>
          )}
        </div>
      }
      open={open}
      onClose={onClose}
      width={820}
      destroyOnClose
      styles={{ body: { padding: 0, backgroundColor: '#f5f5f5' } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: colors.muted }}>ID: {payment?.id || '—'}</span>
          <Space>
            <Button onClick={onClose}>Close</Button>
            <Button icon={<Download size={14} />} onClick={handleDownload} loading={isDownloading}>
              Download Receipt
            </Button>
            <Button
              type="primary"
              icon={<Printer size={15} />}
              onClick={handlePrint}
              loading={isPrinting}
              style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
            >
              Print Receipt
            </Button>
          </Space>
        </div>
      }
    >
      {isLoading ? (
        <div style={{ padding: 24 }}>
          <Skeleton active paragraph={{ rows: 14 }} />
        </div>
      ) : !payment ? (
        <div style={{ padding: 24 }}>
          <Alert message="Payment not found" type="error" showIcon />
        </div>
      ) : pdfError ? (
        <div style={{ padding: 24 }}>
          <Alert
            message="Could not load the receipt PDF"
            description={pdfError.message}
            type="error"
            showIcon
          />
        </div>
      ) : !pdfUrl ? (
        <div
          style={{
            padding: '120px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
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
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            minHeight: 'calc(100vh - 110px)',
          }}
        />
      )}
    </Drawer>
  )
}
