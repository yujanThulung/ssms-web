import { useRef, useEffect, useState } from 'react'
import { Drawer, Space, Button, Skeleton, Alert, message, Dropdown } from 'antd'
import {
  Printer,
  XCircle,
  Receipt,
  ExternalLink,
  Download,
  ChevronDown,
  Upload,
  Eye,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../../../lib/designTokens'
import { usePermission } from '../../../../context/PermissionContext'
import { FEATURES, ACTIONS } from '../../../../utils/permissions'
import {
  useInvoice,
  canCancelInvoice,
  useDownloadInvoicePdf,
  useGenerateInvoicePdf,
  generateInvoiceHtml,
} from '../../../../features/invoices'
import schoolLogo from '../../../../assets/logo.png'
import { InvoiceStatusTag } from './InvoiceStatusTag'
import { CancelInvoiceModal } from './CancelInvoiceModal'
import { InvoicePrintModal } from './InvoicePrintModal'

interface InvoiceDetailDrawerProps {
  invoiceId: string | null
  open: boolean
  onClose: () => void
  onInvoiceUpdated?: () => void
}

export function InvoiceDetailDrawer({
  invoiceId,
  open,
  onClose,
  onInvoiceUpdated,
}: InvoiceDetailDrawerProps) {
  const navigate = useNavigate()
  const { can } = usePermission()
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const { data: invoice, isLoading, refetch } = useInvoice(invoiceId || undefined, open)
  const { mutateAsync: downloadPdf, isPending: isDownloading } = useDownloadInvoicePdf()
  const { mutateAsync: generatePdf, isPending: isGenerating } = useGenerateInvoicePdf()

  const canCancel =
    (can(FEATURES.INVOICE, ACTIONS.DELETE) || can(FEATURES.INVOICE, ACTIONS.CANCEL)) &&
    canCancelInvoice(invoice)

  // Inject the invoice HTML into the iframe whenever invoice changes
  useEffect(() => {
    if (!invoice || !iframeRef.current) return
    const html = generateInvoiceHtml(invoice, schoolLogo)
    const doc = iframeRef.current.contentDocument
    if (doc) {
      doc.open()
      doc.write(html)
      doc.close()
    }
  }, [invoice])

  const handleDownloadPdf = async () => {
    if (!invoice) return
    try {
      await downloadPdf({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      })
      message.success('Invoice PDF downloaded successfully')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to download invoice PDF')
    }
  }

  const handleGeneratePdf = async () => {
    if (!invoice) return
    try {
      const result = await generatePdf(invoice.id)
      setGeneratedPdfUrl(result.pdfUrl)
      message.success({
        content: 'PDF generated and uploaded to Cloudinary successfully',
        duration: 3,
      })
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to generate and upload PDF')
    }
  }

  const handleViewCloudinaryPdf = () => {
    if (generatedPdfUrl) {
      window.open(generatedPdfUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <>
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
                  {invoice?.invoiceNumber || 'Invoice Details'}
                </span>
                {invoice && (
                  <span style={{ marginLeft: 8 }}>
                    <InvoiceStatusTag status={invoice.status} />
                  </span>
                )}
              </div>
            </Space>

            {invoice && (
              <Space>
                <Button
                  size="small"
                  icon={<ExternalLink size={13} />}
                  onClick={() => {
                    onClose()
                    navigate(`/accounts/invoices/${invoice.id}`)
                  }}
                >
                  Full Page
                </Button>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'download',
                        label: 'Download PDF',
                        icon: <Download size={13} />,
                        onClick: handleDownloadPdf,
                      },
                      {
                        key: 'generate',
                        label: 'Generate & Upload to Cloud',
                        icon: <Upload size={13} />,
                        onClick: handleGeneratePdf,
                      },
                      ...(generatedPdfUrl
                        ? [
                            {
                              key: 'view',
                              label: 'View Cloud PDF',
                              icon: <Eye size={13} />,
                              onClick: handleViewCloudinaryPdf,
                            },
                          ]
                        : []),
                      {
                        type: 'divider' as const,
                      },
                      {
                        key: 'print',
                        label: 'Print Invoice',
                        icon: <Printer size={13} />,
                        onClick: () => setPrintModalOpen(true),
                      },
                      ...(canCancel
                        ? [
                            {
                              type: 'divider' as const,
                            },
                            {
                              key: 'cancel',
                              label: 'Cancel Invoice',
                              icon: <XCircle size={13} />,
                              danger: true,
                              onClick: () => setCancelModalOpen(true),
                            },
                          ]
                        : []),
                    ],
                  }}
                  trigger={['click']}
                >
                  <Button size="small" loading={isDownloading || isGenerating}>
                    Actions <ChevronDown size={12} style={{ marginLeft: 4 }} />
                  </Button>
                </Dropdown>
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
            <span style={{ fontSize: 12, color: colors.muted }}>ID: {invoice?.id || '—'}</span>
            <Space>
              <Button onClick={onClose}>Close</Button>
              <Button
                icon={<Download size={14} />}
                onClick={handleDownloadPdf}
                loading={isDownloading}
              >
                Download PDF
              </Button>
              <Button
                type="primary"
                icon={<Printer size={15} />}
                onClick={() => setPrintModalOpen(true)}
                style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
              >
                Print Invoice
              </Button>
            </Space>
          </div>
        }
      >
        {isLoading ? (
          <div style={{ padding: 24 }}>
            <Skeleton active paragraph={{ rows: 14 }} />
          </div>
        ) : !invoice ? (
          <div style={{ padding: 24 }}>
            <Alert message="Invoice not found" type="error" showIcon />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            title="Invoice Preview"
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

      <CancelInvoiceModal
        invoice={invoice || null}
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onSuccess={() => {
          refetch()
          onInvoiceUpdated?.()
        }}
      />

      <InvoicePrintModal
        invoice={invoice || null}
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />
    </>
  )
}
