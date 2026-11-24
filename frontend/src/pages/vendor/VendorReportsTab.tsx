import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Download,
  Calendar,
  FileSpreadsheet,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const VendorReportsTab: React.FC = () => {
  const { user } = useAuth();
  const [salesData, setSalesData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const loadReports = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (user?.vendorId) params.vendorId = user.vendorId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [sRes, iRes] = await Promise.all([
        api.getVendorSalesReport(params),
        api.getVendorInventoryReport(user?.vendorId ? { vendorId: user.vendorId } : undefined),
      ]);

      if (sRes.success) setSalesData(sRes.data);
      if (iRes.success) setInventoryData(iRes.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [user?.vendorId]);

  const handleDownloadSalesCsv = () => {
    const token = localStorage.getItem('canteen_token') || '';
    let url = `/api/vendor/reports/sales?format=csv`;
    if (user?.vendorId) url += `&vendorId=${user.vendorId}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    // Trigger download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `canteen-sales-report-${Date.now()}.csv`;
        link.click();
      });
  };

  const handleDownloadInventoryCsv = () => {
    const token = localStorage.getItem('canteen_token') || '';
    let url = `/api/vendor/reports/inventory?format=csv`;
    if (user?.vendorId) url += `&vendorId=${user.vendorId}`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `canteen-inventory-report-${Date.now()}.csv`;
        link.click();
      });
  };

  const COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  // Payment method breakdown data
  const paymentBreakdownMap: Record<string, number> = {};
  salesData?.orders?.forEach((o: any) => {
    paymentBreakdownMap[o.paymentMethod] = (paymentBreakdownMap[o.paymentMethod] || 0) + 1;
  });
  const paymentPieData = Object.entries(paymentBreakdownMap).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-6">
      
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Sales & Billing Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Download CSV data exports and inspect daily and monthly sales metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSalesCsv}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export Sales CSV
          </button>

          <button
            onClick={handleDownloadInventoryCsv}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Inventory CSV
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <span className="font-bold text-slate-700 flex items-center gap-1">
          <Calendar className="w-4 h-4 text-orange-500" /> Date Range:
        </span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-800"
        />
        <span className="text-slate-400">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-800"
        />
        <button
          onClick={loadReports}
          className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition"
        >
          Apply Filter
        </button>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="text-slate-500 hover:text-slate-800 font-medium underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">
            Total Revenue
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            ₹{salesData?.totalRevenue?.toFixed(2) || '0.00'}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">Across {salesData?.totalOrders || 0} orders</p>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">
            Total Tax Collected (GST 5%)
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            ₹{salesData?.totalTax?.toFixed(2) || '0.00'}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">Government compliant GST</p>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">
            Average Order Value
          </span>
          <span className="text-2xl font-black text-orange-600 mt-1 block">
            ₹
            {salesData?.totalOrders > 0
              ? (salesData.totalRevenue / salesData.totalOrders).toFixed(1)
              : '0.00'}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">Per counter transaction</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Payment Methods Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Payment Methods Breakdown</h3>
          <div className="h-56 w-full flex items-center justify-center">
            {paymentPieData.length === 0 ? (
              <p className="text-xs text-slate-400">No payment data</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex justify-center gap-4 text-xs font-bold text-slate-700">
            {paymentPieData.map((p, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span>{p.name}: {p.value} orders</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Stock Levels Overview (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Current Ingredient Stock Health</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {inventoryData.map((ing) => (
              <div key={ing.id} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{ing.name}</h4>
                  <span className="text-[11px] text-slate-500">
                    Threshold: {ing.minThreshold} {ing.unit} · Used in {ing.productsCount} dishes
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 text-sm block">
                    {ing.quantity} {ing.unit}
                  </span>
                  <span className={`text-[10px] font-bold ${
                    ing.status === 'OUT_OF_STOCK' ? 'text-red-600' : ing.status === 'LOW_STOCK' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {ing.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
