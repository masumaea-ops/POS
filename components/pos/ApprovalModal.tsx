import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle, KeyRound, Check } from 'lucide-react';

interface ApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApprove: () => void;
    reason?: string;
    title?: string;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({ 
    isOpen, 
    onClose, 
    onApprove,
    reason = "Required for discounts exceeding 15% or credit limit bypass authorization.",
    title = "Supervisor Override Authorization"
}) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        // Demo pincode verification
        if (pin === '1234' || pin === '9999') {
            setError('');
            setPin('');
            onApprove();
        } else {
            setError('Access Denied: Invalid supervisor credentials. Please verify your PIN.');
        }
    };

    const handleNumberClick = (num: string) => {
        if (pin.length < 6) {
            setPin(prev => prev + num);
            if (error) setError('');
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
        if (error) setError('');
    };
    
    return (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-750">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-800/60">
                        Security Clearance
                    </span>
                    <button 
                        type="button"
                        onClick={() => { setPin(''); setError(''); onClose(); }} 
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mx-auto mt-4 mb-3 border border-purple-200/60 dark:border-purple-800/60 shadow-xs">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                    {reason}
                </p>

                <form onSubmit={handleSubmit} className="mt-5">
                    {/* PIN Display Dots */}
                    <div className="flex justify-center items-center gap-3 my-4">
                        {[0, 1, 2, 3].map(idx => (
                            <div 
                                key={idx}
                                className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                                    idx < pin.length 
                                        ? 'bg-purple-600 border-purple-600 scale-110' 
                                        : 'bg-transparent border-slate-300 dark:border-slate-600'
                                }`}
                            />
                        ))}
                    </div>

                    <input 
                        id="manager-pin"
                        type="password"
                        value={pin}
                        onChange={(e) => {
                            setPin(e.target.value);
                            if (error) setError('');
                        }}
                        maxLength={6}
                        autoFocus
                        className="w-full text-xl tracking-widest py-2.5 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-center bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono font-bold"
                        placeholder="••••"
                    />

                    {/* Numeric keypad for fast touch terminal input */}
                    <div className="grid grid-cols-3 gap-1.5 mt-3 text-sm font-semibold">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                            <button
                                key={digit}
                                type="button"
                                onClick={() => handleNumberClick(digit)}
                                className="py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer active:scale-95"
                            >
                                {digit}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setPin('')}
                            className="py-2.5 rounded-xl text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={() => handleNumberClick('0')}
                            className="py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer active:scale-95"
                        >
                            0
                        </button>
                        <button
                            type="button"
                            onClick={handleBackspace}
                            className="py-2.5 rounded-xl text-xs font-mono text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                        >
                            ⌫
                        </button>
                    </div>
                    
                    {error && (
                        <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1.5 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="mt-3 py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-750 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span>Demo Master Passcode:</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">1234</span>
                    </div>

                    <div className="mt-4 flex gap-2.5">
                        <button 
                            type="button"
                            onClick={() => { setPin(''); setError(''); onClose(); }}
                            className="flex-1 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={pin.length === 0}
                            className="flex-1 py-2.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Authorize</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApprovalModal;
