import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import type { Product, SaleOrder, PurchaseOrder } from '../../types';
import { 
  X, Camera, Flashlight, RefreshCw, Upload, Search, 
  CheckCircle2, AlertTriangle, FileText, Package, 
  ShoppingCart, ShieldCheck, Printer, Zap, Sparkles, Layers, SlidersHorizontal
} from 'lucide-react';
import { useSystemSettings } from '../../contexts/SettingsContext';
import { generateQRCodeDataURL } from '../../utils/qrCodeGenerator';

export interface ScanLogEntry {
  id: string;
  timestamp: string;
  rawCode: string;
  parsedType: 'PRODUCT' | 'ORDER' | 'PURCHASE_ORDER' | 'UNKNOWN';
  title: string;
  subtitle: string;
  status: 'SUCCESS' | 'OUT_OF_STOCK' | 'NOT_FOUND';
  method: 'CAMERA' | 'IMAGE_UPLOAD' | 'HARDWARE' | 'SIMULATOR';
  dataRef?: any;
}

interface QRScannerModalProps {
  products: Product[];
  salesOrders?: SaleOrder[];
  purchaseOrders?: PurchaseOrder[];
  mode?: 'all' | 'products_only' | 'orders_only';
  onScanProduct?: (product: Product) => void;
  onScanOrder?: (order: SaleOrder) => void;
  onScanPurchaseOrder?: (po: PurchaseOrder) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  products,
  salesOrders = [],
  purchaseOrders = [],
  mode = 'all',
  onScanProduct,
  onScanOrder,
  onScanPurchaseOrder,
  onClose,
  title = 'Fast QR & Barcode Scanner Station',
  subtitle = 'Camera sensor, file decoder, keyboard wedge & interactive catalog test matrix'
}) => {
  const { formatPrice } = useSystemSettings();
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'labels' | 'hardware'>('camera');
  
  // Camera Stream States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasTorchCapability, setHasTorchCapability] = useState(false);
  const [isScanningActive, setIsScanningActive] = useState(true);

  // Scan HUD & Log states
  const [scanFlash, setScanFlash] = useState<'SUCCESS' | 'OUT_OF_STOCK' | 'NOT_FOUND' | null>(null);
  const [lastScannedResult, setLastScannedResult] = useState<ScanLogEntry | null>(null);
  const [scanLogs, setScanLogs] = useState<ScanLogEntry[]>([]);
  const [manualCode, setManualCode] = useState('');
  const [searchLabelQuery, setSearchLabelQuery] = useState('');
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastScanTimestampRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');

  // Audio tone generator
  const playBeep = (freq = 1150, duration = 0.08, type: OscillatorType = 'sine') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio autoplay may be guarded in some sandbox contexts
    }
  };

  // Device haptic vibration feedback
  const triggerHaptic = (pattern: number | number[] = [40, 20, 40]) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {}
  };

  // -------------------------------------------------------------
  // INTELLIGENT CODE PARSER & MATCHER
  // -------------------------------------------------------------
  const parseScannedPayload = useCallback((raw: string, method: ScanLogEntry['method']) => {
    const rawTrimmed = raw.trim();
    if (!rawTrimmed) return;

    // Avoid immediate duplicate spam scans within 1500ms
    const now = Date.now();
    if (rawTrimmed === lastScannedCodeRef.current && now - lastScanTimestampRef.current < 1500) {
      return;
    }
    lastScanTimestampRef.current = now;
    lastScannedCodeRef.current = rawTrimmed;

    let targetCode = rawTrimmed;
    let targetTypeHint: 'PRODUCT' | 'ORDER' | 'PO' | null = null;

    // Check if payload is structured JSON e.g. {"sku":"MS-BP-001"} or {"orderId":"SO-2024-115"}
    if (targetCode.startsWith('{') && targetCode.endsWith('}')) {
      try {
        const json = JSON.parse(targetCode);
        if (json.sku) {
          targetCode = json.sku;
          targetTypeHint = 'PRODUCT';
        } else if (json.oemCode) {
          targetCode = json.oemCode;
          targetTypeHint = 'PRODUCT';
        } else if (json.orderId || json.id) {
          targetCode = json.orderId || json.id;
          targetTypeHint = json.type === 'purchase_order' ? 'PO' : 'ORDER';
        }
      } catch {}
    }

    // Check if payload is MASUMA URL format e.g. https://masuma.ea/sku/MS-BP-001 or .../orders/SO-2024-115
    if (targetCode.includes('/')) {
      const parts = targetCode.split('/');
      const lastSegment = parts[parts.length - 1];
      if (lastSegment && lastSegment.length >= 3) {
        targetCode = lastSegment;
      }
    }

    // Check if payload has MASUMA: prefix (e.g. MASUMA:SKU:MS-BP-001 or MASUMA:ORDER:SO-2024-115)
    if (targetCode.toUpperCase().startsWith('MASUMA:')) {
      const parts = targetCode.split('|')[0].split(':');
      if (parts[1]?.toUpperCase() === 'SKU' && parts[2]) {
        targetCode = parts[2];
        targetTypeHint = 'PRODUCT';
      } else if (parts[1]?.toUpperCase() === 'ORDER' && parts[2]) {
        targetCode = parts[2];
        targetTypeHint = 'ORDER';
      } else if (parts[1]?.toUpperCase() === 'PO' && parts[2]) {
        targetCode = parts[2];
        targetTypeHint = 'PO';
      }
    }

    const clean = targetCode.trim().toLowerCase();
    const timeStr = new Date().toLocaleTimeString();

    // 1. Try matching ORDER (if not restricted to products_only)
    if (mode !== 'products_only' && (targetTypeHint === 'ORDER' || targetTypeHint === null)) {
      // Check in passed salesOrders or localStorage
      let allOrders = salesOrders;
      if (allOrders.length === 0) {
        const saved = localStorage.getItem('masuma_sales_orders');
        if (saved) {
          try { allOrders = JSON.parse(saved); } catch {}
        }
      }

      const orderMatch = allOrders.find(o => 
        o.id.toLowerCase() === clean || 
        o.id.toLowerCase().replace(/[^a-z0-9]/g, '') === clean.replace(/[^a-z0-9]/g, '')
      );

      if (orderMatch) {
        playBeep(1250, 0.12);
        triggerHaptic([30, 30, 60]);
        setScanFlash('SUCCESS');
        setTimeout(() => setScanFlash(null), 500);

        const logEntry: ScanLogEntry = {
          id: `log-${Date.now()}`,
          timestamp: timeStr,
          rawCode: rawTrimmed,
          parsedType: 'ORDER',
          title: `Order Verified: ${orderMatch.id}`,
          subtitle: `Customer: ${orderMatch.customer.name} • ${formatPrice(orderMatch.total)} [${orderMatch.status}]`,
          status: 'SUCCESS',
          method,
          dataRef: orderMatch
        };

        setLastScannedResult(logEntry);
        setScanLogs(prev => [logEntry, ...prev]);

        if (onScanOrder) {
          onScanOrder(orderMatch);
        }
        return;
      }
    }

    // 2. Try matching PURCHASE ORDER
    if (mode !== 'products_only' && (targetTypeHint === 'PO' || targetTypeHint === null)) {
      const poMatch = purchaseOrders.find(po => 
        po.id.toLowerCase() === clean || 
        po.id.toLowerCase().replace(/[^a-z0-9]/g, '') === clean.replace(/[^a-z0-9]/g, '')
      );

      if (poMatch) {
        playBeep(1100, 0.1);
        triggerHaptic([30, 30]);
        setScanFlash('SUCCESS');
        setTimeout(() => setScanFlash(null), 500);

        const logEntry: ScanLogEntry = {
          id: `log-${Date.now()}`,
          timestamp: timeStr,
          rawCode: rawTrimmed,
          parsedType: 'PURCHASE_ORDER',
          title: `PO Matched: ${poMatch.id}`,
          subtitle: `Supplier: ${poMatch.supplier.name} • ${formatPrice(poMatch.total)} [${poMatch.status}]`,
          status: 'SUCCESS',
          method,
          dataRef: poMatch
        };

        setLastScannedResult(logEntry);
        setScanLogs(prev => [logEntry, ...prev]);

        if (onScanPurchaseOrder) {
          onScanPurchaseOrder(poMatch);
        }
        return;
      }
    }

    // 3. Try matching PRODUCT CATALOG
    if (mode !== 'orders_only') {
      const productMatch = products.find(p => 
        p.sku.toLowerCase() === clean || 
        (p.oemCode && p.oemCode.toLowerCase() === clean) ||
        p.name.toLowerCase() === clean ||
        p.id.toString() === clean
      );

      if (productMatch) {
        if (productMatch.stock <= 0) {
          playBeep(350, 0.25, 'sawtooth');
          triggerHaptic([100, 50, 100]);
          setScanFlash('OUT_OF_STOCK');
          setTimeout(() => setScanFlash(null), 600);

          const logEntry: ScanLogEntry = {
            id: `log-${Date.now()}`,
            timestamp: timeStr,
            rawCode: rawTrimmed,
            parsedType: 'PRODUCT',
            title: productMatch.name,
            subtitle: `SKU: ${productMatch.sku} • Out of Stock (0 units)`,
            status: 'OUT_OF_STOCK',
            method,
            dataRef: productMatch
          };

          setLastScannedResult(logEntry);
          setScanLogs(prev => [logEntry, ...prev]);

          if (onScanProduct) {
            onScanProduct(productMatch);
          }
        } else {
          playBeep(1150, 0.08);
          triggerHaptic(40);
          setScanFlash('SUCCESS');
          setTimeout(() => setScanFlash(null), 400);

          const logEntry: ScanLogEntry = {
            id: `log-${Date.now()}`,
            timestamp: timeStr,
            rawCode: rawTrimmed,
            parsedType: 'PRODUCT',
            title: productMatch.name,
            subtitle: `SKU: ${productMatch.sku} • ${productMatch.stock} in Stock @ ${formatPrice(productMatch.price)}`,
            status: 'SUCCESS',
            method,
            dataRef: productMatch
          };

          setLastScannedResult(logEntry);
          setScanLogs(prev => [logEntry, ...prev]);

          if (onScanProduct) {
            onScanProduct(productMatch);
          }
        }
        return;
      }
    }

    // 4. No Catalog Record Matched
    playBeep(650, 0.12, 'sawtooth');
    setTimeout(() => playBeep(500, 0.15, 'sawtooth'), 120);
    triggerHaptic([80, 40, 80]);
    setScanFlash('NOT_FOUND');
    setTimeout(() => setScanFlash(null), 600);

    const unknownEntry: ScanLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: timeStr,
      rawCode: rawTrimmed,
      parsedType: 'UNKNOWN',
      title: 'Unrecognized Barcode / QR Signature',
      subtitle: `Raw Code: "${rawTrimmed}" not linked to active catalog or orders`,
      status: 'NOT_FOUND',
      method
    };

    setLastScannedResult(unknownEntry);
    setScanLogs(prev => [unknownEntry, ...prev]);
  }, [products, salesOrders, purchaseOrders, mode, onScanProduct, onScanOrder, onScanPurchaseOrder, formatPrice]);

  // -------------------------------------------------------------
  // CAMERA STREAM & FRAME DECODING LOOP
  // -------------------------------------------------------------
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => {
        try { t.stop(); } catch {}
      });
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchEnabled(false);
    setHasTorchCapability(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraPermissionError(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraPermissionError('Device camera API is not supported on this browser or platform context.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check for torch capability
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        setHasTorchCapability(!!capabilities.torch);
      }

      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      let errMsg = 'Camera access blocked or device webcam busy.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Camera permission was denied. Please allow camera access in browser permissions or use the photo upload / test matrix tabs.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No optical video camera device detected on this terminal.';
      }
      setCameraPermissionError(errMsg);
      setCameraActive(false);
    }
  }, [facingMode, stopCamera]);

  // Continuous Camera Decoding Frame Loop
  useEffect(() => {
    if (!cameraActive || !isScanningActive) return;

    let isProcessingFrame = false;

    const scanFrame = async () => {
      if (!cameraActive || !isScanningActive) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        if (!isProcessingFrame) {
          isProcessingFrame = true;

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // 1. First attempt: jsQR high-performance QR code decode
            let detectedCode: string | null = null;
            try {
              const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth'
              });
              if (qrResult && qrResult.data) {
                detectedCode = qrResult.data;
              }
            } catch (e) {
              console.error('jsQR frame error', e);
            }

            // 2. Second attempt: Native BarcodeDetector (if BarcodeDetector is available in window)
            if (!detectedCode && typeof window !== 'undefined' && 'BarcodeDetector' in window) {
              try {
                const detector = new (window as any).BarcodeDetector({
                  formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'data_matrix']
                });
                const barcodes = await detector.detect(canvas);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  detectedCode = barcodes[0].rawValue;
                }
              } catch (e) {
                // Ignore detector exceptions
              }
            }

            if (detectedCode) {
              parseScannedPayload(detectedCode, 'CAMERA');
            }
          }
          isProcessingFrame = false;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(scanFrame);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [cameraActive, isScanningActive, parseScannedPayload]);

  // Tab change & facingMode watcher
  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab, facingMode, startCamera, stopCamera]);

  // Torch toggle handler
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextTorch = !torchEnabled;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setTorchEnabled(nextTorch);
    } catch (e) {
      console.warn('Torch constraint toggle failed', e);
    }
  };

  // Switch facing mode (Rear vs Front Camera)
  const handleFlipCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // -------------------------------------------------------------
  // IMAGE / PHOTO FILE UPLOAD DECODER
  // -------------------------------------------------------------
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedImagePreview(dataUrl);

      const img = new Image();
      img.onload = async () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.naturalWidth || img.width;
        tempCanvas.height = img.naturalHeight || img.height;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

        let decoded: string | null = null;
        try {
          const qr = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth'
          });
          if (qr && qr.data) {
            decoded = qr.data;
          }
        } catch {}

        if (!decoded && typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          try {
            const detector = new (window as any).BarcodeDetector();
            const barcodes = await detector.detect(tempCanvas);
            if (barcodes?.length > 0) {
              decoded = barcodes[0].rawValue;
            }
          } catch {}
        }

        if (decoded) {
          parseScannedPayload(decoded, 'IMAGE_UPLOAD');
        } else {
          // Play not found tone
          parseScannedPayload(`UNREADABLE_IMAGE_${file.name}`, 'IMAGE_UPLOAD');
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // -------------------------------------------------------------
  // HARDWARE KEYBOARD WEDGE SCANNER LISTENER
  // -------------------------------------------------------------
  useEffect(() => {
    let wedgeBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeypress = (e: KeyboardEvent) => {
      const activeEl = document.activeElement?.tagName;
      if (activeEl === 'INPUT' || activeEl === 'TEXTAREA') {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > 250) {
        wedgeBuffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        const payload = wedgeBuffer.trim();
        if (payload.length >= 2) {
          parseScannedPayload(payload, 'HARDWARE');
        }
        wedgeBuffer = '';
      } else if (e.key.length === 1) {
        wedgeBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeypress);
    return () => window.removeEventListener('keydown', handleKeypress);
  }, [parseScannedPayload]);

  // Filter products for test label sheet
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchLabelQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchLabelQuery.toLowerCase()) ||
    (p.oemCode && p.oemCode.toLowerCase().includes(searchLabelQuery.toLowerCase())) ||
    p.brand.toLowerCase().includes(searchLabelQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden max-h-[92vh] text-slate-900 dark:text-slate-100">
        
        {/* HIDDEN WORKING CANVAS FOR FRAME PARSING */}
        <canvas ref={canvasRef} className="hidden" />

        {/* MODAL HEADER */}
        <header className="p-4 sm:p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  {title}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  Real Camera Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono line-clamp-1">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-slate-150 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-1 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 min-w-[120px] py-2 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'camera'
                ? 'bg-brand-orange text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>
          
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 min-w-[120px] py-2 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-brand-orange text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Photo / File Scan</span>
          </button>

          <button
            onClick={() => setActiveTab('labels')}
            className={`flex-1 min-w-[120px] py-2 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'labels'
                ? 'bg-brand-orange text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>QR & Barcode Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex-1 min-w-[120px] py-2 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'hardware'
                ? 'bg-brand-orange text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Hardware Wedge</span>
          </button>
        </div>

        {/* MAIN BODY GRID */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0">
          
          {/* LEFT CONSOLE (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-6 border-r border-slate-150 dark:border-slate-800 overflow-y-auto space-y-4">
            
            {/* 1. CAMERA TAB */}
            {activeTab === 'camera' && (
              <div className="space-y-4">
                
                {/* Camera controls toolbar */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {facingMode === 'environment' ? 'Rear Environmental Camera' : 'Front Face Camera'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasTorchCapability && (
                      <button
                        onClick={handleToggleTorch}
                        className={`p-1.5 px-2 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                          torchEnabled
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                        title="Toggle Flashlight / Torch"
                      >
                        <Flashlight className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase">{torchEnabled ? 'Torch On' : 'Torch'}</span>
                      </button>
                    )}

                    <button
                      onClick={handleFlipCamera}
                      className="p-1.5 px-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                      title="Switch between front and back camera"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase">Flip</span>
                    </button>
                  </div>
                </div>

                {/* CAMERA VIEWFINDER */}
                <div className="relative aspect-video w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex flex-col justify-center items-center">
                  {cameraActive && !cameraPermissionError ? (
                    <>
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />

                      {/* VIEWFINDER TARGET MATRIX */}
                      <div className="absolute inset-0 m-6 sm:m-10 rounded-2xl border-2 border-dashed border-emerald-500/40 flex items-center justify-center pointer-events-none">
                        
                        {/* 4 Corner brackets */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>

                        {/* Animated Laser Scanning Line */}
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent relative shadow-[0_0_12px_rgba(239,68,68,1)] animate-pulse">
                          <span className="absolute right-1/2 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-400 rounded-full animate-ping"></span>
                        </div>
                      </div>

                      {/* HUD Overlay stream information */}
                      <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-xs p-1 px-3 rounded-lg text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                        <span>OPTICAL DECODER LIVE (QR / 1D / 2D)</span>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center text-slate-400 space-y-3 max-w-sm">
                      <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mx-auto border border-slate-700">
                        <Camera className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-200">
                          {cameraPermissionError || 'Initializing Camera Stream...'}
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {cameraPermissionError
                            ? 'Camera stream could not be started. You can still test scanning using the Photo Upload or QR & Barcode Sheet tabs!'
                            : 'Connecting to device camera sensor with auto-exposure and barcode interpretation.'}
                        </p>
                      </div>
                      <button
                        onClick={startCamera}
                        className="py-1.5 px-4 bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs uppercase rounded-lg shadow transition"
                      >
                        🔄 Reconnect Camera
                      </button>
                    </div>
                  )}

                  {/* FLASH ACTION OVERLAY */}
                  {scanFlash && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs animate-in zoom-in-90 duration-150">
                      <div className="p-5 rounded-2xl max-w-xs text-center space-y-2">
                        {scanFlash === 'SUCCESS' && (
                          <>
                            <div className="w-14 h-14 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                              <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h4 className="text-sm font-black text-emerald-400 uppercase">Match Registered!</h4>
                            <p className="text-xs text-slate-300">Scanned code recognized and processed.</p>
                          </>
                        )}
                        {scanFlash === 'OUT_OF_STOCK' && (
                          <>
                            <div className="w-14 h-14 bg-amber-500/20 border-2 border-amber-500 rounded-full flex items-center justify-center mx-auto text-amber-400">
                              <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h4 className="text-sm font-black text-amber-400 uppercase">Part Out of Stock</h4>
                            <p className="text-xs text-slate-300">SKU catalog item recognized, but stock count is 0.</p>
                          </>
                        )}
                        {scanFlash === 'NOT_FOUND' && (
                          <>
                            <div className="w-14 h-14 bg-rose-500/20 border-2 border-rose-500 rounded-full flex items-center justify-center mx-auto text-rose-400">
                              <X className="w-8 h-8" />
                            </div>
                            <h4 className="text-sm font-black text-rose-400 uppercase">Unrecognized Code</h4>
                            <p className="text-xs text-slate-300">Code does not match active SKUs or orders.</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* EMULATOR MANUAL TYPED INPUT */}
                <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Direct Code Test Input (SKU / OEM / Order ID)
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. MS-BP-001, 90915-YZZD2, SO-2024-115..."
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && manualCode) {
                          parseScannedPayload(manualCode, 'SIMULATOR');
                          setManualCode('');
                        }
                      }}
                      className="flex-1 p-2 bg-white dark:bg-slate-900 border text-xs font-mono rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-slate-100 font-bold"
                    />
                    <button
                      onClick={() => {
                        if (manualCode) {
                          parseScannedPayload(manualCode, 'SIMULATOR');
                          setManualCode('');
                        }
                      }}
                      className="py-2 px-4 bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow transition"
                    >
                      Dispatch
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* 2. PHOTO / FILE UPLOAD TAB */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-4 bg-slate-50 dark:bg-slate-850 hover:border-brand-orange transition">
                  <div className="w-16 h-16 bg-brand-orange/10 rounded-2xl flex items-center justify-center mx-auto text-brand-orange">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white">
                      Upload QR Code or Barcode Photo
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      Drag & drop any photo, screenshot, waybill, or invoice image containing a QR code or barcode to decode it instantly.
                    </p>
                  </div>

                  <label className="inline-block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                    <span className="px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span>Choose Image File</span>
                    </span>
                  </label>
                </div>

                {uploadedImagePreview && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Uploaded Image Analysis
                    </span>
                    <div className="max-h-48 overflow-hidden rounded-lg bg-black flex items-center justify-center">
                      <img src={uploadedImagePreview} alt="Upload Preview" className="max-h-48 object-contain" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. QR & BARCODE SHEET TAB (TEST MATRIX) */}
            {activeTab === 'labels' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Interactive Product QR & Barcode Test Matrix
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Click any card to trigger an instant scan event, or point your phone camera at the screen!
                    </p>
                  </div>

                  <div className="relative w-full sm:w-48">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Filter parts..."
                      value={searchLabelQuery}
                      onChange={(e) => setSearchLabelQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 bg-white dark:bg-slate-800 border rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* SAMPLE SALES ORDERS FOR VERIFICATION TESTING */}
                {salesOrders.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 block">
                      📋 Test Sales Orders for Verification
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {salesOrders.slice(0, 4).map((order) => {
                        const qrUrl = generateQRCodeDataURL(`MASUMA:ORDER:${order.id}`, { size: 80, margin: 1 });
                        return (
                          <div
                            key={order.id}
                            onClick={() => parseScannedPayload(order.id, 'SIMULATOR')}
                            className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl hover:border-indigo-500 cursor-pointer flex items-center justify-between transition group"
                          >
                            <div className="flex items-center gap-2.5">
                              <img src={qrUrl} alt="Order QR" className="w-12 h-12 bg-white p-0.5 rounded border border-indigo-200 shrink-0" />
                              <div>
                                <span className="text-[9px] font-black uppercase bg-indigo-600 text-white px-1.5 py-0.5 rounded block w-fit">
                                  {order.id}
                                </span>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px] mt-0.5">
                                  {order.customer.name}
                                </h4>
                                <span className="text-[10px] font-mono text-slate-500">{formatPrice(order.total)}</span>
                              </div>
                            </div>
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline">
                              Verify ➔
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* PRODUCT LIST GRID */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    🏷️ Product QR Badges
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                    {filteredProducts.map((p) => {
                      const qrUrl = generateQRCodeDataURL(`MASUMA:SKU:${p.sku}|OEM:${p.oemCode || 'N/A'}`, { size: 90, margin: 1 });
                      return (
                        <div
                          key={p.id}
                          onClick={() => parseScannedPayload(p.sku, 'SIMULATOR')}
                          className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-brand-orange hover:shadow-md cursor-pointer transition flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1 bg-white rounded-lg border border-slate-200 shadow-2xs shrink-0">
                              <img src={qrUrl} alt={p.sku} className="w-14 h-14" />
                            </div>
                            <div className="space-y-0.5 max-w-[150px]">
                              <span className="text-[8px] font-black uppercase bg-slate-900 text-white dark:bg-brand-orange px-1.5 py-0.5 rounded">
                                {p.brand}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate font-sans">
                                {p.name}
                              </h4>
                              <p className="text-[10px] font-mono text-slate-400">
                                SKU: <strong className="text-slate-700 dark:text-slate-300">{p.sku}</strong>
                              </p>
                              <span className="text-[10px] font-mono font-bold text-brand-orange block">
                                {formatPrice(p.price)}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">
                              {p.stock > 0 ? `${p.stock} in stock` : 'Out of Stock'}
                            </span>
                            <span className="text-xs font-bold text-brand-orange group-hover:translate-x-1 transition-transform inline-block mt-1">
                              Scan ➔
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* 4. HARDWARE WEDGE TAB */}
            {activeTab === 'hardware' && (
              <div className="space-y-4">
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
                  <div className="w-16 h-16 bg-brand-orange/10 rounded-2xl flex items-center justify-center mx-auto text-brand-orange">
                    <Zap className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white">
                      Physical USB & Bluetooth Handheld Scanners
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                      Our system automatically intercepts hardware wedge keystroke bursts across any page. Point your handheld laser scanner at any physical box or barcode sticker!
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 text-xs font-mono inline-flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                    <span>HARDWARE LISTENER: READY & GLOBAL</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Supported Formats
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded border text-center font-bold">QR Code 2D</div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded border text-center font-bold">Code 128</div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded border text-center font-bold">EAN-13 / UPC</div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded border text-center font-bold">DataMatrix</div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT PANEL: REAL-TIME SCAN TELEMETRY & RESULTS (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/60 flex flex-col justify-between overflow-y-auto space-y-4">
            
            <div className="space-y-4">
              <div className="border-b dark:border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Scan Event Telemetry
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Live optical decoded data packets
                  </p>
                </div>
                <span className="text-xs font-mono font-black text-slate-400">
                  {scanLogs.length} events
                </span>
              </div>

              {/* STATS TILES */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Total</span>
                  <strong className="text-sm font-black font-mono text-slate-900 dark:text-white">
                    {scanLogs.length}
                  </strong>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Matched</span>
                  <strong className="text-sm font-black font-mono text-emerald-500">
                    {scanLogs.filter(l => l.status === 'SUCCESS').length}
                  </strong>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Unresolved</span>
                  <strong className="text-sm font-black font-mono text-rose-500">
                    {scanLogs.filter(l => l.status !== 'SUCCESS').length}
                  </strong>
                </div>
              </div>

              {/* LATEST SCANNED CARD SPOTLIGHT */}
              {lastScannedResult && (
                <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border-2 border-brand-orange shadow-sm space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-brand-orange text-white px-2 py-0.5 rounded">
                      Latest Detected Item
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{lastScannedResult.timestamp}</span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {lastScannedResult.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {lastScannedResult.subtitle}
                  </p>
                </div>
              )}

              {/* EVENT FEED SCROLLER */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {scanLogs.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 font-mono text-xs">
                    📸 Waiting for camera or barcode data...
                  </div>
                ) : (
                  scanLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                          : log.status === 'OUT_OF_STOCK'
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                          : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                      }`}
                    >
                      <div className="space-y-0.5 max-w-[80%]">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-300'
                              : log.status === 'OUT_OF_STOCK'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/80 dark:text-rose-300'
                          }`}>
                            {log.parsedType}
                          </span>
                          <span className="text-[10px] text-slate-400">{log.timestamp} • {log.method}</span>
                        </div>
                        <h5 className="font-sans font-bold text-xs text-slate-900 dark:text-white truncate">
                          {log.title}
                        </h5>
                        <p className="text-[10px] text-slate-400 truncate">
                          {log.subtitle}
                        </p>
                      </div>

                      <span className="text-base font-black">
                        {log.status === 'SUCCESS' ? '✓' : log.status === 'OUT_OF_STOCK' ? '!' : '✗'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="pt-3 border-t dark:border-slate-800 shrink-0">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow"
              >
                Close Scanner Deck
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
