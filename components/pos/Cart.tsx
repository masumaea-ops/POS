import React, { useState } from 'react';
import type { CartItem, Customer } from '../../types';
import { 
    Trash2, Plus, Minus, X, User, Tag, Truck, Search, 
    AlertCircle, ShoppingCart, Percent, Clock, CreditCard,
    ShieldAlert, CheckCircle2, ChevronDown
} from 'lucide-react';
import PaymentModal from './PaymentModal';
import DiscountModal from './DiscountModal';
import ApprovalModal from './ApprovalModal';
import { useSystemSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';

interface CartProps {
    cartItems: CartItem[];
    onUpdateQuantity: (productId: number, newQuantity: number) => void;
    onRemoveItem: (productId: number) => void;
    onClearCart: () => void;
    customer: Customer;
    customersList: Customer[];
    onChangeCustomer: (nextCustomer: Customer) => void;
    onShowQuickAddCustomer: () => void;
    onHoldTicket?: (note?: string) => void;
    heldTicketsCount?: number;
    onOpenHeldTickets?: () => void;
    onNotify?: (message: string, isError?: boolean) => void;
}

const Cart: React.FC<CartProps> = ({ 
    cartItems, 
    onUpdateQuantity, 
    onRemoveItem, 
    onClearCart, 
    customer,
    customersList = [],
    onChangeCustomer,
    onShowQuickAddCustomer,
    onHoldTicket,
    heldTicketsCount = 0,
    onOpenHeldTickets,
    onNotify
}) => {
    const { settings, formatPrice } = useSystemSettings();
    const { hasPermission, userRole } = useAuth();
    const canCreateOrder = hasPermission('pos', 'create');
    
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [isDiscountModalOpen, setDiscountModalOpen] = useState(false);
    const [isApprovalModalOpen, setApprovalModalOpen] = useState(false);
    const [approvalReason, setApprovalReason] = useState<string>('');
    const [approvalAction, setApprovalAction] = useState<'discount' | 'credit'>('discount');

    // Hold Ticket with Note Dialog
    const [isHoldDialogOpen, setIsHoldDialogOpen] = useState(false);
    const [holdNote, setHoldNote] = useState('');
    
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

    const notify = (msg: string, isError = false) => {
        if (onNotify) {
            onNotify(msg, isError);
        }
    };

    const handleApplyDiscountClick = (newDiscount: number) => {
        // Discounts greater than 15% require supervisor passcode approval
        if (newDiscount > 15 && !discountApproved) {
            setPendingDiscountValue(newDiscount);
            setApprovalAction('discount');
            setApprovalReason(`Discounts of ${newDiscount}% require supervisor authorization before applying.`);
            setApprovalModalOpen(true);
        } else {
            setDiscount(newDiscount);
            setDiscountModalOpen(false);
            setDiscountApproved(false);
            notify(`Applied ${newDiscount}% cart discount.`);
        }
    };

    const handleManagerApproved = () => {
        if (approvalAction === 'discount' && pendingDiscountValue !== null) {
            setDiscount(pendingDiscountValue);
            setDiscountApproved(true);
            setPendingDiscountValue(null);
            notify(`Supervisor approved ${pendingDiscountValue}% discount.`);
        } else if (approvalAction === 'credit') {
            notify("Supervisor approved credit limit override.", false);
            setPaymentModalOpen(true);
        }
        setApprovalModalOpen(false);
        setDiscountModalOpen(false);
    };

    const handleSaleComplete = () => {
        onClearCart();
        setDiscount(0);
        setDiscountApproved(false);
        setPaymentModalOpen(false);
        notify("Sale completed successfully and fiscal invoice recorded.");
    };

    const handleHoldTicketConfirm = () => {
        if (onHoldTicket) {
            onHoldTicket(holdNote.trim() || undefined);
        } else {
            onClearCart();
            notify("Cart ticket suspended and saved to drafts.");
        }
        setHoldNote('');
        setIsHoldDialogOpen(false);
    };

    return (
        <div className="flex-1 w-full flex flex-col overflow-hidden bg-white dark:bg-slate-850 min-h-0 border-l border-slate-200/80 dark:border-slate-800">
            {isDropdownOpen && (
                <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setDropdownOpen(false)} 
                />
            )}

            <div className="p-4 flex-1 flex flex-col relative overflow-hidden min-h-0">
                {/* Header */}
                <div className="flex justify-between items-center pb-3.5 border-b border-slate-150 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-orange/10 dark:bg-brand-orange/20 text-brand-orange flex items-center justify-center">
                            <ShoppingCart className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active Order Cart</h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} items in checkout queue
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {onOpenHeldTickets && (
                            <button
                                type="button"
                                onClick={onOpenHeldTickets}
                                className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                    heldTicketsCount > 0
                                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                }`}
                                title="View suspended tickets"
                            >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Held</span>
                                {heldTicketsCount > 0 && (
                                    <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                                        {heldTicketsCount}
                                    </span>
                                )}
                            </button>
                        )}

                        {cartItems.length > 0 && (
                            <button 
                                onClick={onClearCart} 
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer" 
                                title="Clear shopping cart"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* CUSTOMER SELECTOR / SUMMARY BAR */}
                {!isSearchingCustomer ? (
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750 rounded-xl p-3 my-3 flex items-center justify-between gap-2.5 shrink-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-brand-orange/10 dark:bg-brand-orange/20 flex items-center justify-center text-brand-orange shrink-0">
                                <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                    {customer.name}
                                </h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                    {customer.companyName || 'Cash Sale Client'} • <span className="font-semibold text-brand-orange">{customer.tier}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                customer.type === 'Credit' 
                                  ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800' 
                                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}>
                                {customer.type}
                            </span>
                            <button 
                                type="button" 
                                onClick={() => setIsSearchingCustomer(true)}
                                className="text-[10px] bg-slate-200/80 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md font-bold transition-colors uppercase tracking-wider cursor-pointer"
                            >
                                Change
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750 rounded-xl p-3 my-3 space-y-2.5 shrink-0 relative z-20">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                                Select Customer Account
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button 
                                    type="button" 
                                    onClick={onShowQuickAddCustomer}
                                    className="text-[10px] bg-brand-orange text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Register new client instantly"
                                >
                                    <Plus className="w-3 h-3" />
                                    <span>New Client</span>
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setIsSearchingCustomer(false)}
                                    className="text-[10px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                        
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search by name, company, or phone..."
                                value={customerSearchQuery}
                                onChange={(e) => {
                                    setCustomerSearchQuery(e.target.value);
                                    setDropdownOpen(true);
                                }}
                                onFocus={() => setDropdownOpen(true)}
                                className="w-full p-2 pl-8 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange"
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
                                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-750">
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
                                                className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer text-xs flex justify-between items-center transition-colors"
                                            >
                                                <div>
                                                    <span className="font-bold text-slate-900 dark:text-white block">{cust.name}</span>
                                                    {cust.companyName && (
                                                        <span className="text-[10px] text-slate-400 block">{cust.companyName}</span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded block uppercase ${
                                                        cust.type === 'Credit' 
                                                            ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300' 
                                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                    }`}>
                                                        {cust.type}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 block font-mono mt-0.5">{cust.tier}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-slate-400 text-xs">
                                            <p>No client records matching "{customerSearchQuery}"</p>
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    onShowQuickAddCustomer();
                                                    setDropdownOpen(false);
                                                }}
                                                className="mt-2 px-3 py-1.5 bg-brand-orange text-white text-[10px] font-bold uppercase tracking-wider rounded-lg"
                                            >
                                                Register New Customer
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* CART ITEMS LIST */}
                {cartItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                           <ShoppingCart className="w-7 h-7" />
                        </div>
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Current Sale is Empty</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                            Select products from the catalog or scan barcodes via camera / keyboard wedge.
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto min-h-0 -mx-4 px-4 divide-y divide-slate-150 dark:divide-slate-800">
                       {cartItems.map(item => (
                            <div key={item.id} className="py-3 flex gap-3 items-center">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-750 overflow-hidden shrink-0">
                                    <img 
                                        src={item.imageUrl} 
                                        alt={item.name} 
                                        className="w-full h-full object-cover" 
                                        referrerPolicy="no-referrer" 
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-xs line-clamp-1 text-slate-900 dark:text-white" title={item.name}>
                                        {item.name}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                        <span>{item.sku}</span>
                                        {item.oemCode && (
                                            <>
                                                <span>•</span>
                                                <span className="text-brand-orange">{item.oemCode}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 overflow-hidden">
                                            <button 
                                                type="button"
                                                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                                className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                                title="Decrease quantity"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-7 text-center font-bold text-xs text-slate-800 dark:text-slate-200 font-mono">
                                                {item.quantity}
                                            </span>
                                            <button 
                                                type="button"
                                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                                className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                                title="Increase quantity"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <span className="text-[11px] text-slate-400 font-mono">
                                            @ {formatPrice(item.price)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end justify-between self-stretch shrink-0 py-0.5">
                                    <button 
                                        type="button"
                                        onClick={() => onRemoveItem(item.id)} 
                                        className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                                        title="Remove item"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                    <p className="font-black text-xs font-mono text-slate-900 dark:text-white">
                                        {formatPrice(item.price * item.quantity)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CHECKOUT SUMMARY FOOTER */}
            {cartItems.length > 0 && (
                <div className="p-4 border-t border-slate-150 dark:border-slate-800 space-y-2.5 text-xs bg-slate-50/80 dark:bg-slate-900/60 shrink-0">
                    {/* B2B Credit Status Bar if customer is on Credit */}
                    {isCreditCustomer && (
                        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 text-xs">
                            <div className="flex items-center justify-between font-semibold text-slate-600 dark:text-slate-300">
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">Trade Credit Limit:</span>
                                <span className="font-mono">{formatPrice(creditLimit)}</span>
                            </div>
                            <div className="flex items-center justify-between font-semibold text-slate-600 dark:text-slate-300 mt-1">
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">Current Exposure + Order:</span>
                                <span className={`font-mono ${hasCreditLimitExceeded ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}`}>
                                    {formatPrice(outstandingBalance + total)}
                                </span>
                            </div>
                            <div className="mt-1.5 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all ${hasCreditLimitExceeded ? 'bg-rose-500' : 'bg-brand-orange'}`} 
                                    style={{ width: `${Math.min(100, ((outstandingBalance + total) / (creditLimit || 1)) * 100)}%` }}
                                />
                            </div>
                            {hasCreditLimitExceeded && (
                                <div className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                                    <span>Exceeds credit limit by {formatPrice(outstandingBalance + total - creditLimit)}. Supervisor passcode required.</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>Subtotal (Net)</span>
                            <span className="font-mono font-medium">{formatPrice(subtotal)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                                <span>Discount ({discount}%)</span>
                                <span className="font-mono">- {formatPrice(discountAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>VAT ({settings.vatRate}%)</span>
                            <span className="font-mono font-medium">{formatPrice(tax)}</span>
                        </div>
                        <div className="flex justify-between items-baseline text-base font-black border-t border-slate-200 dark:border-slate-750 pt-2 text-slate-900 dark:text-white">
                            <span>Total Compliant Due</span>
                            <span className="text-lg font-mono text-brand-orange">{formatPrice(total)}</span>
                        </div>
                    </div>

                    {/* Quick Operations Row: Discount & Hold Ticket */}
                    <div className="flex gap-2 pt-1">
                        <button 
                            type="button"
                            onClick={() => setDiscountModalOpen(true)} 
                            className="flex-1 py-2 px-2 text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-brand-orange dark:hover:border-brand-orange rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                            <Percent className="w-3.5 h-3.5 text-brand-orange" />
                            <span>{discount > 0 ? `${discount}% Applied` : 'Discount'}</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => setIsHoldDialogOpen(true)}
                            className="flex-1 py-2 px-2 text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Hold Ticket</span>
                        </button>
                    </div>

                    {/* Primary Checkout Button */}
                    <button 
                        type="button"
                        onClick={() => {
                            if (!canCreateOrder) {
                                notify(`Checkout is restricted in Read-Only inquiry mode for role '${userRole}'.`, true);
                                return;
                            }
                            if (hasCreditLimitExceeded) {
                                setApprovalAction('credit');
                                setApprovalReason(`Credit limit exceeded by ${formatPrice(outstandingBalance + total - creditLimit)}. Supervisor approval is required to override credit guard.`);
                                setApprovalModalOpen(true);
                            } else {
                                setPaymentModalOpen(true);
                            }
                        }} 
                        disabled={!canCreateOrder}
                        className={`w-full py-3 text-sm font-bold text-white rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                            !canCreateOrder
                            ? 'bg-slate-700 cursor-not-allowed opacity-60 text-slate-400'
                            : hasCreditLimitExceeded 
                            ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                            : 'bg-brand-orange hover:bg-brand-orange/90 text-white'
                        }`}
                    >
                        {!canCreateOrder ? (
                            <span>Checkout Restricted ({userRole})</span>
                        ) : hasCreditLimitExceeded ? (
                            <>
                                <ShieldAlert className="w-4 h-4" />
                                <span>Supervisor Override & Pay</span>
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-4 h-4" />
                                <span>Charge {formatPrice(total)}</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Hold Ticket Modal */}
            {isHoldDialogOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl w-full max-w-sm p-5 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-750">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-brand-orange" />
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Suspend Current Ticket</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsHoldDialogOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                            This cart will be held temporarily so you can attend to other counter customers. You can resume it anytime from the Held Tickets panel.
                        </p>

                        <div className="mt-4">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                                Optional Reference Note
                            </label>
                            <input
                                type="text"
                                value={holdNote}
                                onChange={(e) => setHoldNote(e.target.value)}
                                placeholder="e.g. Waiting for mechanic part verification"
                                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-orange focus:outline-none"
                            />
                        </div>

                        <div className="mt-5 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsHoldDialogOpen(false)}
                                className="flex-1 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleHoldTicketConfirm}
                                className="flex-1 py-2 text-xs font-bold bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                                Hold Ticket
                            </button>
                        </div>
                    </div>
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
                currentDiscount={discount}
                subtotal={subtotal}
            />
            <ApprovalModal 
                isOpen={isApprovalModalOpen} 
                onClose={() => setApprovalModalOpen(false)}
                onApprove={handleManagerApproved}
                reason={approvalReason}
                title="Supervisor Security Authorization"
            />
        </div>
    );
};

export default Cart;
