import React, { useEffect, useState } from 'react';
import { BarChart2, TrendingUp } from 'lucide-react';
import { adminService } from '@backend/services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import type { AdminStats } from '../../types/hierarchy';

const AdminReports: React.FC = () => {
  const { adminId } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminId) { setLoading(false); return; }
    adminService.getAdminStats(adminId).then(setStats).catch(console.error).finally(() => setLoading(false));
  }, [adminId]);

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  if (!stats) return null;

  const maxSales = Math.max(...stats.salesTrend.map(d => d.sales), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <BarChart2 size={28} className="text-blue-600" />
        <div>
          <h2 className="text-2xl font-black text-slate-900">Reports</h2>
          <p className="text-sm text-slate-500">Revenue analysis for your vendor network.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',  value: `₹${stats.totalRevenue.toLocaleString()}`,  cls: 'text-emerald-600' },
          { label: 'Outstanding',    value: `₹${stats.pendingRevenue.toLocaleString()}`, cls: 'text-rose-600' },
          { label: 'Total Orders',   value: stats.totalOrders,                           cls: 'text-primary-600' },
          { label: "Today's Orders", value: stats.todayOrders,                           cls: 'text-amber-600' },
        ].map(k => (
          <div key={k.label} className="card p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-2xl font-black ${k.cls} tracking-tighter`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={18} className="text-blue-600" />
          <h3 className="font-black text-slate-900 uppercase tracking-tight">Sales Last 30 Days</h3>
        </div>
        <div className="flex items-end gap-1 h-40">
          {stats.salesTrend.slice(-30).map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group" title={`${d.date}: ₹${d.sales.toLocaleString()}`}>
              <div
                className="w-full rounded-t bg-blue-400 group-hover:bg-blue-600 transition-colors"
                style={{ height: `${(d.sales / maxSales) * 100}%`, minHeight: d.sales > 0 ? '4px' : '2px', opacity: d.sales > 0 ? 1 : 0.15 }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h3 className="font-black text-slate-900 text-lg uppercase">Vendor Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50/70 border-b border-slate-100">
                <th className="px-6 py-3">Vendor</th>
                <th className="px-4 py-3 text-right">Orders</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.vendorPerformance.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3 font-bold text-slate-900 text-sm">{v.name}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-600">{v.totalOrders}</td>
                  <td className="px-4 py-3 text-right font-black text-slate-900">₹{v.totalSales.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${v.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                      {v.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
