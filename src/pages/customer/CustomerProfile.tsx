import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '@backend/config/supabase';
import { User, Phone, Mail, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const CustomerProfile: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    if (!userProfile?.customer_id) return;
    fetchProfile();
  }, [userProfile?.customer_id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', userProfile!.customer_id)
        .single();

      if (error) throw error;
      if (data) {
        setName(data.name || '');
        setMobile(data.mobile || '');
        setEmail(data.email || '');
        setAddress(data.address || '');
        setWalletBalance(Number(data.wallet_balance ?? data.coins ?? 0));
        setCoins(Number(data.coins || 0));
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          address: address.trim(),
          email: email.trim() || null,
        })
        .eq('id', userProfile!.customer_id);

      if (error) throw error;
      setSuccess('Profile updated successfully!');
    } catch (e: any) {
      setError(e.message || 'Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-3">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-black text-slate-900">My Profile</h1>
        <p className="text-slate-400 text-sm font-medium mt-1">Manage your account information and addresses.</p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-4 text-sm font-semibold flex items-center gap-2">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-sm font-semibold flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Wallet & Coins Balance Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-3xl p-5 shadow-lg shadow-indigo-600/20 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xl">👛</span>
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">Wallet</span>
          </div>
          <div className="mt-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200 block">Available Balance</span>
            <span className="text-2xl font-black text-white">₹{walletBalance.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-3xl p-5 shadow-lg shadow-amber-500/20 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xl">🪙</span>
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">Coins</span>
          </div>
          <div className="mt-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-100 block">Reward Coins</span>
            <span className="text-2xl font-black text-white">{coins.toLocaleString('en-IN')} Coins</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSave} className="space-y-5">
          {/* Readonly Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <div className="relative">
              <div className="absolute left-0 pl-3.5 flex items-center pointer-events-none text-slate-300 h-full">
                <User size={18} />
              </div>
              <input
                type="text"
                disabled
                value={name}
                className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-sm font-bold cursor-not-allowed"
              />
            </div>
            <p className="text-[9px] text-slate-400 font-semibold ml-1">Name cannot be changed as it is locked to your account.</p>
          </div>

          {/* Readonly Phone */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
            <div className="relative">
              <div className="absolute left-0 pl-3.5 flex items-center pointer-events-none text-slate-300 h-full">
                <Phone size={18} />
              </div>
              <input
                type="text"
                disabled
                value={mobile}
                className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-sm font-bold cursor-not-allowed"
              />
            </div>
            <p className="text-[9px] text-slate-400 font-semibold ml-1">Phone number is verified and cannot be changed.</p>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute left-0 pl-3.5 flex items-center pointer-events-none text-slate-300 h-full">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all font-medium"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Pickup Address</label>
            <div className="relative">
              <div className="absolute left-0 pl-3.5 pt-3.5 flex items-start pointer-events-none text-slate-300">
                <MapPin size={18} />
              </div>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Enter complete laundry pickup & delivery address..."
                rows={3}
                className="w-full pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all font-medium resize-none placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-600/10 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </div>

      <div className="text-center pt-4">
        <Link to="/request-delete-account" className="text-xs text-slate-400 hover:text-red-500 transition-colors font-bold uppercase tracking-wider">
          Request Account Deletion
        </Link>
      </div>
    </div>
  );
};

export default CustomerProfile;
