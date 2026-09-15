import { supabase } from '../config/supabase';

export interface HeroSettings {
  badge_text: string;
  headline_prefix: string;
  headline_highlight: string;
  headline_suffix: string;
  description: string;
  primary_button_text: string;
  primary_button_action: 'login_modal' | 'custom_url';
  primary_button_url?: string;
  secondary_button_text: string;
  secondary_button_action: 'scroll_services' | 'custom_url';
  secondary_button_url?: string;
  stat1_value: string;
  stat1_label: string;
  stat2_value: string;
  stat2_label: string;
  image_url: string;
}

export const DEFAULT_HERO_SETTINGS: HeroSettings = {
  badge_text: 'Premium Laundry Service',
  headline_prefix: 'Perfectly',
  headline_highlight: 'clean',
  headline_suffix: 'clothes, without the hassle.',
  description: 'We take care of your laundry so you can focus on what matters. Fast, reliable, and perfectly pressed every single time.',
  primary_button_text: 'Watch Demo Account',
  primary_button_action: 'login_modal',
  primary_button_url: '',
  secondary_button_text: 'Our Services',
  secondary_button_action: 'scroll_services',
  secondary_button_url: '#services',
  stat1_value: '1,000+',
  stat1_label: 'Happy Clients',
  stat2_value: '10+',
  stat2_label: 'Store Locations',
  image_url: '/assets/hero.png'
};

const LOCAL_STORAGE_KEY = 'greenwash_hero_settings';

export const heroSettingsService = {
  /**
   * Fetch hero settings from Supabase, or return local cache/default
   */
  async getHeroSettings(): Promise<HeroSettings> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('data')
        .eq('id', 'hero_section')
        .single();

      if (error || !data?.data) {
        // Fallback to local storage if available
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          try {
            return { ...DEFAULT_HERO_SETTINGS, ...JSON.parse(local) };
          } catch (_) {}
        }
        return DEFAULT_HERO_SETTINGS;
      }

      const merged = { ...DEFAULT_HERO_SETTINGS, ...data.data };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    } catch (err) {
      console.warn('Error fetching hero settings, using fallback:', err);
      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) {
        try {
          return { ...DEFAULT_HERO_SETTINGS, ...JSON.parse(local) };
        } catch (_) {}
      }
      return DEFAULT_HERO_SETTINGS;
    }
  },

  /**
   * Update hero settings in Supabase and local cache
   */
  async updateHeroSettings(settings: HeroSettings): Promise<HeroSettings> {
    const updatedPayload = {
      id: 'hero_section',
      data: settings,
      updated_at: new Date().toISOString()
    };

    // Save locally first for instant feedback
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));

    const { data, error } = await supabase
      .from('site_settings')
      .upsert(updatedPayload, { onConflict: 'id' })
      .select('data')
      .single();

    if (error) {
      console.error('Failed to update hero settings in Supabase:', error);
      throw error;
    }

    return data?.data ? { ...DEFAULT_HERO_SETTINGS, ...data.data } : settings;
  },

  /**
   * Upload hero illustration/banner to Supabase storage bucket 'promotions'
   */
  async uploadHeroImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `hero_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `hero/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('promotions')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading hero image:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('promotions')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};
