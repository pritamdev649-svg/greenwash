import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Receipt,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
import { adminService } from '@backend/services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import type { AdminStats } from '../../types/hierarchy';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { adminId } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminId) { setLoading(false); return; }
    adminService.getAdminStats(adminId)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [adminId]);

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  if (!adminId || !stats) return (
    <div className="flex h-[400px] items-center justify-center text-slate-400 text-sm font-bold">
      Admin profile not configured. Please contact Super Admin.
    </div>
  );

  const kpis = [
    { label: 'My Vendors',      value: stats.totalVendors,                         icon: Store,       color: 'bg-purple-50 text-purple-600', path: '/admin/vendors' },
    { label: 'Active Vendors',  value: stats.activeVendors,                        icon: Store,       color: 'bg-emerald-50 text-emerald-600', path: '/admin/vendors' },
    { label: 'Total Orders',    value: stats.totalOrders,                          icon: Receipt,     color: 'bg-primary-50 text-primary-600', path: '/admin/orders' },
    { label: "Today's Orders",  value: stats.todayOrders,                          icon: Clock,       color: 'bg-amber-50 text-amber-600', path: '/admin/orders' },
    { label: 'Total Revenue',   value: `₹${stats.totalRevenue.toLocaleString()}`,  icon: TrendingUp,  color: 'bg-green-50 text-green-600', path: '/admin/reports' },
    { label: 'Outstanding',     value: `₹${stats.pendingRevenue.toLocaleString()}`,icon: Clock,       color: 'bg-rose-50 text-rose-600', path: '/admin/orders' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LayoutDashboard size={28} className="text-blue-600" />
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Admin Dashboard</h2>
            <p className="text-slate-500 font-medium italic">Overview of your vendor network.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-5 py-2.5 rounded-full border border-blue-100">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse ring-4 ring-blue-500/20" />
          Admin View
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} onClick={() => navigate(kpi.path)}
            className="card p-5 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer bg-white border-slate-100 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-3 rounded-xl transition-all duration-300 group-hover:scale-110", kpi.color)}>
                <kpi.icon size={20} strokeWidth={2.5} />
              </div>
              <ArrowUpRight size={14} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Vendor performance */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-lg tracking-tight uppercase">Vendor Performance</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Your assigned vendors</p>
          </div>
          <button onClick={() => navigate('/admin/vendors')} className="text-primary-600 p-2 rounded-lg hover:bg-primary-50 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50/70 border-b border-slate-100">
                <th className="px-6 py-3">Vendor</th>
                <th className="px-4 py-3 text-right">Today Orders</th>
                <th className="px-4 py-3 text-right">Total Orders</th>
                <th className="px-4 py-3 text-right">Total Sales</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.vendorPerformance.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-black uppercase">No vendors assigned yet</td></tr>
              ) : stats.vendorPerformance.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-black text-sm shrink-0">{v.name[0].toUpperCase()}</div>
                      <span className="font-bold text-slate-900 text-sm">{v.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-600">{v.todayOrders}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-600">{v.totalOrders}</td>
                  <td className="px-4 py-3 text-right font-black text-slate-900">₹{v.totalSales.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase", v.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400")}>
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

export default AdminDashboard;
