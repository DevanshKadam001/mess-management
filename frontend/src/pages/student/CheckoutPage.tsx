import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CreditCard,
  Banknote,
  QrCode,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Store,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';

interface CheckoutPageProps {
  onBack: () => void;
  onOrderPlaced: (orderId: string) => void;
  onNavigateToLogin: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onBack,
  onOrderPlaced,
  onNavigateToLogin,
}) => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH'>('UPI');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Mock UPI Payment State
  const [upiVerified, setUpiVerified] = useState<boolean>(false);
  const [isVerifyingUpi, setIsVerifyingUpi] = useState<boolean>(false);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-100 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign in to Checkout</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Please sign in with your student, faculty, or campus account to place this order and receive real-time updates.
        </p>
        <button
          onClick={onNavigateToLogin}
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-lg mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-100 shadow-xl text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">
          Add some delicious items from our menu before proceeding to checkout.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  const handleSimulateUpiPayment = () => {
    setIsVerifyingUpi(true);
    setTimeout(() => {
      setIsVerifyingUpi(false);
      setUpiVerified(true);
    }, 1200);
  };

  const handlePlaceOrder = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const res = await api.placeOrder({
        paymentMethod,
        notes: notes.trim(),
      });

      if (res.success && res.data) {
        // Trigger celebratory confetti!
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}

        onOrderPlaced(res.data.id);
      } else {
        throw new Error(res.message || 'Failed to place order');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstStallName = cart.items[0]?.product?.vendorName || 'Campus Canteen';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      
      {/* Top back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Menu
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Secure Checkout</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Confirm your items, counter pickup notes, and preferred payment option
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <ShieldCheck className="w-4 h-4" />
          <span>SSL Secured</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Customer Details & Payment Options (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Customer Details Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider text-[11px]">
              Customer Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Name</span>
                <span className="font-bold text-slate-800">{user.name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Email</span>
                <span className="font-bold text-slate-800 truncate block">{user.email}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Department</span>
                <span className="font-bold text-slate-800">{user.department || 'General Campus'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Hostel / Room</span>
                <span className="font-bold text-slate-800">{user.roomNumber || 'Counter Pickup'}</span>
              </div>
            </div>

            {/* Special Instructions Note */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Special Kitchen Instructions (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Less spicy, pack sambar separately, extra spoons please..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-orange-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider text-[11px]">
              Select Payment Method
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* UPI Option */}
              <div
                onClick={() => setPaymentMethod('UPI')}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                  paymentMethod === 'UPI'
                    ? 'bg-orange-50/70 border-orange-400 ring-2 ring-orange-400/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-xl ${paymentMethod === 'UPI' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">UPI Payment (QR / App)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Google Pay, PhonePe, Paytm</p>
                  <span className="inline-block mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                    Instant Clearance
                  </span>
                </div>
              </div>

              {/* Cash at Counter Option */}
              <div
                onClick={() => setPaymentMethod('CASH')}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                  paymentMethod === 'CASH'
                    ? 'bg-orange-50/70 border-orange-400 ring-2 ring-orange-400/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-xl ${paymentMethod === 'CASH' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Pay Cash at Counter</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Pay in cash when collecting food</p>
                  <span className="inline-block mt-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded-md">
                    Standard Pickup
                  </span>
                </div>
              </div>
            </div>

            {/* UPI Mock Details Simulation */}
            {paymentMethod === 'UPI' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Mock UPI Gateway Simulation
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                    Demo Mode Active
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="w-24 h-24 bg-slate-900 text-white p-2 rounded-xl flex flex-col items-center justify-center text-center flex-shrink-0">
                    <QrCode className="w-12 h-12 text-orange-400 mb-1" />
                    <span className="text-[9px] font-mono tracking-tighter">CANTEEN-UPI</span>
                  </div>

                  <div className="space-y-1.5 flex-1 text-xs">
                    <p className="text-slate-600">
                      VPA: <strong className="font-mono text-slate-800">campus.canteen@upi</strong>
                    </p>
                    <p className="text-slate-600">
                      Amount: <strong className="text-orange-600 text-sm font-black">₹{cart.finalAmount.toFixed(2)}</strong>
                    </p>

                    {upiVerified ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs pt-1">
                        <CheckCircle2 className="w-4 h-4" /> UPI Pre-Authorized & Verified!
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSimulateUpiPayment}
                        disabled={isVerifyingUpi}
                        className="mt-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                      >
                        {isVerifyingUpi ? 'Verifying with Bank...' : '⚡ Simulate Instant UPI Approval'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary & Place Button (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 sticky top-20">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Order Summary</h3>
              <span className="text-xs text-orange-600 font-bold flex items-center gap-1">
                <Store className="w-3.5 h-3.5" /> {firstStallName}
              </span>
            </div>

            {/* Items scroll */}
            <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-slate-100">
              {cart.items.map((item) => (
                <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px]">
                      {item.quantity}×
                    </span>
                    <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                      {item.product.name}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">
                    ₹{item.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">₹{cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & GST ({cart.taxRate})</span>
                <span className="font-semibold text-slate-800">₹{cart.taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200/80 pt-2 flex justify-between text-sm font-black text-slate-900">
                <span>Total Amount to Pay</span>
                <span className="text-orange-600 text-lg">₹{cart.finalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className={`w-full py-4 px-4 rounded-2xl font-black text-sm text-white shadow-lg transition flex items-center justify-center gap-2 ${
                isSubmitting
                  ? 'bg-orange-400 cursor-wait'
                  : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25 active:scale-[0.99]'
              }`}
            >
              {isSubmitting ? (
                <span>Generating Order & Verifying Inventory...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  Place Order Now · ₹{cart.finalAmount.toFixed(2)}
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-400">
              Unique OTP will be generated for counter pickup verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
