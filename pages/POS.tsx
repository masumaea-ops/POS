import React, { useState, useEffect } from 'react';
import { MOCK_PRODUCTS, MOCK_CUSTOMERS, MOCK_SALE_ORDERS } from '../data/mockData';
import type { Product, CartItem, Customer, SaleOrder } from '../types';
import ProductGrid from '../components/pos/ProductGrid';
import Cart from '../components/pos/Cart';
import { 
    Search, Users, Plus, Scan, ShoppingBag, ShoppingCart, 
    AlertCircle, CheckCircle2, Zap, Lock, Clock, Filter,
    Check, X, ChevronRight, Barcode, ShieldAlert, Sparkles, Building2, Phone, Mail
} from 'lucide-react';
import { QRScannerModal } from '../components/shared/QRScannerModal';
import { OrderVerificationModal } from '../components/shared/OrderVerificationModal';
import { HeldTicketsModal, type HeldTicket } from '../components/pos/HeldTicketsModal';
import { useAuth } from '../contexts/AuthContext';
import { useSystemSettings } from '../contexts/SettingsContext';

interface ToastState {
    id: number;
    message: string;
    isError: boolean;
    iconType?: 'success' | 'error' | 'scan' | 'customer' | 'order' | 'ticket';
}

const POS: React.FC = () => {
    const { hasPermission, userRole } = useAuth();
    const { settings, formatPrice } = useSystemSettings();
    const canCreateOrder = hasPermission('pos', 'create');
    const [activeTab, setActiveTab] = useState<'catalog' | 'cart'>('catalog');

    // Products catalog state
    const [products, setProducts] = useState<Product[]>(() => {
        const saved = localStorage.getItem('masuma_products');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error loading products in POS', e);
            }
        }
        return MOCK_PRODUCTS;
    });
    
    // Active Cart state
    const [cart, setCart] = useState<CartItem[]>(() => {
        try {
            const transfer = sessionStorage.getItem('masuma_pos_quick_cart');
            if (transfer) {
                sessionStorage.removeItem('masuma_pos_quick_cart');
                return JSON.parse(transfer);
            }
        } catch {
            // ignore
        }
        return [];
    });
    
    // Persistent Customer lists
    const [customersList, setCustomersList] = useState<Customer[]>(() => {
        const saved = localStorage.getItem('masuma_customers');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing customers in POS', e);
            }
        }
        return MOCK_CUSTOMERS;
    });

    const [customer, setCustomer] = useState<Customer>(() => {
        const saved = localStorage.getItem('masuma_customers');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.length > 0) return parsed[0];
            } catch {}
        }
        return MOCK_CUSTOMERS[0];
    });

    // Persistent Sales Orders for QR order verification
    const [salesOrdersList, setSalesOrdersList] = useState<SaleOrder[]>(() => {
        const saved = localStorage.getItem('masuma_sales_orders');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing sales orders in POS', e);
            }
        }
        return MOCK_SALE_ORDERS;
    });

    // Held Tickets state
    const [heldTickets, setHeldTickets] = useState<HeldTicket[]>(() => {
        const saved = localStorage.getItem('masuma_held_carts');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing held carts', e);
            }
        }
        return [];
    });
    const [showHeldTicketsModal, setShowHeldTicketsModal] = useState(false);

    // Filter & Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [verifiedOrder, setVerifiedOrder] = useState<SaleOrder | null>(null);
    
    // Quick Add Customer form states
    const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
    const [newCustName, setNewCustName] = useState('');
    const [newCustType, setNewCustType] = useState<'Cash' | 'Credit'>('Cash');
    const [newCustTier, setNewCustTier] = useState<'Retail' | 'Wholesale A' | 'Wholesale B'>('Retail');
    const [newCustEmail, setNewCustEmail] = useState('');
    const [newCustPhone, setNewCustPhone] = useState('');
    const [newCustCompany, setNewCustCompany] = useState('');
    const [newCustCreditLimit, setNewCustCreditLimit] = useState<number>(0);
    const [newCustKraPin, setNewCustKraPin] = useState('');
    const [newCustShippingAddress, setNewCustShippingAddress] = useState('');

    // Barcode scanner simulator states
    const [scannerInput, setScannerInput] = useState('');
    const [currentToast, setCurrentToast] = useState<ToastState | null>(null);

    // Sync Customer List state back to localStorage
    useEffect(() => {
        localStorage.setItem('masuma_customers', JSON.stringify(customersList));
    }, [customersList]);

    // Sync Held Tickets to localStorage
    useEffect(() => {
        localStorage.setItem('masuma_held_carts', JSON.stringify(heldTickets));
    }, [heldTickets]);

    // Professional Toast Alert Trigger
    const triggerToast = (
        msg: string, 
        isError = false, 
        iconType: ToastState['iconType'] = isError ? 'error' : 'success'
    ) => {
        const id = Date.now();
        setCurrentToast({ id, message: msg, isError, iconType });
        setTimeout(() => {
            setCurrentToast(prev => prev?.id === id ? null : prev);
        }, 3500);
    };

    const handleQuickAddCustomerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustName.trim()) {
            triggerToast("Client name is required to create an account profile.", true, 'error');
            return;
        }

        const newCustomer: Customer = {
            id: Date.now(),
            name: newCustName.trim(),
            type: newCustType,
            companyName: newCustCompany.trim() || undefined,
            email: newCustEmail.trim() || undefined,
            phone: newCustPhone.trim() || undefined,
            tier: newCustTier,
            creditLimit: newCustType === 'Credit' ? Number(newCustCreditLimit) || 0 : 0,
            outstandingBalance: 0,
            kraPin: newCustKraPin.trim() || undefined,
            shippingAddress: newCustShippingAddress.trim() || undefined
        };

        const updatedList = [...customersList, newCustomer];
        setCustomersList(updatedList);
        
        // Instantly select the customer we just created!
        changeCustomerAndUpdateCart(newCustomer);
        
        // Reset fields
        setNewCustName('');
        setNewCustType('Cash');
        setNewCustTier('Retail');
        setNewCustEmail('');
        setNewCustPhone('');
        setNewCustCompany('');
        setNewCustCreditLimit(0);
        setNewCustKraPin('');
        setNewCustShippingAddress('');
        setShowQuickAddCustomer(false);

        triggerToast(`Customer profile registered: ${newCustomer.name}`, false, 'customer');
    };

    // Calculate customer tier-specific price
    const getTierPrice = (basePrice: number, tier: 'Retail' | 'Wholesale A' | 'Wholesale B') => {
        if (tier === 'Wholesale A') return Math.round(basePrice * 0.80);
        if (tier === 'Wholesale B') return Math.round(basePrice * 0.88);
        return basePrice;
    };

    const handleAddToCart = (productToAdd: Product) => {
        if (!canCreateOrder) {
            triggerToast(`Terminal in Read-Only inquiry mode for role '${userRole}'.`, true, 'error');
            return;
        }

        if (productToAdd.stock === 0) {
            triggerToast(`Item ${productToAdd.sku} is currently out of stock.`, true, 'error');
            return;
        }

        const tierUnitPrice = getTierPrice(productToAdd.price, customer.tier);

        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === productToAdd.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === productToAdd.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { ...productToAdd, price: tierUnitPrice, quantity: 1 }];
        });
    };

    const processScannedCode = (codeValue: string) => {
        const clean = codeValue.trim().toLowerCase();
        
        // 1. Check if scanned code represents a Sales Order ID (e.g. SO-2024-115, INV-2024-098)
        const orderMatch = salesOrdersList.find(o => 
            o.id.toLowerCase() === clean || 
            o.id.toLowerCase().replace(/[^a-z0-9]/g, '') === clean.replace(/[^a-z0-9]/g, '') ||
            clean.includes(o.id.toLowerCase())
        );

        if (orderMatch) {
            setVerifiedOrder(orderMatch);
            triggerToast(`Order verified: ${orderMatch.id} (${orderMatch.customer.name})`, false, 'order');
            return;
        }

        // 2. Check if product matches
        const matchedProduct = products.find(p => 
            p.sku.toLowerCase() === clean || 
            (p.oemCode && p.oemCode.toLowerCase() === clean) ||
            p.name.toLowerCase() === clean
        );

        if (matchedProduct) {
            handleAddToCart(matchedProduct);
            triggerToast(`Scanned part added: ${matchedProduct.sku}`, false, 'scan');
        } else {
            triggerToast(`No match found for barcode: "${codeValue}"`, true, 'error');
        }
    };

    // Global Key Listener mapping SKU or OEM scanning directly into cart
    useEffect(() => {
        let buffer = '';
        let lastKeyTime = Date.now();

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Ignore scans if user is typing in general text input boxes of search
            const activeTag = document.activeElement?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
                return;
            }

            const now = Date.now();
            if (now - lastKeyTime > 300) {
                buffer = ''; // Flush slow keystrokes
            }
            lastKeyTime = now;

            if (e.key === 'Enter') {
                const query = buffer.trim();
                if (query.length >= 3) {
                    processScannedCode(query);
                }
                buffer = '';
            } else if (e.key.length === 1) {
                buffer += e.key;
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [products, salesOrdersList, customer]);

    const handleUpdateQuantity = (productId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveFromCart(productId);
            return;
        }
        
        // Ensure quantity doesn't exceed stock
        const prod = products.find(p => p.id === productId);
        if (prod && newQuantity > prod.stock) {
            triggerToast(`Stock ceiling reached: only ${prod.stock} units available.`, true, 'error');
            newQuantity = prod.stock;
        }

        setCart(cart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
    };

    const handleRemoveFromCart = (productId: number) => {
        setCart(cart.filter(item => item.id !== productId));
    };
    
    const handleClearCart = () => {
        setCart([]);
    };

    // Recalculate cart item prices when customer tier changes
    const changeCustomerAndUpdateCart = (nextCustomer: Customer) => {
        setCustomer(nextCustomer);
        setCart(currentCart => 
            currentCart.map(item => {
                const originalProduct = products.find(p => p.id === item.id);
                const originalBasePrice = originalProduct ? originalProduct.price : item.price;
                const nextTierPrice = getTierPrice(originalBasePrice, nextCustomer.tier);
                return {
                    ...item,
                    price: nextTierPrice
                };
            })
        );
        triggerToast(`Tier rate updated: ${nextCustomer.tier} (${nextCustomer.name})`, false, 'customer');
    };

    // Held Tickets operations
    const handleHoldTicket = (note?: string) => {
        if (cart.length === 0) return;

        const subtotal = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
        const newHeldTicket: HeldTicket = {
            id: `HOLD-${Date.now().toString().slice(-4)}`,
            heldAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            note,
            customer,
            items: [...cart],
            subtotal,
        };

        setHeldTickets(prev => [newHeldTicket, ...prev]);
        setCart([]);
        triggerToast(`Sale suspended as Ticket #${newHeldTicket.id}.`, false, 'ticket');
    };

    const handleResumeHeldTicket = (ticket: HeldTicket) => {
        // Change customer to the ticket's customer
        setCustomer(ticket.customer);
        setCart(ticket.items);
        setHeldTickets(prev => prev.filter(t => t.id !== ticket.id));
        setShowHeldTicketsModal(false);
        setActiveTab('cart');
        triggerToast(`Resumed Ticket #${ticket.id} (${ticket.customer.name})`, false, 'ticket');
    };

    const handleDeleteHeldTicket = (ticketId: string) => {
        setHeldTickets(prev => prev.filter(t => t.id !== ticketId));
        triggerToast(`Ticket #${ticketId} discarded.`, false, 'ticket');
    };

    // Filter products
    const filteredProducts = products.filter(p => {
        const matchesSearch = 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.oemCode && p.oemCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
            p.brand.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (selectedCategory === 'all') return true;
        if (selectedCategory === 'brakes') return p.sku.includes('BP') || p.name.toLowerCase().includes('brake');
        if (selectedCategory === 'filters') return p.sku.includes('OF') || p.sku.includes('AF') || p.sku.includes('CF') || p.name.toLowerCase().includes('filter');
        if (selectedCategory === 'suspension') return p.sku.includes('SB') || p.sku.includes('TP') || p.name.toLowerCase().includes('shock') || p.name.toLowerCase().includes('tie rod');
        if (selectedCategory === 'ignition') return p.sku.includes('SP') || p.sku.includes('BL') || p.sku.includes('BT') || p.name.toLowerCase().includes('spark') || p.name.toLowerCase().includes('bulb');
        if (selectedCategory === 'low_stock') return p.stock <= (p.minStockLevel || 10);

        return true;
    });

    const categoryTabs = [
        { id: 'all', label: 'All Catalog', count: products.length },
        { id: 'brakes', label: 'Brakes', count: products.filter(p => p.sku.includes('BP') || p.name.toLowerCase().includes('brake')).length },
        { id: 'filters', label: 'Filtration', count: products.filter(p => p.sku.includes('OF') || p.sku.includes('AF') || p.sku.includes('CF') || p.name.toLowerCase().includes('filter')).length },
        { id: 'suspension', label: 'Suspension', count: products.filter(p => p.sku.includes('SB') || p.sku.includes('TP') || p.name.toLowerCase().includes('shock') || p.name.toLowerCase().includes('tie rod')).length },
        { id: 'ignition', label: 'Electrical & Spark', count: products.filter(p => p.sku.includes('SP') || p.sku.includes('BL') || p.sku.includes('BT') || p.name.toLowerCase().includes('spark') || p.name.toLowerCase().includes('bulb')).length },
        { id: 'low_stock', label: 'Low Stock', count: products.filter(p => p.stock <= (p.minStockLevel || 10)).length },
    ];

    return (
        <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-slate-50 dark:bg-slate-900 relative">
            
            {/* ENTERPRISE FLOATING TOAST NOTIFICATION */}
            {currentToast && (
                <div 
                    role="alert"
                    className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-3 border transition-all animate-in fade-in slide-in-from-top-3 duration-200 ${
                        currentToast.isError 
                        ? 'bg-white dark:bg-slate-850 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 shadow-rose-950/10' 
                        : 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 shadow-slate-950/10'
                    }`}
                >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        currentToast.isError
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                    }`}>
                        {currentToast.isError ? (
                            <AlertCircle className="w-4 h-4" />
                        ) : currentToast.iconType === 'scan' ? (
                            <Barcode className="w-4 h-4" />
                        ) : currentToast.iconType === 'customer' ? (
                            <Users className="w-4 h-4" />
                        ) : currentToast.iconType === 'ticket' ? (
                            <Clock className="w-4 h-4" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4" />
                        )}
                    </div>
                    <span className="font-medium text-xs max-w-sm">{currentToast.message}</span>
                    <button 
                        type="button" 
                        onClick={() => setCurrentToast(null)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Left Area - Catalog & Workspace */}
            <div className={`flex-1 flex flex-col min-w-0 pb-16 lg:pb-0 ${activeTab === 'catalog' ? 'flex' : 'hidden lg:flex'}`}>
                
                {/* PRIMARY POS TERMINAL HEADER */}
                <header className="bg-white dark:bg-slate-850 px-4 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        
                        {/* Search Input and Scan Button */}
                        <div className="flex items-center gap-2 flex-1 max-w-2xl">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search OEM part number, SKU code, or description..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-8 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowScannerModal(true)}
                                className="px-3.5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer border border-slate-800 dark:border-slate-700"
                                title="Open Camera Scanner"
                            >
                                <Scan className="w-4 h-4 text-brand-orange" />
                                <span>Camera Scanner</span>
                            </button>
                        </div>

                        {/* Right Terminal Bar: Customer Selector & Quick Add */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Held tickets quick badge if any */}
                            {heldTickets.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowHeldTicketsModal(true)}
                                    className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                                >
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{heldTickets.length} Suspended</span>
                                </button>
                            )}

                            {/* Customer Switcher */}
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
                                <Users className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                                <select 
                                    value={customer.id} 
                                    onChange={(e) => {
                                        const nextCust = customersList.find(c => c.id === parseInt(e.target.value, 10));
                                        if (nextCust) changeCustomerAndUpdateCart(nextCust);
                                    }}
                                    className="bg-transparent font-semibold text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
                                >
                                    {customersList.map(c => (
                                        <option key={c.id} value={c.id} className="text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                                            {c.name} ({c.type} • {c.tier})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {canCreateOrder && (
                                <button
                                    type="button"
                                    onClick={() => setShowQuickAddCustomer(true)}
                                    className="px-2.5 py-2 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                                    title="Add New Customer Profile"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">New Client</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Category Filter Pills Row */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-0.5 no-scrollbar">
                        {categoryTabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setSelectedCategory(tab.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                                    selectedCategory === tab.id
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                                    selectedCategory === tab.id
                                        ? 'bg-white/20 dark:bg-slate-900/20 text-current'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </header>

                {/* READ-ONLY BANNER IF USER CANNOT CREATE ORDERS */}
                {!canCreateOrder && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 px-4 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between font-medium shrink-0">
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>
                                Terminal in <strong>Inquiry Mode</strong> ({userRole}). Registering sales and checkouts require Cashier or Manager credentials.
                            </span>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                            Read-Only
                        </span>
                    </div>
                )}

                {/* HARDWARE SCANNER STATUS BAR */}
                <div className="bg-slate-900 text-slate-300 text-xs px-4 sm:px-6 py-2 flex items-center justify-between border-b border-slate-800 shrink-0 select-none">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-mono tracking-wide text-slate-400">
                            KEYBOARD WEDGE SCANNER READY:
                        </span>
                        <span className="text-[11px] text-slate-300 hidden sm:inline">
                            Scan physical OEM / SKU barcode anywhere anytime.
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 hidden md:inline font-mono">Test Simulator:</span>
                        <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                            <input 
                                type="text" 
                                placeholder="Type OEM..." 
                                value={scannerInput}
                                onChange={(e) => setScannerInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && scannerInput) {
                                        processScannedCode(scannerInput);
                                        setScannerInput('');
                                    }
                                }}
                                className="px-2 py-0.5 text-xs bg-transparent text-white font-mono focus:outline-none w-28 placeholder:text-slate-500"
                            />
                            <button 
                                type="button"
                                onClick={() => {
                                    if (scannerInput) {
                                        processScannedCode(scannerInput);
                                        setScannerInput('');
                                    } else {
                                        processScannedCode('90919-01247');
                                    }
                                }}
                                className="px-2 py-0.5 text-[10px] bg-brand-orange hover:bg-brand-orange/90 text-white rounded font-bold uppercase transition-all cursor-pointer"
                            >
                                Test
                            </button>
                        </div>
                    </div>
                </div>

                {/* PRODUCT GRID CONTAINER */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
                    <ProductGrid 
                        products={filteredProducts} 
                        onAddToCart={handleAddToCart} 
                        customerTier={customer.tier} 
                        cart={cart} 
                    />
                </div>
            </div>

            {/* Right sidebar - Cart */}
            <div className={`w-full lg:w-96 xl:w-[420px] bg-white dark:bg-slate-850 border-t lg:border-t-0 lg:border-l border-slate-200/80 dark:border-slate-800 flex flex-col shrink-0 h-full overflow-hidden pb-16 lg:pb-0 ${activeTab === 'cart' ? 'flex' : 'hidden lg:flex'}`}>
                <Cart 
                    cartItems={cart} 
                    onUpdateQuantity={handleUpdateQuantity} 
                    onRemoveItem={handleRemoveFromCart} 
                    onClearCart={handleClearCart} 
                    customer={customer} 
                    customersList={customersList} 
                    onChangeCustomer={changeCustomerAndUpdateCart} 
                    onShowQuickAddCustomer={() => setShowQuickAddCustomer(true)} 
                    onHoldTicket={handleHoldTicket}
                    heldTicketsCount={heldTickets.length}
                    onOpenHeldTickets={() => setShowHeldTicketsModal(true)}
                    onNotify={triggerToast}
                />
            </div>

            {/* Mobile Tab switcher bar (only visible on small screens) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex z-30 h-16 shadow-lg divide-x divide-slate-100 dark:divide-slate-800">
                <button 
                    type="button"
                    onClick={() => setActiveTab('catalog')} 
                    className={`flex-1 flex flex-col items-center justify-center font-bold text-[10px] uppercase tracking-wider gap-1 transition-all ${
                        activeTab === 'catalog' 
                        ? 'text-brand-orange bg-slate-50 dark:bg-slate-800' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <ShoppingBag className="w-5 h-5" />
                    <span>Catalog ({filteredProducts.length})</span>
                </button>
                <button 
                    type="button"
                    onClick={() => setActiveTab('cart')} 
                    className={`flex-1 flex flex-col items-center justify-center font-bold text-[10px] uppercase tracking-wider gap-1 relative transition-all ${
                        activeTab === 'cart' 
                        ? 'text-brand-orange bg-slate-50 dark:bg-slate-800' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Current Sale</span>
                    {cart.length > 0 && (
                        <span className="absolute top-2 right-1/2 translate-x-12 bg-brand-orange text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2 border-white dark:border-slate-850">
                            {cart.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                    )}
                </button>
            </div>

            {/* HELD TICKETS MODAL */}
            <HeldTicketsModal
                isOpen={showHeldTicketsModal}
                onClose={() => setShowHeldTicketsModal(false)}
                tickets={heldTickets}
                onResumeTicket={handleResumeHeldTicket}
                onDeleteTicket={handleDeleteHeldTicket}
            />

            {/* BARCODE CAMERA & QR CONSOLE MODAL */}
            {showScannerModal && (
                <QRScannerModal 
                    products={products}
                    salesOrders={salesOrdersList}
                    onScanProduct={(product) => {
                        handleAddToCart(product);
                        triggerToast(`Scanned product added: ${product.name} [${product.sku}]`, false, 'scan');
                    }}
                    onScanOrder={(order) => {
                        setVerifiedOrder(order);
                        setShowScannerModal(false);
                        triggerToast(`Order verified: ${order.id} (${order.customer.name})`, false, 'order');
                    }}
                    onClose={() => setShowScannerModal(false)}
                    title="POS Barcode & QR Camera Scanner"
                    subtitle="Point your camera at a parts barcode or sales dispatch QR code"
                />
            )}

            {/* ORDER PICK & DISPATCH VERIFICATION MODAL */}
            {verifiedOrder && (
                <OrderVerificationModal
                    order={verifiedOrder}
                    onClose={() => setVerifiedOrder(null)}
                    onUpdateOrderStatus={(orderId, newStatus) => {
                        setSalesOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
                        triggerToast(`Order ${orderId} updated to ${newStatus}`, false, 'order');
                    }}
                    onLoadIntoCart={(items) => {
                        setCart(prev => {
                            const newCart = [...prev];
                            items.forEach(newItem => {
                                const exist = newCart.find(i => i.name.toLowerCase() === newItem.name.toLowerCase());
                                if (exist) {
                                    exist.quantity += newItem.quantity;
                                } else {
                                    newCart.push(newItem);
                                }
                            });
                            return newCart;
                        });
                        triggerToast(`Imported ${items.length} items from Order ${verifiedOrder.id} into cart`, false, 'order');
                    }}
                />
            )}

            {/* QUICK REGISTER CLIENT MODAL */}
            {showQuickAddCustomer && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
                    <div className="w-full max-w-lg bg-white dark:bg-slate-850 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700/80 p-6 flex flex-col justify-between overflow-hidden animate-in zoom-in-95 duration-150 text-xs text-slate-800 dark:text-slate-100 max-h-[90vh]">
                        <form onSubmit={handleQuickAddCustomerSubmit} className="flex flex-col h-full overflow-hidden">
                            <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-3.5 mb-4 shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-brand-orange/10 dark:bg-brand-orange/20 text-brand-orange flex items-center justify-center">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Quick Client Registration</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Add client profile and assign price tier</p>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setShowQuickAddCustomer(false)}
                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                                <div>
                                    <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
                                        Client / Garage Account Name *
                                    </label>
                                    <input 
                                        type="text"
                                        required
                                        value={newCustName}
                                        onChange={(e) => setNewCustName(e.target.value)}
                                        placeholder="e.g. Samuel Mwangi or Nairobi Auto Spares"
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                            Account Type
                                        </label>
                                        <select
                                            value={newCustType}
                                            onChange={(e) => setNewCustType(e.target.value as 'Cash' | 'Credit')}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-white cursor-pointer"
                                        >
                                            <option value="Cash">Cash Account</option>
                                            <option value="Credit">Trade Credit</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                            Pricing Tier
                                        </label>
                                        <select
                                            value={newCustTier}
                                            onChange={(e) => setNewCustTier(e.target.value as any)}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-white cursor-pointer"
                                        >
                                            <option value="Retail">Retail (Standard Base)</option>
                                            <option value="Wholesale A">Wholesale A (20% Off)</option>
                                            <option value="Wholesale B">Wholesale B (12% Off)</option>
                                        </select>
                                    </div>
                                </div>

                                {newCustType === 'Credit' && (
                                    <div>
                                        <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                            Assigned Credit Limit ({settings.currency})
                                        </label>
                                        <input 
                                            type="number"
                                            value={newCustCreditLimit}
                                            onChange={(e) => setNewCustCreditLimit(Number(e.target.value))}
                                            placeholder="e.g. 150000"
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-white"
                                        />
                                    </div>
                                )}

                                <div className="border-t border-slate-150 dark:border-slate-800 pt-3">
                                    <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                        Company Entity Name (Optional)
                                    </label>
                                    <input 
                                        type="text"
                                        value={newCustCompany}
                                        onChange={(e) => setNewCustCompany(e.target.value)}
                                        placeholder="e.g. Mwangi Autocare Holdings Ltd"
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-white font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                            Phone Number
                                        </label>
                                        <input 
                                            type="tel"
                                            value={newCustPhone}
                                            onChange={(e) => setNewCustPhone(e.target.value)}
                                            placeholder="07xxxxxxxx"
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-white font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                            Email Address
                                        </label>
                                        <input 
                                            type="email"
                                            value={newCustEmail}
                                            onChange={(e) => setNewCustEmail(e.target.value)}
                                            placeholder="client@mail.com"
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-white font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 pt-2 border-t border-slate-150 dark:border-slate-800">
                                    <div>
                                        <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                            KRA PIN (Kenyan Tax Identification)
                                        </label>
                                        <input 
                                            type="text"
                                            value={newCustKraPin}
                                            onChange={(e) => setNewCustKraPin(e.target.value.toUpperCase())}
                                            placeholder="e.g. A012345678B"
                                            maxLength={11}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-white uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                            Delivery / Workshop Address
                                        </label>
                                        <textarea 
                                            value={newCustShippingAddress}
                                            onChange={(e) => setNewCustShippingAddress(e.target.value)}
                                            placeholder="e.g. Industrial Area, Workshop No. 4, Nairobi"
                                            rows={2}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-white font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-3.5 border-t border-slate-150 dark:border-slate-800 flex gap-2 shrink-0">
                                <button 
                                    type="button" 
                                    onClick={() => setShowQuickAddCustomer(false)}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-all text-center cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-2.5 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl font-bold uppercase tracking-wider transition-all text-center cursor-pointer shadow-xs"
                                >
                                    Save & Select
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;
