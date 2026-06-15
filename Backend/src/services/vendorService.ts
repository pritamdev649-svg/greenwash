import { supabase } from '../config/supabase';
import type { VendorData, VendorPayment, VendorStats } from '../../../src/types/hierarchy';

export const vendorService = {
  // ──────────────────────────────────────────────────────────
  // VENDOR CRUD
  // ──────────────────────────────────────────────────────────

  async getAllVendors(adminId?: string | null): Promise<VendorData[]> {
    let query = supabase
      .from('vendors')
      .select(`
        *,
        admins(name, email),
        branches(name)
      `)
      .order('created_at', { ascending: false });

    if (adminId) query = query.eq('admin_id', adminId);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as VendorData[];
  },

  async getVendorById(id: string): Promise<VendorData | null> {
    const { data, error } = await supabase
      .from('vendors')
      .select(`
        *,
        admins(name, email),
        branches(name)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as VendorData;
  },

  async createVendor(payload: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    admin_id?: string;
    created_by?: string;
  }): Promise<VendorData> {
    // 1. Create vendor record
    const { data: vendor, error: vErr } = await supabase
      .from('vendors')
      .insert([{ ...payload, is_active: true }])
      .select()
      .single();
    if (vErr) throw vErr;

    // 2. Mirror as a branch for backward-compatibility
    const { data: branch, error: bErr } = await supabase
      .from('branches')
      .insert([{
        name: payload.name,
        address: payload.address ?? null,
        phone: payload.phone ?? null,
      }])
      .select()
      .single();
    if (bErr) throw bErr;

    // 3. Link branch back to vendor
    const { data: updated, error: uErr } = await supabase
      .from('vendors')
      .update({ branch_id: branch.id })
      .eq('id', vendor.id)
      .select()
      .single();
    if (uErr) throw uErr;

    return updated as VendorData;
  },

  async updateVendor(id: string, updates: Partial<VendorData>): Promise<VendorData> {
    const { data, error } = await supabase
      .from('vendors')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    // Sync branch name/address if changed
    if (updates.name || updates.address || updates.phone) {
      const vendor = data as VendorData;
      if (vendor.branch_id) {
        const branchUpdate: Record<string, string> = {};
        if (updates.name) branchUpdate.name = updates.name;
        if (updates.address) branchUpdate.address = updates.address;
        if (updates.phone) branchUpdate.phone = updates.phone;
        await supabase.from('branches').update(branchUpdate).eq('id', vendor.branch_id);
      }
    }

    return data as VendorData;
  },

  async deleteVendor(id: string): Promise<void> {
    const { error } = await supabase.from('vendors').delete().eq('id', id);
    if (error) throw error;
  },

  async toggleVendorStatus(id: string, isActive: boolean): Promise<VendorData> {
    const { data, error } = await supabase
      .from('vendors')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as VendorData;
  },

  async assignAdmin(vendorId: string, adminId: string): Promise<VendorData> {
    const { data, error } = await supabase
      .from('vendors')
      .update({ admin_id: adminId, updated_at: new Date().toISOString() })
      .eq('id', vendorId)
      .select()
      .single();
    if (error) throw error;
    return data as VendorData;
  },

  // ──────────────────────────────────────────────────────────
  // VENDOR AUTH USER
  // ──────────────────────────────────────────────────────────

  async createVendorAuthUser(vendorId: string, email: string, password: string): Promise<void> {
    // Save the caller's current session so we can restore it after signUp()
    // (signUp automatically signs in the new user, which would kill the caller's session)
    const { data: { session: callerSession } } = await supabase.auth.getSession();

    const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
    if (authErr) throw authErr;
    if (!authData.user) throw new Error('User creation failed');

    const { error: profileErr } = await supabase.from('user_profiles').insert([{
      id: authData.user.id,
      role: 'vendor',
      vendor_id: vendorId,
      name: email.split('@')[0],
      is_active: true,
    }]);
    if (profileErr) throw profileErr;

    // Sign out the newly created vendor session
    await supabase.auth.signOut();

    // Restore the caller's real session if they had one (real super admin, not demo bypass)
    if (callerSession?.access_token && callerSession.refresh_token) {
      await supabase.auth.setSession({
        access_token: callerSession.access_token,
        refresh_token: callerSession.refresh_token,
      });
    }
    // Demo bypass users (sb-demo-session in localStorage) are unaffected because
    // AuthContext's onAuthStateChange guard skips updates while demo session is active
  },

  // ──────────────────────────────────────────────────────────
  // PAYMENT SETTINGS
  // ──────────────────────────────────────────────────────────

  async getVendorPayment(vendorId: string): Promise<VendorPayment | null> {
    const { data, error } = await supabase
      .from('vendor_payments')
      .select('*')
      .eq('vendor_id', vendorId)
      .maybeSingle();
    if (error) throw error;
    return data as VendorPayment | null;
  },

  async upsertVendorPayment(
    vendorId: string,
    payment: Partial<Omit<VendorPayment, 'id' | 'vendor_id' | 'created_at' | 'updated_at'>>
  ): Promise<VendorPayment> {
    const { data, error } = await supabase
      .from('vendor_payments')
      .upsert(
        [{ ...payment, vendor_id: vendorId, updated_at: new Date().toISOString() }],
        { onConflict: 'vendor_id' }
      )
      .select()
      .single();
    if (error) throw error;
    return data as VendorPayment;
  },

  // ──────────────────────────────────────────────────────────
  // VENDOR STATS (for admin/super_admin dashboards)
  // ──────────────────────────────────────────────────────────

  async getVendorStats(vendorId: string): Promise<Partial<VendorStats>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      { count: customerCount },
      { data: orders },
    ] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('vendor_id', vendorId),
      supabase.from('orders').select('total_amount, payment_status, created_at').eq('vendor_id', vendorId).neq('order_status', 'Cancelled'),
    ]);

    const totalRevenue = orders?.filter(o => o.payment_status === 'paid').reduce((s, o) => s + Number(o.total_amount), 0) ?? 0;
    const todayOrders = orders?.filter(o => new Date(o.created_at) >= today) ?? [];

    return {
      totalCustomers: customerCount ?? 0,
      totalOrders: orders?.length ?? 0,
      totalRevenue,
      pendingPayments: orders?.filter(o => o.payment_status !== 'paid').reduce((s, o) => s + Number(o.total_amount), 0) ?? 0,
      todaySales: todayOrders.reduce((s, o) => s + Number(o.total_amount), 0),
      todayOrders: todayOrders.length,
    };
  },

  async getVendorsByAdmin(adminId: string): Promise<VendorData[]> {
    return this.getAllVendors(adminId);
  },
};
