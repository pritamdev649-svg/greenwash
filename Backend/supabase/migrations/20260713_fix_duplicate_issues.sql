-- ============================================================
-- GreenWashCo v2.1 — Database Sequence Fix (Safe / Non-destructive)
-- Run this script in your Supabase Dashboard SQL Editor
-- ============================================================

-- Reset the order_number sequence generator to the maximum order_number in the orders table
-- This fixes the duplicate key error when saving new bills/orders.
SELECT setval(
  pg_get_serial_sequence('public.orders', 'order_number'),
  COALESCE((SELECT MAX(order_number) FROM public.orders), 1000)
);
