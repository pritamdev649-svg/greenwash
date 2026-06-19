import { supabase } from '../config/supabase';
import type { UserRole, UserProfile } from '../../../src/types/hierarchy';

export const authService = {
  async signIn(email: string, password: string) {
    console.log("=========================================");
    console.log("[AUTH DEBUG] 1. Starting signIn for:", email);
    
    try {
      console.log("[AUTH DEBUG] 3. Making network request to Supabase Auth API...");
      const startTime = Date.now();
      
      // Real Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      const timeTaken = Date.now() - startTime;
      console.log(`[AUTH DEBUG] 4. Network request finished in ${timeTaken}ms`);
      
      if (error) {
        console.error("[AUTH DEBUG] 5. Supabase returned an error:", error);
        return { data, error };
      }
      
      if (!data.session) {
        console.error("[AUTH DEBUG] 5. No session returned.");
        return { data, error: new Error("No session returned from Supabase.") };
      }

      // Fetch role from user_profiles
      console.log("[AUTH DEBUG] 6. Real auth succeeded. Fetching user profile for:", data.user.id);
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error("[AUTH DEBUG] 7. Error fetching user profile:", profileError);
      } else {
        console.log("[AUTH DEBUG] 7. Profile fetched successfully:", profile);
      }

      console.log("=========================================");
      return {
        data: {
          ...data,
          role: (profile?.role ?? null) as UserRole | null,
          userProfile: profile as UserProfile | null,
        },
        error: null,
      };
    } catch (networkError) {
      console.error("[AUTH DEBUG] CRITICAL: Network error or crash during signIn:", networkError);
      return { data: { user: null, session: null }, error: networkError };
    }
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
