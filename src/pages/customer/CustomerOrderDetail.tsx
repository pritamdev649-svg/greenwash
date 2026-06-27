import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Store, Package, CheckCircle, Clock, Truck, Shirt } from 'lucide-react';
import { supabase } from '@backend/config/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STEPS = ['Pending', 'Processing', 'Washing', 'Ironing', 'Ready', 'Delivered'] as const;
type OrderStatus = typeof STEPS[number];

const STEP_ICONS: Record<OrderStatus, React.ReactNode> = {
  Pending:    <Clock size={16} />,
  Processing: <Package size={16} />,
  Washing:    <Package size={16} />,
  Ironing:    <Shirt size={16} />,
  Ready:      <Truck size={16} />,
  Delivered:  <CheckCircle size={16} />,
};

const CustomerOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('orders')
      .select(`
        *,
        vendors(name, address, phone),
        order_items(
          id, quantity, subtotal, custom_item_name, wash_price, iron_price, dry_clean_price,
          cloth_types(name)
        )
      `)
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setOrder(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4 pt-2">
        <div className="h-8 w-40 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 font-bold">Order not found.</p>
        <button onClick={() => navigate('/customer/orders')} className="mt-4 text-emerald-600 font-black text-sm hover:underline">
          Back to Orders
        </button>
      </div>
    );
  }

  const currentStepIdx = STEPS.indexOf(order.order_status as OrderStatus);

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/customer/orders')}
          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900">
            Order #{order.order_number || id?.slice(0, 6).toUpperCase()}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Vendor card */}
      {order.vendors && (
        <div className="bg-emerald-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
            <Store size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="font-black text-emerald-800 text-sm">{order.vendors.name}</p>
            {order.vendors.address && <p className="text-xs text-emerald-600 font-medium">{order.vendors.address}</p>}
            {order.vendors.phone && <p className="text-xs text-emerald-600 font-bold">{order.vendors.phone}</p>}
          </div>
        </div>
      )}

      {/* Order tracking progress */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h2 className="font-black text-slate-900 text-sm mb-5">Order Progress</h2>
        <div className="space-y-0">
          {STEPS.map((step, idx) => {
            const done = idx < currentStepIdx;
            const active = idx === currentStepIdx;
            return (
              <div key={step} className="flex items-start gap-4">
                {/* Icon + line */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors',
                    done    ? 'bg-emerald-500 text-white' :
                    active  ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' :
                              'bg-slate-100 text-slate-300'
                  )}>
                    {STEP_ICONS[step]}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={cn('w-0.5 h-8 mt-1', done ? 'bg-emerald-300' : 'bg-slate-100')} />
                  )}
                </div>
                {/* Label */}
                <div className="pt-1.5 pb-6">
                  <p className={cn(
                    'text-sm font-black',
                    done    ? 'text-emerald-600' :
                    active  ? 'text-slate-900' :
                              'text-slate-300'
                  )}>
                    {step}
                  </p>
                  {active && (
                    <p className="text-xs text-slate-400 font-medium mt-0.5">In progress…</p>
                  )}
                  {done && idx === currentStepIdx - 1 && (
                    <p className="text-xs text-emerald-500 font-medium mt-0.5">Completed</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order items */}
      {order.order_items && order.order_items.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50">
            <h2 className="font-black text-slate-900 text-sm">Items</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {order.order_items.map((item: any) => {
              const name = item.cloth_types?.name || item.custom_item_name || 'Item';
              const service =
                Number(item.dry_clean_price) > 0 ? 'Dry Clean' :
                Number(item.iron_price) > 0 ? 'Iron Only' : 'Wash & Fold';
              return (
                <div key={item.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{name}</p>
                    <p className="text-xs text-slate-400 font-medium">{service} × {item.quantity}</p>
                  </div>
                  <p className="font-black text-slate-900 text-sm">₹{Number(item.subtotal).toLocaleString('en-IN')}</p>
                </div>
              );
            })}
          </div>
          {/* Summary */}
          <div className="border-t border-slate-100 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Total</span>
              <span className="font-black text-slate-900">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
            </div>
            {Number(order.advance_amount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">Advance paid</span>
                <span className="font-bold text-emerald-600">−₹{Number(order.advance_amount).toLocaleString('en-IN')}</span>
              </div>
            )}
            {Number(order.balance_amount) > 0 && (
              <div className="flex justify-between text-sm pt-1 border-t border-slate-100">
                <span className="font-black text-slate-900">Balance due</span>
                <span className="font-black text-amber-600">₹{Number(order.balance_amount).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Due date */}
      {order.due_date && (
        <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm text-slate-500 font-bold">Expected by</p>
          <p className="font-black text-slate-900 text-sm">
            {new Date(order.due_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerOrderDetail;
