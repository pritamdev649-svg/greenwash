import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@backend/config/supabase';
import { authService } from '@backend/services/authService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ data: null, error: null }),
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🧪 Check for Local Bypass Session (handled via service logic check if needed, but we check flag here)
    const demoSession = localStorage.getItem('sb-demo-session');
    if (demoSession === 'true') {
      setUser({ email: 'admin@greenwashco.com', id: 'local-admin', user_metadata: {} } as any);
      setSession({ user: { email: 'admin@greenwashco.com' } } as any);
      setLoading(false);
      return;
    }

    // Initial fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // ONLY update if we aren't in a demo session
      if (localStorage.getItem('sb-demo-session') !== 'true') {
        setSession(session);
        setUser(session?.user ?? null);
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
    
    return response;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
