import React, { useState } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { X, Clock, Flame, Store, Check, Plus, Minus, ShoppingBag } from 'lucide-react';

interface FoodDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [qty, setQty] = useState<number>(1);
  const [added, setAdded] = useState<boolean>(false);

  if (!product) return null;

  const handleAdd = async () => {
    await addToCart(product.id, qty);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Image */}
        <div className="relative h-64 w-full bg-slate-100">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

          {/* Badges on image */}
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-4 h-4 rounded-[4px] border-2 bg-white flex items-center justify-center ${
                  product.isVeg ? 'border-emerald-600' : 'border-rose-600'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    product.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                />
              </span>
              <span className="text-white text-xs font-semibold px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md">
                {product.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
              </span>
            </div>

            {product.badge && (
              <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                {product.badge}
              </span>
            )}
          </div>
        </div>

        {/* Details Content */}
        <div className="p-6 space-y-5">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                {product.name}
              </h2>
              <span className="text-2xl font-black text-orange-600 flex-shrink-0">
                ₹{product.price.toFixed(0)}
              </span>
            </div>

            {/* Vendor Stall Info */}
            {product.vendor && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
                <Store className="w-3.5 h-3.5 text-orange-500" />
                <span>{product.vendor.stallName}</span>
                {product.vendor.location && (
                  <span className="text-slate-400">· {product.vendor.location}</span>
                )}
              </div>
            )}
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            {product.description}
          </p>

          {/* Key Metric Tags */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Prep Time</span>
                <span className="text-xs font-bold text-slate-800">{product.preparationTime} mins</span>
              </div>
            </div>

            {product.calories && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Energy</span>
                  <span className="text-xs font-bold text-slate-800">{product.calories} kcal</span>
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5 col-span-2 sm:col-span-1">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Status</span>
                <span className={`text-xs font-bold ${product.isAvailable ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {product.isAvailable ? 'Fresh & In Stock' : 'Sold Out'}
                </span>
              </div>
            </div>
          </div>

          {/* Recipe / Key Ingredients preview if available */}
          {product.ingredients && product.ingredients.length > 0 && (
            <div className="p-3.5 bg-orange-50/50 rounded-2xl border border-orange-100">
              <h4 className="text-xs font-bold text-slate-800 mb-2">Key Ingredients</h4>
              <div className="flex flex-wrap gap-1.5">
                {product.ingredients.map((pi, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-white px-2.5 py-1 rounded-lg text-slate-700 font-medium border border-orange-100 shadow-2xs"
                  >
                    {pi.ingredient?.name || 'Fresh ingredient'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-xl bg-white shadow-xs flex items-center justify-center text-slate-700 hover:text-orange-600 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-extrabold text-slate-800 w-6 text-center">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-8 h-8 rounded-xl bg-white shadow-xs flex items-center justify-center text-slate-700 hover:text-orange-600 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              disabled={!product.isAvailable}
              onClick={handleAdd}
              className={`flex-1 py-3 px-5 rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 ${
                !product.isAvailable
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : added
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25 active:scale-[0.99]'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" /> Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" /> Add {qty} to Cart · ₹{(product.price * qty).toFixed(0)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
