import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table, ChevronDown, Check, Loader2, Printer } from 'lucide-react';

export interface ExportDropdownProps {
  onExportPDF?: () => void | Promise<void>;
  onExportCSV?: () => void | Promise<void>;
  onPrint?: () => void;
  label?: string;
  pdfLabel?: string;
  csvLabel?: string;
  printLabel?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'emerald';
  className?: string;
  align?: 'left' | 'right';
  disabled?: boolean;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onExportPDF,
  onExportCSV,
  onPrint,
  label = 'Export',
  pdfLabel = 'Download PDF Document',
  csvLabel = 'Download CSV Spreadsheet',
  printLabel = 'Print Document View',
  size = 'md',
  variant = 'primary',
  className = '',
  align = 'right',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [lastAction, setLastAction] = useState<'pdf' | 'csv' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePDFClick = async () => {
    if (!onExportPDF) return;
    try {
      setIsExportingPDF(true);
      await onExportPDF();
      setLastAction('pdf');
      setTimeout(() => setLastAction(null), 2500);
    } catch (err) {
      console.error('PDF export failed', err);
    } finally {
      setIsExportingPDF(false);
      setIsOpen(false);
    }
  };

  const handleCSVClick = async () => {
    if (!onExportCSV) return;
    try {
      setIsExportingCSV(true);
      await onExportCSV();
      setLastAction('csv');
      setTimeout(() => setLastAction(null), 2500);
    } catch (err) {
      console.error('CSV export failed', err);
    } finally {
      setIsExportingCSV(false);
      setIsOpen(false);
    }
  };

  const handlePrintClick = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
    setIsOpen(false);
  };

  // Size styling
  const sizeStyles = {
    xs: 'px-2 py-1 text-[11px] gap-1',
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-xs font-bold gap-2',
    lg: 'px-4 py-2.5 text-sm font-bold gap-2',
  }[size];

  // Variant styling
  const variantStyles = {
    primary:
      'bg-brand-orange hover:bg-orange-600 text-white shadow-sm hover:shadow active:scale-[0.98]',
    secondary:
      'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
    outline:
      'bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-slate-300',
    emerald:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow active:scale-[0.98]',
  }[variant];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-center rounded-lg font-bold uppercase tracking-wider transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles} ${variantStyles}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {isExportingPDF || isExportingCSV ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
        ) : lastAction ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Download className="w-3.5 h-3.5 text-current" />
        )}
        <span>{lastAction ? 'Downloaded!' : label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 w-60 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 focus:outline-none animate-fadeIn ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/80">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Universal Document Export
            </span>
          </div>

          {onExportPDF && (
            <button
              type="button"
              onClick={handlePDFClick}
              disabled={isExportingPDF}
              className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-750 flex items-center justify-between group transition-colors"
              role="menuitem"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white leading-tight">PDF Document</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Formatted printable report</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
                .pdf
              </span>
            </button>
          )}

          {onExportCSV && (
            <button
              type="button"
              onClick={handleCSVClick}
              disabled={isExportingCSV}
              className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-750 flex items-center justify-between group transition-colors"
              role="menuitem"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Table className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white leading-tight">CSV Spreadsheet</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Structured Excel/Sheets data</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                .csv
              </span>
            </button>
          )}

          {onPrint && (
            <>
              <div className="my-1 border-t border-slate-100 dark:border-slate-700/80"></div>
              <button
                type="button"
                onClick={handlePrintClick}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 group transition-colors"
                role="menuitem"
              >
                <Printer className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
                <span className="font-medium text-[11px]">{printLabel}</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;
