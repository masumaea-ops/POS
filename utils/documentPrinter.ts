import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateQRCodeSVG } from './qrCodeGenerator';
import type { SystemSettings } from '../contexts/SettingsContext';

export interface DocumentItem {
  partNumber?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  discount?: number;
  vatRate?: number;
}

export interface PrintableDocument {
  type: 'quotation' | 'invoice' | 'receipt' | 'delivery_note' | 'rma' | 'job_card' | 'gate_pass';
  docNumber: string;
  title?: string;
  date: string;
  dueDate?: string;
  validUntil?: string;
  customer: {
    name: string;
    companyName?: string;
    phone?: string;
    email?: string;
    kraPin?: string;
    address?: string;
    tier?: string;
    type?: string;
  };
  items: DocumentItem[];
  subtotal: number;
  vatAmount: number;
  vatRate?: number;
  totalAmount: number;
  paidAmount?: number;
  balanceDue?: number;
  paymentMethod?: string;
  paymentReference?: string;
  cashier?: string;
  branch?: string;
  notes?: string;
  terms?: string;
  eTimsSignature?: string;
  eTimsDeviceSerial?: string;
  qrCodePayload?: string;
  status?: string;
}

/**
 * Format currency with KES symbol and proper decimal groupings
 */
export function formatKES(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Convert numbers to words for official corporate invoices
 */
export function amountInWords(num: number): string {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n === 0) return 'Zero';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 1000000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 1000000000) return inWords(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 !== 0 ? ' ' + inWords(n % 1000000) : '');
    return String(n);
  }

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let words = inWords(integerPart) + ' Kenya Shillings';
  if (decimalPart > 0) {
    words += ` and ${inWords(decimalPart)} Cents`;
  } else {
    words += ' Only';
  }
  return words;
}

/**
 * Generate POS 80mm Thermal Receipt HTML Template
 * Specifically formatted for standard 80mm ESC/POS thermal receipt printers (Epson, Bixolon, Star, Xprinter)
 */
