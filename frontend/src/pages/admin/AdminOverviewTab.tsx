import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Users,
  Store,
  ShoppingBag,
  IndianRupee,
  UtensilsCrossed,
  AlertTriangle,
  TrendingUp,
  PieChart as PieIcon,
  Shield,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AdminOverviewTabProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.getAdminStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 mt-2">Loading system telemetry...</p>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Revenue',
      value: `₹${stats?.totalRevenue?.toFixed(2) || '0.00'}`,
      desc: `₹${stats?.todayRevenue?.toFixed(2) || 0} today`,
      icon: IndianRupee,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      title: 'Campus Users',
      value: stats?.totalUsers || 0,
      desc: 'Students & Faculty registered',
      icon: Users,
      color: 'bg-blue-50 text-blue-700 border-blue-100',
      action: () => onNavigateTab('users'),
    },
    {
      title: 'Active Stalls',
      value: stats?.totalVendors || 0,
      desc: 'Canteen food counters',
      icon: Store,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      action: () => onNavigateTab('vendors'),
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      desc: `${stats?.todayOrdersCount || 0} placed today`,
      icon: ShoppingBag,
      color: 'bg-orange-50 text-orange-700 border-orange-100',
      action: () => onNavigateTab('orders'),
    },
    {
      title: 'Menu Catalog',
      value: stats?.totalProducts || 0,
      desc: `Across ${stats?.totalCategories || 0} categories`,
      icon: UtensilsCrossed,
      color: 'bg-amber-50 text-amber-700 border-amber-100',
    },
  ];

  const STATUS_COLORS: Record<string, string> = {
    PLACED: '#3b82f6',
    ACCEPTED: '#6366f1',
    PREPARING: '#f59e0b',
    READY: '#10b981',
    COLLECTED: '#18181b',
    CANCELLED: '#ef4444',
  };

  const statusPieData = Object.entries(stats?.orderStatusBreakdown || {}).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  return (
    <div className="space-y-6">
      
      {/* 5 System KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={kpi.action}
              className={`p-4 rounded-3xl border bg-white shadow-2xs transition ${
                kpi.action ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
              } ${kpi.color}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {kpi.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 30-Day Revenue Trend (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">30-Day System Revenue</h3>
              <p className="text-xs text-slate-400">Gross sales across all campus stalls</p>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.revenueTrends || []}>
                <defs>
                  <linearGradient id="adminRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val: any) => [`₹${val}`, 'Daily Revenue']}
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#adminRevenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Order Status Distribution</h3>
              <p className="text-xs text-slate-400">Total system orders categorized</p>
            </div>
            <PieIcon className="w-4 h-4 text-slate-500" />
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
            {statusPieData.map((s, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[s.name] || '#94a3b8' }} />
                <span className="truncate">{s.name}: {s.value as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
