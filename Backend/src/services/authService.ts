import { supabase } from '../config/supabase';

export const authService = {
  /**
   * Admin Login Bypass for Development
   */
  async signIn(email: string, password: string) {
    // 🧪 LOCAL BYPASS for Admin Development
    if (email === 'admin@ironwala.com' && password === 'admin123') {
      localStorage.setItem('sb-demo-session', 'true');
      const user = { email: 'admin@ironwala.com', id: 'local-admin', user_metadata: {} };
      return { 
        data: { 
          user, 
          session: { user, access_token: 'local-demo-token', refresh_token: 'local-demo-refresh' } as any 
        }, 
        error: null 
      };
    }

    // 🚀 REAL SUPABASE AUTH
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  },

  /**
   * Sign Out and Clear Session
   */
  async signOut() {
    localStorage.removeItem('sb-demo-session');
    await supabase.auth.signOut();
  }
};
