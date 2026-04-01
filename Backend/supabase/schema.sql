-- 1. Create Tables safely
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mobile TEXT NOT NULL UNIQUE,
  email TEXT,
  address TEXT,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cloth_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  wash_price DECIMAL(10,2) DEFAULT 0.00,
  iron_price DECIMAL(10,2) DEFAULT 0.00,
  dry_clean_price DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  total_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  advance_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  balance_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  due_date DATE,
  payment_status TEXT CHECK (payment_status IN ('paid', 'pending', 'partially_paid')) DEFAULT 'pending' NOT NULL,
  order_status TEXT CHECK (order_status IN ('Pending', 'Processing', 'Washing', 'Ironing', 'Ready', 'Delivered')) DEFAULT 'Pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  cloth_type_id UUID REFERENCES public.cloth_types(id) ON DELETE SET NULL,
  custom_item_name TEXT,
  quantity INTEGER DEFAULT 1 NOT NULL,
  wash_price DECIMAL(10,2) DEFAULT 0.00,
  iron_price DECIMAL(10,2) DEFAULT 0.00,
  dry_clean_price DECIMAL(10,2) DEFAULT 0.00,
  subtotal DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Policies (Clean up first)
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.branches;
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.customers;
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.cloth_types;
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.orders;
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.order_items;

-- 3. Create Policies
CREATE POLICY "Public Read/Write Access" ON public.branches FOR ALL USING (true);
CREATE POLICY "Public Read/Write Access" ON public.customers FOR ALL USING (true);
CREATE POLICY "Public Read/Write Access" ON public.cloth_types FOR ALL USING (true);
CREATE POLICY "Public Read/Write Access" ON public.orders FOR ALL USING (true);
CREATE POLICY "Public Read/Write Access" ON public.order_items FOR ALL USING (true);
