import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Printer,
  Trash2,
  Clock,
  CheckCircle,
  TrendingUp,
  Package,
  AlertCircle,
  CreditCard,
  Share2,
  Edit2,
  Ban,
  X,
  MoreVertical,
  Search,
  Filter,
  History,
  Phone,
  MapPin,
  ArrowRight,
  Receipt
} from 'lucide-react';
import { orderService } from '@backend/services/orderService';
import { customerService } from '@backend/services/customerService';
import { notificationService } from '@backend/services/notificationService';
import { OrderEntryForm } from '../components/OrderEntryForm';
import { PrintReceipt } from '../components/PrintReceipt';
import type { PrintReceiptProps } from '../components/PrintReceipt';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

export default function Orders() {
  const location = useLocation();
  const { vendorId } = useAuth();
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [printingOrderData, setPrintingOrderData] = useState<PrintReceiptProps['orderData'] | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // Damage Refund State
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
  const [selectedOrderForDamage, setSelectedOrderForDamage] = useState<any>(null);
  const [damageDescription, setDamageDescription] = useState('');
  const [damageRefundAmount, setDamageRefundAmount] = useState<number>(0);
  const [submittingDamage, setSubmittingDamage] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Customer History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Coins & Wallet Adjustment State
  const [isCoinsWalletModalOpen, setIsCoinsWalletModalOpen] = useState(false);
  const [coinsWalletMode, setCoinsWalletMode] = useState<'coins' | 'wallet'>('coins');
  const [coinsWalletAction, setCoinsWalletAction] = useState<'add' | 'deduct'>('add');
  const [coinsWalletAmount, setCoinsWalletAmount] = useState<number>(0);
  const [updatingCoinsWallet, setUpdatingCoinsWallet] = useState(false);

  const handleUpdateCoinsWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || coinsWalletAmount <= 0) return;
    setUpdatingCoinsWallet(true);
    try {
      const change = coinsWalletAction === 'add' ? coinsWalletAmount : -coinsWalletAmount;
      if (coinsWalletMode === 'coins') {
        const updated = await customerService.updateCustomerCoins(selectedCustomer.id, change);
        setSelectedCustomer((prev: any) => prev ? { ...prev, coins: updated?.coins ?? Math.max(0, (prev.coins || 0) + change) } : null);
      } else {
        const updated = await customerService.updateCustomerWallet(selectedCustomer.id, change);
        setSelectedCustomer((prev: any) => prev ? { ...prev, wallet_balance: updated?.wallet_balance ?? Math.max(0, (prev.wallet_balance || 0) + change) } : null);
      }
      setIsCoinsWalletModalOpen(false);
      setCoinsWalletAmount(0);
    } catch (err) {
      console.error(err);
      alert("Error updating customer record");
    } finally {
      setUpdatingCoinsWallet(false);
    }
  };

  const handleQuickCoinsChange = async (change: number) => {
    if (!selectedCustomer) return;
    try {
      const updated = await customerService.updateCustomerCoins(selectedCustomer.id, change);
      setSelectedCustomer((prev: any) => prev ? { ...prev, coins: updated?.coins ?? Math.max(0, (prev.coins || 0) + change) } : null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickWalletChange = async (change: number) => {
    if (!selectedCustomer) return;
    try {
      const updated = await customerService.updateCustomerWallet(selectedCustomer.id, change);
      setSelectedCustomer((prev: any) => prev ? { ...prev, wallet_balance: updated?.wallet_balance ?? Math.max(0, (prev.wallet_balance || 0) + change) } : null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewCustomerHistory = async (customer: any) => {
    setSelectedCustomer(customer);
    setIsHistoryModalOpen(true);
    setOrdersLoading(true);
    try {
      const data = await customerService.getCustomerOrders(customer.id);
      setCustomerOrders(data || []);
    } catch (err) {
      console.error("Error loading customer orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleReportDamageClick = (order: any) => {
    setSelectedOrderForDamage(order);
    setDamageDescription('');
    setDamageRefundAmount(0);
    setIsDamageModalOpen(true);
  };

  const handleReportDamageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDamage || !selectedOrderForDamage.customer_id) return;
    if (damageRefundAmount <= 0) {
      alert("Please enter a valid refund amount.");
      return;
    }
    try {
      setSubmittingDamage(true);
      await customerService.updateCustomerCoins(selectedOrderForDamage.customer_id, damageRefundAmount);
      alert(`Successfully reported damage. Refunded ${damageRefundAmount} coins to customer.`);
      setIsDamageModalOpen(false);
      setSelectedOrderForDamage(null);
      setDamageDescription('');
      setDamageRefundAmount(0);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to report damage.");
    } finally {
      setSubmittingDamage(false);
    }
  };

  useEffect(() => {
    fetchData();
    const params = new URLSearchParams(location.search);
    if (params.get('openEntry') === 'true') {
      setIsModalOpen(true);
      // Clean up URL without triggering navigation
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location.search, vendorId]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdownId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAllOrders(vendorId);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSuccess = () => {
    setIsModalOpen(false);
    setEditingOrderId(null);
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

        // --- PROFESSIONAL SMART STATUS ALERTS ---
        try {
          const orderRef = order.order_number ? `GWC${order.order_number}` : 'GWC' + order.id.slice(0, 4).toUpperCase();
          const customerName = order.customers?.name || 'Valued Customer';
          const mobile = order.customers?.mobile || '';
          const totalAmount = Number(order.total_amount).toLocaleString();
          const balanceAmount = (order.balance_amount || 0).toLocaleString();

          let alertMsg = '';

          if (nextPhase === 'Processing') {
            alertMsg = `Hello ${customerName}, your order *${orderRef}* is now under Processing at Green Wash Co. We'll alert you once it's clean and ready! 🧺`;
          } else if (nextPhase === 'Ready') {
            alertMsg = `Good news ${customerName}! ✨\n\nYour clothes for order *${orderRef}* are Cleaned, Ironed, and **READY** for pickup at Green Wash Co.\n\n` +
              `Invoice Total: ₹${totalAmount}\n` +
              `Remaining Balance: ₹${balanceAmount}\n\n` +
              `See you soon! 🙏`;
          } else if (nextPhase === 'Delivered') {
            const reviewLink = "https://g.page/r/CWo32A-V7qWGEBM/review";
            alertMsg = `Hi ${customerName}, your order *${orderRef}* has been successfully delivered. ✅\n\n` +
              `Thank you for choosing Green Wash Co.! We look forward to serving you again soon. ✨\n\n` +
              `*How was your experience?*\nHelp us grow by leaving a review here:\n${reviewLink} 🙏`;
          }

          if (alertMsg && mobile) {
            // --- FREE SEMI-AUTO POPUP STRATEGY ---
            // This bypasses the need for a Meta API and works for free.
            const cleanedMobile = mobile.replace(/\D/g, '');
            const phone = cleanedMobile.startsWith('91') ? cleanedMobile : '91' + cleanedMobile;
            const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(alertMsg)}`;

            // Open in new tab after a brief moment to allow UI to update
            setTimeout(() => {
              window.open(waLink, '_blank');
            }, 500);
          }
        } catch (alertErr) {
          console.error("Smart Status Alert system encounterd an issue:", alertErr);
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


  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(t('delete_confirm'))) return;
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

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to CANCEL this order? The record will remain but will be marked as Cancelled.")) return;
    try {
      setLoading(true);
      await orderService.updateOrderStatus(orderId, 'Cancelled');
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to cancel order.");
    } finally {
      setLoading(false);
    }
  };

  const handleCollectBalance = async (orderId: string) => {
    if (!window.confirm(t('confirm_balance'))) return;
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


  const handleShareLink = (order: any) => {
    const orderRef = order.order_number ? `GWC${order.order_number}` : 'GWC' + order.id.slice(0, 4).toUpperCase();
    const orderDate = new Date(order.created_at).toLocaleDateString('en-GB');
    const dueDate = order.due_date ? order.due_date.split('-').reverse().join('/') : orderDate;
    const totalAmount = Number(order.total_amount).toLocaleString();
    const balanceAmount = (order.balance_amount || 0).toLocaleString();

    // Exact format requested by user
    const baseUrl = window.location.origin;
    const publicUrl = `${baseUrl}/receipt/${order.id}`;

    const message = `Greetings from Green Wash Co.\n` +
      `We are pleased to have you as a valuable customer. Please find the details of your transaction.\n` +
      `Invoice No:-${orderRef}\n\n` +
      `Sale Order :\n` +
      `Order Date: ${orderDate}\n` +
      `Due Date: ${dueDate}\n\n` +
      `Invoice Amount: ₹${totalAmount}\n` +
      `Balance: ₹${balanceAmount}\n` +
      `  View Invoice: ${publicUrl}\n` +
      `Thanks for doing business with us.\n` +
      `Regards,\n` +
      `Green Wash Co.`;

    const waLink = notificationService.getWhatsAppLink(order.customers?.mobile || '', message);
    window.open(waLink, '_blank');
  };

  const formatOrderForPrint = (order: any): PrintReceiptProps['orderData'] => {
    return {
      status: order.order_status,
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
  };

  const handlePrintOrder = async (orderId: string) => {
    try {
      setLoading(true);
      const detailedOrder = await orderService.getOrderById(orderId);
      const pData = formatOrderForPrint(detailedOrder);

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
      (o.order_number && String(o.order_number).includes(searchTerm)) ||
      (o.order_number && `gwc${o.order_number}`.includes(searchTerm.toLowerCase())) ||
      o.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customers?.mobile?.includes(searchTerm);

    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && o.order_status === statusFilter;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = [
    { label: t('active_orders'), value: orders.filter(o => o.order_status !== 'Delivered' && o.order_status !== 'Cancelled').length, icon: Package, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: t('todays_sales'), value: `₹${orders.filter(o => new Date(o.created_at) >= today && o.order_status !== 'Cancelled').reduce((sum, o) => sum + Number(o.total_amount), 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: t('total_outstanding'), value: `₹${orders.filter(o => o.order_status !== 'Cancelled').reduce((sum, o) => sum + Number(o.balance_amount || 0), 0).toLocaleString()}`, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' }
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
            {t('order_ledger')}
            <span className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full uppercase tracking-widest font-extrabold">{language === 'hi' ? 'लाइव' : 'Live'}</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">{t('manage_track')}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="h-14 px-8 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all text-sm uppercase tracking-widest"
        >
          <Plus size={20} className="stroke-[3]" />
          {t('new_entry')}
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

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 print:hidden">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder={language === 'hi' ? 'नाम, मोबाइल या ऑर्डर नंबर से खोजें...' : 'Search by Name, Mobile or Order Number...'}
            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full md:w-64 group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
            <Filter size={18} />
          </div>
          <select
            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer transition-all shadow-sm text-slate-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{language === 'hi' ? 'सभी स्टेटस' : 'All Status'}</option>
            <option value="Pending">{language === 'hi' ? 'लंबित (Pending)' : 'Pending'}</option>
            <option value="Processing">{language === 'hi' ? 'प्रसंस्करण (Processing)' : 'Processing'}</option>
            <option value="Washing">{language === 'hi' ? 'धुलाई (Washing)' : 'Washing'}</option>
            <option value="Ironing">{language === 'hi' ? 'इस्त्री (Ironing)' : 'Ironing'}</option>
            <option value="Ready">{language === 'hi' ? 'तैयार (Ready)' : 'Ready'}</option>
            <option value="Delivered">{language === 'hi' ? 'डिलिवर किया गया (Delivered)' : 'Delivered'}</option>
            <option value="Cancelled">{language === 'hi' ? 'रद्द (Cancelled)' : 'Cancelled'}</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="card border-slate-200 overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-widest text-[10px] font-black text-slate-400">
                <th className="table-header w-20 px-6 py-4">{t('id')}</th>
                <th className="table-header px-6">{t('timestamp')}</th>
                <th className="table-header px-6">{t('customer_profile')}</th>
                <th className="table-header px-6">{t('total_bill')}</th>
                <th className="table-header px-6 text-emerald-600 font-black">{t('advance')}</th>
                <th className="table-header px-6 text-rose-500 font-black">{t('remaining')}</th>
                <th className="table-header px-6">{t('payment')}</th>
                <th className="table-header px-6">{t('status')}</th>
                <th className="table-header px-6 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && orders.length === 0 ? (
                <tr><td colSpan={9} className="p-32 text-center"><div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mx-auto" /></td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={9} className="p-32 text-center text-slate-400 font-medium tracking-tight">System holds no records for your current filters.</td></tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className={cn("table-row group hover:bg-slate-50/10", order.order_status === 'Cancelled' && "opacity-60 bg-slate-50 grayscale transition-all")}>
                  <td className="table-cell px-6 text-xs font-bold text-slate-400 font-mono">{order.order_number ? `GWC${order.order_number}` : `GWC${order.id.slice(0, 4).toUpperCase()}`}</td>
                  <td className="table-cell px-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{new Date(order.created_at).toLocaleDateString('en-GB')}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="table-cell px-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (order.customers) handleViewCustomerHistory(order.customers);
                      }}
                      className="flex items-center gap-3 text-left hover:opacity-80 active:scale-98 transition-all group/cust"
                      title={language === 'hi' ? 'ग्राहक का इतिहास देखने के लिए क्लिक करें' : 'Click to view Customer History'}
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm group-hover/cust:bg-primary-600 group-hover/cust:text-white transition-colors">
                        {order.customers?.name?.[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 group-hover/cust:text-primary-600 transition-colors flex items-center gap-1.5">
                          {order.customers?.name}
                          <History size={12} className="text-slate-400 group-hover/cust:text-primary-600 transition-colors" />
                        </span>
                        <span className="text-xs font-medium text-slate-400">+{order.customers?.mobile}</span>
                      </div>
                    </button>
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
                      onClick={() => order.order_status !== 'Cancelled' && advanceOrderStatus(order)}
                      disabled={order.order_status === 'Cancelled'}
                      className={cn(
                        "inline-flex items-center gap-2 h-7 px-3 rounded-full text-[9px] font-extrabold uppercase tracking-widest transition-all",
                        order.order_status === 'Cancelled' ? "bg-red-100 text-red-700 cursor-not-allowed" :
                          (order.order_status || 'Pending') === 'Delivered'
                            ? "bg-slate-100 text-slate-500"
                            : "bg-indigo-100 text-indigo-700"
                      )}
                    >
                      {order.order_status || 'Pending'}
                    </button>
                  </td>
                  <td className="table-cell px-6 text-right relative">
                    <div className="flex justify-end items-center gap-1.5">
                      {/* Direct Action: Preview Receipt */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePrintOrder(order.id); }}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-slate-50 text-slate-500 hover:bg-primary-600 hover:text-white transition-all shadow-sm active:scale-95"
                        title="Preview Receipt"
                      >
                        <Printer size={16} />
                      </button>

                      {/* Direct Action: Edit Order */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingOrderId(order.id);
                          setIsModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-slate-50 text-slate-500 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                        title="Edit Order"
                      >
                        <Edit2 size={16} />
                      </button>

                      {/* Direct Action: Share WhatsApp */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleShareLink(order); }}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-slate-50 text-slate-500 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
                        title="Share WhatsApp"
                      >
                        <Share2 size={16} />
                      </button>

                      {/* Dropdown for other options */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownId(activeDropdownId === order.id ? null : order.id);
                          }}
                          className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 text-slate-500 rounded-xl transition-all active:scale-90"
                        >
                          <MoreVertical size={20} />
                        </button>

                        {activeDropdownId === order.id && (
                          <div className="absolute right-0 top-10 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 w-52 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                            {/* Customer History Option */}
                            <button
                              onClick={() => {
                                if (order.customers) handleViewCustomerHistory(order.customers);
                                setActiveDropdownId(null);
                              }}
                              className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                            >
                              <History size={14} className="text-slate-400" />
                              Customer History
                            </button>

                            {/* Collect Balance Option */}
                            {(order.balance_amount || 0) > 0 && (
                              <button
                                onClick={() => handleCollectBalance(order.id)}
                                className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                              >
                                <CreditCard size={14} className="text-slate-400" />
                                Collect Balance
                              </button>
                            )}

                            {/* Cancel Order Option */}
                            {order.order_status !== 'Cancelled' && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                              >
                                <Ban size={14} className="text-slate-400" />
                                Cancel Order
                              </button>
                            )}

                            {/* Report Damage Option */}
                            <button
                              onClick={() => handleReportDamageClick(order)}
                              className="w-full px-4 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 transition-colors"
                            >
                              <AlertCircle size={14} className="text-amber-500" />
                              Report Damage
                            </button>

                            {/* Divider */}
                            <div className="my-1 border-t border-slate-50" />

                            {/* Delete Permanently Option */}
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="w-full px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                            >
                              <Trash2 size={14} className="text-rose-400" />
                              Delete Permanently
                            </button>
                          </div>
                        )}
                      </div>
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
          onClose={() => {
            setIsModalOpen(false);
            setEditingOrderId(null);
          }}
          editOrderId={editingOrderId || undefined}
          onSuccess={handleOrderSuccess}
          onPrintSuccess={(orderId: string) => {
            setIsModalOpen(false);
            fetchData();
            handlePrintOrder(orderId);
          }}
        />
      )}
      {/* Report Damage Modal */}
      {isDamageModalOpen && selectedOrderForDamage && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDamageModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 overflow-hidden animate-slide-up flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Report Clothes Damage</h3>
              <button onClick={() => setIsDamageModalOpen(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleReportDamageSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Damage Description</label>
                <textarea
                  required
                  rows={3}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all resize-none"
                  placeholder="Describe the clothes damage..."
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Refund Amount (Coins)</label>
                <input
                  required
                  type="number"
                  min="1"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                  placeholder="Enter coin refund value..."
                  value={damageRefundAmount || ''}
                  onChange={(e) => setDamageRefundAmount(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDamageModalOpen(false)}
                  className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDamage}
                  className="flex-1 h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50"
                >
                  {submittingDamage ? "Submitting..." : "Issue Refund"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Customer History Modal */}
      {isHistoryModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsHistoryModalOpen(false)} />
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-5 text-left">
                <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center text-xl font-bold shadow-xl shadow-primary-600/20">
                  {selectedCustomer.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{selectedCustomer.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm font-medium text-slate-500">
                    <span className="flex items-center gap-1"><Phone size={14} className="text-slate-400" /> {selectedCustomer.mobile}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="flex items-center gap-1"><MapPin size={14} className="text-slate-400" /> {selectedCustomer.branch?.name || 'General Branch'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 transition-colors shadow-sm"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide text-left">
              <div className="mb-6 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Historical Ledger</h4>
                <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tight">
                  {customerOrders.length} Completed Orders
                </div>
              </div>

              {ordersLoading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
                  <p className="text-sm font-medium text-slate-400">Fetching order records...</p>
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="py-32 flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                    <Receipt size={32} />
                  </div>
                  <p className="text-slate-400 font-medium">This customer hasn't placed any orders yet.</p>
                </div>
              ) : (
                <div className="space-y-6 text-left">
                  {/* Header Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Total Orders</span>
                      <span className="text-2xl font-black text-slate-800">{customerOrders.length}</span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block mb-1">Total Transactions</span>
                      <span className="text-2xl font-black text-emerald-600">₹{customerOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                      <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block mb-1">Total Pending</span>
                      <span className="text-2xl font-black text-rose-600">₹{customerOrders.reduce((s, o) => s + Number(o.balance_amount || 0), 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block mb-1">Wallet Balance</span>
                        <span className="text-2xl font-black text-indigo-600">₹{(selectedCustomer.wallet_balance || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <button
                          onClick={() => handleQuickWalletChange(100)}
                          className="text-[9px] font-black bg-indigo-200 text-indigo-800 hover:bg-indigo-300 px-2 py-0.5 rounded-md transition-colors"
                          title="Add ₹100 to wallet"
                        >
                          +₹100
                        </button>
                        <button
                          onClick={() => {
                            setCoinsWalletMode('wallet');
                            setCoinsWalletAction('add');
                            setCoinsWalletAmount(0);
                            setIsCoinsWalletModalOpen(true);
                          }}
                          className="text-[9px] font-black bg-indigo-600 text-white hover:bg-indigo-700 px-2 py-0.5 rounded-md transition-colors ml-auto"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider block mb-1">Available Coins</span>
                        <span className="text-2xl font-black text-amber-600">{selectedCustomer.coins || 0} 💰</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <button
                          onClick={() => handleQuickCoinsChange(50)}
                          className="text-[9px] font-black bg-amber-200 text-amber-800 hover:bg-amber-300 px-2 py-0.5 rounded-md transition-colors"
                          title="Add 50 coins"
                        >
                          +50
                        </button>
                        <button
                          onClick={() => {
                            setCoinsWalletMode('coins');
                            setCoinsWalletAction('add');
                            setCoinsWalletAmount(0);
                            setIsCoinsWalletModalOpen(true);
                          }}
                          className="text-[9px] font-black bg-amber-600 text-white hover:bg-amber-700 px-2 py-0.5 rounded-md transition-colors ml-auto"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Order List */}
                  <div className="space-y-4">
                    {customerOrders.map(order => (
                      <div key={order.id} className="group p-5 rounded-2xl border border-slate-100 hover:border-primary-200 hover:bg-slate-50/50 transition-all space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="text-center w-12 shrink-0">
                              <div className="text-[9px] font-bold text-slate-400 uppercase">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short' })}</div>
                              <div className="text-xl font-extrabold text-slate-800 leading-none">{new Date(order.created_at).getDate()}</div>
                              <div className="text-[9px] font-bold text-slate-400 mt-1">{new Date(order.created_at).getFullYear()}</div>
                            </div>
                            <div className="h-10 w-[1px] bg-slate-100" />
                            <div>
                              <div className="text-sm font-bold text-slate-700 uppercase tracking-tighter mb-1 text-left">
                                Order Ref: {order.order_number ? `GWC${order.order_number}` : 'GWC' + order.id.slice(0, 4).toUpperCase()}
                              </div>
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-tighter",
                                  order.payment_status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                )}>
                                  {order.payment_status}
                                </div>
                                <span className="text-xs font-medium text-slate-400">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-extrabold text-slate-900 tracking-tight">₹{Number(order.total_amount).toLocaleString()}</div>
                            <div className={cn(
                              "text-[10px] font-bold uppercase",
                              (order.balance_amount || 0) > 0 ? "text-rose-500" : "text-emerald-500"
                            )}>
                              {(order.balance_amount || 0) > 0 ? `Balance: ₹${(order.balance_amount ?? 0).toLocaleString()}` : "Fully Paid"}
                            </div>
                          </div>
                        </div>

                        {/* Services Taken (Items) */}
                        {order.order_items && order.order_items.length > 0 && (
                          <div className="pt-3 border-t border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 text-left">Services Taken:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {order.order_items.map((item: any, idx: number) => {
                                const name = item.custom_item_name || item.cloth_types?.name || 'Item';
                                return (
                                  <span key={idx} className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full uppercase">
                                    {item.quantity} x {name}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handlePrintOrder(order.id)}
                            className="text-[10px] font-bold text-primary-600 uppercase tracking-widest flex items-center gap-1 hover:text-primary-700"
                          >
                            View Receipt <ArrowRight size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                <AlertCircle size={16} />
                <span className="text-xs font-bold uppercase tracking-tight">
                  Total Pending: ₹{customerOrders.reduce((s, o) => s + Number(o.balance_amount || 0), 0).toLocaleString()}
                </span>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="h-11 px-6 rounded-xl font-bold text-sm bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/10">Close Record</button>
            </div>
          </div>
        </div>
      )}
      {/* Coins & Wallet Adjustment Modal */}
      {isCoinsWalletModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCoinsWalletModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 overflow-hidden animate-slide-up flex flex-col text-left">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                {coinsWalletMode === 'coins' ? '🪙 Manage Reward Coins' : '👛 Manage Wallet Balance'}
              </h3>
              <button onClick={() => setIsCoinsWalletModalOpen(false)} className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateCoinsWallet} className="space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCoinsWalletAction('add')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                    coinsWalletAction === 'add' ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  + Add {coinsWalletMode === 'coins' ? 'Coins' : 'Funds (₹)'}
                </button>
                <button
                  type="button"
                  onClick={() => setCoinsWalletAction('deduct')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                    coinsWalletAction === 'deduct' ? "bg-rose-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  - Deduct {coinsWalletMode === 'coins' ? 'Coins' : 'Funds (₹)'}
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  {`Amount (${coinsWalletMode === 'coins' ? 'Coins' : 'Rupees ₹'})`}
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-500"
                  placeholder={coinsWalletMode === 'coins' ? "E.g. 50" : "E.g. 200"}
                  value={coinsWalletAmount || ''}
                  onChange={(e) => setCoinsWalletAmount(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>

              {/* Quick Amount Selection */}
              <div className="flex gap-2">
                {(coinsWalletMode === 'coins' ? [10, 50, 100, 500] : [50, 100, 200, 500]).map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCoinsWalletAmount(val)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-lg transition-colors"
                  >
                    {coinsWalletMode === 'coins' ? `+${val}` : `₹${val}`}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCoinsWalletModalOpen(false)}
                  className="flex-1 h-11 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingCoinsWallet}
                  className="flex-1 h-11 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-primary-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {updatingCoinsWallet ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
