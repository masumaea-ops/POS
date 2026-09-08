import React, { useState, useRef } from 'react';
import type { JobCard, DiagnosticReport, DiagnosticPdfAttachment, DiagnosticErrorCode } from '../../types';
import { DTC_LIBRARY } from '../../data/garageMockData';
import { 
  FileUp, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Cpu, 
  Activity, 
  Sliders, 
  Wrench, 
  Sparkles,
  ShieldCheck,
  Clock
} from 'lucide-react';

interface UploadScanReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard: JobCard;
  onSave: (pdfData: DiagnosticPdfAttachment, reportData?: Partial<DiagnosticReport>) => void;
}

const HARDWARE_SCANNER_OPTIONS = [
  'Autel MaxiSys MS909 / Ultra Pro',
  'Launch X-431 PAD VII / V+ 4.0',
  'Bosch KTS 590 / 560 ESI[tronic]',
  'Snap-on ZEUS+ / APOLLO-D9',
  'TOPDON Phoenix Smart / Max',
  'Masuma ECU Pro-Diag X900 Series',
  'Thinkcar ThinkTool Pros / Master',
  'G-Scan 3 Tab Dual-OS',
  'Custom / Other Hardware Scanner'
];

const SCAN_PROTOCOLS = [
  'ISO 15765-4 (CAN 29-bit 500Kbps)',
  'ISO 15765-4 (CAN 11-bit 250Kbps)',
  'ISO 14230-4 (KWP2000 Fast Init)',
  'ISO 9141-2 (5-baud init)',
  'SAE J1850 VPW (10.4 kbaud)',
  'DoIP (Diagnostic over IP / Ethernet)'
];

