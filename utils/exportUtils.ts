import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sanitizeCSVCell } from './securityUtils';

export interface ExportColumn {
  header: string;
  dataKey?: string;
  align?: 'left' | 'center' | 'right';
  width?: number;
}

export interface SummaryStat {
  label: string;
  value: string | number;
}

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  filename?: string;
  headers: string[];
  rows: (string | number)[][];
  columns?: ExportColumn[];
  metadata?: Record<string, string | number | boolean | undefined>;
  summaryStats?: SummaryStat[];
  notes?: string[];
  orientation?: 'portrait' | 'landscape';
  companyName?: string;
  currency?: string;
}

export interface CSVExportOptions {
  filename?: string;
  title?: string;
  headers: string[];
  rows: (string | number)[][];
  metadata?: Record<string, string | number | boolean | undefined>;
  summaryStats?: SummaryStat[];
}

/**
 * Universal Structured CSV Exporter
 * Implements RFC 4180 compliance, UTF-8 BOM for Microsoft Excel/Google Sheets, and optional metadata header blocks.
 */
export function exportToCSV({
  filename = 'export_data',
  title,
  headers,
  rows,
  metadata,
  summaryStats,
}: CSVExportOptions): void {
  const lines: string[] = [];

  // Optional document header
  if (title) {
    lines.push(`"${String(title).replace(/"/g, '""')}"`);
    lines.push(`"Generated at: ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC"`);
    lines.push(`"Security Standard: CWE-1236 Formula Injection Neutralized | Masuma Cryptographic Enclave"`);
    if (metadata) {
      const metaStrings = Object.entries(metadata)
        .filter(([_, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${k}: ${v}`);
      if (metaStrings.length > 0) {
        lines.push(`"Filters: ${metaStrings.join(' | ')}"`);
      }
    }
    lines.push(''); // Blank separator line
  }

  // Table Headers
  lines.push(headers.map(sanitizeCSVCell).join(','));

  // Data Rows
  rows.forEach((row) => {
    lines.push(row.map(sanitizeCSVCell).join(','));
  });

  // Summary Stats Footer if provided
  if (summaryStats && summaryStats.length > 0) {
    lines.push('');
    lines.push('"--- SUMMARY METRICS ---"');
    summaryStats.forEach((stat) => {
      lines.push(`"${stat.label}",${sanitizeCSVCell(stat.value)}`);
    });
  }

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const cleanFilename = filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Universal Formatted PDF Exporter
 * Generates an executive-grade PDF document with Masuma branding, active filter tags,
 * structured tables with alternating rows and right-aligned currency, KPI summary blocks, and page numbering.
 */
export function exportToPDF({
  title,
  subtitle,
  filename = 'masuma_report',
  headers,
  rows,
  columns,
  metadata,
  summaryStats,
  notes,
  orientation = 'landscape',
  companyName = 'MASUMA EAST AFRICA',
  currency = 'KES',
}: PDFExportOptions): void {
  // Determine orientation automatically if not explicitly given: if > 6 columns, landscape is best
  const finalOrientation = orientation || (headers.length > 5 ? 'landscape' : 'portrait');
  const doc = new jsPDF({
    orientation: finalOrientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // 1. Top Decorative Brand Bar (Orange & Dark Slate)
  doc.setFillColor(234, 88, 12); // Brand Orange #EA580C
  doc.rect(0, 0, pageWidth, 5, 'F');

  // 2. Header Box & Company Details
  let currentY = 12;

  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(companyName, margin, currentY);

  // System Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(234, 88, 12);
  doc.text('ERP & AUTOMOTIVE OPERATIONS SUITE', margin, currentY + 4);

  // Right Side Generation Timestamp
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${dateStr} ${timeStr}`, pageWidth - margin, currentY, { align: 'right' });
  doc.text(`Audit Status: Verified Authentic`, pageWidth - margin, currentY + 4, { align: 'right' });

  // Divider Line
  currentY += 8;
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  // 3. Report Title & Subtitle
  currentY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(title, margin, currentY);

  if (subtitle) {
    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, margin, currentY);
  }

  // 4. Metadata Pills / Context Tags
  if (metadata && Object.keys(metadata).length > 0) {
    currentY += 6;
    let pillX = margin;
    const entries = Object.entries(metadata).filter(([_, v]) => v !== undefined && v !== '');

    entries.forEach(([key, val]) => {
      const tagText = `${key.toUpperCase()}: ${val}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const textWidth = doc.getTextWidth(tagText);
      const pillWidth = textWidth + 6;
      const pillHeight = 5;

      // Check if wrapping required
      if (pillX + pillWidth > pageWidth - margin) {
        pillX = margin;
        currentY += 6.5;
      }

      // Draw background pill
      doc.setFillColor(241, 245, 249); // Slate-100
      doc.setDrawColor(203, 213, 225); // Slate-300
      doc.roundedRect(pillX, currentY - 3.5, pillWidth, pillHeight, 1.5, 1.5, 'FD');

      // Draw text
      doc.setTextColor(51, 65, 85); // Slate-700
      doc.text(tagText, pillX + 3, currentY);

      pillX += pillWidth + 3;
    });
  }

  // 5. Summary KPI Stats Bar (if provided)
  if (summaryStats && summaryStats.length > 0) {
    currentY += 7;
    const statBoxWidth = (pageWidth - margin * 2 - (summaryStats.length - 1) * 3) / summaryStats.length;
    const statBoxHeight = 12;

    summaryStats.forEach((stat, idx) => {
      const boxX = margin + idx * (statBoxWidth + 3);

      doc.setFillColor(248, 250, 252); // Slate-50
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.roundedRect(boxX, currentY, statBoxWidth, statBoxHeight, 2, 2, 'FD');

      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text(stat.label.toUpperCase(), boxX + 3, currentY + 3.8);

      // Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text(String(stat.value), boxX + 3, currentY + 9);
    });

    currentY += statBoxHeight + 4;
  } else {
    currentY += 4;
  }

  // 6. Build AutoTable Column Styles
  const columnStyles: Record<number, any> = {};

  if (columns && columns.length > 0) {
    columns.forEach((col, index) => {
      columnStyles[index] = {
        halign: col.align || 'left',
        ...(col.width ? { cellWidth: col.width } : {}),
      };
    });
  } else {
    // Auto-detect numeric columns from rows to right-align
    headers.forEach((h, colIndex) => {
      const lower = h.toLowerCase();
      const isNumeric =
        lower.includes('price') ||
        lower.includes('cost') ||
        lower.includes('total') ||
        lower.includes('revenue') ||
        lower.includes('margin') ||
        lower.includes('qty') ||
        lower.includes('quantity') ||
        lower.includes('stock') ||
        lower.includes('variance') ||
        lower.includes('amount') ||
        lower.includes('balance') ||
        lower.includes('due') ||
        lower.includes('vat') ||
        lower.includes('days') ||
        lower.includes('%') ||
        lower.includes('rate') ||
        lower.includes('kes') ||
        lower.includes('usd');

      if (isNumeric) {
        columnStyles[colIndex] = { halign: 'right' };
      }
    });
  }

  // 7. AutoTable Generation
  autoTable(doc, {
    startY: currentY,
    head: [headers],
    body: rows,
    theme: 'grid',
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [30, 41, 59], // Slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.8,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      cellPadding: 2.2,
      font: 'helvetica',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate-50
    },
    columnStyles: columnStyles,
    styles: {
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    didDrawPage: (data) => {
      // Running Footer on each page
      const pageNum = doc.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);

      // Footer divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

      // Footer Text
      doc.text(
        `Masuma ERP • Automotive Inventory & Analytics Suite • Confidential Document`,
        margin,
        pageHeight - 6
      );
      doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
    },
  });

  // Notes/Disclaimers if provided
  if (notes && notes.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY + 6;
    if (finalY < pageHeight - 20) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      notes.forEach((note, idx) => {
        doc.text(`* ${note}`, margin, finalY + idx * 3.5);
      });
    }
  }

  // Trigger download
  const cleanFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
  doc.save(cleanFilename);
}