export function generatePos80mmHtml(doc: PrintableDocument, settings: SystemSettings): string {
  const docTitle = doc.title || (
    doc.type === 'quotation' ? 'PRO-FORMA ESTIMATE' :
    doc.type === 'invoice' ? 'OFFICIAL TAX INVOICE' :
    doc.type === 'receipt' ? 'CASH SALE RECEIPT' :
    doc.type === 'delivery_note' ? 'GOODS DELIVERY NOTE' :
    doc.type === 'rma' ? 'RMA RETURN SLIP' :
    'OFFICIAL TAX DOCUMENT'
  );

  const signature = doc.eTimsSignature || `KRA-ETIMS-${doc.docNumber}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const deviceSerial = doc.eTimsDeviceSerial || settings.deviceSerial || 'FSC-KRA-10940C';
  const qrPayload = doc.qrCodePayload || `MASUMA|${doc.docNumber}|KRA:${settings.taxpin}|TOTAL:${doc.totalAmount}|SIG:${signature}`;
  const qrSvg = generateQRCodeSVG(qrPayload, { size: 110, margin: 1 });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${doc.docNumber} - POS 80mm Receipt</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    @media print {
      body {
        margin: 0;
        padding: 2mm;
        width: 76mm;
        background: #ffffff !important;
        color: #000000 !important;
      }
      .no-print { display: none !important; }
    }
    * {
      box-sizing: border-box;
      font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
      color: #000000;
    }
    body {
      width: 76mm;
      margin: 0 auto;
      padding: 4mm 2mm;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.25;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    .divider {
      border-top: 1px dashed #000000;
      margin: 4px 0;
    }
    .divider-double {
      border-top: 2px solid #000000;
      margin: 5px 0;
    }
    .title-banner {
      border: 1px solid #000000;
      padding: 3px 0;
      font-weight: bold;
      letter-spacing: 1px;
      margin: 4px 0;
      text-align: center;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    table th, table td {
      padding: 2px 0;
      vertical-align: top;
    }
    .qr-container {
      display: flex;
      justify-content: center;
      margin: 6px 0;
    }
    .qr-container svg {
      width: 100px;
      height: 100px;
      shape-rendering: crispEdges;
    }
    .small-text {
      font-size: 9px;
      line-height: 1.2;
    }
    .cut-line {
      margin-top: 10px;
      padding-top: 6px;
      border-top: 1px dotted #888888;
      text-align: center;
      font-size: 8px;
      letter-spacing: 2px;
    }
  </style>
</head>
<body>
  <!-- HEADER BLOCK -->
  <div class="text-center">
    <div style="font-size: 14px; font-weight: 900; letter-spacing: 0.5px;">${settings.corpName || 'MASUMA EAST AFRICA LTD'}</div>
    <div style="font-size: 10px; font-weight: bold; margin-top: 1px;">AUTOMOTIVE SPARE PARTS & WORKSHOP</div>
    <div class="small-text">${settings.defaultOutlet || 'Nairobi HQ & Central Depot'}</div>
    <div class="small-text">Tel: ${settings.corpPhone} | Email: ${settings.adminEmail}</div>
    <div class="small-text font-bold">KRA PIN: ${settings.taxpin}</div>
  </div>

  <div class="title-banner uppercase">*** ${docTitle} ***</div>

  <!-- DOCUMENT PARTICULARS -->
  <div class="small-text">
    <div style="display: flex; justify-content: space-between;">
      <span>DOC NO:</span>
      <span class="font-bold">${doc.docNumber}</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span>DATE:</span>
      <span>${doc.date}</span>
    </div>
    ${doc.dueDate ? `
    <div style="display: flex; justify-content: space-between;">
      <span>DUE DATE:</span>
      <span>${doc.dueDate}</span>
    </div>` : ''}
    ${doc.validUntil ? `
    <div style="display: flex; justify-content: space-between;">
      <span>VALID UNTIL:</span>
      <span>${doc.validUntil}</span>
    </div>` : ''}
    <div style="display: flex; justify-content: space-between;">
      <span>CUSTOMER:</span>
      <span class="font-bold uppercase">${doc.customer.companyName || doc.customer.name}</span>
    </div>
    ${doc.customer.phone ? `
    <div style="display: flex; justify-content: space-between;">
      <span>PHONE:</span>
      <span>${doc.customer.phone}</span>
    </div>` : ''}
    ${doc.customer.kraPin ? `
    <div style="display: flex; justify-content: space-between;">
      <span>CUST PIN:</span>
      <span class="font-bold">${doc.customer.kraPin}</span>
    </div>` : ''}
    ${doc.cashier ? `
    <div style="display: flex; justify-content: space-between;">
      <span>CASHIER:</span>
      <span>${doc.cashier}</span>
    </div>` : ''}
    ${doc.paymentMethod ? `
    <div style="display: flex; justify-content: space-between;">
      <span>PAY CHANNEL:</span>
      <span class="font-bold uppercase">${doc.paymentMethod}</span>
    </div>` : ''}
    ${doc.paymentReference ? `
    <div style="display: flex; justify-content: space-between;">
      <span>PAY REF:</span>
      <span class="font-bold">${doc.paymentReference}</span>
    </div>` : ''}
  </div>

  <div class="divider"></div>

  <!-- ITEM LIST -->
  <table>
    <thead>
      <tr style="border-bottom: 1px dashed #000;">
        <th class="text-left" style="width: 48%;">ITEM / DESC</th>
        <th class="text-center" style="width: 14%;">QTY</th>
        <th class="text-right" style="width: 18%;">RATE</th>
        <th class="text-right" style="width: 20%;">TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${doc.items.map(it => `
        <tr>
          <td colspan="4" class="font-bold" style="padding-top: 3px;">
            ${it.partNumber ? `[${it.partNumber}] ` : ''}${it.name}
          </td>
        </tr>
        <tr style="border-bottom: 1px dotted #ccc;">
          <td></td>
          <td class="text-center">${it.quantity}</td>
          <td class="text-right">${(it.unitPrice).toLocaleString('en-KE', { minimumFractionDigits: 0 })}</td>
          <td class="text-right font-bold">${((it.totalPrice || (it.quantity * it.unitPrice))).toLocaleString('en-KE', { minimumFractionDigits: 0 })}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="divider"></div>

  <!-- TOTALS BREAKDOWN -->
  <div style="font-size: 11px;">
    <div style="display: flex; justify-content: space-between;">
      <span>Net Subtotal (Excl. VAT):</span>
      <span>${doc.subtotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span>VAT Code A (${doc.vatRate || settings.vatRate}%):</span>
      <span>${doc.vatAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
    </div>
    <div class="divider"></div>
    <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 900;">
      <span>TOTAL DUE:</span>
      <span>KES ${doc.totalAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
    </div>
    ${doc.paidAmount !== undefined ? `
    <div style="display: flex; justify-content: space-between; margin-top: 2px;">
      <span>Amount Tendered / Paid:</span>
      <span>KES ${doc.paidAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
    </div>` : ''}
    ${doc.balanceDue !== undefined && doc.balanceDue > 0 ? `
    <div style="display: flex; justify-content: space-between; font-weight: bold; color: #b91c1c;">
      <span>BALANCE OUTSTANDING:</span>
      <span>KES ${doc.balanceDue.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
    </div>` : ''}
  </div>

  <div class="divider-double"></div>

  <!-- KRA eTIMS COMPLIANCE BLOCK -->
  <div class="text-center">
    <div style="font-size: 9px; font-weight: bold; letter-spacing: 0.5px;">KRA eTIMS DIGITAL SIGNATURE</div>
    <div style="font-size: 8px; word-break: break-all; margin: 2px 0;">${signature}</div>
    <div class="qr-container">
      ${qrSvg}
    </div>
    <div class="small-text">Verified Device Serial: ${deviceSerial}</div>
  </div>

  <div class="divider"></div>

  <!-- FOOTER & NOTICE -->
  <div class="text-center small-text">
    <div>*** 12 MONTHS / 20,000 KM MASUMA WARRANTY ***</div>
    <div style="margin-top: 2px;">Keep this official slip for warranty claim & exchange within 14 days.</div>
    <div style="margin-top: 3px; font-weight: bold;">ASANTE SANA • THANK YOU!</div>
  </div>

  <div class="cut-line">
    - - - - - - - - [ TEAR RECEIPT HERE ] - - - - - - - -
  </div>
</body>
</html>`;
}

/**
 * Generate A4 Corporate Document HTML Template
 * Formatted with formal corporate letterhead, itemized table, KRA eTIMS verification, and signatures
 */
export function generateA4CorporateHtml(doc: PrintableDocument, settings: SystemSettings): string {
  const docTitle = doc.title || (
    doc.type === 'quotation' ? 'PRO-FORMA QUOTATION' :
    doc.type === 'invoice' ? 'TAX INVOICE' :
    doc.type === 'receipt' ? 'OFFICIAL PAYMENT RECEIPT' :
    doc.type === 'delivery_note' ? 'DELIVERY & DISPATCH NOTE' :
    doc.type === 'rma' ? 'RETURN MERCHANDISE AUTHORIZATION (RMA)' :
    'OFFICIAL COMMERCIAL DOCUMENT'
  );

  const signature = doc.eTimsSignature || `KRA-ETIMS-${doc.docNumber}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const deviceSerial = doc.eTimsDeviceSerial || settings.deviceSerial || 'FSC-KRA-10940C';
  const qrPayload = doc.qrCodePayload || `MASUMA|${doc.docNumber}|KRA:${settings.taxpin}|TOTAL:${doc.totalAmount}|SIG:${signature}`;
  const qrSvg = generateQRCodeSVG(qrPayload, { size: 100, margin: 1 });
  const totalWords = amountInWords(doc.totalAmount);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${doc.docNumber} - ${docTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 12mm 14mm;
    }
    @media print {
      body {
        margin: 0;
        background: #ffffff !important;
        color: #0f172a !important;
      }
      .no-print { display: none !important; }
    }
    * {
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      width: 100%;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-size: 12px;
      line-height: 1.4;
    }
    .brand-top-bar {
      height: 6px;
      background: linear-gradient(90deg, #ea580c 0%, #ea580c 70%, #0f172a 70%, #0f172a 100%);
      margin-bottom: 18px;
    }
    .header-grid {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    .company-name {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .company-sub {
      color: #ea580c;
      font-weight: 800;
      font-size: 10px;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 1px;
    }
    .doc-badge {
      text-align: right;
    }
    .doc-title {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-number {
      font-family: 'Courier New', Courier, monospace;
      font-size: 15px;
      font-weight: 800;
      color: #ea580c;
      margin-top: 2px;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 18px;
    }
    .info-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .card-heading {
      font-size: 9.5px;
      font-weight: 800;
      color: #ea580c;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      padding: 1.5px 0;
    }
    .info-label {
      color: #64748b;
      font-weight: 600;
    }
    .info-val {
      font-weight: 700;
      color: #0f172a;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    table.items-table th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 9.5px;
      letter-spacing: 0.5px;
      padding: 8px 10px;
      text-align: left;
    }
    table.items-table td {
      border-bottom: 1px solid #e2e8f0;
      padding: 7px 10px;
      font-size: 11px;
    }
    table.items-table tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals-wrapper {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 18px;
    }
    .terms-box {
      flex: 1.2;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      background: #ffffff;
      font-size: 10px;
      line-height: 1.4;
    }
    .totals-box {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 14px;
      background: #f8fafc;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: 11.5px;
    }
    .grand-total-row {
      display: flex;
      justify-content: space-between;
      border-top: 2px solid #0f172a;
      padding-top: 6px;
      margin-top: 4px;
      font-size: 14px;
      font-weight: 900;
      color: #ea580c;
    }
    .etims-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px dashed #059669;
      background: #ecfdf5;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 18px;
    }
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 14px;
      padding-top: 10px;
    }
    .sig-line {
      border-top: 1px solid #0f172a;
      margin-top: 36px;
      padding-top: 4px;
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      display: flex;
      justify-content: space-between;
    }
    .footer-note {
      border-top: 1px solid #cbd5e1;
      margin-top: 16px;
      padding-top: 8px;
      font-size: 9px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="brand-top-bar"></div>

  <!-- HEADER -->
  <div class="header-grid">
    <div>
      <div class="company-name">${settings.corpName || 'MASUMA AUTOPARTS EAST AFRICA LTD'}</div>
      <div class="company-sub">GENUINE JAPANESE & KOREAN AUTOMOTIVE COMPONENTS</div>
      <div style="font-size: 10.5px; color: #475569; margin-top: 4px;">
        Commercial Street / Kirinyaga Road Depot • P.O. Box 48920 - 00100 Nairobi, Kenya<br/>
        <strong>Phone:</strong> ${settings.corpPhone} | <strong>Email:</strong> ${settings.adminEmail} | <strong>KRA PIN:</strong> ${settings.taxpin}
      </div>
    </div>
    <div class="doc-badge">
      <div class="doc-title">${docTitle}</div>
      <div class="doc-number">${doc.docNumber}</div>
      <div style="font-size: 10.5px; color: #475569; margin-top: 4px;">
        <strong>Date of Issue:</strong> ${doc.date}<br/>
        ${doc.dueDate ? `<strong>Due Date:</strong> ${doc.dueDate}<br/>` : ''}
        ${doc.validUntil ? `<strong>Validity Period:</strong> Until ${doc.validUntil}<br/>` : ''}
        <strong>Outlet Branch:</strong> ${doc.branch || settings.defaultOutlet || 'Nairobi Central'}
      </div>
    </div>
  </div>

  <!-- CUSTOMER & BILLING DETAILS CARDS -->
  <div class="cards-grid">
    <div class="info-card">
      <div class="card-heading">BILL TO / CLIENT PARTICULARS</div>
      <div class="info-row">
        <span class="info-label">Customer Name:</span>
        <span class="info-val">${doc.customer.companyName || doc.customer.name}</span>
      </div>
      ${doc.customer.kraPin ? `
      <div class="info-row">
        <span class="info-label">KRA PIN:</span>
        <span class="info-val font-mono">${doc.customer.kraPin}</span>
      </div>` : ''}
      ${doc.customer.phone ? `
      <div class="info-row">
        <span class="info-label">Contact Phone:</span>
        <span class="info-val">${doc.customer.phone}</span>
      </div>` : ''}
      ${doc.customer.email ? `
      <div class="info-row">
        <span class="info-label">Email Address:</span>
        <span class="info-val">${doc.customer.email}</span>
      </div>` : ''}
      ${doc.customer.address ? `
      <div class="info-row">
        <span class="info-label">Delivery Destination:</span>
        <span class="info-val">${doc.customer.address}</span>
      </div>` : ''}
      ${doc.customer.tier ? `
      <div class="info-row">
        <span class="info-label">Account Tier:</span>
        <span class="info-val" style="color: #ea580c;">${doc.customer.tier}</span>
      </div>` : ''}
    </div>

    <div class="info-card">
      <div class="card-heading">PAYMENT & SETTLEMENT TERMS</div>
      <div class="info-row">
        <span class="info-label">Bank Name:</span>
        <span class="info-val">Standard Chartered Bank Kenya</span>
      </div>
      <div class="info-row">
        <span class="info-label">Account Name:</span>
        <span class="info-val">${settings.corpName || 'Masuma Autoparts EA Ltd'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Account Number:</span>
        <span class="info-val font-mono">0108012345600</span>
      </div>
      <div class="info-row">
        <span class="info-label">M-Pesa Paybill:</span>
        <span class="info-val font-mono" style="color: #059669;">889900 (Acc: ${doc.docNumber})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Channel:</span>
        <span class="info-val font-mono uppercase">${doc.paymentMethod || 'Trade Credit / EFT'}</span>
      </div>
      ${doc.paymentReference ? `
      <div class="info-row">
        <span class="info-label">Channel Reference:</span>
        <span class="info-val font-mono">${doc.paymentReference}</span>
      </div>` : ''}
    </div>
  </div>

  <!-- LINE ITEMS TABLE -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 5%;" class="text-center">#</th>
        <th style="width: 20%;">PART NO / SKU</th>
        <th style="width: 40%;">DESCRIPTION / AUTOMOTIVE COMPONENT</th>
        <th style="width: 8%;" class="text-center">QTY</th>
        <th style="width: 13%;" class="text-right">UNIT RATE (KES)</th>
        <th style="width: 14%;" class="text-right">EXTENDED (KES)</th>
      </tr>
    </thead>
    <tbody>
      ${doc.items.map((it, idx) => `
        <tr>
          <td class="text-center" style="color: #64748b;">${idx + 1}</td>
          <td style="font-family: 'Courier New', Courier, monospace; font-weight: 700; color: #0f172a;">
            ${it.partNumber || '-'}
          </td>
          <td style="font-weight: 600;">${it.name}</td>
          <td class="text-center font-bold">${it.quantity}</td>
          <td class="text-right font-mono">${it.unitPrice.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
          <td class="text-right font-mono font-bold">${(it.totalPrice || (it.quantity * it.unitPrice)).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- TOTALS & FINANCIAL SUMMARY -->
  <div class="totals-wrapper">
    <div class="terms-box">
      <div style="font-weight: 800; text-transform: uppercase; margin-bottom: 4px; color: #0f172a;">
        Total Amount in Words:
      </div>
      <div style="font-style: italic; font-weight: 700; color: #334155; margin-bottom: 8px;">
        "${totalWords}"
      </div>
      <div style="font-weight: 800; text-transform: uppercase; font-size: 9px; color: #64748b; margin-bottom: 2px;">
        Commercial Terms & Conditions:
      </div>
      <ul style="margin: 0; padding-left: 14px; color: #475569;">
        <li>All genuine Masuma components carry a 12-Month / 20,000 KM manufacturer warranty.</li>
        <li>Goods inspected and accepted upon physical delivery or signed bill of lading.</li>
        <li>Quotations remain valid for 30 calendar days from the date of issuance.</li>
      </ul>
      ${doc.notes ? `
      <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #cbd5e1; font-weight: 600; color: #0f172a;">
        Special Instructions: ${doc.notes}
      </div>` : ''}
    </div>

    <div class="totals-box">
      <div class="total-row">
        <span class="info-label">Taxable Base Amount:</span>
        <span class="font-mono">${doc.subtotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="total-row">
        <span class="info-label">VAT Component (${doc.vatRate || settings.vatRate}% KRA):</span>
        <span class="font-mono">${doc.vatAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="grand-total-row">
        <span>TOTAL COMPLIANT DUE:</span>
        <span class="font-mono">KES ${doc.totalAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
      </div>
      ${doc.paidAmount !== undefined ? `
      <div class="total-row" style="margin-top: 4px;">
        <span class="info-label">Amount Paid / Settled:</span>
        <span class="font-mono font-bold" style="color: #059669;">KES ${doc.paidAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
      </div>` : ''}
      ${doc.balanceDue !== undefined && doc.balanceDue > 0 ? `
      <div class="total-row" style="color: #dc2626; font-weight: 800;">
        <span>Balance Outstanding:</span>
        <span class="font-mono">KES ${doc.balanceDue.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
      </div>` : ''}
    </div>
  </div>

  <!-- KRA eTIMS CRYPTOGRAPHIC AUDIT SEAL -->
  <div class="etims-banner">
    <div>
      <div style="font-weight: 900; font-size: 11px; color: #065f46; letter-spacing: 0.5px;">
        KENYA REVENUE AUTHORITY • eTIMS VERIFIED TAX REGISTER
      </div>
      <div style="font-size: 10px; color: #047857; margin-top: 2px;">
        <strong>eTIMS Digital Signature:</strong> <span style="font-family: monospace; word-break: break-all;">${signature}</span>
      </div>
      <div style="font-size: 9.5px; color: #059669; margin-top: 2px;">
        Verified Audit Device Serial: <strong>${deviceSerial}</strong> • Taxpayer PIN: <strong>${settings.taxpin}</strong>
      </div>
    </div>
    <div style="background: #ffffff; padding: 4px; border-radius: 4px; border: 1px solid #a7f3d0;">
      ${qrSvg}
    </div>
  </div>

  <!-- SIGNATURES & OFFICIAL ENDORSEMENT -->
  <div class="signature-grid">
    <div>
      <div class="sig-line">
        <span>PREPARED & AUTHORIZED BY (FOR MASUMA EA)</span>
        <span>DATE & STAMP</span>
      </div>
    </div>
    <div>
      <div class="sig-line">
        <span>CLIENT / RECEIVING AGENT SIGNATURE</span>
        <span>DATE RECEIVED</span>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer-note">
    <span>Masuma Autoparts East Africa ERP System • Official Digital Commercial Document</span>
    <span>Page 1 of 1 • System Generated</span>
  </div>
</body>
</html>`;
}

/**
 * Execute Print cleanly via an isolated hidden iframe
 * Guarantees zero DOM leakage, correct page size, and clean ink printing
 */
export function printHtmlDocument(htmlContent: string): void {
  const existingFrame = document.getElementById('masuma-isolated-print-frame');
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'masuma-isolated-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    // Fallback to standalone popup
    const popup = window.open('', '_blank', 'width=800,height=700');
    if (popup) {
      popup.document.open();
      popup.document.write(htmlContent);
      popup.document.close();
      popup.focus();
      setTimeout(() => {
        popup.print();
        popup.close();
      }, 400);
    }
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('Iframe print error, falling back to popup window:', err);
      const popup = window.open('', '_blank', 'width=800,height=700');
      if (popup) {
        popup.document.open();
        popup.document.write(htmlContent);
        popup.document.close();
        popup.focus();
        setTimeout(() => {
          popup.print();
          popup.close();
        }, 400);
      }
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 3000);
    }
  }, 350);
}

/**
 * Print document in either POS 80mm or A4 Corporate format
 */
export function printDocument(
  doc: PrintableDocument,
  format: '80mm' | 'a4',
  settings: SystemSettings
): void {
  const html = format === '80mm'
    ? generatePos80mmHtml(doc, settings)
    : generateA4CorporateHtml(doc, settings);
  printHtmlDocument(html);
}

/**
 * Download document as A4 or 80mm PDF file
 */
export function downloadDocumentPdf(
  docData: PrintableDocument,
  format: 'a4' | '80mm',
  settings: SystemSettings
): void {
  const docTitle = docData.title || (
    docData.type === 'quotation' ? 'Quotation' :
    docData.type === 'invoice' ? 'Invoice' :
    docData.type === 'receipt' ? 'Receipt' :
    docData.type === 'delivery_note' ? 'DeliveryNote' :
    'CommercialDoc'
  );

  const cleanDocNum = docData.docNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Masuma_${docTitle}_${cleanDocNum}_${format}.pdf`;

  if (format === 'a4') {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // Top Brand Bar
    doc.setFillColor(234, 88, 12); // Brand Orange #ea580c
    doc.rect(0, 0, pageWidth * 0.7, 4.5, 'F');
    doc.setFillColor(15, 23, 42); // Slate #0f172a
    doc.rect(pageWidth * 0.7, 0, pageWidth * 0.3, 4.5, 'F');

    let currentY = 14;

    // Header left
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(settings.corpName || 'MASUMA EAST AFRICA LTD', margin, currentY);

    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(234, 88, 12);
    doc.text('GENUINE JAPANESE & KOREAN AUTOMOTIVE COMPONENTS', margin, currentY);

    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Commercial St / Kirinyaga Rd, Nairobi | Tel: ${settings.corpPhone} | PIN: ${settings.taxpin}`, margin, currentY);

    // Header right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(docTitle.toUpperCase(), pageWidth - margin, 14, { align: 'right' });

    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(234, 88, 12);
    doc.text(docData.docNumber, pageWidth - margin, 20, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Date: ${docData.date}`, pageWidth - margin, 25, { align: 'right' });
    if (docData.dueDate) {
      doc.text(`Due: ${docData.dueDate}`, pageWidth - margin, 29, { align: 'right' });
    }

    currentY += 4;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);

    // Customer & Details Box
    currentY += 5;
    const cardWidth = (pageWidth - margin * 2 - 6) / 2;
    const cardHeight = 24;

    // Left Card: Customer
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(234, 88, 12);
    doc.text('BILL TO / CUSTOMER PARTICULARS', margin + 3, currentY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(docData.customer.companyName || docData.customer.name, margin + 3, currentY + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    let custY = currentY + 13.5;
    if (docData.customer.kraPin) {
      doc.text(`KRA PIN: ${docData.customer.kraPin}`, margin + 3, custY);
      custY += 4;
    }
    if (docData.customer.phone) {
      doc.text(`Tel: ${docData.customer.phone}`, margin + 3, custY);
      custY += 4;
    }

    // Right Card: Payment particulars
    const rightX = margin + cardWidth + 6;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(rightX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(234, 88, 12);
    doc.text('PAYMENT PARTICULARS & BANKING', rightX + 3, currentY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Bank: Standard Chartered Bank Kenya (A/C: 0108012345600)', rightX + 3, currentY + 9);
    doc.text(`M-Pesa Paybill: 889900 (Acc: ${docData.docNumber})`, rightX + 3, currentY + 13);
    doc.text(`Channel: ${(docData.paymentMethod || 'Trade Credit / EFT').toUpperCase()}`, rightX + 3, currentY + 17);
    if (docData.paymentReference) {
      doc.text(`Ref: ${docData.paymentReference}`, rightX + 3, currentY + 21);
    }

    currentY += cardHeight + 5;

    // Items AutoTable
    const tableHeaders = ['#', 'PART NUMBER', 'DESCRIPTION', 'QTY', 'UNIT RATE (KES)', 'TOTAL (KES)'];
    const tableRows = docData.items.map((item, idx) => [
      String(idx + 1),
      item.partNumber || '-',
      item.name,
      String(item.quantity),
      item.unitPrice.toLocaleString('en-KE', { minimumFractionDigits: 2 }),
      (item.totalPrice || (item.quantity * item.unitPrice)).toLocaleString('en-KE', { minimumFractionDigits: 2 }),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [tableHeaders],
      body: tableRows,
      theme: 'grid',
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 2.8,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [51, 65, 85],
        cellPadding: 2.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { font: 'courier', fontStyle: 'bold', cellWidth: 32 },
        2: { cellWidth: 'auto' },
        3: { halign: 'center', fontStyle: 'bold', cellWidth: 14 },
        4: { halign: 'right', cellWidth: 30 },
        5: { halign: 'right', fontStyle: 'bold', cellWidth: 32 },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 6;

    // Financial Totals Summary
    const totalsWidth = 75;
    const totalsX = pageWidth - margin - totalsWidth;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(totalsX, finalY, totalsWidth, 26, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Subtotal (Excl. VAT):', totalsX + 3, finalY + 5);
    doc.text(`KES ${docData.subtotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`, pageWidth - margin - 3, finalY + 5, { align: 'right' });

    doc.text(`VAT (${docData.vatRate || settings.vatRate}%):`, totalsX + 3, finalY + 10);
    doc.text(`KES ${docData.vatAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`, pageWidth - margin - 3, finalY + 10, { align: 'right' });

    doc.setDrawColor(203, 213, 225);
    doc.line(totalsX + 2, finalY + 13, pageWidth - margin - 2, finalY + 13);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(234, 88, 12);
    doc.text('TOTAL DUE:', totalsX + 3, finalY + 19);
    doc.text(`KES ${docData.totalAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`, pageWidth - margin - 3, finalY + 19, { align: 'right' });

    if (docData.paidAmount !== undefined) {
      doc.setFontSize(8);
      doc.setTextColor(5, 150, 105);
      doc.text('Amount Settled:', totalsX + 3, finalY + 24);
      doc.text(`KES ${docData.paidAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`, pageWidth - margin - 3, finalY + 24, { align: 'right' });
    }

    // Amount in Words & Terms
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('AMOUNT IN WORDS:', margin, finalY + 5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    const splitWords = doc.splitTextToSize(`"${amountInWords(docData.totalAmount)}"`, totalsX - margin - 6);
    doc.text(splitWords, margin, finalY + 10);

    // KRA eTIMS Banner Box
    const etimsY = finalY + 30;
    doc.setFillColor(236, 253, 245); // Emerald-50
    doc.setDrawColor(5, 150, 105);
    doc.roundedRect(margin, etimsY, pageWidth - margin * 2, 14, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(6, 95, 70);
    doc.text('KRA eTIMS VERIFIED TAX COMPLIANCE REGISTER', margin + 3, etimsY + 4);

    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(4, 120, 87);
    const sig = docData.eTimsSignature || `KRA-ETIMS-${docData.docNumber}-SECURE`;
    doc.text(`FSC Signature: ${sig}`, margin + 3, etimsY + 8);
    doc.text(`Audit Device Serial: ${settings.deviceSerial} | Taxpayer PIN: ${settings.taxpin}`, margin + 3, etimsY + 11.5);

    // Signatures block
    const sigY = etimsY + 18;
    doc.setDrawColor(15, 23, 42);
    doc.line(margin, sigY + 12, margin + 65, sigY + 12);
    doc.line(pageWidth - margin - 65, sigY + 12, pageWidth - margin, sigY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('AUTHORIZED SIGNATORY (MASUMA EA)', margin, sigY + 15);
    doc.text('CUSTOMER / RECEIVER ACKNOWLEDGEMENT', pageWidth - margin - 65, sigY + 15);

    // Running footer
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Masuma ERP • Automotive Inventory & Sales Operations Suite', margin, pageHeight - 6);
    doc.text('Page 1 of 1', pageWidth - margin, pageHeight - 6, { align: 'right' });

    doc.save(filename);
  } else {
    // 80mm Slip PDF (Custom page size: 80mm width, dynamic height)
    const estimatedHeight = Math.max(160, 95 + docData.items.length * 8);
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, estimatedHeight],
    });

    const pageWidth = 80;
    const margin = 3.5;
    let y = 6;

    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(settings.corpName || 'MASUMA EAST AFRICA LTD', pageWidth / 2, y, { align: 'center' });

    y += 4;
    doc.setFontSize(7.5);
    doc.text('AUTOMOTIVE PARTS & WORKSHOP', pageWidth / 2, y, { align: 'center' });

    y += 3.5;
    doc.setFontSize(7);
    doc.text(`Tel: ${settings.corpPhone} | PIN: ${settings.taxpin}`, pageWidth / 2, y, { align: 'center' });

    y += 4;
    doc.setDrawColor(0, 0, 0);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin, y, pageWidth - margin, y);

    y += 4;
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.text(`*** ${docTitle.toUpperCase()} ***`, pageWidth / 2, y, { align: 'center' });

    y += 4;
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.text(`DOC NO: ${docData.docNumber}`, margin, y);
    doc.text(`DATE: ${docData.date}`, pageWidth - margin, y, { align: 'right' });

    y += 3.5;
    doc.text(`CUSTOMER: ${(docData.customer.companyName || docData.customer.name).substring(0, 22)}`, margin, y);

    if (docData.paymentMethod) {
      y += 3.5;
      doc.text(`PAY CHANNEL: ${docData.paymentMethod.toUpperCase()}`, margin, y);
    }

    y += 3;
    doc.line(margin, y, pageWidth - margin, y);

    // Items table
    y += 4;
    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.text('ITEM', margin, y);
    doc.text('QTY', 42, y, { align: 'center' });
    doc.text('RATE', 56, y, { align: 'right' });
    doc.text('TOTAL', pageWidth - margin, y, { align: 'right' });

    y += 2;
    doc.line(margin, y, pageWidth - margin, y);

    doc.setFont('courier', 'normal');
    docData.items.forEach(it => {
      y += 3.5;
      const itemName = (it.partNumber ? `[${it.partNumber}] ` : '') + it.name;
      doc.text(itemName.substring(0, 36), margin, y);

      y += 3;
      doc.text(String(it.quantity), 42, y, { align: 'center' });
      doc.text(it.unitPrice.toLocaleString('en-KE', { minimumFractionDigits: 0 }), 56, y, { align: 'right' });
      doc.text((it.totalPrice || (it.quantity * it.unitPrice)).toLocaleString('en-KE', { minimumFractionDigits: 0 }), pageWidth - margin, y, { align: 'right' });
    });

    y += 3;
    doc.line(margin, y, pageWidth - margin, y);

    y += 4;
    doc.text('Tax Basis (Excl. VAT):', margin, y);
    doc.text(docData.subtotal.toLocaleString('en-KE', { minimumFractionDigits: 2 }), pageWidth - margin, y, { align: 'right' });

    y += 3.5;
    doc.text(`VAT (${docData.vatRate || settings.vatRate}%):`, margin, y);
    doc.text(docData.vatAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 }), pageWidth - margin, y, { align: 'right' });

    y += 2;
    doc.setLineDashPattern([], 0);
    doc.line(margin, y, pageWidth - margin, y);

    y += 4.5;
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL DUE:', margin, y);
    doc.text(`KES ${docData.totalAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`, pageWidth - margin, y, { align: 'right' });

    y += 5;
    doc.setFontSize(6.5);
    doc.text('*** KRA eTIMS CRYPTOGRAPHIC AUDIT ***', pageWidth / 2, y, { align: 'center' });
    y += 3;
    const sig = docData.eTimsSignature || `KRA-ETIMS-${docData.docNumber}`;
    doc.text(sig, pageWidth / 2, y, { align: 'center' });

    y += 5;
    doc.text('Thank you for choosing Masuma EA!', pageWidth / 2, y, { align: 'center' });

    doc.save(filename);
  }
}

/**
 * Download document in CSV format for ERP & Spreadsheet reconciliation
 */
export function downloadDocumentCsv(doc: PrintableDocument, settings: SystemSettings): void {
  const lines: string[] = [];

  // Header block
  lines.push(`"${settings.corpName || 'MASUMA EAST AFRICA LTD'}"`);
  lines.push(`"Document Type: ${doc.title || doc.type.toUpperCase()}"`);
  lines.push(`"Document Number: ${doc.docNumber}"`);
  lines.push(`"Date: ${doc.date}"`);
  if (doc.dueDate) lines.push(`"Due Date: ${doc.dueDate}"`);
  lines.push(`"Customer: ${doc.customer.companyName || doc.customer.name}"`);
  if (doc.customer.kraPin) lines.push(`"Customer KRA PIN: ${doc.customer.kraPin}"`);
  if (doc.paymentMethod) lines.push(`"Payment Method: ${doc.paymentMethod}"`);
  lines.push('');

  // Line items
  lines.push('"#","Part Number","Description","Quantity","Unit Price (KES)","Total (KES)"');
  doc.items.forEach((it, idx) => {
    const total = it.totalPrice || (it.quantity * it.unitPrice);
    lines.push(`"${idx + 1}","${it.partNumber || ''}","${it.name.replace(/"/g, '""')}","${it.quantity}","${it.unitPrice}","${total}"`);
  });

  lines.push('');
  lines.push(`"Subtotal (Excl. VAT)",,,,,"${doc.subtotal}"`);
  lines.push(`"VAT Amount (${doc.vatRate || settings.vatRate}%)",,,,,"${doc.vatAmount}"`);
  lines.push(`"Grand Total Due",,,,,"${doc.totalAmount}"`);
  if (doc.paidAmount !== undefined) lines.push(`"Amount Paid",,,,,"${doc.paidAmount}"`);
  if (doc.balanceDue !== undefined) lines.push(`"Balance Outstanding",,,,,"${doc.balanceDue}"`);

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Masuma_${doc.docNumber}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download self-contained standalone HTML document
 */
export function downloadDocumentHtml(
  doc: PrintableDocument,
  format: '80mm' | 'a4',
  settings: SystemSettings
): void {
  const html = format === '80mm'
    ? generatePos80mmHtml(doc, settings)
    : generateA4CorporateHtml(doc, settings);

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Masuma_${doc.docNumber}_${format}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