export const UploadScanReportModal: React.FC<UploadScanReportModalProps> = ({
  isOpen,
  onClose,
  jobCard,
  onSave
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [fileSizeFormatted, setFileSizeFormatted] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Scan metadata
  const existingReport = jobCard.diagnosticReport;
  const [scannerDevice, setScannerDevice] = useState<string>(
    existingReport?.scannerDevice || HARDWARE_SCANNER_OPTIONS[0]
  );
  const [protocolUsed, setProtocolUsed] = useState<string>(
    existingReport?.protocolUsed || SCAN_PROTOCOLS[0]
  );
  const [technicianName, setTechnicianName] = useState<string>(
    existingReport?.technicianName || jobCard.assignedTechnicianName || 'Eng. Eric Wanjala'
  );
  const [healthScore, setHealthScore] = useState<number>(
    existingReport?.overallHealthScore || 78
  );
  const [technicianNotes, setTechnicianNotes] = useState<string>(
    existingReport?.technicianNotes || 
    `OBD hardware scan report generated for vehicle ${jobCard.vehicle.plateNumber} (${jobCard.vehicle.make} ${jobCard.vehicle.model}, VIN: ${jobCard.vehicle.vin}). Report uploaded in PDF format for customer records and repair authorization.`
  );

  // Selected DTC Codes
  const [selectedDtcCodes, setSelectedDtcCodes] = useState<string[]>(
    existingReport?.faultCodes?.map(f => f.code) || ['P0300']
  );

  if (!isOpen) return null;

  // Format bytes to KB/MB
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const processFile = (file: File) => {
    setFileError('');

    // Strictly validate PDF
    const isPdfType = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdfType) {
      setFileError('Invalid file type. Please upload an official OBD scan report in PDF format (.pdf).');
      return;
    }

    // Check size limit: 15MB
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError('The selected PDF exceeds the 15MB size limit. Please upload a compressed scan report.');
      return;
    }

    setIsProcessingFile(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFileDataUrl(result);
      setSelectedFile(file);
      setFileSizeFormatted(formatBytes(file.size));
      setIsProcessingFile(false);
    };

    reader.onerror = () => {
      setFileError('Failed to read the PDF file. Please try selecting the file again.');
      setIsProcessingFile(false);
    };

    reader.readAsDataURL(file);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFileDataUrl('');
    setFileSizeFormatted('');
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate Sample OBD PDF for quick testing if user doesn't have a real PDF file handy
  const handleLoadSamplePdf = () => {
    // Generate a minimal valid data URI representing an OBD scan PDF
    // Using standard PDF base64 format with recognizable content
    const sampleFileName = `OBD_Scan_${jobCard.vehicle.plateNumber.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    
    // Minimal standard 1-page PDF byte string
    const samplePdfBase64 = 
      'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjEgMCBvYmoKPDwKL1RpdGxlIChNQVNVTUEgT0JELUlJIERJQUdOT1NUSUMgUkVQT1JUKQovQXV0aG9yIChNYXN1bWEgQXV0b21vdGl2ZSBDYXJlIFN5c3RlbSkKL0NyZWF0b3IgKEF1dGVsIE1heGlTeXMgVWx0cmEgUHJvKQovQ3JlYXRpb25EYXRlIChEOjIwMjYwOTA3MTIwMDAwWikKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDMgMCBSCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbNCAwIFJdCi9Db3VudCAxCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMyAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDUgMCBSCi9SZXNvdXJjZXMgPDwKL0ZvbnQgPDwKL0YxIDYgMCBSCi9GMiA3IDAgUgo+Pgo+Pgo+PgplbmRvYmoKNSAwIG9iago8PAovTGVuZ3RoIDQzMQo+PgpzdHJlYW0KQlQKL0YxIDE4IFRmCjUwIDcyMCBUZCAoTUFTVU1BIEFVVE9NT1RJVkUgLSBDT01QVVRFUklaRUQgT0JELUlJIFNDQU4gUkVQT1JUKVRqCi9GMiAxMSBUZgowIC0zMCBUZCAoVmVoaWNsZSBQbGF0ZTogJyArIGpvYkNhcmQudmVoaWNsZS5wbGF0ZU51bWJlciArICcgICAgIE1ha2UvTW9kZWw6ICcgKyBqb2JDYXJkLnZlaGljbGUubWFrZSArICcgJyArIGpvYkNhcmQudmVoaWNsZS5tb2RlbCArICkpVGoKMCAtMjAgVGQgKFZJTiBOdW1iZXI6ICcgKyBqb2JDYXJkLnZlaGljbGUudmluICsgJyAgICAgT2RvbWV0ZXI6ICcgKyBqb2JDYXJkLnZlaGljbGUubWlsZWFnZUttICsgJyBLTSlUagowIC0zMCBUZCAoU2Nhbm5lciBEZXZpY2U6IEF1dGVsIE1heGlTeXMgVWx0cmEgUHJvICAgICBQcm90b2NvbDogSVNPIDE1NzY1LTQgQ0FOKVRqCjAgLTIwIFRkIChTY2FuIERhdGU6IFNlcHRlbWJlciAyMDI2ICAgICBPdmVyYWxsIEhlYWx0aCBTY29yZTogNzglKVBqCjAgLTMwIFRkIChERVRFQ1RFRCBDT01QVVRFUiBGQVVMVCBDT0RFUzopVGoKMCAtMjAgVGQgKDEuIFAwMzAwIC0gUmFuZG9tL011bHRpcGxlIEN5bGluZGVyIE1pc2ZpcmUgRGV0ZWN0ZWQgW0FjdGl2ZV0pVGoKMCAtMjAgVGQgKDIuIFAwMTcxIC0gU3lzdGVtIFRvbyBMZWFuIEJhbmsgMSBbU3RvcmVkXSlUagowIC0zMCBUZCAoVEVDSE5JQ0lBTiBSRUNPTU1FTkRBVElPTlM6IFJlcGxhY2Ugc3BhcmsgcGx1Z3MsIGluc3BlY3QgbWFmIHNlbnNvciBhbmQgdmFjdXVtIGxpbmVzLilUagpFVAplbmRzdHJlYW0KZW5kb2JqCjYgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGQKPj4KZW5kb2JqCjcgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagp4cmVmCjAgOAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDE2NCAwMDAwMCBuIAowMDAwMDAwMjE2IDAwMDAwIG4gCjAwMDAwMDAyNzMgMDAwMDAgbiAKMDAwMDAwMDQxNiAwMDAwMCBuIAowMDAwMDAwOTAyIDAwMDAwIG4gCjAwMDAwMDA5NzQgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA4Ci9Sb290IDIgMCBSCj4+CnN0YXJ0eHJlZgoxMDQyCiUlRU9GCg==';

    setFileDataUrl(samplePdfBase64);
    setSelectedFile(new File([new Blob(['Sample OBD Report Content'], { type: 'application/pdf' })], sampleFileName, { type: 'application/pdf' }));
    setFileSizeFormatted('142.6 KB');
    setFileError('');
  };

  const toggleDtc = (code: string) => {
    setSelectedDtcCodes(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fileDataUrl || !selectedFile) {
      setFileError('Please select or drop a valid OBD scan report in PDF format.');
      return;
    }

    const pdfAttachment: DiagnosticPdfAttachment = {
      fileName: selectedFile.name,
      fileSize: fileSizeFormatted || formatBytes(selectedFile.size),
      uploadDate: new Date().toLocaleString(),
      fileDataUrl,
      uploadedBy: technicianName,
      scannerDevice,
      notes: technicianNotes
    };

    // Map selected DTCs
    const mappedFaults: DiagnosticErrorCode[] = selectedDtcCodes.map(code => {
      const existing = DTC_LIBRARY.find(d => d.code === code);
      if (existing) return existing;
      return {
        code,
        title: `ECU Diagnostic Trouble Code ${code}`,
        system: 'Engine / Transmission / Chassis',
        severity: 'Major',
        description: `Stored diagnostic code ${code} reported by ${scannerDevice}.`,
        recommendedFix: 'Perform circuit continuity inspection and component replacement.',
        estimatedLaborHours: 1.5
      };
    });

    const reportData: Partial<DiagnosticReport> = {
      scanDate: new Date().toLocaleString(),
      scannerDevice,
      protocolUsed,
      overallHealthScore: healthScore,
      faultCodes: mappedFaults,
      technicianNotes,
      technicianName,
      status: 'Completed'
    };

    onSave(pdfAttachment, reportData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-800 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-850 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-600/30 text-purple-400 border border-purple-500/40 flex items-center justify-center">
              <FileUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Upload OBD Scan Report (PDF)
                </h3>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold uppercase">
                  ECU Diagnostics
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Attach official diagnostic scanner export document for <strong className="text-white font-mono">{jobCard.vehicle.plateNumber}</strong> ({jobCard.vehicle.make} {jobCard.vehicle.model}).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 overflow-y-auto text-xs">
          {/* Target Vehicle Summary Card */}
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/70 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
            <div>
              <span className="text-slate-400 text-[9px] uppercase block">Vehicle Plate</span>
              <strong className="text-white font-black text-xs">{jobCard.vehicle.plateNumber}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[9px] uppercase block">Chassis / VIN</span>
              <span className="text-purple-300 font-bold truncate block">{jobCard.vehicle.vin}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[9px] uppercase block">Engine & Odo</span>
              <span className="text-slate-200">{jobCard.vehicle.mileageKm.toLocaleString()} KM</span>
            </div>
            <div>
              <span className="text-slate-400 text-[9px] uppercase block">Owner</span>
              <span className="text-slate-200 truncate block">{jobCard.vehicle.ownerName}</span>
            </div>
          </div>

          {/* 1. PDF FILE UPLOAD DROPZONE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-mono font-bold uppercase text-[11px] text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Diagnostic Scan Report PDF Document <span className="text-rose-400">*</span></span>
              </label>

              {/* Sample PDF shortcut */}
              <button
                type="button"
                onClick={handleLoadSamplePdf}
                className="text-[10px] font-mono text-purple-400 hover:text-purple-300 underline flex items-center gap-1 cursor-pointer"
                title="Quickly test with a simulated OBD Scan PDF"
              >
                <Sparkles className="w-3 h-3" />
                <span>Load Sample OBD PDF</span>
              </button>
            </div>

            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!selectedFile ? (
              /* Drag and Drop Zone */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                  isDragging
                    ? 'border-purple-500 bg-purple-500/10 scale-[0.99]'
                    : 'border-slate-700 bg-slate-800/40 hover:border-purple-500/60 hover:bg-slate-800/70'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <FileUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-white text-xs sm:text-sm">
                    Drag and drop your OBD Scan PDF here, or <span className="text-purple-400 underline">browse files</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Accepts official scanner reports in Adobe PDF format (.pdf) up to 15MB
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-slate-500">
                  <span>• Autel MaxiSys Export</span>
                  <span>• Launch X-431 PDF</span>
                  <span>• Bosch ESI Printout</span>
                </div>
              </div>
            ) : (
              /* Selected File Card */
              <div className="p-4 bg-purple-950/40 border border-purple-500/40 rounded-2xl flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-xs truncate">
                        {selectedFile.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold shrink-0">
                        Ready to Attach
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                      <span>Size: {fileSizeFormatted}</span>
                      <span>•</span>
                      <span>Format: Adobe PDF</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-mono text-[10px] transition cursor-pointer"
                  >
                    Change File
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                    title="Remove File"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {fileError && (
              <div className="p-2.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{fileError}</span>
              </div>
            )}
          </div>

          {/* 2. SCANNER HARDWARE & PROTOCOL SPECIFICATIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-mono font-bold uppercase text-[10px] text-slate-400 block mb-1">
                OBD-II Hardware Scanner Device
              </label>
              <select
                value={scannerDevice}
                onChange={(e) => setScannerDevice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-purple-500"
              >
                {HARDWARE_SCANNER_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-mono font-bold uppercase text-[10px] text-slate-400 block mb-1">
                Communication Bus / Protocol
              </label>
              <select
                value={protocolUsed}
                onChange={(e) => setProtocolUsed(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-purple-500"
              >
                {SCAN_PROTOCOLS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. DIAGNOSTIC SPECIALIST & VEHICLE HEALTH SCORE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-mono font-bold uppercase text-[10px] text-slate-400 block mb-1">
                Diagnostic Specialist / Technician
              </label>
              <input
                type="text"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                placeholder="e.g. Eng. Eric Wanjala"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-mono font-bold uppercase text-[10px] text-slate-400">
                  Vehicle Health Analysis Score
                </label>
                <span className="font-mono font-black text-xs text-purple-400">
                  {healthScore} / 100%
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="1"
                value={healthScore}
                onChange={(e) => setHealthScore(parseInt(e.target.value, 10))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          </div>

          {/* 4. DETECTED FAULT DTCs (TROUBLE CODES) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-mono font-bold uppercase text-[10px] text-slate-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Detected Trouble Codes (DTCs) in PDF Report</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {selectedDtcCodes.length} codes flagged
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DTC_LIBRARY.map(dtc => {
                const isSelected = selectedDtcCodes.includes(dtc.code);
                return (
                  <button
                    key={dtc.code}
                    type="button"
                    onClick={() => toggleDtc(dtc.code)}
                    className={`p-2 rounded-xl text-left border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-900/50 border-purple-500 text-white'
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <span className="font-mono font-black text-xs block">{dtc.code}</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{dtc.title}</span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. TECHNICIAN SUMMARY / FINDINGS */}
          <div>
            <label className="font-mono font-bold uppercase text-[10px] text-slate-400 block mb-1">
              Technician Diagnostic Summary & Recommendations
            </label>
            <textarea
              rows={3}
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              placeholder="Enter comprehensive findings from the uploaded OBD scan report..."
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-sans"
            ></textarea>
          </div>

          {/* Modal Footer / Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs font-mono transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!fileDataUrl || isProcessingFile}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-600/20 transition cursor-pointer"
            >
              <FileUp className="w-4 h-4" />
              <span>Attach & Save OBD Scan Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadScanReportModal;
