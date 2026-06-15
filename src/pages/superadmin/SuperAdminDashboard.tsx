import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  ShieldCheck,
  Building2,
  Users,
  Receipt,
  TrendingUp,
  Clock,
  Store,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
import { superAdminService } from '@backend/services/superAdminService';
import type { PlatformStats } from '../../types/hierarchy';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminService.getPlatformStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  const s = stats!;

  const kpis = [
    { label: 'Total Admins',    value: s.totalAdmins,                        icon: ShieldCheck, color: 'bg-blue-50 text-blue-600',    path: '/super-admin/admins' },
    { label: 'Total Vendors',   value: s.totalVendors,                       icon: Building2,   color: 'bg-purple-50 text-purple-600', path: '/super-admin/vendors' },
    { label: 'Active Vendors',  value: s.activeVendors,                      icon: Store,       color: 'bg-emerald-50 text-emerald-600', path: '/super-admin/vendors' },
    { label: 'Total Customers', value: s.totalCustomers,                     icon: Users,       color: 'bg-sky-50 text-sky-600',       path: '/super-admin/orders' },
    { label: 'Total Orders',    value: s.totalOrders,                        icon: Receipt,     color: 'bg-primary-50 text-primary-600', path: '/super-admin/orders' },
    { label: "Today's Orders",  value: s.todayOrders,                        icon: Clock,       color: 'bg-amber-50 text-amber-600',   path: '/super-admin/orders' },
    { label: 'Total Revenue',   value: `₹${s.totalRevenue.toLocaleString()}`, icon: TrendingUp,  color: 'bg-green-50 text-green-600',   path: '/super-admin/analytics' },
    { label: 'Outstanding',     value: `₹${s.pendingRevenue.toLocaleString()}`, icon: Clock,    color: 'bg-rose-50 text-rose-600',     path: '/super-admin/orders' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Crown size={28} className="text-amber-500" />
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Super Admin</h2>
          </div>
          <p className="text-slate-500 font-medium italic">Full platform control — GreenWashCo operations overview.</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-5 py-2.5 rounded-full border border-amber-100">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse ring-4 ring-amber-500/20" />
          Platform Live
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            onClick={() => navigate(kpi.path)}
            className="card p-5 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden bg-white border-slate-100"
          >
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
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-slate-50/40 rounded-full blur-xl" />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Top Vendors */}
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-lg tracking-tight uppercase">Top Vendors</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">By total revenue</p>
            </div>
            <button onClick={() => navigate('/super-admin/vendors')} className="text-primary-600 p-2 rounded-lg hover:bg-primary-50 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {s.topVendors.slice(0, 6).map((v, i) => (
              <div key={v.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50/50 transition-colors">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black",
                  i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-500" : "bg-slate-50 text-slate-400"
                )}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate">{v.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{v.totalOrders} orders</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">₹{v.totalSales.toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase">{v.todayOrders} today</p>
                </div>
              </div>
            ))}
            {s.topVendors.length === 0 && (
              <p className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">No vendor data yet</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-lg tracking-tight uppercase">Recent Orders</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Across all vendors</p>
            </div>
            <button onClick={() => navigate('/super-admin/orders')} className="text-primary-600 p-2 rounded-lg hover:bg-primary-50 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {s.recentOrders.slice(0, 6).map((o) => (
              <div key={o.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50/50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black shrink-0">
                  #{o.order_number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{o.customers?.name ?? 'Unknown'}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{o.vendors?.name ?? '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-slate-900">₹{Number(o.total_amount).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">{new Date(o.created_at).toLocaleDateString('en-GB')}</p>
                </div>
              </div>
            ))}
            {s.recentOrders.length === 0 && (
              <p className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">No orders yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Manage Admins',  path: '/super-admin/admins',     icon: ShieldCheck, cls: 'text-blue-600 bg-blue-50' },
          { label: 'All Vendors',    path: '/super-admin/vendors',    icon: Building2,   cls: 'text-purple-600 bg-purple-50' },
          { label: 'All Orders',     path: '/super-admin/orders',     icon: Receipt,     cls: 'text-primary-600 bg-primary-50' },
          { label: 'Audit Logs',     path: '/super-admin/audit-logs', icon: Clock,       cls: 'text-slate-600 bg-slate-50' },
        ].map((q) => (
          <button
            key={q.path}
            onClick={() => navigate(q.path)}
            className="card p-5 flex items-center gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group text-left"
          >
            <div className={cn("p-3 rounded-xl group-hover:scale-110 transition-transform", q.cls)}>
              <q.icon size={20} />
            </div>
            <span className="text-sm font-black text-slate-700 group-hover:text-slate-900 transition-colors">{q.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
