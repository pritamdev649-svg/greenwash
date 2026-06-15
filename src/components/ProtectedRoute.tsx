import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/hierarchy';

const Spinner = () => (
  <div className="flex h-screen w-full items-center justify-center bg-slate-50">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 border-4 border-primary-200 rounded-full animate-ping opacity-25" />
      <div className="absolute inset-0 border-t-4 border-primary-600 rounded-full animate-spin" />
    </div>
  </div>
);

/** Redirects unauthenticated users to home. */
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/" replace />;
  return <>{children}</>;
};

/**
 * Restricts a route to specific roles.
 * If authenticated but wrong role, redirects to the correct home dashboard.
 */
export const RoleRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { session, loading, role } = useAuth();

  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/" replace />;

  // Role not yet loaded — wait
  if (!role) return <Spinner />;

  if (!allowedRoles.includes(role)) {
    // Redirect to the correct dashboard for their actual role
    if (role === 'super_admin') return <Navigate to="/super-admin/dashboard" replace />;
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
