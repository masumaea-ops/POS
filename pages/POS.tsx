import React, { useState, useEffect } from 'react';
import { MOCK_PRODUCTS, MOCK_CUSTOMERS } from '../data/mockData';
import type { Product, CartItem, Customer } from '../types';
import ProductGrid from '../components/pos/ProductGrid';
import Cart from '../components/pos/Cart';
import { SearchIcon, UsersIcon } from '../components/shared/Icons';

const POS: React.FC = () => {
    const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customer, setCustomer] = useState<Customer>(MOCK_CUSTOMERS[0]);
    const [searchTerm, setSearchTerm] = useState('');
    
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
        const matchedProduct = products.find(p => 
            p.sku.toLowerCase() === clean || 
            (p.oemCode && p.oemCode.toLowerCase() === clean)
        );

        if (matchedProduct) {
            handleAddToCart(matchedProduct);
            triggerToast(`🎯 SCAN MATCH: ${matchedProduct.name} [SKU: ${matchedProduct.sku}] added!`);
        } else {
            triggerToast(`⚠️ SCAN FAIL: Product code "${codeValue}" not found in our catalog.`, true);
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
                    <span>{toastIsError ? '❌' : '⚡'}</span>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Main content - Product Grid */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white dark:bg-gray-800 p-4 border-b border-surface-2 dark:border-gray-700 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Catalog Query */}
                    <div className="relative flex-1 max-w-xl">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-450">
                            <SearchIcon className="w-5 h-5" />
                        </span>
                        <input
                            type="text"
                            placeholder="Enter product brand, native SKU, or OEM Part Number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-gray-650 bg-slate-50 dark:bg-gray-700 text-slate-800 dark:text-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange text-sm"
                        />
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

                        {/* Customer selector card inside Header */}
                        <div className="flex items-center gap-2 border bg-slate-50 dark:bg-slate-700/50 p-1.5 rounded-lg border-slate-200 dark:border-slate-700">
                             <UsersIcon className="w-4 h-4 text-brand-orange" />
                             <select 
                                value={customer.id} 
                                onChange={(e) => {
                                    const nextCust = MOCK_CUSTOMERS.find(c => c.id === parseInt(e.target.value, 10));
                                    if (nextCust) changeCustomerAndUpdateCart(nextCust);
                                }}
                                className="bg-transparent font-bold text-xs text-slate-800 dark:text-gray-200 focus:outline-none pr-3"
                             >
                                 {MOCK_CUSTOMERS.map(c => (
                                     <option key={c.id} value={c.id} className="text-slate-800">
                                         {c.name} ({c.type})
                                     </option>
                                 ))}
                             </select>
                        </div>
                    </div>
                </header>

                {/* Sub-HUD: Interactive Instruction to scanning */}
                <div className="bg-slate-900 text-slate-400 text-[11px] px-4 py-1.5 font-mono flex items-center justify-between border-b border-slate-800">
                  <span className="text-amber-500 font-bold">⚡ BARCODE SCAN STATION ACTIVE:</span>
                  <span>Type SKU/OEM directly anywhere to test global listeners, or use simulator above. Try: <span className="text-bold text-slate-100 hover:underline cursor-pointer" onClick={() => processScannedCode('04465-0K150')}>04465-0K150</span></span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <ProductGrid products={filteredProducts} onAddToCart={handleAddToCart} customerTier={customer.tier} />
                </div>
            </div>

            {/* Right sidebar - Cart */}
            <div className="w-full lg:w-96 xl:w-[420px] bg-white dark:bg-gray-800 border-t lg:border-t-0 lg:border-l border-surface-2 dark:border-gray-700 flex flex-col shrink-0">
                <Cart 
                    cartItems={cart} 
                    onUpdateQuantity={handleUpdateQuantity} 
                    onRemoveItem={handleRemoveFromCart}
                    onClearCart={handleClearCart}
                    customer={customer}
                />
            </div>
        </div>
    );
};

export default POS;

