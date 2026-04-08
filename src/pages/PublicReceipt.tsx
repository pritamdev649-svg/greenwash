import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '@backend/services/orderService';
import { PrintReceipt } from '../components/PrintReceipt';
import { ChevronLeft, Printer } from 'lucide-react';

const PublicReceipt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const data = await orderService.getOrderById(id);
        setOrder(data);
      } catch (err) {
        console.error(err);
        setError("Invoice not found or expired.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin transition-all" />
        <p className="mt-4 text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Fetching Digital Receipt...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6">
          <ChevronLeft size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Invoice Not Found</h1>
        <p className="text-slate-500 mb-8 max-w-xs">{error || "The link might be invalid or the order has been removed."}</p>
        <Link to="/" className="h-12 px-8 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center transition-all active:scale-95">
          Go to Homepage
        </Link>
      </div>
    );
  }

  const pData = {
    orderNo: order.order_number ? `GWC${order.order_number}` : 'GWC' + order.id.slice(0, 4).toUpperCase(),
    date: new Date(order.created_at).toLocaleDateString('en-GB'),
    dueDate: order.due_date 
      ? order.due_date.split('-').reverse().join('/') 
      : new Date(order.created_at).toLocaleDateString('en-GB'),
    customerName: order.customers?.name || 'Customer',
    customerAddress: order.customers?.address || '',
    customerPhone: order.customers?.mobile || '',
    items: order.order_items?.map((item: any) => ({
      id: item.id,
      name: item.custom_item_name || item.cloth_types?.name || 'Custom Item',
      category: item.wash_price > 0 && item.iron_price > 0 ? 'Wash & Iron' : item.wash_price > 0 ? 'Wash' : 'Iron',
      qty: item.quantity,
      price: (item.wash_price || 0) + (item.iron_price || 0),
      amount: item.subtotal
    })) || [],
    subTotal: (order.total_amount || 0) + (order.discount_amount || 0),
    discount: order.discount_amount || 0,
    total: order.total_amount,
    advance: order.advance_amount || 0,
    balance: order.balance_amount || 0
  };

  return (
    <div className="min-h-screen bg-slate-100/50 flex flex-col items-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden mb-8 border border-slate-100 p-4 sm:p-12 relative">
        <div className="flex justify-between items-center mb-10 print:hidden border-b border-slate-50 pb-8">
           <div className="flex items-center gap-3">
              <Link to="/orders" className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                 <ChevronLeft size={20} />
              </Link>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Receipt Preview</h2>
           </div>
           <div className="flex gap-2">
              <button onClick={() => window.print()} className="h-10 px-4 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-100 transition-all">
                 <Printer size={16} /> Print / PDF
              </button>
           </div>
        </div>

        {/* The Receipt Component */}
        <div className="print-visible shadow-inner rounded-xl">
           <style>{`
             @media screen {
               .print-visible .print\\:block {
                 display: block !important;
               }
               .print-visible .hidden.print\\:block {
                 display: block !important;
                 padding: 0;
                 box-shadow: none;
               }
             }
           `}</style>
           <PrintReceipt orderData={pData} />
        </div>
      </div>

      <div className="text-center print:hidden">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Green Wash Co. Digital Portal</p>
         <p className="text-[10px] text-slate-300 font-medium mt-1 uppercase tracking-tight">V1.0 • Secure Ledger Technology</p>
      </div>
    </div>
  );
};

export default PublicReceipt;
