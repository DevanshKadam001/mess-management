import React, { useState, useEffect } from 'react';
import { User, Role } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  Shield,
  GraduationCap,
  Store,
  CheckCircle,
  XCircle,
  Edit2,
  Lock,
  Unlock,
  Building,
} from 'lucide-react';

export const AdminUsersTab: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Role change modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('STUDENT');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.getAdminUsers(params);
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleRoleChange = async () => {
    if (!editingUser) return;
    try {
      const res = await api.updateUserRole(editingUser.id, selectedRole);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, role: selectedRole } : u))
        );
        setEditingUser(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  const handleToggleActive = async (targetUser: User) => {
    if (targetUser.id === currentAdmin?.id) {
      alert('You cannot deactivate your own admin account.');
      return;
    }
    const newStatus = !targetUser.isActive;
    try {
      const res = await api.toggleUserStatus(targetUser.id, newStatus);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, isActive: newStatus } : u))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">User Directory & Permissions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage students, faculty members, vendor operators, and administrative privileges
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search name, email, dept..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* Role Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {['ALL', 'STUDENT', 'FACULTY', 'VENDOR', 'ADMIN'].map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              roleFilter === role
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {role === 'ALL' ? 'All Accounts' : role}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-2">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400">No users match filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-4">Department / Room</th>
                  <th className="py-3 px-3">Orders</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{u.name}</span>
                          <span className="text-[11px] text-slate-500">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'VENDOR' ? 'bg-amber-100 text-amber-800' :
                        u.role === 'FACULTY' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <span>{u.department || 'Campus'}</span>
                      {u.roomNumber && <span className="text-slate-400 block text-[11px]">{u.roomNumber}</span>}
                    </td>

                    <td className="py-3.5 px-3 font-bold text-slate-800">
                      {u.ordersCount || 0}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                        u.isActive ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {u.isActive ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Deactivated
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setSelectedRole(u.role);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Change Role
                        </button>

                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={u.id === currentAdmin?.id}
                          className={`p-1.5 rounded-lg text-xs font-bold transition ${
                            u.isActive
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.isActive ? 'Deactivate account' : 'Activate account'}
                        >
                          {u.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-100 z-10 animate-in zoom-in-95">
            <div>
              <h3 className="font-black text-base text-slate-900">Change Role: {editingUser.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Select permission tier for this account</p>
            </div>

            <div className="space-y-2">
              {(['STUDENT', 'FACULTY', 'VENDOR', 'ADMIN'] as Role[]).map((r) => (
                <div
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between text-xs font-bold transition ${
                    selectedRole === r ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span>{r}</span>
                  {selectedRole === r && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
