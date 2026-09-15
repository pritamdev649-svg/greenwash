-- ============================================================
-- Site Settings (Hero Section & Dynamic CMS)
-- Allows Admin and Super Admin to configure hero section
-- ============================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for home page visitors)
DROP POLICY IF EXISTS "Public Read Site Settings" ON public.site_settings;
CREATE POLICY "Public Read Site Settings" ON public.site_settings
  FOR SELECT USING (true);

-- Allow write access
DROP POLICY IF EXISTS "All Write Site Settings" ON public.site_settings;
CREATE POLICY "All Write Site Settings" ON public.site_settings
  FOR ALL USING (true);

-- Insert initial default hero section settings if not existing
INSERT INTO public.site_settings (id, data, updated_at)
VALUES (
  'hero_section',
  '{
    "badge_text": "Premium Laundry Service",
    "headline_prefix": "Perfectly",
    "headline_highlight": "clean",
    "headline_suffix": "clothes, without the hassle.",
    "description": "We take care of your laundry so you can focus on what matters. Fast, reliable, and perfectly pressed every single time.",
    "primary_button_text": "Watch Demo Account",
    "primary_button_action": "login_modal",
    "primary_button_url": "",
    "secondary_button_text": "Our Services",
    "secondary_button_action": "scroll_services",
    "secondary_button_url": "#services",
    "stat1_value": "1,000+",
    "stat1_label": "Happy Clients",
    "stat2_value": "10+",
    "stat2_label": "Store Locations",
    "image_url": "/assets/hero.png"
  }'::jsonb,
  now()
)
ON CONFLICT (id) DO NOTHING;
