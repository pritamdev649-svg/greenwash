import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  User,
  ChevronDown,
  X,
  AlertCircle,
  MessageCircle,
  Printer,
  Check
} from 'lucide-react';
import { customerService } from '@backend/services/customerService';
import { orderService } from '@backend/services/orderService';
import { vendorService } from '@backend/services/vendorService';
import { notificationService } from '@backend/services/notificationService';
import { PrintReceipt } from './PrintReceipt';
import { receiptService } from '../lib/receiptService';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

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

const formatDateSafe = (dateStr: any) => {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  return parts.reverse().join('/');
};

interface OrderEntryFormProps {
  onClose: () => void;
  onSuccess: () => void;
  onPrintSuccess?: (orderId: string) => void;
  editOrderId?: string;
}

export const OrderEntryForm: React.FC<OrderEntryFormProps> = ({ onClose, onSuccess, onPrintSuccess, editOrderId }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { vendorId } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [clothTypes, setClothTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [vendorPayment, setVendorPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.mobile?.includes(customerSearch)
  );

  const handleSelectCustomer = (c: any) => {
    setSelectedCustomerId(c.id);
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setIsCustomerDropdownOpen(false);
  };
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  const [orderNo, setOrderNo] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [rows, setRows] = useState<SaleRow[]>([
    { id: '1', category: '', item_id: '', item_name: '', description: '', qty: 1, unit: 'PCS', price: 0, amount: 0 }
  ]);

  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');

  // Additional Charges State
  const [additionalCharges, setAdditionalCharges] = useState<{ label: string, amount: number }[]>([]);
  const [showCustomCharge, setShowCustomCharge] = useState(false);
  const [customChargeLabel, setCustomChargeLabel] = useState('');
  const [customChargeAmount, setCustomChargeAmount] = useState(0);

  const togglePredefinedCharge = (label: string, amount: number) => {
    setAdditionalCharges(prev => {
      const exists = prev.find(c => c.label === label);
      if (exists) {
        return prev.filter(c => c.label !== label);
      } else {
        return [...prev, { label, amount }];
      }
    });
  };

  const addCustomCharge = () => {
    if (customChargeLabel && customChargeAmount > 0) {
      setAdditionalCharges(prev => [...prev, { label: customChargeLabel, amount: customChargeAmount }]);
      setCustomChargeLabel('');
      setCustomChargeAmount(0);
      setShowCustomCharge(false);
    }
  };

  const removeCharge = (label: string) => {
    setAdditionalCharges(prev => prev.filter(c => c.label !== label));
  };

  const updateChargeAmount = (label: string, newAmount: number) => {
    setAdditionalCharges(prev => prev.map(c =>
      c.label === label ? { ...c, amount: newAmount } : c
    ));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("Fetching data for Order Entry...");

        // Fetch customers
        try {
          const cData = await customerService.getAllCustomers(true, vendorId);
          console.log("Customers loaded:", cData?.length || 0);
          setCustomers(cData || []);
        } catch (cErr) {
          console.error("Error loading customers:", cErr);
        }

        // Fetch cloth types
        try {
          const ctData = await orderService.getAllClothTypes(vendorId);
          console.log("Cloth types loaded:", ctData?.length || 0);
          setClothTypes(ctData || []);
        } catch (ctErr) {
          console.error("Error loading cloth types:", ctErr);
        }

        // Fetch categories
        try {
          const catData = await orderService.getAllCategories(vendorId);
          console.log("Categories loaded:", catData?.length || 0);
          setCategories(catData || []);
        } catch (catErr) {
          console.error("Error loading categories (might be missing table):", catErr);
          setCategories([]);
        }

        // Fetch vendor payment info for QR on receipt
        try {
          if (vendorId) {
            const payment = await vendorService.getVendorPayment(vendorId);
            setVendorPayment(payment);
          }
        } catch (payErr) {
          console.error("Error loading vendor payment:", payErr);
        }

      } catch (err) {
        console.error("Unexpected error in fetchData:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [vendorId]);

  // Fetch Edit Data
  useEffect(() => {
    const fetchEditData = async () => {
      if (!editOrderId) return;
      try {
        setLoading(true);
        const order = await orderService.getOrderById(editOrderId);
        if (order) {
          setSelectedCustomerId(order.customer_id);
          setSelectedCustomer(order.customers);
          setCustomerSearch(order.customers?.name || '');
          setOrderDate(new Date(order.created_at).toISOString().split('T')[0]);
          setDueDate(order.due_date || '');
          setOrderNo(order.order_number || '');
          setAdvanceAmount(order.advance_amount || 0);
          setDiscount(order.discount_amount || 0);
          setDiscountType('amount'); // Default for imported

          // Map Items
          const mappedRows: SaleRow[] = order.order_items
            .filter((item: any) => !item.custom_item_name?.startsWith('[CHARGE]'))
            .map((item: any) => ({
              id: item.id,
              category: item.wash_price > 0 && item.iron_price > 0 ? 'Wash & Iron' : item.wash_price > 0 ? 'Wash' : 'Iron',
              item_id: item.cloth_type_id || 'custom',
              item_name: item.custom_item_name || item.cloth_types?.name || '',
              description: '',
              qty: item.quantity,
              unit: 'PCS',
              price: (item.wash_price || 0) + (item.iron_price || 0),
              amount: item.subtotal
            }));

          if (mappedRows.length > 0) setRows(mappedRows);

          // Map Charges
          const mappedCharges = order.order_items
            .filter((item: any) => item.custom_item_name?.startsWith('[CHARGE]'))
            .map((item: any) => ({
              label: item.custom_item_name.replace('[CHARGE] ', ''),
              amount: item.subtotal
            }));
          setAdditionalCharges(mappedCharges);
        }
      } catch (err) {
        console.error("Error fetching edit data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEditData();
  }, [editOrderId]);

  const handleAddRow = () => {
    const newRow: SaleRow = {
      id: Date.now().toString(),
      category: '',
      item_id: '',
      item_name: '',
      description: '',
      qty: 1,
      unit: 'PCS',
      price: 0,
      amount: 0
    };
    setRows([...rows, newRow]);
  };

  const updateRow = (id: string, updates: Partial<SaleRow>) => {
    setRows(prev => prev.map(row => {
      if (row.id === id) {
        let updated = { ...row, ...updates };

        // 1. Handle Unit Toggle Logic
        if (updates.unit === 'KG') {
          updated.price = 80; // Force 80 for KG
        } else if (updates.unit === 'PCS') {
          // If switching from KG back to PCS, clear the 80 rate
          if (row.unit === 'KG' && updated.price === 80) {
            updated.price = 0;
          }
          updated.qty = Math.round(updated.qty); // Force integer for PCS
        }

        // 2. Additional enforcement for PCS
        if (updated.unit === 'PCS' && updates.qty !== undefined) {
          updated.qty = Math.round(updated.qty);
        }

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
  const chargesTotal = additionalCharges.reduce((sum, c) => sum + c.amount, 0);
  const discountAmount = discountType === 'amount' ? discount : (subtotal * discount) / 100;
  const grandTotal = Math.round(subtotal - discountAmount + chargesTotal);

  const handleSave = async () => {
    if (!selectedCustomerId) {
      return alert("Please select a customer first");
    }

    const validRows = rows.filter(r => r.item_name.trim() !== '');
    if (validRows.length === 0) {
      return alert("Please add at least one item to the order");
    }

    try {
      setLoading(true);
      const items = validRows.map(r => {
        return {
          cloth_type_id: (!r.item_id || r.item_id === 'custom') ? null : r.item_id,
          item_name: r.item_name,
          quantity: r.qty,
          wash_price: r.price, // Map single rate to wash_price as standard column
          iron_price: 0,
          subtotal: r.amount
        };
      });

      // Merge additional charges as special items
      const finalItems = [
        ...items,
        ...additionalCharges.map(charge => ({
          cloth_type_id: null,
          item_name: `[CHARGE] ${charge.label}`,
          quantity: 1,
          wash_price: charge.amount,
          iron_price: 0,
          subtotal: charge.amount
        }))
      ];

      const finalOrderData = {
        customerId: selectedCustomerId,
        branchId: selectedCustomer?.branch_id || null,
        totalAmount: grandTotal,
        advanceAmount,
        discountAmount,
        dueDate
      };

      let savedOrder: any = null;
      if (editOrderId) {
        await orderService.updateOrder(editOrderId, finalOrderData, finalItems);
        savedOrder = { id: editOrderId, order_number: orderNo };
        setIsSuccess(true);
        setCreatedOrderId(editOrderId);
        setCreatedOrder(savedOrder);
      } else {
        const order = await orderService.createOrder(
          selectedCustomerId,
          selectedCustomer?.branch_id || null,
          grandTotal,
          finalItems,
          advanceAmount,
          discountAmount,
          dueDate,
          selectedCustomer?.vendor_id || vendorId
        );
        savedOrder = order;
        setCreatedOrderId(order.id);
        setCreatedOrder(order);
        setIsSuccess(true);
      }

      // --- NEW: PDF GENERATION & AUTOMATED WHATSAPP SEND ---
      try {
        // We need to wait a tiny bit for the hidden receipt component to render in the DOM
        setTimeout(async () => {
          const currentOrderId = savedOrder?.id || editOrderId;
          const currentOrderNo = savedOrder?.order_number || orderNo;
          const orderRef = currentOrderNo ? `GWC${currentOrderNo}` : 'GWC' + currentOrderId.slice(0, 4).toUpperCase();

          // Generate and Upload PDF
          const url = await receiptService.generateAndUploadReceipt('hidden-receipt-capture', orderRef);
          setPdfUrl(url);

          const balance = (grandTotal - advanceAmount).toLocaleString();
          const msg = `Greetings from Green Wash Co.\n` +
            `We are pleased to have you as a valuable customer. Please find the details of your transaction.\n` +
            `Invoice No:-${orderRef}\n\n` +
            `Sale Order :\n` +
            `Order Date: ${formatDateSafe(orderDate)}\n` +
            `Due Date: ${formatDateSafe(dueDate)}\n\n` +
            `Invoice Amount: ₹${grandTotal.toLocaleString()}\n` +
            `Balance: ₹${balance}\n\n` +
            (url ? `Download Digital Receipt (PDF): ${url}\n\n` : '') +
            `Thanks for doing business with us.\n` +
            `Regards,\n` +
            `Green Wash Co.`;

          await notificationService.sendAutomatedWhatsApp(selectedCustomer?.mobile || '', msg);
        }, 800);
      } catch (waErr) {
        console.error("PDF/WhatsApp generation failed, but order was saved.", waErr);
      }
      // ------------------------------------

    } catch (err) {
      console.error(err);
      alert("Failed to save order.");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppShare = () => {
    const orderRef = createdOrder?.order_number ? `GWC${createdOrder.order_number}` : 'GWC' + createdOrderId.slice(0, 4).toUpperCase();
    const total = grandTotal.toLocaleString();
    const balance = (grandTotal - advanceAmount).toLocaleString();

    const message = `Greetings from Green Wash Co.\n` +
      `We are pleased to have you as a valuable customer. Please find the details of your transaction.\n` +
      `Invoice No:-${orderRef}\n\n` +
      `Sale Order :\n` +
      `Order Date: ${formatDateSafe(orderDate)}\n` +
      `Due Date: ${formatDateSafe(dueDate)}\n\n` +
      `Invoice Amount: ₹${total}\n` +
      `Balance: ₹${balance}\n\n` +
      (pdfUrl ? `Download Digital Receipt (PDF): ${pdfUrl}\n\n` : '') +
      `Thanks for doing business with us.\n` +
      `Regards,\n` +
      `Green Wash Co.`;

    const phone = selectedCustomer?.mobile?.replace(/\D/g, '');
    if (!phone) return alert("Mobile number not found!");
    const cleanedPhone = phone.startsWith('91') ? phone : '91' + phone;
    const url = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handlePrintRequest = () => {
    if (onPrintSuccess && createdOrderId) {
      onPrintSuccess(createdOrderId);
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 lg:p-4 printable-container print:relative print:block print:p-0">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md print:hidden" onClick={isSuccess ? onSuccess : onClose} />

      <div className="relative w-full h-full lg:max-w-7xl lg:max-h-[95vh] bg-white lg:rounded-3xl overflow-hidden print:overflow-visible flex flex-col animate-slide-up print:static print:max-w-none print:max-h-none print:shadow-none print:rounded-none">

        {isSuccess && (
          <div className="absolute inset-0 z-[110] bg-white flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300 text-center print:static print:p-0 print:animate-none">
            <div className="flex flex-col items-center justify-center print:hidden">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <Check size={40} className="stroke-[3]" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-2">{t('order_saved')}</h3>
              <p className="text-slate-500 font-medium mb-12 max-w-sm">
                {t('transaction_recorded')} <b>{selectedCustomer?.name}</b>.
                {t('next_action')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <button onClick={handlePrintRequest} className="flex-1 h-14 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">
                  <Printer size={18} /> {t('print_receipt')}
                </button>
                <button onClick={handleWhatsAppShare} className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">
                  <MessageCircle size={18} /> {t('whatsapp')}
                </button>
              </div>
              <button onClick={onSuccess} className="w-full max-w-md h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition-all mt-4">
                {t('done_back')}
              </button>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 border-b border-slate-100 bg-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center">
              <Plus size={24} />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">{editOrderId ? t('edit_bill') : t('new_sale_entry')}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">{editOrderId ? 'Update existing transaction' : 'Green Wash Co Ledger System'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto grid lg:grid-cols-12 print:hidden uppercase">
          <div className="lg:col-span-8 p-4 sm:p-8 space-y-8 scrollbar-hide">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('assign_party')}</label>
                    <button
                      type="button"
                      onClick={() => navigate('/customers?add=true&returnTo=/orders?openEntry=true')}
                      className="text-[10px] font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <Plus size={10} strokeWidth={3} /> {t('add_customer')}
                    </button>
                  </div>
                  <div className="relative group" ref={dropdownRef}>
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500" />
                    <input
                      type="text"
                      className="w-full h-11 pl-11 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold appearance-none focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all uppercase"
                      placeholder="Search Customer by Name or Mobile..."
                      value={customerSearch}
                      onFocus={() => setIsCustomerDropdownOpen(true)}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setIsCustomerDropdownOpen(true);
                        if (selectedCustomerId && e.target.value !== selectedCustomer?.name) {
                          setSelectedCustomerId('');
                          setSelectedCustomer(null);
                        }
                      }}
                    />
                    {selectedCustomerId ? (
                      <button
                        onClick={() => {
                          setSelectedCustomerId('');
                          setSelectedCustomer(null);
                          setCustomerSearch('');
                          setIsCustomerDropdownOpen(true);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    ) : (
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    )}

                    {isCustomerDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl z-[120] max-h-64 overflow-y-auto overflow-x-hidden scrollbar-hide animate-in fade-in slide-in-from-top-2 duration-200">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map(c => (
                            <div
                              key={c.id}
                              onClick={() => handleSelectCustomer(c)}
                              className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors"
                            >
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-900">{c.name}</span>
                                <span className="text-[10px] font-bold text-slate-400">+{c.mobile}</span>
                              </div>
                              <div className="text-[9px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">SELECT</div>
                            </div>
                          ))
                        ) : (
                          <div className="p-5 text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching party found</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Contact Detail</label>
                  <div className="w-full h-11 px-5 bg-slate-100/50 border border-slate-100 rounded-xl flex items-center text-xs font-bold text-slate-500">
                    {selectedCustomer?.mobile || 'Search party to load mobile...'}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-tight">Invoice No</span>
                  <span className="text-slate-900 font-black">GWC {orderNo}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-tight">Entry Date</span>
                  <input type="date" className="bg-transparent border-none text-right font-black focus:ring-0 p-0 text-slate-800 uppercase" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-tight">Delivery Date</span>
                  <input type="date" className="bg-transparent border-none text-right font-black focus:ring-0 p-0 text-primary-600 uppercase" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-primary-500 rounded-full" />
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest text-lg">Billing Items</h4>
                </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase w-10 text-center">#</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase w-32">Service</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase w-48">Item Name</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase w-20 text-center">Qty</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase w-24 text-center">Unit</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase w-28 text-right">Rate</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase w-32 text-right">Amount</th>
                      <th className="p-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map((row, index) => (
                      <tr key={row.id} className="group hover:bg-slate-50/50">
                        <td className="p-2 text-center text-[10px] font-bold text-slate-400">{index + 1}</td>
                        <td className="p-2">
                          <select
                            className="w-full h-9 bg-transparent border-none rounded-lg text-xs font-bold focus:ring-0 appearance-none cursor-pointer uppercase"
                            value={row.category}
                            onChange={(e) => updateRow(row.id, { category: e.target.value, item_name: '', price: 0 })}
                          >
                            <option value="">Select Service...</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            list={`items-list-${row.id}`}
                            className="w-full h-9 px-3 bg-transparent border-none rounded-lg text-xs font-bold focus:ring-2 focus:ring-primary-500/20 uppercase"
                            placeholder="Item name..."
                            value={row.item_name}
                            onChange={(e) => {
                              const val = e.target.value;
                              const item = clothTypes.find(x => x.name === val && (!row.category || x.categories?.name === row.category));
                              if (item) {
                                const price = Number(item.wash_price) || 0;
                                updateRow(row.id, { item_id: item.id, item_name: item.name, price });
                              } else {
                                updateRow(row.id, { item_name: val, item_id: 'custom' });
                              }
                            }}
                          />
                          <datalist id={`items-list-${row.id}`}>
                            {clothTypes
                              .filter(ct => !row.category || (ct.categories?.name === row.category))
                              .map(ct => <option key={ct.id} value={ct.name} />)
                            }
                          </datalist>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step={row.unit === 'KG' ? "0.01" : "1"}
                            min="0"
                            className="w-full h-9 text-center bg-transparent border-none font-bold text-xs focus:ring-0"
                            value={row.qty}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateRow(row.id, { qty: row.unit === 'PCS' ? Math.round(val) : val });
                            }}
                          />
                        </td>
                        <td className="p-2">
                          <select
                            className="w-full h-9 bg-transparent border-none rounded-lg text-[10px] font-black focus:ring-0 appearance-none cursor-pointer uppercase text-center"
                            value={row.unit}
                            onChange={(e) => updateRow(row.id, { unit: e.target.value })}
                          >
                            <option value="PCS">PCS</option>
                            <option value="KG">KG</option>
                          </select>
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number" className="w-full h-9 text-right bg-transparent border-none font-bold text-xs focus:ring-0"
                            value={row.price} onChange={(e) => updateRow(row.id, { price: parseFloat(e.target.value) || 0 })}
                          />
                        </td>
                        <td className="p-2 text-right text-xs font-black text-slate-900 pr-4">₹{row.amount.toLocaleString()}</td>
                        <td className="p-2 text-center text-slate-300 hover:text-red-500 py-4">
                          <button onClick={() => removeRow(row.id)}><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleAddRow} className="flex items-center gap-2 text-xs font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors ml-2">
                <Plus size={14} className="stroke-[3]" /> Add Another Line Item
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 bg-slate-50/80 p-6 sm:p-8 flex flex-col justify-between border-t lg:border-t-0 uppercase">
            <div className="space-y-6">
              <div className="p-6 bg-white rounded-3xl border border-slate-100">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 text-center">Checkout Summary</h5>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span>Subtotal</span> <span className="text-slate-900">₹ {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span>Adjust / Discount</span>
                    <div className="flex items-center gap-1">
                      <select
                        className="h-8 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black px-1 uppercase focus:ring-0 outline-none cursor-pointer"
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as any)}
                      >
                        <option value="amount">₹</option>
                        <option value="percentage">%</option>
                      </select>
                      <input
                        type="number"
                        className="w-20 h-8 text-right bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black p-2 uppercase focus:ring-2 focus:ring-primary-500/20 outline-none"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  {/* Additional Charges Section */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('additional_charges')}</span>
                      <button
                        onClick={() => setShowCustomCharge(!showCustomCharge)}
                        className="text-[9px] font-black text-primary-600 uppercase"
                      >
                        {showCustomCharge ? t('cancel') : `+ ${t('custom')}`}
                      </button>
                    </div>

                    {showCustomCharge && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                        <input
                          type="text"
                          placeholder={t('label_text')}
                          className="w-full h-8 px-3 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold outline-none uppercase"
                          value={customChargeLabel}
                          onChange={(e) => setCustomChargeLabel(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder={t('amount_text')}
                            className="flex-1 h-8 px-3 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold outline-none"
                            value={customChargeAmount || ''}
                            onChange={(e) => setCustomChargeAmount(parseFloat(e.target.value) || 0)}
                          />
                          <button
                            onClick={addCustomCharge}
                            className="h-8 px-3 bg-primary-600 text-white rounded-lg text-[10px] font-bold"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: 'Carrybag', amount: 10 },
                        { label: 'Delivery Charge', amount: 30 },
                        { label: 'Fast Service', amount: 50 }
                      ].map(charge => {
                        const currentCharge = additionalCharges.find(c => c.label === charge.label);
                        const isActive = !!currentCharge;
                        return (
                          <div
                            key={charge.label}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${isActive
                              ? 'bg-primary-600 border-primary-600 text-white'
                              : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-primary-200 cursor-pointer'
                              }`}
                            onClick={() => !isActive && togglePredefinedCharge(charge.label, charge.amount)}
                          >
                            <span className="text-[9px] font-black uppercase tracking-tight" onClick={() => isActive && togglePredefinedCharge(charge.label, charge.amount)}>
                              {t(charge.label.toLowerCase().replace(' ', '_')) || charge.label}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded-lg">
                                <span className={`text-[10px] font-black ${isActive ? 'text-white' : 'text-slate-400'}`}>₹</span>
                                <input
                                  type="number"
                                  className={`w-10 bg-transparent border-none p-0 text-[10px] font-black focus:ring-0 ${isActive ? 'text-white' : 'text-slate-400'}`}
                                  value={isActive ? currentCharge.amount : charge.amount}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    if (isActive) {
                                      updateChargeAmount(charge.label, val);
                                    } else {
                                      // Optional: Allow editing even before toggle, but for now just toggle on edit
                                      setAdditionalCharges(prev => [...prev, { label: charge.label, amount: val }]);
                                    }
                                  }}
                                />
                              </div>
                              {isActive && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); togglePredefinedCharge(charge.label, charge.amount); }}
                                  className="p-1 hover:bg-white/10 rounded-md"
                                >
                                  <X size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {additionalCharges.filter(c => !['Carrybag', 'Delivery Charge', 'Fast Service'].includes(c.label)).map(c => (
                      <div key={c.label} className="flex items-center justify-between px-3 py-2 bg-primary-50 border border-primary-100 rounded-xl">
                        <span className="text-[9px] font-black text-primary-900 uppercase">{c.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-primary-600">₹{c.amount}</span>
                          <button onClick={() => removeCharge(c.label)} className="text-primary-300 hover:text-rose-500">
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-600 bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                    <span>Advance Received</span>
                    <input type="number" className="w-20 h-8 text-right bg-white border border-emerald-200 rounded-lg text-[10px] font-black p-2 uppercase focus:ring-2 focus:ring-emerald-500/20" value={advanceAmount} onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex flex-col items-center">
                    <span className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest text-center">Remaining Balance</span>
                    <span className="text-2xl font-black text-red-500 tracking-tighter text-center">₹ {(grandTotal - advanceAmount).toLocaleString()}</span>
                  </div>
                  <div className="pt-2 flex flex-col items-center">
                    <span className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest text-center">Grand Total</span>
                    <span className="text-4xl font-black text-primary-600 tracking-tighter text-center">₹ {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="p-5 bg-indigo-600 rounded-3xl text-white">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle size={16} className="text-indigo-200" />
                  <h6 className="text-[10px] font-bold uppercase tracking-widest">Digital Ledger Note</h6>
                </div>
                <p className="text-[10px] text-indigo-100 leading-relaxed font-medium">Order is being recorded in live database. Receipt can be generated after saving.</p>
              </div>
            </div>
            <div className="space-y-3 mt-8">
              <button onClick={handleSave} disabled={loading || !selectedCustomerId} className="w-full h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-[2rem] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex flex-col items-center justify-center">
                <span className="text-sm font-black tracking-widest uppercase">{editOrderId ? t('update_order') : t('save_order')}</span>
                <span className="text-[8px] font-bold opacity-70 tracking-tighter">{editOrderId ? t('confirm_changes') : t('confirm_transaction')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* HIDDEN CAPTURE AREA FOR PDF GENERATION */}
        {isSuccess && (
          <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px' }}>
            <div id="hidden-receipt-capture" style={{ background: 'white', padding: '20px' }}>
              <PrintReceipt isCapture={true} orderData={{
                orderNo: createdOrder?.order_number ? `GWC${createdOrder.order_number}` : 'GWC' + createdOrderId.slice(0, 4).toUpperCase(),
                date: new Date(createdOrder?.created_at || Date.now()).toLocaleDateString('en-GB'),
                dueDate: formatDateSafe(dueDate),
                customerName: selectedCustomer?.name || 'Customer',
                customerAddress: selectedCustomer?.address || '',
                customerPhone: selectedCustomer?.mobile || '',
                items: rows.filter(r => r.item_name.trim() !== '').map((r, idx) => ({
                  id: idx.toString(),
                  name: r.item_name,
                  category: r.category,
                  qty: r.qty,
                  price: r.price,
                  amount: r.amount
                })),
                additionalCharges,
                subTotal: subtotal,
                discount: discountAmount,
                total: grandTotal,
                advance: advanceAmount,
                balance: (grandTotal - advanceAmount),
                paymentInfo: vendorPayment ? {
                  upiId: vendorPayment.upi_id,
                  qrCodeUrl: vendorPayment.qr_code_url,
                  qrCodeText: vendorPayment.qr_code_text,
                  accountHolderName: vendorPayment.account_holder_name,
                } : null,
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
