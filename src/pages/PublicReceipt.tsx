import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '@backend/services/orderService';
import { PrintReceipt } from '../components/PrintReceipt';
import { ChevronLeft } from 'lucide-react';

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

  // --- AUTO-TRIGGER PDF/PRINT FOR PROFESSIONAL EXPERIENCE ---
  useEffect(() => {
    if (order && !loading) {
      const timer = setTimeout(() => {
        window.print();
      }, 1500); // 1.5s delay to ensure high-quality rendering
      return () => clearTimeout(timer);
    }
  }, [order, loading]);

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
    <div className="min-h-screen bg-white flex flex-col items-center p-0">
      <div className="w-full max-w-4xl p-0 sm:p-4 text-black">
        {/* The Receipt Component is forced visible here */}
        <style>{`
          @media screen {
            .receipt-container .print\\:block {
              display: block !important;
            }
            .receipt-container .hidden.print\\:block {
              display: block !important;
              padding: 0;
              box-shadow: none;
            }
          }
        `}</style>
        <div className="receipt-container">
          <PrintReceipt orderData={pData} />
        </div>
      </div>
    </div>
  );
};

export default PublicReceipt;
