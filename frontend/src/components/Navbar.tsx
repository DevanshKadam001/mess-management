import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import { NotificationDrawer } from './NotificationDrawer';
import {
  UtensilsCrossed,
  ShoppingBag,
  Bell,
  User,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  Shield,
  ChevronDown,
  Store,
  Compass,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, param?: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  searchQuery,
  onSearchChange,
}) => {
  const { user, logout } = useAuth();
  const { itemsCount, setIsOpen: setCartOpen } = useCart();
  const { unreadCount } = useSocket();

  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Application Brand */}
          <div
            className="flex items-center gap-2.5 cursor-pointer flex-shrink-0"
            onClick={() => onNavigate('home')}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-slate-900 tracking-tight leading-none">
                  Smart Canteen
                </span>
                <span className="bg-orange-100 text-orange-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Campus
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Online Ordering & Inventory
              </p>
            </div>
          </div>

          {/* Search bar (when on home) */}
          {onSearchChange !== undefined && (
            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search crispy dosas, biryani, burgers, coffee..."
                  value={searchQuery || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 rounded-2xl bg-slate-100/80 border border-transparent focus:border-orange-500 focus:bg-white text-xs text-slate-800 placeholder-slate-400 transition outline-none"
                />
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {/* Student / Faculty menu items */}
            {(!user || user.role === 'STUDENT' || user.role === 'FACULTY') && (
              <>
                <button
                  onClick={() => onNavigate('home')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    currentTab === 'home'
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Menu</span>
                </button>

                {user && (
                  <button
                    onClick={() => onNavigate('orders')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      currentTab === 'orders'
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>My Orders</span>
                  </button>
                )}
              </>
            )}

            {/* Vendor Links */}
            {user?.role === 'VENDOR' && (
              <button
                onClick={() => onNavigate('vendor-dashboard')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  currentTab.startsWith('vendor')
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Vendor Dashboard</span>
              </button>
            )}

            {/* Admin Links */}
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => onNavigate('admin-dashboard')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  currentTab.startsWith('admin')
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Panel</span>
              </button>
            )}

            {/* Notification Bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition relative"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-orange-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <NotificationDrawer
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                  onNavigateToOrder={(orderId) => {
                    onNavigate('order-tracking', orderId);
                  }}
                />
              </div>
            )}

            {/* Shopping Cart button (for students/faculty or guests) */}
            {(!user || user.role === 'STUDENT' || user.role === 'FACULTY') && (
              <button
                onClick={() => setCartOpen(true)}
                className="relative px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-bold shadow-md shadow-orange-500/20 transition flex items-center gap-2 active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                {itemsCount > 0 && (
                  <span className="bg-white text-orange-600 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {itemsCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile / Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-2xl hover:bg-slate-100 transition border border-slate-200/60"
                >
                  <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {user.name.split(' ')[0]}
                    </p>
                    <span className="text-[10px] text-slate-400 capitalize block">
                      {user.role.toLowerCase()}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-slate-800">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 uppercase">
                        {user.role}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('profile');
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" /> My Profile
                    </button>

                    {user.role === 'VENDOR' && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('vendor-dashboard');
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
                      >
                        <Store className="w-3.5 h-3.5 text-slate-400" /> Vendor Dashboard
                      </button>
                    )}

                    {user.role === 'ADMIN' && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('admin-dashboard');
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
                      >
                        <Shield className="w-3.5 h-3.5 text-slate-400" /> Admin Control
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                        onNavigate('home');
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
