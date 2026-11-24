import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Store,
  MapPin,
  Phone,
  Power,
  Save,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const VendorSettingsTab: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [stallName, setStallName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user?.vendorProfile) {
      setStallName(user.vendorProfile.stallName || '');
      setDescription(user.vendorProfile.description || '');
      setLocation(user.vendorProfile.location || '');
      setPhone(user.vendorProfile.phone || '');
      setIsOpen(user.vendorProfile.isOpen ?? true);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMsg(null);

      const res = await api.updateVendorProfile({
        stallName: stallName.trim(),
        description: description.trim(),
        location: location.trim(),
        phone: phone.trim(),
        isOpen,
      });

      if (res.success) {
        setMsg({ type: 'success', text: 'Stall profile updated successfully!' });
        if (user) {
          updateUser({
            vendorProfile: res.data,
          });
        }
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update stall settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900">Stall & Operational Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure your canteen counter branding, food court location, and live open/closed availability
        </p>
      </div>

      {msg && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
          msg.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
        
        {/* Stall Open / Closed Master Switch */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isOpen ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900">Stall Kitchen Acceptance</h4>
              <p className="text-[11px] text-slate-500">
                {isOpen
                  ? 'Currently OPEN - Accepting student & faculty orders'
                  : 'Currently CLOSED - Orders paused on student menu'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
              isOpen
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-rose-600 text-white hover:bg-rose-700'
            }`}
          >
            {isOpen ? 'Mark Closed' : 'Mark Open'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Canteen Stall Name *</label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={stallName}
                onChange={(e) => setStallName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-orange-500 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Stall Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Authentic South Indian breakfast and north Indian thalis..."
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-orange-500 text-slate-800"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Campus Location / Counter *</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Ground Floor, Central Canteen Hall - Counter 1"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-orange-500 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-orange-500 text-slate-800"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-md shadow-orange-500/20 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Stall Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
