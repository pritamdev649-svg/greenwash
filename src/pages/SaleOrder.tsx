import React, { useState, useEffect } from 'react';
import { 
  Receipt,
  Plus, 
  Trash2, 
  Save,  
  User, 
  Calendar, 
  Info,
  ChevronDown,
  Printer,
  Share2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '@backend/services/customerService';
import { orderService } from '@backend/services/orderService';
import { PrintReceipt } from '../components/PrintReceipt';


interface SaleRow {
  id: string;
  category: string;
  item_id: string;
  item_name: string;
  description: string;
  qty: number;
  unit: string;
  price: number;
  amount: number;
}

const SaleOrder: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [clothTypes, setClothTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  const [orderNo] = useState(() => Math.floor(100 + Math.random() * 900).toString());
  const [stateOfSupply, setStateOfSupply] = useState('Delhi');

  const [rows, setRows] = useState<SaleRow[]>([
    { id: '1', category: 'Dry Clean', item_id: '', item_name: '', description: '', qty: 1, unit: 'NONE', price: 0, amount: 0 }
  ]);

  const [discount, setDiscount] = useState(0);
  const [isRounding, setIsRounding] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cData, ctData] = await Promise.all([
          customerService.getAllCustomers(),
          orderService.getAllClothTypes()
        ]);
        setCustomers(cData);
        setClothTypes(ctData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddRow = () => {
    const newRow: SaleRow = {
      id: Date.now().toString(),
      category: 'Washing',
      item_id: '',
      item_name: '',
      description: '',
      qty: 1,
      unit: 'NONE',
      price: 0,
      amount: 0
    };
    setRows([...rows, newRow]);
  };

  const updateRow = (id: string, updates: Partial<SaleRow>) => {
    setRows(prev => prev.map(row => {
      if (row.id === id) {
        const updated = { ...row, ...updates };
        updated.amount = updated.qty * updated.price;
        return updated;
      }
      return row;
    }));
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const subtotal = rows.reduce((sum, row) => sum + row.amount, 0);
  const grandTotal = subtotal - discount;

  const handleSave = async () => {
    if (!selectedCustomerId) {
      alert("Please select a customer first");
      return;
    }

    // Filter valid rows
    const validRows = rows.filter(r => r.item_name.trim() !== '');
    if (validRows.length === 0) {
      alert("Please add at least one item to the order");
      return;
    }

    try {
      setLoading(true);
      // Construct items with intelligent price splitting
      const items = validRows.map(r => {
        const isIron = r.category.toLowerCase().includes('iron');
        const isWash = r.category.toLowerCase().includes('wash') || r.category.toLowerCase().includes('clean');
        
        return {
          cloth_type_id: (!r.item_id || r.item_id === 'custom') ? null : r.item_id,
          quantity: r.qty,
          wash_price: (isWash && !isIron) ? r.price : 0,
          iron_price: (isIron && !isWash) ? r.price : 0,
          // Support hybrid or other types by defaulting to wash_price
          ...( (!isWash && !isIron) ? { wash_price: r.price } : {} ),
          ...( (isWash && isIron) ? { wash_price: r.price / 2, iron_price: r.price / 2 } : {} ),
          subtotal: r.amount
        };
      });

      await orderService.createOrder(
        selectedCustomerId, 
        selectedCustomer?.branch_id || null, 
        grandTotal, 
        items
      );
      
      alert("Order Generated Successfully!");
      navigate('/orders');
    } catch (err) {
      console.error(err);
      alert("Failed to save order. Please check if all fields are correct.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && customers.length === 0) {
    return <div className="p-20 text-center animate-pulse">Loading interface...</div>;
  }

  return (
    <>
    <div className="space-y-6 pb-20 print:hidden">
      {/* Internal Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
             <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Receipt size={24} />
             </div>
             Sale Order
          </h2>
          <p className="text-slate-500 font-medium">Generate detailed ledger entries and service bills.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-outline h-11 px-5 gap-2 text-xs font-bold uppercase tracking-wider rounded-xl">
            <Share2 size={16} /> Share
          </button>
          <button 
            onClick={() => window.print()}
            className="btn-outline h-11 px-5 gap-2 text-xs font-bold uppercase tracking-wider rounded-xl"
          >
             <Printer size={16} /> Print
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-6 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Save size={16} /> Save Order
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Top Info Cards */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Party Selection */}
          <div className="lg:col-span-8 card p-6 bg-white shadow-sm border-slate-200">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Party *</label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" size={18} />
                    <select 
                      className="w-full h-11 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all appearance-none"
                      value={selectedCustomerId}
                      onChange={(e) => {
                        const c = customers.find(x => x.id === e.target.value);
                        setSelectedCustomerId(e.target.value);
                        setSelectedCustomer(c);
                      }}
                    >
                      <option value="">Select Customer</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>)}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>
                <div className="space-y-4 pt-2">
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Billing Address</label>
                       <textarea 
                         disabled
                         className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-500 min-h-[80px] resize-none"
                         placeholder="Address auto-loaded..."
                         value={selectedCustomer?.address || ''}
                       />
                    </div>
                </div>
              </div>

              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Phone No</label>
                    <div className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center text-sm font-bold text-slate-600">
                       {selectedCustomer?.mobile || 'N/A'}
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Order Meta */}
          <div className="lg:col-span-4 card p-6 bg-white shadow-sm border-slate-200 space-y-4">
             <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-400 uppercase tracking-tighter text-[10px]">Order No</span>
                <span className="text-slate-900">{orderNo}</span>
             </div>
             <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-400 uppercase tracking-tighter text-[10px]">Order Date</span>
                <div className="relative group">
                  <input 
                    type="date" 
                    className="bg-transparent border-none text-right focus:outline-none cursor-pointer" 
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                  />
                  <Calendar size={14} className="inline ml-2 text-slate-300" />
                </div>
             </div>
             <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-400 uppercase tracking-tighter text-[10px]">Due Date</span>
                <div className="relative group">
                  <input 
                    type="date" 
                    className="bg-transparent border-none text-right focus:outline-none cursor-pointer" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  <Calendar size={14} className="inline ml-2 text-slate-300" />
                </div>
             </div>
             <div className="pt-4 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">State of Supply</label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-lg h-10 px-3 text-xs font-bold focus:ring-0"
                  value={stateOfSupply}
                  onChange={(e) => setStateOfSupply(e.target.value)}
                >
                   <option value="Delhi">Delhi</option>
                   <option value="UP">Uttar Pradesh</option>
                   <option value="Haryana">Haryana</option>
                </select>
             </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="card bg-white shadow-md border-slate-200 overflow-hidden min-h-[400px] flex flex-col">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                       <th className="p-3 text-[10px] font-black text-slate-500 uppercase w-10 text-center">#</th>
                       <th className="p-3 text-[10px] font-black text-slate-500 uppercase w-48">Category</th>
                       <th className="p-3 text-[10px] font-black text-slate-500 uppercase w-64">Item</th>
                       <th className="p-3 text-[10px] font-black text-slate-500 uppercase">Description</th>
                       <th className="p-3 text-[10px] font-black text-slate-500 uppercase w-24 text-center">Qty</th>
                       <th className="p-3 text-[10px] font-black text-slate-500 uppercase w-32 text-center">Unit</th>
                       <th className="p-3 text-[10px] font-black text-slate-500 uppercase w-36 text-right">Price/Unit</th>
                       <th className="p-3 text-[10px] font-black text-slate-500 uppercase w-40 text-right">Amount</th>
                       <th className="p-3 w-10"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {rows.map((row, index) => (
                       <tr key={row.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="p-2 text-center text-xs font-bold text-slate-400">{index + 1}</td>
                          <td className="p-2">
                             <select 
                               className="w-full h-10 px-2 bg-transparent border border-transparent focus:border-emerald-200 focus:bg-white rounded-lg text-xs font-semibold appearance-none"
                               value={row.category}
                               onChange={(e) => updateRow(row.id, { category: e.target.value })}
                             >
                                <option value="ALL">ALL</option>
                                <option value="Carpet Cleaning">Carpet Cleaning</option>
                                <option value="Dry Clean">Dry Clean</option>
                                <option value="Dry Clean with Starch">Dry Clean with Starch</option>
                                <option value="Dye">Dye</option>
                                <option value="Iron">Iron</option>
                                <option value="Premium Laundry">Premium Laundry</option>
                                <option value="Shoe Clen @ Bag Clen">Shoe Clen @ Bag Clen</option>
                                <option value="Starch">Starch</option>
                                <option value="Steam Iron">Steam Iron</option>
                                <option value="Wash & Fold">Wash & Fold</option>
                                <option value="Wash & Iron">Wash & Iron</option>
                             </select>
                          </td>
                          <td className="p-2">
                             <input 
                               list="common-items"
                               className="w-full h-10 px-3 bg-transparent border border-transparent focus:border-emerald-200 focus:bg-white rounded-lg text-xs font-bold"
                               placeholder="Type or select item..."
                               value={row.item_name}
                               onChange={(e) => {
                                  const val = e.target.value;
                                  const item = clothTypes.find(x => x.name === val);
                                  if (item) {
                                    const cat = row.category.toLowerCase();
                                    let price = 0;
                                    if (cat.includes('wash')) price = Number(item.wash_price);
                                    else if (cat.includes('iron')) price = Number(item.iron_price);
                                    else if (cat.includes('clean') || cat.includes('dry')) price = Number(item.wash_price);
                                    else price = Number(item.wash_price) + Number(item.iron_price);
                                    
                                    updateRow(row.id, { item_id: item.id, item_name: item.name, price });
                                  } else {
                                    updateRow(row.id, { item_name: val, item_id: 'custom' });
                                  }
                               }}
                             />
                             <datalist id="common-items">
                                {clothTypes.map(ct => <option key={ct.id} value={ct.name} />)}
                                <option value="Shirt" />
                                <option value="T-Shirt" />
                                <option value="Pant" />
                                <option value="Jeans" />
                                <option value="Kurta" />
                                <option value="Pyjama" />
                                <option value="Saree" />
                                <option value="Blouse" />
                                <option value="Salwar Suit" />
                                <option value="Dupatta" />
                                <option value="Coat" />
                                <option value="Coat-Pant (Suit)" />
                                <option value="Blazer" />
                                <option value="Jacket" />
                                <option value="Sweater" />
                                <option value="Sherwani" />
                                <option value="Lehenga" />
                                <option value="Bridal Wear" />
                                <option value="Bedsheet (Single)" />
                                <option value="Bedsheet (Double)" />
                                <option value="Blanket" />
                                <option value="Quilt (Rajai)" />
                                <option value="Pillow Cover" />
                                <option value="Curtain" />
                                <option value="Sofa Cover" />
                                <option value="Shoes Cleaning" />
                                <option value="Bag Cleaning" />
                                <option value="Carpet / Rug" />
                                <option value="Car Seat Cover" />
                             </datalist>
                          </td>
                          <td className="p-2">
                             <input 
                               placeholder="Note..."
                               className="w-full h-10 px-3 bg-transparent border border-transparent focus:border-emerald-200 focus:bg-white rounded-lg text-xs font-medium"
                               value={row.description}
                               onChange={(e) => updateRow(row.id, { description: e.target.value })}
                             />
                          </td>
                          <td className="p-2">
                             <input 
                               type="number"
                               className="w-full h-10 px-2 bg-transparent border border-transparent focus:border-emerald-200 focus:bg-white rounded-lg text-xs font-black text-center"
                               value={row.qty}
                               onChange={(e) => updateRow(row.id, { qty: parseInt(e.target.value) || 0 })}
                             />
                          </td>
                          <td className="p-2">
                             <select 
                               className="w-full h-10 px-2 bg-transparent border border-transparent focus:border-emerald-200 focus:bg-white rounded-lg text-xs font-semibold text-center appearance-none"
                               value={row.unit}
                               onChange={(e) => updateRow(row.id, { unit: e.target.value })}
                             >
                                <option value="NONE">NONE</option>
                                <option value="PCS">Pieces</option>
                                <option value="KG">Kg</option>
                             </select>
                          </td>
                          <td className="p-2">
                             <div className="flex items-center justify-end gap-1 font-bold text-xs">
                                <span>₹</span>
                                <input 
                                  type="number"
                                  className="w-24 h-10 px-2 bg-transparent border border-transparent focus:border-emerald-200 focus:bg-white rounded-lg text-right focus:outline-none"
                                  value={row.price}
                                  onChange={(e) => updateRow(row.id, { price: parseFloat(e.target.value) || 0 })}
                                />
                             </div>
                          </td>
                          <td className="p-2 text-right text-sm font-black text-slate-900 pr-4">
                             ₹{row.amount.toLocaleString()}
                          </td>
                          <td className="p-2 text-center">
                             <button 
                               onClick={() => removeRow(row.id)}
                               className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                             >
                                <Trash2 size={16} />
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
              <button 
                onClick={handleAddRow}
                className="btn-outline h-10 px-5 gap-2 text-xs font-extrabold text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              >
                <Plus size={18} /> ADD ROW
              </button>
              <div className="flex items-center gap-12 pr-12">
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL QUANTITY</span>
                    <span className="text-xl font-black text-slate-900">{rows.reduce((s, r) => s + r.qty, 0)}</span>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SUB TOTAL</span>
                    <span className="text-2xl font-black text-emerald-600">₹{subtotal.toLocaleString()}</span>
                 </div>
              </div>
           </div>

           {/* Footer Section (Discounts, etc) */}
           <div className="grid lg:grid-cols-2 border-t border-slate-100">
              <div className="p-10 border-r border-slate-100 space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                       <Info size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-600">Additional Remarks</span>
                 </div>
                 <textarea 
                   className="w-full h-24 p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium focus:bg-white transition-all resize-none"
                   placeholder="Enter payment notes, special instructions, or terms here..."
                 />
              </div>

              <div className="p-10 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-tight">Discount</span>
                    <div className="flex items-center gap-3">
                       <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                          <input 
                            type="number" 
                            className="w-32 h-10 pl-8 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-right text-xs font-bold"
                            value={discount}
                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                          />
                       </div>
                    </div>
                 </div>

                 <div className="flex justify-between items-center py-4 border-t border-dashed border-slate-200">
                    <div className="flex items-center gap-2">
                       <input 
                         type="checkbox" 
                         className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
                         checked={isRounding}
                         onChange={(e) => setIsRounding(e.target.checked)}
                       />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Round Off</span>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-4xl font-black text-slate-900 tracking-tighter">₹{grandTotal.toLocaleString()}</span>
                       <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1">Payable Amount</span>
                    </div>
                 </div>
                 
                 <div className="pt-6">
                    <button 
                      onClick={handleSave}
                      className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-xl transition-all active:scale-[0.98] font-black text-lg uppercase tracking-tight"
                    >
                       Save Order
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
    
    <PrintReceipt 
      orderData={{
        orderNo,
        date: orderDate,
        dueDate,
        customerName: selectedCustomer?.name || '',
        customerAddress: selectedCustomer?.address || '',
        customerPhone: selectedCustomer?.mobile || '',
        items: rows.filter(r => r.item_name.trim() !== '').map((r) => ({
          id: r.id,
          name: r.item_name,
          category: r.category,
          qty: r.qty,
          price: r.price,
          amount: r.amount
        })),
        subTotal: subtotal,
        discount,
        total: grandTotal,
        advance: 0,
        balance: grandTotal
      }} 
    />
    </>
  );
};

export default SaleOrder;
