import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { offerService } from '../../Backend/src/services/offerService';
import { cn } from '../lib/utils';

interface Offer {
  id: string;
  image_url: string;
  title: string;
  subtext: string;
  points: string[];
  button_text: string;
  is_active: boolean;
}

export const OfferSlider: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const data = await offerService.getActiveOffers();
        setOffers(data as Offer[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const next = () => setCurrentIndex((prev) => (prev + 1) % offers.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);

  // Auto-slide
  useEffect(() => {
    if (offers.length <= 1) return;
    const interval = setInterval(next, 7000); // Slower for detailed content
    return () => clearInterval(interval);
  }, [offers.length]);

  if (loading || offers.length === 0) return null;

  return (
    <section className="py-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative group">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600">
                <Zap size={16} className="fill-emerald-600" />
              </div>
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Hot Deals & Promotions</h3>
            </div>
            
            {offers.length > 1 && (
              <div className="flex gap-2">
                <button 
                  onClick={prev}
                  className="p-1.5 border border-slate-100 rounded-lg hover:bg-slate-50 transition-all active:scale-90"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={next}
                  className="p-1.5 border border-slate-100 rounded-lg hover:bg-slate-50 transition-all active:scale-90"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Slider Container */}
          <div className="relative overflow-hidden rounded-[2rem] bg-slate-50 border border-slate-100 shadow-sm">
             <div 
               className="flex transition-transform duration-1000 ease-in-out"
               style={{ transform: `translateX(-${currentIndex * 100}%)` }}
             >
               {offers.map((offer) => (
                 <div key={offer.id} className="min-w-full flex flex-col lg:flex-row items-center p-6 lg:p-10 gap-8 lg:gap-12">
                    {/* Image side - Full Fit (Aayat) shape */}
                    <div className="w-full lg:w-[45%] aspect-[16/10] rounded-2xl overflow-hidden bg-white shadow-lg border border-slate-100 relative group/img">
                       <img 
                         src={offer.image_url} 
                         alt={offer.title} 
                         className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                         onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545173168-9f1947eebb9f?auto=format&fit=crop&q=80&w=800';
                         }}
                       />
                    </div>

                    {/* Content side */}
                    <div className="w-full lg:w-[55%] flex flex-col justify-center space-y-4 text-center lg:text-left">
                       <div className="space-y-2">
                          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                             <span className="w-1 h-1 rounded-full bg-emerald-600 animate-pulse" />
                             Special Promo
                          </div>
                          <h2 className="text-2xl lg:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                             {offer.title}
                          </h2>
                          <p className="text-xs lg:text-sm text-slate-500 font-medium leading-relaxed line-clamp-2">
                             {offer.subtext}
                          </p>
                       </div>

                       {offer.points && offer.points.length > 0 && (
                         <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {offer.points.slice(0, 4).map((point, idx) => (
                              <div key={idx} className="flex items-center gap-2 group/point">
                                <div className="p-1 bg-emerald-100 text-emerald-600 rounded-md">
                                  <CheckCircle2 size={12} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight truncate">{point}</span>
                              </div>
                            ))}
                         </div>
                       )}

                       <div className="pt-2">
                          <button 
                            onClick={() => window.open(`https://wa.me/919451034909?text=${encodeURIComponent(`Hi Green Wash Co! I'm interested in the offer: ${offer.title}`)}`, '_blank')}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center lg:justify-start gap-2 group/btn mx-auto lg:mx-0"
                          >
                             {offer.button_text || "Schedule Now"}
                             <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>

          {/* Pagination Indicators */}
          {offers.length > 1 && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
              {offers.map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    i === currentIndex ? "w-10 bg-primary-600" : "w-2.5 bg-slate-200"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
