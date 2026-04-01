import { supabase } from '../config/supabase';

export const customerService = {
  /**
   * Fetch all customers with their branch name
   */
  async getAllCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        branch:branches(name),
        orders:orders(total_amount, balance_amount, payment_status)
      `)
      .order('name');
    
    if (error) throw error;
    
    // Process data to calculate totals
    const processedData = (data || []).map(customer => {
      const orders = customer.orders || [];
      const total_orders = orders.length;
      const pending_amount = orders.reduce((sum: number, o: any) => sum + Number(o.balance_amount || 0), 0);
      
      return {
        ...customer,
        total_orders,
        pending_amount
      };
    });

    return processedData;
  },

  /**
   * Add a new customer
   */
  async addCustomer(customer: { name: string; mobile: string; email: string; address: string; branch_id: string }) {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  /**
   * Fetch all orders for a specific customer
   */
  async getCustomerOrders(customerId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items:order_items(
          quantity,
          subtotal,
          cloth_type:cloth_types(name)
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};
