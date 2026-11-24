import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Activity,
  ShoppingBag,
  Boxes,
  Clock,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';

export const AdminAuditLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await api.getAdminAuditLogs();
        if (res.success) {
          setLogs(res.data);
        }
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900">System Activity & Audit Ledger</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time chronological log of canteen orders, inventory consumption deductions, and stock restocks
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No activity recorded yet.</div>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-100">
            {logs.map((log) => {
              const isOrder = log.type === 'ORDER';

              return (
                <div key={log.id} className="relative flex items-start gap-4 text-xs">
                  {/* Icon Node */}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 z-10 shadow-xs ${
                    isOrder ? 'bg-orange-500 text-white' : 'bg-slate-900 text-white'
                  }`}>
                    {isOrder ? <ShoppingBag className="w-4 h-4" /> : <Boxes className="w-4 h-4" />}
                  </div>

                  {/* Log Content */}
                  <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                          isOrder ? 'bg-orange-100 text-orange-800' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {log.type}
                        </span>
                        <h4 className="font-bold text-slate-900">{log.title}</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-slate-600 mt-1">{log.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
