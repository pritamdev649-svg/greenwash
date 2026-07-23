import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Filter,
  Phone,
  MapPin,
  History,
  UserPlus,
  X,
  MessageCircle,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Receipt,
  Edit2,
  Trash2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { customerService } from '@backend/services/customerService';
import { branchService } from '@backend/services/branchService';
import { orderService } from '@backend/services/orderService';
import { notificationService } from '@backend/services/notificationService';
import { vendorService } from '@backend/services/vendorService';
import { PrintReceipt } from '../components/PrintReceipt';
import type { PrintReceiptProps } from '../components/PrintReceipt';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  branch_id: string;
  branch?: { name: string };
  total_orders?: number;
  pending_amount?: number;
  coins?: number;
  wallet_balance?: number;
}

interface Order {
  id: string;
  total_amount: number;
  payment_status: string;
  balance_amount?: number;
  created_at: string;
  order_number?: string | number;
  order_items?: any[];
}

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { vendorId } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<{ id: string, name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [printingOrderData, setPrintingOrderData] = useState<PrintReceiptProps['orderData'] | null>(null);
  const [vendorBranch, setVendorBranch] = useState<{ id: string, name: string } | null>(null);

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
      fetchData();
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
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickWalletChange = async (change: number) => {
    if (!selectedCustomer) return;
    try {
      const updated = await customerService.updateCustomerWallet(selectedCustomer.id, change);
      setSelectedCustomer((prev: any) => prev ? { ...prev, wallet_balance: updated?.wallet_balance ?? Math.max(0, (prev.wallet_balance || 0) + change) } : null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Form
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '', address: '', branch_id: '' });

  const fetchData = async () => {
    try {
      setLoading(true);

      // Use services
      const [bData, cData] = await Promise.all([
        branchService.getAllBranches(),
        customerService.getAllCustomers(true, vendorId)
      ]);

      setBranches(bData);
      setCustomers(cData as any);

      if (vendorId) {
        try {
          const vendor = await vendorService.getVendorById(vendorId);
          if (vendor && vendor.branch_id) {
            const matchedBranch = bData.find(b => b.id === vendor.branch_id);
            if (matchedBranch) {
              setVendorBranch(matchedBranch);
            }
          }
        } catch (vErr) {
          console.error("Error fetching vendor details:", vErr);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const params = new URLSearchParams(location.search);
    if (params.get('add') === 'true') {
      setIsAddModalOpen(true);
    }
  }, [location.search, vendorId]);

  useEffect(() => {
    if (vendorBranch) {
      setFormData(prev => ({ ...prev, branch_id: vendorBranch.id }));
    }
  }, [vendorBranch]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await customerService.addCustomer({ ...formData, vendor_id: vendorId });
      setIsAddModalOpen(false);
      setFormData({ name: '', mobile: '', email: '', address: '', branch_id: vendorBranch ? vendorBranch.id : '' });
      await fetchData();

      const params = new URLSearchParams(location.search);
      const returnTo = params.get('returnTo');
      if (returnTo) {
        navigate(returnTo);
      }
    } catch (err) {
      alert("Failed to add customer");
    }
  };

  const handleEditClick = (customer: Customer) => {
    setCustomerToEdit(customer);
    setFormData({
      name: customer.name,
      mobile: customer.mobile,
      email: (customer as any).email || '',
      address: customer.address || '',
      branch_id: customer.branch_id
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToEdit) return;
    try {
      await customerService.updateCustomer(customerToEdit.id, formData);
      setIsEditModalOpen(false);
      setCustomerToEdit(null);
      setFormData({ name: '', mobile: '', email: '', address: '', branch_id: vendorBranch ? vendorBranch.id : '' });
      fetchData();
    } catch (err) {
      alert("Failed to update customer");
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm("ARE YOU SURE? This will permanently delete the customer profile. If they have existing orders, deletion might be blocked to protect financial records.")) return;
    try {
      setLoading(true);
      await customerService.deleteCustomer(id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("FAILED: Cannot delete customer with active order history.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerHistory = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsHistoryModalOpen(true);
    setOrdersLoading(true);

    try {
      const data = await customerService.getCustomerOrders(customer.id);
      setCustomerOrders(data as any);
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handlePrintOrder = async (orderId: string) => {
    try {
      setOrdersLoading(true);
      const detailedOrder = await orderService.getOrderById(orderId);

      const pData: PrintReceiptProps['orderData'] = {
        orderNo: detailedOrder.id.slice(0, 6).toUpperCase(),
        date: new Date(detailedOrder.created_at).toLocaleDateString('en-GB'),
        dueDate: detailedOrder.due_date
          ? detailedOrder.due_date.split('-').reverse().join('/')
          : new Date(detailedOrder.created_at).toLocaleDateString('en-GB'),
        customerName: detailedOrder.customers?.name || selectedCustomer?.name || 'Customer',
        customerAddress: detailedOrder.customers?.address || selectedCustomer?.address || '',
        customerPhone: detailedOrder.customers?.mobile || selectedCustomer?.mobile || '',
        vendorName: detailedOrder.vendors?.name || detailedOrder.branches?.name,
        vendorPhone: detailedOrder.vendors?.phone || detailedOrder.branches?.phone,
        vendorAddress: detailedOrder.vendors?.address || detailedOrder.branches?.address,
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
      alert("Failed to load order details for printing");
    } finally {
      setOrdersLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobile.includes(searchTerm);
    const matchesBranch = selectedBranch === 'all' || c.branch_id === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  const handleSendDirectMessage = async (customer: Customer) => {
    const msg = window.prompt(`Send WhatsApp to ${customer.name}:`, "");
    if (!msg || msg.trim() === "") return;

    try {
      setLoading(true);
      const res = await notificationService.sendAutomatedWhatsApp(customer.mobile, msg);
      if (res.success) {
        alert("Message dispatched successfully via Automated System.");
      } else {
        alert("Failed to send message automatically. Please check your API credentials.");
      }
    } catch (err) {
      console.error(err);
      alert("System error while sending message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('customer_directory')}</h2>
            <p className="text-sm text-slate-500 font-medium">{t('manage_customer_base')}</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center gap-2 h-11 px-5 rounded-xl shadow-lg shadow-primary-600/20 active:scale-95 transition-all text-sm font-bold"
          >
            <UserPlus size={18} />
            <span>{t('add_customer_btn')}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder={t('search_customers')}
              className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-full md:w-64 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
              <Filter size={18} />
            </div>
            <select
              className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer transition-all"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="all">{t('branches')}</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="table-header">{t('customer_profile')}</th>
                  <th className="table-header">{t('contact_detail')}</th>
                  <th className="table-header text-center">{t('orders')}</th>
                  <th className="table-header">{t('remaining')}</th>
                  <th className="table-header text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-20 text-center"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent animate-spin rounded-full mx-auto" /></td></tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr><td colSpan={5} className="p-32 text-center text-slate-400 font-medium">No customers found matching your criteria.</td></tr>
                ) : filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="table-row group">
                    <td className="table-cell">
                      <button
                        onClick={() => fetchCustomerHistory(customer)}
                        className="flex items-center gap-4 text-left hover:opacity-80 active:scale-98 transition-all group/cust"
                        title="Click to view Customer History"
                      >
                        <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm border-2 border-white shadow-sm group-hover/cust:bg-primary-600 group-hover/cust:text-white transition-colors">
                          {customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 leading-tight group-hover/cust:text-primary-600 transition-colors">{customer.name}</span>
                            {customer.branch?.name && (
                              <span className="text-[9px] font-black text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                {customer.branch.name}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-semibold text-slate-400 mt-0.5 flex items-center gap-1 group-hover/cust:text-slate-500 transition-colors">
                            <MapPin size={10} />
                            <span className="truncate max-w-[140px]">{customer.address || 'No address'}</span>
                          </div>
                        </div>
                      </button>
                    </td>
                    <td className="table-cell">
                      <div className="space-y-1">
                        <button
                          onClick={() => handleSendDirectMessage(customer)}
                          className="text-sm font-bold text-slate-700 hover:text-emerald-600 flex items-center gap-1.5 transition-colors group/msg"
                          title="Send automated message to this customer"
                        >
                          <Phone size={14} className="text-slate-400 group-hover/msg:text-emerald-500" />
                          {customer.mobile}
                          <MessageCircle size={14} className="text-emerald-500 opacity-0 group-hover/msg:opacity-100 transition-opacity" />
                        </button>
                        <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary-50 text-[10px] font-bold text-primary-600 border border-primary-100 uppercase tracking-tighter">
                          {customer.branch?.name || 'Main Office'}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        <span className="text-sm font-bold text-slate-900">{customer.total_orders}</span>
                        <TrendingUp size={12} className="text-emerald-500" />
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className={cn(
                        "text-sm font-bold px-2 py-1 rounded-lg w-fit",
                        (customer.pending_amount || 0) > 0
                          ? "text-rose-700 bg-rose-50 border border-rose-100"
                          : "text-emerald-700 bg-emerald-50 border border-emerald-100"
                      )}>
                        ₹{customer.pending_amount?.toLocaleString()}
                      </div>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => fetchCustomerHistory(customer)}
                          className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-slate-50 text-slate-500 hover:bg-primary-600 hover:text-white transition-all shadow-sm active:scale-95"
                          title="View History"
                        >
                          <History size={16} />
                        </button>
                        <button
                          onClick={() => handleEditClick(customer)}
                          className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-slate-50 text-slate-500 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                          title="Edit Profile"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-slate-50 text-rose-400 hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95"
                          title="Delete Customer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                    <UserPlus size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Onboard New Customer</h3>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>

              <form onSubmit={handleAddCustomer} className="grid grid-cols-2 gap-5">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <input required className="input h-11 bg-slate-50 focus:bg-white" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Mobile Number</label>
                  <input required className="input h-11 bg-slate-50 focus:bg-white" placeholder="+91 0000 0000" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Branch Assignment</label>
                  {vendorBranch ? (
                    <input 
                      disabled 
                      className="input h-11 bg-slate-100 border border-slate-200 text-slate-500 font-bold" 
                      value={vendorBranch.name} 
                    />
                  ) : (
                    <select required className="input h-11 bg-slate-50 focus:bg-white cursor-pointer" value={formData.branch_id} onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}>
                      <option value="">Select branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  )}
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Service Address</label>
                  <textarea className="input min-h-[80px] py-3 resize-none bg-slate-50 focus:bg-white" placeholder="Apt, Street, Landmark..." value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <div className="col-span-2 pt-2 flex gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 h-12 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Dismiss</button>
                  <button type="submit" className="flex-[2] btn-primary h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary-600/20 active:scale-95 transition-all">Submit Entry</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Edit2 size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Edit Customer Profile</h3>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>

              <form onSubmit={handleUpdateCustomer} className="grid grid-cols-2 gap-5">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <input required className="input h-11 bg-slate-50 focus:bg-white" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Mobile Number</label>
                  <input required className="input h-11 bg-slate-50 focus:bg-white" placeholder="+91 0000 0000" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Branch Assignment</label>
                  {vendorBranch ? (
                    <input 
                      disabled 
                      className="input h-11 bg-slate-100 border border-slate-200 text-slate-500 font-bold" 
                      value={vendorBranch.name} 
                    />
                  ) : (
                    <select required className="input h-11 bg-slate-50 focus:bg-white cursor-pointer" value={formData.branch_id} onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}>
                      <option value="">Select branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  )}
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Service Address</label>
                  <textarea className="input min-h-[80px] py-3 resize-none bg-slate-50 focus:bg-white" placeholder="Apt, Street, Landmark..." value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <div className="col-span-2 pt-2 flex gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 h-12 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Discard</button>
                  <button type="submit" className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* History Modal */}
        {isHistoryModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsHistoryModalOpen(false)} />
            <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-5">
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

              <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
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
                    <button onClick={() => navigate('/sale-order')} className="text-primary-600 font-bold hover:underline py-2">Create First Order</button>
                  </div>
                ) : (
                  <div className="space-y-6">
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
                                <div className="text-sm font-bold text-slate-700 uppercase tracking-tighter mb-1">
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
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Services Taken:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {order.order_items.map((item: any, idx: number) => {
                                  const name = item.custom_item_name || item.cloth_type?.name || 'Item';
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

      {printingOrderData && <PrintReceipt orderData={printingOrderData} />}
    </>
  );
};

export default Customers;
