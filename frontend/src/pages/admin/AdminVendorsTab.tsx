import React, { useState, useEffect } from 'react';
import { Vendor } from '../../types';
import { api } from '../../services/api';
import {
  Store,
  MapPin,
  Phone,
  IndianRupee,
  ShoppingBag,
  UtensilsCrossed,
  Boxes,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const AdminVendorsTab: React.FC = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadVendors = async () => {
      try {
        setLoading(true);
        const res = await api.getAdminVendors();
        if (res.success) {
          setVendors(res.data);
        }
      } catch (err) {
        console.error('Failed to load vendors:', err);
      } finally {
        setLoading(false);
      }
    };

    loadVendors();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900">Canteen Vendor Stalls</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Monitor campus food court vendors, total revenue processed, and stall operational status
        </p>
      </div>

      {loading ? (
        <div className="p-16 text-center">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 mt-2">Loading stalls...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5 hover:shadow-md transition"
            >
              {/* Top Banner & Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">{vendor.stallName}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                      {vendor.location || 'Campus Food Court'}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    vendor.isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {vendor.isOpen ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {vendor.isOpen ? 'Counter Open' : 'Counter Closed'}
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {vendor.description || 'Campus canteen counter serving fresh meals daily.'}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center">
                <div className="p-2.5 bg-slate-50 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Revenue</span>
                  <span className="text-sm font-black text-slate-900">
                    ₹{vendor.totalRevenue?.toFixed(0) || '0'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Orders</span>
                  <span className="text-sm font-black text-slate-900">{vendor.ordersCount || 0}</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Dishes</span>
                  <span className="text-sm font-black text-slate-900">{vendor.productsCount || 0}</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Ingredients</span>
                  <span className="text-sm font-black text-slate-900">{vendor.ingredientsCount || 0}</span>
                </div>
              </div>

              {/* Operator details */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                <span>Stall Owner: <strong>{vendor.user.name}</strong></span>
                <span>{vendor.user.phone || vendor.user.email}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
