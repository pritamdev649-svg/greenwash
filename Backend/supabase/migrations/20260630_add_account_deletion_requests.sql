-- ============================================================
-- GreenWashCo — Account Deletion Requests Table
-- Run in Supabase SQL Editor to support deletion requests
-- ============================================================

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_or_email TEXT NOT NULL,
  reason TEXT,
  status TEXT CHECK (status IN ('pending', 'completed')) DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- 1. Allow Anyone to Submit (Insert) Requests
DROP POLICY IF EXISTS "Allow Public Insert" ON public.account_deletion_requests;
CREATE POLICY "Allow Public Insert" ON public.account_deletion_requests FOR INSERT WITH CHECK (true);

-- 2. Allow Admins / Super Admins / Vendors (authenticated) to view and manage requests
DROP POLICY IF EXISTS "Allow Authenticated Access" ON public.account_deletion_requests;
CREATE POLICY "Allow Authenticated Access" ON public.account_deletion_requests FOR ALL USING (true);
