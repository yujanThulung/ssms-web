import type { Payment } from '../types'
import client from '../../../lib/api/client'
import { ENDPOINTS } from '../../../lib/api/endpoints'

/**
 * Fetch the official receipt PDF from the backend as a Blob.
 * The endpoint serves the stored Cloudinary PDF or generates one on-the-fly.
 */
export async function fetchReceiptPdfBlob(paymentId: string): Promise<Blob> {
  const response = await client.get(ENDPOINTS.PAYMENTS.RECEIPT(paymentId), {
    responseType: 'blob',
    params: { inline: 'true' },
  })

  const data = response.data as Blob
  // Error responses arrive as JSON blobs — surface their message
  if (data && data.type === 'application/json') {
    const text = await data.text()
    let msg = 'Failed to load receipt PDF'
    try {
      msg = (JSON.parse(text) as { message?: string }).message || msg
    } catch {
      // keep default message
    }
    throw new Error(msg)
  }

  return new Blob([data], { type: 'application/pdf' })
}

/**
 * Open the browser print dialog for a PDF blob using a hidden iframe.
 */
export function printPdfBlob(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const url = window.URL.createObjectURL(blob)
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;'
      document.body.appendChild(iframe)

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
        } catch {
          // ignore print invocation errors
        }
        setTimeout(() => {
          document.body.removeChild(iframe)
          window.URL.revokeObjectURL(url)
          resolve()
        }, 1000)
      }

      iframe.onerror = () => {
        document.body.removeChild(iframe)
        window.URL.revokeObjectURL(url)
        reject(new Error('Failed to render receipt PDF'))
      }

      iframe.src = url
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })
}

/**
 * Print the backend-generated receipt PDF, falling back to the
 * client-side HTML receipt if the PDF cannot be fetched.
 */
export async function printBackendReceipt(
  payment: Payment,
  logoUrl?: string,
): Promise<void> {
  try {
    const blob = await fetchReceiptPdfBlob(payment.id)
    await printPdfBlob(blob)
  } catch {
    await printReceipt(payment, logoUrl)
  }
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  DIGITAL_WALLET: 'Digital Wallet',
  OTHER: 'Other',
}

