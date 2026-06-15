import { supabase } from '../config/supabase';

export type PricingItem = {
  id: string;
  category: string;
  item: string;
  price: string;
}

export const pricingService = {
  async getAllPricing(vendorId?: string | null) {
    let query = supabase
      .from('pricing')
      .select('*')
      .order('category', { ascending: true })
      .order('item', { ascending: true });
    if (vendorId) query = query.eq('vendor_id', vendorId);
    const { data, error } = await query;
    if (error) throw error;
    return data as PricingItem[];
  },

  async addPricingItem(data: Omit<PricingItem, 'id'> & { vendor_id?: string | null }) {
    const { data: result, error } = await supabase
      .from('pricing')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  async deletePricingItem(id: string) {
    const { error } = await supabase
      .from('pricing')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updatePricingItem(id: string, updates: Partial<PricingItem>) {
    const { data, error } = await supabase
      .from('pricing')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
