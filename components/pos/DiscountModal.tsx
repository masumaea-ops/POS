import React, { useState } from 'react';
import { X, Percent, ShieldAlert, Check } from 'lucide-react';

interface DiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyDiscount: (discountPercentage: number) => void;
    currentDiscount?: number;
    subtotal?: number;
}

const DiscountModal: React.FC<DiscountModalProps> = ({ 
    isOpen, 
    onClose, 
    onApplyDiscount,
    currentDiscount = 0,
    subtotal = 0
}) => {
    const [discount, setDiscount] = useState<number>(currentDiscount);

    if (!isOpen) return null;

    const discountPresets = [5, 8, 10, 12, 15, 20];
    const requiresApproval = discount > 15;
    const discountAmount = subtotal > 0 ? (subtotal * discount) / 100 : 0;

    const handleApply = () => {
        onApplyDiscount(discount);
    };

    return (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-750">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-brand-orange/10 dark:bg-brand-orange/20 text-brand-orange flex items-center justify-center">
                            <Percent className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Apply Cart Discount</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Apply line percentage adjustment to current order</p>
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Quick Presets */}
                <div className="mt-5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                        Discount Presets
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {discountPresets.map(preset => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => setDiscount(preset)}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                                    discount === preset
                                        ? 'bg-brand-orange text-white border-brand-orange shadow-xs'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-orange/50 dark:hover:border-brand-orange/50'
                                }`}
                            >
                                <span>{preset}% Off</span>
                                {preset > 15 && (
                                    <ShieldAlert className={`w-3 h-3 ${discount === preset ? 'text-white' : 'text-amber-500'}`} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Percentage Input */}
                <div className="mt-5">
                    <label htmlFor="discount-percent" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                        Custom Percentage (%)
                    </label>
                    <div className="relative">
                        <input 
                            id="discount-percent"
                            type="number"
                            min="0"
                            max="100"
                            value={discount === 0 ? '' : discount}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setDiscount(isNaN(val) ? 0 : Math.min(100, Math.max(0, val)));
                            }}
                            className="w-full text-lg font-bold p-3 pr-10 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-orange focus:outline-none"
                            placeholder="0"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-mono">
                            %
                        </span>
                    </div>
                </div>

                {/* Manager Approval Notice for > 15% */}
                {requiresApproval ? (
                    <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div className="space-y-0.5">
                            <span className="font-bold">Supervisor Authorization Required</span>
                            <p className="text-[11px] text-amber-600/90 dark:text-amber-400/90 leading-relaxed">
                                Discounts over 15% require an authorized manager PIN override before applying.
                            </p>
                        </div>
                    </div>
                ) : discount > 0 ? (
                    <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
                        <span className="font-semibold">Standard Cashier Privilege</span>
                        <span className="font-bold">Auto-Approved</span>
                    </div>
                ) : null}

                {/* Calculation Preview if subtotal provided */}
                {subtotal > 0 && discount > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-750 flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Estimated Deduction:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                            KES {discountAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex gap-2.5">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    {discount > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                setDiscount(0);
                                onApplyDiscount(0);
                            }}
                            className="py-2.5 px-3 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer"
                        >
                            Reset
                        </button>
                    )}
                    <button 
                        type="button"
                        onClick={handleApply}
                        className="flex-1 py-2.5 text-xs font-bold bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply {discount}%</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiscountModal;
