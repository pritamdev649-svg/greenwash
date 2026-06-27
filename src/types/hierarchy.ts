// GreenWashCo Hierarchy Types
// Super Admin → Admin → Vendor

export type UserRole = 'super_admin' | 'admin' | 'vendor' | 'customer';

export interface UserProfile {
  id: string;
  role: UserRole;
  admin_id: string | null;
  vendor_id: string | null;
  customer_id: string | null;
  name: string | null;
  is_active: boolean;
}

export interface AdminData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Computed fields
  vendor_count?: number;
}

export interface VendorData {
  id: string;
  name: string;
  branch_id: string | null;
  admin_id: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  admins?: { name: string; email: string } | null;
  branches?: { name: string } | null;
  // Computed fields
  order_count?: number;
  customer_count?: number;
  total_revenue?: number;
}

export interface VendorPayment {
  id: string;
  vendor_id: string;
  upi_id: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_name: string | null;
  account_holder_name: string | null;
  qr_code_url: string | null;
  qr_code_text: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_role: string | null;
  user_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface PlatformStats {
  totalAdmins: number;
  totalVendors: number;
  activeVendors: number;
  inactiveVendors: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingRevenue: number;
  todayOrders: number;
  todaySales: number;
  salesTrend: Array<{ date: string; orders: number; sales: number }>;
  recentOrders: Array<{
    id: string;
    order_number: number;
    created_at: string;
    total_amount: number;
    customers: { name: string } | null;
    vendors: { name: string } | null;
  }>;
  topVendors: Array<{
    id: string;
    name: string;
    todayOrders: number;
    todaySales: number;
    totalSales: number;
  }>;
}

export interface AdminStats {
  totalVendors: number;
  activeVendors: number;
  totalOrders: number;
  totalRevenue: number;
  pendingRevenue: number;
  todayOrders: number;
  salesTrend: Array<{ date: string; orders: number; sales: number }>;
  vendorPerformance: Array<{
    id: string;
    name: string;
    todayOrders: number;
    totalOrders: number;
    totalSales: number;
    is_active: boolean;
  }>;
}

export interface VendorStats {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  todaySales: number;
  todayOrders: number;
  salesTrend: Array<{ date: string; orders: number; sales: number }>;
  recentOrders: Array<{
    id: string;
    order_number: number;
    created_at: string;
    total_amount: number;
    customers: { name: string } | null;
  }>;
}
