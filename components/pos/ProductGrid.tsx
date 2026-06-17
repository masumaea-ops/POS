import React from 'react';
import type { Product } from '../../types';
import { PlusIcon } from '../shared/Icons';
import { useSystemSettings } from '../../contexts/SettingsContext';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  customerTier: 'Retail' | 'Wholesale A' | 'Wholesale B';
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
}> = ({ product, onAddToCart, customerTier }) => {
  const { formatPrice } = useSystemSettings();
  const finalPrice = getTierPrice(product.price, customerTier);
  const isDiscounted = finalPrice < product.price;

  return (
    <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-main p-4 flex flex-col cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-transparent hover:border-brand-orange"
        onClick={() => product.stock > 0 && onAddToCart({ ...product, price: finalPrice })}
    >
        <div className="relative">
            <img src={product.imageUrl} alt={product.name} className="w-full h-32 sm:h-40 object-cover rounded-lg mb-3" referrerPolicy="no-referrer" />
            <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full ${
                product.stock > 0 ? 'bg-brand-orange/20 text-brand-orange shadow-sm backdrop-blur-xs' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
            }`}>
                {product.stock > 0 ? `${product.stock} Units` : 'Out of Stock'}
            </div>
            
            {product.binLocation && (
              <div className="absolute bottom-2 left-2 text-[10px] bg-slate-900/80 text-slate-100 px-1.5 py-0.5 rounded font-mono">
                {product.binLocation}
              </div>
            )}

            {product.stock > 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-brand-orange text-white flex items-center justify-center">
                    <PlusIcon />
                  </div>
              </div>
            )}
        </div>
        
        <div className="flex-1 flex flex-col justify-between mt-1">
          <div>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-bold text-slate-500 uppercase tracking-wider">{product.brand}</span>
            <h3 className="font-bold text-ink dark:text-gray-50 text-sm sm:text-base mt-1 line-clamp-1 h-6">{product.name}</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">SKU: {product.sku}</p>
            {product.oemCode && (
              <p className="text-[10px] text-brand-orange font-mono font-medium">OEM: {product.oemCode}</p>
            )}
          </div>

          <div className="mt-2">
            {isDiscounted ? (
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 line-through">{formatPrice(product.price)}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-black text-brand-orange">{formatPrice(finalPrice)}</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.2 rounded font-bold">
                    {customerTier === 'Wholesale A' ? '-20%' : '-12%'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-lg sm:text-xl font-extrabold text-ink dark:text-gray-50">{formatPrice(product.price)}</p>
            )}
          </div>
        </div>
    </div>
  );
};

const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart, customerTier }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} customerTier={customerTier} />
      ))}
    </div>
  );
};

export default ProductGrid;
