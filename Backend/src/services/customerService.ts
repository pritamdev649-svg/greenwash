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
          custom_item_name,
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

  async setCustomerCoins(customerId: string, coins: number) {
    const newCoins = Math.max(0, coins);
    const { data, error } = await supabase
      .from('customers')
      .update({ coins: newCoins })
      .eq('id', customerId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateCustomerCoins(customerId: string, coinsChange: number) {
    const { data: customer, error: fetchErr } = await supabase
      .from('customers')
      .select('coins')
      .eq('id', customerId)
      .single();
    if (fetchErr) throw fetchErr;

    const newCoins = Math.max(0, (customer?.coins || 0) + coinsChange);

    const { data, error } = await supabase
      .from('customers')
      .update({ coins: newCoins })
      .eq('id', customerId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateCustomerWallet(customerId: string, walletChange: number) {
    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('wallet_balance, coins')
        .eq('id', customerId)
        .maybeSingle();

      const currentBal = Number((customer as any)?.wallet_balance ?? (customer as any)?.coins ?? 0);
      const newBal = Math.max(0, currentBal + walletChange);

      const { data, error } = await supabase
        .from('customers')
        .update({ wallet_balance: newBal })
        .eq('id', customerId)
        .select();

      if (error) {
        console.warn("Wallet column update error, trying coins column:", error);
        const { data: coinsData } = await supabase
          .from('customers')
          .update({ coins: newBal })
          .eq('id', customerId)
          .select();
        return coinsData?.[0] ? { ...coinsData[0], wallet_balance: coinsData[0].coins || newBal } : { wallet_balance: newBal };
      }
      return data?.[0] || { wallet_balance: newBal };
    } catch (err) {
      console.warn("Wallet update fallback triggered:", err);
      return { wallet_balance: walletChange };
    }
  },

  async setCustomerWallet(customerId: string, walletBalance: number) {
    try {
      const newBal = Math.max(0, walletBalance);
      const { data, error } = await supabase
        .from('customers')
        .update({ wallet_balance: newBal })
        .eq('id', customerId)
        .select();

      if (error) {
        const { data: coinsData } = await supabase
          .from('customers')
          .update({ coins: newBal })
          .eq('id', customerId)
          .select();
        return coinsData?.[0] ? { ...coinsData[0], wallet_balance: coinsData[0].coins || newBal } : { wallet_balance: newBal };
      }
      return data?.[0] || { wallet_balance: newBal };
    } catch (err) {
      console.warn("Wallet set fallback triggered:", err);
      return { wallet_balance: walletBalance };
    }
  }
};
