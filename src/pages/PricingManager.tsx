import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Search, Save, X, Edit2, QrCode as QrIcon, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { pricingService } from '../../Backend/src/services/pricingService';
import type { PricingItem } from '../../Backend/src/services/pricingService';
import { cn } from '../lib/utils';
import { PriceListPoster } from '../components/PriceListPoster';
import { useAuth } from '../contexts/AuthContext';

const categories = [
  'Premium Laundry',
  'Dry Cleaning',
  'Steam Iron',
  'Starch',
  'Shoe Cleaning'
];

const PricingManager: React.FC = () => {
  const { vendorId } = useAuth();
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    category: categories[0],
    item: '',
    price: ''
  });

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const data = await pricingService.getAllPricing(vendorId);
      setPricing(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, [vendorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item || !form.price) return;

    try {
      if (editingId) {
        await pricingService.updatePricingItem(editingId, form);
      } else {
        await pricingService.addPricingItem({ ...form, vendor_id: vendorId });
      }
      setForm({ category: categories[0], item: '', price: '' });
      setIsAdding(false);
      setEditingId(null);
      fetchPricing();
    } catch (err) {
      alert("Error saving item. Make sure the 'pricing' table exists in Supabase.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await pricingService.deletePricingItem(id);
      fetchPricing();
    } catch (err) {
      alert("Error deleting item");
    }
  };

  const startEdit = (item: PricingItem) => {
    setForm({ category: item.category, item: item.item, price: item.price });
    setEditingId(item.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredPricing = pricing.filter(item => 
    item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Rate List Manager</h2>
            <p className="text-slate-500 mt-1 font-medium italic">Manage service prices displayed on the QR-scan page.</p>
          </div>
          
          {/* Quick QR View */}
          <div className="hidden sm:flex items-center gap-3 bg-white p-2 pr-4 rounded-2xl border border-slate-100">
            <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100 relative group/qr">
              <QRCodeSVG 
                id="pricing-qr-code"
                value={`${window.location.origin}/pricing`}
                size={40}
                level="H"
              />
              <button 
                onClick={() => {
                  const svg = document.getElementById('pricing-qr-code');
                  if (!svg) return;
                  const svgData = new XMLSerializer().serializeToString(svg);
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const img = new Image();
                  img.onload = () => {
                    canvas.width = 500;
                    canvas.height = 500;
                    if (ctx) {
                      ctx.fillStyle = 'white';
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                      ctx.drawImage(img, 50, 50, 400, 400);
                      const pngFile = canvas.toDataURL('image/png');
                      const downloadLink = document.createElement('a');
                      downloadLink.download = 'greenwash-pricing-qr.png';
                      downloadLink.href = pngFile;
                      downloadLink.click();
                    }
                  };
                  img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                }}
                className="absolute inset-0 bg-primary-600/90 text-white opacity-0 group-hover/qr:opacity-100 transition-opacity rounded-xl flex items-center justify-center"
                title="Download Large QR"
              >
                <Download size={16} />
              </button>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Customer QR</p>
              <div className="flex items-center gap-2">
                <a 
                  href="/pricing" 
                  target="_blank" 
                  className="text-[10px] font-black text-primary-600 uppercase tracking-tight hover:underline"
                >
                  View Page
                </a>
                <span className="text-slate-300">•</span>
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/pricing`;
                    navigator.clipboard.writeText(url);
                    alert("Link copied to clipboard!");
                  }}
                  className="text-[10px] font-black text-slate-400 uppercase tracking-tight hover:text-primary-600"
                >
                  Copy Link
                </button>
              </div>
            </div>
            
            {/* Print Poster Button */}
            <div className="ml-4 border-l border-slate-100 pl-4">
              <button 
                onClick={() => window.print()}
                className="h-10 px-4 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <QrIcon size={14} />
                Print Poster
              </button>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => {
            if (isAdding) {
              setEditingId(null);
              setForm({ category: categories[0], item: '', price: '' });
            }
            setIsAdding(!isAdding);
          }}
          className={cn(
            "h-12 px-8 rounded-2xl flex items-center gap-3 text-sm font-black uppercase tracking-widest transition-all active:scale-95",
            isAdding ? "bg-rose-50 text-rose-600" : "bg-primary-600 text-white"
          )}
        >
          {isAdding ? <X size={20} /> : <Plus size={20} />}
          <span>{isAdding ? 'Cancel' : 'Add New Rate'}</span>
        </button>
      </div>

      {isAdding && (
        <div className="card p-8 bg-white border-primary-500 animate-slide-up max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              {editingId ? <Edit2 className="text-primary-600" /> : <Plus className="text-primary-600" />}
              {editingId ? 'Edit Rate' : 'New Rate Entry'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Category</label>
                <select 
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold"
                  value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value})}
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Item Name</label>
                <input 
                  required
                  placeholder="E.G. JEANS, SAREE, ETC."
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold"
                  value={form.item}
                  onChange={(e) => setForm({...form, item: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Price / Rate</label>
                <input 
                  required
                  placeholder="E.G. 49, 39/79/-, ETC."
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold"
                  value={form.price}
                  onChange={(e) => setForm({...form, price: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full h-14 bg-primary-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Save size={18} />
              <span>{editingId ? 'Update Rate' : 'Save Rate Entry'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Pricing List Table */}
      <div className="space-y-4">
        <div className="relative group max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300">
            <Search size={18} />
          </div>
          <input 
            type="text"
            placeholder="Search items..."
            className="w-full h-12 pl-10 pr-4 bg-white border border-slate-100 rounded-xl text-sm font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="w-8 h-8 border-4 border-slate-100 border-t-primary-500 rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredPricing.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No rates found</p>
                  </td>
                </tr>
              ) : (
                filteredPricing.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-tight">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 uppercase tracking-tight">{item.item}</td>
                    <td className="px-6 py-4 text-sm font-black text-primary-600">₹{item.price}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => startEdit(item)}
                        className="p-2 text-indigo-400 hover:text-indigo-600 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-rose-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Hidden Poster for Printing */}
      <PriceListPoster />
    </div>
  );
};

export default PricingManager;
