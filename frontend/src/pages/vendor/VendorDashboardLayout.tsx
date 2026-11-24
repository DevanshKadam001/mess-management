import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { VendorOverviewTab } from './VendorOverviewTab';
import { VendorOrdersTab } from './VendorOrdersTab';
import { VendorProductsTab } from './VendorProductsTab';
import { VendorInventoryTab } from './VendorInventoryTab';
import { VendorReportsTab } from './VendorReportsTab';
import { VendorSettingsTab } from './VendorSettingsTab';
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Boxes,
  BarChart3,
  Settings,
  Store,
  ChevronRight,
  LogOut,
  ExternalLink,
} from 'lucide-react';

interface VendorDashboardLayoutProps {
  onNavigateHome: () => void;
}

export const VendorDashboardLayout: React.FC<VendorDashboardLayoutProps> = ({ onNavigateHome }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');

  const navItems = [
    { key: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { key: 'orders', label: 'Live Orders Management', icon: ClipboardList },
    { key: 'products', label: 'Food Menu & Recipes', icon: UtensilsCrossed },
    { key: 'inventory', label: 'Inventory & Ingredients', icon: Boxes },
    { key: 'reports', label: 'Sales & Billing Reports', icon: BarChart3 },
    { key: 'settings', label: 'Stall Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 pb-16">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 flex-shrink-0 space-y-4">
        {/* Stall Header Badge */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-black text-slate-900 truncate">
                {user?.vendorProfile?.stallName || "Vendor Stall"}
              </h2>
              <span className="text-[10px] text-emerald-600 font-bold block">
                ● Live Vendor Portal
              </span>
            </div>
          </div>

          <button
            onClick={onNavigateHome}
            className="w-full mt-2 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-between"
          >
            <span>View Student Menu</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Sidebar Nav Buttons */}
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
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
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

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                logout();
                onNavigateHome();
              }}
              className="w-full p-3 rounded-2xl text-left flex items-center gap-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Tab Content */}
      <main className="flex-1 min-w-0">
        {activeTab === 'overview' && <VendorOverviewTab onNavigateTab={(tab) => setActiveTab(tab)} />}
        {activeTab === 'orders' && <VendorOrdersTab />}
        {activeTab === 'products' && <VendorProductsTab />}
        {activeTab === 'inventory' && <VendorInventoryTab />}
        {activeTab === 'reports' && <VendorReportsTab />}
        {activeTab === 'settings' && <VendorSettingsTab />}
      </main>
    </div>
  );
};
