-- Add categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add category_id to cloth_types
ALTER TABLE public.cloth_types 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Enable RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Add policies for categories
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.categories;
CREATE POLICY "Public Read/Write Access" ON public.categories FOR ALL USING (true);

-- Seed some initial categories
INSERT INTO public.categories (name) 
VALUES ('Wash & Fold'), ('Wash & Iron'), ('Ironing Only'), ('Dry Clean'), ('Premium Laundry'), ('Steam Iron')
ON CONFLICT (name) DO NOTHING;
