import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Receipt, 
  TrendingUp, 
  Clock, 
  ChevronRight, 
  ChevronDown,
  ArrowUpRight, 
  ArrowDownRight,
  Users
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { orderService } from '@backend/services/orderService';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import cleanClothes3d from '../assets/clean_clothes_3d.png';

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
  salesTrend: Array<{
    date: string;
    orders: number;
    sales: number;
  }>;
}

type Timeframe = '7d' | '30d' | 'this-week' | 'this-month' | 'last-month' | 'this-quarter' | 'half-year' | 'this-year';

const SalesTrendChart: React.FC<{ data: Stats['salesTrend'], timeframe: Timeframe }> = ({ data, timeframe }) => {
  const filteredData = React.useMemo(() => {
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    
    switch (timeframe) {
      case 'this-week': {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startStr = formatDate(startOfWeek);
        return data.filter(d => d.date >= startStr);
      }
      case 'this-month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startStr = formatDate(startOfMonth);
        return data.filter(d => d.date >= startStr);
      }
      case 'last-month': {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const startStr = formatDate(startOfLastMonth);
        const endStr = formatDate(endOfLastMonth);
        return data.filter(d => d.date >= startStr && d.date <= endStr);
      }
      case 'this-quarter': {
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        const startOfQuarter = new Date(now.getFullYear(), quarterStartMonth, 1);
        const startStr = formatDate(startOfQuarter);
        return data.filter(d => d.date >= startStr);
      }
      case 'half-year': {
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        const startStr = formatDate(sixMonthsAgo);
        return data.filter(d => d.date >= startStr);
      }
      case 'this-year': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const startStr = formatDate(startOfYear);
        return data.filter(d => d.date >= startStr);
      }
      case '30d':
        return data.slice(-30);
      case '7d':
      default:
        return data.slice(-7);
    }
  }, [data, timeframe]);

  if (filteredData.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
         <TrendingUp size={40} className="mb-4 opacity-20" />
         <p className="text-[10px] font-black uppercase tracking-widest">No data for this period</p>
      </div>
    );
  }

  
  // Calculate stats for header
  const totalSales = filteredData.reduce((sum, d) => sum + d.sales, 0);
  const maxSales = Math.max(...filteredData.map(d => d.sales), 1);
  
  // Format numbers to K
  const formatYLabel = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  // Chart dimensions
  const width = 800;
  const height = 180;
  const yAxisWidth = 45; // Space for Y labels
  const padding = 20;
  
  const points = filteredData.map((d, i) => {
    const x = (i / (filteredData.length - 1)) * (width - 2 * padding - yAxisWidth) + padding + yAxisWidth;
    const y = height - ((d.sales / maxSales) * (height - 2 * padding) + padding);
    return { x, y, orders: d.orders, sales: d.sales, date: d.date };
  });

  // Bezier Curve Smoothing logic
  const getCurvePath = (pts: typeof points) => {
    if (pts.length < 2) return '';
    let path = `M ${pts[0].x} ${pts[0].y}`;
    
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 3;
      const cp2x = p1.x - (p1.x - p0.x) / 3;
      path += ` C ${cp1x} ${p0.y}, ${cp2x} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const curveLine = getCurvePath(points);
  const areaPath = `${curveLine} L ${points[points.length-1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-3xl font-black text-slate-900 tracking-tighter">₹{totalSales.toLocaleString()}</span>
        <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider">
          <ArrowUpRight size={12} />
          High performance
        </div>
      </div>
      
      <div className="flex-1 relative group/chart min-h-[180px]">
        {/* Y Axis Labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-[20px] pr-2 border-r border-slate-50">
          {[1, 0.66, 0.33, 0].map((p, i) => (
            <span key={i} className="text-[9px] font-black text-slate-400 uppercase tracking-tighter text-right">
              {formatYLabel(Math.round(maxSales * p))}
            </span>
          ))}
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full preserve-3d" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((p, i) => (
            <line 
              key={i}
              x1={yAxisWidth + padding} y1={height * p} x2={width - padding} y2={height * p} 
              stroke="#f8fafc" strokeWidth="1"
            />
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGradient)" className="transition-all duration-1000" />
          
          {/* Main Curve */}
          <path 
            d={curveLine} 
            fill="none" 
            stroke="#6366f1" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="transition-all duration-1000" 
          />
          
          {/* Interactive Points */}
          {points.map((p, i) => (
            <g key={i} className="group/point">
              <circle 
                cx={p.x} cy={p.y} r="5" 
                fill="#fff" stroke="#6366f1" strokeWidth="3"
                className="opacity-0 group-hover/point:opacity-100 transition-opacity"
              />
              <rect 
                x={p.x - 20} y={0} width="40" height={height} 
                fill="transparent" className="cursor-crosshair"
              />
              {/* Vertical Highlight Line */}
              <line x1={p.x} y1={0} x2={p.x} y2={height} stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" className="opacity-0 group-hover/point:opacity-40 transition-all duration-300" />
              
              {/* Tooltip */}
              <g className="opacity-0 group-hover/point:opacity-100 transition-all duration-300 pointer-events-none">
                {/* Dynamic Y position for tooltip: Show below point if near top edge (p.y < 60) */}
                {p.y < 60 ? (
                  <>
                    <rect x={p.x - 50} y={p.y + 15} width="100" height="40" rx="12" fill="#1e293b" className="shadow-2xl" />
                    <text x={p.x} y={p.y + 33} textAnchor="middle" fill="#fff" className="text-[10px] font-black uppercase tracking-tight">
                       ₹{p.sales.toLocaleString()}
                    </text>
                    <text x={p.x} y={p.y + 43} textAnchor="middle" fill="#94a3b8" className="text-[8px] font-bold uppercase tracking-widest">
                       {new Date(p.date).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                    </text>
                  </>
                ) : (
                  <>
                    <rect x={p.x - 50} y={p.y - 55} width="100" height="40" rx="12" fill="#1e293b" className="shadow-2xl" />
                    <text x={p.x} y={p.y - 37} textAnchor="middle" fill="#fff" className="text-[10px] font-black uppercase tracking-tight">
                       ₹{p.sales.toLocaleString()}
                    </text>
                    <text x={p.x} y={p.y - 27} textAnchor="middle" fill="#94a3b8" className="text-[8px] font-bold uppercase tracking-widest">
                       {new Date(p.date).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                    </text>
                  </>
                )}
              </g>
            </g>
          ))}
        </svg>
        
        {/* X Axis Labels */}
        <div className="absolute -bottom-2 left-[50px] right-0 flex justify-between px-2">
          {filteredData.filter((_, i) => {
             if (filteredData.length <= 10) return true;
             if (filteredData.length <= 31) return i % 5 === 0;
             if (filteredData.length <= 100) return i % 15 === 0;
             return i % 45 === 0;
          }).map((d, i) => (
            <span key={i} className="text-[9px] font-black text-slate-400 uppercase tracking-tighter px-1 rounded">
              {new Date(d.date).toLocaleDateString([], { day: 'numeric', month: 'short' })}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { vendorId, userProfile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    todaySales: 0,
    todayOrders: 0,
    branchPerformance: [],
    recentOrders: [],
    salesTrend: []
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>('7d');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await orderService.getDashboardStats(vendorId);
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [vendorId]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

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
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-5 md:p-6 text-white shadow-xl flex flex-row items-center justify-between gap-6 min-h-[160px] md:min-h-[180px]">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 max-w-xl space-y-2 text-left">
          <div>
            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase block mb-0.5">Welcome back</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">{userProfile?.name || 'Partner'}</span> 👋
            </h2>
            <p className="text-slate-300 text-xs mt-2 font-medium leading-relaxed max-w-lg">
              Welcome back to Green Wash Co. Monitor laundry operations, track customer orders, analyze sales performance, and manage your business from your centralized dashboard.
            </p>
          </div>
        </div>

        {/* 3D clean clothes image with mix-blend-screen to remove background */}
        <div className="relative w-full max-w-[140px] md:max-w-[180px] flex items-center justify-center hidden sm:flex">
          <img 
            src={cleanClothes3d} 
            alt="Clean Clothes 3D" 
            className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-2xl mix-blend-screen scale-110"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div 
            key={i} 
            onClick={() => navigate(stat.path)}
            className="card p-4 md:p-5 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200 transition-all duration-500 relative overflow-hidden bg-white border-slate-100 cursor-pointer"
          >
            <div className="flex justify-between items-start mb-3">
              <div className={cn("p-2.5 rounded-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", stat.color)}>
                <stat.icon size={18} strokeWidth={2.5} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full shadow-sm uppercase tracking-wider",
                stat.positive ? "text-emerald-700 bg-emerald-50 border border-emerald-100" : "text-rose-700 bg-rose-50 border border-rose-100"
              )}>
                {stat.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.trend}
              </div>
            </div>
            
            <div className="relative z-10 mt-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-slate-50/30 rounded-full group-hover:bg-primary-50/40 transition-all duration-700 blur-2xl pointer-events-none" />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         {/* Total Sale Chart */}
         <div className="lg:col-span-2 card p-5 md:p-6 group relative flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-extrabold text-slate-500 text-xs tracking-widest uppercase">{language === 'hi' ? 'बिक्री विश्लेषण' : 'Total Sale'}</h3>
              </div>
              <div className="relative group/select">
                <select 
                  className="appearance-none bg-slate-50 border border-slate-100 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 rounded-full px-6 pr-10 h-9 transition-all hover:bg-white hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-100"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as any)}
                >
                  <option value="last-month">{t('last_month')}</option>
                  <option value="this-week">{t('this_week')}</option>
                  <option value="this-month">{t('this_month')}</option>
                  <option value="this-quarter">{t('this_quarter')}</option>
                  <option value="half-year">{t('half_year')}</option>
                  <option value="this-year">{t('this_year')}</option>
                  <option value="7d">{language === 'hi' ? 'पिछले 7 दिन' : 'Last 7 Days'}</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover/select:text-primary-500 transition-colors" />
              </div>
            </div>
            <div className="flex-1 w-full flex items-center justify-center min-h-[250px] p-2">
               <SalesTrendChart data={stats.salesTrend} timeframe={timeframe} />
            </div>
         </div>

         {/* Compact Recent Ledger Activity */}
         <div className="card h-full flex flex-col overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-lg tracking-tight uppercase">Recent Activity</h3>
                <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">Live Feed of Transactions</p>
              </div>
              <button 
                onClick={() => navigate('/orders')} 
                className="bg-slate-50 hover:bg-primary-500 hover:text-white text-slate-400 p-2 rounded-xl transition-all duration-500 shadow-sm border border-slate-100 cursor-pointer"
              >
                 <ChevronRight size={14} strokeWidth={3} />
              </button>
            </div>
            
            <div className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[300px] scrollbar-hide">
               {stats.recentOrders.length === 0 ? (
                 <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <Receipt size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Waiting for transactions...</p>
                 </div>
               ) : stats.recentOrders.slice(0, 5).map((order) => (
                 <div key={order.id} 
                   onClick={() => navigate('/orders')}
                   className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-50 hover:border-primary-100 hover:shadow-xl hover:shadow-primary-600/5 transition-all duration-500 cursor-pointer group/order"
                 >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-[10px] group-hover/order:bg-emerald-500 group-hover/order:text-white transition-all duration-500">
                        TX
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 group-hover/order:text-primary-600 transition-colors uppercase tracking-tight">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                          {order.customer?.name || 'Anonymous'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900 tracking-tighter">₹{Number(order.total_amount).toLocaleString()}</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                 </div>
               ))}
            </div>
            
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
               <button onClick={() => navigate('/orders')} className="text-primary-600 font-black text-[10px] uppercase tracking-[0.2em] hover:text-primary-700 transition-colors cursor-pointer">
                  View All Transactions
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
