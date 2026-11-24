import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { api } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import {
  Clock,
  CheckCircle,
  CookingPot,
  Utensils,
  CheckCheck,
  XCircle,
  KeyRound,
  Printer,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';

export const VendorOrdersTab: React.FC = () => {
  const { latestOrderUpdate } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>('LIVE');
  const [search, setSearch] = useState<string>('');

  // OTP Verification modal state
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);

  // Reject / Cancel modal state
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Item out of stock');
  const [customRejectReason, setCustomRejectReason] = useState<string>('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch vendor orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Real-time order refresh
  useEffect(() => {
    if (latestOrderUpdate) {
      fetchOrders();
    }
  }, [latestOrderUpdate]);

  const handleUpdateStatus = async (orderId: string, status: OrderStatus, reason?: string) => {
    try {
      const res = await api.updateOrderStatus(orderId, status, reason);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingOrder) return;
    try {
      setOtpError(null);
      const res = await api.verifyPickupOtp(verifyingOrder.id, enteredOtp);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === verifyingOrder.id ? { ...o, status: 'COLLECTED', paymentStatus: 'COMPLETED' } : o))
        );
        setVerifyingOrder(null);
        setEnteredOtp('');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Invalid Pickup OTP');
    }
  };

  const filteredOrders = orders.filter((o) => {
    // Filter tab
    if (activeFilter === 'LIVE' && !['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)) {
      return false;
    }
    if (activeFilter !== 'ALL' && activeFilter !== 'LIVE' && o.status !== activeFilter) {
      return false;
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        o.orderNumber.toLowerCase().includes(q) ||
        o.user.name.toLowerCase().includes(q) ||
        o.pickupOtp.includes(q) ||
        o.items.some((i) => i.productName.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Live Order Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Accept orders, trigger automated recipe ingredient deductions, and verify pickup OTPs
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Order #, customer, OTP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'LIVE', label: '⚡ Live In-Kitchen', count: orders.filter((o) => ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)).length },
          { key: 'PLACED', label: 'New / Pending', count: orders.filter((o) => o.status === 'PLACED').length },
          { key: 'ACCEPTED', label: 'Accepted', count: orders.filter((o) => o.status === 'ACCEPTED').length },
          { key: 'PREPARING', label: 'Cooking', count: orders.filter((o) => o.status === 'PREPARING').length },
          { key: 'READY', label: 'Ready for Pickup', count: orders.filter((o) => o.status === 'READY').length },
          { key: 'COLLECTED', label: 'Completed', count: orders.filter((o) => o.status === 'COLLECTED').length },
          { key: 'ALL', label: 'All Orders', count: orders.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 ${
              activeFilter === tab.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeFilter === tab.key ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-2">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <p className="text-sm font-bold text-slate-700">No orders found</p>
            <p className="text-xs text-slate-400">Orders placed by campus students will appear here in real-time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order ID & Time</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Ordered Food Items</th>
                  <th className="py-3 px-3">Total (Payment)</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Pickup OTP</th>
                  <th className="py-3 px-4 text-right">Kitchen Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition">
                      
                      {/* Order Number & Time */}
                      <td className="py-4 px-4">
                        <span className="font-mono font-black text-slate-900 text-sm block">
                          #{order.orderNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-900 block">{order.user.name}</span>
                        <span className="text-[11px] text-slate-500 block">{order.user.phone || order.user.email}</span>
                        {order.user.department && (
                          <span className="text-[10px] text-slate-400 block">{order.user.department}</span>
                        )}
                        {order.notes && (
                          <span className="inline-block mt-1 text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Note: {order.notes}
                          </span>
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="space-y-1">
                          {order.items.map((i, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <span className="font-bold text-orange-600">{i.quantity}×</span>
                              <span className="font-medium text-slate-800">{i.productName}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Amount & Payment */}
                      <td className="py-4 px-3">
                        <span className="font-black text-slate-900 text-sm block">
                          ₹{order.finalAmount.toFixed(0)}
                        </span>
                        <span className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                          order.paymentStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {order.paymentMethod} · {order.paymentStatus}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl ${
                          order.status === 'PLACED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          order.status === 'ACCEPTED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          order.status === 'PREPARING' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                          order.status === 'READY' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          order.status === 'COLLECTED' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>

                      {/* Pickup OTP */}
                      <td className="py-4 px-3">
                        <span className="font-mono font-black text-sm bg-slate-100 px-2 py-1 rounded-lg text-slate-800 border border-slate-200">
                          {order.pickupOtp}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* If PLACED: Accept or Reject */}
                          {order.status === 'PLACED' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                                title="Accept Order & Deduct Ingredients"
                              >
                                Accept Order
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingOrder(order);
                                  setRejectReason('Item out of stock');
                                  setCustomRejectReason('');
                                }}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* If ACCEPTED: Start Cooking */}
                          {order.status === 'ACCEPTED' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1"
                            >
                              <CookingPot className="w-3.5 h-3.5" /> Start Cooking
                            </button>
                          )}

                          {/* If PREPARING: Mark Ready */}
                          {order.status === 'PREPARING' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'READY')}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1"
                            >
                              <Utensils className="w-3.5 h-3.5" /> Mark Ready
                            </button>
                          )}

                          {/* If READY: Verify OTP & Hand Over */}
                          {order.status === 'READY' && (
                            <button
                              onClick={() => {
                                setVerifyingOrder(order);
                                setEnteredOtp('');
                                setOtpError(null);
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                            >
                              <KeyRound className="w-3.5 h-3.5" /> Verify OTP & Hand Over
                            </button>
                          )}

                          {/* If COLLECTED */}
                          {order.status === 'COLLECTED' && (
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                              <CheckCheck className="w-4 h-4 text-emerald-500" /> Handed Over
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* OTP Verification Modal */}
      {verifyingOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setVerifyingOrder(null)}
          />

          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-100 z-10 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Verify Counter OTP</h3>
              <p className="text-xs text-slate-500">
                Ask customer {verifyingOrder.user.name} for the 4-digit OTP shown on their screen for Order #{verifyingOrder.orderNumber}
              </p>
            </div>

            {otpError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={4}
                  autoFocus
                  placeholder="Enter 4-digit code"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  className="w-full text-center text-3xl font-mono tracking-widest font-black py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 outline-none transition"
                />
                <span className="text-[10px] text-slate-400 text-center block mt-1">
                  (Correct code: <strong className="font-mono text-slate-700">{verifyingOrder.pickupOtp}</strong>)
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyingOrder(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enteredOtp.length < 4}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  Verify & Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Order Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setRejectingOrder(null)}
          />

          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-100 z-10 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Reject Order #{rejectingOrder.orderNumber}</h3>
              <p className="text-xs text-slate-500">
                Customer {rejectingOrder.user.name} will be notified with the reason.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const reason = rejectReason === 'Other' ? (customRejectReason.trim() || 'Stall unable to fulfill') : rejectReason;
                handleUpdateStatus(rejectingOrder.id, 'CANCELLED', reason);
                setRejectingOrder(null);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Rejection</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none font-semibold text-slate-800"
                >
                  <option value="Item out of stock">Item out of stock / sold out</option>
                  <option value="Kitchen closing soon">Kitchen closing soon</option>
                  <option value="High rush / counter backlog">High rush / counter backlog</option>
                  <option value="Ingredients unavailable">Ingredients unavailable</option>
                  <option value="Other">Other reason...</option>
                </select>
              </div>

              {rejectReason === 'Other' && (
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Enter reason..."
                    value={customRejectReason}
                    onChange={(e) => setCustomRejectReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingOrder(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
