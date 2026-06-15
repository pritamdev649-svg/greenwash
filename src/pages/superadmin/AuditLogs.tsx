import React, { useEffect, useState } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { superAdminService } from '@backend/services/superAdminService';
import type { AuditLog } from '../../types/hierarchy';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ACTION_COLORS: Record<string, string> = {
  CREATE_ADMIN:          'bg-blue-50 text-blue-700',
  UPDATE_ADMIN:          'bg-sky-50 text-sky-700',
  DELETE_ADMIN:          'bg-rose-50 text-rose-700',
  ACTIVATE_ADMIN:        'bg-emerald-50 text-emerald-700',
  DEACTIVATE_ADMIN:      'bg-amber-50 text-amber-700',
  CREATE_VENDOR:         'bg-purple-50 text-purple-700',
  UPDATE_VENDOR:         'bg-violet-50 text-violet-700',
  DELETE_VENDOR:         'bg-rose-50 text-rose-700',
  ACTIVATE_VENDOR:       'bg-emerald-50 text-emerald-700',
  DEACTIVATE_VENDOR:     'bg-amber-50 text-amber-700',
  UPDATE_VENDOR_PAYMENT: 'bg-green-50 text-green-700',
};

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await superAdminService.getAuditLogs({
        role: roleFilter || undefined,
        entity_type: entityFilter || undefined,
        limit: 300,
      });
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [roleFilter, entityFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <FileText size={28} className="text-slate-600" />
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Audit Logs</h2>
            <p className="text-sm text-slate-500">Full trail of all admin and super admin actions.</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-300">
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="vendor">Vendor</option>
        </select>
        <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-300">
          <option value="">All Entities</option>
          <option value="admin">Admin</option>
          <option value="vendor">Vendor</option>
          <option value="vendor_payment">Vendor Payment</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-100 border-t-slate-500 rounded-full animate-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FileText size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-xs font-black uppercase tracking-widest">No audit logs yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50/70 border-b border-slate-100">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-4 py-4">User</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-4 py-4">Action</th>
                  <th className="px-4 py-4">Entity</th>
                  <th className="px-4 py-4">Entity ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="text-xs font-bold text-slate-900">{new Date(log.created_at).toLocaleDateString('en-GB')}</div>
                      <div className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[160px] truncate">{log.user_email ?? log.user_id ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide",
                        log.user_role === 'super_admin' ? 'bg-amber-50 text-amber-700' :
                        log.user_role === 'admin' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      )}>
                        {log.user_role ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide",
                        ACTION_COLORS[log.action] ?? 'bg-slate-50 text-slate-500'
                      )}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 uppercase tracking-wide">{log.entity_type ?? '—'}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-400 font-mono">{log.entity_id ? log.entity_id.slice(0, 8) + '…' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
