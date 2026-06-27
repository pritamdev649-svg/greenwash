import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, Clock, User, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { to: '/customer/dashboard', icon: Home,    label: 'Home' },
  { to: '/customer/orders',    icon: Package, label: 'My Orders' },
  { to: '/customer/schedule',  icon: Clock,   label: 'Schedule' },
  { to: '/customer/profile',   icon: User,    label: 'Profile' },
];

const CustomerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut, userProfile } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <img src="/assets/logo.jpeg" alt="Green Wash Co" className="h-10 w-auto object-contain" />
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-600 hidden sm:block">
              {userProfile?.name || 'My Account'}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40 safe-area-pb">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = pathname === to || pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors',
                  active ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                {label}
                {active && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default CustomerLayout;
