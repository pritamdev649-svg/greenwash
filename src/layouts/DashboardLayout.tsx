import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  MapPin,
  Users,
  Receipt,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  Settings,
  Image,
  Tag,
  ShieldCheck,
  Store,
  BarChart2,
  ClipboardList,
  Building2,
  Crown,
  FileText,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { UserRole } from '../types/hierarchy';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const VENDOR_NAV: NavItem[] = [
  { path: '/dashboard', label: 'dashboard', icon: LayoutDashboard },
  { path: '/customers', label: 'customers', icon: Users },
  { path: '/categories', label: 'categories', icon: LayoutGrid },
  { path: '/orders', label: 'orders', icon: Receipt },
  { path: '/offers', label: 'promotional_offers', icon: Image },
  { path: '/pricing-manager', label: 'rate_list_manager', icon: Tag },
  { path: '/settings', label: 'settings', icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/vendors', label: 'My Vendors', icon: Store },
  { path: '/admin/orders', label: 'Orders', icon: Receipt },
  { path: '/admin/reports', label: 'Reports', icon: BarChart2 },
];

const SUPER_ADMIN_NAV: NavItem[] = [
  { path: '/super-admin/dashboard', label: 'Dashboard', icon: Crown },
  { path: '/super-admin/admins', label: 'Admins', icon: ShieldCheck },
  { path: '/super-admin/vendors', label: 'All Vendors', icon: Building2 },
  { path: '/super-admin/orders', label: 'All Orders', icon: ClipboardList },
  { path: '/super-admin/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/super-admin/audit-logs', label: 'Audit Logs', icon: FileText },
  { path: '/super-admin/settings', label: 'Settings', icon: Settings },
];

const ROLE_NAV: Record<UserRole, NavItem[]> = {
  super_admin: SUPER_ADMIN_NAV,
  admin: ADMIN_NAV,
  vendor: VENDOR_NAV,
};

const ROLE_BADGE: Record<UserRole, { label: string; cls: string }> = {
  super_admin: { label: 'Super Admin', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  admin: { label: 'Admin', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  vendor: { label: 'Vendor', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut, user, role, userProfile, isImpersonating, stopImpersonating } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const baseNavItems = role ? ROLE_NAV[role] : VENDOR_NAV;
  const navItems = [...baseNavItems];

  // Show branch dashboard and other vendor features for admins/super_admins
  if (role === 'admin' || role === 'super_admin') {
    navItems.push({
      path: '/dashboard',
      label: 'My Branch',
      icon: Store,
    });
    navItems.push({
      path: '/orders',
      label: 'Branch Orders',
      icon: Receipt,
    });
    navItems.push({
      path: '/customers',
      label: 'Branch Customers',
      icon: Users,
    });
    navItems.push({
      path: '/categories',
      label: 'Categories',
      icon: LayoutGrid,
    });
    navItems.push({
      path: '/offers',
      label: 'Promotional Offers',
      icon: Image,
    });
    navItems.push({
      path: '/pricing-manager',
      label: 'Rate List Manager',
      icon: Tag,
    });
  }

  const badge = role ? ROLE_BADGE[role] : null;

  const getLabel = (item: NavItem) => {
    // For vendor nav use translation keys; for admin/super-admin use direct labels
    if (role === 'vendor') return t(item.label);
    return item.label;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const homePath = role === 'super_admin'
    ? '/super-admin/dashboard'
    : role === 'admin'
      ? '/admin/dashboard'
      : '/dashboard';

  return (
    <div className="flex h-screen bg-slate-50">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform lg:static lg:block",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4">
            <div
              className="cursor-pointer transition-transform active:scale-95"
              onClick={() => navigate(homePath)}
            >
              <img
                src="/assets/greenwashlogo.jpeg"
                alt="Green Wash Co Logo"
                className="w-full h-auto max-h-24 object-contain"
              />
            </div>
            {badge && (
              <div className={cn(
                "mt-2 mx-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-center border",
                badge.cls
              )}>
                {badge.label}
                {userProfile?.name && <span className="ml-1 font-medium normal-case">· {userProfile.name}</span>}
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  "hover:bg-slate-50 hover:text-primary-600",
                  isActive
                    ? "bg-primary-50 text-primary-600 shadow-sm border-l-4 border-primary-600 rounded-l-none"
                    : "text-slate-600"
                )}
              >
                <item.icon size={18} />
                <span>{getLabel(item)}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100">
            <div className="mb-4 px-4 py-2 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-400 font-medium truncate uppercase tracking-wider">Signed in as</p>
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} />
              <span>{language === 'hi' ? 'लॉग आउट' : 'Log out'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
          <button
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-4" />
        </header>

        {isImpersonating && (
          <div className="bg-amber-500 text-white px-6 py-2.5 text-sm font-bold flex justify-between items-center shrink-0 shadow-md z-20">
            <span className="flex items-center gap-2"><Store size={16} /> Impersonating Branch: {userProfile?.name}</span>
            <button 
              onClick={() => {
                stopImpersonating();
                navigate('/admin/vendors');
              }}
              className="bg-amber-700 text-white px-4 py-1.5 rounded-lg text-xs hover:bg-amber-800 transition-colors flex items-center gap-2"
            >
              Exit to Admin
            </button>
          </div>
        )}

        <main className="flex-1 p-6 overflow-y-auto scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
