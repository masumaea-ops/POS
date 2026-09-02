import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApprove: () => void;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({ isOpen, onClose, onApprove }) => {
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
            setError('🔴 Access Denied: Invalid Manager PIN. (Use 1234 or 9999 for demo)');
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-6 text-center border border-slate-200 dark:border-slate-700">
                <div className="flex justify-end">
                     <button onClick={() => { setPin(''); setError(''); onClose(); }} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 -mt-2 -mr-2">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                <div className="w-12 h-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold">🔒</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Supervisor Override</h2>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Required for discounts exceeding 15% or credit limit bypass authorization.
                </p>

                <form onSubmit={handleSubmit} className="mt-6">
                    <label htmlFor="manager-pin" className="sr-only">Manager PIN</label>
                    <input 
                        id="manager-pin"
                        type="password"
                        value={pin}
                        onChange={(e) => {
                            setPin(e.target.value);
                            if (error) setError('');
                        }}
                        autoFocus
                        className="w-full text-2xl tracking-widest p-3 border border-surface-2 dark:border-gray-600 rounded-lg text-center bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-brand-orange focus:outline-none"
                        placeholder="••••"
                    />
                    
                    {error && (
                        <p className="mt-2.5 text-xs text-red-500 font-semibold">{error}</p>
                    )}

                    <p className="mt-2 text-[10px] text-slate-400">Demo Code Hint: <span className="font-mono font-bold bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">1234</span></p>

                    <div className="mt-6 flex gap-4">
                        <button 
                            type="button"
                            onClick={() => { setPin(''); setError(''); onClose(); }}
                            className="flex-1 py-3 text-sm font-bold border border-gray-300 dark:border-gray-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 py-3 text-sm font-bold bg-brand-orange hover:bg-brand-orange/90 text-white rounded-lg shadow-sm"
                        >
                            Approve
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApprovalModal;

