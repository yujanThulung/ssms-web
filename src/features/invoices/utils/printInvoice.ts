import type { Invoice, InvoiceAdjustment } from '../types'

/**
 * Generate standalone printable HTML matching the backend invoice template
 */
export function generateInvoiceHtml(invoice: Invoice, logoUrl?: string): string {
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

  const logoMarkup = logoUrl
    ? `<img src="${logoUrl}" alt="School Logo" />`
    : `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#111827" stroke-width="2"/>
        <text x="50" y="45" font-family="Arial" font-size="28" font-weight="bold" text-anchor="middle" fill="#111827">SSS</text>
        <text x="50" y="65" font-family="Arial" font-size="10" text-anchor="middle" fill="#111827">ESTD. 2024</text>
      </svg>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #111827;
      padding: 16px;
      background: #ffffff;
      position: relative;
    }

    .invoice-container {
      max-width: 780px;
      margin: 0 auto;
      border: 1.5px solid #111827;
      padding: 24px;
      position: relative;
      background: #ffffff;
    }

    ${isCancelled
      ? `
    .watermark {
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
    `
      : ''
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #111827;
      padding-bottom: 14px;
      margin-bottom: 14px;
    }

    .header-left {
      width: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-center {
      flex: 1;
      text-align: center;
      padding: 0 10px;
    }

    .header-right {
      width: 110px;
      text-align: right;
    }

    .school-emblem {
      width: 68px;
      height: 68px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .school-emblem img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    .header h1 {
      font-size: 19px;
      font-weight: 800;
      color: #111827;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .header .subtitle {
      font-size: 11px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 3px;
    }

    .header .address {
      font-size: 10px;
      color: #4b5563;
      margin: 1px 0;
    }

    .status-badge {
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

    .invoice-title {
      text-align: center;
      margin: 10px 0;
      padding: 6px 0;
      border-top: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .invoice-title h2 {
      font-size: 14px;
      color: #111827;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 700;
    }

    ${isCancelled
      ? `
    .cancellation-notice {
      background: #fef2f2;
      border: 1.5px solid #dc2626;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 14px;
      color: #991b1b;
      font-size: 11px;
    }

    .cancellation-notice strong {
      color: #7f1d1d;
    }
    `
      : ''
    }

    .info-section {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 14px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px 14px;
    }

    .info-box {
      flex: 1;
    }

    .info-box.right {
      text-align: right;
    }

    .info-box-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 5px;
      letter-spacing: 0.5px;
    }

    .info-row {
      margin-bottom: 3px;
      font-size: 11px;
      color: #374151;
    }

    .info-row strong {
      color: #111827;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      border: 1px solid #111827;
    }

    .items-table th {
      background-color: #f3f4f6;
      color: #111827;
      padding: 7px 6px;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      border: 1px solid #111827;
      letter-spacing: 0.3px;
    }

    .items-table td {
      padding: 6px;
      border: 1px solid #111827;
      font-size: 10.5px;
      vertical-align: top;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .adjustments {
      margin-top: 4px;
      padding-left: 8px;
      font-size: 9.5px;
      color: #4b5563;
      border-left: 2px solid #9ca3af;
    }

    .bottom-section {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-top: 10px;
    }

    .notes-box {
      flex: 1;
      border: 1px solid #e5e7eb;
      background: #fefce8;
      border-radius: 6px;
      padding: 10px;
      font-size: 10.5px;
    }

    .notes-box h4 {
      font-size: 11px;
      font-weight: 700;
      color: #854d0e;
      margin-bottom: 4px;
    }

    .totals-box {
      width: 290px;
      border: 1px solid #111827;
      padding: 10px 12px;
      background: #fafafa;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 3.5px 0;
      font-size: 11px;
      color: #374151;
      border-bottom: 1px dotted #d1d5db;
    }

    .total-row:last-child {
      border-bottom: none;
    }

    .total-row.grand-total {
      font-weight: 800;
      font-size: 13px;
      color: #111827;
      border-top: 1.5px solid #111827;
      border-bottom: 1.5px solid #111827;
      margin-top: 6px;
      padding: 6px 0;
      background: #f3f4f6;
    }

    .signatures-section {
      display: flex;
      justify-content: flex-end;
      margin-top: 36px;
      padding-top: 12px;
      font-size: 10px;
      color: #4b5563;
      text-align: center;
    }

    .sig-col {
      width: 30%;
    }

    .sig-line {
      border-top: 1px dashed #6b7280;
      padding-top: 6px;
      margin-bottom: 2px;
      font-weight: 600;
      color: #111827;
    }

    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 9px;
      color: #6b7280;
    }

    @media print {
      body {
        padding: 0;
        background: #ffffff;
      }
      .invoice-container {
        border: none;
        max-width: 100%;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    ${isCancelled ? `<div class="watermark">CANCELLED</div>` : ''}

    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="school-emblem">
          ${logoMarkup}
        </div>
      </div>
      <div class="header-center">
        <h1>Salyansthan Secondary School</h1>
        <div class="subtitle">Student Billing & Accounts Department</div>
        <p class="address">Kirtipur Municipality, Kathmandu District, Bagmati Province, Nepal - 44600</p>
        <p class="address">Phone: +977 1-5904264 | Email: info@salyansthanschool.edu.np</p>
      </div>
      <div class="header-right">
        <div class="status-badge status-${invoice.status}">
          ${invoice.status}
        </div>
        <div style="font-size: 10px; margin-top: 6px; color: #000000; font-weight: 600;">
          # ${invoice.invoiceNumber}
        </div>
        <div style="font-size: 9px; margin-top: 2px; color: #000000;">
          By: ${invoice.generatedBy?.name || 'System'}
        </div>
      </div>
    </div>

    <!-- Title -->
    <div class="invoice-title">
      <h2>Fee Invoice</h2>
    </div>

    ${isCancelled
      ? `
    <!-- Cancellation Notice -->
    <div class="cancellation-notice">
      <div style="font-weight: bold; font-size: 12px; margin-bottom: 3px;">
        ⚠️ NOTICE: This invoice has been CANCELLED.
      </div>
      ${invoice.cancellationReason ? `<div><strong>Cancellation Reason:</strong> ${invoice.cancellationReason}</div>` : ''}
      ${invoice.cancelledAt ? `<div><strong>Cancelled On:</strong> ${new Date(invoice.cancelledAt).toLocaleString()}</div>` : ''}
      ${invoice.cancelledBy?.name ? `<div><strong>Cancelled By:</strong> ${invoice.cancelledBy.name}</div>` : ''}
    </div>
    `
      : ''
    }

    <!-- Student & Invoice Meta -->
    <div class="info-section">
      <div class="info-box">
        <div class="info-box-title">Student Information</div>
        <div class="info-row" style="font-size: 13px; font-weight: bold; color: #111827;">
          ${invoice.student?.name || '—'}
        </div>
        <div class="info-row">
          <span>Admission No:</span> <strong>${invoice.student?.admissionNumber || '—'}</strong>
          ${invoice.student?.rollNumber ? ` | <span>Roll No:</span> <strong>${invoice.student.rollNumber}</strong>` : ''}
        </div>
        <div class="info-row">
          <span>Class:</span> <strong>${invoice.class?.name || '—'}</strong>
          ${invoice.section ? ` - <strong>${invoice.section.name}</strong>` : ''}
        </div>
      </div>

      <div class="info-box right">
        <div class="info-box-title">Billing & Session Information</div>
        <div class="info-row">
          <span>Academic Year:</span> <strong>${invoice.academicYear?.name || '—'}</strong>
        </div>
        <div class="info-row">
          <span>Billing Period:</span> <strong>${invoice.billingPeriod}</strong>
        </div>
        <div class="info-row">
          <span>Issue Date:</span> <strong>${invoice.issueDateBS} BS</strong> <small style="color: #6b7280;">(${invoice.issueDate})</small>
        </div>
        <div class="info-row">
          <span>Due Date:</span> <strong style="color: #b91c1c;">${invoice.dueDateBS} BS</strong> <small style="color: #6b7280;">(${invoice.dueDate})</small>
        </div>
      </div>
    </div>

    <!-- Line Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%;" class="text-center">#</th>
          <th style="width: 37%;">Fee Particulars</th>
          <th style="width: 12%;" class="text-center">Frequency</th>
          <th style="width: 14%;" class="text-right">Amount</th>
          <th style="width: 11%;" class="text-right">Discount</th>
          <th style="width: 11%;" class="text-right">Scholarship</th>
          <th style="width: 10%;" class="text-right">Net Total</th>
        </tr>
      </thead>
      <tbody>
        ${lines.length > 0
      ? lines
        .map((line, index) => {
          const origAmt = parseFloat(String(line.originalAmount || 0)).toFixed(2)
          const discAmt = parseFloat(String(line.discountAmount || 0))
          const scholAmt = parseFloat(String(line.scholarshipAmount || 0))
          const netAmt = parseFloat(String(line.lineTotal || 0)).toFixed(2)
          const adjustments = (line.adjustments || []) as InvoiceAdjustment[]

          return `
          <tr>
            <td class="text-center" style="color: #6b7280;">${index + 1}</td>
            <td>
              <strong>${line.feeCategory?.name || 'Fee Item'}</strong>
              ${line.feeCategory?.code ? `<small style="color: #6b7280;"> (${line.feeCategory.code})</small>` : ''}
              ${line.remarks ? `<br><small style="color: #6b7280; font-style: italic;">${line.remarks}</small>` : ''}
              ${adjustments.length > 0
              ? `
                <div class="adjustments">
                  ${adjustments
                .map(
                  (adj) =>
                    `${adj.adjustmentType}: ${adj.programName} (${adj.programValueType === 'PERCENTAGE' ? adj.programValue + '%' : 'Rs. ' + adj.programValue}) - Rs. ${parseFloat(String(adj.appliedAmount || 0)).toFixed(2)}`,
                )
                .join('<br>')}
                </div>
              `
              : ''
            }
            </td>
            <td class="text-center">${line.frequency || '—'}</td>
            <td class="text-right">Rs. ${origAmt}</td>
            <td class="text-right" style="color: #000000;">${discAmt > 0 ? `- Rs. ${discAmt.toFixed(2)}` : '—'}</td>
            <td class="text-right" style="color: #000000;">${scholAmt > 0 ? `- Rs. ${scholAmt.toFixed(2)}` : '—'}</td>
            <td class="text-right" style="font-weight: 700;">Rs. ${netAmt}</td>
          </tr>
          `
        })
        .join('')
      : `
          <tr>
            <td colspan="7" class="text-center" style="padding: 16px; color: #6b7280;">No fee line items available</td>
          </tr>
          `
    }
      </tbody>
    </table>

    <!-- Bottom Section: Notes & Totals -->
    <div class="bottom-section">
      <div style="flex: 1;">
        ${invoice.notes
      ? `
          <div class="notes-box">
            <h4>Billing Notes:</h4>
            <p>${invoice.notes}</p>
          </div>
        `
      : ''
    }
      </div>

      <div class="totals-box">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>Rs. ${subtotal}</span>
        </div>
        ${discountTotal > 0
      ? `
        <div class="total-row">
          <span>Discounts:</span>
          <span style="color: #000000;">- Rs. ${discountTotal.toFixed(2)}</span>
        </div>
        `
      : ''
    }
        ${scholarshipTotal > 0
      ? `
        <div class="total-row">
          <span>Scholarships:</span>
          <span style="color: #000000;">- Rs. ${scholarshipTotal.toFixed(2)}</span>
        </div>
        `
      : ''
    }
        ${fineAmount > 0
      ? `
        <div class="total-row">
          <span>Fine / Late Fee:</span>
          <span style="color: #000000;">+ Rs. ${fineAmount.toFixed(2)}</span>
        </div>
        `
      : ''
    }
        ${previousBalance !== 0
      ? `
        <div class="total-row">
          <span>Previous Balance:</span>
          <span>${previousBalance > 0 ? '+' : ''} Rs. ${previousBalance.toFixed(2)}</span>
        </div>
        `
      : ''
    }
        <div class="total-row grand-total">
          <span>Total Payable:</span>
          <span>Rs. ${totalPayable}</span>
        </div>
        ${paidAmount > 0
      ? `
        <div class="total-row" style="color: #000000; font-weight: 600;">
          <span>Paid Amount:</span>
          <span>Rs. ${paidAmount.toFixed(2)}</span>
        </div>
        <div class="total-row" style="color: #000000; font-weight: 700;">
          <span>Outstanding Balance:</span>
          <span>Rs. ${outstandingAmount.toFixed(2)}</span>
        </div>
        `
      : ''
    }
      </div>
    </div>

    <!-- Signatures -->
    <div class="signatures-section">
      <div class="sig-col">
        <div class="sig-line">Accountant / Cashier</div>
        <div>Authorized Signatory</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Generated by: ${invoice.generatedBy?.name || 'System'} | ${new Date().toLocaleString()}</p>
      <p style="margin-top: 3px;">For inquiries, contact School Administration Office.</p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Print an invoice using a dedicated hidden iframe.
 * Isolates print styling completely from React and Ant Design modal styles.
 */
export function printInvoice(invoice: Invoice, logoUrl?: string): Promise<void> {
  return new Promise((resolve) => {
    const html = generateInvoiceHtml(invoice, logoUrl)

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    iframe.style.visibility = 'hidden'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document || iframe.contentDocument
    if (!doc) {
      window.print()
      resolve()
      return
    }

    doc.open()
    doc.write(html)
    doc.close()

    const triggerPrint = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
        } catch {
          window.print()
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe)
            }
            resolve()
          }, 1500)
        }
      }, 300)
    }

    // Wait for logo and resources to load if needed
    if (iframe.contentWindow) {
      iframe.contentWindow.onload = triggerPrint
    }
    // Fallback trigger in case onload already fired
    setTimeout(triggerPrint, 500)
  })
}

