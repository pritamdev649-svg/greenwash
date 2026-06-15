import React, { useEffect, useState } from 'react';
import { BarChart2, TrendingUp, ArrowUpRight } from 'lucide-react';
import { superAdminService } from '@backend/services/superAdminService';
import type { PlatformStats } from '../../types/hierarchy';

const PlatformAnalytics: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminService.getPlatformStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );

  const s = stats!;
  const maxSales = Math.max(...s.salesTrend.map(d => d.sales), 1);
  const last30 = s.salesTrend.slice(-30);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <BarChart2 size={28} className="text-primary-600" />
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Platform Analytics</h2>
          <p className="text-sm text-slate-500">Revenue and order trends across all vendors.</p>
        </div>
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${s.totalRevenue.toLocaleString()}`, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Outstanding', value: `₹${s.pendingRevenue.toLocaleString()}`, color: 'text-rose-600 bg-rose-50' },
          { label: "Today's Sales", value: `₹${s.todaySales.toLocaleString()}`, color: 'text-amber-600 bg-amber-50' },
          { label: 'Total Orders', value: s.totalOrders.toLocaleString(), color: 'text-primary-600 bg-primary-50' },
        ].map((k) => (
          <div key={k.label} className="card p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{k.label}</p>
            <div className={`text-2xl font-black ${k.color.split(' ')[0]} tracking-tighter`}>{k.value}</div>
            <div className={`mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-lg ${k.color}`}>
              <ArrowUpRight size={10} /> Live
            </div>
          </div>
        ))}
      </div>

      {/* Sales bar chart (last 30 days) */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={18} className="text-primary-600" />
          <h3 className="font-black text-slate-900 uppercase tracking-tight">Sales Last 30 Days</h3>
        </div>
        <div className="flex items-end gap-1 h-40">
          {last30.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group" title={`${d.date}: ₹${d.sales.toLocaleString()}`}>
              <div
                className="w-full rounded-t bg-primary-400 group-hover:bg-primary-600 transition-colors"
                style={{ height: `${(d.sales / maxSales) * 100}%`, minHeight: d.sales > 0 ? '4px' : '2px', opacity: d.sales > 0 ? 1 : 0.15 }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-3 text-[9px] font-black text-slate-400 uppercase">
          <span>{last30[0]?.date ? new Date(last30[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</span>
          <span>{last30[last30.length - 1]?.date ? new Date(last30[last30.length - 1].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</span>
        </div>
      </div>

      {/* Vendor performance table */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Vendor Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50/70 border-b border-slate-100">
                <th className="px-6 py-4">Vendor</th>
                <th className="px-4 py-4 text-right">Today Orders</th>
                <th className="px-4 py-4 text-right">Today Sales</th>
                <th className="px-4 py-4 text-right">Total Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {s.topVendors.map((v, i) => (
                <tr key={v.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                      <span className="font-bold text-slate-900 text-sm">{v.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-600">{v.todayOrders}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-800">₹{v.todaySales.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-black text-slate-900">₹{v.totalSales.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlatformAnalytics;
