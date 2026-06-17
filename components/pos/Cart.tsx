import React, { useState } from 'react';
import type { CartItem, Customer } from '../../types';
import { TrashIcon, PlusIcon, XIcon } from '../shared/Icons';
import PaymentModal from './PaymentModal';
import DiscountModal from './DiscountModal';
import ApprovalModal from './ApprovalModal';
import { useSystemSettings } from '../../contexts/SettingsContext';

interface CartProps {
    cartItems: CartItem[];
    onUpdateQuantity: (productId: number, newQuantity: number) => void;
    onRemoveItem: (productId: number) => void;
    onClearCart: () => void;
    customer: Customer;
}

const Cart: React.FC<CartProps> = ({ cartItems, onUpdateQuantity, onRemoveItem, onClearCart, customer }) => {
    const { settings, formatPrice } = useSystemSettings();
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [isDiscountModalOpen, setDiscountModalOpen] = useState(false);
    const [isApprovalModalOpen, setApprovalModalOpen] = useState(false);
    
    const [discount, setDiscount] = useState(0); // as a percentage
    const [pendingDiscountValue, setPendingDiscountValue] = useState<number | null>(null);
    const [discountApproved, setDiscountApproved] = useState(false);

    // Calculate subtotal from cartItems
    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = subtotal * (settings.vatRate / 100); // Dynamic VAT from settings
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal + tax - discountAmount;

    // Credit capacity checker
    const creditLimit = customer.creditLimit || 0;
    const outstandingBalance = customer.outstandingBalance || 0;
    const isCreditCustomer = customer.type === 'Credit';
    const hasCreditLimitExceeded = isCreditCustomer && (outstandingBalance + total > creditLimit);

    const handleApplyDiscountClick = (newDiscount: number) => {
        // Discounts greater than 15% require secure manager passcode approval
        if (newDiscount > 15 && !discountApproved) {
            setPendingDiscountValue(newDiscount);
            setApprovalModalOpen(true);
        } else {
            setDiscount(newDiscount);
            setDiscountModalOpen(false);
            setDiscountApproved(false); // Reset back to default
        }
    };

    const handleManagerApproved = () => {
        if (pendingDiscountValue !== null) {
            setDiscount(pendingDiscountValue);
            setDiscountApproved(true);
            setPendingDiscountValue(null);
        }
        setApprovalModalOpen(false);
        setDiscountModalOpen(false);
    };

    const handleSaleComplete = () => {
        onClearCart();
        setDiscount(0);
        setDiscountApproved(false);
        setPaymentModalOpen(false);
    };

    return (
        <>
            <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center pb-4 border-b border-surface-2 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-ink dark:text-gray-50">Current Sale</h2>
                        <span className="text-xs bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded font-bold uppercase tracking-wider mt-1 inline-block">
                           Tier: {customer.tier}
                        </span>
                    </div>
                    <button onClick={onClearCart} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                        <TrashIcon />
                    </button>
                </div>
                
                {cartItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                           <PlusIcon />
                        </div>
                        <p className="mt-4 font-semibold text-gray-700 dark:text-gray-200">Your cart is empty</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Add products to get started</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto -mx-4 px-4 divide-y divide-surface-2 dark:divide-gray-700">
                       {cartItems.map(item => (
                            <div key={item.id} className="py-4 flex gap-4">
                                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-md" referrerPolicy="no-referrer" />
                                <div className="flex-1">
                                    <p className="font-semibold text-sm line-clamp-2">{item.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">{formatPrice(item.price)}</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <button 
                                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                            className="w-8 h-8 flex items-center justify-center border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                                        >-</button>
                                        <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                        <button 
                                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                            className="w-8 h-8 flex items-center justify-center border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                                        >+</button>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end justify-between">
                                     <p className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</p>
                                     <button onClick={() => onRemoveItem(item.id)} className="p-1 text-gray-400 hover:text-red-500">
                                        <XIcon className="w-4 h-4" />
                                     </button>
                                </div>
                            </div>
                       ))}
                    </div>
                )}
            </div>

            {cartItems.length > 0 && (
                <div className="p-4 border-t border-surface-2 dark:border-gray-700 space-y-3 text-sm bg-slate-50 dark:bg-slate-900/40">
                    {/* Customer Account Summary in Cart */}
                    {isCreditCustomer && (
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                            <span className="font-bold text-slate-500 dark:text-slate-400">B2B Credit Account Status:</span>
                            <div className="grid grid-cols-2 gap-1 mt-1 text-slate-600 dark:text-slate-300">
                                <span>Limit Capac: {formatPrice(creditLimit)}</span>
                                <span>Oust. Debt: {formatPrice(outstandingBalance)}</span>
                            </div>
                            <div className="mt-1.5 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full ${hasCreditLimitExceeded ? 'bg-red-500' : 'bg-brand-orange'}`} 
                                    style={{ width: `${Math.min(100, ((outstandingBalance + total) / creditLimit) * 100)}%` }}
                                ></div>
                            </div>
                            {hasCreditLimitExceeded && (
                                <p className="text-red-600 dark:text-red-400 font-extrabold mt-1 text-[10px]">
                                    ⚠️ Credit Limit exceeded by {formatPrice(outstandingBalance + total - creditLimit)}!
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold">{formatPrice(subtotal)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Discount ({discount}%)</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">- {formatPrice(discountAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>VAT ({settings.vatRate}%)</span>
                        <span className="font-semibold">{formatPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold border-t border-surface-2 dark:border-gray-600 pt-3 mt-3 text-ink dark:text-gray-50">
                        <span>Total ({settings.currency})</span>
                        <span>{formatPrice(total)}</span>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button onClick={() => setDiscountModalOpen(true)} className="flex-1 py-2 text-xs font-bold border border-brand-orange text-brand-orange rounded-lg hover:bg-brand-orange/10 transition-colors">
                            Apply Discount
                        </button>
                        <button onClick={() => {
                            alert("Cart Held Successfully! (Draft transaction saved)");
                            onClearCart();
                        }} className="flex-1 py-2 text-xs font-bold border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            Hold Ticket
                        </button>
                    </div>

                    <button 
                        onClick={() => {
                            if (hasCreditLimitExceeded) {
                                alert("WARNING: Credit Limit Exceeded! Requiring manager passcode override to proceed.");
                                setApprovalModalOpen(true);
                            } else {
                                setPaymentModalOpen(true);
                            }
                        }} 
                        className={`w-full py-3.5 text-base font-bold text-white rounded-lg transition-all shadow-md ${
                            hasCreditLimitExceeded 
                            ? 'bg-red-600 hover:bg-red-700 cursor-pointer animate-pulse' 
                            : 'bg-brand-orange hover:bg-brand-orange/95'
                        }`}
                    >
                        {hasCreditLimitExceeded ? "Override Credit Guard & Pay" : `Charge ${formatPrice(total)}`}
                    </button>
                </div>
            )}
            
            <PaymentModal 
                isOpen={isPaymentModalOpen} 
                onClose={() => setPaymentModalOpen(false)}
                totalAmount={total}
                onPaymentSuccess={handleSaleComplete}
                customer={customer}
            />
            <DiscountModal 
                isOpen={isDiscountModalOpen}
                onClose={() => setDiscountModalOpen(false)}
                onApplyDiscount={handleApplyDiscountClick}
            />
            <ApprovalModal 
                isOpen={isApprovalModalOpen}
                onClose={() => setApprovalModalOpen(false)}
                onApprove={() => {
                    if (hasCreditLimitExceeded) {
                        alert("Manager Passcode Approved! Credit guard overridden.");
                        setApprovalModalOpen(false);
                        setPaymentModalOpen(true);
                    } else {
                        handleManagerApproved();
                    }
                }}
            />
        </>
    );
};

export default Cart;

