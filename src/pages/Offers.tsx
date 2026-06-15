import React, { useEffect, useState } from 'react';
import {
  Image as ImageIcon,
  Trash2,
  Plus,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  Upload,
  Link as LinkIcon,
  Edit2
} from 'lucide-react';
import { offerService } from '@backend/services/offerService';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface Offer {
  id: string;
  image_url: string;
  title: string;
  subtext: string;
  points: string[];
  button_text: string;
  is_active: boolean;
  created_at: string;
}

const Offers: React.FC = () => {
  const { t } = useLanguage();
  const { vendorId } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingOffer, setIsAddingOffer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [offerForm, setOfferForm] = useState({
    image_url: '',
    title: '',
    subtext: '',
    points: [''],
    button_text: 'Schedule Pickup Now'
  });

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const data = await offerService.getAllOffers(vendorId);
      setOffers(data as Offer[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [vendorId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const publicUrl = await offerService.uploadImage(file);
      setOfferForm(prev => ({ ...prev, image_url: publicUrl }));
    } catch (err: any) {
      alert(t('error_upload') + " " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddPoint = () => {
    setOfferForm(prev => ({ ...prev, points: [...prev.points, ''] }));
  };

  const handlePointChange = (index: number, value: string) => {
    const updatedPoints = [...offerForm.points];
    updatedPoints[index] = value;
    setOfferForm(prev => ({ ...prev, points: updatedPoints }));
  };

  const handleRemovePoint = (index: number) => {
    const updatedPoints = offerForm.points.filter((_, i) => i !== index);
    setOfferForm(prev => ({ ...prev, points: updatedPoints }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerForm.image_url.trim() || !offerForm.title.trim()) {
      alert(t('required_fields'));
      return;
    }

    try {
      const finalPoints = offerForm.points.filter(p => p.trim() !== '');
      const payload = { ...offerForm, points: finalPoints };

      if (editingId) {
        await offerService.updateOffer(editingId, payload);
      } else {
        await offerService.addOffer({ ...payload, vendor_id: vendorId });
      }

      resetForm();
      fetchOffers();
    } catch (err) {
      alert(t('error_save'));
    }
  };

  const resetForm = () => {
    setOfferForm({
      image_url: '',
      title: '',
      subtext: '',
      points: [''],
      button_text: 'Schedule Pickup Now'
    });
    setIsAddingOffer(false);
    setEditingId(null);
  };

  const startEdit = (offer: Offer) => {
    setEditingId(offer.id);
    setOfferForm({
      image_url: offer.image_url,
      title: offer.title,
      subtext: offer.subtext || '',
      points: offer.points && offer.points.length > 0 ? offer.points : [''],
      button_text: offer.button_text || 'Schedule Pickup Now'
    });
    setIsAddingOffer(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteOffer = async (id: string) => {
    if (!window.confirm(t('delete_confirm_poster'))) return;
    try {
      await offerService.deleteOffer(id);
      fetchOffers();
    } catch (err) {
      alert(t('error_delete'));
    }
  };

  const handleToggleStatus = async (offer: Offer) => {
    try {
      await offerService.toggleOfferStatus(offer.id, offer.is_active);
      fetchOffers();
    } catch (err) {
      alert(t('error_status'));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{t('detailed_promotions')}</h2>
          <p className="text-slate-500 mt-1 font-medium italic">{t('promotions_desc')}</p>
        </div>

        <button
          onClick={() => isAddingOffer ? resetForm() : setIsAddingOffer(true)}
          className={cn(
            "h-12 px-8 rounded-2xl flex items-center gap-3 text-sm font-black uppercase tracking-widest transition-all active:scale-95",
            isAddingOffer
              ? "bg-rose-50 text-rose-600 border border-rose-100"
              : "bg-primary-600 text-white"
          )}
        >
          {isAddingOffer ? <X size={20} /> : <Plus size={20} />}
          <span>{isAddingOffer ? t('cancel') : t('design_new_offer')}</span>
        </button>
      </div>

      {isAddingOffer && (
        <div className="card p-8 border-primary-500 bg-white shadow-2xl shadow-primary-900/5 animate-slide-up max-w-4xl mx-auto">
          <form onSubmit={handleFormSubmit} className="space-y-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              {editingId ? <Edit2 className="text-primary-600" /> : <Plus className="text-primary-600" />}
              {editingId ? t('edit_promotion') : t('new_promotion')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Text Content */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    <CheckCircle2 size={12} className="text-primary-500" /> {t('headline')}
                  </label>
                  <input
                    required
                    placeholder="E.G. GET 20% OFF ON LAUNDRY SERVICES"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all"
                    value={offerForm.title}
                    onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('subtext_desc')}</label>
                  <textarea
                    rows={3}
                    placeholder="ENJOY HASSLE-FREE LAUNDRY WITH ECO-FRIENDLY CLEANING..."
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all resize-none"
                    value={offerForm.subtext}
                    onChange={(e) => setOfferForm({ ...offerForm, subtext: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('key_points')}</label>
                    <button
                      type="button"
                      onClick={handleAddPoint}
                      className="text-[9px] font-black text-primary-600 uppercase hover:underline"
                    >
                      {t('add_point')}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {offerForm.points.map((point, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          placeholder={`POINT ${idx + 1}`}
                          className="flex-1 h-10 px-4 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold"
                          value={point}
                          onChange={(e) => handlePointChange(idx, e.target.value)}
                        />
                        {offerForm.points.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePoint(idx)}
                            className="p-2 text-rose-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('button_text')}</label>
                  <input
                    placeholder="SCHEDULE PICKUP NOW"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold"
                    value={offerForm.button_text}
                    onChange={(e) => setOfferForm({ ...offerForm, button_text: e.target.value })}
                  />
                </div>
              </div>

              {/* Right Column: Media */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('poster_image')}</label>

                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      className="flex-1 h-12 flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all overflow-hidden relative"
                    >
                      <Upload size={16} />
                      <span>{uploading ? t('uploading') : t('upload_system')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </button>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300">
                      <LinkIcon size={16} />
                    </div>
                    <input
                      placeholder={t('paste_url')}
                      className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                      value={offerForm.image_url}
                      onChange={(e) => setOfferForm({ ...offerForm, image_url: e.target.value })}
                    />
                  </div>

                  {/* Preview */}
                  <div className="mt-4 aspect-video rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                    {offerForm.image_url ? (
                      <img src={offerForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-slate-300">
                        <ImageIcon size={40} className="mx-auto mb-2 opacity-50" />
                        <p className="text-[10px] font-black uppercase tracking-widest">{t('image_preview')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full h-16 bg-primary-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.4em] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              🚀 {editingId ? t('update_promotion') : t('launch_offer')}
            </button>
          </form>
        </div>
      )}

      {/* Offers Grid */}
      {loading ? (
        <div className="flex h-[300px] items-center justify-center">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3rem] text-center">
          <div className="p-6 bg-white rounded-full shadow-sm mb-6 text-slate-300">
            <ImageIcon size={48} />
          </div>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{t('no_active_posters')}</h3>
          <p className="text-slate-400 text-sm font-medium mt-2">{t('no_posters_desc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {offers.map((offer) => (
            <div key={offer.id} className="group bg-white border border-slate-100 overflow-hidden hover:shadow-2xlhover:shadow-slate-200 transition-all duration-500 flex flex-col  rounded-[1.0rem]">
              {/* Image Preview */}
              <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
                <img
                  src={offer.image_url}
                  alt={offer.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545173168-9f1947eebb9f?auto=format&fit=crop&q=80&w=800';
                  }}
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <div className={cn(
                    "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg",
                    offer.is_active ? "bg-emerald-500/90 text-white" : "bg-slate-900/80 text-slate-300"
                  )}>
                    {offer.is_active ? t('active') : t('inactive')}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight line-clamp-1">{offer.title}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 line-clamp-2">{offer.subtext || t('no_description')}</p>

                  {offer.points && offer.points.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {offer.points.slice(0, 3).map((p, i) => (
                        <span key={i} className="text-[8px] bg-slate-50 text-slate-400 px-2 py-0.5 rounded font-black uppercase tracking-tighter">
                          ✓ {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStatus(offer)}
                      className={cn(
                        "p-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        offer.is_active
                          ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      )}
                      title={offer.is_active ? t('deactivate') : t('activate')}
                    >
                      {offer.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>

                    <button
                      onClick={() => startEdit(offer)}
                      className="p-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all"
                      title={t('edit_offer')}
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={() => handleDeleteOffer(offer.id)}
                      className="p-2.5 bg-rose-50 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                      title={t('delete_offer')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p className="text-[9px] text-slate-300 font-bold">{new Date(offer.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Offers;
