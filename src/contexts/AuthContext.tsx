import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@backend/config/supabase';
import { authService } from '@backend/services/authService';
import type { UserRole, UserProfile } from '../types/hierarchy';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole | null;
  userProfile: UserProfile | null;
  vendorId: string | null;
  adminId: string | null;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: null,
  userProfile: null,
  vendorId: null,
  adminId: null,
  signIn: async () => ({ data: null, error: null }),
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const applyProfile = (profile: UserProfile | null) => {
    setRole(profile?.role ?? null);
    setUserProfile(profile);
  };

  useEffect(() => {
    const demoSession = localStorage.getItem('sb-demo-session');
    if (demoSession === 'true') {
      const demoUser = { email: 'admin@greenwashco.com', id: 'local-admin', user_metadata: {} } as any;
      const demoProfile: UserProfile = {
        id: 'local-admin',
        role: 'super_admin',
        admin_id: null,
        vendor_id: null,
        name: 'Super Admin',
        is_active: true,
      };
      setUser(demoUser);
      setSession({ user: demoUser } as any);
      applyProfile(demoProfile);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const profile = await authService.getUserProfile(s.user.id);
        applyProfile(profile);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (localStorage.getItem('sb-demo-session') === 'true') return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const profile = await authService.getUserProfile(s.user.id);
        applyProfile(profile);
      } else {
        applyProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await authService.signIn(email, password);
    if (response.data?.session) {
      setSession(response.data.session);
      setUser(response.data.session.user as any);
    }
    // Demo bypass returns role directly
    if (response.data?.role) {
      applyProfile(response.data.userProfile ?? null);
    }
    return response;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
    applyProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        userProfile,
        vendorId: userProfile?.vendor_id ?? null,
        adminId: userProfile?.admin_id ?? null,
        signIn,
        signOut,
      }}
    >
      {loading ? (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
