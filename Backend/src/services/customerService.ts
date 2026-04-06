import { supabase } from '../config/supabase';

export const customerService = {
  /**
   * Fetch all customers with their branch name
   */
  async getAllCustomers(withDetails = true) {
    try {
      console.log("customerService.getAllCustomers started, withDetails:", withDetails);
      
      const selectStr = withDetails ? `
          *,
          branch:branches(name),
          orders:orders(total_amount, balance_amount, payment_status)
        ` : '*';

      const { data, error } = await supabase
        .from('customers')
        .select(selectStr)
        .order('name');
      
      if (error) {
        console.error("customerService.getAllCustomers error:", error);
        throw error;
      }
      
      console.log("customerService.getAllCustomers fetched count:", data?.length);

      if (!withDetails) return data || [];

      // Process data to calculate totals
      const processedData = (data || []).map(customer => {
        const orders = (customer as any).orders || [];
        const total_orders = orders.length;
        const pending_amount = orders.reduce((sum: number, o: any) => sum + Number(o.balance_amount || 0), 0);
        
        return {
          ...(customer as any),
          total_orders,
          pending_amount
        };
      });

      return processedData;
    } catch (err) {
      console.error("customerService.getAllCustomers fatal err:", err);
      throw err;
    }
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
  },

  /**
   * Update an existing customer
   */
  async updateCustomer(id: string, updates: Partial<{ name: string; mobile: string; email: string; address: string; branch_id: string }>) {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  /**
   * Delete a customer (Will fail if they have orders due to FK constraints)
   */
  async deleteCustomer(id: string) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};
