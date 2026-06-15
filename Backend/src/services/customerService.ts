import { supabase } from '../config/supabase';

export const customerService = {
  /**
   * Fetch customers. Pass vendorId to scope to a specific vendor.
   */
  async getAllCustomers(withDetails = true, vendorId?: string | null) {
    try {
      const selectStr = withDetails ? `
          *,
          branch:branches(name),
          orders:orders(total_amount, balance_amount, payment_status)
        ` : '*';

      let query = supabase.from('customers').select(selectStr).order('name');
      if (vendorId) query = query.eq('vendor_id', vendorId);

      const { data, error } = await query;
      if (error) throw error;
      if (!withDetails) return data || [];

      return (data || []).map((customer: any) => {
        const orders = customer.orders || [];
        return {
          ...customer,
          total_orders: orders.length,
          pending_amount: orders.reduce((sum: number, o: any) => sum + Number(o.balance_amount || 0), 0),
        };
      });
    } catch (err) {
      console.error('customerService.getAllCustomers error:', err);
      throw err;
    }
  },

  /**
   * Add a new customer. Optionally link vendor_id.
   */
  async addCustomer(customer: {
    name: string;
    mobile: string;
    email?: string;
    address?: string;
    branch_id?: string;
    vendor_id?: string | null;
  }) {
    const { data, error } = await supabase.from('customers').insert([customer]).select();
    if (error) throw error;
    return data[0];
  },

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

  async updateCustomer(id: string, updates: Partial<{
    name: string;
    mobile: string;
    email: string;
    address: string;
    branch_id: string;
    vendor_id: string | null;
  }>) {
    const { data, error } = await supabase.from('customers').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },

  async deleteCustomer(id: string) {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};
