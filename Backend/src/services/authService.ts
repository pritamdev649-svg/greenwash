import { supabase } from '../config/supabase';
import type { UserRole, UserProfile } from '../../../src/types/hierarchy';

export const authService = {
  async signIn(email: string, password: string) {
    // Super Admin dev bypass
    if (email === 'admin@greenwashco.com' && password === 'ironwala$99') {
      localStorage.setItem('sb-demo-session', 'true');
      localStorage.setItem('sb-demo-role', 'super_admin');
      const user = { email: 'admin@greenwashco.com', id: 'local-admin', user_metadata: {} };
      const profile: UserProfile = {
        id: 'local-admin',
        role: 'super_admin',
        admin_id: null,
        vendor_id: null,
        name: 'Super Admin',
        is_active: true,
      };
      return {
        data: {
          user,
          session: { user, access_token: 'local-demo-token', refresh_token: 'local-demo-refresh' } as any,
          role: 'super_admin' as UserRole,
          userProfile: profile,
        },
        error: null,
      };
    }

    // Real Supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) return { data, error };

    // Fetch role from user_profiles
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      data: {
        ...data,
        role: (profile?.role ?? null) as UserRole | null,
        userProfile: profile as UserProfile | null,
      },
      error: null,
    };
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (userId === 'local-admin') {
      return {
        id: 'local-admin',
        role: 'super_admin',
        admin_id: null,
        vendor_id: null,
        name: 'Super Admin',
        is_active: true,
      };
    }

    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data as UserProfile | null;
  },

  async signOut() {
    localStorage.removeItem('sb-demo-session');
    localStorage.removeItem('sb-demo-role');
    await supabase.auth.signOut();
  },
};
