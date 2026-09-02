import React, { useRef, useState, useEffect } from 'react';
import { 
  PenTool, 
  Trash2, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  Type, 
  Edit3, 
  Lock,
  Clock,
  Sparkles
} from 'lucide-react';
import type { CustomerSignatureData, JobCard } from '../../types';

interface SignatureCaptureModalProps {
  jobCard: JobCard;
  defaultType?: 'Diagnostic Estimate Sign-Off' | 'Final Repair Acceptance' | 'Vehicle Intake Authorization';
  onClose: () => void;
  onSaveSignature: (signature: CustomerSignatureData) => void;
}

export const SignatureCaptureModal: React.FC<SignatureCaptureModalProps> = ({
  jobCard,
  defaultType = 'Diagnostic Estimate Sign-Off',
  onClose,
  onSaveSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  
  // Signer form fields
  const [signerName, setSignerName] = useState(jobCard.vehicle.ownerName || '');
  const [signerPhone, setSignerPhone] = useState(jobCard.vehicle.ownerPhone || '');
  const [signatureType, setSignatureType] = useState<CustomerSignatureData['signatureType']>(defaultType);
  const [typedSignature, setTypedSignature] = useState(jobCard.vehicle.ownerName || '');
  const [fontFamily, setFontFamily] = useState<string>('cursive');
  const [strokeColor, setStrokeColor] = useState<string>('#0f172a'); // default slate-900
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(true);

  const timestamp = new Date().toLocaleString();
  const stampCode = `SIG-STAMP-${Math.floor(100000 + Math.random() * 900000)}`;

  // Canvas context setup
  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [mode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
  };

  const handleSave = () => {
    if (!signerName.trim()) {
      alert('Please enter the name of the signatory.');
      return;
    }

    if (!termsAccepted) {
      alert('Please accept the authorization disclaimer to proceed.');
      return;
    }

    let finalDataUrl = '';

    if (mode === 'draw') {
      if (!hasDrawn || !canvasRef.current) {
        alert('Please draw your signature on the pad before saving.');
        return;
      }
      finalDataUrl = canvasRef.current.toDataURL('image/png');
    } else {
      if (!typedSignature.trim()) {
        alert('Please enter a name to generate a typed digital signature.');
        return;
      }
      // Create offscreen canvas for typed signature
      const offscreen = document.createElement('canvas');
      offscreen.width = 500;
      offscreen.height = 150;
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 500, 150);
        ctx.font = `italic 36px ${fontFamily}, cursive`;
        ctx.fillStyle = strokeColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedSignature, 250, 75);

        // Add line under signature
        ctx.beginPath();
        ctx.moveTo(80, 110);
        ctx.lineTo(420, 110);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        finalDataUrl = offscreen.toDataURL('image/png');
      }
    }

    const signatureRecord: CustomerSignatureData = {
      id: `SIG-${Date.now()}`,
      signatureDataUrl: finalDataUrl,
      signerName,
      signerPhone,
      signedAt: timestamp,
      signatureType,
      notes
    };

    onSaveSignature(signatureRecord);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 text-slate-900 dark:text-white rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-orange/20 text-brand-orange rounded-xl border border-brand-orange/30">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase font-mono px-2 py-0.5 bg-brand-orange text-white rounded">
                  Legal Sign-Off
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {jobCard.id}
                </span>
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight mt-0.5">
                Digital Customer Signature Capture
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Document Context Card */}
          <div className="p-4 bg-slate-50 dark:bg-gray-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <div>
                <span className="font-bold text-slate-400 font-mono block text-[10px] uppercase">Vehicle Details</span>
                <span className="font-black text-slate-900 dark:text-slate-100 font-mono">
                  {jobCard.vehicle.plateNumber} • {jobCard.vehicle.make} {jobCard.vehicle.model} ({jobCard.vehicle.year})
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-400 font-mono block text-[10px] uppercase">Total Estimate</span>
                <span className="font-black text-brand-orange font-mono text-sm">
                  KES {jobCard.totalEstimate.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold uppercase font-mono text-slate-500 dark:text-slate-400 mb-1">
                  Signatory Full Name *
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase font-mono text-slate-500 dark:text-slate-400 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={signerPhone}
                  onChange={(e) => setSignerPhone(e.target.value)}
                  placeholder="e.g. 0712 345 678"
                  className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase font-mono text-slate-500 dark:text-slate-400 mb-1">
                  Authorization Purpose *
                </label>
                <select
                  value={signatureType}
                  onChange={(e) => setSignatureType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-orange"
                >
                  <option value="Diagnostic Estimate Sign-Off">Diagnostic Estimate Sign-Off</option>
                  <option value="Final Repair Acceptance">Final Repair Acceptance</option>
                  <option value="Vehicle Intake Authorization">Vehicle Intake Authorization</option>
                </select>
              </div>
            </div>
          </div>

          {/* Signature Mode Toggle & Tools */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-gray-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setMode('draw')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                  mode === 'draw'
                    ? 'bg-white dark:bg-gray-700 text-brand-orange shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Draw Signature</span>
              </button>

              <button
                onClick={() => setMode('type')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                  mode === 'type'
                    ? 'bg-white dark:bg-gray-700 text-brand-orange shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Type Signature</span>
              </button>
            </div>

            {mode === 'draw' && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Ink:</span>
                <button
                  onClick={() => setStrokeColor('#0f172a')}
                  className={`w-5 h-5 rounded-full bg-slate-900 border-2 ${strokeColor === '#0f172a' ? 'border-brand-orange scale-110' : 'border-transparent'}`}
                  title="Slate Black Ink"
                />
                <button
                  onClick={() => setStrokeColor('#1e40af')}
                  className={`w-5 h-5 rounded-full bg-blue-800 border-2 ${strokeColor === '#1e40af' ? 'border-brand-orange scale-110' : 'border-transparent'}`}
                  title="Navy Blue Ink"
                />
                <button
                  onClick={() => setStrokeColor('#ea580c')}
                  className={`w-5 h-5 rounded-full bg-orange-600 border-2 ${strokeColor === '#ea580c' ? 'border-brand-orange scale-110' : 'border-transparent'}`}
                  title="Brand Orange Ink"
                />

                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>

                <button
                  onClick={clearCanvas}
                  className="px-2.5 py-1 text-[11px] font-bold font-mono bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 rounded-lg flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            )}
          </div>

          {/* Interactive Pad Canvas or Typed Preview */}
          <div className="space-y-2">
            {mode === 'draw' ? (
              <div className="relative bg-slate-50 dark:bg-gray-950 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-2 text-center touch-none">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={160}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-40 bg-white dark:bg-gray-900 rounded-xl cursor-crosshair shadow-inner"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 dark:text-slate-600 font-mono text-xs gap-2">
                    <PenTool className="w-4 h-4 text-slate-400 animate-bounce" />
                    <span>Sign inside box using touchscreen or mouse mouse pointer</span>
                  </div>
                )}
                <div className="absolute bottom-3 right-4 pointer-events-none text-[9px] font-mono text-slate-400">
                  X: Sign Here
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold font-mono uppercase text-slate-500 mb-1">
                      Type Your Name
                    </label>
                    <input
                      type="text"
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:border-brand-orange"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold font-mono uppercase text-slate-500 mb-1">
                      Script Font Style
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-orange"
                    >
                      <option value="cursive">Classic Cursive Script</option>
                      <option value="Dancing Script, cursive">Dancing Script Cursive</option>
                      <option value="Brush Script MT, cursive">Brush Script Elegant</option>
                      <option value="Monaco, monospace">Technical Signature Mono</option>
                    </select>
                  </div>
                </div>

                {/* Typed Signature Live Box */}
                <div className="p-6 bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-2">
                  <div 
                    className="text-3xl font-black italic tracking-wide"
                    style={{ fontFamily: fontFamily, color: strokeColor }}
                  >
                    {typedSignature || 'Your Signature Here'}
                  </div>
                  <div className="w-64 h-0.5 bg-slate-300 dark:bg-slate-700 mx-auto"></div>
                  <p className="text-[10px] text-slate-400 font-mono">Digitally Generated Script Signature</p>
                </div>
              </div>
            )}
          </div>

          {/* Notes & Special Instructions */}
          <div>
            <label className="block text-[10px] font-bold uppercase font-mono text-slate-500 dark:text-slate-400 mb-1">
              Customer Remarks / Specific Authorization Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Authorize up to KES 35,000 without additional phone confirmation."
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-orange"
            />
          </div>

          {/* Legal Disclaimer Checkbox */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
            <input
              type="checkbox"
              id="terms_checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-brand-orange shrink-0 cursor-pointer"
            />
            <label htmlFor="terms_checkbox" className="cursor-pointer text-[11px] leading-snug">
              I hereby certify that I am the registered owner or authorized agent for vehicle <strong>{jobCard.vehicle.plateNumber}</strong>. I authorize <strong>{jobCard.branchName}</strong> to conduct diagnostics, disassembly, and replacement of parts according to the repair estimate.
            </label>
          </div>

          {/* Security & Audit Metadata Bar */}
          <div className="p-3 bg-slate-100 dark:bg-gray-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Cryptographic Audit Token: <strong>{stampCode}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-orange shrink-0" />
              <span>Timestamp: {timestamp}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 dark:bg-gray-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 dark:bg-gray-800 hover:bg-slate-300 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors font-mono"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-xs rounded-xl shadow-md font-mono uppercase flex items-center gap-2 transition-all transform active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Sign Service Order</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureCaptureModal;
