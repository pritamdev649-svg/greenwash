import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { RoleRoute, CustomerRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import CustomerLayout from './layouts/CustomerLayout';

// Public
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import PublicReceipt from './pages/PublicReceipt';

// Customer
import CustomerLogin from './pages/customer/CustomerLogin';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerOrderDetail from './pages/customer/CustomerOrderDetail';
import CustomerNewOrder from './pages/customer/CustomerNewOrder';
import CustomerSchedule from './pages/customer/CustomerSchedule';
import CustomerProfile from './pages/customer/CustomerProfile';

// Vendor (existing)
import Dashboard from './pages/Dashboard';
import Branches from './pages/Branches';
import Customers from './pages/Customers';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import SaleOrder from './pages/SaleOrder';
import Settings from './pages/Settings';
import Offers from './pages/Offers';
import PricingManager from './pages/PricingManager';

// Super Admin
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import AdminManagement from './pages/superadmin/AdminManagement';
import SuperAdminVendors from './pages/superadmin/SuperAdminVendors';
import AuditLogs from './pages/superadmin/AuditLogs';
import SuperAdminOrders from './pages/superadmin/SuperAdminOrders';
import PlatformAnalytics from './pages/superadmin/PlatformAnalytics';
import SuperAdminSettings from './pages/superadmin/SuperAdminSettings';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import MyVendors from './pages/admin/MyVendors';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReports from './pages/admin/AdminReports';

const wrap = (role: Parameters<typeof RoleRoute>[0]['allowedRoles'], Page: React.ReactNode) => (
  <RoleRoute allowedRoles={role}>
    <DashboardLayout>{Page}</DashboardLayout>
  </RoleRoute>
);

const wrapCustomer = (Page: React.ReactNode) => (
  <CustomerRoute>
    <CustomerLayout>{Page}</CustomerLayout>
  </CustomerRoute>
);

const App: React.FC = () => {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            {/* ─── Public ─── */}
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/receipt/:id" element={<PublicReceipt />} />

            {/* ─── Customer ─── */}
            <Route path="/customer/login"      element={<CustomerLogin />} />
            <Route path="/customer/dashboard"  element={wrapCustomer(<CustomerDashboard />)} />
            <Route path="/customer/orders"     element={wrapCustomer(<CustomerOrders />)} />
            <Route path="/customer/orders/:id" element={wrapCustomer(<CustomerOrderDetail />)} />
            <Route path="/customer/schedule"   element={wrapCustomer(<CustomerSchedule />)} />
            <Route path="/customer/new-order"  element={wrapCustomer(<CustomerNewOrder />)} />
            <Route path="/customer/profile"    element={wrapCustomer(<CustomerProfile />)} />

            {/* ─── Vendor Routes ─── */}
            <Route path="/dashboard"       element={wrap(['vendor', 'super_admin', 'admin'], <Dashboard />)} />
            <Route path="/customers"       element={wrap(['vendor', 'super_admin', 'admin'], <Customers />)} />
            <Route path="/categories"      element={wrap(['vendor', 'super_admin', 'admin'], <Categories />)} />
            <Route path="/orders"          element={wrap(['vendor', 'super_admin', 'admin'], <Orders />)} />
            <Route path="/sale-order"      element={wrap(['vendor', 'super_admin', 'admin'], <SaleOrder />)} />
            <Route path="/offers"          element={wrap(['vendor', 'super_admin', 'admin'], <Offers />)} />
            <Route path="/pricing-manager" element={wrap(['vendor', 'super_admin', 'admin'], <PricingManager />)} />
            <Route path="/settings"        element={wrap(['vendor', 'super_admin', 'admin'], <Settings />)} />
            <Route path="/branches"        element={wrap(['vendor', 'super_admin', 'admin'], <Branches />)} />

            {/* ─── Super Admin Routes ─── */}
            <Route path="/super-admin/dashboard"  element={wrap(['super_admin'], <SuperAdminDashboard />)} />
            <Route path="/super-admin/admins"      element={wrap(['super_admin'], <AdminManagement />)} />
            <Route path="/super-admin/vendors"     element={wrap(['super_admin'], <SuperAdminVendors />)} />
            <Route path="/super-admin/orders"      element={wrap(['super_admin'], <SuperAdminOrders />)} />
            <Route path="/super-admin/analytics"   element={wrap(['super_admin'], <PlatformAnalytics />)} />
            <Route path="/super-admin/audit-logs"  element={wrap(['super_admin'], <AuditLogs />)} />
            <Route path="/super-admin/settings"    element={wrap(['super_admin'], <SuperAdminSettings />)} />

            {/* ─── Admin Routes ─── */}
            <Route path="/admin/dashboard" element={wrap(['admin', 'super_admin'], <AdminDashboard />)} />
            <Route path="/admin/vendors"   element={wrap(['admin', 'super_admin'], <MyVendors />)} />
            <Route path="/admin/orders"    element={wrap(['admin', 'super_admin'], <AdminOrders />)} />
            <Route path="/admin/reports"   element={wrap(['admin', 'super_admin'], <AdminReports />)} />

            {/* ─── Fallback ─── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
};

export default App;
