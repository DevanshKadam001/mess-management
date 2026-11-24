import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminVendorsTab } from './AdminVendorsTab';
import { AdminOrdersTab } from './AdminOrdersTab';
import { AdminCategoriesTab } from './AdminCategoriesTab';
import { AdminAuditLogsTab } from './AdminAuditLogsTab';
import {
  LayoutDashboard,
  Users,
  Store,
  ClipboardList,
  Utensils,
  Activity,
  Shield,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface AdminDashboardLayoutProps {
  onNavigateHome: () => void;
}

export const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({ onNavigateHome }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');

  const navItems = [
    { key: 'overview', label: 'Overview & Metrics', icon: LayoutDashboard },
    { key: 'users', label: 'User Management', icon: Users },
    { key: 'vendors', label: 'Canteen Stalls', icon: Store },
    { key: 'orders', label: 'All Orders Monitor', icon: ClipboardList },
    { key: 'categories', label: 'Food Categories', icon: Utensils },
    { key: 'logs', label: 'System Audit Logs', icon: Activity },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 pb-16">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0 space-y-4">
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-900 flex items-center justify-center font-black">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-amber-400">
                Admin Control
              </h2>
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</p>
            </div>
          </div>

          <button
            onClick={onNavigateHome}
            className="w-full mt-2 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-between"
          >
            <span>Open Student View</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        <div className="bg-white p-2.5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full p-3 rounded-2xl text-left flex items-center justify-between text-xs font-bold transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {activeTab === 'overview' && <AdminOverviewTab onNavigateTab={(tab) => setActiveTab(tab)} />}
        {activeTab === 'users' && <AdminUsersTab />}
        {activeTab === 'vendors' && <AdminVendorsTab />}
        {activeTab === 'orders' && <AdminOrdersTab />}
        {activeTab === 'categories' && <AdminCategoriesTab />}
        {activeTab === 'logs' && <AdminAuditLogsTab />}
      </main>
    </div>
  );
};
