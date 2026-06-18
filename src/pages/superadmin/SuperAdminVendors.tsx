import React, { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Loader2,
  CreditCard,
  QrCode,
  Eye,
  EyeOff
} from 'lucide-react';
import { vendorService } from '@backend/services/vendorService';
import { adminService } from '@backend/services/adminService';
import { superAdminService } from '@backend/services/superAdminService';
import { useAuth } from '../../contexts/AuthContext';
import type { VendorData, AdminData, VendorPayment } from '../../types/hierarchy';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const EMPTY_VENDOR = { name: '', email: '', phone: '', address: '', city: '', state: '', admin_id: '', password: '' };
const EMPTY_PAYMENT = { upi_id: '', bank_account_number: '', bank_ifsc: '', bank_name: '', account_holder_name: '', qr_code_url: '', qr_code_text: '' };

const SuperAdminVendors: React.FC = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editing, setEditing] = useState<VendorData | null>(null);
  const [paymentVendor, setPaymentVendor] = useState<VendorData | null>(null);
  const [vendorForm, setVendorForm] = useState(EMPTY_VENDOR);
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [v, a] = await Promise.all([vendorService.getAllVendors(), adminService.getAllAdmins()]);
      setVendors(v);
      setAdmins(a);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setVendorForm(EMPTY_VENDOR);
    setError('');
    setShowVendorModal(true);
  };

  const openEdit = (v: VendorData) => {
    setEditing(v);
    setVendorForm({ name: v.name, email: v.email ?? '', phone: v.phone ?? '', address: v.address ?? '', city: v.city ?? '', state: v.state ?? '', admin_id: v.admin_id ?? '', password: '' });
    setError('');
    setShowVendorModal(true);
  };

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
    setShowPaymentModal(true);
  };

  const handleSaveVendor = async () => {
    if (!vendorForm.name.trim()) { setError('Vendor name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await vendorService.updateVendor(editing.id, {
          name: vendorForm.name,
          email: vendorForm.email || null,
          phone: vendorForm.phone || null,
          address: vendorForm.address || null,
          city: vendorForm.city || null,
          state: vendorForm.state || null,
          admin_id: vendorForm.admin_id || null,
        } as Partial<VendorData>);
        await superAdminService.writeAuditLog({ user_id: user?.id, user_role: 'super_admin', user_email: user?.email, action: 'UPDATE_VENDOR', entity_type: 'vendor', entity_id: editing.id });
      } else {
        const created = await vendorService.createVendor({
          name: vendorForm.name,
          email: vendorForm.email || undefined,
          phone: vendorForm.phone || undefined,
          address: vendorForm.address || undefined,
          city: vendorForm.city || undefined,
          state: vendorForm.state || undefined,
          admin_id: vendorForm.admin_id || undefined,
          created_by: user?.id,
        });
        if (vendorForm.email.trim() && vendorForm.password.trim()) {
          await vendorService.createVendorAuthUser(created.id, vendorForm.email, vendorForm.password);
        }
        await superAdminService.writeAuditLog({ user_id: user?.id, user_role: 'super_admin', user_email: user?.email, action: 'CREATE_VENDOR', entity_type: 'vendor', entity_id: created.id });
      }
      setShowVendorModal(false);
      await load();
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
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
      await superAdminService.writeAuditLog({ user_id: user?.id, user_role: 'super_admin', user_email: user?.email, action: 'UPDATE_VENDOR_PAYMENT', entity_type: 'vendor_payment', entity_id: paymentVendor.id });
      setShowPaymentModal(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v: VendorData) => {
    if (!confirm(`Delete vendor "${v.name}"? All associated data will be unlinked.`)) return;
    try {
      await vendorService.deleteVendor(v.id);
      await superAdminService.writeAuditLog({ user_id: user?.id, user_role: 'super_admin', user_email: user?.email, action: 'DELETE_VENDOR', entity_type: 'vendor', entity_id: v.id });
      await load();
    } catch (e: any) { alert(e.message); }
  };

  const handleToggle = async (v: VendorData) => {
    try {
      await vendorService.toggleVendorStatus(v.id, !v.is_active);
      await superAdminService.writeAuditLog({ user_id: user?.id, user_role: 'super_admin', user_email: user?.email, action: v.is_active ? 'DEACTIVATE_VENDOR' : 'ACTIVATE_VENDOR', entity_type: 'vendor', entity_id: v.id });
      await load();
    } catch (e: any) { alert(e.message); }
  };

  const VENDOR_FIELDS = [
    { key: 'name', label: 'Vendor Name *', type: 'text', ph: 'e.g. Lucknow Vendor' },
    { key: 'email', label: 'Email', type: 'email', ph: 'vendor@greenwashco.com' },
    { key: 'phone', label: 'Phone', type: 'text', ph: '+91 98765 43210' },
    { key: 'address', label: 'Address', type: 'text', ph: 'Street address' },
    { key: 'city', label: 'City', type: 'text', ph: 'Lucknow' },
    { key: 'state', label: 'State', type: 'text', ph: 'Uttar Pradesh' },
  ] as const;

  const PAYMENT_FIELDS = [
    { key: 'account_holder_name', label: 'Account Holder Name', ph: 'Full name' },
    { key: 'upi_id', label: 'UPI ID', ph: 'name@upi' },
    { key: 'bank_name', label: 'Bank Name', ph: 'HDFC Bank' },
    { key: 'bank_account_number', label: 'Account Number', ph: 'XXXXXXXXXXXX' },
    { key: 'bank_ifsc', label: 'IFSC Code', ph: 'HDFC0001234' },
    { key: 'qr_code_url', label: 'QR Code Image URL', ph: 'https://...' },
    { key: 'qr_code_text', label: 'QR Code Text / UPI Link', ph: 'upi://pay?pa=...' },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 size={28} className="text-purple-600" />
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Vendor Management</h2>
            <p className="text-sm text-slate-500">All vendors across the platform. Existing branches are shown as vendors.</p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm">
          <Plus size={16} /> New Vendor
        </button>
      </div>

      <div className="flex gap-4 flex-wrap">
        {[
          { label: 'Total', value: vendors.length, cls: 'bg-purple-50 text-purple-700' },
          { label: 'Active', value: vendors.filter(v => v.is_active).length, cls: 'bg-emerald-50 text-emerald-700' },
          { label: 'Inactive', value: vendors.filter(v => !v.is_active).length, cls: 'bg-rose-50 text-rose-700' },
          { label: 'Unassigned', value: vendors.filter(v => !v.admin_id).length, cls: 'bg-amber-50 text-amber-700' },
        ].map(s => (
          <div key={s.label} className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest", s.cls)}>
            {s.label}: {s.value}
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-100 border-t-purple-500 rounded-full animate-spin" /></div>
        ) : vendors.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Building2 size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-xs font-black uppercase tracking-widest">No vendors yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50/70 border-b border-slate-100">
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-4 py-4">Admin</th>
                  <th className="px-4 py-4">City</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Created</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {vendors.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-black text-sm shrink-0">
                          {v.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{v.name}</p>
                          <p className="text-[10px] text-slate-400">{v.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {(v.admins as any)?.name ?? <span className="text-slate-300 text-xs italic">Unassigned</span>}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">{v.city ?? '—'}</td>
                    <td className="px-4 py-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase", v.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400")}>
                        {v.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400">{new Date(v.created_at).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openPayment(v)} title="Payment Settings" className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors">
                          <QrCode size={16} />
                        </button>
                        <button onClick={() => handleToggle(v)} title={v.is_active ? 'Deactivate' : 'Activate'} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                          {v.is_active ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
                        </button>
                        <button onClick={() => openEdit(v)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(v)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vendor Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-lg">{editing ? 'Edit Vendor' : 'Create Vendor'}</h3>
              <button onClick={() => setShowVendorModal(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-xl px-4 py-3 text-sm">{error}</div>}
              {VENDOR_FIELDS.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{f.label}</label>
                  <input type={f.type} value={vendorForm[f.key]} onChange={e => setVendorForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    placeholder={f.ph} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Assign to Admin</label>
                <select value={vendorForm.admin_id} onChange={e => setVendorForm(f => ({ ...f, admin_id: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white">
                  <option value="">— No Admin —</option>
                  {admins.filter(a => a.is_active).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              {!editing && (
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Initial Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={vendorForm.password} onChange={e => setVendorForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                      placeholder="Requires email above" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Creates a Supabase login for this vendor.</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowVendorModal(false)} className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-bold hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleSaveVendor} disabled={saving} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? 'Save Changes' : 'Create Vendor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Payment Settings</h3>
                <p className="text-sm text-slate-500">{paymentVendor.name}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-emerald-50 rounded-xl p-3 flex items-center gap-3 text-sm text-emerald-700 border border-emerald-100">
                <CreditCard size={16} />
                <span className="font-medium">Payment settings are vendor-specific. Each vendor receives separate payments.</span>
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
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-bold hover:bg-slate-50">Cancel</button>
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

export default SuperAdminVendors;
