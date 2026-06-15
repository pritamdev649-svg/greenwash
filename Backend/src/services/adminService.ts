import { supabase } from '../config/supabase';
import type { AdminData, AdminStats } from '../../../src/types/hierarchy';

export const adminService = {
  // ──────────────────────────────────────────────────────────
  // ADMIN CRUD
  // ──────────────────────────────────────────────────────────

  async getAllAdmins(): Promise<AdminData[]> {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as AdminData[];
  },

  async getAdminById(id: string): Promise<AdminData | null> {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as AdminData;
  },

  async createAdmin(payload: {
    name: string;
    email: string;
    phone?: string;
    city?: string;
    created_by?: string;
  }): Promise<AdminData> {
    const { data, error } = await supabase
      .from('admins')
      .insert([{ ...payload, is_active: true }])
      .select()
      .single();
    if (error) throw error;
    return data as AdminData;
  },

  async createAdminAuthUser(adminId: string, email: string, password: string): Promise<void> {
    const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
    if (authErr) throw authErr;
    if (!authData.user) throw new Error('User creation failed');

    const { error: profileErr } = await supabase.from('user_profiles').insert([{
      id: authData.user.id,
      role: 'admin',
      admin_id: adminId,
      name: email.split('@')[0],
      is_active: true,
    }]);
    if (profileErr) throw profileErr;
  },

  async updateAdmin(id: string, updates: Partial<AdminData>): Promise<AdminData> {
    const { data, error } = await supabase
      .from('admins')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as AdminData;
  },

  async deleteAdmin(id: string): Promise<void> {
    const { error } = await supabase.from('admins').delete().eq('id', id);
    if (error) throw error;
  },

  async toggleAdminStatus(id: string, isActive: boolean): Promise<AdminData> {
    const { data, error } = await supabase
      .from('admins')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as AdminData;
  },

  // ──────────────────────────────────────────────────────────
  // ADMIN STATS (for super admin dashboard)
  // ──────────────────────────────────────────────────────────

  async getAdminStats(adminId: string): Promise<AdminStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      { data: vendors },
      { data: orders },
    ] = await Promise.all([
      supabase.from('vendors').select('id, name, is_active').eq('admin_id', adminId),
      supabase
        .from('orders')
        .select('total_amount, payment_status, created_at, vendor_id')
        .in(
          'vendor_id',
          (await supabase.from('vendors').select('id').eq('admin_id', adminId)).data?.map((v: { id: string }) => v.id) ?? []
        )
        .neq('order_status', 'Cancelled'),
    ]);

    const vendorIds = (vendors ?? []).map((v: { id: string }) => v.id);
    const rangeDays = 30;
    const trendMap = new Map<string, { orders: number; sales: number }>();
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trendMap.set(d.toISOString().split('T')[0], { orders: 0, sales: 0 });
    }
    (orders ?? []).forEach((o: { created_at: string; total_amount: number }) => {
      const dateStr = new Date(o.created_at).toISOString().split('T')[0];
      if (trendMap.has(dateStr)) {
        const cur = trendMap.get(dateStr)!;
        trendMap.set(dateStr, { orders: cur.orders + 1, sales: cur.sales + Number(o.total_amount) });
      }
    });

    const vendorPerformance = await Promise.all(
      (vendors ?? []).map(async (v: { id: string; name: string; is_active: boolean }) => {
        const vOrders = (orders ?? []).filter((o: { vendor_id: string }) => o.vendor_id === v.id);
        const todayVOrders = vOrders.filter((o: { created_at: string }) => new Date(o.created_at) >= today);
        return {
          id: v.id,
          name: v.name,
          todayOrders: todayVOrders.length,
          totalOrders: vOrders.length,
          totalSales: vOrders.reduce((s: number, o: { total_amount: number }) => s + Number(o.total_amount), 0),
          is_active: v.is_active,
        };
      })
    );

    return {
      totalVendors: vendorIds.length,
      activeVendors: (vendors ?? []).filter((v: { is_active: boolean }) => v.is_active).length,
      totalOrders: orders?.length ?? 0,
      totalRevenue: (orders ?? []).filter((o: { payment_status: string }) => o.payment_status === 'paid').reduce((s: number, o: { total_amount: number }) => s + Number(o.total_amount), 0),
      pendingRevenue: (orders ?? []).filter((o: { payment_status: string }) => o.payment_status !== 'paid').reduce((s: number, o: { total_amount: number }) => s + Number(o.total_amount), 0),
      todayOrders: (orders ?? []).filter((o: { created_at: string }) => new Date(o.created_at) >= today).length,
      salesTrend: Array.from(trendMap.entries()).map(([date, d]) => ({ date, ...d })),
      vendorPerformance,
    };
  },
};
