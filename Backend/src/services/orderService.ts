import { supabase } from '../config/supabase';
import { notificationService } from './notificationService';

export const orderService = {
  /**
   * Fetch all cloth types (pricing data)
   */
  async getAllClothTypes() {
    try {
      console.log("orderService.getAllClothTypes started");
      const { data, error } = await supabase
        .from('cloth_types')
        .select('*, categories(name)')
        .order('name');
      
      if (error) {
        console.warn("orderService.getAllClothTypes error (likely missing categories table):", error);
        // Fallback: try fetching without categories if it fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('cloth_types')
          .select('*')
          .order('name');
        if (fallbackError) {
          console.error("orderService.getAllClothTypes fallback failed:", fallbackError);
          throw fallbackError;
        }
        return (fallbackData || []).map((x: any) => ({ ...x, categories: { name: 'Uncategorized' } }));
      }
      return data || [];
    } catch (err) {
      console.error("orderService.getAllClothTypes fatal:", err);
      throw err;
    }
  },

  async getAllCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async addCategory(name: string) {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name }])
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
   * Fetch all orders with customer and item details
   */
  async getAllOrders() {
    const { data, error } = await supabase
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
    
    if (error) throw error;
    return data || [];
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
          id, quantity, wash_price, iron_price, subtotal,
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
  async createOrder(customerId: string, branchId: string, totalAmount: number, items: any[], advanceAmount: number = 0, discountAmount: number = 0, dueDate: string | null = null) {
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
   * Fetch aggregate statistics for the dashboard
   */
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      { count: customerCount },
      { data: orders },
      { data: branchStats }
    ] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total_amount, payment_status, created_at, branch_id, branches(name)'),
      supabase.from('branches').select(`
        id,
        name,
        orders:orders(total_amount, created_at)
      `)
    ]);

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
      branchPerformance: (branchStats || []).map(b => {
        const branchOrders = (b as any).orders || [];
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
