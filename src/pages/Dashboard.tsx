import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Receipt, 
  TrendingUp, 
  Clock, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight,
  Users
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { orderService } from '@backend/services/orderService';
import { useLanguage } from '../contexts/LanguageContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Stats {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  todaySales: number;
  todayOrders: number;
  branchPerformance: Array<{
    name: string;
    todayOrders: number;
    todaySales: number;
    totalSales: number;
  }>;
  recentOrders: Array<{
    id: string;
    created_at: string;
    total_amount: number;
    customer?: { name: string };
  }>;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    todaySales: 0,
    todayOrders: 0,
    branchPerformance: [],
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await orderService.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { 
      label: t('customers'), 
      value: stats.totalCustomers, 
      icon: Users, 
      color: 'bg-primary-50 text-primary-600',
      trend: '+12%',
      positive: true,
      path: '/customers'
    },
    { 
      label: t('active_orders'), 
      value: stats.todayOrders, 
      icon: Receipt, 
      color: 'bg-emerald-50 text-emerald-600',
      trend: '+8%',
      positive: true,
      path: '/orders'
    },
    { 
      label: t('todays_sales'), 
      value: `₹${stats.todaySales.toLocaleString()}`, 
      icon: TrendingUp, 
      color: 'bg-amber-50 text-amber-600',
      trend: '+24%',
      positive: true,
      path: '/orders'
    },
    { 
      label: t('total_outstanding'), 
      value: `₹${stats.pendingPayments.toLocaleString()}`, 
      icon: Clock, 
      color: 'bg-rose-50 text-rose-600',
      trend: '-5%',
      positive: false,
      path: '/orders'
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black font-sans text-slate-900 tracking-tight">Operational Overview</h2>
          <p className="text-slate-500 mt-1 font-medium italic">Empower your laundry ecosystem with real-time intelligence.</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-5 py-2.5 rounded-full border border-emerald-100 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
          Live Ledger Tracking
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div 
            key={i} 
            className="card p-7 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 relative overflow-hidden bg-white border-slate-100"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={cn("p-4 rounded-[1.25rem] transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", stat.color)}>
                <stat.icon size={24} strokeWidth={2.5} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wider",
                stat.positive ? "text-emerald-700 bg-emerald-50 border border-emerald-100" : "text-rose-700 bg-rose-50 border border-rose-100"
              )}>
                {stat.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.trend}
              </div>
            </div>
            
            <div className="relative z-10">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
            </div>
            
            <button 
              onClick={() => navigate(stat.path)}
              className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-primary-600 cursor-pointer group-hover:text-primary-700 transition-colors"
            >
              <span>Explore detail</span>
              <ChevronRight size={14} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-slate-50/30 rounded-full group-hover:bg-primary-50/40 transition-all duration-700 blur-2xl" />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         {/* Sales Analysis Chart Mock */}
         <div className="lg:col-span-2 card p-8 group relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-black text-slate-900 text-xl tracking-tight">{language === 'hi' ? 'बिक्री विश्लेषण' : 'Sales Analysis'}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Order Volume Trends</p>
              </div>
              <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                <select className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-500 focus:ring-0 cursor-pointer px-3">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>
            </div>
            <div className="h-72 bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 font-black gap-4 p-8">
               <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                  <TrendingUp size={32} />
               </div>
               <div className="text-center">
                  <p className="uppercase tracking-[0.2em] text-[10px] mb-1">Coming Soon</p>
                  <p className="text-xs font-bold text-slate-300">Interactive Trend Visualization</p>
               </div>
            </div>
         </div>

         {/* Branch Performance */}
         <div className="card h-full flex flex-col overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase">{t('branches')}</h3>
              <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">{t('live_efficiency_metrics')}</p>
            </div>
            <div className="flex-1 p-5 space-y-3 overflow-y-auto max-h-[400px] scrollbar-hide">
               {stats.branchPerformance.length === 0 ? (
                 <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <Receipt size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest">No active branches</p>
                 </div>
               ) : stats.branchPerformance.map((branch, i) => (
                 <div key={i} 
                   onClick={() => navigate('/branches')}
                   className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-50 hover:border-primary-100 hover:shadow-xl hover:shadow-primary-600/5 transition-all duration-500 cursor-pointer group/branch"
                 >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover/branch:bg-primary-500 group-hover/branch:text-white transition-all duration-500 font-black text-xs">
                        B{i+1}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 group-hover/branch:text-primary-600 transition-colors uppercase tracking-tight">{branch.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{branch.todayOrders} orders today</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 tracking-tighter">₹{branch.todaySales.toLocaleString()}</p>
                      <div className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded-full mt-1 uppercase tracking-widest",
                        branch.todaySales > 0 ? "text-emerald-500" : "text-slate-300"
                      )}>
                        {branch.todaySales > 0 ? 'ACTIVE' : 'IDLE'}
                      </div>
                    </div>
                 </div>
               ))}
            </div>
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
               <button onClick={() => navigate('/branches')} className="text-primary-600 font-black text-[10px] uppercase tracking-[0.2em] hover:text-primary-700 transition-colors">
                  Synchronize Branches
               </button>
            </div>
         </div>
      </div>

      {/* Recent Ledger Activity */}
      <div className="card p-0 overflow-hidden group">
         <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase">Recent Ledger Entries</h3>
              <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">Live Feed of Transaction Data</p>
            </div>
            <button onClick={() => navigate('/orders')} className="bg-slate-50 hover:bg-primary-500 hover:text-white text-slate-400 p-3 rounded-2xl transition-all duration-500 shadow-sm border border-slate-100">
               <ChevronRight size={20} strokeWidth={2.5} />
            </button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                     <th className="py-4 px-8 border-b border-slate-50">Transaction Entry</th>
                     <th className="py-4 px-4 border-b border-slate-50">Temporal Data</th>
                     <th className="py-4 px-8 border-b border-slate-50 text-right">Value</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {stats.recentOrders.length === 0 ? (
                    <tr><td colSpan={3} className="py-20 text-center text-slate-300 uppercase tracking-widest text-[10px] font-black">Waiting for transactions...</td></tr>
                  ) : stats.recentOrders.map((order) => (
                    <tr key={order.id} className="group/row hover:bg-slate-50/50 transition-colors">
                      <td className="py-5 px-8">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-[10px] group-hover/row:scale-110 transition-transform">
                               TX
                            </div>
                            <div className="flex flex-col">
                               <span className="text-sm font-black text-slate-900 tracking-tight">#{order.id.slice(0, 8).toUpperCase()}</span>
                               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{order.customer?.name || 'Anonymous Client'}</span>
                            </div>
                         </div>
                      </td>
                      <td className="py-5 px-4">
                         <div className="flex items-center gap-2 group-hover/row:translate-x-1 transition-transform duration-500">
                            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-400">
                               <Clock size={14} />
                            </div>
                            <div className="flex flex-col text-[10px] font-black uppercase tracking-widest">
                               <span className="text-slate-900">{new Date(order.created_at).toLocaleDateString('en-GB')}</span>
                               <span className="text-slate-400">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                         </div>
                      </td>
                      <td className="py-5 px-8 text-right font-black text-slate-900 text-lg tracking-tighter">
                         ₹{Number(order.total_amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
