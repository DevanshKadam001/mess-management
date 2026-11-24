import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import {
  UtensilsCrossed,
  Mail,
  Lock,
  User,
  Phone,
  Building,
  Home,
  Store,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface RegisterPageProps {
  onSuccess: () => void;
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSuccess,
  onNavigateToLogin,
}) => {
  const { register } = useAuth();

  const [role, setRole] = useState<Role>('STUDENT');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [stallName, setStallName] = useState<string>('');
  const [stallLocation, setStallLocation] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      await register({
        role,
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        department: department.trim() || undefined,
        roomNumber: roomNumber.trim() || undefined,
        stallName: role === 'VENDOR' ? stallName.trim() : undefined,
        stallLocation: role === 'VENDOR' ? stallLocation.trim() : undefined,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-8 p-8 bg-white rounded-3xl border border-slate-100 shadow-xl space-y-6">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black mx-auto shadow-md shadow-orange-500/25">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Create Account
        </h1>
        <p className="text-xs text-slate-500">
          Join Smart Canteen for fast campus dining and seamless ordering
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Role Picker */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 block">I am a:</label>
        <div className="grid grid-cols-3 gap-2">
          {(['STUDENT', 'FACULTY', 'VENDOR'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`py-2 rounded-xl text-xs font-bold transition capitalize ${
                role === r
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-orange-500 text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Campus Email *</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              placeholder="e.g. john@canteen.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-orange-500 text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Password *</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-orange-500 text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="+91 98765 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-orange-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Department</label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="e.g. CS / Mech / Admin"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-orange-500 text-slate-900"
              />
            </div>
          </div>
        </div>

        {role === 'VENDOR' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Stall Name *</label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Desi Spices Stall"
                  value={stallName}
                  onChange={(e) => setStallName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-orange-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Stall Location</label>
              <input
                type="text"
                placeholder="e.g. Counter #3, Food Court"
                value={stallLocation}
                onChange={(e) => setStallLocation(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-orange-500 text-slate-900"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="font-bold text-slate-700 block mb-1">Hostel Block / Room Number</label>
            <div className="relative">
              <Home className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="e.g. Hostel Block B-204"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-orange-500 text-slate-900"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 mt-4"
        >
          {loading ? 'Registering...' : 'Register Account'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center text-xs text-slate-500 pt-1">
        Already registered?{' '}
        <button
          onClick={onNavigateToLogin}
          className="font-bold text-orange-600 hover:underline"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};
