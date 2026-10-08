import React, { useEffect } from 'react';

export default function PayRedirect() {
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const pa = searchParams.get('pa');
    const pn = searchParams.get('pn');
    const am = searchParams.get('am');
    const tn = searchParams.get('tn');
    
    if (pa && pn && am) {
      const upiUrl = `upi://pay?pa=${pa}&pn=${encodeURIComponent(pn)}&am=${am}&tn=${tn || ''}&cu=INR`;
      // We try to replace the current URL so the user doesn't get stuck in a back-button loop.
      window.location.replace(upiUrl);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center font-sans">
      <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Redirecting to Payment App...</h1>
      <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
        Please complete your payment in the UPI app (GPay, PhonePe, Paytm, BHIM, etc.).
      </p>
      <p className="text-sm text-slate-400 mt-8">
        If nothing happens automatically, make sure you are on a mobile device with a UPI app installed.
      </p>
    </div>
  );
}
