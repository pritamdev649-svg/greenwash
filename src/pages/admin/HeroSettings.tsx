import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles,
  Save,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  Zap,
  ChevronRight
} from 'lucide-react';
import {
  heroSettingsService,
  DEFAULT_HERO_SETTINGS
} from '@backend/services/heroSettingsService';
import type { HeroSettings } from '@backend/services/heroSettingsService';

export const HeroSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<HeroSettings>(DEFAULT_HERO_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await heroSettingsService.getHeroSettings();
      setSettings(data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Could not load current hero settings. Fallback settings loaded.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof HeroSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (PNG, JPG, WEBP, SVG).');
      return;
    }

    try {
      setUploading(true);
      setErrorMessage('');
      const publicUrl = await heroSettingsService.uploadHeroImage(file);
      handleChange('image_url', publicUrl);
      setSuccessMessage('Image uploaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Image upload failed: ' + (err.message || 'Check storage permissions.'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setErrorMessage('');
      await heroSettingsService.updateHeroSettings(settings);
      setSuccessMessage('Hero section updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to save to Supabase: ' + (err.message || 'Make sure site_settings table exists. Saved locally.'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset hero section back to default content?')) {
      setSettings(DEFAULT_HERO_SETTINGS);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={14} className="text-emerald-600" />
            <span>Homepage Content Manager</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Hero Section Editor
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Customize headlines, subtext, CTA buttons, metrics, and banner images on the public homepage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-all active:scale-95 shadow-sm"
          >
            <RotateCcw size={16} />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Save size={16} />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Alerts */}
      {loading && (
        <div className="flex items-center gap-3 p-4 bg-slate-100 text-slate-600 rounded-2xl animate-pulse text-sm font-medium">
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-600 border-t-transparent" />
          Loading current settings...
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl animate-in slide-in-from-top-2">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl animate-in slide-in-from-top-2">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
          <div className="text-sm font-medium">
            {errorMessage}
            <div className="text-xs text-amber-700 mt-1">
              Note: If database table <code>site_settings</code> is not created yet, changes will be saved to browser storage.
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Panel */}
      <div className="bg-gradient-to-br from-emerald-50/40 via-white to-slate-50 border border-emerald-100 rounded-3xl p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4 border-b border-emerald-100/60 pb-3">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-emerald-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Live Preview (As displayed on Homepage)
            </h3>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            View Live Site <ExternalLink size={12} />
          </a>
        </div>

        {/* Hero Mini Mockup */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 lg:p-8 shadow-sm relative overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Col Preview */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider mb-4">
                <Zap size={12} className="fill-emerald-600" />
                <span>{settings.badge_text || 'Premium Laundry Service'}</span>
              </div>

              {/* Headline */}
              <h1 className="text-2xl lg:text-4xl font-black text-slate-900 leading-[1.15] mb-4">
                {settings.headline_prefix}{' '}
                <span className="text-emerald-500 italic bg-emerald-50/50 ring-1 ring-emerald-100 rounded-lg px-2">
                  {settings.headline_highlight}
                </span>{' '}
                {settings.headline_suffix}
              </h1>

              {/* Subtext */}
              <p className="text-xs lg:text-sm text-slate-500 mb-6 max-w-md leading-relaxed font-medium">
                {settings.description}
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
                >
                  {settings.primary_button_text}
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  className="bg-white border-2 border-emerald-100 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold"
                >
                  {settings.secondary_button_text}
                </button>
              </div>

              {/* Stats */}
              <div className="mt-6 flex items-center gap-6">
                <div>
                  <p className="text-lg font-black text-slate-900">{settings.stat1_value}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{settings.stat1_label}</p>
                </div>
                <div className="w-px h-6 bg-emerald-100"></div>
                <div>
                  <p className="text-lg font-black text-slate-900">{settings.stat2_value}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{settings.stat2_label}</p>
                </div>
              </div>
            </div>

            {/* Right Col Image Preview */}
            <div className="flex justify-center">
              <div className="relative max-w-xs w-full">
                <div className="absolute inset-0 bg-emerald-400/10 blur-2xl rounded-full translate-y-4" />
                <img
                  src={settings.image_url || '/assets/hero.png'}
                  alt="Hero Preview"
                  className="relative z-10 w-full max-h-64 object-contain rounded-2xl drop-shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/hero.png';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editing Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Text & Button Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Content Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Headlines & Text Content
            </h2>

            {/* Pill Badge */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Top Badge / Pill Tag
              </label>
              <input
                type="text"
                value={settings.badge_text}
                onChange={(e) => handleChange('badge_text', e.target.value)}
                placeholder="e.g. PREMIUM LAUNDRY SERVICE"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium"
              />
            </div>

            {/* Headline Breakdown */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Headline Start
                </label>
                <input
                  type="text"
                  value={settings.headline_prefix}
                  onChange={(e) => handleChange('headline_prefix', e.target.value)}
                  placeholder="e.g. Perfectly"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                  Highlighted Word
                </label>
                <input
                  type="text"
                  value={settings.headline_highlight}
                  onChange={(e) => handleChange('headline_highlight', e.target.value)}
                  placeholder="e.g. clean"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-emerald-400 bg-emerald-50/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-black text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Headline Rest
                </label>
                <input
                  type="text"
                  value={settings.headline_suffix}
                  onChange={(e) => handleChange('headline_suffix', e.target.value)}
                  placeholder="e.g. clothes, without the hassle."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-semibold"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Sub-Headline / Description
              </label>
              <textarea
                rows={3}
                value={settings.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Description of laundry and dry cleaning services..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium resize-none"
              />
            </div>
          </div>

          {/* Action Buttons Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Call-to-Action (CTA) Buttons
            </h2>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Primary Button */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Primary Button
                </span>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Button Label</label>
                  <input
                    type="text"
                    value={settings.primary_button_text}
                    onChange={(e) => handleChange('primary_button_text', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Action Type</label>
                  <select
                    value={settings.primary_button_action}
                    onChange={(e: any) => handleChange('primary_button_action', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium"
                  >
                    <option value="login_modal">Open Partner/Demo Login Modal</option>
                    <option value="custom_url">Navigate to Link / URL</option>
                  </select>
                </div>
                {settings.primary_button_action === 'custom_url' && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">URL / Path</label>
                    <input
                      type="text"
                      value={settings.primary_button_url || ''}
                      onChange={(e) => handleChange('primary_button_url', e.target.value)}
                      placeholder="/pricing or https://..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Secondary Button */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Secondary Button
                </span>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Button Label</label>
                  <input
                    type="text"
                    value={settings.secondary_button_text}
                    onChange={(e) => handleChange('secondary_button_text', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Action Type</label>
                  <select
                    value={settings.secondary_button_action}
                    onChange={(e: any) => handleChange('secondary_button_action', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium"
                  >
                    <option value="scroll_services">Scroll to #services section</option>
                    <option value="custom_url">Navigate to Link / URL</option>
                  </select>
                </div>
                {settings.secondary_button_action === 'custom_url' && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">URL / Path</label>
                    <input
                      type="text"
                      value={settings.secondary_button_url || ''}
                      onChange={(e) => handleChange('secondary_button_url', e.target.value)}
                      placeholder="#steps or /pricing"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Social Proof Stats */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Highlight Numbers & Stats
            </h2>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Stat 1</label>
                <input
                  type="text"
                  value={settings.stat1_value}
                  onChange={(e) => handleChange('stat1_value', e.target.value)}
                  placeholder="e.g. 1,000+"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm"
                />
                <input
                  type="text"
                  value={settings.stat1_label}
                  onChange={(e) => handleChange('stat1_label', e.target.value)}
                  placeholder="e.g. Happy Clients"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-500"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Stat 2</label>
                <input
                  type="text"
                  value={settings.stat2_value}
                  onChange={(e) => handleChange('stat2_value', e.target.value)}
                  placeholder="e.g. 10+"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm"
                />
                <input
                  type="text"
                  value={settings.stat2_label}
                  onChange={(e) => handleChange('stat2_label', e.target.value)}
                  placeholder="e.g. Store Locations"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Banner Image Configuration */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ImageIcon size={18} className="text-emerald-600" />
              Hero Banner Image
            </h2>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-emerald-400 transition-colors bg-slate-50/50">
              <img
                src={settings.image_url || '/assets/hero.png'}
                alt="Current Hero"
                className="max-h-48 mx-auto object-contain mb-4 rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/hero.png';
                }}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-2.5 px-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-emerald-600 border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    Upload New Image
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleChange('image_url', '/assets/hero.png')}
                className="mt-2 text-[11px] text-slate-400 hover:text-slate-600 underline font-medium"
              >
                Reset to default illustration
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Or Direct Image URL
              </label>
              <input
                type="text"
                value={settings.image_url}
                onChange={(e) => handleChange('image_url', e.target.value)}
                placeholder="https://... or /assets/hero.png"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Transparent PNG or 3D illustration works best.
              </p>
            </div>
          </div>

          {/* Quick Save Card */}
          <div className="bg-emerald-600 rounded-3xl p-6 text-white space-y-4 shadow-xl shadow-emerald-600/20">
            <h3 className="font-black text-base">Ready to publish?</h3>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Once you click Save, all visitors viewing the GreenWash home page will instantly see your latest updates.
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {saving ? 'Publishing...' : 'Save & Publish to Homepage'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default HeroSettingsPage;
