import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { api } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { OrderProgressTracker } from '../../components/OrderProgressTracker';
import { InvoiceModal } from '../../components/InvoiceModal';
import {
  ArrowLeft,
  Store,
  Clock,
  Printer,
  Sparkles,
  Phone,
  CheckCircle,
  AlertCircle,
  FileText,
  XCircle,
  X,
  RotateCcw,
} from 'lucide-react';

interface OrderTrackingPageProps {
  orderId: string;
  onBack: () => void;
  onNavigateToHistory: () => void;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  orderId,
  onBack,
  onNavigateToHistory,
}) => {
  const { latestOrderUpdate } = useSocket();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState<boolean>(false);

  // Cancellation Modal state
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('Ordered by mistake');
  const [customReason, setCustomReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await api.getOrderById(orderId);
        if (res.success && res.data) {
          setOrder(res.data);
        } else {
          setError('Order details could not be found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // Real-time update listener from SocketContext
  useEffect(() => {
    if (latestOrderUpdate && latestOrderUpdate.id === orderId) {
      setOrder(latestOrderUpdate);
    }
  }, [latestOrderUpdate, orderId]);

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      setIsCancelling(true);
      setCancelError(null);
      const finalReason = cancelReason === 'Other' ? (customReason.trim() || 'Other reason') : cancelReason;
      
      const res = await api.cancelOrder(order.id, finalReason);
      if (res.success && res.data) {
        setOrder(res.data);
        setShowCancelModal(false);
        setCancelSuccessMsg('Your order has been cancelled successfully.');
      } else {
        throw new Error(res.message || 'Failed to cancel order');
      }
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-100 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">Connecting to live order tracker...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-100 shadow-sm text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">{error || 'Order not found'}</h2>
        <button
          onClick={onBack}
          className="px-5 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  const canCancel = order.status === 'PLACED';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </button>

        <div className="flex items-center gap-2">
          {/* Cancel Button */}
          {canCancel && (
            <button
              onClick={() => {
                setCancelError(null);
                setShowCancelModal(true);
              }}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Order</span>
            </button>
          )}

          <button
            onClick={() => setShowInvoice(true)}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-orange-500" />
            <span>View Receipt / Invoice</span>
          </button>

          <button
            onClick={onNavigateToHistory}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition"
          >
            All Orders
          </button>
        </div>
      </div>

      {cancelSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{cancelSuccessMsg}</span>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Order Tracker
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
              order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'CANCELLED' ? 'bg-red-500' : 'bg-emerald-500 animate-ping'}`} />
              {order.status === 'CANCELLED' ? 'Cancelled' : 'Live Connected'}
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Order #{order.orderNumber}
          </h1>

          <p className="text-xs text-slate-500 mt-0.5">
            Placed on{' '}
            {new Date(order.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
            , {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Canteen Stall Card */}
        <div className="p-3 bg-orange-50/70 border border-orange-100 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">{order.vendor.stallName}</h4>
            <p className="text-[11px] text-slate-500">{order.vendor.location || 'Food Court'}</p>
          </div>
        </div>
      </div>

      {/* Visual Stepper Tracker */}
      <OrderProgressTracker
        status={order.status}
        pickupOtp={order.pickupOtp}
        cancelledReason={order.cancelledReason}
        estimatedMinutes={order.estimatedPrepMinutes}
      />

      {/* In-Tracker Cancellation Action Bar */}
      {canCancel && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-800 block">Need to change your mind?</span>
            <p className="text-slate-500 text-[11px] mt-0.5">
              You can cancel this order with zero penalty before the counter accepts it.
            </p>
          </div>

          <button
            onClick={() => {
              setCancelError(null);
              setShowCancelModal(true);
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-xs flex-shrink-0"
          >
            <XCircle className="w-4 h-4" /> Cancel This Order
          </button>
        </div>
      )}

      {/* Reorder CTA if Cancelled */}
      {order.status === 'CANCELLED' && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-orange-950">
          <div>
            <span className="font-bold block">Looking for something else to eat?</span>
            <p className="text-[11px] text-orange-800 mt-0.5">
              Browse our fresh canteen menu and place another order anytime.
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition flex items-center gap-1.5 flex-shrink-0 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Browse Food Menu
          </button>
        </div>
      )}

      {/* Ordered Items Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider text-[11px]">
          Ordered Items
        </h3>

        <div className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-xs">
                  {item.quantity}×
                </span>
                <div>
                  <h4 className="font-bold text-slate-900">{item.productName}</h4>
                  <span className="text-[11px] text-slate-400">₹{item.unitPrice.toFixed(0)} each</span>
                </div>
              </div>
              <span className="font-black text-slate-900 text-sm">
                ₹{item.subtotal.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Bill Summary */}
        <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-800">₹{order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST & Tax (5%):</span>
            <span className="font-semibold text-slate-800">₹{order.taxAmount.toFixed(2)}</span>
          </div>
          <div className="border-t border-slate-200/80 pt-2 flex justify-between text-sm font-black text-slate-900">
            <span>Total Amount ({order.paymentMethod}):</span>
            <span className={`${order.status === 'CANCELLED' ? 'line-through text-slate-400' : 'text-orange-600'} text-base`}>
              ₹{order.finalAmount.toFixed(2)}
            </span>
          </div>
          {order.status === 'CANCELLED' && (
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700 text-xs font-bold flex justify-between">
              <span>Payment Status:</span>
              <span className="text-emerald-700 uppercase">{order.paymentStatus === 'REFUNDED' ? 'Refunded' : 'No Charge / Cancelled'}</span>
            </div>
          )}
        </div>

        {order.notes && (
          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
            <span className="font-bold text-slate-700 block mb-0.5">Kitchen Note:</span>
            <span>"{order.notes}"</span>
          </div>
        )}
      </div>

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !isCancelling && setShowCancelModal(false)}
          />

          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Cancel Order #{order.orderNumber}?</h3>
                  <p className="text-xs text-slate-500">This action will halt kitchen preparation.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cancelError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmCancel} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Reason for cancellation
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-rose-500 font-semibold text-slate-800"
                >
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Need to add more items">Need to add more items</option>
                  <option value="Waiting time too long">Waiting time too long</option>
                  <option value="Other">Other reason...</option>
                </select>
              </div>

              {cancelReason === 'Other' && (
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Please specify reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-rose-500 text-slate-800"
                  />
                </div>
              )}

              {order.paymentMethod === 'UPI' && (
                <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-900 border border-amber-200">
                  <strong>UPI Refund Notice:</strong> ₹{order.finalAmount.toFixed(2)} will be credited back to your payment account.
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && (
        <InvoiceModal
          order={order}
          isOpen={showInvoice}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </div>
  );
};
