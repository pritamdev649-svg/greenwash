import { useState, useEffect } from 'react';
import { 
  Plus, 
  Printer, 
  Trash2, 
  Clock, 
  CheckCircle, 
  MessageCircle,
  TrendingUp,
  Package,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import { orderService } from '@backend/services/orderService';
import { notificationService } from '@backend/services/notificationService';
import { OrderEntryForm } from '../components/OrderEntryForm';
import { PrintReceipt } from '../components/PrintReceipt';
import type { PrintReceiptProps } from '../components/PrintReceipt';
import { cn } from '../lib/utils';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm] = useState('');
  const [statusFilter] = useState('all');
  const [printingOrderData, setPrintingOrderData] = useState<PrintReceiptProps['orderData'] | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAllOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSuccess = () => {
    setIsModalOpen(false);
    fetchData();
  };

  const togglePaymentStatus = async (order: any) => {
    const nextStatus = order.payment_status === 'paid' ? 'pending' : 'paid';
    try {
      setLoading(true);
      await orderService.updatePaymentStatus(order.id, nextStatus);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  const advanceOrderStatus = async (order: any) => {
    const phases = ['Pending', 'Processing', 'Washing', 'Ironing', 'Ready', 'Delivered'];
    const currentIndex = phases.indexOf(order.order_status || 'Pending');
    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1];
      try {
        setLoading(true);
        await orderService.updateOrderStatus(order.id, nextPhase);
        
        // --- NEW: AUTOMATED 'READY' NOTIFICATION ---
        if (nextPhase === 'Ready') {
          try {
            const branchName = order.branches?.name || 'our branch';
            const orderRef = order.order_number ? `GWC${order.order_number}` : 'GWC' + order.id.slice(0, 4).toUpperCase();
            const totalAmount = Number(order.total_amount).toLocaleString();
            const balanceAmount = (order.balance_amount || 0).toLocaleString();
            // const receiptUrl = `${window.location.origin}/receipt/${order.id}`;

            const readyMsg = `Greetings from Green Wash Co.\n` +
              `We are pleased to have you as a valuable customer. Your laundry order ${orderRef} is cleaned and ready for pickup at our ${branchName}!\n\n` +
              `Invoice No:-${orderRef}\n` +
              `Total Amount: ₹${totalAmount}\n` +
              `Balance: ₹${balanceAmount}\n\n` +
              // `View Receipt: ${receiptUrl}\n\n` +
              `Please visit us during business hours. Thank you! ✨`;
            
            await notificationService.sendAutomatedWhatsApp(order.customers?.mobile || '', readyMsg);
          } catch (waErr) {
            console.error("Automated 'Ready' message failed.", waErr);
          }
        }
        // ------------------------------------------

        fetchData();
      } catch (err) {
        console.error(err);
        alert("Failed to advance order status.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleWhatsAppShare = (order: any) => {
    const orderRef = order.order_number ? `GWC${order.order_number}` : 'GWC' + order.id.slice(0, 4).toUpperCase();
    const mobile = order.customers?.mobile;
    const totalAmount = Number(order.total_amount).toLocaleString();
    const balanceAmount = (order.balance_amount || 0).toLocaleString();
    // const receiptUrl = `${window.location.origin}/receipt/${order.id}`;

    if (!mobile) return alert("System Error: Customer mobile contact not found.");

    const message = `Greetings from Green Wash Co.\n` +
      `We are pleased to have you as a valuable customer. Please find the details of your transaction.\n` +
      `Invoice No:-${orderRef}\n\n` +
      `Sale Order :\n` +
      `Invoice Amount: ₹${totalAmount}\n` +
      `Balance: ₹${balanceAmount}\n\n` +
      // `View / Download Receipt: ${receiptUrl}\n\n` +
      `Thanks for doing business with us.\n` +
      `Regards,\n` +
      `Green Wash Co.`;

    const cleanedMobile = mobile.replace(/\D/g, '');
    const phone = cleanedMobile.startsWith('91') ? cleanedMobile : '91' + cleanedMobile;
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("ARE YOU ABSOLUTELY SURE? THIS RECORD WILL BE PERMANENTLY DELETED FROM LEDGER.")) return;
    try {
      setLoading(true);
      await orderService.deleteOrder(orderId);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("ERROR: System encountered resistance while deleting record.");
    } finally {
      setLoading(false);
    }
  };

  const handleCollectBalance = async (orderId: string) => {
    if (!window.confirm("CONFIRM FINAL BALANCE COLLECTION? This will mark the order as 'Paid' and reset the remaining balance to zero.")) return;
    try {
      setLoading(true);
      await orderService.collectBalance(orderId);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("FAILED to update balance.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintOrder = async (orderId: string) => {
    try {
      setLoading(true);
      const detailedOrder = await orderService.getOrderById(orderId);
      
      const pData: PrintReceiptProps['orderData'] = {
        orderNo: detailedOrder.order_number ? `GWC${detailedOrder.order_number}` : 'GWC' + detailedOrder.id.slice(0, 4).toUpperCase(),
        date: new Date(detailedOrder.created_at).toLocaleDateString('en-GB'),
        dueDate: detailedOrder.due_date 
          ? detailedOrder.due_date.split('-').reverse().join('/') 
          : new Date(detailedOrder.created_at).toLocaleDateString('en-GB'),
        customerName: detailedOrder.customers?.name || 'Customer',
        customerAddress: detailedOrder.customers?.address || '',
        customerPhone: detailedOrder.customers?.mobile || '',
        items: detailedOrder.order_items?.map((item: any) => ({
          id: item.id,
          name: item.custom_item_name || item.cloth_types?.name || 'Custom Item',
          category: item.wash_price > 0 && item.iron_price > 0 ? 'Wash & Iron' : item.wash_price > 0 ? 'Wash' : 'Iron',
          qty: item.quantity,
          price: (item.wash_price || 0) + (item.iron_price || 0),
          amount: item.subtotal
        })) || [],
        subTotal: (detailedOrder.total_amount || 0) + (detailedOrder.discount_amount || 0),
        discount: detailedOrder.discount_amount || 0,
        total: detailedOrder.total_amount,
        advance: detailedOrder.advance_amount || 0,
        balance: detailedOrder.balance_amount || 0
      };

      setPrintingOrderData(pData);
      setTimeout(() => {
        window.print();
        setPrintingOrderData(null);
      }, 500);
    } catch (err) {
      console.error(err);
      alert("Failed to load order details for print.");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customers?.mobile?.includes(searchTerm);
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && o.order_status === statusFilter;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = [
    { label: 'Active Orders', value: orders.filter(o => o.order_status !== 'Delivered').length, icon: Package, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: "Today's Sales", value: `₹${orders.filter(o => new Date(o.created_at) >= today).reduce((sum, o) => sum + Number(o.total_amount), 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Outstanding', value: `₹${orders.reduce((sum, o) => sum + Number(o.balance_amount || 0), 0).toLocaleString()}`, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Print View Wrapper */}
      {printingOrderData && (
        <div className="printable-area">
           <PrintReceipt orderData={printingOrderData} />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:hidden">
        <div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Order Ledger
              <span className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full uppercase tracking-widest font-extrabold">Live</span>
           </h1>
           <p className="text-slate-500 font-medium mt-1">Manage, Track, and Fulfill laundry transactions.</p>
        </div>
        <button 
           onClick={() => setIsModalOpen(true)}
           className="h-14 px-8 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-primary-600/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
        >
           <Plus size={20} className="stroke-[3]" />
           New Entry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
         {stats.map((s, i) => (
           <div key={i} className="card p-6 border-slate-200 flex items-center gap-5 hover:border-primary-200 transition-colors group">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform", s.bg, s.color)}>
                 <s.icon size={28} />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{s.label}</p>
                 <p className="text-2xl font-black text-slate-900">{s.value}</p>
              </div>
           </div>
         ))}
      </div>

      {/* List */}
      <div className="card border-slate-200 overflow-hidden print:hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-widest text-[10px] font-black text-slate-400">
                     <th className="table-header w-20 px-6 py-4">ID</th>
                     <th className="table-header px-6">Timestamp</th>
                     <th className="table-header px-6">Customer Profile</th>
                     <th className="table-header px-6">Total Bill</th>
                     <th className="table-header px-6 text-emerald-600 font-black">Advance</th>
                     <th className="table-header px-6 text-rose-500 font-black">Remaining</th>
                     <th className="table-header px-6">Payment</th>
                     <th className="table-header px-6">Status</th>
                     <th className="table-header px-6 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {loading && orders.length === 0 ? (
                    <tr><td colSpan={9} className="p-32 text-center"><div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mx-auto" /></td></tr>
                 ) : filteredOrders.length === 0 ? (
                    <tr><td colSpan={9} className="p-32 text-center text-slate-400 font-medium tracking-tight">System holds no records for your current filters.</td></tr>
                 ) : filteredOrders.map((order) => (
                    <tr key={order.id} className="table-row group hover:bg-slate-50/10">
                       <td className="table-cell px-6 text-xs font-bold text-slate-400 font-mono">{order.order_number ? `GWC${order.order_number}` : `GWC${order.id.slice(0,4).toUpperCase()}`}</td>
                       <td className="table-cell px-6">
                          <div className="flex flex-col">
                             <span className="text-sm font-bold text-slate-900">{new Date(order.created_at).toLocaleDateString('en-GB')}</span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                       </td>
                       <td className="table-cell px-6">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm">
                                {order.customers?.name?.[0].toUpperCase()}
                             </div>
                             <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900">{order.customers?.name}</span>
                                <span className="text-xs font-medium text-slate-400">+{order.customers?.mobile}</span>
                             </div>
                          </div>
                       </td>
                       <td className="table-cell px-6 text-sm font-black text-slate-900">₹{Number(order.total_amount).toLocaleString()}</td>
                       <td className="table-cell px-6 text-sm font-black text-emerald-600">₹{(order.advance_amount || 0).toLocaleString()}</td>
                       <td className="table-cell px-6">
                          <span className={cn(
                            "text-sm font-black",
                            (order.balance_amount || 0) > 0 ? "text-rose-500" : "text-slate-300 opacity-50"
                          )}>
                             ₹{(order.balance_amount || 0).toLocaleString()}
                          </span>
                       </td>
                       <td className="table-cell px-6">
                          <button 
                             onClick={() => togglePaymentStatus(order)}
                             className={cn(
                               "inline-flex items-center gap-2 h-7 px-3 rounded-full text-[9px] font-extrabold uppercase tracking-widest transition-all",
                               order.payment_status === 'paid' 
                                 ? "bg-emerald-100 text-emerald-700" 
                                 : "bg-rose-100 text-rose-700"
                             )}
                          >
                             {order.payment_status === 'paid' ? <CheckCircle size={10} /> : <Clock size={10} />}
                             {order.payment_status}
                          </button>
                       </td>
                       <td className="table-cell px-6">
                          <button 
                             onClick={() => advanceOrderStatus(order)}
                             className={cn(
                               "inline-flex items-center gap-2 h-7 px-3 rounded-full text-[9px] font-extrabold uppercase tracking-widest transition-all",
                               (order.order_status || 'Pending') === 'Delivered' 
                                 ? "bg-slate-100 text-slate-500" 
                                 : "bg-indigo-100 text-indigo-700"
                             )}
                          >
                             {order.order_status}
                          </button>
                       </td>
                       <td className="table-cell px-6 text-right">
                           <div className="flex justify-end gap-2">
                              <button 
                                 onClick={() => handlePrintOrder(order.id)}
                                 className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/10 transition-all active:scale-90"
                                 title="Print Receipt"
                              >
                                 <Printer size={16} strokeWidth={2.5} />
                              </button>
                              <button 
                                 onClick={() => handleWhatsAppShare(order)}
                                 className="w-9 h-9 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/10 transition-all active:scale-90"
                                 title="WhatsApp Notification"
                              >
                                 <MessageCircle size={16} strokeWidth={2.5} />
                              </button>
                              {(order.balance_amount || 0) > 0 && (
                                <button 
                                   onClick={() => handleCollectBalance(order.id)}
                                   className="w-9 h-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/10 transition-all active:scale-90"
                                   title="Collect Balance / Final Pay"
                                >
                                   <CreditCard size={16} strokeWidth={2.5} />
                                </button>
                              )}
                              <button 
                                 onClick={() => handleDeleteOrder(order.id)}
                                 className="w-9 h-9 flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-600/10 transition-all active:scale-90"
                                 title="Delete Order Permanently"
                              >
                                 <Trash2 size={16} strokeWidth={2.5} />
                              </button>
                           </div>
                        </td>
                    </tr>
                 ))}
               </tbody>
            </table>
         </div>
      </div>
      
      {/* Order Entry Form Modal */}
      {isModalOpen && (
        <OrderEntryForm 
           onClose={() => setIsModalOpen(false)} 
           onSuccess={handleOrderSuccess}
           onPrintSuccess={(orderId) => {
             setIsModalOpen(false);
             fetchData();
             handlePrintOrder(orderId);
           }}
        />
      )}
    </div>
  );
}
