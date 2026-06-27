import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '@backend/config/supabase';
import {
  Calendar, Clock, MapPin, Store, Trash2,
  Plus, X, CheckCircle, Info, Loader2, RefreshCw
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TIME_SLOTS = [
  { value: 'Morning (9:00 AM - 12:00 PM)', label: 'Morning (9 AM - 12 PM)' },
  { value: 'Afternoon (12:00 PM - 4:00 PM)', label: 'Afternoon (12 PM - 4 PM)' },
  { value: 'Evening (4:00 PM - 8:00 PM)', label: 'Evening (4 PM - 8 PM)' },
];

const CustomerSchedule: React.FC = () => {
  const { userProfile } = useAuth();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [scheduleType, setScheduleType] = useState<'one_time' | 'weekly' | 'monthly'>('one_time');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState(TIME_SLOTS[0].value);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!userProfile?.customer_id) return;
    fetchSchedules();
    fetchVendors();
    fetchDefaultAddress();
  }, [userProfile?.customer_id]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scheduled_orders')
        .select(`
          *,
          vendor:vendors(name, address)
        `)
        .eq('customer_id', userProfile!.customer_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchedules(data || []);
    } catch (e) {
      console.error("Failed to fetch schedules:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const { data } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      setVendors(data || []);
      if (data && data.length > 0) {
        setSelectedVendorId(data[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch vendors:", e);
    } finally {
      setLoadingVendors(false);
    }
  };

  const fetchDefaultAddress = async () => {
    try {
      const { data } = await supabase
        .from('customers')
        .select('address')
        .eq('id', userProfile!.customer_id)
        .maybeSingle();
      if (data?.address) {
        setAddress(data.address);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelSchedule = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this scheduled pickup?")) return;
    try {
      const { error } = await supabase
        .from('scheduled_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (e: any) {
      alert(e.message || "Failed to cancel schedule.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedVendorId) { setError('Please select a store.'); return; }
    if (!pickupDate) { setError('Please select a date.'); return; }
    if (!address.trim()) { setError('Please enter a pickup address.'); return; }

    setSubmitting(true);
    try {
      // 1. Update customer address if needed
      await supabase
        .from('customers')
        .update({ address: address.trim() })
        .eq('id', userProfile!.customer_id);

      // 2. Insert scheduled order
      const { error: insError } = await supabase
        .from('scheduled_orders')
        .insert([{
          customer_id: userProfile!.customer_id,
          vendor_id: selectedVendorId,
          schedule_type: scheduleType,
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          notes: notes.trim() || null,
          status: 'pending'
        }]);

      if (insError) throw insError;

      setSuccess('Pickup scheduled successfully!');
      // reset form
      setNotes('');
      setPickupDate('');
      setIsFormOpen(false);
      fetchSchedules();
    } catch (e: any) {
      setError(e.message || 'Failed to schedule pickup. Make sure the database migration has been run.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Schedule Pickups</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Book recurring or one-time laundry pickups.</p>
        </div>
        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus size={16} />
            Schedule
          </button>
        )}
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-4 text-sm font-semibold flex items-center gap-2">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {/* ─── SCHEDULE FORM ─── */}
      {isFormOpen && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-black text-slate-900 text-base">New Pickup Schedule</h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
            >
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Vendor Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Store</label>
              {loadingVendors ? (
                <div className="h-11 bg-slate-50 rounded-xl animate-pulse" />
              ) : (
                <div className="relative">
                  <select
                    value={selectedVendorId}
                    onChange={e => setSelectedVendorId(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all font-medium appearance-none"
                  >
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-400" />
                </div>
              )}
            </div>

            {/* Schedule Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Frequency</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'one_time', label: 'One Time' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setScheduleType(opt.value as any)}
                    className={cn(
                      "h-10 rounded-xl text-xs font-bold transition-all border",
                      scheduleType === opt.value
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                        : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pickup Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {scheduleType === 'one_time' ? 'Pickup Date' : 'Starting Date'}
              </label>
              <input
                type="date"
                required
                value={pickupDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setPickupDate(e.target.value)}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all font-medium"
              />
            </div>

            {/* Pickup Time Slot */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preferred Time Slot</label>
              <div className="relative">
                <select
                  value={pickupTime}
                  onChange={e => setPickupTime(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-950 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all font-medium appearance-none"
                >
                  {TIME_SLOTS.map(slot => (
                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-400" />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pickup Address</label>
              <textarea
                value={address}
                required
                onChange={e => setAddress(e.target.value)}
                placeholder="Enter complete address for laundry pickup..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all font-medium resize-none placeholder:text-slate-300"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Special Instructions (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Call before arrival, leave at door"
                className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all font-medium placeholder:text-slate-300"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-600/10 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Schedule Pickup'
              )}
            </button>
          </form>
        </div>
      )}

      {/* ─── SCHEDULED PICKUPS LIST ─── */}
      <div className="space-y-3">
        <h2 className="font-black text-slate-955 text-base flex items-center gap-2">
          <span>Active Schedules</span>
          <button
            onClick={fetchSchedules}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Calendar size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="font-bold text-slate-400 text-sm">No scheduled pickups</p>
            <p className="text-slate-300 text-xs mt-1">Tap "Schedule" to book your laundry pickup.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map(item => {
              const formattedDate = new Date(item.pickup_date).toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              });
              const isRecurring = item.schedule_type !== 'one_time';

              return (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 relative group">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full',
                          isRecurring ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                        )}>
                          {item.schedule_type === 'one_time' ? 'One Time' : item.schedule_type}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-50 text-slate-400">
                          {item.status}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5 pt-0.5">
                        <Store size={14} className="text-slate-400" />
                        {item.vendor?.name || 'Laundry Store'}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleCancelSchedule(item.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors self-start shrink-0"
                      title="Cancel Schedule"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-slate-50 pt-3 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400 shrink-0" />
                      <span className="font-medium truncate">{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400 shrink-0" />
                      <span className="font-medium truncate">{item.pickup_time || 'Any time'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-slate-400 pt-1">
                    <MapPin size={14} className="text-slate-300 shrink-0 mt-0.5" />
                    <p className="font-medium leading-relaxed truncate-2-lines">{item.address}</p>
                  </div>

                  {item.notes && (
                    <div className="bg-slate-50 rounded-xl p-2.5 text-xs text-slate-500 flex items-start gap-2">
                      <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
                      <p className="font-medium italic leading-relaxed">{item.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSchedule;
