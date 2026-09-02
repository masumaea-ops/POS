import React, { useState } from 'react';
import { X } from 'lucide-react';

interface DiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyDiscount: (discountPercentage: number) => void;
}

const DiscountModal: React.FC<DiscountModalProps> = ({ isOpen, onClose, onApplyDiscount }) => {
    const [discount, setDiscount] = useState(0);

    if (!isOpen) return null;

    const handleApply = () => {
        // Here you could add logic to check for manager approval for high discounts
        onApplyDiscount(discount);
    }

    return (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-sm p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Apply Discount</h2>
                     <button onClick={onClose} className="p-2 rounded-full hover:bg-surface dark:hover:bg-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mt-6">
                    <label htmlFor="discount-percent" className="font-semibold">Discount Percentage (%)</label>
                    <input 
                        id="discount-percent"
                        type="number"
                        value={discount || ''}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        className="mt-2 w-full text-lg p-3 border border-surface-2 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        placeholder="e.g. 10"
                    />
                </div>
                 <div className="mt-6">
                    <button 
                        onClick={handleApply}
                        className="w-full py-3 font-bold bg-brand-orange text-white rounded-lg"
                    >
                        Apply Discount
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiscountModal;
