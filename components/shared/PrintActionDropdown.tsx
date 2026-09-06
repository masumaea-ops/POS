import React, { useState, useRef, useEffect } from 'react';
import {
  Printer,
  Download,
  ChevronDown,
  Receipt,
  FileText,
  Eye,
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import {
  PrintableDocument,
  printDocument,
  downloadDocumentPdf,
  downloadDocumentCsv
} from '../../utils/documentPrinter';
import { useSystemSettings } from '../../contexts/SettingsContext';

interface PrintActionDropdownProps {
  document: PrintableDocument;
  onOpenPreview?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'compact' | 'dark';
}

export const PrintActionDropdown: React.FC<PrintActionDropdownProps> = ({
  document,
  onOpenPreview,
  className = '',
  variant = 'secondary',
}) => {
  const { settings } = useSystemSettings();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrint = (format: '80mm' | 'a4') => {
    printDocument(document, format, settings);
    setIsOpen(false);
  };

  const handleDownloadPdf = (format: '80mm' | 'a4') => {
    downloadDocumentPdf(document, format, settings);
    setIsOpen(false);
  };

  const handleDownloadCsv = () => {
    downloadDocumentCsv(document, settings);
    setIsOpen(false);
  };

  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-brand-orange hover:bg-orange-600 text-white font-bold shadow-md';
      case 'dark':
        return 'bg-slate-900 hover:bg-slate-950 text-white font-bold border border-slate-800 shadow-sm';
      case 'compact':
        return 'bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] py-1 px-2.5';
      case 'secondary':
      default:
        return 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold';
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div className="inline-flex rounded-xl shadow-xs overflow-hidden">
        {/* Primary Action Button: Opens Preview or Fast Print */}
        <button
          type="button"
          onClick={() => {
            if (onOpenPreview) {
              onOpenPreview();
            } else {
              handlePrint('a4');
            }
          }}
          className={`px-3 py-2 text-xs flex items-center gap-1.5 transition-all cursor-pointer ${getButtonStyles()}`}
          title="Print or Preview Document"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Export</span>
        </button>

        {/* Dropdown Toggle Caret */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`px-2 py-2 text-xs border-l border-white/20 transition-all cursor-pointer ${getButtonStyles()}`}
          aria-label="More print options"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-56 rounded-xl bg-slate-900 border border-slate-750 shadow-2xl z-50 py-1.5 text-xs text-slate-200 animate-slide-up">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center justify-between">
            <span>Print & Export Options</span>
            <span className="text-brand-orange font-mono">{document.docNumber}</span>
          </div>

          {/* Quick Print: POS 80mm */}
          <button
            type="button"
            onClick={() => handlePrint('80mm')}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="font-bold">Print POS 80mm Slip</div>
              <div className="text-[10px] text-slate-400">Thermal receipt printer</div>
            </div>
          </button>

          {/* Quick Print: A4 Document */}
          <button
            type="button"
            onClick={() => handlePrint('a4')}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <div>
              <div className="font-bold">Print A4 Document</div>
              <div className="text-[10px] text-slate-400">Office laser/inkjet letterhead</div>
            </div>
          </button>

          <div className="border-t border-slate-800 my-1" />

          {/* Download PDF: A4 Corporate */}
          <button
            type="button"
            onClick={() => handleDownloadPdf('a4')}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-brand-orange" />
            <div>
              <div className="font-bold">Download A4 PDF</div>
              <div className="text-[10px] text-slate-400">Official vector PDF document</div>
            </div>
          </button>

          {/* Download PDF: 80mm Slip */}
          <button
            type="button"
            onClick={() => handleDownloadPdf('80mm')}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <div>
              <div className="font-bold">Download 80mm PDF</div>
              <div className="text-[10px] text-slate-400">Digital thermal receipt PDF</div>
            </div>
          </button>

          {/* Download CSV */}
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="font-bold">Export to CSV</div>
              <div className="text-[10px] text-slate-400">Itemized spreadsheet ledger</div>
            </div>
          </button>

          {onOpenPreview && (
            <>
              <div className="border-t border-slate-800 my-1" />
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenPreview();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-brand-orange font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Interactive Preview & Setup</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PrintActionDropdown;
