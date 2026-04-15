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
  Settings
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { path: '/dashboard', label: 'dashboard', icon: LayoutDashboard },
  { path: '/branches', label: 'branches', icon: MapPin },
  { path: '/customers', label: 'customers', icon: Users },
  { path: '/categories', label: 'categories', icon: LayoutGrid },
  { path: '/orders', label: 'orders', icon: Receipt },
  { path: '/settings', label: 'settings', icon: Settings },
];

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut, user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform lg:static lg:block",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-4">
            <div 
              className="cursor-pointer transition-transform active:scale-95" 
              onClick={() => navigate('/dashboard')}
            >
              <img 
                src="/assets/greenwashlogo.jpeg" 
                alt="Green Wash Co Logo" 
                className="w-full h-auto max-h-24 object-contain" 
              />
            </div>
          </div>

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
                <span>{t(item.label)}</span>
              </NavLink>
            ))}
          </nav>

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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
          <button 
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-4">
             {/* Header content like search or notifications could go here */}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 overflow-y-auto scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
