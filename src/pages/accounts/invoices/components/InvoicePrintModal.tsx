import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal, Button, Space, Typography, message } from 'antd'
import { Printer, Download } from 'lucide-react'
import schoolLogo from '../../../../assets/logo.png'
import { colors } from '../../../../lib/designTokens'
import {
  useDownloadInvoicePdf,
  printInvoice,
  type Invoice,
  type InvoiceAdjustment,
} from '../../../../features/invoices'

const { Text } = Typography

interface InvoicePrintModalProps {
  invoice: Invoice | null
  open: boolean
  onClose: () => void
  autoPrint?: boolean
}

export function InvoicePrintModal({
  invoice,
  open,
  onClose,
  autoPrint = true,
}: InvoicePrintModalProps) {
  const [isPrinting, setIsPrinting] = useState(false)
  const hasAutoPrintedRef = useRef(false)
  const { mutateAsync: downloadPdf, isPending: isDownloading } = useDownloadInvoicePdf()

  const handlePrint = useCallback(async () => {
    if (!invoice) return
    setIsPrinting(true)
    try {
      // Always print from backend-generated PDF for consistency
      const client = (await import('../../../../lib/api/client')).default
      const { ENDPOINTS } = await import('../../../../lib/api/endpoints')
      const response = await client.get(ENDPOINTS.INVOICES.PDF(invoice.id), {
        responseType: 'blob',
        params: { print: 'true', inline: 'true' },
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = 'none'
      document.body.appendChild(iframe)
      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
        } catch {
          // ignore
        }
        setTimeout(() => {
          document.body.removeChild(iframe)
          window.URL.revokeObjectURL(url)
        }, 1000)
      }
      iframe.src = url
    } catch (err: unknown) {
      try {
        await printInvoice(invoice, schoolLogo)
      } catch {
        message.error(err instanceof Error ? err.message : 'Failed to open print dialog')
      }
    } finally {
      setIsPrinting(false)
    }
  }, [invoice])

  useEffect(() => {
    if (open && invoice && autoPrint && !hasAutoPrintedRef.current) {
      hasAutoPrintedRef.current = true
      const timer = setTimeout(() => {
        handlePrint()
      }, 400)
      return () => clearTimeout(timer)
    }
    if (!open) {
      hasAutoPrintedRef.current = false
    }
  }, [open, invoice, autoPrint, handlePrint])

  const handleDownloadPdf = async () => {
    if (!invoice) return
    try {
      await downloadPdf({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        pdfUrl: invoice.pdfUrl,
      })
      message.success('Invoice PDF downloaded successfully')
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed to download invoice PDF')
    }
  }

  if (!invoice) return null

  const isCancelled = invoice.status === 'CANCELLED'
  const lines = invoice.lines || []

  const subtotal = parseFloat(String(invoice.subtotal || 0)).toFixed(2)
  const discountTotal = parseFloat(String(invoice.discountTotal || 0))
  const scholarshipTotal = parseFloat(String(invoice.scholarshipTotal || 0))
  const fineAmount = parseFloat(String(invoice.fineAmount || 0))
  const previousBalance = parseFloat(String(invoice.previousBalance || 0))
  const totalPayable = parseFloat(String(invoice.totalPayable || 0)).toFixed(2)
  const paidAmount = parseFloat(String(invoice.paidAmount || 0))
  const outstandingAmount = parseFloat(String(invoice.outstandingAmount || 0))

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={860}
      destroyOnClose
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Printer size={18} color={colors.primary} />
          <span style={{ fontWeight: 600 }}>Print Invoice</span>
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Official fee invoice format aligned with system PDF generator
          </Text>
          <Space>
            <Button onClick={onClose}>Close</Button>
            <Button
              icon={<Download size={15} />}
              onClick={handleDownloadPdf}
              loading={isDownloading}
            >
              Download PDF
            </Button>
            <Button
              type="primary"
              icon={<Printer size={15} />}
              onClick={handlePrint}
              loading={isPrinting}
              style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
            >
              Print
            </Button>
          </Space>
        </div>
      }
    >
      <style>{`
        .modal-invoice-preview {
          background-color: #f3f4f6;
          padding: 16px;
          border-radius: 8px;
          max-height: calc(85vh - 140px);
          overflow-y: auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 11px;
          line-height: 1.4;
          color: #111827;
        }

        .preview-container {
          max-width: 780px;
          margin: 0 auto;
          border: 1.5px solid #111827;
          padding: 24px;
          position: relative;
          background: #ffffff;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .preview-watermark {
          position: absolute;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 72px;
          font-weight: 900;
          color: rgba(220, 38, 38, 0.15);
          border: 5px solid rgba(220, 38, 38, 0.15);
          padding: 10px 40px;
          border-radius: 12px;
          pointer-events: none;
          z-index: 10;
          letter-spacing: 6px;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #111827;
          padding-bottom: 14px;
          margin-bottom: 14px;
        }

        .preview-header-left {
          width: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-school-emblem {
          width: 68px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-school-emblem img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        .preview-header-center {
          flex: 1;
          text-align: center;
          padding: 0 10px;
        }

        .preview-header-center h1 {
          font-size: 19px;
          font-weight: 800;
          color: #111827;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .preview-header-center .subtitle {
          font-size: 11px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 3px;
        }

        .preview-header-center .address {
          font-size: 10px;
          color: #4b5563;
          margin: 1px 0;
        }

        .preview-header-right {
          width: 120px;
          text-align: right;
        }

        .preview-status-badge {
          display: inline-block;
          padding: 4px 10px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid #111827;
          border-radius: 4px;
        }

        .status-UNPAID {
          background: #fef3c7;
          color: #92400e;
          border-color: #d97706;
        }

        .status-PAID {
          background: #dcfce7;
          color: #166534;
          border-color: #16a34a;
        }

        .status-PARTIALLY_PAID {
          background: #e0e7ff;
          color: #3730a3;
          border-color: #4f46e5;
        }

        .status-OVERDUE {
          background: #fee2e2;
          color: #991b1b;
          border-color: #dc2626;
        }

        .status-CANCELLED {
          background: #f3f4f6;
          color: #b91c1c;
          border-color: #b91c1c;
        }

        .preview-invoice-title {
          text-align: center;
          margin: 10px 0;
          padding: 6px 0;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .preview-invoice-title h2 {
          font-size: 14px;
          color: #111827;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: 700;
          margin: 0;
        }

        .preview-cancellation-notice {
          background: #fef2f2;
          border: 1.5px solid #dc2626;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 14px;
          color: #991b1b;
          font-size: 11px;
        }

        .preview-info-section {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px 14px;
        }

        .preview-info-box {
          flex: 1;
        }

        .preview-info-box.right {
          text-align: right;
        }

        .preview-info-box-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 5px;
          letter-spacing: 0.5px;
        }

        .preview-info-row {
          margin-bottom: 3px;
          font-size: 11px;
          color: #374151;
        }

        .preview-items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 14px 0;
          border: 1px solid #111827;
        }

        .preview-items-table th {
          background-color: #f3f4f6;
          color: #111827;
          padding: 7px 6px;
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 700;
          border: 1px solid #111827;
          letter-spacing: 0.3px;
        }

        .preview-items-table td {
          padding: 6px;
          border: 1px solid #111827;
          font-size: 10.5px;
          vertical-align: top;
        }

        .preview-adjustments {
          margin-top: 4px;
          padding-left: 8px;
          font-size: 9.5px;
          color: #4b5563;
          border-left: 2px solid #9ca3af;
        }

        .preview-bottom-section {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-top: 10px;
        }

        .preview-notes-box {
          flex: 1;
          border: 1px solid #e5e7eb;
          background: #fefce8;
          border-radius: 6px;
          padding: 10px;
          font-size: 10.5px;
        }

        .preview-notes-box h4 {
          font-size: 11px;
          font-weight: 700;
          color: #854d0e;
          margin-bottom: 4px;
        }

        .preview-totals-box {
          width: 290px;
          border: 1px solid #111827;
          padding: 10px 12px;
          background: #fafafa;
        }

        .preview-total-row {
          display: flex;
          justify-content: space-between;
          padding: 3.5px 0;
          font-size: 11px;
          color: #374151;
          border-bottom: 1px dotted #d1d5db;
        }

        .preview-total-row:last-child {
          border-bottom: none;
        }

        .preview-total-row.grand-total {
          font-weight: 800;
          font-size: 13px;
          color: #111827;
          border-top: 1.5px solid #111827;
          border-bottom: 1.5px solid #111827;
          margin-top: 6px;
          padding: 6px 0;
          background: #f3f4f6;
        }

        .preview-signatures-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 36px;
          padding-top: 12px;
          font-size: 10px;
          color: #4b5563;
          text-align: center;
        }

        .preview-sig-col {
          width: 35%;
        }

        .preview-sig-line {
          border-top: 1px dashed #6b7280;
          padding-top: 6px;
          margin-bottom: 2px;
          font-weight: 600;
          color: #111827;
        }

        .preview-footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 9px;
          color: #6b7280;
        }
      `}</style>

      <div className="modal-invoice-preview">
        <div className="preview-container">
          {isCancelled && <div className="preview-watermark">CANCELLED</div>}

          {/* Header */}
          <div className="preview-header">
            <div className="preview-header-left">
              <div className="preview-school-emblem">
                <img src={schoolLogo} alt="School Logo" />
              </div>
            </div>
            <div className="preview-header-center">
              <h1>Salyansthan Secondary School</h1>
              <div className="subtitle">Student Billing & Accounts Department</div>
              <p className="address">Kirtipur Municipality, Kathmandu District, Bagmati Province, Nepal - 44600</p>
              <p className="address">Phone: +977 1-5904264 | Email: info@salyansthanschool.edu.np</p>
            </div>
            <div className="preview-header-right">
              <div className={`preview-status-badge status-${invoice.status}`}>
                {invoice.status}
              </div>
              <div style={{ fontSize: 10, marginTop: 6, color: '#000000', fontWeight: 600 }}>
                # {invoice.invoiceNumber}
              </div>
              <div style={{ fontSize: 9, marginTop: 2, color: '#000000' }}>
                By: {invoice.generatedBy?.name || 'System'}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="preview-invoice-title">
            <h2>Fee Invoice</h2>
          </div>

          {/* Cancellation Notice */}
          {isCancelled && (
            <div className="preview-cancellation-notice">
              <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 3 }}>
                ⚠️ NOTICE: This invoice has been CANCELLED.
              </div>
              {invoice.cancellationReason && (
                <div>
                  <strong>Cancellation Reason:</strong> {invoice.cancellationReason}
                </div>
              )}
              {invoice.cancelledAt && (
                <div>
                  <strong>Cancelled On:</strong> {new Date(invoice.cancelledAt).toLocaleString()}
                </div>
              )}
              {invoice.cancelledBy?.name && (
                <div>
                  <strong>Cancelled By:</strong> {invoice.cancelledBy.name}
                </div>
              )}
            </div>
          )}

          {/* Student & Invoice Meta */}
          <div className="preview-info-section">
            <div className="preview-info-box">
              <div className="preview-info-box-title">Student Information</div>
              <div className="preview-info-row" style={{ fontSize: 13, fontWeight: 'bold', color: '#111827' }}>
                {invoice.student?.name || '—'}
              </div>
              <div className="preview-info-row">
                <span>Admission No:</span> <strong>{invoice.student?.admissionNumber || '—'}</strong>
                {invoice.student?.rollNumber && (
                  <> | <span>Roll No:</span> <strong>{invoice.student.rollNumber}</strong></>
                )}
              </div>
              <div className="preview-info-row">
                <span>Class:</span> <strong>{invoice.class?.name || '—'}</strong>
                {invoice.section && (
                  <> - <strong>{invoice.section.name}</strong></>
                )}
              </div>
            </div>

            <div className="preview-info-box right">
              <div className="preview-info-box-title">Billing & Session Information</div>
              <div className="preview-info-row">
                <span>Academic Year:</span> <strong>{invoice.academicYear?.name || '—'}</strong>
              </div>
              <div className="preview-info-row">
                <span>Billing Period:</span> <strong>{invoice.billingPeriod}</strong>
              </div>
              <div className="preview-info-row">
                <span>Issue Date:</span> <strong>{invoice.issueDateBS} BS</strong>{' '}
                <small style={{ color: '#6b7280' }}>({invoice.issueDate})</small>
              </div>
              <div className="preview-info-row">
                <span>Due Date:</span>{' '}
                <strong style={{ color: '#b91c1c' }}>{invoice.dueDateBS} BS</strong>{' '}
                <small style={{ color: '#6b7280' }}>({invoice.dueDate})</small>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="preview-items-table">
            <thead>
              <tr>
                <th style={{ width: '5%', textAlign: 'center' }}>#</th>
                <th style={{ width: '37%', textAlign: 'left' }}>Fee Particulars</th>
                <th style={{ width: '12%', textAlign: 'center' }}>Frequency</th>
                <th style={{ width: '14%', textAlign: 'right' }}>Amount</th>
                <th style={{ width: '11%', textAlign: 'right' }}>Discount</th>
                <th style={{ width: '11%', textAlign: 'right' }}>Scholarship</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Net Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.length > 0 ? (
                lines.map((line, index) => {
                  const origAmt = parseFloat(String(line.originalAmount || 0)).toFixed(2)
                  const discAmt = parseFloat(String(line.discountAmount || 0))
                  const scholAmt = parseFloat(String(line.scholarshipAmount || 0))
                  const netAmt = parseFloat(String(line.lineTotal || 0)).toFixed(2)
                  const adjustments = (line.adjustments || []) as InvoiceAdjustment[]

                  return (
                    <tr key={line.id || index}>
                      <td style={{ textAlign: 'center', color: '#6b7280' }}>{index + 1}</td>
                      <td>
                        <strong>{line.feeCategory?.name || 'Fee Item'}</strong>
                        {line.feeCategory?.code && (
                          <small style={{ color: '#6b7280' }}> ({line.feeCategory.code})</small>
                        )}
                        {line.remarks && (
                          <div>
                            <small style={{ color: '#6b7280', fontStyle: 'italic' }}>
                              {line.remarks}
                            </small>
                          </div>
                        )}
                        {adjustments.length > 0 && (
                          <div className="preview-adjustments">
                            {adjustments.map((adj, adjIdx) => (
                              <div key={adjIdx}>
                                {adj.adjustmentType}: {adj.programName} (
                                {adj.programValueType === 'PERCENTAGE'
                                  ? `${adj.programValue}%`
                                  : `Rs. ${adj.programValue}`}
                                ) - Rs. {parseFloat(String(adj.appliedAmount || 0)).toFixed(2)}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>{line.frequency || '—'}</td>
                      <td style={{ textAlign: 'right' }}>Rs. {origAmt}</td>
                      <td style={{ textAlign: 'right', color: '#000000' }}>
                        {discAmt > 0 ? `- Rs. ${discAmt.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ textAlign: 'right', color: '#000000' }}>
                        {scholAmt > 0 ? `- Rs. ${scholAmt.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>Rs. {netAmt}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 16, color: '#6b7280' }}>
                    No fee line items available
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Bottom Section: Notes & Totals */}
          <div className="preview-bottom-section">
            <div style={{ flex: 1 }}>
              {invoice.notes && (
                <div className="preview-notes-box">
                  <h4>Billing Notes:</h4>
                  <p style={{ margin: 0 }}>{invoice.notes}</p>
                </div>
              )}
            </div>

            <div className="preview-totals-box">
              <div className="preview-total-row">
                <span>Subtotal:</span>
                <span>Rs. {subtotal}</span>
              </div>
              {discountTotal > 0 && (
                <div className="preview-total-row">
                  <span>Discounts:</span>
                  <span style={{ color: '#000000' }}>- Rs. {discountTotal.toFixed(2)}</span>
                </div>
              )}
              {scholarshipTotal > 0 && (
                <div className="preview-total-row">
                  <span>Scholarships:</span>
                  <span style={{ color: '#000000' }}>- Rs. {scholarshipTotal.toFixed(2)}</span>
                </div>
              )}
              {fineAmount > 0 && (
                <div className="preview-total-row">
                  <span>Fine / Late Fee:</span>
                  <span style={{ color: '#000000' }}>+ Rs. {fineAmount.toFixed(2)}</span>
                </div>
              )}
              {previousBalance !== 0 && (
                <div className="preview-total-row">
                  <span>Previous Balance:</span>
                  <span>
                    {previousBalance > 0 ? '+' : ''} Rs. {previousBalance.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="preview-total-row grand-total">
                <span>Total Payable:</span>
                <span>Rs. {totalPayable}</span>
              </div>
              {paidAmount > 0 && (
                <>
                  <div className="preview-total-row" style={{ color: '#000000', fontWeight: 600 }}>
                    <span>Paid Amount:</span>
                    <span>Rs. {paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="preview-total-row" style={{ color: '#000000', fontWeight: 700 }}>
                    <span>Outstanding Balance:</span>
                    <span>Rs. {outstandingAmount.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Signatures */}
          <div className="preview-signatures-section">
            <div className="preview-sig-col">
              <div className="preview-sig-line">Accountant / Cashier</div>
              <div>Authorized Signatory</div>
            </div>
          </div>

          {/* Footer */}
          <div className="preview-footer">
            <p style={{ margin: 0 }}>
              Generated by: {invoice.generatedBy?.name || 'System'} | {new Date().toLocaleString()}
            </p>
            <p style={{ margin: '3px 0 0 0' }}>For inquiries, contact School Administration Office.</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
