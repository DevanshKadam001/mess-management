import React from 'react';
import { useCart } from '../context/CartContext';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Store, AlertCircle } from 'lucide-react';

interface CartDrawerProps {
  onCheckout: () => void;
  onBrowseMenu: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout, onBrowseMenu }) => {
  const { cart, isOpen, setIsOpen, updateQuantity, removeItem, clearCart } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Your Food Cart</h2>
                <p className="text-xs text-slate-500">
                  {cart?.itemsCount || 0} {cart?.itemsCount === 1 ? 'item' : 'items'} selected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart && cart.items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition font-medium"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body / Items list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {!cart || cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10 opacity-60" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Your cart is hungry!</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Explore our delicious campus canteen menu and add your favorite dishes.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onBrowseMenu();
                  }}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-orange-500/20 transition flex items-center gap-2"
                >
                  Browse Menu <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                {/* Stall Header Badge */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 flex items-center gap-2 text-xs text-amber-900 font-medium">
                  <Store className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    Ordering from:{' '}
                    <strong>{cart.items[0]?.product?.vendorName || 'Campus Canteen'}</strong>
                  </span>
                </div>

                {cart.hasUnavailableItems && (
                  <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex items-start gap-2 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>Some items in your cart are currently out of stock. Please remove them to proceed.</span>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3 hover:border-slate-200 transition"
                    >
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {/* Veg / Non-veg indicator */}
                          <span
                            className={`w-3 h-3 rounded-[3px] border flex items-center justify-center flex-shrink-0 ${
                              item.product.isVeg ? 'border-emerald-600' : 'border-rose-600'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.product.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}
                            />
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 truncate">
                            {item.product.name}
                          </h4>
                        </div>

                        <p className="text-xs font-semibold text-slate-600 mt-1">
                          ₹{item.unitPrice}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">
                            × {item.quantity} = ₹{item.subtotal}
                          </span>
                        </p>

                        {!item.isAvailable && (
                          <span className="text-[10px] text-red-600 font-semibold block mt-0.5">
                            Out of stock
                          </span>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                        <button
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(item.id, item.quantity - 1);
                            } else {
                              removeItem(item.id);
                            }
                          }}
                          className="w-6 h-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-600 hover:text-orange-600 transition"
                        >
                          {item.quantity === 1 ? (
                            <Trash2 className="w-3 h-3 text-red-500" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                        </button>
                        <span className="text-xs font-bold text-slate-800 w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-600 hover:text-orange-600 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer / Bill Summary */}
          {cart && cart.items.length > 0 && (
            <div className="p-5 border-t border-slate-100 bg-slate-50/70 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">₹{cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & GST ({cart.taxRate})</span>
                  <span className="font-semibold text-slate-800">₹{cart.taxAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200/80 pt-2 flex justify-between text-sm font-bold text-slate-900">
                  <span>Total Bill Amount</span>
                  <span className="text-orange-600 text-base">₹{cart.finalAmount.toFixed(2)}</span>
                </div>
              </div>

              <button
                disabled={cart.hasUnavailableItems}
                onClick={() => {
                  setIsOpen(false);
                  onCheckout();
                }}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 ${
                  cart.hasUnavailableItems
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25 active:scale-[0.99]'
                }`}
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
