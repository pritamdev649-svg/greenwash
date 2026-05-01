import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Branches from './pages/Branches';
import Customers from './pages/Customers';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import SaleOrder from './pages/SaleOrder';
import PublicReceipt from './pages/PublicReceipt';
import Settings from './pages/Settings';
import Offers from './pages/Offers';
import Pricing from './pages/Pricing';
import PricingManager from './pages/PricingManager';

const App: React.FC = () => {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/receipt/:id" element={<PublicReceipt />} />

            {/* Protected Admin Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/branches"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Branches />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Customers />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Categories />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Orders />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sale-order"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SaleOrder />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/offers"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Offers />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pricing-manager"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PricingManager />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Settings />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
};

export default App;
