import React, { useEffect, useState } from 'react';
import { Store, QrCode, X, Loader2, CreditCard } from 'lucide-react';
import { vendorService } from '@backend/services/vendorService';
import { useAuth } from '../../contexts/AuthContext';
import type { VendorData, VendorPayment } from '../../types/hierarchy';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const EMPTY_PAYMENT = { upi_id: '', bank_account_number: '', bank_ifsc: '', bank_name: '', account_holder_name: '', qr_code_url: '', qr_code_text: '' };
const PAYMENT_FIELDS = [
  { key: 'account_holder_name', label: 'Account Holder Name', ph: 'Full name' },
  { key: 'upi_id', label: 'UPI ID', ph: 'name@upi' },
  { key: 'bank_name', label: 'Bank Name', ph: 'HDFC Bank' },
  { key: 'bank_account_number', label: 'Account Number', ph: 'XXXXXXXXXXXX' },
  { key: 'bank_ifsc', label: 'IFSC Code', ph: 'HDFC0001234' },
  { key: 'qr_code_url', label: 'QR Code Image URL', ph: 'https://...' },
  { key: 'qr_code_text', label: 'QR Code Text / UPI Link', ph: 'upi://pay?pa=...' },
] as const;

const MyVendors: React.FC = () => {
  const { adminId } = useAuth();
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentVendor, setPaymentVendor] = useState<VendorData | null>(null);
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!adminId) { setLoading(false); return; }
    vendorService.getAllVendors(adminId)
      .then(setVendors)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [adminId]);

  const openPayment = async (v: VendorData) => {
    setPaymentVendor(v);
    const p = await vendorService.getVendorPayment(v.id);
    setPaymentForm({
      upi_id: p?.upi_id ?? '',
      bank_account_number: p?.bank_account_number ?? '',
      bank_ifsc: p?.bank_ifsc ?? '',
      bank_name: p?.bank_name ?? '',
      account_holder_name: p?.account_holder_name ?? '',
      qr_code_url: p?.qr_code_url ?? '',
      qr_code_text: p?.qr_code_text ?? '',
    });
  };

  const handleSavePayment = async () => {
    if (!paymentVendor) return;
    setSaving(true);
    try {
      await vendorService.upsertVendorPayment(paymentVendor.id, {
        upi_id: paymentForm.upi_id || null,
        bank_account_number: paymentForm.bank_account_number || null,
        bank_ifsc: paymentForm.bank_ifsc || null,
        bank_name: paymentForm.bank_name || null,
        account_holder_name: paymentForm.account_holder_name || null,
        qr_code_url: paymentForm.qr_code_url || null,
        qr_code_text: paymentForm.qr_code_text || null,
      } as Partial<VendorPayment>);
      setPaymentVendor(null);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Store size={28} className="text-purple-600" />
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Vendors</h2>
          <p className="text-sm text-slate-500">Vendors assigned to your admin account.</p>
        </div>
      </div>

      <div className="flex gap-4">
        {[
          { label: 'Total', value: vendors.length, cls: 'bg-purple-50 text-purple-700' },
          { label: 'Active', value: vendors.filter(v => v.is_active).length, cls: 'bg-emerald-50 text-emerald-700' },
        ].map(s => (
          <div key={s.label} className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest", s.cls)}>{s.label}: {s.value}</div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-slate-100 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <Store size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-xs font-black uppercase tracking-widest">No vendors assigned yet.</p>
          </div>
        ) : vendors.map(v => (
          <div key={v.id} className="card p-5 flex flex-col gap-4 border-slate-100 hover:border-primary-100 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-black text-lg shrink-0">
                {v.name[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-black text-slate-900 text-sm truncate">{v.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{v.email ?? v.phone ?? '—'}</p>
              </div>
              <span className={cn("ml-auto px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0",
                v.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"
              )}>
                {v.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 rounded-lg p-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">City</p>
                <p className="font-bold text-slate-700 truncate">{v.city ?? '—'}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone</p>
                <p className="font-bold text-slate-700 truncate">{v.phone ?? '—'}</p>
              </div>
            </div>

            <button onClick={() => openPayment(v)}
              className="flex items-center justify-center gap-2 w-full border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl py-2 text-xs font-bold transition-colors">
              <QrCode size={14} /> Payment Settings
            </button>
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      {paymentVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Payment Settings</h3>
                <p className="text-sm text-slate-500">{paymentVendor.name}</p>
              </div>
              <button onClick={() => setPaymentVendor(null)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-emerald-50 rounded-xl p-3 flex items-center gap-3 text-sm text-emerald-700 border border-emerald-100">
                <CreditCard size={16} />
                <span className="font-medium">Customers pay directly to this vendor's account.</span>
              </div>
              {PAYMENT_FIELDS.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{f.label}</label>
                  <input type="text" value={paymentForm[f.key]} onChange={e => setPaymentForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    placeholder={f.ph} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setPaymentVendor(null)} className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-bold hover:bg-slate-50">Cancel</button>
              <button onClick={handleSavePayment} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                {saving && <Loader2 size={14} className="animate-spin" />}
                Save Payment Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyVendors;
