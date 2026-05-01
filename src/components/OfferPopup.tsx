import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { offerService } from '@backend/services/offerService';

interface Offer {
  id: string;
  image_url: string;
  title: string;
}

export const OfferPopup: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const data = await offerService.getActiveOffers();
        if (data && data.length > 0) {
          setOffers(data as Offer[]);
          
          // Check if already seen in this session
          const hasSeen = sessionStorage.getItem('hasSeenOffer');
          if (!hasSeen) {
            setTimeout(() => {
              setIsOpen(true);
              sessionStorage.setItem('hasSeenOffer', 'true');
            }, 1500); // Delay for better UX
          }
        }
      } catch (err) {
        console.error("Offer fetch error:", err);
      }
    };

    fetchOffers();
  }, []);

  const nextOffer = () => {
    setCurrentIndex((prev) => (prev + 1) % offers.length);
  };

  const prevOffer = () => {
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
  };

  if (!isOpen || offers.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-500"
        onClick={() => setIsOpen(false)}
      />
      
      <div className="relative bg-transparent w-full max-w-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-500">
        {/* Close Button */}
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 z-20 p-2 bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-md rounded-full text-white transition-all active:scale-95 border border-white/20"
        >
          <X size={20} />
        </button>

        {/* Poster Slider */}
        <div className="relative w-full group">
          <img 
            src={offers[currentIndex].image_url} 
            alt="Promotion" 
            className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl"
          />
          
          {/* Navigation Arrows (if multiple) */}
          {offers.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); prevOffer(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-2xl text-white transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); nextOffer(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-2xl text-white transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
