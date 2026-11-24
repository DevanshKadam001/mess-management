import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { Users, Shield, Store, GraduationCap, ChevronDown, Check } from 'lucide-react';

export const QuickRoleSwitcher: React.FC = () => {
  const { user, quickLogin } = useAuth();
  const [open, setOpen] = useState<boolean>(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleSwitch = async (role: Role, vendorIndex?: number) => {
    try {
      const key = vendorIndex ? `${role}-${vendorIndex}` : role;
      setLoadingRole(key);
      await quickLogin(role, vendorIndex);
      setOpen(false);
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setLoadingRole(null);
    }
  };

  const roles = [
    {
      role: 'STUDENT' as Role,
      label: 'Student',
      user: 'Aarav Patel (Computer Science)',
      email: 'student1@canteen.edu',
      icon: GraduationCap,
      color: 'text-blue-500 bg-blue-50',
    },
    {
      role: 'FACULTY' as Role,
      label: 'Faculty',
      user: 'Dr. Vikram Joshi (Prof. CS)',
      email: 'faculty1@canteen.edu',
      icon: Users,
      color: 'text-indigo-500 bg-indigo-50',
    },
    {
      role: 'VENDOR' as Role,
      vendorIndex: 1,
      label: 'Vendor 1 (Annapurna)',
      user: 'Ramesh Gupta (Main Food Court)',
      email: 'vendor1@canteen.edu',
      icon: Store,
      color: 'text-amber-500 bg-amber-50',
    },
    {
      role: 'VENDOR' as Role,
      vendorIndex: 2,
      label: 'Vendor 2 (Cafe Zest)',
      user: 'Kavita Singh (SAC Atrium)',
      email: 'vendor2@canteen.edu',
      icon: Store,
      color: 'text-orange-500 bg-orange-50',
    },
    {
      role: 'ADMIN' as Role,
      label: 'Administrator',
      user: 'Campus Admin (Prof. Sharma)',
      email: 'admin@canteen.edu',
      icon: Shield,
      color: 'text-emerald-500 bg-emerald-50',
    },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Dropdown Menu */}
      {open && (
        <div className="mb-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2.5 animate-in slide-in-from-bottom-3 duration-200">
          <div className="px-3 py-2 border-b border-slate-100">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Quick Role Switcher (Demo Mode)
            </span>
            <p className="text-xs text-slate-600 mt-0.5">
              Click to instantly switch logged-in profile:
            </p>
          </div>

          <div className="space-y-1 mt-1.5 max-h-80 overflow-y-auto">
            {roles.map((r, i) => {
              const Icon = r.icon;
              const isCurrent =
                user &&
                user.email === r.email;
              const isLoading = loadingRole === (r.vendorIndex ? `${r.role}-${r.vendorIndex}` : r.role);

              return (
                <button
                  key={i}
                  disabled={isLoading}
                  onClick={() => handleSwitch(r.role, r.vendorIndex)}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition ${
                    isCurrent
                      ? 'bg-orange-50/80 border border-orange-200/60'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${r.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{r.label}</span>
                        {isCurrent && (
                          <span className="text-[9px] bg-orange-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{r.user}</p>
                    </div>
                  </div>

                  {isLoading ? (
                    <span className="text-[10px] text-orange-600 animate-pulse font-semibold">
                      Switching...
                    </span>
                  ) : isCurrent ? (
                    <Check className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-full shadow-xl shadow-slate-900/25 border border-slate-700/50 text-xs font-bold transition hover:scale-105 active:scale-95"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>Demo: {user ? `${user.role} (${user.name.split(' ')[0]})` : 'Select Role'}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};
