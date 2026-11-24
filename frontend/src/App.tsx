import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { QuickRoleSwitcher } from './components/QuickRoleSwitcher';

// Student Pages
import { HomePage } from './pages/student/HomePage';
import { CheckoutPage } from './pages/student/CheckoutPage';
import { OrderTrackingPage } from './pages/student/OrderTrackingPage';
import { OrderHistoryPage } from './pages/student/OrderHistoryPage';
import { ProfilePage } from './pages/student/ProfilePage';

// Vendor Pages
import { VendorDashboardLayout } from './pages/vendor/VendorDashboardLayout';

// Admin Pages
import { AdminDashboardLayout } from './pages/admin/AdminDashboardLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleNavigate = (tab: string, param?: string) => {
    if (tab === 'order-tracking' && param) {
      setActiveOrderId(param);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If loading user session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Initializing Smart Canteen Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC]">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        onSearchChange={currentTab === 'home' ? setSearchQuery : undefined}
      />

      {/* Cart Drawer */}
      <CartDrawer
        onCheckout={() => handleNavigate('checkout')}
        onBrowseMenu={() => handleNavigate('home')}
      />

      {/* Floating Demo Role Switcher */}
      <QuickRoleSwitcher />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1 w-full">
        {/* Student / Faculty Views */}
        {currentTab === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {currentTab === 'checkout' && (
          <CheckoutPage
            onBack={() => handleNavigate('home')}
            onOrderPlaced={(orderId) => {
              setActiveOrderId(orderId);
              handleNavigate('order-tracking', orderId);
            }}
            onNavigateToLogin={() => handleNavigate('login')}
          />
        )}

        {currentTab === 'order-tracking' && activeOrderId && (
          <OrderTrackingPage
            orderId={activeOrderId}
            onBack={() => handleNavigate('home')}
            onNavigateToHistory={() => handleNavigate('orders')}
          />
        )}

        {currentTab === 'orders' && (
          <OrderHistoryPage
            onNavigateToTracking={(orderId) => {
              setActiveOrderId(orderId);
              handleNavigate('order-tracking', orderId);
            }}
            onBrowseMenu={() => handleNavigate('home')}
          />
        )}

        {currentTab === 'profile' && <ProfilePage />}

        {/* Vendor Dashboard */}
        {currentTab === 'vendor-dashboard' && (
          <VendorDashboardLayout onNavigateHome={() => handleNavigate('home')} />
        )}

        {/* Admin Dashboard */}
        {currentTab === 'admin-dashboard' && (
          <AdminDashboardLayout onNavigateHome={() => handleNavigate('home')} />
        )}

        {/* Auth Views */}
        {currentTab === 'login' && (
          <LoginPage
            onSuccess={() => handleNavigate('home')}
            onNavigateToRegister={() => handleNavigate('register')}
          />
        )}

        {currentTab === 'register' && (
          <RegisterPage
            onSuccess={() => handleNavigate('home')}
            onNavigateToLogin={() => handleNavigate('login')}
          />
        )}
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
