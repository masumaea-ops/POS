import React from 'react';
import type { Product, CartItem } from '../../types';
import { Plus, ShoppingCart, MapPin, AlertTriangle } from 'lucide-react';
import { useSystemSettings } from '../../contexts/SettingsContext';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  customerTier: 'Retail' | 'Wholesale A' | 'Wholesale B';
  cart?: CartItem[];
}

const getTierPrice = (basePrice: number, tier: 'Retail' | 'Wholesale A' | 'Wholesale B') => {
  if (tier === 'Wholesale A') return Math.round(basePrice * 0.80);
  if (tier === 'Wholesale B') return Math.round(basePrice * 0.88);
  return basePrice;
};

const ProductCard: React.FC<{ 
  product: Product; 
  onAddToCart: (product: Product) => void;
  customerTier: 'Retail' | 'Wholesale A' | 'Wholesale B';
  quantityInCart: number;
}> = ({ product, onAddToCart, customerTier, quantityInCart }) => {
  const { formatPrice } = useSystemSettings();
  const finalPrice = getTierPrice(product.price, customerTier);
  const isDiscounted = finalPrice < product.price;

  const minStock = product.minStockLevel || 10;
  const isLowStock = product.stock > 0 && product.stock <= minStock;

  return (
    <div 
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-3 sm:p-4 flex flex-col justify-between cursor-pointer group transition-all duration-350 hover:-translate-y-1.5 hover:shadow-xl border-2 ${
          quantityInCart > 0 
            ? 'border-emerald-500/45 dark:border-emerald-500/30 shadow-emerald-500/5' 
            : 'border-transparent hover:border-brand-orange'
        }`}
        onClick={() => product.stock > 0 && onAddToCart({ ...product, price: finalPrice })}
        title="Click to add item to sales cart"
    >
        <div className="relative overflow-hidden rounded-lg mb-3">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-28 sm:h-36 object-cover rounded-lg group-hover:scale-105 transition-transform duration-500" 
              referrerPolicy="no-referrer" 
            />

            {/* In-cart indicator badge */}
            {quantityInCart > 0 && (
              <div className="absolute top-2 left-2 bg-emerald-500 dark:bg-emerald-600 text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 sm:py-1 rounded-full shadow-lg flex items-center gap-1 border border-white/20">
                  <ShoppingCart className="w-3 h-3 shrink-0" />
                  <span>{quantityInCart} In Cart</span>
              </div>
            )}
            
            {/* Stock Level Badge */}
            <div className={`absolute top-2 right-2 text-[9px] sm:text-[10px] font-black px-2 py-0.5 sm:py-1 rounded-full shadow-xs flex items-center gap-1 ${
                product.stock === 0 
                  ? 'bg-red-600 text-white' 
                  : isLowStock 
                    ? 'bg-amber-500 text-slate-950 font-extrabold animate-pulse' 
                    : 'bg-slate-900/80 dark:bg-slate-700/80 text-white backdrop-blur-xs'
            }`}>
                {product.stock === 0 
                  ? 'Out of Stock' 
                  : isLowStock 
                    ? (
                      <>
                        <AlertTriangle className="w-3 h-3 text-slate-950" />
                        <span>Low Stock ({product.stock})</span>
                      </>
                    )
                    : `${product.stock} Units`
                }
            </div>
            
            {product.binLocation && (
              <div className="absolute bottom-2 left-2 text-[9px] bg-slate-950/80 text-slate-100 px-1.5 py-0.5 rounded font-mono font-bold tracking-tight flex items-center gap-1">
                <MapPin className="w-3 h-3 text-brand-orange" />
                <span>{product.binLocation}</span>
              </div>
            )}

            {product.stock > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-10 h-10 rounded-full bg-brand-orange text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                    <Plus className="w-5 h-5 font-bold" />
                  </div>
              </div>
            )}
        </div>
        
        <div className="flex-1 flex flex-col justify-between mt-1">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md font-bold text-slate-500 uppercase tracking-wider">{product.brand}</span>
              {product.oemCode && (
                <span className="text-[9px] text-brand-orange font-mono font-bold">OEM Active</span>
              )}
            </div>
            <h3 className="font-bold text-ink dark:text-gray-50 text-xs sm:text-sm mt-1.5 line-clamp-2 min-h-[2rem] leading-tight group-hover:text-brand-orange transition-colors">
              {product.name}
            </h3>
            <div className="flex flex-col gap-0.5 mt-1">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">SKU: <span className="font-bold text-slate-700 dark:text-slate-300">{product.sku}</span></p>
              {product.oemCode && (
                <p className="text-[9px] text-indigo-500 dark:text-indigo-400 font-mono">OEM: {product.oemCode}</p>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-750">
            {isDiscounted ? (
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 line-through font-mono">{formatPrice(product.price)}</span>
                <div className="flex items-center justify-between">
                  <span className="text-sm sm:text-base font-black text-brand-orange font-mono">{formatPrice(finalPrice)}</span>
                  <span className="text-[9px] bg-emerald-500/10 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded font-black font-sans uppercase">
                    {customerTier === 'Wholesale A' ? 'Tier A' : 'Tier B'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm sm:text-base font-black text-ink dark:text-gray-50 font-mono">{formatPrice(product.price)}</p>
                <span className="text-[8px] bg-slate-100 dark:bg-slate-750 text-slate-500 px-1.5 py-0.2 rounded font-mono uppercase font-bold">Cash Rate</span>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart, customerTier, cart = [] }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
      {products.map((product) => {
        const cartItem = cart.find(item => item.id === product.id);
        const quantityInCart = cartItem ? cartItem.quantity : 0;
        return (
          <ProductCard 
            key={product.id} 
            product={product} 
            onAddToCart={onAddToCart} 
            customerTier={customerTier} 
            quantityInCart={quantityInCart}
          />
        );
      })}
    </div>
  );
};

export default ProductGrid;
