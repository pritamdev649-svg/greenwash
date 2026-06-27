import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, Store, Plus, Minus,
  ShoppingBag, CheckCircle, Loader2, Search, Shirt
} from 'lucide-react';
import { supabase } from '@backend/config/supabase';
import { orderService } from '@backend/services/orderService';
import { useAuth } from '../../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Step = 'vendor' | 'items' | 'review' | 'done';

type ServiceType = 'wash' | 'iron' | 'dry_clean';

interface CartItem {
  cloth_type_id: string;
  item_name: string;
  quantity: number;
  service: ServiceType;
  wash_price: number;
  iron_price: number;
  dry_clean_price: number;
  subtotal: number;
}

const SERVICE_LABELS: Record<ServiceType, string> = {
  wash: 'Wash & Fold',
  iron: 'Iron Only',
  dry_clean: 'Dry Clean',
};

const CustomerNewOrder: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [step, setStep] = useState<Step>('vendor');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Vendor selection
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [loadingVendors, setLoadingVendors] = useState(true);

  // Item selection
  const [clothTypes, setClothTypes] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Address
  const [address, setAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);

  // Check for pending guest order on mount
  useEffect(() => {
    const pending = localStorage.getItem('greenwash_pending_order');
    if (pending) {
      try {
        const parsed = JSON.parse(pending);
        if (parsed.vendor && parsed.cart && parsed.cart.length > 0) {
          setIsPreloading(true);
          setSelectedVendor(parsed.vendor);
          setCart(parsed.cart);
          setStep('review');
        }
      } catch (e) {
        console.error('Failed to parse pending order:', e);
      }
      localStorage.removeItem('greenwash_pending_order');
    }
  }, []);

  // Fetch customer address on mount or login
  useEffect(() => {
    if (!userProfile?.customer_id) return;
    setLoadingAddress(true);
    supabase
      .from('customers')
      .select('address')
      .eq('id', userProfile.customer_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.address) {
          setAddress(data.address);
        }
        setLoadingAddress(false);
      });
  }, [userProfile?.customer_id]);

  // Fetch all active vendors on mount
  useEffect(() => {
    supabase
      .from('vendors')
      .select('id, name, address, city, phone, branch_id')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setVendors(data || []);
        setLoadingVendors(false);
      });
  }, []);

  // Fetch cloth types when vendor selected
  useEffect(() => {
    if (!selectedVendor) return;
    setLoadingItems(true);
    if (!isPreloading) {
      setCart([]);
    } else {
      setIsPreloading(false); // Reset preloading flag
    }
    orderService.getAllClothTypes(selectedVendor.id).then(data => {
      // fallback: load global cloth types if vendor has none
      if (!data || data.length === 0) {
        orderService.getAllClothTypes(null).then(global => {
          setClothTypes(global || []);
          setLoadingItems(false);
        });
      } else {
        setClothTypes(data);
        setLoadingItems(false);
      }
    });
  }, [selectedVendor]);

  const filteredVendors = vendors.filter(v =>
    `${v.name} ${v.city || ''}`.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  const getCartItem = (id: string, service: ServiceType) =>
    cart.find(c => c.cloth_type_id === id && c.service === service);

  const setQty = (cloth: any, service: ServiceType, delta: number) => {
    const price =
      service === 'wash' ? Number(cloth.wash_price || 0) :
      service === 'iron' ? Number(cloth.iron_price || 0) :
      Number(cloth.dry_clean_price || 0);

    setCart(prev => {
      const existing = prev.find(c => c.cloth_type_id === cloth.id && c.service === service);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) return prev.filter(c => !(c.cloth_type_id === cloth.id && c.service === service));
        return prev.map(c =>
          c.cloth_type_id === cloth.id && c.service === service
            ? { ...c, quantity: newQty, subtotal: price * newQty }
            : c
        );
      }
      if (delta <= 0) return prev;
      return [...prev, {
        cloth_type_id: cloth.id,
        item_name: cloth.name,
        quantity: 1,
        service,
        wash_price: Number(cloth.wash_price || 0),
        iron_price: Number(cloth.iron_price || 0),
        dry_clean_price: Number(cloth.dry_clean_price || 0),
        subtotal: price,
      }];
    });
  };

  const total = cart.reduce((s, i) => s + i.subtotal, 0);

  const handleSubmit = async () => {
    if (!userProfile?.customer_id || !selectedVendor) return;
    if (!address.trim()) {
      setError('Please enter a pickup & delivery address.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      // 1. Update customer address
      const { error: addressError } = await supabase
        .from('customers')
        .update({ address: address.trim() })
        .eq('id', userProfile.customer_id);

      if (addressError) throw addressError;

      // 2. Place order
      const items = cart.map(c => ({
        cloth_type_id: c.cloth_type_id,
        item_name: c.item_name,
        quantity: c.quantity,
        wash_price: c.service === 'wash' ? c.wash_price : 0,
        iron_price: c.service === 'iron' ? c.iron_price : 0,
        dry_clean_price: c.service === 'dry_clean' ? c.dry_clean_price : 0,
        subtotal: c.subtotal,
      }));
      await orderService.createOrder(
        userProfile.customer_id,
        selectedVendor.branch_id || selectedVendor.id,
        total,
        items,
        0, 0, null,
        selectedVendor.id
      );
      setStep('done');
    } catch (e: any) {
      setError(e.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── STEP: DONE ──
  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Order Placed!</h2>
        <p className="text-slate-400 font-medium text-sm max-w-xs">
          Your laundry order has been sent to <span className="font-bold text-slate-600">{selectedVendor?.name}</span>. You'll be notified when it's picked up.
        </p>
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => navigate('/customer/orders')}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-emerald-700 transition-all"
          >
            Track Orders
          </button>
          <button
            onClick={() => { setStep('vendor'); setSelectedVendor(null); setCart([]); }}
            className="border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-black text-sm hover:border-slate-300 transition-all"
          >
            New Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header + progress */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          {step !== 'vendor' && (
            <button
              onClick={() => setStep(step === 'review' ? 'items' : 'vendor')}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-black text-slate-900">New Order</h1>
            <p className="text-xs text-slate-400 font-medium">
              {step === 'vendor' && 'Choose a laundry vendor'}
              {step === 'items' && `Adding items — ${selectedVendor?.name}`}
              {step === 'review' && 'Review your order'}
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {(['vendor', 'items', 'review'] as const).map((s, i) => (
            <React.Fragment key={s}>
              <div className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                step === s ? 'bg-emerald-500' :
                (i < ['vendor','items','review'].indexOf(step)) ? 'bg-emerald-200' : 'bg-slate-100'
              )} />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── STEP 1: VENDOR ── */}
      {step === 'vendor' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              placeholder="Search by name or city…"
              value={vendorSearch}
              onChange={e => setVendorSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all"
            />
          </div>

          {loadingVendors ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-12">
              <Store size={36} className="mx-auto text-slate-200 mb-2" />
              <p className="text-slate-400 font-bold text-sm">No vendors found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVendors.map(v => (
                <button
                  key={v.id}
                  onClick={() => { setSelectedVendor(v); setStep('items'); }}
                  className="w-full bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 hover:border-emerald-300 hover:shadow-sm transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                    <Store size={20} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 text-sm">{v.name}</p>
                    {(v.address || v.city) && (
                      <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">
                        {[v.address, v.city].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {v.phone && <p className="text-xs text-emerald-600 font-bold mt-0.5">{v.phone}</p>}
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: ITEMS ── */}
      {step === 'items' && (
        <div className="space-y-4">
          {loadingItems ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : clothTypes.length === 0 ? (
            <div className="text-center py-12">
              <Shirt size={36} className="mx-auto text-slate-200 mb-2" />
              <p className="text-slate-400 font-bold text-sm">No items found for this vendor</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clothTypes.map(cloth => {
                const services: ServiceType[] = [];
                if (Number(cloth.wash_price) > 0) services.push('wash');
                if (Number(cloth.iron_price) > 0) services.push('iron');
                if (Number(cloth.dry_clean_price) > 0) services.push('dry_clean');
                if (services.length === 0) services.push('wash');

                return (
                  <div key={cloth.id} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <Shirt size={16} className="text-emerald-600" />
                      </div>
                      <p className="font-black text-slate-900 text-sm">{cloth.name}</p>
                    </div>

                    <div className="space-y-2 pl-12">
                      {services.map(svc => {
                        const price =
                          svc === 'wash' ? Number(cloth.wash_price || 0) :
                          svc === 'iron' ? Number(cloth.iron_price || 0) :
                          Number(cloth.dry_clean_price || 0);
                        const item = getCartItem(cloth.id, svc);

                        return (
                          <div key={svc} className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-600">{SERVICE_LABELS[svc]}</span>
                              <span className="text-xs text-emerald-600 font-black ml-2">₹{price}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {item ? (
                                <>
                                  <button
                                    onClick={() => setQty(cloth, svc, -1)}
                                    className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="w-6 text-center text-sm font-black text-slate-900">{item.quantity}</span>
                                  <button
                                    onClick={() => setQty(cloth, svc, 1)}
                                    className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-600 transition-colors"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setQty(cloth, svc, 1)}
                                  className="h-7 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-black flex items-center gap-1 hover:bg-emerald-100 transition-colors"
                                >
                                  <Plus size={12} /> Add
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sticky bottom cart bar */}
          {cart.length > 0 && (
            <div className="sticky bottom-20 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/60 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  {cart.reduce((s, i) => s + i.quantity, 0)} items
                </p>
                <p className="font-black text-slate-900 text-lg">₹{total.toLocaleString('en-IN')}</p>
              </div>
              <button
                onClick={() => setStep('review')}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-emerald-700 transition-all flex items-center gap-2"
              >
                Review Order <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: REVIEW ── */}
      {step === 'review' && (
        <div className="space-y-4">
          {/* Vendor info */}
          <div className="bg-emerald-50 rounded-2xl p-4 flex items-center gap-3">
            <Store size={20} className="text-emerald-600 shrink-0" />
            <div>
              <p className="font-black text-emerald-800 text-sm">{selectedVendor?.name}</p>
              {selectedVendor?.address && <p className="text-xs text-emerald-600 font-medium">{selectedVendor.address}</p>}
            </div>
          </div>

          {/* Cart items */}
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
            {cart.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{item.item_name}</p>
                  <p className="text-xs text-slate-400 font-medium">{SERVICE_LABELS[item.service]} × {item.quantity}</p>
                </div>
                <p className="font-black text-slate-900 text-sm">₹{item.subtotal.toLocaleString('en-IN')}</p>
              </div>
            ))}
            <div className="flex items-center justify-between p-4 bg-emerald-50/50">
              <p className="font-black text-slate-900">Total</p>
              <p className="font-black text-emerald-600 text-lg">₹{total.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Pickup Address */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Pickup & Delivery Address *
            </label>
            {loadingAddress ? (
              <div className="h-20 bg-slate-50 rounded-xl animate-pulse" />
            ) : (
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Enter your complete address for laundry pickup and delivery..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all font-medium resize-none placeholder:text-slate-300"
              />
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-semibold">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-13 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 py-4"
          >
            {submitting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <ShoppingBag size={18} />
                Confirm & Place Order
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerNewOrder;
