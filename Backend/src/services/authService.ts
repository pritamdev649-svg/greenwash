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

  async getUserProfile(userId: string, currentUser?: any): Promise<UserProfile | null> {
    if (userId === 'local-admin') {
      return {
        id: 'local-admin',
        role: 'super_admin',
        admin_id: null,
        vendor_id: null,
        customer_id: null,
        name: 'Super Admin',
        is_active: true,
      };
    }

    // First check user_profiles table (vendor/admin/super_admin)
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) return data as UserProfile;

    // Fallback: check auth user metadata for customer accounts
    let user = currentUser;
    if (!user) {
      const { data: { user: fetchedUser } } = await supabase.auth.getUser();
      user = fetchedUser;
    }
    const meta = user?.user_metadata || {};
    if (meta.role === 'customer') {
      return {
        id: userId,
        role: 'customer',
        customer_id: meta.customer_id || null,
        admin_id: null,
        vendor_id: null,
        name: meta.name || null,
        is_active: true,
      };
    }

    return null;
  },

  async signOut() {
    localStorage.removeItem('sb-demo-session');
    localStorage.removeItem('sb-demo-role');
    await supabase.auth.signOut();
  },

  /** Convert a phone number into a deterministic internal email for Supabase auth. */
  phoneToEmail(phone: string) {
    const digits = phone.replace(/\D/g, '');
    return `${digits}@customer.greenwashco.com`;
  },

  /** Resolve login identifier (phone or email) to the email used in Supabase auth. */
  resolveEmail(identifier: string) {
    const isPhone = /^[0-9+\-()\s]{7,15}$/.test(identifier.trim());
    return isPhone ? this.phoneToEmail(identifier) : identifier.trim();
  },

  async customerSignUp(data: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    vendorId?: string;
  }) {
    const authEmail = data.email?.trim() || this.phoneToEmail(data.phone);
    const mobile = data.phone.replace(/\D/g, '');

    // Check if phone already registered
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('mobile', mobile)
      .maybeSingle();
    if (existing) {
      return { data: null, error: new Error('This phone number is already registered. Please sign in.') };
    }

    // Create auth user — store role + customer info in user metadata
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: authEmail,
      password: data.password,
      options: {
        data: {
          role: 'customer',
          name: data.name.trim(),
          phone: mobile,
        },
      },
    });

    if (signUpError) return { data: null, error: signUpError };
    if (!authData.user) return { data: null, error: new Error('Signup failed — no user returned.') };

    // Create customer record
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .insert([{
        name: data.name.trim(),
        mobile,
        email: data.email?.trim() || null,
        vendor_id: data.vendorId || null,
      }])
      .select()
      .single();

    if (custError) return { data: null, error: custError };

    // Store customer_id back into user metadata so we can retrieve it on login
    await supabase.auth.updateUser({
      data: { customer_id: customer.id },
    });

    const profile: UserProfile = {
      id: authData.user.id,
      role: 'customer',
      customer_id: customer.id,
      admin_id: null,
      vendor_id: null,
      name: data.name.trim(),
      is_active: true,
    };

    return {
      data: {
        user: authData.user,
        session: authData.session,
        role: 'customer' as const,
        userProfile: profile,
      },
      error: null,
    };
  },

  async customerSignIn(identifier: string, password: string) {
    const email = this.resolveEmail(identifier);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return { data: null, error };
    if (!data.session) return { data: null, error: new Error('No session returned.') };

    const meta = data.user.user_metadata || {};

    // Validate this is a customer account
    if (meta.role !== 'customer') {
      await supabase.auth.signOut();
      return { data: null, error: new Error('This account is not a customer account. Please use Admin Login.') };
    }

    const profile: UserProfile = {
      id: data.user.id,
      role: 'customer',
      customer_id: meta.customer_id || null,
      admin_id: null,
      vendor_id: null,
      name: meta.name || null,
      is_active: true,
    };

    return {
      data: {
        ...data,
        role: 'customer' as const,
        userProfile: profile,
      },
      error: null,
    };
  },
};
