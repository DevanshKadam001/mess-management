import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  IndianRupee,
  ShoppingBag,
  Clock,
  Utensils,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

interface VendorOverviewTabProps {
  onNavigateTab: (tab: string) => void;
}

export const VendorOverviewTab: React.FC<VendorOverviewTabProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.getVendorStats(user?.vendorId);
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to load vendor stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.vendorId]);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 mt-3">Loading dashboard analytics...</p>
      </div>
    );
  }

  const kpis = [
    {
      title: "Today's Revenue",
      value: `₹${stats?.todayRevenue?.toFixed(2) || '0.00'}`,
      desc: 'Gross orders processed today',
      icon: IndianRupee,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      desc: 'All-time orders count',
      icon: ShoppingBag,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Pending Live Orders',
      value: stats?.pendingOrders || 0,
      desc: 'Waiting for cooking / collection',
      icon: Clock,
      color: stats?.pendingOrders > 0 ? 'text-orange-600 bg-orange-50 border-orange-200 animate-pulse' : 'text-slate-600 bg-slate-50 border-slate-100',
      action: () => onNavigateTab('orders'),
    },
    {
      title: 'Available Menu Items',
      value: `${stats?.availableItems || 0} / ${stats?.totalItems || 0}`,
      desc: 'Active dishes for ordering',
      icon: Utensils,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Low Stock Alerts',
      value: stats?.lowStockCount || 0,
      desc: 'Ingredients below minimum threshold',
      icon: AlertTriangle,
      color: stats?.lowStockCount > 0 ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-slate-600 bg-slate-50 border-slate-100',
      action: () => onNavigateTab('inventory'),
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={kpi.action}
              className={`p-4 rounded-3xl border bg-white shadow-2xs transition duration-200 ${
                kpi.action ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
              } ${kpi.color}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {kpi.title}
                </span>
                <div className="p-2 rounded-xl bg-white shadow-2xs">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {kpi.value}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  {kpi.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Low Stock Warning Banner if any */}
      {stats?.lowStockAlerts && stats.lowStockAlerts.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500 text-white rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-900">
                Low Inventory Warning ({stats.lowStockAlerts.length} items critical)
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                {stats.lowStockAlerts.map((i: any) => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('inventory')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex-shrink-0"
          >
            Restock Now
          </button>
        </div>
      )}

      {/* Charts Section: Weekly Revenue & Bestsellers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Weekly Revenue Graph (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Weekly Revenue Trend</h3>
              <p className="text-xs text-slate-400">Daily gross revenue over past 7 days</p>
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-xl">
              Past 7 Days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.weeklyRevenue || []}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val: any) => [`₹${val}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bestselling Dishes (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Bestselling Dishes</h3>
              <p className="text-xs text-slate-400">Top ordered food items</p>
            </div>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>

          <div className="space-y-3">
            {!stats?.bestsellers || stats.bestsellers.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No sales recorded yet</p>
            ) : (
              stats.bestsellers.map((item: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-orange-500 text-white font-extrabold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.name}</h4>
                      <span className="text-[11px] text-slate-400">{item.quantity} orders placed</span>
                    </div>
                  </div>
                  <span className="font-black text-slate-900">
                    ₹{item.revenue.toFixed(0)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
