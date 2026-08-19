import { supabase } from '../config/supabase';
import { notificationService } from './notificationService';
import type { UserRole, UserProfile } from '../../../src/types/hierarchy';

const normalizePhone = (phone: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, ''); // keep only digits
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

// Store OTPs in memory: mobile -> { code, expiresAt }
const otpStore = new Map<string, { code: string; expiresAt: number }>();

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
    const cleanMobile = normalizePhone(phone);
    return `${cleanMobile}@customer.greenwashco.com`;
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
    const mobile = normalizePhone(data.phone);
    if (!mobile) {
      return { data: null, error: new Error('Invalid phone number.') };
    }

    const authEmail = this.phoneToEmail(mobile);

    // Check if phone already registered in customers table
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id, email')
      .eq('mobile', mobile)
      .maybeSingle();

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

    if (signUpError) {
      if (signUpError.message?.toLowerCase().includes('already registered') || signUpError.status === 422) {
        return { data: null, error: new Error('This phone number is already registered. Please sign in.') };
      }
      return { data: null, error: signUpError };
    }

    if (!authData.user) return { data: null, error: new Error('Signup failed — no user returned.') };

    let customerId = existingCustomer?.id;

    if (existingCustomer) {
      const { data: updated, error: updateErr } = await supabase
        .from('customers')
        .update({
          name: data.name.trim(),
          email: data.email?.trim() || existingCustomer.email || null,
        })
        .eq('id', existingCustomer.id)
        .select()
        .single();
      if (!updateErr && updated) {
        customerId = updated.id;
      }
    } else {
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
      customerId = customer.id;
    }

    // Store customer_id back into user metadata so we can retrieve it on login
    await supabase.auth.updateUser({
      data: { customer_id: customerId },
    });

    // Sign out to prevent automatic login on sign up
    await supabase.auth.signOut();

    const profile: UserProfile = {
      id: authData.user.id,
      role: 'customer',
      customer_id: customerId || null,
      admin_id: null,
      vendor_id: null,
      name: data.name.trim(),
      is_active: true,
    };

    return {
      data: {
        user: authData.user,
        session: null,
        role: 'customer' as const,
        userProfile: profile,
      },
      error: null,
    };
  },

  async customerSignIn(identifier: string, password: string) {
    const trimmed = identifier.trim();
    const isPhone = /^[0-9+\-()\s]{7,15}$/.test(trimmed);
    const cleanMobile = isPhone ? normalizePhone(trimmed) : '';

    const candidateEmails: string[] = [];

    if (isPhone && cleanMobile) {
      // 1. Synthetic phone email with normalized 10 digits
      candidateEmails.push(this.phoneToEmail(cleanMobile));

      // 2. Synthetic phone email with raw digits (in case old account was created without 10-digit normalization)
      const rawDigits = trimmed.replace(/\D/g, '');
      if (rawDigits && rawDigits !== cleanMobile) {
        candidateEmails.push(`${rawDigits}@customer.greenwashco.com`);
      }

      // 3. Lookup customer record by mobile in DB to see if an actual email was stored
      try {
        const { data: cust } = await supabase
          .from('customers')
          .select('email')
          .eq('mobile', cleanMobile)
          .maybeSingle();
        if (cust?.email && !candidateEmails.includes(cust.email)) {
          candidateEmails.push(cust.email);
        }
      } catch (e) {
        console.warn('Customer lookup during signIn warning:', e);
      }
    } else {
      // Input is an email address
      candidateEmails.push(trimmed);

      // Lookup customer by email to see if their phone synthetic email was used for Auth
      try {
        const { data: cust } = await supabase
          .from('customers')
          .select('mobile')
          .eq('email', trimmed)
          .maybeSingle();
        if (cust?.mobile) {
          const phoneEmail = this.phoneToEmail(cust.mobile);
          if (!candidateEmails.includes(phoneEmail)) {
            candidateEmails.push(phoneEmail);
          }
        }
      } catch (e) {
        console.warn('Customer email lookup during signIn warning:', e);
      }
    }

    let lastError: any = null;
    let authResult: any = null;

    for (const emailCandidate of candidateEmails) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailCandidate,
        password,
      });

      if (!error && data?.session) {
        authResult = data;
        lastError = null;
        break;
      } else {
        lastError = error;
      }
    }

    if (lastError || !authResult) {
      return { data: null, error: lastError || new Error('Invalid login credentials.') };
    }

    const data = authResult;
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

  async sendCustomerOtp(phone: string) {
    const cleanMobile = normalizePhone(phone);
    if (!cleanMobile || cleanMobile.length < 10) {
      return { data: null, error: new Error('Please enter a valid 10-digit mobile number.') };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    otpStore.set(cleanMobile, { code, expiresAt });

    const message = `Your Green Wash Co verification OTP is: ${code}. Valid for 5 minutes.`;

    try {
      await notificationService.sendAutomatedWhatsApp(cleanMobile, message);
    } catch (e) {
      console.warn('WhatsApp OTP send error:', e);
    }

    console.log(`[OTP GENERATED for ${cleanMobile}]: ${code}`);

    return {
      data: {
        success: true,
        mobile: cleanMobile,
        otpCode: code,
        message: `OTP sent to +91 ${cleanMobile}`,
      },
      error: null,
    };
  },

  async verifyCustomerOtp(phone: string, otpInput: string, nameForNewUser?: string) {
    const cleanMobile = normalizePhone(phone);
    if (!cleanMobile) {
      return { data: null, error: new Error('Please enter a valid mobile number.') };
    }

    const stored = otpStore.get(cleanMobile);

    if (!stored) {
      return { data: null, error: new Error('OTP expired or not requested. Please click "Resend OTP".') };
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(cleanMobile);
      return { data: null, error: new Error('OTP has expired. Please request a new OTP.') };
    }

    if (stored.code !== otpInput.trim()) {
      return { data: null, error: new Error('Invalid OTP code. Please check and try again.') };
    }

    // Clear used OTP
    otpStore.delete(cleanMobile);

    const authEmail = this.phoneToEmail(cleanMobile);
    const otpPassword = `GW#Otp_${cleanMobile}`;

    const { data: existingCust } = await supabase
      .from('customers')
      .select('id, name, mobile, email')
      .eq('mobile', cleanMobile)
      .maybeSingle();

    let { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: otpPassword,
    });

    if (signInErr || !signInData?.session) {
      const customerName = nameForNewUser?.trim() || existingCust?.name || `Customer ${cleanMobile.slice(-4)}`;

      const { data: signUpData } = await supabase.auth.signUp({
        email: authEmail,
        password: otpPassword,
        options: {
          data: {
            role: 'customer',
            name: customerName,
            phone: cleanMobile,
          },
        },
      });

      let customerId = existingCust?.id;
      if (!existingCust) {
        const { data: newCust, error: newCustErr } = await supabase
          .from('customers')
          .insert([{
            name: customerName,
            mobile: cleanMobile,
          }])
          .select()
          .single();
        if (!newCustErr && newCust) {
          customerId = newCust.id;
        }
      }

      if (signUpData?.user && customerId) {
        await supabase.auth.updateUser({
          data: { customer_id: customerId },
        });
      }

      const { data: reData } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: otpPassword,
      });

      if (reData?.session) {
        signInData = reData;
      } else {
        const profile: UserProfile = {
          id: signUpData?.user?.id || existingCust?.id || cleanMobile,
          role: 'customer',
          customer_id: customerId || existingCust?.id || null,
          admin_id: null,
          vendor_id: null,
          name: customerName,
          is_active: true,
        };

        return {
          data: {
            user: signUpData?.user || { id: cleanMobile, user_metadata: { role: 'customer' } },
            session: signUpData?.session || null,
            role: 'customer' as const,
            userProfile: profile,
          },
          error: null,
        };
      }
    }

    const meta = signInData?.user?.user_metadata || {};
    const profile: UserProfile = {
      id: signInData.user.id,
      role: 'customer',
      customer_id: meta.customer_id || existingCust?.id || null,
      admin_id: null,
      vendor_id: null,
      name: meta.name || existingCust?.name || null,
      is_active: true,
    };

    return {
      data: {
        ...signInData,
        role: 'customer' as const,
        userProfile: profile,
      },
      error: null,
    };
  },
};
