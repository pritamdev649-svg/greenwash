import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, CheckCircle, Truck, Clock, Filter, ChevronRight } from 'lucide-react';
import { supabase } from '@backend/config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  Pending:    { color: 'text-amber-600',  bg: 'bg-amber-50',   label: 'Pending',          icon: <Clock size={15} /> },
  Processing: { color: 'text-blue-600',   bg: 'bg-blue-50',    label: 'Processing',        icon: <Package size={15} /> },
  Washing:    { color: 'text-indigo-600', bg: 'bg-indigo-50',  label: 'Washing',           icon: <Package size={15} /> },
  Ironing:    { color: 'text-purple-600', bg: 'bg-purple-50',  label: 'Ironing',           icon: <Package size={15} /> },
  Ready:      { color: 'text-emerald-600',bg: 'bg-emerald-50', label: 'Ready for Pickup',  icon: <Truck size={15} /> },
  Delivered:  { color: 'text-slate-500',  bg: 'bg-slate-100',  label: 'Delivered',         icon: <CheckCircle size={15} /> },
};

const FILTERS = ['All', 'Active', 'Delivered'] as const;
type FilterType = typeof FILTERS[number];

const CustomerOrders: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('All');

  useEffect(() => {
    if (!userProfile?.customer_id) { setLoading(false); return; }
    supabase
      .from('orders')
      .select('id, order_number, order_status, payment_status, total_amount, balance_amount, due_date, created_at, vendors(name)')
      .eq('customer_id', userProfile.customer_id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, [userProfile?.customer_id]);

  const filtered = orders.filter(o => {
    if (filter === 'Active') return o.order_status !== 'Delivered';
    if (filter === 'Delivered') return o.order_status === 'Delivered';
    return true;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900">My Orders</h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">{orders.length} total orders</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <Filter size={14} className="text-slate-300 self-center shrink-0" />
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide transition-colors',
              filter === f ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <Package size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="font-bold text-slate-400 text-sm">No orders here</p>
          <button
            onClick={() => navigate('/customer/new-order')}
            className="mt-4 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-emerald-700 transition-all"
          >
            Place Your First Order
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const cfg = STATUS_CONFIG[order.order_status] || STATUS_CONFIG['Pending'];
            const vendorName = order.vendors?.name;
            return (
              <button
                key={order.id}
                onClick={() => navigate(`/customer/orders/${order.id}`)}
                className="w-full bg-white rounded-2xl border border-slate-100 p-4 hover:border-emerald-200 hover:shadow-sm transition-all text-left flex items-center gap-3"
              >
                <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', cfg.bg, cfg.color)}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-slate-900 text-sm">
                      #{order.order_number || order.id.slice(0,6).toUpperCase()}
                    </p>
                    <span className={cn('text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-lg', cfg.color, cfg.bg)}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">
                    {vendorName && <span className="text-emerald-600 font-bold">{vendorName} · </span>}
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {order.due_date && (
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Due: {new Date(order.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-slate-900 text-sm">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                  {Number(order.balance_amount) > 0 && (
                    <p className="text-[10px] text-amber-600 font-bold mt-0.5">₹{Number(order.balance_amount).toLocaleString('en-IN')} due</p>
                  )}
                  <ChevronRight size={14} className="text-slate-200 mt-1 ml-auto" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;
