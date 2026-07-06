import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export const PriceListPoster: React.FC = () => {
  const pricingUrl = `${window.location.origin}/pricing`;

  return (
    <>
      <div
        id="price-list-poster"
        className="absolute -left-[9999px] top-0 print:static print:left-0 bg-white w-[800px] h-[1100px] p-16 flex flex-col items-center justify-center text-slate-900 printable-area"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {/* Actual Logo */}
        <div className="flex flex-col items-center mb-12">
          <img src="/assets/logo.jpeg" alt="Green Wash Co Logo" className="h-32 object-contain mb-6" />
          <div className="text-center">
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase">Green Wash Co.</h1>
            <p className="text-emerald-600 font-black uppercase tracking-[0.3em] text-sm mt-1">Premium Laundry & Dry Cleaning</p>
          </div>
        </div>

        {/* Main Message */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-slate-800 leading-tight">
            SCAN TO VIEW OUR <br />
            <span className="text-emerald-600 italic">DIGITAL RATE LIST</span>
          </h2>
          <div className="w-24 h-2 bg-emerald-100 mx-auto mt-6 rounded-full" />
        </div>

        {/* QR Code Container - Centered */}
        <div className="relative p-12 bg-white rounded-[4rem] shadow-2xl border-2 border-emerald-50 group">
          <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full scale-90" />
          <div className="relative bg-white p-8 rounded-[3rem] border border-slate-100">
            <QRCodeSVG
              value={pricingUrl}
              size={400}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-8 border-l-8 border-emerald-500 -translate-x-4 -translate-y-4 rounded-tl-3xl" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-8 border-r-8 border-emerald-500 translate-x-4 translate-y-4 rounded-br-3xl" />
        </div>

        {/* Contact Info (Minimal) */}
        <div className="mt-14 text-center">
          <p className="text-xl font-black text-slate-900 tracking-tight">+91 9451034909</p>
          <p className="text-xs font-black text-emerald-600/40 uppercase tracking-[0.5em] mt-2">info.greenwashco@gmail.com</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          /* Hide everything by default */
          body * { visibility: hidden; }
          
          /* Hide UI elements completely to avoid layout issues */
          aside, header, nav, button, .no-print { display: none !important; }
          
          /* Show only the poster and its content */
          #price-list-poster, #price-list-poster * { 
            visibility: visible !important; 
          }
          
          #price-list-poster { 
            visibility: visible !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important;
            height: 100% !important;
            background: white !important;
            padding: 20mm !important;
            margin: 0 !important;
          }

          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}} />
    </>
  );
};
