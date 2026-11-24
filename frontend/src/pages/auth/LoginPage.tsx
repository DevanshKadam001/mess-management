import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  UtensilsCrossed,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Store,
  GraduationCap,
  Users,
  AlertCircle,
} from 'lucide-react';

interface LoginPageProps {
  onSuccess: () => void;
  onNavigateToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onNavigateToRegister,
}) => {
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState<string>('student1@canteen.edu');
  const [password, setPassword] = useState<string>('Password123!');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: any, vendorIdx?: number) => {
    try {
      setLoading(true);
      setError(null);
      await quickLogin(role, vendorIdx);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 p-8 bg-white rounded-3xl border border-slate-100 shadow-xl space-y-6">
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black mx-auto shadow-md shadow-orange-500/25">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Welcome to Smart Canteen
        </h1>
        <p className="text-xs text-slate-500">
          Sign in to place food orders or manage canteen operations
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Campus Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              placeholder="e.g. student1@canteen.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-none focus:border-orange-500 focus:bg-white text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-none focus:border-orange-500 focus:bg-white text-slate-900"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2"
        >
          {loading ? 'Authenticating...' : 'Sign In to Account'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* 1-Click Demo Accounts Selector */}
      <div className="border-t border-slate-100 pt-5 space-y-2.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block text-center">
          ⚡ 1-Click Instant Demo Login
        </span>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => handleQuickDemo('STUDENT')}
            className="p-2.5 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 transition flex items-center gap-2"
          >
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span>Student (Aarav)</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('FACULTY')}
            className="p-2.5 rounded-xl bg-indigo-50 text-indigo-800 hover:bg-indigo-100 transition flex items-center gap-2"
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Faculty (Dr. Joshi)</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('VENDOR', 1)}
            className="p-2.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 transition flex items-center gap-2"
          >
            <Store className="w-4 h-4 text-amber-600" />
            <span>Vendor 1 (Annapurna)</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('VENDOR', 2)}
            className="p-2.5 rounded-xl bg-orange-50 text-orange-800 hover:bg-orange-100 transition flex items-center gap-2"
          >
            <Store className="w-4 h-4 text-orange-600" />
            <span>Vendor 2 (Cafe Zest)</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('ADMIN')}
            className="p-2.5 rounded-xl bg-purple-50 text-purple-900 hover:bg-purple-100 transition flex items-center justify-center gap-2 col-span-2"
          >
            <Shield className="w-4 h-4 text-purple-600" />
            <span>Administrator (Campus Admin)</span>
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 pt-2">
        Don’t have an account yet?{' '}
        <button
          onClick={onNavigateToRegister}
          className="font-bold text-orange-600 hover:underline"
        >
          Register Here
        </button>
      </div>
    </div>
  );
};
