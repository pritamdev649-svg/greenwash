import { supabase } from '../config/supabase';

export const branchService = {
  /**
   * Fetch all branches with error handling
   */
  async getAllBranches() {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Add a new branch
   */
  async addBranch(name: string, address: string, phone: string) {
    const { data, error } = await supabase
      .from('branches')
      .insert([{ name, address, phone }])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  /**
   * Update an existing branch
   */
  async updateBranch(id: string, name: string, address: string, phone: string) {
    const { data, error } = await supabase
      .from('branches')
      .update({ name, address, phone })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  /**
   * Delete a branch by ID
   */
  async deleteBranch(id: string) {
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};
