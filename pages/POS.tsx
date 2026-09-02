import React, { useState, useEffect } from 'react';
import { MOCK_PRODUCTS, MOCK_CUSTOMERS, MOCK_SALE_ORDERS } from '../data/mockData';
import type { Product, CartItem, Customer, SaleOrder } from '../types';
import ProductGrid from '../components/pos/ProductGrid';
import Cart from '../components/pos/Cart';
import { 
    Search, Users, Plus, Scan, Tag, ShoppingBag, ShoppingCart, 
    AlertCircle, CheckCircle2, Zap, ShieldCheck 
} from 'lucide-react';
import { QRScannerModal } from '../components/shared/QRScannerModal';
import { OrderVerificationModal } from '../components/shared/OrderVerificationModal';

const POS: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'catalog' | 'cart'>('catalog');
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
    
    const [cart, setCart] = useState<CartItem[]>([]);
    
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

    const [searchTerm, setSearchTerm] = useState('');
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

    // Sync Customer List state back to localStorage
    useEffect(() => {
        localStorage.setItem('masuma_customers', JSON.stringify(customersList));
    }, [customersList]);
    
    // Barcode scanner simulator states
    const [scannerInput, setScannerInput] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastIsError, setToastIsError] = useState(false);

    // Show custom HUD toast alerts
    const triggerToast = (msg: string, isError = false) => {
        setToastMessage(msg);
        setToastIsError(isError);
        setTimeout(() => setToastMessage(null), 3500);
    };

    const handleQuickAddCustomerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustName.trim()) {
            triggerToast("⚠️ CLIENT NAME REQUIRED: Please enter the customer's full name.", true);
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

        triggerToast(`🎉 CLIENT ADDED & SELECTED: ${newCustomer.name}`);
    };

    // Global Key Listener mapping SKU or OEM scanning directly into cart
    useEffect(() => {
        let buffer = '';
        let lastKeyTime = Date.now();

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Ignore scans if user is typing in general text input boxes of search
            const activeTag = document.activeElement?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
                return;
            }

            const now = Date.now();
            if (now - lastKeyTime > 300) {
                buffer = ''; // Flush slow keystrokes
            }
            lastKeyTime = now;

            if (e.key === 'Enter') {
                const query = buffer.trim();
                if (query.length > 3) {
                    processScannedCode(query);
                }
                buffer = '';
            } else if (e.key.length === 1) {
                buffer += e.key;
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [products]);

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
            triggerToast(`📋 ORDER VERIFIED: ${orderMatch.id} (${orderMatch.customer.name})`);
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
            triggerToast(`🎯 SCAN MATCH: ${matchedProduct.name} [SKU: ${matchedProduct.sku}] added!`);
        } else {
            triggerToast(`⚠️ SCAN FAIL: Code "${codeValue}" not found in catalog or active orders.`, true);
        }
    };

    // Calculate customer tier-specific price
    const getTierPrice = (basePrice: number, tier: 'Retail' | 'Wholesale A' | 'Wholesale B') => {
        if (tier === 'Wholesale A') return Math.round(basePrice * 0.80);
        if (tier === 'Wholesale B') return Math.round(basePrice * 0.88);
        return basePrice;
    };

    const handleAddToCart = (productToAdd: Product) => {
        if (productToAdd.stock === 0) {
            triggerToast("⚠️ OUT OF STOCK: This product is currently unavailable.", true);
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
    
    const handleUpdateQuantity = (productId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveFromCart(productId);
            return;
        }
        
        // Ensure quantity doesn't exceed stock
        const prod = products.find(p => p.id === productId);
        if (prod && newQuantity > prod.stock) {
            triggerToast(`⚠️ STOCK CAP: Only ${prod.stock} units are currently in stock!`, true);
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
        triggerToast(`👤 CUSTOMER TIER CHANGED: Now billing at ${nextCustomer.tier} rates.`);
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.oemCode && p.oemCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-slate-50 dark:bg-slate-900 relative">
            
            {/* FLOATING HUD TOAST */}
            {toastMessage && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 animate-bounce border ${
                    toastIsError 
                    ? 'bg-red-600 text-white border-red-500' 
                    : 'bg-slate-900 text-emerald-400 border-emerald-500/30'
                }`}>
                    <span>{toastIsError ? <AlertCircle className="w-4 h-4 text-white" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}</span>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Main content - Product Grid */}
            <div className={`flex-1 flex flex-col min-w-0 pb-16 lg:pb-0 ${activeTab === 'catalog' ? 'flex' : 'hidden lg:flex'}`}>
                <header className="bg-white dark:bg-gray-800 p-4 border-b border-surface-2 dark:border-gray-700 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Catalog Query */}
                    <div className="relative flex-1 flex gap-2 max-w-xl">
                        <div className="relative flex-1">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-450">
                                <Search className="w-5 h-5" />
                            </span>
                            <input
                                type="text"
                                placeholder="Enter product brand, native SKU, or OEM Part Number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-gray-650 bg-slate-50 dark:bg-gray-700 text-slate-800 dark:text-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange text-sm font-medium"
                            />
                        </div>
                        <button
                            onClick={() => setShowScannerModal(true)}
                            className="px-3.5 py-2 bg-brand-orange hover:bg-brand-orange/95 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all outline-none focus:ring-2 focus:ring-amber-500 shrink-0 select-none active:scale-[0.98] shadow-md shadow-brand-orange/10"
                            title="Open digital barcode camera scanner and virtual label sheet"
                        >
                            <Scan className="w-4 h-4" />
                            <span>Scan Code</span>
                        </button>
                    </div>

                    {/* Scanning simulator panel */}
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-100 dark:bg-slate-705 p-1 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                            <input 
                               type="text" 
                               placeholder="Simulator OEM Scan..." 
                               value={scannerInput}
                               onChange={(e) => setScannerInput(e.target.value)}
                               onKeyDown={(e) => {
                                  if (e.key === 'Enter' && scannerInput) {
                                     processScannedCode(scannerInput);
                                     setScannerInput('');
                                  }
                               }}
                               className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded font-mono"
                            />
                            <button 
                               onClick={() => {
                                  if (scannerInput) {
                                     processScannedCode(scannerInput);
                                     setScannerInput('');
                                  } else {
                                     // Default simulation trigger (Spark Plug OEM)
                                     processScannedCode('90919-01247');
                                  }
                               }}
                               className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-900 text-white rounded font-bold uppercase transition-all"
                            >
                               Scan
                            </button>
                        </div>

                        {/* Customer selector card inside Header with Quick Add action */}
                        <div className="flex items-center gap-2 border bg-slate-50 dark:bg-slate-700/50 p-1.5 rounded-lg border-slate-200 dark:border-slate-700">
                             <Users className="w-4 h-4 text-brand-orange animate-pulse" />
                             <select 
                                value={customer.id} 
                                onChange={(e) => {
                                    const nextCust = customersList.find(c => c.id === parseInt(e.target.value, 10));
                                    if (nextCust) changeCustomerAndUpdateCart(nextCust);
                                }}
                                className="bg-transparent font-bold text-xs text-slate-800 dark:text-gray-200 focus:outline-none pr-3"
                             >
                                 {customersList.map(c => (
                                     <option key={c.id} value={c.id} className="text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                                         {c.name} ({c.type} - {c.tier})
                                     </option>
                                 ))}
                             </select>
                             <button
                                 type="button"
                                 onClick={() => setShowQuickAddCustomer(true)}
                                 className="px-2 py-1 bg-brand-orange text-white hover:bg-brand-orange/90 rounded text-[10px] font-black uppercase tracking-wider transition-all select-none flex items-center gap-1 active:scale-95 shadow-xs"
                                 title="Quick-register new client profile"
                             >
                                 <Plus className="w-3.5 h-3.5" />
                                 <span>Add Client</span>
                             </button>
                        </div>
                    </div>
                </header>

                {/* Sub-HUD: Interactive Instruction to scanning */}
                <div className="bg-slate-900 text-slate-450 text-[10px] sm:text-[11px] px-4 py-1.5 font-mono flex items-center justify-between border-b border-slate-800 shrink-0 select-none">
                  <span className="text-brand-orange font-bold uppercase flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-brand-orange" />
                      BARCODE SCAN STATION ACTIVE:
                  </span>
                  <span className="hidden md:inline">Type SKU/OEM code directly anywhere, or click <strong className="text-zinc-100 hover:text-brand-orange underline cursor-pointer" onClick={() => setShowScannerModal(true)}>Scan Code</strong> for camera scanner & simulated labels.</span>
                  <span className="md:hidden">Click <strong className="text-zinc-100 underline" onClick={() => setShowScannerModal(true)}>Scan Code</strong> for scanner deck.</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <ProductGrid products={filteredProducts} onAddToCart={handleAddToCart} customerTier={customer.tier} cart={cart} />
                </div>
            </div>

            {/* Right sidebar - Cart */}
            <div className={`w-full lg:w-96 xl:w-[420px] bg-white dark:bg-gray-800 border-t lg:border-t-0 lg:border-l border-surface-2 dark:border-gray-700 flex flex-col shrink-0 h-full lg:h-full overflow-hidden pb-16 lg:pb-0 ${activeTab === 'cart' ? 'flex' : 'hidden lg:flex'}`}>
                <Cart 
                    cartItems={cart} 
                    onUpdateQuantity={handleUpdateQuantity} 
                    onRemoveItem={handleRemoveFromCart}
                    onClearCart={handleClearCart}
                    customer={customer}
                    customersList={customersList}
                    onChangeCustomer={changeCustomerAndUpdateCart}
                    onShowQuickAddCustomer={() => setShowQuickAddCustomer(true)}
                />
            </div>

            {/* Mobile Tab switcher bar (only visible on small screens) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-slate-200 dark:border-slate-700 flex z-30 h-16 shadow-lg divide-x divide-slate-100 dark:divide-slate-700">
                <button 
                    type="button"
                    onClick={() => setActiveTab('catalog')} 
                    className={`flex-1 flex flex-col items-center justify-center font-extrabold text-[10px] uppercase tracking-wider gap-1 transition-all ${
                        activeTab === 'catalog' 
                        ? 'text-brand-orange bg-slate-50 dark:bg-slate-750' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <ShoppingBag className="w-5 h-5" />
                    <span>Parts Catalog</span>
                </button>
                <button 
                    type="button"
                    onClick={() => setActiveTab('cart')} 
                    className={`flex-1 flex flex-col items-center justify-center font-extrabold text-[10px] uppercase tracking-wider gap-1 relative transition-all ${
                        activeTab === 'cart' 
                        ? 'text-brand-orange bg-slate-50 dark:bg-slate-750' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Current Sale</span>
                    {cart.length > 0 && (
                        <span className="absolute top-1.5 right-1/2 translate-x-12 bg-brand-orange text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black border border-white dark:border-gray-800">
                            {cart.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                    )}
                </button>
            </div>

            {/* BARCODE CAMERA & QR CONSOLE MODAL */}
            {showScannerModal && (
                <QRScannerModal 
                    products={products}
                    salesOrders={salesOrdersList}
                    onScanProduct={(product) => {
                        handleAddToCart(product);
                        triggerToast(`🎯 SCAN MATCH: ${product.name} [SKU: ${product.sku}] added!`);
                    }}
                    onScanOrder={(order) => {
                        setVerifiedOrder(order);
                        setShowScannerModal(false);
                        triggerToast(`📋 ORDER VERIFIED: ${order.id} (${order.customer.name})`);
                    }}
                    onClose={() => setShowScannerModal(false)}
                    title="POS Fast QR & Barcode Scanner"
                    subtitle="Point device camera at any product SKU tag or order barcode"
                />
            )}

            {/* ORDER PICK & DISPATCH VERIFICATION MODAL */}
            {verifiedOrder && (
                <OrderVerificationModal
                    order={verifiedOrder}
                    onClose={() => setVerifiedOrder(null)}
                    onUpdateOrderStatus={(orderId, newStatus) => {
                        setSalesOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
                        triggerToast(`✓ Order ${orderId} marked ${newStatus}`);
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
                        triggerToast(`📦 Loaded ${items.length} items from Order ${verifiedOrder.id} into POS cart!`);
                    }}
                />
            )}

            {/* QUICK REGISTER CLIENT MODAL */}
            {showQuickAddCustomer && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="w-full max-w-md bg-white dark:bg-slate-850 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between overflow-hidden animate-zoom-in text-xs text-slate-800 dark:text-slate-100">
                        <form onSubmit={handleQuickAddCustomerSubmit}>
                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-4">
                                <div>
                                    <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400">POS CRM Module</span>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">Quick Client Registration</h3>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setShowQuickAddCustomer(false)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-450 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider block mb-1">Full Client Name / Garage Account *</label>
                                    <input 
                                        type="text"
                                        required
                                        value={newCustName}
                                        onChange={(e) => setNewCustName(e.target.value)}
                                        placeholder="e.g. Nairobi Auto Spares or Samuel Mwangi"
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Billing Type</label>
                                        <select
                                            value={newCustType}
                                            onChange={(e) => setNewCustType(e.target.value as 'Cash' | 'Credit')}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-white"
                                        >
                                            <option value="Cash">Cash Sale</option>
                                            <option value="Credit">Trade Credit</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Price Tier Group</label>
                                        <select
                                            value={newCustTier}
                                            onChange={(e) => setNewCustTier(e.target.value as any)}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-white"
                                        >
                                            <option value="Retail">Retail Rate (Base)</option>
                                            <option value="Wholesale A">Wholesale A (20% Off)</option>
                                            <option value="Wholesale B">Wholesale B (12% Off)</option>
                                        </select>
                                    </div>
                                </div>

                                {newCustType === 'Credit' && (
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Assigned Credit Limit (KES)</label>
                                        <input 
                                            type="number"
                                            value={newCustCreditLimit}
                                            onChange={(e) => setNewCustCreditLimit(Number(e.target.value))}
                                            placeholder="e.g. 150000"
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-white"
                                        />
                                    </div>
                                )}

                                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                                    <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Corporate Entity Name (Optional)</label>
                                    <input 
                                        type="text"
                                        value={newCustCompany}
                                        onChange={(e) => setNewCustCompany(e.target.value)}
                                        placeholder="e.g. Mwangi Autocare Holdings Ltd"
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-white font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Phone Number</label>
                                        <input 
                                            type="tel"
                                            value={newCustPhone}
                                            onChange={(e) => setNewCustPhone(e.target.value)}
                                            placeholder="07xxxxxxxx"
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-white font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Email Address</label>
                                        <input 
                                            type="email"
                                            value={newCustEmail}
                                            onChange={(e) => setNewCustEmail(e.target.value)}
                                            placeholder="client@mail.com"
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-white font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">KRA PIN (Kenyan Tax ID)</label>
                                        <input 
                                            type="text"
                                            value={newCustKraPin}
                                            onChange={(e) => setNewCustKraPin(e.target.value.toUpperCase())}
                                            placeholder="e.g. A012345678B"
                                            maxLength={11}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Shipping / Delivery Address</label>
                                        <textarea 
                                            value={newCustShippingAddress}
                                            onChange={(e) => setNewCustShippingAddress(e.target.value)}
                                            placeholder="e.g. Ngong Road, Nairobi or Counter Pickup"
                                            rows={2}
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-white font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                                <button 
                                    type="button" 
                                    onClick={() => setShowQuickAddCustomer(false)}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-zinc-200 rounded-xl font-bold transition-all text-center select-none"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-2.5 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl font-extrabold uppercase tracking-wider transition-all text-center select-none shadow-md shadow-brand-orange/15"
                                >
                                    Save & Select ⚡
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

