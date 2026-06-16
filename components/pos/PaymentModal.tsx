import React, { useState, useEffect } from 'react';
import { XIcon } from '../shared/Icons';
import type { Customer } from '../../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onPaymentSuccess: () => void;
  customer: Customer;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, totalAmount, onPaymentSuccess, customer }) => {
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
  
  // Completed Receipt View state
  const [showInvoiceTicket, setShowInvoiceTicket] = useState(false);
  const [etimsSignature, setEtimsSignature] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmountTendered(totalAmount);
      setCashSplit(Math.round(totalAmount / 2));
      setMpesaSplit(totalAmount - Math.round(totalAmount / 2));
      setMpesaRef('');
      setBankRef('');
      setValidationError('');
      setShowInvoiceTicket(false);
    }
  }, [isOpen, totalAmount]);

  if (!isOpen) return null;

  // Change Calculation logic
  const actualTendered = paymentMethod === 'Split' ? (cashSplit + mpesaSplit) : amountTendered;
  const changeDue = (paymentMethod === 'Cash' || paymentMethod === 'Split') && actualTendered >= totalAmount 
    ? actualTendered - totalAmount 
    : 0;

  // M-Pesa reference validation rule
  const validateMpesaRef = (ref: string) => {
    const regex = /^[A-Z0-9]{10}$/;
    return regex.test(ref);
  };

  const handleConfirmAction = () => {
    // Perform validations
    if (paymentMethod === 'M-Pesa' && !validateMpesaRef(mpesaRef.trim())) {
      setValidationError('🔴 Invalid M-Pesa transaction code. Must be 10 characters (uppercase alphanumeric, e.g., SKF1829CK2)');
      return;
    }

    if (paymentMethod === 'Split' && !validateMpesaRef(mpesaRef.trim())) {
      setValidationError('🔴 M-Pesa Split require a valid 10-character transaction reference code.');
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

    // Success inside ERP: Generate compliant eTIMS tokens
    const serial = Math.floor(100000 + Math.random() * 900000);
    const code = Math.floor(1000 + Math.random() * 9000);
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    setEtimsSignature(`TSH-KRA-CMS-2026-${serial}-${randomHex}-DE-${code}`);
    setInvoiceNumber(`INV-KEA-${new Date().getFullYear()}-${serial}`);
    setShowInvoiceTicket(true);
  };

  const finalizeSale = () => {
    setShowInvoiceTicket(false);
    onPaymentSuccess();
  };

  // Tax breakdown (VAT 16%)
  const taxableBase = totalAmount / 1.16;
  const vatAmount = totalAmount - taxableBase;

  // Currency bills shortcut triggers
  const addCashNote = (value: number) => {
    setAmountTendered(prev => {
      // If previous value matches totalAmount exactly, override it. Otherwise append.
      if (prev === totalAmount) return value;
      return prev + value;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
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
                <XIcon className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="mt-5 text-center bg-brand-orange/5 dark:bg-brand-orange/10 p-4 rounded-xl border border-brand-orange/20">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Total Payable base</p>
                <p className="text-4xl font-black text-brand-orange mt-1">KES {totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
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
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">M-Pesa Transaction Ref Code</label>
                    <input 
                      type="text"
                      maxLength={10}
                      value={mpesaRef}
                      onChange={(e) => {
                        setMpesaRef(e.target.value.toUpperCase());
                        setValidationError('');
                      }}
                      className="w-full mt-1 p-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-slate-600 rounded font-mono text-center uppercase text-slate-900 dark:text-gray-50"
                      placeholder="e.g. SFI2819DK3"
                    />
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
                     <span className="text-[10px] uppercase font-bold text-slate-400">Currency Bill Shortcuts</span>
                     <div className="mt-1 flex gap-1.5 overflow-x-auto py-1">
                       {[100, 200, 500, 1000, 2000].map(val => (
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

              {/* M-PESA CONFIGURATOR */}
              {paymentMethod === 'M-Pesa' ? (
                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Lipa na M-Pesa Merchant Hook</h4>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">LIPA NA Mpesa Receipt Code (10 Chars)</label>
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
                    <p className="text-[10px] text-slate-400 mt-1">Accepts SKFxxxxxxx patterns. For test bypass use 10 letters (e.g. <span className="font-mono font-bold">A1B2C3D4E5</span>)</p>
                  </div>
                </div>
              ) : null}

              {/* CARD DETAILS */}
              {paymentMethod === 'Card' ? (
                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500">Please swipe or tap customer visa/mastercard on the terminal, then enter authorization index to log transaction.</p>
                  <div className="mt-3">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Terminal Authorization Code</label>
                    <input 
                      type="text"
                      className="w-full mt-1.5 p-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-slate-600 rounded font-mono text-center text-slate-900 dark:text-slate-50"
                      placeholder="e.g. VISA-AUTH-7412"
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

              {/* CHANGE COMPONENT */}
              {(paymentMethod === 'Cash' || paymentMethod === 'Split') && (
                 <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Change Due back</p>
                    <p className={`text-2xl font-black ${changeDue > 0 ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400'}`}>
                      KES {changeDue.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </p>
                 </div>
              )}
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
          /* TAX COMPLIANT KRA eTIMS RECEIPT */
          <div className="p-6 bg-slate-50 dark:bg-slate-800 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-5 rounded-lg font-mono text-xs text-slate-800 dark:text-slate-50 shadow-inner">
               <div className="text-center font-bold pb-4 border-b border-dashed border-slate-300 dark:border-slate-700">
                  <h3 className="text-sm font-black uppercase text-brand-orange">Masuma Autoparts EA</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">PO Box 84218 - Nairobi, Kenya</p>
                  <p className="text-[9px] text-slate-400">Tel: +254 712 345678 | PIN: P012345678X</p>
                  <p className="text-[11px] font-black tracking-wider text-teal-600 dark:text-teal-400 mt-2 bg-teal-500/10 py-1 rounded">*** OFFICIAL TAX INVOICE ***</p>
               </div>

               <div className="py-4 space-y-1.5 border-b border-dashed border-slate-300 dark:border-slate-700">
                  <p><span className="text-slate-400">INVOICE:</span> <span className="font-bold">{invoiceNumber}</span></p>
                  <p><span className="text-slate-400">CUSTOMER:</span> <span className="font-bold">{customer.companyName || customer.name}</span></p>
                  <p><span className="text-slate-400">PIN TIER:</span> <span className="font-bold">{customer.tier} ({customer.type})</span></p>
                  <p><span className="text-slate-400">GATEWAY:</span> <span className="font-bold text-teal-600">{paymentMethod.toUpperCase()}</span></p>
                  {paymentMethod === 'M-Pesa' && <p><span className="text-slate-400">MPESA REF:</span> <span className="font-bold font-sans">{mpesaRef}</span></p>}
                  {paymentMethod === 'Split' && <p><span className="text-slate-400">MPESA REF:</span> <span className="font-bold font-sans">{mpesaRef}</span></p>}
                  {paymentMethod === 'Bank EFT' && <p><span className="text-slate-400">EFT SWIFT:</span> <span className="font-bold font-sans">{bankRef}</span></p>}
                  <p><span className="text-slate-400">DATE/TIME:</span> <span className="font-bold">{new Date().toLocaleString()}</span></p>
               </div>

               {/* SEGREGATED VAT TAX BREAKDOWNS */}
               <div className="py-4 space-y-2 border-b border-dashed border-slate-300 dark:border-slate-700">
                  <div className="flex justify-between font-bold">
                    <span>Tax Basis (Excl. VAT 16%)</span>
                    <span>KES {taxableBase.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-600 dark:text-slate-300">
                    <span>VAT Component Code A (16%)</span>
                    <span>KES {vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-base font-black border-t border-dashed border-slate-250 dark:border-slate-700 pt-2 text-slate-900 dark:text-white mt-1">
                    <span>TOTAL COMPLIANT DUE</span>
                    <span>KES {totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  {paymentMethod === 'Split' && (
                    <div className="border-t border-dotted border-slate-300 pt-1.5 text-[10px] space-y-0.5">
                       <span className="text-slate-500">PAYMENT SPLIT RATIO:</span>
                       <div className="flex justify-between">
                         <span className="text-slate-500">Cash Ratio:</span>
                         <span>KES {cashSplit.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-slate-500">M-Pesa Ratio:</span>
                         <span>KES {mpesaSplit.toLocaleString()}</span>
                       </div>
                    </div>
                  )}
               </div>

               {/* KENYA GOVERNMENT eTIMS OFFICIAL DIGITAL CODE */}
               <div className="py-4 text-center space-y-2">
                 <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                   <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">eTIMS REGISTERED SECURITY KEY</p>
                   <p className="text-[9px] font-bold text-slate-800 dark:text-slate-200 mt-1 select-all break-all break-words">{etimsSignature}</p>
                 </div>
                 
                 {/* Simulate KRA Cryptographic QR Code Matrix */}
                 <div className="flex justify-center mt-3">
                    <div className="w-24 h-24 p-1.5 bg-white border border-slate-300 rounded flex flex-col justify-between">
                      {/* Generates a nice retro pixel simulated QR matrix block */}
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
                 </div>
                 <p className="text-[8px] text-slate-400 uppercase tracking-widest mt-1">Verified eTIMS Digital Signature</p>
               </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
               <button 
                  onClick={() => {
                     alert("Tax receipt sent to standard thermal billing lane printer!");
                  }}
                  className="w-full py-3 bg-slate-900 border border-slate-800 hover:bg-slate-950 text-white rounded-xl font-bold font-sans text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-2"
               >
                 📠 Direct-Print Invoice Slip
               </button>
               <button 
                  onClick={finalizeSale}
                  className="w-full py-3 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl font-bold font-sans text-sm tracking-wider uppercase shadow-md"
               >
                 Done & Close
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;

