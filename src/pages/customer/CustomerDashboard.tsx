import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, ChevronRight, Shirt, CheckCircle, Truck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '@backend/config/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  Pending:    { color: 'text-amber-600',  bg: 'bg-amber-50',   label: 'Pending' },
  Processing: { color: 'text-blue-600',   bg: 'bg-blue-50',    label: 'Processing' },
  Washing:    { color: 'text-indigo-600', bg: 'bg-indigo-50',  label: 'Washing' },
  Ironing:    { color: 'text-purple-600', bg: 'bg-purple-50',  label: 'Ironing' },
  Ready:      { color: 'text-emerald-600',bg: 'bg-emerald-50', label: 'Ready for Pickup' },
  Delivered:  { color: 'text-slate-500',  bg: 'bg-slate-100',  label: 'Delivered' },
};

const CustomerDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [customerData, setCustomerData] = useState<{ wallet_balance?: number; coins?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.customer_id) { setLoading(false); return; }
    fetchOrders();
    fetchCustomerProfile();
  }, [userProfile?.customer_id]);

  const fetchCustomerProfile = async () => {
    const { data } = await supabase
      .from('customers')
      .select('wallet_balance, coins')
      .eq('id', userProfile!.customer_id)
      .maybeSingle();
    if (data) setCustomerData(data);
  };

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, order_status, total_amount, balance_amount, due_date, created_at')
      .eq('customer_id', userProfile!.customer_id)
      .order('created_at', { ascending: false })
      .limit(5);
    setOrders(data || []);
    setLoading(false);
  };

  const active = orders.filter(o => o.order_status !== 'Delivered');
  const name = userProfile?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="pt-2">
        <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Good day</p>
        <h1 className="text-2xl font-black text-slate-900 mt-1">Hello, {name}! 👋</h1>
        <p className="text-slate-400 text-sm font-medium mt-1">Here's a summary of your laundry.</p>
      </div>

      {/* Wallet & Coins Card */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-4 text-white shadow-lg shadow-indigo-600/20 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xl">👛</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200 bg-white/10 px-2 py-0.5 rounded-full">Wallet</span>
          </div>
          <div className="mt-3">
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Available Balance</p>
            <p className="text-2xl font-black text-white tracking-tight mt-0.5">
              ₹{Number(customerData?.wallet_balance || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full blur-xl pointer-events-none" />
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white shadow-lg shadow-amber-500/20 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xl">🪙</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-100 bg-white/10 px-2 py-0.5 rounded-full">Rewards</span>
          </div>
          <div className="mt-3">
            <p className="text-[10px] font-bold text-amber-100 uppercase tracking-wider">Reward Coins</p>
            <p className="text-2xl font-black text-white tracking-tight mt-0.5">
              {Number(customerData?.coins || 0).toLocaleString('en-IN')} Coins
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Package size={20} className="text-emerald-600" />}
          value={orders.length}
          label="Total Orders"
          bg="bg-emerald-50"
        />
        <StatCard
          icon={<Clock size={20} className="text-amber-500" />}
          value={active.length}
          label="Active Orders"
          bg="bg-amber-50"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <ActionBtn
          icon={<Shirt size={20} className="text-white" />}
          label="New Order"
          sub="Place a one-time order"
          color="bg-emerald-600"
          onClick={() => navigate('/customer/new-order')}
        />
        <ActionBtn
          icon={<Clock size={20} className="text-white" />}
          label="Schedule"
          sub="Set a pickup schedule"
          color="bg-slate-800"
          onClick={() => navigate('/customer/schedule')}
        />
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-slate-900 text-base">Recent Orders</h2>
          <button
            onClick={() => navigate('/customer/orders')}
            className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:underline"
          >
            View all <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
            <Shirt size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="font-bold text-slate-400 text-sm">No orders yet</p>
            <p className="text-slate-300 text-xs mt-1">Tap "New Order" to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const cfg = STATUS_CONFIG[order.order_status] || STATUS_CONFIG['Pending'];
              return (
                <button
                  key={order.id}
                  onClick={() => navigate(`/customer/orders/${order.id}`)}
                  className="w-full bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 hover:border-emerald-200 hover:shadow-sm transition-all text-left"
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cfg.bg)}>
                    {order.order_status === 'Delivered'
                      ? <CheckCircle size={18} className={cfg.color} />
                      : order.order_status === 'Ready'
                      ? <Truck size={18} className={cfg.color} />
                      : <Package size={18} className={cfg.color} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 text-sm">
                      Order #{order.order_number || order.id.slice(0, 6).toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {order.due_date && ` · Due ${new Date(order.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={cn('text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-lg', cfg.color, cfg.bg)}>
                      {cfg.label}
                    </span>
                    <p className="text-xs font-bold text-slate-500 mt-1">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; value: number; label: string; bg: string }> = ({ icon, value, label, bg }) => (
  <div className={cn('rounded-2xl p-4 flex items-center gap-3', bg)}>
    <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0">{icon}</div>
    <div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
  </div>
);

const ActionBtn: React.FC<{ icon: React.ReactNode; label: string; sub: string; color: string; onClick: () => void }> = ({ icon, label, sub, color, onClick }) => (
  <button
    onClick={onClick}
    className={cn('rounded-2xl p-4 text-left transition-all active:scale-95 hover:opacity-90', color)}
  >
    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">{icon}</div>
    <p className="font-black text-white text-sm">{label}</p>
    <p className="text-[10px] text-white/70 font-semibold mt-0.5">{sub}</p>
  </button>
);

export default CustomerDashboard;
