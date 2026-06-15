import React, { useEffect, useState } from 'react';
import { ClipboardList, Search } from 'lucide-react';
import { orderService } from '@backend/services/orderService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STATUS_COLOR: Record<string, string> = {
  Pending:    'bg-amber-50 text-amber-700',
  Processing: 'bg-blue-50 text-blue-700',
  Washing:    'bg-sky-50 text-sky-700',
  Ironing:    'bg-purple-50 text-purple-700',
  Ready:      'bg-emerald-50 text-emerald-700',
  Delivered:  'bg-slate-100 text-slate-500',
};

const PAYMENT_COLOR: Record<string, string> = {
  paid:          'bg-emerald-50 text-emerald-700',
  partially_paid:'bg-amber-50 text-amber-700',
  pending:       'bg-rose-50 text-rose-600',
};

const SuperAdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    orderService.getAllOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? orders.filter(o =>
        String(o.order_number).includes(search) ||
        o.customers?.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.branches?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <ClipboardList size={28} className="text-primary-600" />
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">All Orders</h2>
          <p className="text-sm text-slate-500">Platform-wide order ledger across all vendors.</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          placeholder="Search order, customer, vendor..." />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-100 border-t-primary-500 rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50/70 border-b border-slate-100">
                  <th className="px-6 py-4">#</th>
                  <th className="px-4 py-4">Customer</th>
                  <th className="px-4 py-4">Vendor</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">Order Status</th>
                  <th className="px-4 py-4">Payment</th>
                  <th className="px-4 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center text-slate-400 text-xs font-black uppercase tracking-widest">No orders found</td></tr>
                ) : filtered.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 font-black text-slate-800 text-sm">GWC{o.order_number}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{o.customers?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{o.branches?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">₹{Number(o.total_amount).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide", STATUS_COLOR[o.order_status] ?? 'bg-slate-50 text-slate-500')}>
                        {o.order_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide", PAYMENT_COLOR[o.payment_status] ?? '')}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(o.created_at).toLocaleDateString('en-GB')}</td>
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

export default SuperAdminOrders;
