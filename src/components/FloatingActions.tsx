import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';

export const FloatingActions: React.FC = () => {
  const phoneNumber = "9451034909";
  const whatsappNumber = "9451034909";
  const message = encodeURIComponent("Hello Green Wash Co! I'm interested in your laundry services.");

  return (
    <div className="fixed bottom-8 right-8 z-[90] flex flex-col gap-4 animate-in slide-in-from-right duration-700">
      {/* WhatsApp Button */}
      <a 
        href={`https://wa.me/91${whatsappNumber}?text=${message}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center"
      >
        <span className="absolute right-full mr-4 px-4 py-2 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap">
          Chat on WhatsApp
        </span>
        <div className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90 group-hover:rotate-12">
          <MessageCircle size={28} />
        </div>
      </a>

      {/* Call Button */}
      <a 
        href={`tel:+91${phoneNumber}`}
        className="group relative flex items-center"
      >
        <span className="absolute right-full mr-4 px-4 py-2 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap">
          Call Specialist
        </span>
        <div className="w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90 group-hover:-rotate-12">
          <Phone size={24} />
        </div>
      </a>
    </div>
  );
};
