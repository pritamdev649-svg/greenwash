import React, { useEffect, useState } from 'react';
import { 
  LayoutGrid, 
  Trash2, 
  Plus, 
  ChevronRight, 
  Shirt, 
  Edit2,
  X,
  AlertCircle
} from 'lucide-react';
import { orderService } from '@backend/services/orderService';
import { cn } from '../lib/utils';

interface Category {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  category_id: string;
  wash_price: number;
  iron_price: number;
  dry_clean_price: number;
}

const Categories: React.FC = () => {
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Forms State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
  const [itemForm, setItemForm] = useState({ 
    name: '', 
    price: 0 
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    try {
      const [catData, itemData] = await Promise.all([
        orderService.getAllCategories(),
        orderService.getAllClothTypes()
      ]);
      setCategories(catData as any);
      setItems(itemData as any);
      
      // Select first category by default if none selected
      if (!selectedCategoryId && catData.length > 0) {
        setSelectedCategoryId(catData[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers - Categories
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const newCat = await orderService.addCategory(newCategoryName);
      setNewCategoryName('');
      setIsAddingCategory(false);
      await fetchData();
      setSelectedCategoryId(newCat.id);
    } catch (err: any) {
       console.error(err);
       const msg = err.message || "Unknown Error";
       const hint = err.hint || "";
       alert(`Error adding category: ${msg}\n${hint}\n\nIf this says 'relation "categories" does not exist', you need to run the SQL migration in Supabase.`);
    }
  };

  const handleAddSuggested = async (catName: string) => {
    try {
      const newCat = await orderService.addCategory(catName);
      await fetchData();
      setSelectedCategoryId(newCat.id);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Unknown Error";
      const hint = err.hint || "";
      alert(`Error adding category: ${msg}\n${hint}\n\nIf this says 'relation "categories" does not exist', you need to run the SQL migration in Supabase.`);
    }
  };

  const deleteCategory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this category and all items inside?")) return;
    try {
      await orderService.deleteCategory(id);
      if (selectedCategoryId === id) setSelectedCategoryId(null);
      await fetchData();
    } catch (err) {
      alert("Error deleting category");
    }
  };

  // Handlers - Items
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId) return;
    
    try {
      const payload = { 
        name: itemForm.name,
        wash_price: itemForm.price, // Map to wash_price as standard column
        iron_price: itemForm.price,
        dry_clean_price: itemForm.price,
        category_id: selectedCategoryId 
      };
      if (editingItemId) {
        await orderService.updateClothType(editingItemId, payload);
      } else {
        await orderService.addClothType(payload);
      }
      
      setItemForm({ name: '', price: 0 });
      setEditingItemId(null);
      setIsItemFormOpen(false);
      await fetchData();
    } catch (err) {
      alert("Error saving item");
    }
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm("Remove this item?")) return;
    try {
      await orderService.deleteClothType(id);
      await fetchData();
    } catch (err) {
      alert("Error deleting item");
    }
  };

  const startEditItem = (item: Item) => {
    setEditingItemId(item.id);
    setItemForm({
      name: item.name,
      price: item.wash_price || 0
    });
    setIsItemFormOpen(true);
  };

  // Filtered Data
  const filteredItems = items.filter(i => i.category_id === selectedCategoryId);
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const suggestedDefaults = [
    "WASH & FOLD", 
    "WASH & IRON", 
    "IRONING ONLY", 
    "STEAM IRON", 
    "DRY CLEAN", 
    "PREMIUM LAUNDRY", 
    "PETROL WASH", 
    "STARCHING", 
    "SAREE POLISH", 
    "SHOE CLEANING", 
    "BAG CLEANING", 
    "CARPET CLEANING", 
    "BLANKET CLEAN", 
    "DYEING (DYE)"
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-600/20">
            <LayoutGrid size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Service Catalog</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Manage categories and products</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsAddingCategory(!isAddingCategory)}
          className={cn(
            "btn h-11 px-6 rounded-xl flex items-center gap-2 text-xs font-bold uppercase transition-all shadow-lg",
            isAddingCategory ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-primary-600 text-white shadow-primary-600/20 active:scale-95"
          )}
        >
          {isAddingCategory ? <X size={18} /> : <Plus size={18} />}
          <span>{isAddingCategory ? 'Close' : 'Add Category'}</span>
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Master: Category List */}
        <div className="w-80 flex flex-col gap-4">
          {isAddingCategory && (
            <div className="card p-4 border-primary-500 bg-primary-50/50 animate-slide-up">
              <form onSubmit={handleAddCategory} className="space-y-3">
                <input 
                  autoFocus
                  required
                  placeholder="CATEGORY NAME..."
                  className="w-full h-10 px-4 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase focus:ring-2 focus:ring-primary-500/20"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <button type="submit" className="w-full h-10 bg-primary-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                  Create Category
                </button>
              </form>
            </div>
          )}

          <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-2 scrollbar-hide">
            {categories.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl opacity-60">
                <AlertCircle size={32} className="text-slate-300 mb-3" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed"> No categories existing.<br/>Add your service categories first. </p>
                <div className="mt-6 flex flex-wrap justify-center gap-1.5">
                   {suggestedDefaults.filter(s => !categories.find(c => c.name.toLowerCase() === s.toLowerCase())).slice(0, 6).map(s => (
                     <button key={s} onClick={() => handleAddSuggested(s)} className="px-2 py-1 bg-white border border-slate-200 rounded text-[9px] font-black text-slate-500 uppercase hover:bg-primary-50 hover:text-primary-600 transition-colors">
                        + {s}
                     </button>
                   ))}
                </div>
              </div>
            ) : categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={cn(
                  "group flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border",
                  selectedCategoryId === cat.id 
                    ? "bg-white border-primary-100 shadow-xl shadow-primary-600/5 ring-1 ring-primary-500/20" 
                    : "bg-slate-50/30 border-transparent hover:bg-slate-50 hover:border-slate-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                    selectedCategoryId === cat.id ? "bg-primary-600 text-white" : "bg-white text-slate-400 group-hover:text-primary-600"
                  )}>
                    <Shirt size={14} />
                  </div>
                  <div className="text-left">
                    <p className={cn(
                      "text-xs font-black uppercase tracking-tight",
                      selectedCategoryId === cat.id ? "text-slate-900" : "text-slate-600 group-hover:text-primary-700"
                    )}>{cat.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      {items.filter(i => i.category_id === cat.id).length} Products
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => deleteCategory(cat.id, e)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                  <ChevronRight size={14} className={cn(
                    "transition-transform",
                    selectedCategoryId === cat.id ? "text-primary-500 translate-x-1" : "text-slate-300"
                  )} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail: Product List */}
        <div className="flex-1 flex flex-col card overflow-hidden border-slate-100/80 shadow-2xl shadow-slate-200/50">
          {selectedCategory ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedCategory.name}</h3>
                    <span className="bg-primary-50 text-[10px] font-black text-primary-600 px-2 py-0.5 rounded uppercase tracking-widest">
                       Category
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Listing items and pricing for this service section</p>
                </div>
                
                <button 
                  onClick={() => {
                    setEditingItemId(null);
                    setItemForm({ name: '', price: 0 });
                    setIsItemFormOpen(true);
                  }}
                  className="btn-primary h-11 px-6 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-600/20 active:scale-95 transition-all"
                >
                  <Plus size={16} />
                  <span>New Product</span>
                </button>
              </div>

              {/* Form Overlay */}
              {isItemFormOpen && (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-white/60 backdrop-blur-md animate-fade-in">
                  <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 transform animate-slide-up">
                    <div className="flex items-center justify-between mb-8">
                       <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">{editingItemId ? 'Update Information' : 'Registry New Product'}</h4>
                       <button onClick={() => setIsItemFormOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><X size={20} /></button>
                    </div>
                    
                    <form onSubmit={handleItemSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Product Designation</label>
                        <input 
                          required
                          className="input h-11 bg-slate-50 font-bold"
                          placeholder="E.G. COTTON SHIRT"
                          value={itemForm.name}
                          onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Standard Rate (₹)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                          <input 
                            required
                            type="number"
                            className="input h-11 pl-10 bg-slate-50 font-black text-xl"
                            placeholder="0.00"
                            value={itemForm.price}
                            onChange={(e) => setItemForm({...itemForm, price: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                        <p className="text-[9px] font-bold text-primary-500 uppercase tracking-widest ml-1">This rate applies to this specific service item</p>
                      </div>

                      <button type="submit" className="w-full btn-primary h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary-600/20 active:scale-[0.98] transition-all">
                        {editingItemId ? 'Commit Changes' : 'Entry in Catalog'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                {filteredItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-40">
                     <Shirt size={48} className="text-slate-200 mb-4" />
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No products in this category yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredItems.map(item => (
                      <div key={item.id} className="group p-4 bg-slate-50/50 hover:bg-white rounded-2xl border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:text-primary-600 transition-colors">
                              {item.name[0]}
                           </div>
                           <div>
                              <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.name}</h5>
                              <div className="flex gap-4 mt-1">
                                 <div className="flex items-center gap-1.5 font-bold">
                                    <span className="text-[8px] text-slate-400 uppercase tracking-widest">Fixed Rate:</span>
                                    <span className="text-sm text-primary-600">₹{item.wash_price}</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-1 transition-all">
                           <button 
                            onClick={() => startEditItem(item)}
                            className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                            title="Edit Product"
                           >
                            <Edit2 size={12} />
                           </button>
                           <button 
                            onClick={() => deleteItem(item.id)}
                            className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                            title="Delete Product"
                           >
                            <Trash2 size={12} />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/20">
                <div className="w-20 h-20 bg-white border-2 border-dashed border-slate-200 rounded-[30%] flex items-center justify-center text-slate-200 mb-6 animate-pulse">
                   <LayoutGrid size={40} />
                </div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Select a Category</h3>
                <p className="text-[10px] font-bold text-slate-300 uppercase mt-2">To view and manage item catalog</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categories;
