import React from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { Clock, Flame, Plus, Minus, Check } from 'lucide-react';

interface FoodCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({ product, onOpenDetails }) => {
  const { cart, addToCart, updateQuantity, removeItem } = useCart();

  const cartItem = cart?.items.find((i) => i.productId === product.id);
  const quantity = cartItem?.quantity || 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1">
      
      {/* Top Image & Badges */}
      <div
        className="relative h-44 w-full overflow-hidden cursor-pointer bg-slate-100"
        onClick={() => onOpenDetails(product)}
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            !product.isAvailable ? 'grayscale opacity-60' : ''
          }`}
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-70 group-hover:opacity-80 transition" />

        {/* Veg / Non-Veg Indicator */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md p-1.5 rounded-lg shadow-sm flex items-center justify-center">
          <span
            className={`w-3.5 h-3.5 rounded-[3px] border-2 flex items-center justify-center ${
              product.isVeg ? 'border-emerald-600' : 'border-rose-600'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                product.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            />
          </span>
        </div>

        {/* Badge (Bestseller, etc.) */}
        {product.badge && (
          <div className="absolute top-3 right-3 bg-orange-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-md uppercase tracking-wider">
            {product.badge}
          </div>
        )}

        {/* Out of Stock Overlay Badge */}
        {!product.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px]">
            <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
              Sold Out
            </span>
          </div>
        )}

        {/* Prep Time & Calories in bottom of image */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white/90 font-medium">
          <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md">
            <Clock className="w-3 h-3 text-orange-400" />
            {product.preparationTime} mins
          </span>
          {product.calories && (
            <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md">
              <Flame className="w-3 h-3 text-amber-400" />
              {product.calories} kcal
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="cursor-pointer" onClick={() => onOpenDetails(product)}>
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-orange-600 transition line-clamp-1">
              {product.name}
            </h3>
          </div>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Action Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
              Price
            </span>
            <span className="text-base font-extrabold text-slate-900">
              ₹{product.price.toFixed(0)}
            </span>
          </div>

          {!product.isAvailable ? (
            <button
              disabled
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
            >
              Unavailable
            </button>
          ) : quantity > 0 ? (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200/80 p-1 rounded-xl shadow-xs">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (quantity > 1) {
                    updateQuantity(cartItem!.id, quantity - 1);
                  } else {
                    removeItem(cartItem!.id);
                  }
                }}
                className="w-6 h-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-orange-600 hover:bg-orange-600 hover:text-white transition"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs font-bold text-orange-600 w-4 text-center">
                {quantity}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuantity(cartItem!.id, quantity + 1);
                }}
                className="w-6 h-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-orange-600 hover:bg-orange-600 hover:text-white transition"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product.id, 1);
              }}
              className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/20 transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
