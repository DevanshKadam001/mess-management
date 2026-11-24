import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { api } from '../../services/api';
import { InvoiceModal } from '../../components/InvoiceModal';
import {
  ClipboardList,
  Search,
  Filter,
  Store,
  Printer,
  Clock,
  CheckCircle,
} from 'lucide-react';

export const AdminOrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.getOrders(params);
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load system orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const filteredOrders = orders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.user.name.toLowerCase().includes(q) ||
      o.vendor.stallName.toLowerCase().includes(q) ||
      o.pickupOtp.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">System-Wide Orders Telemetry</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor and audit all student, faculty, and vendor order activity across campus
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Order #, customer, stall..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {['ALL', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COLLECTED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === s
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-2">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400">No orders match current filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order ID & Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Stall</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      #{o.orderNumber}
                      <span className="text-[10px] text-slate-400 block font-normal font-sans">
                        {new Date(o.createdAt).toLocaleDateString()} {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{o.user.name}</span>
                      <span className="text-[11px] text-slate-400">{o.user.email}</span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {o.vendor.stallName}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs text-slate-600">
                      {o.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-black text-slate-900 block">₹{o.finalAmount.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400">{o.paymentMethod}</span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                        o.status === 'COLLECTED' ? 'bg-slate-100 text-slate-700' :
                        o.status === 'READY' ? 'bg-emerald-100 text-emerald-700' :
                        o.status === 'PREPARING' ? 'bg-amber-100 text-amber-700' :
                        o.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {o.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(o)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto"
                      >
                        <Printer className="w-3 h-3 text-slate-500" /> Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedInvoice && (
        <InvoiceModal
          order={selectedInvoice}
          isOpen={true}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};
