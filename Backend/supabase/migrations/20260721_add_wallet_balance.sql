-- ============================================================
-- GreenWashCo — Wallet Balance & Coins Schema Migration
-- Run in Supabase SQL Editor if columns are missing
-- ============================================================

-- Add wallet_balance and coins columns if they do not exist
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;
