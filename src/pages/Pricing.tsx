import React, { useEffect, useState } from 'react';
import { Search, ChevronRight, MessageCircle, ArrowLeft, WashingMachine as Laundry, Sparkles, Shirt, Footprints } from 'lucide-react';
import { pricingService } from '../../Backend/src/services/pricingService';
import type { PricingItem } from '../../Backend/src/services/pricingService';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

const categories = [
  { name: 'Premium Laundry', icon: Laundry, color: 'bg-blue-50 text-blue-600' },
  { name: 'Dry Cleaning', icon: Sparkles, color: 'bg-purple-50 text-purple-600' },
  { name: 'Steam Iron', icon: Shirt, color: 'bg-amber-50 text-amber-600' },
  { name: 'Starch', icon: Shirt, color: 'bg-emerald-50 text-emerald-600' },
  { name: 'Shoe Cleaning', icon: Footprints, color: 'bg-rose-50 text-rose-600' },
];

const Pricing: React.FC = () => {
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const data = await pricingService.getAllPricing();
        setPricing(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPricing();
  }, []);

  const filteredPricing = pricing.filter(item => {
    const matchesSearch = item.item.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedPricing = filteredPricing.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PricingItem[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 px-6 py-6">
        <div className="max-w-xl mx-auto flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Our Price List</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* Search */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500">
              <Search size={20} />
            </div>
            <input 
              type="text"
              placeholder="Search items (e.g. Saree, Jeans)..."
              className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Quick Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
            <button 
              onClick={() => setActiveCategory('All')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all",
                activeCategory === 'All' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button 
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2",
                  activeCategory === cat.name ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                )}
              >
                <cat.icon size={14} />
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Content */}
      <div className="max-w-xl mx-auto px-6 mt-8 space-y-12">
        {Object.entries(groupedPricing).length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
             <Search size={48} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No items found</p>
          </div>
        ) : (
          Object.entries(groupedPricing).map(([category, items]) => {
            const catInfo = categories.find(c => c.name === category) || categories[0];
            return (
              <div key={category} className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl", catInfo.color)}>
                    <catInfo.icon size={20} />
                  </div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">{category}</h2>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-50">
                    {items.map((item) => (
                      <div key={item.id} className="p-5 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                        <div>
                          <p className="text-[13px] font-bold text-slate-900 uppercase tracking-tight">{item.item}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Price starting at</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-emerald-600 tracking-tighter">₹{item.price}</p>
                          <button 
                            onClick={() => window.open(`https://wa.me/919451034909?text=${encodeURIComponent(`Hi, I'm interested in ${item.category}: ${item.item} (₹${item.price})`)}`, '_blank')}
                            className="text-[9px] font-black text-primary-600 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-end gap-1"
                          >
                            Book Now <ChevronRight size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sticky Book Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-40">
        <a 
          href="https://wa.me/919451034909?text=Hello Green Wash Co! I've checked your price list and want to book a pickup."
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-16 bg-[#25D366] text-white rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-[#25D366]/40 active:scale-95 transition-all"
        >
          <MessageCircle size={24} className="fill-current" />
          <span className="text-sm font-black uppercase tracking-widest">Book Free Pickup</span>
        </a>
      </div>
    </div>
  );
};

export default Pricing;
