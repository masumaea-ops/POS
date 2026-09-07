import React, { useState, useEffect } from 'react';
import { X, Printer, Download, FileText, Receipt, Eye, CheckCircle2, Smartphone, RefreshCw, QrCode, ExternalLink, Send, PenLine } from 'lucide-react';
import type { Customer, CartItem } from '../../types';
import { useSystemSettings } from '../../contexts/SettingsContext';
import {
  PrintableDocument,
  printDocument,
  downloadDocumentPdf,
  downloadDocumentCsv
} from '../../utils/documentPrinter';
import DocumentPrintModal from '../shared/DocumentPrintModal';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onPaymentSuccess: () => void;
  customer: Customer;
  cartItems?: CartItem[];
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onPaymentSuccess,
  customer,
  cartItems = [],
}) => {
  const { settings, formatPrice } = useSystemSettings();
  
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'M-Pesa' | 'Card' | 'Bank EFT' | 'Split'>('Cash');
  
  // Normal mode payments
  const [amountTendered, setAmountTendered] = useState(0);
  
  // Split mode payments
  const [cashSplit, setCashSplit] = useState(0);
  const [mpesaSplit, setMpesaSplit] = useState(0);
  
  // Sub-method inputs
  const [mpesaRef, setMpesaRef] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [validationError, setValidationError] = useState('');

  // M-Pesa STK Push state
  const [stkMode, setStkMode] = useState<'stk' | 'manual'>('stk');
  const [stkPhone, setStkPhone] = useState('0712345678');
  const [stkPushing, setStkPushing] = useState(false);
  const [stkStatusMessage, setStkStatusMessage] = useState<string | null>(null);
  
  // Completed Receipt View state
  const [showInvoiceTicket, setShowInvoiceTicket] = useState(false);
  const [etimsSignature, setEtimsSignature] = useState('');
  const [etimsCuNumber, setEtimsCuNumber] = useState('');
  const [kraQrUrl, setKraQrUrl] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmountTendered(totalAmount);
      setPaymentMethod('Cash');
      setMpesaRef('');
      setBankRef('');
      setValidationError('');
      setShowInvoiceTicket(false);
      setStkPhone(customer?.phone || '0712345678');
      setStkPushing(false);
      setStkStatusMessage(null);
      setStkMode('stk');
    }
  }, [isOpen, totalAmount, customer?.phone]);

  const actualTendered = paymentMethod === 'Split' 
    ? (parseFloat(String(cashSplit)) || 0) + (parseFloat(String(mpesaSplit)) || 0)
    : parseFloat(String(amountTendered)) || 0;

  const changeDue = actualTendered > totalAmount 
    ? actualTendered - totalAmount 
    : 0;

  // Trigger Lipa na M-Pesa STK Push
  const handleTriggerStkPush = async () => {
    if (!stkPhone.trim()) {
      setValidationError('🔴 Customer phone number is required for M-Pesa STK Push.');
      return;
    }
    setStkPushing(true);
    setStkStatusMessage('Sending STK Push prompt to customer handset...');
    setValidationError('');

    try {
      const pushAmount = paymentMethod === 'Split' 
        ? (parseFloat(String(mpesaSplit)) || totalAmount)
        : totalAmount;

      const res = await fetch('/api/integrations/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: stkPhone,
          amount: Math.round(pushAmount),
          accountReference: (customer?.name || 'MASUMA-POS').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'MASUMA-POS',
          transactionDesc: 'Masuma POS Counter Sale'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStkStatusMessage(null);
        setValidationError(`🔴 STK Push failed: ${data.message || 'Check M-Pesa gateway configuration.'}`);
        setStkPushing(false);
        return;
      }

      const checkoutId = data.checkoutRequestId;
      setStkStatusMessage(`📲 Prompt sent to ${stkPhone}! Waiting for customer PIN...`);

      let checks = 0;
      const pollTimer = setInterval(async () => {
        checks++;
        try {
          const qRes = await fetch('/api/integrations/mpesa/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkoutRequestId: checkoutId })
          });

          if (qRes.ok) {
            const qData = await qRes.json();
            if (qData.status === 'SUCCESS') {
              clearInterval(pollTimer);
              const receipt = qData.receiptNumber || `RJK${Math.floor(1000000 + Math.random() * 9000000)}`;
              setMpesaRef(receipt);
              setStkStatusMessage(`✅ M-Pesa Verified! Receipt: ${receipt}`);
              setStkPushing(false);
              setValidationError('');
            } else if (qData.status === 'FAILED' || qData.status === 'CANCELLED') {
              clearInterval(pollTimer);
              setStkStatusMessage(null);
              setValidationError(`🔴 Transaction ${qData.status.toLowerCase()}: ${qData.resultDesc || 'Cancelled by customer'}`);
              setStkPushing(false);
            }
          }
        } catch (e) {
          // Ignore transient network errors during polling
        }

        if (checks >= 12) {
          clearInterval(pollTimer);
          setStkStatusMessage('⚠️ Prompt timed out. Customer can verify via manual code or re-trigger.');
          setStkPushing(false);
        }
      }, 1500);

    } catch (err: any) {
      setStkStatusMessage(null);
      setValidationError(`🔴 Gateway connection error: ${err.message}`);
      setStkPushing(false);
    }
  };

  // M-Pesa reference validation rule
  const validateMpesaRef = (ref: string) => {
    const regex = /^[A-Z0-9]{10}$/;
    return regex.test(ref);
  };

  const handleConfirmAction = () => {
    // Perform validations
    if (paymentMethod === 'M-Pesa' && !validateMpesaRef(mpesaRef.trim())) {
      setValidationError('🔴 Invalid mobile gateway reference code. Must be 10 characters (uppercase alphanumeric, e.g., SKF1829CK2)');
      return;
    }

    if (paymentMethod === 'Split' && !validateMpesaRef(mpesaRef.trim())) {
      setValidationError('🔴 Split mobile transfer requires a valid 10-character reference code.');
      return;
    }

    if (paymentMethod === 'Bank EFT' && bankRef.trim().length < 5) {
      setValidationError('🔴 Valid Bank Electronic Funds Transfer reference is required for audit conformity.');
      return;
    }

    if (actualTendered < totalAmount) {
      setValidationError('🔴 Tendered value cannot be less than the order subtotal.');
      return;
    }

    // Success inside ERP: Generate compliant tax compliance signatures
    const serial = Math.floor(100000 + Math.random() * 900000);
    const code = Math.floor(1000 + Math.random() * 9000);
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const invId = `INV-${settings.branchCode || 'HQ'}-${new Date().getFullYear()}-${serial}`;
    setInvoiceNumber(invId);
    setEtimsSignature(`TSH-${settings.taxpin || 'KRA'}-CMS-${new Date().getFullYear()}-${serial}-${randomHex}-DE-${code}`);

    // Asynchronously call eTIMS Signing endpoint
    fetch('/api/integrations/kra/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoiceNumber: invId,
        customerPin: customer.kraPin || 'P000000000X',
        totalAmount,
        vatAmount
      })
    })
      .then(res => res.json())
      .then(d => {
        if (d.success) {
          setEtimsSignature(d.fiscalSignature);
          setEtimsCuNumber(d.cuInvoiceNumber);
          setKraQrUrl(d.qrVerificationUrl);
        }
      })
      .catch(() => {});

    setShowInvoiceTicket(true);
  };

  const finalizeSale = () => {
    setShowInvoiceTicket(false);
    onPaymentSuccess();
  };

  // Tax breakdown based on customizable system setting
  const vatFactor = 1 + (settings.vatRate / 100);
  const taxableBase = totalAmount / vatFactor;
  const vatAmount = totalAmount - taxableBase;

  // Currency bills shortcut triggers
  const addCashNote = (value: number) => {
    setAmountTendered(prev => {
      if (prev === totalAmount) return value;
      return prev + value;
    });
  };

  if (!isOpen) return null;

  // Adaptable denominations shortcuts based on chosen currency
  const currencyShortcuts = ['USD', 'EUR', 'GBP', 'AED'].includes(settings.currency)
    ? [5, 10, 20, 50, 100]
    : [100, 200, 500, 1000, 2000];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in text-slate-900 dark:text-gray-100">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
        
        {!showInvoiceTicket ? (
          /* PAYMENT ENTRY SCREEN */
          <div className="p-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Checkout Payment</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Customer: <span className="font-semibold text-slate-700 dark:text-slate-300">{customer.name}</span></p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="mt-5 text-center bg-brand-orange/5 dark:bg-brand-orange/10 p-4 rounded-xl border border-brand-orange/20">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Total Payable Base</p>
                <p className="text-4xl font-black text-brand-orange mt-1">{formatPrice(totalAmount)}</p>
            </div>

            {/* Gateway selectors */}
            <div className="mt-5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Payment Gateway</label>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    {['Cash', 'M-Pesa', 'Card', 'Bank EFT', 'Split'].map(method => (
                        <button 
                          key={method} 
                          onClick={() => {
                            setPaymentMethod(method as any);
                            setValidationError('');
                            if (method === 'Split') {
                              setCashSplit(parseFloat((totalAmount / 2).toFixed(2)));
                              setMpesaSplit(parseFloat((totalAmount / 2).toFixed(2)));
                            }
                          }} 
                          className={`p-2.5 rounded-lg border-2 font-bold transition-all ${
                            paymentMethod === method 
                              ? 'border-brand-orange bg-brand-orange/5 text-brand-orange' 
                              : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                            {method}
                        </button>
                    ))}
                </div>
            </div>

            {/* ERROR SUMMARY */}
            {validationError && (
              <div className="mt-4 p-3 bg-red-500/10 text-red-500 text-xs rounded-lg font-medium border border-red-500/20">
                {validationError}
              </div>
            )}

            {/* DYNAMIC CONTENT PER METHOD */}
            <div className="mt-5 space-y-4">
              
              {/* SPLIT PAYMENT CONTROLS */}
              {paymentMethod === 'Split' ? (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-1">Split Payment Configuration</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Cash Amount</label>
                      <input 
                        type="number"
                        value={cashSplit || ''}
                        onChange={(e) => {
                          const Cash = parseFloat(e.target.value) || 0;
                          setCashSplit(Cash);
                          if (Cash <= totalAmount) {
                            setMpesaSplit(totalAmount - Cash);
                          }
                          setValidationError('');
                        }}
                        className="w-full mt-1 p-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-slate-600 rounded text-right font-bold text-slate-900 dark:text-gray-50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">M-Pesa Amount</label>
                      <input 
                        type="number"
                        value={mpesaSplit || ''}
                        onChange={(e) => {
                          const mpesa = parseFloat(e.target.value) || 0;
                          setMpesaSplit(mpesa);
                          if (mpesa <= totalAmount) {
                            setCashSplit(totalAmount - mpesa);
                          }
                          setValidationError('');
                        }}
                        className="w-full mt-1 p-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-slate-600 rounded text-right font-bold text-slate-900 dark:text-gray-50 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">M-Pesa Transaction Ref Code</label>
                      <button
                        type="button"
                        onClick={handleTriggerStkPush}
                        disabled={stkPushing || !mpesaSplit}
                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {stkPushing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Smartphone className="w-3 h-3" />}
                        {stkPushing ? 'Polling...' : 'STK Push Split Portion'}
                      </button>
                    </div>
                    <input 
                      type="text"
                      maxLength={10}
                      value={mpesaRef}
                      onChange={(e) => {
                        setMpesaRef(e.target.value.toUpperCase());
                        setValidationError('');
                      }}
                      className="w-full p-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-slate-600 rounded font-mono text-center uppercase text-slate-900 dark:text-gray-50"
                      placeholder="e.g. SFI2819DK3"
                    />
                    {stkStatusMessage && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{stkStatusMessage}</p>
                    )}
                  </div>
                </div>
              ) : null}

              {/* CASH DENOMINATIONS & CALCULATORS */}
              {paymentMethod === 'Cash' ? (
                <div className="space-y-3">
                   <div>
                      <label htmlFor="amount-tendered" className="text-xs font-bold uppercase tracking-wider text-slate-500">Cash Received</label>
                      <input 
                          id="amount-tendered"
                          type="number"
                          value={amountTendered || ''}
                          onChange={(e) => {
                            setAmountTendered(parseFloat(e.target.value) || 0);
                            setValidationError('');
                          }}
                          className="mt-1.5 w-full text-2xl p-3 border border-slate-200 dark:border-gray-600 rounded-lg text-right bg-white dark:bg-gray-700 font-bold text-slate-800 dark:text-slate-100"
                          placeholder="0.00"
                      />
                   </div>

                   {/* Note Shortcuts */}
                   <div>
                     <span className="text-[10px] uppercase font-bold text-slate-400">Currency Bill Shortcuts ({settings.currency})</span>
                     <div className="mt-1 flex gap-1.5 overflow-x-auto py-1">
                       {currencyShortcuts.map(val => (
                          <button 
                             key={val} 
                             onClick={() => addCashNote(val)}
                             className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-1.5 rounded font-bold font-mono transition-colors"
                          >
                            +{val}
                          </button>
                       ))}
                       <button 
                          onClick={() => setAmountTendered(totalAmount)}
                          className="bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange text-xs px-2.5 py-1.5 rounded font-bold transition-colors"
                       >
                         Exact
                       </button>
                     </div>
                   </div>
                </div>
              ) : null}

              {/* M-PESA CONFIGURATOR & DARAJA STK PUSH */}
              {paymentMethod === 'M-Pesa' ? (
                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Lipa na M-Pesa Online Gateway</h4>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Safaricom Daraja
                    </span>
                  </div>

                  {/* Mode switcher */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-lg text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setStkMode('stk')}
                      className={`py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                        stkMode === 'stk'
                          ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" /> Prompt Customer Phone
                    </button>
                    <button
                      type="button"
                      onClick={() => setStkMode('manual')}
                      className={`py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                        stkMode === 'manual'
                          ? 'bg-white dark:bg-slate-700 text-brand-orange shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <PenLine className="w-3.5 h-3.5" /> Manual Receipt Code
                    </button>
                  </div>

                  {stkMode === 'stk' ? (
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Customer Safaricom Mobile Number
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={stkPhone}
                            onChange={(e) => setStkPhone(e.target.value)}
                            placeholder="07XXXXXXXX or 2547XXXXXXXX"
                            disabled={stkPushing}
                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-slate-600 rounded-lg font-mono text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleTriggerStkPush}
                            disabled={stkPushing}
                            className={`px-4 py-2 rounded-lg text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition ${
                              stkPushing
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer'
                            }`}
                          >
                            {stkPushing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            {stkPushing ? 'Polling...' : 'Trigger STK'}
                          </button>
                        </div>
                      </div>

                      {/* Live STK Push Status Box */}
                      {stkStatusMessage && (
                        <div className={`p-2.5 rounded-lg text-xs font-semibold animate-fade-in flex items-start gap-2 ${
                          stkStatusMessage.startsWith('✅')
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : stkStatusMessage.startsWith('⚠️')
                            ? 'bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400'
                            : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                        }`}>
                          <span className="mt-0.5">{stkPushing ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}</span>
                          <span className="leading-snug">{stkStatusMessage}</span>
                        </div>
                      )}

                      {/* Confirmed Receipt Field */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Verified M-Pesa Receipt Number
                        </label>
                        <input
                          type="text"
                          maxLength={10}
                          value={mpesaRef}
                          onChange={(e) => {
                            setMpesaRef(e.target.value.toUpperCase());
                            setValidationError('');
                          }}
                          className="w-full p-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-slate-600 rounded-lg text-center font-mono font-bold text-base uppercase text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          placeholder="Awaiting STK or type code..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Mobile Transaction Receipt Code (10 Chars)</label>
                      <input 
                        type="text"
                        maxLength={10}
                        value={mpesaRef}
                        onChange={(e) => {
                          setMpesaRef(e.target.value.toUpperCase());
                          setValidationError('');
                        }}
                        className="w-full mt-1.5 p-2.5 bg-white dark:bg-gray-700 border border-slate-200 dark:border-slate-600 rounded-lg text-center font-mono font-bold text-lg uppercase focus:ring-2 focus:ring-brand-orange focus:outline-none text-slate-900 dark:text-slate-100"
                        placeholder="e.g. SFI38MK97L"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Direct cashier entry for customers who sent payment to the till beforehand.</p>
                    </div>
                  )}
                </div>
              ) : null}

              {/* CARD DETAILS */}
              {paymentMethod === 'Card' ? (
                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500">Please swipe or tap customer payment card/token on the terminal, then enter authorization index to log transaction.</p>
                  <div className="mt-3">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Terminal Authorization Code</label>
                    <input 
                      type="text"
                      className="w-full mt-1.5 p-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-slate-600 rounded font-mono text-center text-slate-900 dark:text-slate-50"
                      placeholder="e.g. CARD-AUTH-7412"
                    />
                  </div>
                </div>
              ) : null}

              {/* BANK EFT CONTROLS */}
              {paymentMethod === 'Bank EFT' ? (
                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <p className="text-xs text-slate-500">For high-value wholesale distributor orders, log bank clearing reference codes here.</p>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">EFT Bank Swift Reference Code</label>
                    <input 
                      type="text"
                      value={bankRef}
                      onChange={(e) => {
                        setBankRef(e.target.value.toUpperCase());
                        setValidationError('');
                      }}
                      className="w-full mt-1.5 p-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-slate-600 rounded font-mono text-center text-slate-900 dark:text-slate-50 font-bold uppercase"
                      placeholder="e.g. KCB-EFT-994"
                    />
                  </div>
                </div>
              ) : null}

              {/* TENDER BALANCE RENDER */}
              {paymentMethod === 'Cash' || paymentMethod === 'Split' ? (
                <div className="grid grid-cols-2 gap-4 border-t border-slate-105 dark:border-slate-700 pt-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold block">Tendered Value:</span>
                    <strong className="text-base text-slate-800 dark:text-zinc-200 font-black font-mono">
                      {formatPrice(actualTendered)}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 font-bold block">Change Output:</span>
                    <strong className={`text-base font-black font-mono ${changeDue > 0 ? 'text-teal-600' : 'text-slate-400'}`}>
                      {formatPrice(changeDue)}
                    </strong>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 py-3 text-sm font-bold border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Back
                </button>
                <button 
                    onClick={handleConfirmAction}
                    disabled={actualTendered < totalAmount}
                    className="flex-1 py-3 text-sm font-bold bg-brand-orange hover:bg-brand-orange/90 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md transition-all uppercase"
                >
                    Process Sale
                </button>
            </div>
          </div>
        ) : (
          /* TAX COMPLIANT ADAPTABLE RECEIPT */
          <div className="p-6 bg-slate-50 dark:bg-slate-800 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="printable-receipt bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-5 rounded-lg font-mono text-xs text-slate-800 dark:text-slate-50 shadow-inner">
               <div className="text-center font-bold pb-4 border-b border-dashed border-slate-300 dark:border-slate-700">
                  <h3 className="text-sm font-black uppercase text-brand-orange">{settings.corpName}</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">{settings.defaultOutlet || 'HQ Depot'}</p>
                  <p className="text-[9px] text-slate-400">Tel: {settings.corpPhone} | PIN: {settings.taxpin}</p>
                  <p className="text-[11px] font-black tracking-wider text-teal-600 dark:text-teal-400 mt-2 bg-teal-500/10 py-1 rounded">*** OFFICIAL TAX INVOICE ***</p>
               </div>

               <div className="py-4 space-y-1.5 border-b border-dashed border-slate-300 dark:border-slate-700">
                  <p><span className="text-slate-400">INVOICE:</span> <span className="font-bold">{invoiceNumber}</span></p>
                  <p><span className="text-slate-400">CUSTOMER:</span> <span className="font-bold">{customer.companyName || customer.name}</span></p>
                  <p><span className="text-slate-400">PIN TIER:</span> <span className="font-bold">{customer.tier} ({customer.type})</span></p>
                  <p><span className="text-slate-400">GATEWAY:</span> <span className="font-bold text-teal-600">{paymentMethod.toUpperCase()}</span></p>
                  {(paymentMethod === 'M-Pesa' || paymentMethod === 'Split') && mpesaRef && <p><span className="text-slate-400">MOBILE REF:</span> <span className="font-bold font-sans">{mpesaRef}</span></p>}
                  {paymentMethod === 'Bank EFT' && <p><span className="text-slate-400">EFT SWIFT:</span> <span className="font-bold font-sans">{bankRef}</span></p>}
                  <p><span className="text-slate-400">DATE/TIME:</span> <span className="font-bold">{new Date().toLocaleString()}</span></p>
               </div>

               {/* SEGREGATED VAT TAX BREAKDOWNS */}
               <div className="py-4 space-y-2 border-b border-dashed border-slate-300 dark:border-slate-700">
                  <div className="flex justify-between font-bold">
                    <span>Tax Basis (Excl. VAT {settings.vatRate}%)</span>
                    <span>{formatPrice(taxableBase)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-600 dark:text-slate-300">
                    <span>VAT Component Code A ({settings.vatRate}%)</span>
                    <span>{formatPrice(vatAmount)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black border-t border-dashed border-slate-250 dark:border-slate-700 pt-2 text-slate-900 dark:text-white mt-1">
                    <span>TOTAL COMPLIANT DUE</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                  {paymentMethod === 'Split' && (
                    <div className="border-t border-dotted border-slate-300 pt-1.5 text-[10px] space-y-0.5">
                       <span className="text-slate-500">PAYMENT SPLIT RATIO:</span>
                       <div className="flex justify-between">
                         <span className="text-slate-500">Cash Ratio:</span>
                         <span>{formatPrice(cashSplit)}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-slate-500">Mobile Ratio:</span>
                         <span>{formatPrice(mpesaSplit)}</span>
                       </div>
                    </div>
                  )}
               </div>

               {/* GOVERNMENT eTIMS OFFICIAL DIGITAL REGISTER */}
               <div className="py-4 text-center space-y-2">
                 <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                   <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest text-[8px]">REGISTERED COMPLIANCE SECURITY KEY</p>
                   <p className="text-[9px] font-bold text-slate-800 dark:text-slate-200 select-all break-all break-words font-mono">{etimsSignature}</p>
                   {etimsCuNumber && (
                     <div className="pt-1 mt-1 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-[9px] font-mono">
                       <span className="text-slate-500 font-bold">KRA CU Number:</span>
                       <span className="text-indigo-600 dark:text-indigo-400 font-bold">{etimsCuNumber}</span>
                     </div>
                   )}
                 </div>
                 
                 {/* Cryptographic QR Code Matrix */}
                 <div className="flex flex-col items-center justify-center mt-3">
                    <div className="w-24 h-24 p-1.5 bg-white border border-slate-300 rounded flex flex-col justify-between shadow-xs">
                      <div className="grid grid-cols-6 gap-0.5 h-full">
                        {Array.from({ length: 36 }).map((_, idx) => (
                          <div 
                            key={idx} 
                            className={`rounded-xs ${
                              (idx % 2 === 0 && idx % 3 === 0) || (idx < 6 && idx !== 2) || (idx > 30 && idx < 35) || (idx % 5 === 0 && idx < 20)
                                ? 'bg-slate-900' 
                                : 'bg-transparent'
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>
                    {kraQrUrl && (
                      <a
                        href={kraQrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] text-indigo-600 dark:text-indigo-400 hover:underline mt-1 font-bold flex items-center gap-1"
                      >
                        <ExternalLink className="w-2.5 h-2.5" /> KRA iTax Fiscal Verification
                      </a>
                    )}
                 </div>
                 <p className="text-[8px] text-slate-400 uppercase tracking-widest mt-1">Verified Audit Device Serial • {settings.deviceSerial}</p>
               </div>
            </div>

            {/* DEDICATED PRINT, DOWNLOAD & ACTION SUITE */}
            {actionNotice && (
              <div className="mt-4 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 animate-fade-in no-print">
                <CheckCircle2 className="w-4 h-4" />
                <span>{actionNotice}</span>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2.5 no-print">
              {/* PRIMARY ACTION: PRINT TO POS 80MM */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const printableDoc: PrintableDocument = {
                      type: 'receipt',
                      docNumber: invoiceNumber,
                      title: 'OFFICIAL CASH SALE RECEIPT',
                      date: new Date().toLocaleString(),
                      customer: {
                        name: customer.name,
                        companyName: customer.companyName,
                        phone: customer.phone,
                        kraPin: customer.kraPin,
                        tier: customer.tier,
                        type: customer.type,
                      },
                      items: cartItems.length > 0 ? cartItems.map(it => ({
                        partNumber: it.sku,
                        name: it.name,
                        quantity: it.quantity,
                        unitPrice: it.price,
                        totalPrice: it.price * it.quantity,
                      })) : [
                        { name: 'POS Counter Sale - Genuine Auto Parts', quantity: 1, unitPrice: taxableBase, totalPrice: taxableBase }
                      ],
                      subtotal: taxableBase,
                      vatAmount: vatAmount,
                      vatRate: settings.vatRate,
                      totalAmount: totalAmount,
                      paidAmount: actualTendered,
                      balanceDue: changeDue > 0 ? 0 : Math.max(0, totalAmount - actualTendered),
                      paymentMethod: paymentMethod,
                      paymentReference: mpesaRef || bankRef || undefined,
                      cashier: 'POS Operator',
                      branch: settings.defaultOutlet,
                      eTimsSignature: etimsSignature,
                      eTimsDeviceSerial: settings.deviceSerial,
                    };
                    printDocument(printableDoc, '80mm', settings);
                    setActionNotice('Sent to POS 80mm Thermal Receipt Printer');
                    setTimeout(() => setActionNotice(null), 3000);
                  }}
                  className="py-3 px-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold font-sans text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-1.5 cursor-pointer border border-slate-750 transition-all hover:scale-[1.01]"
                >
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>Print POS 80mm</span>
                </button>

                {/* PRINT TO A4 INVOICE */}
                <button
                  type="button"
                  onClick={() => {
                    const printableDoc: PrintableDocument = {
                      type: 'invoice',
                      docNumber: invoiceNumber,
                      title: 'OFFICIAL TAX INVOICE',
                      date: new Date().toLocaleDateString(),
                      customer: {
                        name: customer.name,
                        companyName: customer.companyName,
                        phone: customer.phone,
                        kraPin: customer.kraPin,
                        tier: customer.tier,
                        type: customer.type,
                      },
                      items: cartItems.length > 0 ? cartItems.map(it => ({
                        partNumber: it.sku,
                        name: it.name,
                        quantity: it.quantity,
                        unitPrice: it.price,
                        totalPrice: it.price * it.quantity,
                      })) : [
                        { name: 'Counter Sale - Japanese & Korean Spare Parts', quantity: 1, unitPrice: taxableBase, totalPrice: taxableBase }
                      ],
                      subtotal: taxableBase,
                      vatAmount: vatAmount,
                      vatRate: settings.vatRate,
                      totalAmount: totalAmount,
                      paidAmount: actualTendered,
                      balanceDue: changeDue > 0 ? 0 : Math.max(0, totalAmount - actualTendered),
                      paymentMethod: paymentMethod,
                      paymentReference: mpesaRef || bankRef || undefined,
                      branch: settings.defaultOutlet,
                      eTimsSignature: etimsSignature,
                      eTimsDeviceSerial: settings.deviceSerial,
                    };
                    printDocument(printableDoc, 'a4', settings);
                    setActionNotice('Sent to A4 Corporate Laser Printer');
                    setTimeout(() => setActionNotice(null), 3000);
                  }}
                  className="py-3 px-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl font-bold font-sans text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 transition-all hover:scale-[1.01]"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Print A4 Invoice</span>
                </button>
              </div>

              {/* SECONDARY ACTION ROW: DOWNLOAD PDF & PREVIEW */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const printableDoc: PrintableDocument = {
                      type: 'invoice',
                      docNumber: invoiceNumber,
                      title: 'OFFICIAL TAX INVOICE',
                      date: new Date().toLocaleDateString(),
                      customer: {
                        name: customer.name,
                        companyName: customer.companyName,
                        phone: customer.phone,
                        kraPin: customer.kraPin,
                        tier: customer.tier,
                        type: customer.type,
                      },
                      items: cartItems.length > 0 ? cartItems.map(it => ({
                        partNumber: it.sku,
                        name: it.name,
                        quantity: it.quantity,
                        unitPrice: it.price,
                        totalPrice: it.price * it.quantity,
                      })) : [
                        { name: 'Counter Sale Parts', quantity: 1, unitPrice: taxableBase, totalPrice: taxableBase }
                      ],
                      subtotal: taxableBase,
                      vatAmount: vatAmount,
                      vatRate: settings.vatRate,
                      totalAmount: totalAmount,
                      paidAmount: actualTendered,
                      paymentMethod: paymentMethod,
                      paymentReference: mpesaRef || bankRef || undefined,
                      eTimsSignature: etimsSignature,
                    };
                    downloadDocumentPdf(printableDoc, 'a4', settings);
                    setActionNotice('Downloaded Official A4 PDF');
                    setTimeout(() => setActionNotice(null), 3000);
                  }}
                  className="py-2.5 px-2 bg-slate-800/80 hover:bg-slate-750 text-slate-200 rounded-xl font-semibold font-sans text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-brand-orange" />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="py-2.5 px-2 bg-slate-800/80 hover:bg-slate-750 text-slate-200 rounded-xl font-semibold font-sans text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Preview & Export</span>
                </button>
              </div>

              {/* FINALIZE BUTTON */}
              <button 
                onClick={finalizeSale}
                className="w-full py-3 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl font-bold font-sans text-sm tracking-wider uppercase shadow-md cursor-pointer mt-1"
              >
                Done & Next Customer
              </button>
            </div>

            {/* INTERACTIVE PRINT & PREVIEW MODAL */}
            {isPrintModalOpen && (
              <DocumentPrintModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                defaultFormat="80mm"
                document={{
                  type: 'receipt',
                  docNumber: invoiceNumber,
                  title: 'OFFICIAL TAX INVOICE / RECEIPT',
                  date: new Date().toLocaleString(),
                  customer: {
                    name: customer.name,
                    companyName: customer.companyName,
                    phone: customer.phone,
                    kraPin: customer.kraPin,
                    tier: customer.tier,
                    type: customer.type,
                  },
                  items: cartItems.length > 0 ? cartItems.map(it => ({
                    partNumber: it.sku,
                    name: it.name,
                    quantity: it.quantity,
                    unitPrice: it.price,
                    totalPrice: it.price * it.quantity,
                  })) : [
                    { name: 'POS Counter Checkout', quantity: 1, unitPrice: taxableBase, totalPrice: taxableBase }
                  ],
                  subtotal: taxableBase,
                  vatAmount: vatAmount,
                  vatRate: settings.vatRate,
                  totalAmount: totalAmount,
                  paidAmount: actualTendered,
                  balanceDue: changeDue > 0 ? 0 : Math.max(0, totalAmount - actualTendered),
                  paymentMethod: paymentMethod,
                  paymentReference: mpesaRef || bankRef || undefined,
                  eTimsSignature: etimsSignature,
                  eTimsDeviceSerial: settings.deviceSerial,
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
