import { supabase } from '../config/supabase';

export const offerService = {
  async getAllOffers() {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getActiveOffers() {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async addOffer(offer: { 
    image_url: string; 
    title?: string; 
    subtext?: string; 
    points?: string[]; 
    button_text?: string 
  }) {
    const { data, error } = await supabase
      .from('offers')
      .insert([offer])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadImage(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `promotions/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('promotions')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('promotions')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async updateOffer(id: string, updates: any) {
    const { data, error } = await supabase
      .from('offers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteOffer(id: string) {
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async toggleOfferStatus(id: string, currentStatus: boolean) {
    const { data, error } = await supabase
      .from('offers')
      .update({ is_active: !currentStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
