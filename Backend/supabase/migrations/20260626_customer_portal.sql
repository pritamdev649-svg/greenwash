-- ============================================================
-- GreenWashCo — Customer Portal Migration
-- Adds customer role support to user_profiles
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Allow 'customer' role in user_profiles
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'vendor', 'customer'));

-- 2. Add customer_id column to user_profiles (links to customers table)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- 3. Ensure customers table has vendor_id column (already exists in most setups)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;

-- 4. Add scheduled_orders table for future scheduling feature
CREATE TABLE IF NOT EXISTS public.scheduled_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  vendor_id   UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  schedule_type TEXT CHECK (schedule_type IN ('one_time', 'weekly', 'monthly')) DEFAULT 'one_time',
  pickup_date DATE NOT NULL,
  pickup_time TEXT,
  notes TEXT,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.scheduled_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.scheduled_orders;
CREATE POLICY "Public Read/Write Access" ON public.scheduled_orders FOR ALL USING (true);
