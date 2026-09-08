import React from 'react';
import type { JobCard, DiagnosticPdfAttachment } from '../../types';
import { 
  FileText, 
  Download, 
  Printer, 
  ExternalLink, 
  X, 
  Cpu, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface ScanReportPdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard: JobCard;
  pdfAttachment: DiagnosticPdfAttachment;
  onRemove?: () => void;
  onReplace?: () => void;
}

export const ScanReportPdfViewerModal: React.FC<ScanReportPdfViewerModalProps> = ({
  isOpen,
  onClose,
  jobCard,
  pdfAttachment,
  onRemove,
  onReplace
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfAttachment.fileDataUrl;
    link.download = pdfAttachment.fileName || `OBD_Scan_${jobCard.vehicle.plateNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    const win = window.open();
    if (win) {
      win.document.write(
        `<iframe src="${pdfAttachment.fileDataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
    }
  };

  const handlePrint = () => {
    const iframe = document.getElementById('pdf-report-iframe') as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.print();
        return;
      } catch {
        // fallback
      }
    }
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 text-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-800 overflow-hidden my-auto flex flex-col h-[92vh]">
        {/* Top Control Bar */}
        <div className="p-4 sm:p-5 bg-slate-850 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 text-purple-400 border border-purple-500/40 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white truncate">
                  {pdfAttachment.fileName}
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase shrink-0">
                  Verified OBD PDF
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                <span>Vehicle: <strong className="text-slate-200">{jobCard.vehicle.plateNumber}</strong> ({jobCard.vehicle.make} {jobCard.vehicle.model})</span>
                <span>•</span>
                <span>Size: {pdfAttachment.fileSize}</span>
                <span>•</span>
                <span>Uploaded: {pdfAttachment.uploadDate}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              title="Download PDF File"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={handleOpenNewTab}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              title="Open PDF in Browser Window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Tab</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              title="Print Document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {onReplace && (
              <button
                onClick={onReplace}
                className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Replace with New PDF Scan Report"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Replace</span>
              </button>
            )}

            {onRemove && (
              <button
                onClick={onRemove}
                className="p-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/60 rounded-xl transition cursor-pointer"
                title="Delete PDF Attachment"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Embedded PDF Viewer Area */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col">
          <iframe
            id="pdf-report-iframe"
            src={pdfAttachment.fileDataUrl}
            title={pdfAttachment.fileName}
            className="w-full h-full border-none"
          />
        </div>

        {/* Footer Diagnostic Context Bar */}
        <div className="p-3 sm:p-4 bg-slate-850 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>Hardware Scanner: <strong className="text-white">{pdfAttachment.scannerDevice || 'Autel / OBD Hardware Tool'}</strong></span>
            <span>•</span>
            <span>Specialist: <strong className="text-purple-300">{pdfAttachment.uploadedBy || 'Eng. Eric Wanjala'}</strong></span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            {jobCard.diagnosticReport && (
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Health Score: {jobCard.diagnosticReport.overallHealthScore}%
              </span>
            )}
            <span className="text-slate-400">
              Chassis VIN: <strong className="text-slate-200">{jobCard.vehicle.vin}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanReportPdfViewerModal;
