import { supabase } from '../config/supabase';
import type { PlatformStats, AuditLog } from '../../../src/types/hierarchy';

export const superAdminService = {
  async getPlatformStats(): Promise<PlatformStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const [
      { count: totalAdmins },
      { data: vendors },
      { count: totalCustomers },
      { data: orders },
    ] = await Promise.all([
      supabase.from('admins').select('*', { count: 'exact', head: true }),
      supabase.from('vendors').select('id, name, is_active'),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase
        .from('orders')
        .select('id, order_number, total_amount, payment_status, created_at, vendor_id, customers(name), vendors(name)')
        .gte('created_at', oneYearAgo.toISOString())
        .neq('order_status', 'Cancelled')
        .order('created_at', { ascending: false })
        .limit(2000),
    ]);

    const vendorList = vendors ?? [];
    const orderList = orders ?? [];

    // Sales trend (last 365 days)
    const trendMap = new Map<string, { orders: number; sales: number }>();
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trendMap.set(d.toISOString().split('T')[0], { orders: 0, sales: 0 });
    }
    orderList.forEach((o) => {
      const dateStr = new Date(o.created_at).toISOString().split('T')[0];
      if (trendMap.has(dateStr)) {
        const cur = trendMap.get(dateStr)!;
        trendMap.set(dateStr, { orders: cur.orders + 1, sales: cur.sales + Number(o.total_amount) });
      }
    });

    // Top vendors by total sales
    const vendorSalesMap = new Map<string, { orders: number; sales: number; todayOrders: number; todaySales: number }>();
    vendorList.forEach((v: { id: string }) => vendorSalesMap.set(v.id, { orders: 0, sales: 0, todayOrders: 0, todaySales: 0 }));
    orderList.forEach((o) => {
      if (!o.vendor_id) return;
      const cur = vendorSalesMap.get(o.vendor_id) ?? { orders: 0, sales: 0, todayOrders: 0, todaySales: 0 };
      const isToday = new Date(o.created_at) >= today;
      vendorSalesMap.set(o.vendor_id, {
        orders: cur.orders + 1,
        sales: cur.sales + Number(o.total_amount),
        todayOrders: cur.todayOrders + (isToday ? 1 : 0),
        todaySales: cur.todaySales + (isToday ? Number(o.total_amount) : 0),
      });
    });

    const topVendors = vendorList
      .map((v: { id: string; name: string }) => {
        const stats = vendorSalesMap.get(v.id) ?? { orders: 0, sales: 0, todayOrders: 0, todaySales: 0 };
        return { id: v.id, name: v.name, totalOrders: stats.orders, totalSales: stats.sales, todayOrders: stats.todayOrders, todaySales: stats.todaySales };
      })
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10);

    const todayOrders = orderList.filter((o) => new Date(o.created_at) >= today);

    return {
      totalAdmins: totalAdmins ?? 0,
      totalVendors: vendorList.length,
      activeVendors: vendorList.filter((v: { is_active: boolean }) => v.is_active).length,
      inactiveVendors: vendorList.filter((v: { is_active: boolean }) => !v.is_active).length,
      totalCustomers: totalCustomers ?? 0,
      totalOrders: orderList.length,
      totalRevenue: orderList
        .filter((o) => o.payment_status === 'paid')
        .reduce((s, o) => s + Number(o.total_amount), 0),
      pendingRevenue: orderList
        .filter((o) => o.payment_status !== 'paid')
        .reduce((s, o) => s + Number(o.total_amount), 0),
      todayOrders: todayOrders.length,
      todaySales: todayOrders.reduce((s, o) => s + Number(o.total_amount), 0),
      salesTrend: Array.from(trendMap.entries()).map(([date, d]) => ({ date, ...d })),
      recentOrders: orderList.slice(0, 10).map((o) => ({
        id: o.id,
        order_number: o.order_number,
        created_at: o.created_at,
        total_amount: Number(o.total_amount),
        customers: Array.isArray(o.customers) ? o.customers[0] : (o.customers as { name: string } | null),
        vendors: Array.isArray(o.vendors) ? o.vendors[0] : (o.vendors as { name: string } | null),
      })),
      topVendors,
    };
  },

  async getAuditLogs(filters?: {
    role?: string;
    entity_type?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.role) query = query.eq('user_role', filters.role);
    if (filters?.entity_type) query = query.eq('entity_type', filters.entity_type);
    if (filters?.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters?.dateTo) query = query.lte('created_at', filters.dateTo);
    query = query.limit(filters?.limit ?? 200);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as AuditLog[];
  },

  async writeAuditLog(entry: {
    user_id?: string;
    user_role?: string;
    user_email?: string;
    action: string;
    entity_type?: string;
    entity_id?: string;
    old_data?: Record<string, unknown>;
    new_data?: Record<string, unknown>;
  }): Promise<void> {
    await supabase.from('audit_logs').insert([entry]);
  },
};
