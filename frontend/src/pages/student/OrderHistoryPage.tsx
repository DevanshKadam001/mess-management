import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { api } from '../../services/api';
import { InvoiceModal } from '../../components/InvoiceModal';
import {
  ClipboardList,
  ArrowRight,
  Printer,
  Clock,
  Store,
  CheckCircle,
  AlertCircle,
  PackageCheck,
  CookingPot,
  XCircle,
} from 'lucide-react';

interface OrderHistoryPageProps {
  onNavigateToTracking: (orderId: string) => void;
  onBrowseMenu: () => void;
}

export const OrderHistoryPage: React.FC<OrderHistoryPageProps> = ({
  onNavigateToTracking,
  onBrowseMenu,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await api.cancelOrder(orderId, 'Cancelled by customer');
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status);
    if (filter === 'COLLECTED') return o.status === 'COLLECTED';
    return o.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLACED':
        return <span className="bg-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded-full text-xs">Placed</span>;
      case 'ACCEPTED':
        return <span className="bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full text-xs">Accepted</span>;
      case 'PREPARING':
        return <span className="bg-amber-100 text-amber-700 font-bold px-2.5 py-0.5 rounded-full text-xs animate-pulse">Cooking 🔥</span>;
      case 'READY':
        return <span className="bg-emerald-100 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full text-xs animate-bounce">Ready for Pickup! 🍽️</span>;
      case 'COLLECTED':
        return <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full text-xs">Collected</span>;
      case 'CANCELLED':
        return <span className="bg-red-100 text-red-700 font-bold px-2.5 py-0.5 rounded-full text-xs">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Orders & Receipts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View order status, pickup verification codes, and download tax invoices
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl overflow-x-auto">
          {['ALL', 'ACTIVE', 'COLLECTED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === f
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f === 'ALL' ? 'All Orders' : f === 'ACTIVE' ? 'Live / In-Kitchen' : 'Collected'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading order history...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-100 space-y-4">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
            <ClipboardList className="w-8 h-8 opacity-50" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">No orders in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Ready to eat? Check out today’s fresh menu from our campus stalls.
          </p>
          <button
            onClick={onBrowseMenu}
            className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition"
          >
            Browse Menu
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((o) => {
            const isLive = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status);

            return (
              <div
                key={o.id}
                className={`bg-white rounded-3xl border p-5 shadow-xs transition hover:shadow-md ${
                  isLive ? 'border-orange-200 ring-1 ring-orange-200/50' : 'border-slate-100'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-black text-slate-900">
                      #{o.orderNumber}
                    </span>
                    {getStatusBadge(o.status)}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(o.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Stall & Items summary */}
                <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Store className="w-3.5 h-3.5 text-orange-500" />
                      <span>{o.vendor.stallName}</span>
                    </div>

                    <p className="text-xs text-slate-600">
                      {o.items.map((i) => `${i.productName} (×${i.quantity})`).join(', ')}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Total ({o.paymentMethod})
                    </span>
                    <span className="text-base font-black text-slate-900">
                      ₹{o.finalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {isLive ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-orange-600">
                        Counter Pickup OTP:
                      </span>
                      <span className="font-mono font-black text-xs bg-orange-100 text-orange-900 px-2 py-0.5 rounded-lg">
                        {o.pickupOtp}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Order Complete
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    {o.status === 'PLACED' && (
                      <button
                        onClick={() => handleCancelOrder(o.id)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        title="Cancel this placed order"
                      >
                        <XCircle className="w-3 h-3" /> Cancel
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedInvoiceOrder(o)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Printer className="w-3 h-3 text-slate-500" /> Receipt
                    </button>

                    <button
                      onClick={() => onNavigateToTracking(o.id)}
                      className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                    >
                      {isLive ? 'Track Live' : 'Details'} <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invoice Modal */}
      <InvoiceModal
        order={selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
      />
    </div>
  );
};
