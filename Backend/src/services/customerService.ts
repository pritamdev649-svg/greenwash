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
          wallet_balance: Number(customer.wallet_balance ?? customer.coins ?? 0),
          coins: Number(customer.coins ?? 0),
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
      let currentBal = 0;
      const { data: customer, error: fetchErr } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .maybeSingle();

      if (customer) {
        currentBal = Number(customer.wallet_balance ?? customer.coins ?? 0);
      } else if (fetchErr) {
        console.warn("Error fetching customer for wallet update:", fetchErr);
      }

      const newBal = Math.max(0, currentBal + walletChange);

      // Try updating wallet_balance column
      const { data, error } = await supabase
        .from('customers')
        .update({ wallet_balance: newBal })
        .eq('id', customerId)
        .select();

      if (!error && data && data.length > 0) {
        return { ...data[0], wallet_balance: newBal };
      }

      // Fallback: update coins column if wallet_balance fails or column does not exist
      console.warn("wallet_balance update error or 0 rows, updating coins column:", error);
      const { data: coinsData, error: coinsErr } = await supabase
        .from('customers')
        .update({ coins: newBal })
        .eq('id', customerId)
        .select();

      if (!coinsErr && coinsData && coinsData.length > 0) {
        return { ...coinsData[0], wallet_balance: newBal, coins: newBal };
      }

      throw error || coinsErr || new Error("Failed to update wallet balance in database");
    } catch (err) {
      console.error("updateCustomerWallet error:", err);
      throw err;
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

      if (!error && data && data.length > 0) {
        return { ...data[0], wallet_balance: newBal };
      }

      const { data: coinsData, error: coinsErr } = await supabase
        .from('customers')
        .update({ coins: newBal })
        .eq('id', customerId)
        .select();

      if (!coinsErr && coinsData && coinsData.length > 0) {
        return { ...coinsData[0], wallet_balance: newBal, coins: newBal };
      }

      throw error || coinsErr || new Error("Failed to set customer wallet balance in database");
    } catch (err) {
      console.error("setCustomerWallet error:", err);
      throw err;
    }
  }
};

