import React, { useState } from 'react';
import {
  Printer,
  Download,
  FileText,
  Receipt,
  X,
  CheckCircle2,
  FileSpreadsheet,
  Globe,
  Eye,
  Layers
} from 'lucide-react';
import {
  PrintableDocument,
  printDocument,
  downloadDocumentPdf,
  downloadDocumentCsv,
  downloadDocumentHtml,
  generatePos80mmHtml,
  generateA4CorporateHtml
} from '../../utils/documentPrinter';
import { useSystemSettings } from '../../contexts/SettingsContext';

interface DocumentPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: PrintableDocument | null;
  defaultFormat?: '80mm' | 'a4';
}

export const DocumentPrintModal: React.FC<DocumentPrintModalProps> = ({
  isOpen,
  onClose,
  document,
  defaultFormat = 'a4',
}) => {
  const { settings } = useSystemSettings();
  const [activeFormat, setActiveFormat] = useState<'80mm' | 'a4'>(defaultFormat);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !document) return null;

  const showFeedback = (msg: string) => {
    setDownloadSuccessMessage(msg);
    setTimeout(() => setDownloadSuccessMessage(null), 3000);
  };

  const handleDirectPrint = (format: '80mm' | 'a4') => {
    try {
      setIsProcessing(true);
      printDocument(document, format, settings);
      showFeedback(`Sent to ${format === '80mm' ? 'POS 80mm Thermal Printer' : 'A4 Office Printer'}`);
    } catch (err) {
      console.error('Print failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPdf = (format: '80mm' | 'a4') => {
    try {
      setIsProcessing(true);
      downloadDocumentPdf(document, format, settings);
      showFeedback(`Downloaded ${format.toUpperCase()} PDF`);
    } catch (err) {
      console.error('PDF Download failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadCsv = () => {
    try {
      downloadDocumentCsv(document, settings);
      showFeedback('Downloaded CSV spreadsheet');
    } catch (err) {
      console.error('CSV Download failed:', err);
    }
  };

  const handleDownloadHtml = (format: '80mm' | 'a4') => {
    try {
      downloadDocumentHtml(document, format, settings);
      showFeedback(`Downloaded offline ${format.toUpperCase()} HTML`);
    } catch (err) {
      console.error('HTML Download failed:', err);
    }
  };

  const docTitle = document.title || (
    document.type === 'quotation' ? 'Pro-forma Quotation' :
    document.type === 'invoice' ? 'Tax Invoice' :
    document.type === 'receipt' ? 'Official Receipt' :
    document.type === 'delivery_note' ? 'Delivery Note' :
    'Commercial Document'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in no-print">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100 animate-scale-up">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-brand-orange">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">{docTitle}</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-brand-orange font-bold">
                  {document.docNumber}
                </span>
                {document.status && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {document.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Client: <strong className="text-white">{document.customer.companyName || document.customer.name}</strong> • Date: {document.date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {downloadSuccessMessage && (
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{downloadSuccessMessage}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FORMAT SELECTION TABS & QUICK CONTROLS BAR */}
        <div className="px-6 py-3 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-750">
            <button
              onClick={() => setActiveFormat('80mm')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeFormat === '80mm'
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>POS 80mm Slip</span>
            </button>
            <button
              onClick={() => setActiveFormat('a4')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeFormat === 'a4'
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>A4 Corporate Sheet</span>
            </button>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2">
            {/* PRINT BUTTON */}
            <button
              onClick={() => handleDirectPrint(activeFormat)}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-white text-slate-900 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Printer className="w-4 h-4 text-brand-orange" />
              <span>Print {activeFormat === '80mm' ? 'POS 80mm' : 'A4'}</span>
            </button>

            {/* DOWNLOAD PDF */}
            <button
              onClick={() => handleDownloadPdf(activeFormat)}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Download {activeFormat.toUpperCase()} PDF</span>
            </button>

            {/* MORE EXPORT OPTIONS DROPDOWN GROUP */}
            <div className="flex items-center gap-1 border-l border-slate-750 pl-2">
              <button
                onClick={() => handleDownloadPdf(activeFormat === '80mm' ? 'a4' : '80mm')}
                className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title={`Download alternative ${activeFormat === '80mm' ? 'A4' : '80mm'} PDF`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>PDF ({activeFormat === '80mm' ? 'A4' : '80mm'})</span>
              </button>

              <button
                onClick={handleDownloadCsv}
                className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Download CSV Spreadsheet for Excel / ERP"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV</span>
              </button>

              <button
                onClick={() => handleDownloadHtml(activeFormat)}
                className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Download Standalone Offline HTML file"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>HTML</span>
              </button>
            </div>
          </div>
        </div>

        {/* LIVE DOCUMENT PREVIEW CANVAS */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-6 flex justify-center items-start">
          {activeFormat === '80mm' ? (
            /* 80MM THERMAL RECEIPT PREVIEW */
            <div className="w-[320px] bg-white text-slate-900 rounded-lg shadow-2xl p-4 font-mono text-[11px] border border-slate-300 animate-fade-in select-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: generatePos80mmHtml(document, settings)
                    .replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/i, '')
                    .replace(/<\/body>[\s\S]*?<\/html>/i, '')
                }}
              />
            </div>
          ) : (
            /* A4 CORPORATE SHEET PREVIEW */
            <div className="w-full max-w-3xl bg-white text-slate-900 rounded-lg shadow-2xl p-8 border border-slate-300 animate-fade-in select-none font-sans">
              <div
                dangerouslySetInnerHTML={{
                  __html: generateA4CorporateHtml(document, settings)
                    .replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/i, '')
                    .replace(/<\/body>[\s\S]*?<\/html>/i, '')
                }}
              />
            </div>
          )}
        </div>

        {/* FOOTER BAR */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-brand-orange" />
            <span>
              Previewing: <strong className="text-white">{activeFormat === '80mm' ? '80mm Thermal Paper (ESC/POS)' : 'A4 Full Letterhead Document'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>KRA eTIMS Standard: <strong>16% VAT Included</strong></span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPrintModal;
