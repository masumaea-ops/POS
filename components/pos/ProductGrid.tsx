import React from 'react';
import type { Product, CartItem } from '../../types';
import { Plus, ShoppingCart, MapPin, AlertCircle, PackageX, Check } from 'lucide-react';
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
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= minStock;

  return (
    <div 
      className={`group relative bg-white dark:bg-slate-850 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between border transition-all duration-200 ${
        isOutOfStock
          ? 'opacity-60 border-slate-200/60 dark:border-slate-800'
          : quantityInCart > 0
          ? 'border-brand-orange/60 dark:border-brand-orange/50 shadow-xs ring-1 ring-brand-orange/20 dark:ring-brand-orange/20'
          : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
      }`}
    >
      <div>
        {/* Product Image Container */}
        <div className="relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 aspect-4/3 mb-3 border border-slate-150 dark:border-slate-750/50">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" 
            referrerPolicy="no-referrer"
            loading="lazy" 
          />

          {/* In-cart indicator badge */}
          {quantityInCart > 0 && (
            <div className="absolute top-2 left-2 bg-brand-orange text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
              <ShoppingCart className="w-3 h-3 shrink-0" />
              <span>{quantityInCart} in Cart</span>
            </div>
          )}
          
          {/* Stock Level Badge */}
          <div className="absolute top-2 right-2">
            {isOutOfStock ? (
              <span className="bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="bg-amber-500/90 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-slate-950 shrink-0" />
                <span>Low: {product.stock} left</span>
              </span>
            ) : (
              <span className="bg-slate-900/75 dark:bg-slate-800/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs">
                {product.stock} in stock
              </span>
            )}
          </div>
          
          {/* Bin location pill */}
          {product.binLocation && (
            <div className="absolute bottom-2 left-2 text-[9px] bg-slate-950/85 text-slate-200 px-1.5 py-0.5 rounded-md font-mono font-medium flex items-center gap-1 backdrop-blur-xs">
              <MapPin className="w-2.5 h-2.5 text-brand-orange shrink-0" />
              <span>Bin {product.binLocation}</span>
            </div>
          )}
        </div>
        
        {/* Product Details */}
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              {product.brand}
            </span>
            {product.category && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-medium">
                {product.category}
              </span>
            )}
          </div>

          <h3 
            className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-2 leading-snug min-h-[2.25rem]"
            title={product.name}
          >
            {product.name}
          </h3>

          <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono">
            <span className="text-slate-500 dark:text-slate-400">SKU:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 select-all">{product.sku}</span>
            {product.oemCode && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-brand-orange truncate font-medium" title={`OEM: ${product.oemCode}`}>
                  {product.oemCode}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pricing & Add Button Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between gap-2">
        <div className="flex flex-col">
          {isDiscounted ? (
            <>
              <span className="text-[10px] text-slate-400 line-through font-mono">
                {formatPrice(product.price)}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm sm:text-base font-black text-brand-orange font-mono">
                  {formatPrice(finalPrice)}
                </span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded uppercase">
                  {customerTier === 'Wholesale A' ? 'Tier A' : 'Tier B'}
                </span>
              </div>
            </>
          ) : (
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={isOutOfStock}
          onClick={() => !isOutOfStock && onAddToCart({ ...product, price: finalPrice })}
          className={`py-1.5 px-2.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
            isOutOfStock
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              : quantityInCart > 0
              ? 'bg-brand-orange text-white hover:bg-brand-orange/90 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-brand-orange hover:text-white text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
          }`}
          title={isOutOfStock ? 'Item out of stock' : 'Add to cart'}
        >
          {quantityInCart > 0 ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>+{quantityInCart}</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart, customerTier, cart = [] }) => {
  if (products.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
          <PackageX className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Matching Products Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Try searching by alternative part name, OEM reference code, Japanese/Korean vehicle make, or clear category filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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
