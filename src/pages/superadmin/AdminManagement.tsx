import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Loader2,
} from 'lucide-react';
import { adminService } from '@backend/services/adminService';
import { superAdminService } from '@backend/services/superAdminService';
import { useAuth } from '../../contexts/AuthContext';
import type { AdminData } from '../../types/hierarchy';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const EMPTY_FORM = { name: '', email: '', phone: '', city: '', password: '' };

const AdminManagement: React.FC = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminData | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAllAdmins();
      setAdmins(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (admin: AdminData) => {
    setEditing(admin);
    setForm({ name: admin.name, email: admin.email, phone: admin.phone ?? '', city: admin.city ?? '', password: '' });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await adminService.updateAdmin(editing.id, { name: form.name, email: form.email, phone: form.phone || null, city: form.city || null });
        await superAdminService.writeAuditLog({ user_id: user?.id, user_role: 'super_admin', user_email: user?.email, action: 'UPDATE_ADMIN', entity_type: 'admin', entity_id: editing.id });
      } else {
        const created = await adminService.createAdmin({ name: form.name, email: form.email, phone: form.phone || undefined, city: form.city || undefined, created_by: user?.id });
        if (form.password.trim()) {
          await adminService.createAdminAuthUser(created.id, form.email, form.password);
        }
        await superAdminService.writeAuditLog({ user_id: user?.id, user_role: 'super_admin', user_email: user?.email, action: 'CREATE_ADMIN', entity_type: 'admin', entity_id: created.id });
      }
      setShowModal(false);
      await load();
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (admin: AdminData) => {
    if (!confirm(`Delete admin "${admin.name}"? This cannot be undone.`)) return;
    try {
      await adminService.deleteAdmin(admin.id);
      await superAdminService.writeAuditLog({ user_id: user?.id, user_role: 'super_admin', user_email: user?.email, action: 'DELETE_ADMIN', entity_type: 'admin', entity_id: admin.id });
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggle = async (admin: AdminData) => {
    try {
      await adminService.toggleAdminStatus(admin.id, !admin.is_active);
      await superAdminService.writeAuditLog({ user_id: user?.id, user_role: 'super_admin', user_email: user?.email, action: admin.is_active ? 'DEACTIVATE_ADMIN' : 'ACTIVATE_ADMIN', entity_type: 'admin', entity_id: admin.id });
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={28} className="text-blue-600" />
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Management</h2>
            <p className="text-sm text-slate-500">Create and manage admin accounts under Super Admin.</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
        >
          <Plus size={16} />
          New Admin
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 flex-wrap">
        {[
          { label: 'Total', value: admins.length, cls: 'bg-blue-50 text-blue-700' },
          { label: 'Active', value: admins.filter(a => a.is_active).length, cls: 'bg-emerald-50 text-emerald-700' },
          { label: 'Inactive', value: admins.filter(a => !a.is_active).length, cls: 'bg-rose-50 text-rose-700' },
        ].map(s => (
          <div key={s.label} className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest", s.cls)}>
            {s.label}: {s.value}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : admins.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <ShieldCheck size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-xs font-black uppercase tracking-widest">No admins yet. Create one above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50/70 border-b border-slate-100">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">Phone</th>
                  <th className="px-4 py-4">City</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Created</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {admins.map(admin => (
                  <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm shrink-0">
                          {admin.name[0].toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900 text-sm">{admin.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{admin.email}</td>
                    <td className="px-4 py-4 text-sm text-slate-500">{admin.phone ?? '—'}</td>
                    <td className="px-4 py-4 text-sm text-slate-500">{admin.city ?? '—'}</td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        admin.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"
                      )}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400">{new Date(admin.created_at).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => handleToggle(admin)} title={admin.is_active ? 'Deactivate' : 'Activate'}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                          {admin.is_active ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
                        </button>
                        <button onClick={() => openEdit(admin)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(admin)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-lg">{editing ? 'Edit Admin' : 'Create Admin'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-xl px-4 py-3 text-sm font-medium">{error}</div>}
              {(['name', 'email', 'phone', 'city'] as const).map(field => (
                <div key={field}>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    {field.charAt(0).toUpperCase() + field.slice(1)}{field === 'name' || field === 'email' ? ' *' : ''}
                  </label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    placeholder={field === 'email' ? 'admin@example.com' : `Enter ${field}`}
                  />
                </div>
              ))}
              {!editing && (
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Initial Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    placeholder="Min 6 characters"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Leave blank to set up via Supabase dashboard.</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-bold hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-2.5 text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? 'Save Changes' : 'Create Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
