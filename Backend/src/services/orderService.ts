import { supabase } from '../config/supabase';
import { notificationService } from './notificationService';

export const orderService = {
  /**
   * Fetch all cloth types (pricing data)
   */
  async getAllClothTypes(vendorId?: string | null) {
    try {
      let query = supabase.from('cloth_types').select('*, categories(name)').order('name');
      if (vendorId) query = query.eq('vendor_id', vendorId);

      const { data, error } = await query;
      if (error) {
        console.warn("orderService.getAllClothTypes error (likely missing categories table):", error);
        let fallbackQuery = supabase.from('cloth_types').select('*').order('name');
        if (vendorId) fallbackQuery = fallbackQuery.eq('vendor_id', vendorId);
        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        if (fallbackError) throw fallbackError;
        return (fallbackData || []).map((x: any) => ({ ...x, categories: { name: 'Uncategorized' } }));
      }
      return data || [];
    } catch (err) {
      console.error("orderService.getAllClothTypes fatal:", err);
      throw err;
    }
  },

  async getAllCategories(vendorId?: string | null) {
    let query = supabase.from('categories').select('*').order('name');
    if (vendorId) query = query.eq('vendor_id', vendorId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async addCategory(name: string, vendorId?: string | null) {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, vendor_id: vendorId ?? null }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCategory(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async addClothType(item: any) {
    const { data, error } = await supabase.from('cloth_types').insert(item).select().single();
    if (error) throw error;
    return data;
  },

  async updateClothType(id: string, updates: any) {
    const { data, error } = await supabase.from('cloth_types').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteClothType(id: string) {
    const { error } = await supabase.from('cloth_types').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  /**
   * Fetch all orders with customer and item details.
   * Pass vendorId to scope results to a specific vendor.
   */
  async getAllOrders(vendorId?: string | null) {
    if (typeof window !== 'undefined' && localStorage.getItem('sb-demo-session') === 'true') {
      return [
        {
          id: 'demo-1',
          order_number: '1001',
          customers: { name: 'John Doe', mobile: '+91 9876543210' },
          branches: { name: 'Main Branch' },
          total_amount: 450,
          order_status: 'Ready',
          payment_status: 'paid',
          created_at: new Date().toISOString()
        },
        {
          id: 'demo-2',
          order_number: '1002',
          customers: { name: 'Alice Smith', mobile: '+91 9876543211' },
          branches: { name: 'Downtown Branch' },
          total_amount: 1200,
          order_status: 'Washing',
          payment_status: 'pending',
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'demo-3',
          order_number: '1003',
          customers: { name: 'Bob Johnson', mobile: '+91 9876543212' },
          branches: { name: 'Main Branch' },
          total_amount: 850,
          order_status: 'Processing',
          payment_status: 'partially_paid',
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ];
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_number,
        customers(name, mobile),
        branches(name),
        order_items(count)
      `)
      .order('created_at', { ascending: false })
      .limit(2000);

    if (vendorId) query = query.eq('vendor_id', vendorId);

    try {
      // Add a simple timeout to prevent indefinite hanging if Supabase is unreachable
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase timeout")), 5000));
      const { data, error } = await Promise.race([query, timeoutPromise]) as any;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching orders:", err);
      return []; // Return empty array instead of hanging
    }
  },

  /**
   * Fetch complete order details for printing
   */
  async getOrderById(id: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_number,
        customers (name, mobile, address),
        order_items (
          id, quantity, wash_price, iron_price, subtotal, custom_item_name,
          cloth_types (name)
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Create a new order with items
   */
  async createOrder(customerId: string, branchId: string, totalAmount: number, items: any[], advanceAmount: number = 0, discountAmount: number = 0, dueDate: string | null = null, vendorId?: string | null) {
    const netAmount = totalAmount; // Total amount passed already has discount subtract if was using grandTotal
    // Let's assume totalAmount passed is THE FINAL BILL total.
    // If we want to store SUB-TOTAL and DISCOUNT, we should.

    const balanceAmount = netAmount - advanceAmount;
    const paymentStatus = (advanceAmount >= netAmount && netAmount > 0) ? 'paid' : (advanceAmount > 0 ? 'partially_paid' : 'pending');

    // 1. Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_id: customerId,
        branch_id: branchId,
        vendor_id: vendorId ?? null,
        total_amount: netAmount,
        advance_amount: advanceAmount,
        balance_amount: balanceAmount,
        discount_amount: discountAmount,
        due_date: dueDate,
        payment_status: paymentStatus
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // items logic ...
    const orderItems = items.map(item => ({
      order_id: order.id,
      cloth_type_id: item.cloth_type_id,
      custom_item_name: item.item_name,
      quantity: item.quantity,
      wash_price: item.wash_price,
      iron_price: item.iron_price,
      dry_clean_price: item.dry_clean_price || 0,
      subtotal: item.subtotal
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return order;
  },

  /**
   * Update payment status (Paid / Pending / Partially Paid)
   */
  async updatePaymentStatus(orderId: string, status: 'paid' | 'pending' | 'partially_paid') {
    const { data, error } = await supabase
      .from('orders')
      .update({ payment_status: status })
      .eq('id', orderId)
      .select();

    if (error) throw error;
    return data[0];
  },

  /**
   * Update an existing order and its items
   */
  async updateOrder(orderId: string, orderData: any, items: any[]) {
    // 1. Update main order record
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        customer_id: orderData.customerId,
        branch_id: orderData.branchId,
        total_amount: orderData.totalAmount,
        advance_amount: orderData.advanceAmount,
        balance_amount: orderData.totalAmount - orderData.advanceAmount,
        discount_amount: orderData.discountAmount,
        due_date: orderData.dueDate,
        payment_status: (orderData.advanceAmount >= orderData.totalAmount && orderData.totalAmount > 0) ? 'paid' : (orderData.advanceAmount > 0 ? 'partially_paid' : 'pending'),
      })
      .eq('id', orderId);

    if (orderError) throw orderError;

    // 2. Delete existing items
    const { error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    if (deleteError) throw deleteError;

    // 3. Insert new items
    const orderItems = items.map(item => ({
      order_id: orderId,
      cloth_type_id: item.cloth_type_id,
      custom_item_name: item.item_name || item.custom_item_name,
      quantity: item.quantity,
      wash_price: item.wash_price,
      iron_price: item.iron_price,
      subtotal: item.subtotal
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return { id: orderId };
  },

  /**
   * Update order lifecycle status
   */
  async updateOrderStatus(orderId: string, status: string) {
    // 1. Update the record
    const { data, error } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', orderId)
      .select(`
        *,
        customers(name, mobile),
        branches(name)
      `);

    if (error) throw error;
    const order = data[0];

    // 2. Automate Notification if status is 'Ready'
    if (status === 'Ready' && order?.customers?.mobile) {
      const branchName = order.branches?.name || 'our branch';
      const orderRef = order.order_number ? `GWC${order.order_number}` : 'GWC' + order.id.slice(0, 4).toUpperCase();
      const mobile = order.customers.mobile;

      const orderDate = new Date(order.created_at).toLocaleDateString('en-GB');
      const dueDate = order.due_date ? order.due_date.split('-').reverse().join('/') : orderDate;

      const message = `Greetings from Green Wash Co.\n` +
        `We are pleased to have you as a valuable customer. Your laundry order ${orderRef} is cleaned and ready for pickup at our ${branchName}!\n\n` +
        `Invoice No:-${orderRef}\n` +
        `Order Date: ${orderDate}\n` +
        `Due Date: ${dueDate}\n\n` +
        `Total Amount: ₹${Number(order.total_amount).toLocaleString()}\n` +
        `Balance: ₹${Number(order.balance_amount || 0).toLocaleString()}\n\n` +
        `Please visit us during business hours. Thank you! 👕✨`;

      // Automated send (Simulated placeholder for now)
      await notificationService.sendAutomatedWhatsApp(mobile, message);
    }

    return order;
  },

  /**
   * Fetch aggregate statistics for the dashboard.
   * Pass vendorId to scope to a specific vendor (Vendor role).
   */
  async getDashboardStats(vendorId?: string | null) {
    if (typeof window !== 'undefined' && localStorage.getItem('sb-demo-session') === 'true') {
      const todaySales = 12500;
      return {
        totalCustomers: 124,
        totalOrders: 89,
        totalRevenue: 45000,
        pendingPayments: 5200,
        todaySales: todaySales,
        todayOrders: 15,
        salesTrend: [
          { date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], orders: 12, sales: 9000 },
          { date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0], orders: 15, sales: 11000 },
          { date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], orders: 8, sales: 5000 },
          { date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], orders: 20, sales: 14000 },
          { date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0], orders: 18, sales: 13500 },
          { date: new Date().toISOString().split('T')[0], orders: 15, sales: todaySales },
        ],
        branchPerformance: [
          { name: 'Main Branch', todayOrders: 10, todaySales: 8500, totalSales: 30000 },
          { name: 'Downtown Branch', todayOrders: 5, todaySales: 4000, totalSales: 15000 }
        ],
        recentOrders: [
          { id: '1', order_number: '1001', created_at: new Date().toISOString(), total_amount: 450, customer: { name: 'John Doe' } },
          { id: '2', order_number: '1002', created_at: new Date(Date.now() - 3600000).toISOString(), total_amount: 1200, customer: { name: 'Alice Smith' } },
          { id: '3', order_number: '1003', created_at: new Date(Date.now() - 7200000).toISOString(), total_amount: 850, customer: { name: 'Bob Johnson' } }
        ]
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    oneYearAgo.setHours(0, 0, 0, 0);

    let customersQuery = supabase.from('customers').select('*', { count: 'exact', head: true });
    if (vendorId) customersQuery = customersQuery.eq('vendor_id', vendorId);

    let ordersQuery = supabase.from('orders')
      .select('total_amount, payment_status, created_at, branch_id, branches(name)')
      .gte('created_at', oneYearAgo.toISOString())
      .neq('order_status', 'Cancelled');
    if (vendorId) ordersQuery = ordersQuery.eq('vendor_id', vendorId);

    let branchQuery = supabase.from('branches').select(`
      id,
      name,
      orders:orders(total_amount, created_at, order_status)
    `);

    const [
      { count: customerCount },
      { data: orders },
      { data: branchStats }
    ] = await Promise.all([
      customersQuery,
      ordersQuery,
      branchQuery,
    ]);

    // Calculate sales trend for a longer period (365 days) to support various timeframes
    const rangeDays = 365;
    const trendMap = new Map();
    // Pre-fill last 365 days with 0s
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      trendMap.set(dateStr, { orders: 0, sales: 0 });
    }

    orders?.forEach(o => {
      const dateStr = new Date(o.created_at).toISOString().split('T')[0];
      if (trendMap.has(dateStr)) {
        const current = trendMap.get(dateStr);
        trendMap.set(dateStr, {
          orders: current.orders + 1,
          sales: current.sales + Number(o.total_amount)
        });
      }
    });

    const salesTrend = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      ...data
    }));

    const stats = {
      totalCustomers: customerCount || 0,
      totalOrders: orders?.length || 0,
      totalRevenue: orders?.filter(o => o.payment_status === 'paid')
        .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0,
      pendingPayments: orders?.filter(o => o.payment_status === 'pending')
        .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0,
      todaySales: orders?.filter(o => new Date(o.created_at) >= today)
        .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0,
      todayOrders: orders?.filter(o => new Date(o.created_at) >= today).length || 0,
      salesTrend,
      branchPerformance: (branchStats || []).map(b => {
        const branchOrders = ((b as any).orders || []).filter((o: any) => o.order_status !== 'Cancelled');
        const todayBranchOrders = branchOrders.filter((o: any) => new Date(o.created_at) >= today);
        return {
          name: b.name,
          todayOrders: todayBranchOrders.length,
          todaySales: todayBranchOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0),
          totalSales: branchOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0)
        };
      }),
      recentOrders: ((await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          created_at,
          total_amount,
          customers (name)
        `)
        .neq('order_status', 'Cancelled')
        .order('created_at', { ascending: false })
        .limit(5)).data || []).map((o: any) => ({
          ...o,
          customer: Array.isArray(o.customers) ? o.customers[0] : o.customers
        }))
    };

    return stats;
  },

  /**
   * Delete an order record
   */
  async deleteOrder(id: string) {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  /**
   * Final payout - collect remaining balance
   */
  async collectBalance(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({
        balance_amount: 0,
        payment_status: 'paid'
      })
      .eq('id', orderId)
      .select();

    if (error) throw error;
    return data[0];
  }
};
