import React, { useEffect } from 'react';
import { Order } from '../types';
import { X, Printer, CheckCircle, Store, UserCheck, UtensilsCrossed, ArrowLeft } from 'lucide-react';

interface InvoiceModalProps {
  order: Order | null;
  isOpen?: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose }) => {
  if (!order || isOpen === false) return null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 z-10 animate-in zoom-in-95 duration-200">
        
        {/* Modal Top Actions */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Official Canteen Tax Invoice
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print Invoice
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition cursor-pointer"
              title="Close Receipt (Esc)"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Area */}
        <div className="p-8 space-y-6 text-slate-800 bg-white" id="printable-invoice">
          
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-orange-500/20">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  SMART CANTEEN
                </h1>
                <p className="text-xs text-slate-500">
                  Campus Food Services & Ordering Portal
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Order Receipt
              </span>
              <span className="text-base font-extrabold text-orange-600">
                #{order.orderNumber}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Details Row: Customer & Stall */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Billed To (Customer)
              </span>
              <h4 className="font-bold text-slate-900">{order.user.name}</h4>
              <p className="text-slate-500 mt-0.5">{order.user.email}</p>
              {order.user.department && (
                <p className="text-slate-500">{order.user.department}</p>
              )}
              {order.user.roomNumber && (
                <p className="text-slate-500">Room: {order.user.roomNumber}</p>
              )}
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Canteen Stall / Counter
              </span>
              <h4 className="font-bold text-slate-900">{order.vendor.stallName}</h4>
              <p className="text-slate-500 mt-0.5">{order.vendor.location}</p>
              {order.vendor.phone && (
                <p className="text-slate-500">Phone: {order.vendor.phone}</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-hidden border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Item</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.productName}
                    </td>
                    <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-3 px-3 text-right">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ₹{item.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary / Tax Breakdown */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">₹{order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST & Food Tax (5%):</span>
                <span className="font-semibold text-slate-800">₹{order.taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Grand Total:</span>
                <span className="text-orange-600 text-base">₹{order.finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment & OTP Badge */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="font-bold text-emerald-900">
                  Payment: {order.paymentMethod} ({order.paymentStatus})
                </span>
                {order.payment?.transactionId && (
                  <p className="text-[10px] text-emerald-700 font-mono mt-0.5">
                    Txn ID: {order.payment.transactionId}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                Pickup OTP
              </span>
              <span className="font-mono font-black text-sm text-emerald-900">
                {order.pickupOtp}
              </span>
            </div>
          </div>

          {/* Footer message */}
          <div className="text-center pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            Thank you for ordering with Smart Canteen. Please show this receipt or your pickup OTP at the food counter.
          </div>

          {/* Action buttons (hidden during print) */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between print:hidden">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Order Tracker
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
