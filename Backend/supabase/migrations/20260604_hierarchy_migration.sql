-- ============================================================
-- GreenWashCo v2.0 — Multi-Level Hierarchy Migration
-- Super Admin → Admin → Vendor (Branch)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ==========================================
-- 1. ADMINS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  city TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.admins;
CREATE POLICY "Public Read/Write Access" ON public.admins FOR ALL USING (true);

-- ==========================================
-- 2. VENDORS TABLE (each existing Branch becomes a Vendor)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  email TEXT UNIQUE,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.vendors;
CREATE POLICY "Public Read/Write Access" ON public.vendors FOR ALL USING (true);

-- ==========================================
-- 3. VENDOR PAYMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.vendor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL UNIQUE REFERENCES public.vendors(id) ON DELETE CASCADE,
  upi_id TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  bank_name TEXT,
  account_holder_name TEXT,
  qr_code_url TEXT,
  qr_code_text TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.vendor_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.vendor_payments;
CREATE POLICY "Public Read/Write Access" ON public.vendor_payments FOR ALL USING (true);

-- ==========================================
-- 4. USER PROFILES TABLE (links auth.users to roles)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'vendor')),
  admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.user_profiles;
CREATE POLICY "Public Read/Write Access" ON public.user_profiles FOR ALL USING (true);

-- ==========================================
-- 5. AUDIT LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  user_role TEXT,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.audit_logs;
CREATE POLICY "Public Read/Write Access" ON public.audit_logs FOR ALL USING (true);

-- ==========================================
-- 6. ACTIVITY LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  user_role TEXT,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.activity_logs;
CREATE POLICY "Public Read/Write Access" ON public.activity_logs FOR ALL USING (true);

-- ==========================================
-- 7. ADD vendor_id TO EXISTING TABLES (non-breaking)
-- ==========================================

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;

ALTER TABLE public.cloth_types
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;

ALTER TABLE public.pricing
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;

-- ==========================================
-- 8. BRANCH → VENDOR MIGRATION (idempotent)
-- Creates one Vendor record per existing Branch
-- ==========================================
INSERT INTO public.vendors (name, branch_id, phone, address, is_active, created_at)
SELECT
  name          AS name,
  id            AS branch_id,
  phone,
  address,
  true          AS is_active,
  created_at
FROM public.branches
WHERE id NOT IN (
  SELECT branch_id FROM public.vendors WHERE branch_id IS NOT NULL
);

-- ==========================================
-- 9. BACKFILL vendor_id ON customers & orders
-- ==========================================
UPDATE public.customers c
SET vendor_id = v.id
FROM public.vendors v
WHERE c.branch_id = v.branch_id
  AND c.vendor_id IS NULL
  AND c.branch_id IS NOT NULL;

UPDATE public.orders o
SET vendor_id = v.id
FROM public.vendors v
WHERE o.branch_id = v.branch_id
  AND o.vendor_id IS NULL
  AND o.branch_id IS NOT NULL;

-- Backfill vendor_id on cloth_types, categories, offers, pricing
-- These tables may not have branch_id, so we assign the first/only vendor
-- (for single-branch setups this is correct; multi-branch owners must reassign manually)
UPDATE public.cloth_types ct
SET vendor_id = v.id
FROM public.vendors v
WHERE ct.vendor_id IS NULL
  AND v.branch_id IS NOT NULL;

UPDATE public.categories cat
SET vendor_id = v.id
FROM public.vendors v
WHERE cat.vendor_id IS NULL
  AND v.branch_id IS NOT NULL;

UPDATE public.offers o
SET vendor_id = v.id
FROM public.vendors v
WHERE o.vendor_id IS NULL
  AND v.branch_id IS NOT NULL;

UPDATE public.pricing p
SET vendor_id = v.id
FROM public.vendors v
WHERE p.vendor_id IS NULL
  AND v.branch_id IS NOT NULL;

-- ==========================================
-- 10. PERFORMANCE INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_customers_vendor_id   ON public.customers(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id       ON public.orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at      ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendors_admin_id       ON public.vendors(admin_id);
CREATE INDEX IF NOT EXISTS idx_vendors_branch_id      ON public.vendors(branch_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role     ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_vendor   ON public.user_profiles(vendor_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin    ON public.user_profiles(admin_id);

-- ============================================================
-- HOW TO SET UP ADMIN / VENDOR LOGINS
-- ============================================================
-- 1. Create a Supabase auth user from Authentication > Users dashboard
--    (or use the backend API endpoint POST /api/auth/create-user)
-- 2. Copy the new user's UUID from auth.users
-- 3. Insert their profile:
--
--    For an Admin:
--    INSERT INTO public.user_profiles (id, role, admin_id, name)
--    VALUES ('<auth_user_uuid>', 'admin', '<admin_table_id>', 'Admin Name');
--
--    For a Vendor:
--    INSERT INTO public.user_profiles (id, role, vendor_id, name)
--    VALUES ('<auth_user_uuid>', 'vendor', '<vendor_table_id>', 'Vendor Name');
-- ============================================================
