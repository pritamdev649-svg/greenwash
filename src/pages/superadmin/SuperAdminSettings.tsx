import React from 'react';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SuperAdminSettings: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Settings size={28} className="text-slate-600" />
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Platform Settings</h2>
          <p className="text-sm text-slate-500">System-wide configuration for GreenWashCo platform.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {[
          {
            title: 'Vendor Settings',
            desc: 'Manage all vendor accounts, payment settings, and assignments.',
            path: '/super-admin/vendors',
            cls: 'border-purple-100 hover:border-purple-200',
            badge: 'bg-purple-50 text-purple-700',
          },
          {
            title: 'Admin Settings',
            desc: 'Create and manage admin accounts under super admin.',
            path: '/super-admin/admins',
            cls: 'border-blue-100 hover:border-blue-200',
            badge: 'bg-blue-50 text-blue-700',
          },
          {
            title: 'Platform Analytics',
            desc: 'Revenue, orders, and performance across all vendors.',
            path: '/super-admin/analytics',
            cls: 'border-primary-100 hover:border-primary-200',
            badge: 'bg-primary-50 text-primary-700',
          },
          {
            title: 'Audit Logs',
            desc: 'Full trail of admin and vendor actions on the platform.',
            path: '/super-admin/audit-logs',
            cls: 'border-slate-200 hover:border-slate-300',
            badge: 'bg-slate-50 text-slate-700',
          },
          {
            title: 'System Settings (App)',
            desc: 'Language, charges, and application-level preferences.',
            path: '/settings',
            cls: 'border-emerald-100 hover:border-emerald-200',
            badge: 'bg-emerald-50 text-emerald-700',
          },
        ].map(item => (
          <div
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`card p-6 cursor-pointer hover:shadow-lg transition-all duration-200 border ${item.cls} group`}
          >
            <div className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 ${item.badge}`}>
              {item.title}
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
            <p className="text-xs text-primary-600 font-bold mt-4 group-hover:underline">{item.path} →</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuperAdminSettings;
