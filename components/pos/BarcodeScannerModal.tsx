import React, { useState, useEffect, useRef } from 'react';
import type { Product } from '../../types';
import { X, Search } from 'lucide-react';
import { useSystemSettings } from '../../contexts/SettingsContext';

interface ScanLogEntry {
  timestamp: string;
  code: string;
  productName: string;
  brand: string;
  status: 'SUCCESS' | 'NOT_FOUND' | 'OUT_OF_STOCK';
  method: 'CAMERA' | 'HARDWARE' | 'SIMULATOR';
}

interface BarcodeScannerModalProps {
  products: Product[];
  onScanMatch: (product: Product) => void;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  products,
  onScanMatch,
  onClose,
}) => {
  const { formatPrice } = useSystemSettings();
  const [activeTab, setActiveTab] = useState<'camera' | 'hardware' | 'labels'>('camera');
  const [scanLogs, setScanLogs] = useState<ScanLogEntry[]>([]);
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [scanFlash, setScanFlash] = useState<string | null>(null); // To flash red scan laser animation
  const [searchLabelQuery, setSearchLabelQuery] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Play satisfying scan beep using Web Audio API Oscillation
  const playScanBeep = (freq = 1100, duration = 0.08) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);

      // Smooth volume fade-out to prevent popping artifacts
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (err) {
      console.warn('AudioContext beep blocked by safety sandbox rules', err);
    }
  };

  // Turn on device camera stream
  const startCamera = async () => {
    setCameraPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera capture error:', err);
      setCameraPermissionError(err.message || 'Permission denied or webcam busy.');
      setCameraActive(false);
    }
  };

  // Stop camera on tab changes or unmounting
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  // Matches a product scanned via camera, simulated label click, keyboard wedge or manual search
  const triggerMatchEvent = (codeValue: string, method: ScanLogEntry['method']) => {
    const clean = codeValue.trim().toLowerCase();
    
    // Search by exact SKU or OEM Part Code
    const match = products.find(
      (p) => p.sku.toLowerCase() === clean || (p.oemCode && p.oemCode.toLowerCase() === clean)
    );

    const currentTimeStr = new Date().toLocaleTimeString();

    if (match) {
      if (match.stock <= 0) {
        // Play error low chime
        playScanBeep(320, 0.25);
        setScanLogs((prev) => [
          {
            timestamp: currentTimeStr,
            code: codeValue,
            productName: match.name,
            brand: match.brand,
            status: 'OUT_OF_STOCK',
            method,
          },
          ...prev,
        ]);
        setScanFlash('OUT_OF_STOCK');
        setTimeout(() => setScanFlash(null), 600);
      } else {
        // Play perfect high registration beep
        playScanBeep(1150, 0.08);
        onScanMatch(match);
        setScanLogs((prev) => [
          {
            timestamp: currentTimeStr,
            code: codeValue,
            productName: match.name,
            brand: match.brand,
            status: 'SUCCESS',
            method,
          },
          ...prev,
        ]);
        setScanFlash('SUCCESS');
        setTimeout(() => setScanFlash(null), 350);
      }
    } else {
      // Play dual chime indicating not match
      playScanBeep(650, 0.12);
      setTimeout(() => playScanBeep(520, 0.12), 120);

      setScanLogs((prev) => [
        {
          timestamp: currentTimeStr,
          code: codeValue,
          productName: 'Unknown Label Query',
          brand: 'N/A',
          status: 'NOT_FOUND',
          method,
        },
        ...prev,
      ]);
      setScanFlash('NOT_FOUND');
      setTimeout(() => setScanFlash(null), 600);
    }
  };

  // Keyboard wedge listener inside the modal itself for physical hardware testing
  useEffect(() => {
    let internalBuffer = '';
    let internalLastTime = Date.now();

    const handleKeypress = (e: KeyboardEvent) => {
      // Prevent double triggers if focused inside text boxes
      const activeEl = document.activeElement?.tagName;
      if (activeEl === 'INPUT' || activeEl === 'TEXTAREA') {
        return;
      }

      const now = Date.now();
      if (now - internalLastTime > 250) {
        internalBuffer = '';
      }
      internalLastTime = now;

      if (e.key === 'Enter') {
        const payload = internalBuffer.trim();
        if (payload.length >= 3) {
          triggerMatchEvent(payload, 'HARDWARE');
        }
        internalBuffer = '';
      } else if (e.key.length === 1) {
        internalBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeypress);
    return () => {
      window.removeEventListener('keydown', handleKeypress);
    };
  }, [products]);

  // Deterministic aesthetic generator to render realistic SVG barcode lines for high fidelity visual mock data
  const generateBarcodeLines = (code: string) => {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const lines: Array<{ width: number; spacing: number }> = [];
    // Always start with exact border bars
    lines.push({ width: 2, spacing: 3 });
    lines.push({ width: 2, spacing: 2 });
    
    // Hash sequence logic
    for (let j = 0; j < 25; j++) {
      const val = Math.abs((hash ^ (j * 433)) % 10);
      if (val === 1 || val === 4) {
        lines.push({ width: 1, spacing: 2 });
      } else if (val === 2 || val === 6 || val === 8) {
        lines.push({ width: 3, spacing: 3 });
      } else if (val === 0 || val === 7) {
        lines.push({ width: 5, spacing: 2 });
      } else {
        lines.push({ width: 1.5, spacing: 4 });
      }
    }
    // Always end with exact border bars
    lines.push({ width: 2, spacing: 2 });
    lines.push({ width: 2, spacing: 3 });

    return lines;
  };

  // Filter products for Label Sheet Search
  const filteredLabelProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchLabelQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchLabelQuery.toLowerCase()) ||
    (p.oemCode && p.oemCode.toLowerCase().includes(searchLabelQuery.toLowerCase())) ||
    p.brand.toLowerCase().includes(searchLabelQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden max-h-[90vh] text-slate-900 dark:text-gray-100">
        
        {/* MODAL HEADER */}
        <header className="p-4 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏷️</span>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Fast Barcode & Label Scantron Platform
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Supports hardware wedge scanners, webcam capture & interactive simulator matrix
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-1.5 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-500 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* TOP COMPLIANCE TAB SWITCHER */}
        <div className="flex border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-1 shrink-0">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
              activeTab === 'camera'
                ? 'bg-brand-orange text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            📹 Digital Webcam Scanner
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
              activeTab === 'hardware'
                ? 'bg-brand-orange text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🔌 Keyboard Handheld Wedge (Standby)
          </button>
          <button
            onClick={() => setActiveTab('labels')}
            className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
              activeTab === 'labels'
                ? 'bg-brand-orange text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🖨️ Simulated Barcode Sheet
          </button>
        </div>

        {/* MAIN SPLIT PANEL GRID BODY */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0">
          
          {/* LEFT: ACTIVE TAB CONSOLE INTERFACES (7 cols) */}
          <div className="lg:col-span-7 p-6 border-r border-slate-150 dark:border-slate-800 overflow-y-auto space-y-4">
            
            {/* 1. CAMERA TAB */}
            {activeTab === 'camera' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-150 dark:border-slate-750">
                  <div>
                    <span className="text-xs font-bold block text-slate-800 dark:text-gray-200">
                      Camera Stream Ingress
                    </span>
                    <span className="text-[10px] text-slate-450 font-mono">
                      Dynamic environmental camera barcode interpreter
                    </span>
                  </div>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] uppercase font-black tracking-wide text-emerald-600 dark:text-emerald-400">
                      Auto Focus
                    </span>
                  </span>
                </div>

                {/* DEVICE CAMERA RENDER WRAPPER */}
                <div className="relative aspect-video w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex flex-col justify-center items-center">
                  
                  {cameraActive && !cameraPermissionError ? (
                    <>
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                      />
                      
                      {/* FUTURISTIC MATRIX SCAN TARGET GLASS */}
                      <div className="absolute inset-0 border-[3px] border-emerald-500/20 m-6 rounded-xl flex items-center justify-center">
                        <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl"></div>
                        <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr"></div>
                        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl"></div>
                        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br"></div>
                        
                        {/* RED PULSING LASER PATH */}
                        <div className="w-full bg-red-600/60 h-0.5 animate-pulse relative shadow-[0_0_12px_rgba(239,68,68,1)]">
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                        </div>
                      </div>

                      {/* HUD overlay stream information */}
                      <div className="absolute bottom-2 left-2 bg-slate-900/80 p-1 px-2.5 rounded-md text-[9px] font-mono text-slate-400 tracking-wider">
                        ISO COMPLIANT • 60 FPS • ENV_ENV_DECODING_ACTIVE
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center text-slate-400 space-y-4 max-w-sm">
                      <div className="w-16 h-16 bg-slate-800/80 rounded-full flex items-center justify-center mx-auto border border-slate-700">
                        <span className="text-2xl text-slate-400">📷</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-200">
                          {cameraPermissionError || 'Live Feed Standby / Direct Mock Testing'}
                        </p>
                        <p className="text-[10px] leading-relaxed text-slate-400">
                          {cameraPermissionError 
                            ? 'The browser has denied standard camera permissions. Use the Label Sheet tab to simulated scanning with real physical feedback!' 
                            : 'If your device lacks a web camera or frames deny system authorization, please swap to Interactive Labels matrix for testing.'}
                        </p>
                      </div>
                      <button
                        onClick={startCamera}
                        className="py-1.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] uppercase rounded-lg border border-slate-700 transition"
                      >
                        🔄 Re-Initialize Sensor
                      </button>
                    </div>
                  )}

                  {/* FLASH ACTION CHIME OVERLAY STATS */}
                  {scanFlash && (
                    <div className={`absolute inset-0 z-10 flex items-center justify-center transition-all duration-300 font-mono text-center bg-slate-950/80`}>
                      <div className="p-4 rounded-xl max-w-xs space-y-2 animate-bounce">
                        {scanFlash === 'SUCCESS' && (
                          <>
                            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500 rounded-full flex items-center justify-center mx-auto">
                              <span className="text-emerald-500 text-xl font-bold">✓</span>
                            </div>
                            <h4 className="text-xs font-black text-emerald-400 uppercase">Match Registered</h4>
                            <p className="text-[10px] text-slate-350">Product catalog verified. Added to active sale ticket.</p>
                          </>
                        )}
                        {scanFlash === 'OUT_OF_STOCK' && (
                          <>
                            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500 rounded-full flex items-center justify-center mx-auto">
                              <span className="text-amber-500 text-xl font-bold">!</span>
                            </div>
                            <h4 className="text-xs font-black text-amber-500 uppercase">Product Blocked</h4>
                            <p className="text-[10px] text-slate-350">This physical part is currently zero-stock. Procurement PO required.</p>
                          </>
                        )}
                        {scanFlash === 'NOT_FOUND' && (
                          <>
                            <div className="w-12 h-12 bg-red-500/10 border border-red-500 rounded-full flex items-center justify-center mx-auto">
                              <span className="text-red-500 text-xl">✗</span>
                            </div>
                            <h4 className="text-xs font-black text-red-500 uppercase">Unrecognized Code</h4>
                            <p className="text-[10px] text-slate-350">Code not associated to active stock. Check bin code.</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* EMULATOR MANUAL TYPED CODE */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-750">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                    Type Code to Emulate Scanner Input
                  </label>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    Mimic the instant wedge buffer string. Press enter to dispatch scanned data packet.
                  </p>
                  <div className="mt-2.5 flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 90915-YZZD2, MS-BP-001..."
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && manualCode) {
                          triggerMatchEvent(manualCode, 'SIMULATOR');
                          setManualCode('');
                        }
                      }}
                      className="flex-1 p-2 bg-white dark:bg-slate-900 border text-xs font-mono rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    />
                    <button
                      onClick={() => {
                        if (manualCode) {
                          triggerMatchEvent(manualCode, 'SIMULATOR');
                          setManualCode('');
                        }
                      }}
                      className="py-2 px-5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-bold uppercase rounded-lg shadow transition"
                    >
                      Dispatch
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. HARDWARE TAB */}
            {activeTab === 'hardware' && (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-4">
                  <div className="h-16 w-16 bg-brand-orange/10 text-brand-orange text-3xl flex items-center justify-center rounded-full mx-auto border border-brand-orange/20">
                    🔌
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Keyboard Wedge Hardware Connection Active
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-gray-350 max-w-md mx-auto leading-relaxed">
                      Our system listens globally in the background for any physical USB, Bluetooth, or RFID scanning terminal input. They act identically to an instant keyboard buffer sequence terminating with an <span className="p-1 px-1.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-mono font-bold font-amber-600">Enter</span> command.
                    </p>
                  </div>

                  {/* Wedge state animation */}
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg inline-flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                    <span>Wedge Terminal Hook:</span>
                    <strong className="text-white font-bold">READY & LISTENING KEYS GLOBAL</strong>
                  </div>
                </div>

                {/* HARDWARE DIAGNOSTIC HELP */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                    Verification instructions for real hardware
                  </h4>
                  <ul className="space-y-2.5 text-[11px] font-mono list-decimal pl-4 text-slate-500 dark:text-gray-400">
                    <li>Connect your physical USB, wireless dongle or Bluetooth hand-scanner.</li>
                    <li>No special configurations are needed. Keep this dashboard or main POS page open.</li>
                    <li>Ensure you do not have another cursor input focused inside specific edit text fields (it automatically hooks scans to prevent double typing into address fields).</li>
                    <li>Pull the scanner trigger on any product barcode label. The registration chime is automated instantly!</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 3. LABELS SHEET TAB */}
            {activeTab === 'labels' && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white">
                      Print-Ready Simulation Barcode Labels Sheet
                    </h3>
                    <p className="text-[10px] text-slate-404 font-mono">
                      Instantly click any generated label to simulate a real, high-speed physical scan laser reading!
                    </p>
                  </div>
                  
                  {/* SEARCH SHEET BOX */}
                  <div className="relative w-full md:w-56">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-450">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Filter barcodes sheet..."
                      value={searchLabelQuery}
                      onChange={(e) => setSearchLabelQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border rounded text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                {/* GRID OF LABELS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[360px] overflow-y-auto pr-1">
                  {filteredLabelProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => triggerMatchEvent(p.oemCode || p.sku, 'SIMULATOR')}
                      className={`group hover:scale-[1.01] hover:shadow-md cursor-pointer border rounded-xl overflow-hidden bg-white dark:bg-slate-800 overflow-hidden flex flex-col justify-between transition relative border-slate-200 dark:border-slate-700/85 ${
                        p.stock === 0 ? 'opacity-55' : ''
                      }`}
                    >
                      {/* Label upper headers */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-750/50 border-b border-slate-150 dark:border-slate-700 flex justify-between items-start">
                        <div className="max-w-[75%]">
                          <span className="text-[8px] bg-slate-900 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wider block w-fit mb-1 font-sans">
                            {p.brand} Quality Parts
                          </span>
                          <h4 className="font-extrabold text-[11px] text-slate-900 dark:text-white truncate font-sans">
                            {p.name}
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black block font-mono">{formatPrice(p.price)}</span>
                          <span className="text-[8px] font-mono text-slate-450 uppercase block">bin: {p.binLocation || 'Rack A'}</span>
                        </div>
                      </div>

                      {/* Barcode representation container */}
                      <div className="p-4 bg-white dark:bg-slate-100 text-center flex flex-col items-center justify-center space-y-1 group-hover:bg-amber-500/5 transition">
                        
                        {/* THE BARCODE SVG LINES */}
                        <svg className="w-full h-11 pointer-events-none" viewBox="0 0 100 24" preserveAspectRatio="none">
                          <g fill="currentColor" className="text-black group-hover:text-amber-600 transition-colors">
                            {/* Deterministic lines generator projection */}
                            {generateBarcodeLines(p.oemCode || p.sku).reduce(
                              (acc: { currentX: number; nodes: React.ReactNode[] }, line, idx) => {
                                acc.nodes.push(
                                  <rect
                                    key={idx}
                                    x={acc.currentX}
                                    y={0}
                                    width={line.width}
                                    height={24}
                                  />
                                );
                                acc.currentX += line.width + line.spacing;
                                return acc;
                              },
                              { currentX: 5, nodes: [] }
                            ).nodes}
                          </g>
                        </svg>

                        <div className="flex justify-between w-full max-w-[85%] text-[8px] font-bold text-slate-700 dark:text-zinc-950 font-mono tracking-widest leading-none pt-0.5">
                          <span>SKU: {p.sku}</span>
                          {p.oemCode && <span>OEM: {p.oemCode}</span>}
                        </div>
                      </div>

                      {/* Action status bar click helper */}
                      <div className="p-1.5 py-2 text-center text-[9px] uppercase font-bold bg-slate-50 dark:bg-slate-700/60 font-mono flex items-center justify-center gap-1 border-t border-slate-100 dark:border-slate-700 text-slate-500 dark:text-gray-300 group-hover:text-brand-orange group-hover:bg-brand-orange/5 transition">
                        <span>⚡</span>
                        <span>Click barcode area to trigger Scan Laser</span>
                        {p.stock === 0 && <span className="text-red-500 font-bold ml-1">• OUT OF STOCK</span>}
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT: REAL-TIME LEDGER LOGS & STATS (5 cols) */}
          <div className="lg:col-span-12 xl:col-span-5 p-6 bg-slate-50 dark:bg-slate-900/60 flex flex-col justify-between overflow-y-auto">
            
            <div className="space-y-4">
              <div className="border-b dark:border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase text-slate-850 dark:text-gray-200 tracking-wider">
                  Live Scanner Event Telemetry
                </h3>
                <p className="text-[10px] text-slate-404 font-mono">
                  Real-time transaction log of parsed optical barcode signatures.
                </p>
              </div>

              {/* STATS TILES */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-750 text-center shadow-xs">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider leading-none">Total</span>
                  <strong className="text-base font-black font-mono mt-1 text-slate-850 dark:text-white block">
                    {scanLogs.length}
                  </strong>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-750 text-center shadow-xs">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider leading-none">Matches</span>
                  <strong className="text-base font-black font-mono mt-1 text-emerald-500 block">
                    {scanLogs.filter((l) => l.status === 'SUCCESS').length}
                  </strong>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-750 text-center shadow-xs">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider leading-none">Declines</span>
                  <strong className="text-base font-black font-mono mt-1 text-rose-500 block">
                    {scanLogs.filter((l) => l.status !== 'SUCCESS').length}
                  </strong>
                </div>
              </div>

              {/* CHRONOLOGICAL EVENT FEED SCROLLER */}
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {scanLogs.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 font-mono text-[10px]">
                     🚀 Waiting for optical barcode data inputs...
                  </div>
                ) : (
                  scanLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-[10px] font-mono flex items-center justify-between ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-150 dark:border-emerald-900/40'
                          : log.status === 'OUT_OF_STOCK'
                          ? 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-150 dark:border-amber-900/40'
                          : 'bg-rose-50/40 dark:bg-rose-950/15 border-rose-150 dark:border-rose-900/40'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[8px] font-semibold tracking-wider ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-400'
                                : log.status === 'OUT_OF_STOCK'
                                ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-400'
                                : 'bg-rose-100 dark:bg-rose-900/50 text-rose-808 dark:text-rose-400'
                            }`}
                          >
                            {log.status === 'SUCCESS' ? 'MATCH OK' : log.status === 'OUT_OF_STOCK' ? 'OUT_STOCK' : 'NO_CATALOG'}
                          </span>
                          <span className="text-slate-400 font-normal">{log.timestamp}</span>
                          <span className="text-slate-400 font-normal">• {log.method}</span>
                        </div>
                        <p className="text-slate-900 dark:text-zinc-100 font-sans font-extrabold text-[11px] leading-tight mt-1">
                          {log.productName}
                        </p>
                        <p className="text-slate-500 text-[9px] mt-0.5 font-mono">
                          Parsed input: <span className="font-bold text-slate-800 dark:text-zinc-200">{log.code}</span>
                        </p>
                      </div>

                      {log.status === 'SUCCESS' && (
                        <span className="text-lg text-emerald-500">✓</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* LOWER COMPLIANCE ACTIONS FOOTER */}
            <div className="pt-4 border-t dark:border-slate-800 mt-4 space-y-2 shrink-0">
               <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Hardware Wedges Status:</span>
                  <span className="text-emerald-500 font-bold uppercase tracking-wider">● Online</span>
               </div>
               <button
                 onClick={onClose}
                 className="p-3 bg-slate-905 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border text-xs font-black uppercase text-center block w-full rounded-xl"
               >
                 Return to Cash Register
               </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
