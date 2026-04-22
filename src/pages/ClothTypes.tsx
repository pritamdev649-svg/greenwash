import React, { useEffect, useState } from 'react';
import { Shirt, Trash2, Edit2, Plus, Check } from 'lucide-react';
import { orderService } from '@backend/services/orderService';

interface ClothType {
  id: string;
  name: string;
  category_id: string;
  categories?: { name: string };
  wash_price: number;
  iron_price: number;
  dry_clean_price: number;
}

const ClothTypes: React.FC = () => {
  const [items, setItems] = useState<ClothType[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', category_id: '', wash_price: 0, iron_price: 0, dry_clean_price: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itData, catData] = await Promise.all([
        orderService.getAllClothTypes(),
        orderService.getAllCategories()
      ]);
      setItems(itData as any);
      setCategories(catData as any);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
         await orderService.updateClothType(editingId, formData);
      } else {
         await orderService.addClothType(formData);
      }
      setFormData({ name: '', category_id: '', wash_price: 0, iron_price: 0, dry_clean_price: 0 });
      setEditingId(null);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Error saving cloth type: " + err.message);
    }
  };

  const handleEdit = (item: ClothType) => {
    setEditingId(item.id);
    setFormData({ 
      name: item.name, 
      category_id: item.category_id || '',
      wash_price: item.wash_price, 
      iron_price: item.iron_price, 
      dry_clean_price: item.dry_clean_price || 0 
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remove this cloth type?')) {
      try {
        await orderService.deleteClothType(id);
        await fetchData();
      } catch (err) {
        alert("Error deleting item");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary-600">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Shirt size={28} />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Cloth Pricing Matrix</h2>
          </div>
          <p className="text-slate-500 font-medium">Standardize your service charges across all branches.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-12">
        {/* Form Column */}
        <div className="lg:col-span-2">
           <div className="card p-8 border-primary-100 bg-slate-50/20">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                 <div className="w-1.5 h-6 bg-primary-500 rounded-full" />
                 <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">{editingId ? 'Modify Rate Card' : 'Define New Service'}</h3>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Clothing Item Name</label>
                  <input
                    required
                    className="input h-12 bg-white font-semibold"
                    placeholder="e.g. Cotton Shirt"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Service Category</label>
                  <select
                    className="input h-12 bg-white font-semibold appearance-none"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">No Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5 single-line">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                       Wash
                    </label>
                    <div className="relative group">
                       <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-primary-500 text-xs text-balance">₹</span>
                       <input
                         type="number"
                         required
                         className="input h-11 pl-6 pr-1 bg-white font-bold text-xs"
                         value={formData.wash_price}
                         onChange={(e) => setFormData({ ...formData, wash_price: parseFloat(e.target.value) })}
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5 single-line">
                       <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                       Iron
                    </label>
                    <div className="relative group">
                       <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-primary-500 text-xs">₹</span>
                       <input
                         type="number"
                         required
                         className="input h-11 pl-6 pr-1 bg-white font-bold text-xs"
                         value={formData.iron_price}
                         onChange={(e) => setFormData({ ...formData, iron_price: parseFloat(e.target.value) })}
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5 single-line">
                       <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                       Dry
                    </label>
                    <div className="relative group">
                       <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-primary-500 text-xs">₹</span>
                       <input
                         type="number"
                         required
                         className="input h-11 pl-6 pr-1 bg-white font-bold text-xs"
                         value={formData.dry_clean_price}
                         onChange={(e) => setFormData({ ...formData, dry_clean_price: parseFloat(e.target.value) })}
                       />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  {editingId && (
                    <button 
                      type="button" 
                      onClick={() => { setEditingId(null); setFormData({ name: '', category_id: '', wash_price: 0, iron_price: 0, dry_clean_price: 0 }); }} 
                      className="flex-1 btn-outline h-12 rounded-xl text-xs font-bold uppercase tracking-tight"
                    >
                      Discard
                    </button>
                  )}
                  <button type="submit" className="flex-[2] btn-primary h-12 rounded-xl border-2 border-primary-600 active:scale-[0.98] transition-all text-xs font-bold uppercase tracking-tight flex items-center justify-center gap-2">
                    {editingId ? <Check size={16} /> : <Plus size={16} />}
                    <span>{editingId ? 'Commit' : 'Add to Catalog'}</span>
                  </button>
                </div>
              </form>
           </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-3 space-y-6">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                 <h3 className="font-bold text-slate-800">Product List</h3>
                 <span className="bg-slate-100 text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded-full">{items.length} ITEMS</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 noscrollbar">
                 <button 
                  onClick={() => setSelectedCategoryId('all')}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${selectedCategoryId === 'all' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                 >
                   All
                 </button>
                 {categories.map(cat => (
                   <button 
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap ${selectedCategoryId === cat.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                   >
                     {cat.name}
                   </button>
                 ))}
              </div>
           </div>

           <div className="grid gap-4">
              {loading ? (
                <div className="p-20 text-center"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent animate-spin rounded-full mx-auto" /></div>
              ) : items.filter(i => selectedCategoryId === 'all' || i.category_id === selectedCategoryId).length === 0 ? (
                <div className="p-20 text-center card bg-slate-50/50 border-dashed border-2">
                   <p className="text-slate-400 font-medium">No items found in this section.</p>
                </div>
              ) : items.filter(i => selectedCategoryId === 'all' || i.category_id === selectedCategoryId).map((item) => (
                <div key={item.id} className="group card p-5 flex items-center justify-between hover:border-primary-100 transition-all duration-300">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center font-extrabold group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors duration-300">
                          {item.name[0].toUpperCase()}
                       </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <p className="font-bold text-slate-900 group-hover:text-primary-700 transition-colors uppercase tracking-tight">{item.name}</p>
                             {item.categories?.name && (
                               <span className="bg-primary-50 text-[10px] font-bold text-primary-600 px-1.5 py-0.5 rounded tracking-widest uppercase">
                                 {item.categories.name}
                               </span>
                             )}
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                             <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Wash:</span>
                                <span className="text-xs font-extrabold text-slate-700">₹{item.wash_price}</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Iron:</span>
                                <span className="text-xs font-extrabold text-slate-700">₹{item.iron_price}</span>
                             </div>
                             <div className="flex items-center gap-1.5 border-l border-slate-100 pl-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Dry Clean:</span>
                                <span className="text-xs font-extrabold text-primary-600">₹{item.dry_clean_price || 0}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-1">
                       <button 
                          onClick={() => handleEdit(item)} 
                          className="p-2.5 rounded-xl text-primary-600 hover:bg-primary-50 transition-colors"
                          title="Edit Pricing"
                       >
                          <Edit2 size={16} />
                       </button>
                       <button 
                          onClick={() => handleDelete(item.id)} 
                          className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Delete Item"
                       >
                          <Trash2 size={16} />
                       </button>
                    </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ClothTypes;