function fmt(amount: string | number): string {
  const num = parseFloat(String(amount || 0))
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function generateReceiptHtml(payment: Payment, logoUrl?: string): string {
  const logoMarkup = logoUrl
    ? `<img src="${logoUrl}" alt="School Logo" class="logo" />`
    : ''

  const outstanding = parseFloat(payment.invoiceOutstandingAfter)
  const outstandingLabel = outstanding <= 0
    ? '<span style="color:#16a34a;font-weight:700;">FULLY PAID ✓</span>'
    : `<strong style="color:#dc2626;">Rs. ${fmt(outstanding)}</strong>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt ${payment.paymentNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #000; padding: 20px; background: #fff; }
    .receipt { max-width: 800px; margin: 0 auto; border: 2px solid #000; padding: 24px; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; position: relative; min-height: 70px; }
    .logo { width: 60px; height: 60px; position: absolute; left: 0; top: 0; object-fit: contain; }
    .header h1 { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
    .header p { font-size: 11px; margin: 2px 0; }
    .header h2 { font-size: 16px; font-weight: bold; margin: 10px 0 0; letter-spacing: 1px; }
    .receipt-info { display: flex; justify-content: space-between; margin-bottom: 16px; padding: 10px 0; border-bottom: 1px solid #ccc; }
    .student-box { background: #f5f5f5; padding: 12px; margin-bottom: 16px; border-radius: 2px; }
    .student-box p { margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 9px 10px; text-align: left; border: 1px solid #000; }
    th { background: #f0f0f0; font-weight: bold; }
    td.label { font-weight: bold; width: 55%; }
    td.amount { text-align: right; }
    .shaded { background: #f5f5f5; }
    .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
    .signature-box { width: 45%; text-align: center; }
    .signature-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 5px; font-size: 11px; }
    .footer { margin-top: 24px; text-align: center; font-size: 11px; border-top: 1px solid #ccc; padding-top: 12px; }
    .watermark { text-align: center; font-size: 12px; font-weight: bold; color: #666; margin-top: 10px; }
    @media print {
      body { padding: 0; }
      .receipt { border: 2px solid #000; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      ${logoMarkup}
      <h1>Salyansthan Secondary School</h1>
      <p>Kirtipur Municipality, Kathmandu District</p>
      <p>Bagmati Province, Nepal &mdash; 44600 &nbsp;|&nbsp; Phone: +977 1-5904264</p>
      <h2>PAYMENT RECEIPT</h2>
    </div>

    <div class="receipt-info">
      <div><strong>Receipt No:</strong> ${payment.paymentNumber}</div>
      <div style="text-align:right;"><strong>Date:</strong> ${payment.paymentDate} &nbsp;(${payment.paymentDateBS} BS)</div>
    </div>

    <div class="student-box">
      <p><strong>Received from:</strong> ${payment.student.name}</p>
      ${payment.student.admissionNumber ? `<p><strong>Admission No:</strong> ${payment.student.admissionNumber}</p>` : ''}
      <p><strong>Academic Year:</strong> ${payment.academicYear.name}</p>
      <p><strong>Invoice No:</strong> ${payment.invoice.invoiceNumber}</p>
    </div>

    <table>
      <thead>
        <tr>
          <th class="label">Particulars</th>
          <th class="amount">Amount (NPR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="label">Payment Amount</td>
          <td class="amount"><strong>Rs. ${fmt(payment.amount)}</strong></td>
        </tr>
        <tr>
          <td class="label">Payment Method</td>
          <td>${METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod}</td>
        </tr>
        ${payment.reference ? `<tr><td class="label">Reference / Transaction ID</td><td>${payment.reference}</td></tr>` : ''}
        <tr class="shaded">
          <td class="label">Invoice Total Payable</td>
          <td class="amount">Rs. ${fmt(payment.invoiceTotalPayable)}</td>
        </tr>
        <tr>
          <td class="label">Previously Paid</td>
          <td class="amount">Rs. ${fmt(payment.invoicePaidBefore)}</td>
        </tr>
        <tr>
          <td class="label">Total Paid (after this payment)</td>
          <td class="amount">Rs. ${fmt(payment.invoicePaidAfter)}</td>
        </tr>
        <tr class="shaded">
          <td class="label"><strong>Outstanding Balance</strong></td>
          <td class="amount">${outstandingLabel}</td>
        </tr>
      </tbody>
    </table>

    ${payment.remarks ? `<div class="student-box" style="margin-bottom:20px;"><p><strong>Remarks:</strong> ${payment.remarks}</p></div>` : ''}

    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-line">
          <strong>Collected By</strong><br>
          ${payment.collectedBy.name}<br>
          ${new Date(payment.collectedAt).toLocaleString('en-US')}
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-line">
          <strong>Accountant / Cashier</strong><br>
          Signature
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>Thank you for your payment</strong></p>
      <p>For inquiries, contact School Administration Office.</p>
      <p style="font-size:10px;color:#666;margin-top:8px;">Generated: ${new Date().toLocaleString('en-US')}</p>
    </div>
  </div>
</body>
</html>`
}

export function printReceipt(payment: Payment, logoUrl?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const html = generateReceiptHtml(payment, logoUrl)
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0;'
      document.body.appendChild(iframe)

      const doc = iframe.contentDocument
      if (!doc) {
        document.body.removeChild(iframe)
        reject(new Error('Could not access iframe document'))
        return
      }

      doc.open()
      doc.write(html)
      doc.close()

      iframe.onload = () => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => {
          document.body.removeChild(iframe)
          resolve()
        }, 1000)
      }
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })
}
