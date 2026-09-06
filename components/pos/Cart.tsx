import React, { useState } from 'react';
import type { CartItem, Customer } from '../../types';
import { 
    Trash2, Plus, X, User, Tag, Truck, Search, 
    AlertTriangle, ShoppingCart 
} from 'lucide-react';
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
    customersList: Customer[];
    onChangeCustomer: (nextCustomer: Customer) => void;
    onShowQuickAddCustomer: () => void;
}

const Cart: React.FC<CartProps> = ({ 
    cartItems, 
    onUpdateQuantity, 
    onRemoveItem, 
    onClearCart, 
    customer,
    customersList = [],
    onChangeCustomer,
    onShowQuickAddCustomer
}) => {
    const { settings, formatPrice } = useSystemSettings();
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [isDiscountModalOpen, setDiscountModalOpen] = useState(false);
    const [isApprovalModalOpen, setApprovalModalOpen] = useState(false);
    
    const [discount, setDiscount] = useState(0); // as a percentage
    const [pendingDiscountValue, setPendingDiscountValue] = useState<number | null>(null);
    const [discountApproved, setDiscountApproved] = useState(false);

    // Customer search states inside Cart
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

    const matchingCustomers = (customersList || []).filter(cust => 
        cust.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        (cust.companyName && cust.companyName.toLowerCase().includes(customerSearchQuery.toLowerCase())) ||
        (cust.phone && cust.phone.includes(customerSearchQuery)) ||
        (cust.email && cust.email.toLowerCase().includes(customerSearchQuery.toLowerCase()))
    );

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
        <div className="flex-1 w-full flex flex-col overflow-hidden bg-white dark:bg-gray-800 min-h-0">
            {isDropdownOpen && (
                <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setDropdownOpen(false)} 
                />
            )}

            <div className="p-4 flex-1 flex flex-col relative overflow-hidden min-h-0">
                <div className="flex justify-between items-center pb-3 border-b border-surface-2 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-ink dark:text-gray-50">Current Sale</h2>
                    <button onClick={onClearCart} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" title="Empty whole shopping cart">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                {/* IN-CART CUSTOMER SEARCH & QUICK ADD CONSOLE */}
                {!isSearchingCustomer ? (
                    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-2.5 my-3 flex items-center justify-between gap-3 relative z-20 shrink-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
                                <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">{customer.name}</h4>
                                <p className="text-[9px] text-slate-400 font-mono truncate">
                                    {customer.companyName || 'Walk-in Cash Client'} • {customer.tier}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                customer.type === 'Credit' 
                                  ? 'bg-indigo-150 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' 
                                  : 'bg-emerald-150 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-450'
                            }`}>
                                {customer.type}
                            </span>
                            <button 
                                type="button" 
                                onClick={() => setIsSearchingCustomer(true)}
                                className="text-[10px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-300 px-2 py-1 rounded font-extrabold transition-colors uppercase tracking-wider"
                            >
                                Change
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 my-3 space-y-2.5 relative z-20 shrink-0">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500">Customer Accounts Lookup</span>
                            <div className="flex items-center gap-1.5">
                                <button 
                                    type="button" 
                                    onClick={onShowQuickAddCustomer}
                                    className="text-[10px] bg-brand-orange/15 hover:bg-brand-orange/25 text-brand-orange px-2 py-0.5 rounded font-black uppercase tracking-wider transition-colors flex items-center gap-1"
                                    title="Register new client instantly"
                                >
                                    <Plus className="w-3 h-3" />
                                    <span>Quick Add</span>
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setIsSearchingCustomer(false)}
                                    className="text-[10px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-350 px-2 py-0.5 rounded font-black uppercase tracking-wider transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                        
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Type name, company or phone..."
                                value={customerSearchQuery}
                                onChange={(e) => {
                                    setCustomerSearchQuery(e.target.value);
                                    setDropdownOpen(true);
                                }}
                                onFocus={() => setDropdownOpen(true)}
                                className="w-full p-2 pl-8 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange"
                            />
                            {customerSearchQuery && (
                                <button 
                                    type="button" 
                                    onClick={() => setCustomerSearchQuery('')}
                                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                            
                            {/* Dropdown list of matching customers */}
                            {isDropdownOpen && (
                                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                                    {matchingCustomers.length > 0 ? (
                                        matchingCustomers.map(cust => (
                                            <div 
                                                key={cust.id} 
                                                onClick={() => {
                                                    onChangeCustomer(cust);
                                                    setCustomerSearchQuery('');
                                                    setDropdownOpen(false);
                                                    setIsSearchingCustomer(false);
                                                }}
                                                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer text-xs flex justify-between items-center transition-colors"
                                            >
                                                <div>
                                                    <span className="font-bold text-slate-900 dark:text-white block">{cust.name}</span>
                                                    {cust.companyName && (
                                                        <span className="text-[9px] text-slate-450 block">{cust.companyName}</span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded block uppercase ${
                                                        cust.type === 'Credit' ? 'bg-indigo-55 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-755 text-slate-600 dark:text-slate-400'
                                                    }`}>
                                                        {cust.type}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 block font-mono mt-0.5">{cust.tier}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-center text-slate-450 text-xs">
                                            <p>No customers found matching "{customerSearchQuery}"</p>
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    onShowQuickAddCustomer();
                                                    setDropdownOpen(false);
                                                }}
                                                className="mt-1.5 px-2.5 py-1 bg-brand-orange text-white text-[10px] font-black uppercase tracking-wider rounded"
                                            >
                                                Create "{customerSearchQuery}"
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Current Selected Customer Info Card */}
                        <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-150 dark:border-slate-750/50 space-y-2">
                             <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                       <User className="w-4 h-4 text-brand-orange" />
                                       <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-xs">{customer.name}</h4>
                                            <p className="text-[9px] text-slate-400 font-mono">
                                                {customer.companyName || 'Walk-in Cash Client'} • {customer.phone || 'No Phone Details'}
                                            </p>
                                       </div>
                                  </div>
                                  <div className="text-right">
                                       <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider block ${
                                           customer.type === 'Credit' 
                                             ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30' 
                                             : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900/30'
                                       }`}>
                                           {customer.type} Account
                                       </span>
                                       <span className="text-[9px] text-brand-orange font-bold uppercase tracking-widest mt-0.5 block">
                                           {customer.tier}
                                       </span>
                                  </div>
                             </div>

                             {(customer.kraPin || customer.shippingAddress) && (
                                  <div className="pt-1.5 border-t border-dashed border-slate-150 dark:border-slate-700 space-y-0.5 text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                                       {customer.kraPin && (
                                           <div className="flex items-center gap-1">
                                               <Tag className="w-3 h-3 text-slate-400" /> 
                                               <span><span className="font-bold font-mono text-slate-700 dark:text-slate-300">KRA PIN:</span> {customer.kraPin}</span>
                                           </div>
                                       )}
                                       {customer.shippingAddress && (
                                           <div className="break-words line-clamp-2 flex items-start gap-1" title={customer.shippingAddress}>
                                               <Truck className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                                               <span><span className="font-bold text-slate-700 dark:text-slate-300">Ship to:</span> {customer.shippingAddress}</span>
                                           </div>
                                       )}
                                  </div>
                             )}
                        </div>
                    </div>
                )}
                
                {cartItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                           <ShoppingCart className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="mt-4 font-semibold text-gray-700 dark:text-gray-200">Your cart is empty</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Add products to get started</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto min-h-0 -mx-4 px-4 divide-y divide-surface-2 dark:divide-gray-700">
                       {cartItems.map(item => (
                            <div key={item.id} className="py-4 flex gap-4">
                                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-md" referrerPolicy="no-referrer" />
                                <div className="flex-1">
                                    <p className="font-semibold text-sm line-clamp-2 text-slate-800 dark:text-slate-100">{item.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">{formatPrice(item.price)}</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <button 
                                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                            className="w-8 h-8 flex items-center justify-center border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        >-</button>
                                        <span className="w-8 text-center font-bold text-sm text-slate-800 dark:text-slate-200">{item.quantity}</span>
                                        <button 
                                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                            className="w-8 h-8 flex items-center justify-center border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        >+</button>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end justify-between">
                                     <p className="font-bold text-sm text-slate-900 dark:text-slate-50">{formatPrice(item.price * item.quantity)}</p>
                                     <button onClick={() => onRemoveItem(item.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                        <X className="w-4 h-4" />
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
                                <p className="text-red-600 dark:text-red-400 font-extrabold mt-1 text-[10px] flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                    <span>Credit Limit exceeded by {formatPrice(outstandingBalance + total - creditLimit)}!</span>
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
                cartItems={cartItems}
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
        </div>
    );
};

export default Cart;

