import React, { useState } from 'react';
import { Star, Clock, Plus, Minus } from 'lucide-react';
import { MenuItem } from '../types';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatCurrency';

interface ProductCardProps {
  product: MenuItem;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const quantity = getItemQuantity(product.id);
  const [imageError, setImageError] = useState(false);

  // Fallback placeholder image if network drops
  const displayImage = imageError
    ? 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f1f5f9"/%3E%3Ctext x="200" y="150" text-anchor="middle" fill="%2364748b"%3EImage unavailable%3C/text%3E%3C/svg%3E'
    : product.imageUrl;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group">
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={displayImage}
          alt={product.name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Veg / Non-Veg Tag */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-200/60 flex items-center gap-1.5 shadow-sm">
          <span
            className={`w-2.5 h-2.5 rounded-full ring-2 ${
              product.isVeg
                ? 'bg-emerald-600 ring-emerald-200'
                : 'bg-rose-600 ring-rose-200'
            }`}
          />
          <span className="text-[11px] font-bold text-slate-700">
            {product.isVeg ? 'VEG' : 'NON-VEG'}
          </span>
        </div>

        {/* Rating & Prep Time */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="bg-slate-900/80 backdrop-blur-md text-white px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{product.rating.toFixed(1)}</span>
          </div>

          <div className="bg-white/80 backdrop-blur-md text-slate-800 px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{product.prepTime}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-lg text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Cart Actions */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-600 block font-medium">Price</span>
            <span className="text-lg font-black text-slate-900">
              {formatCurrency(product.price)}
            </span>
          </div>

          {quantity === 0 ? (
            <button
              onClick={() => addToCart(product)}
              className="bg-brand-50 hover:bg-brand-500 text-brand-600 hover:text-white border border-brand-200 hover:border-brand-500 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-brand-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              ADD
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-slate-900 text-white rounded-2xl p-1 shadow-sm">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="w-7 h-7 rounded-xl hover:bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-extrabold text-xs w-5 text-center">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
                className="w-7 h-7 rounded-xl hover:bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
