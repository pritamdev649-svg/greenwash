import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Mail, Phone, Clock, Lock, UserCheck, Eye, RefreshCw } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Sticky Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 px-6 py-6 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="p-2 -ml-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="text-emerald-600" size={24} />
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Privacy Policy</h1>
          </div>
          <div className="w-10" /> {/* Spacer for symmetry */}
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-3xl mx-auto px-6 mt-10">
        
        {/* Intro Card */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-10 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[5rem] -z-0 opacity-50" />
          <div className="relative z-10">
            <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-1.5 mb-6">
              <Clock size={12} /> Effective Date: June 30, 2026
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-4">
              Your Privacy is Our Priority
            </h2>
            <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed">
              This Privacy Policy is prepared by <strong className="text-emerald-600">GreenWash</strong> (“We”, “Us”, or “Our”). We are committed to protecting the privacy of our customers while using our laundry and dry-cleaning services.
            </p>
          </div>
        </div>

        {/* Core Sections Grid/Stack */}
        <div className="space-y-6">
          
          {/* Section 1: Types of Information We Collect */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Eye size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider mb-4">
                  1. Types of Information We Collect
                </h3>
                <p className="text-slate-500 text-sm font-medium mb-4 leading-relaxed">
                  To provide our professional laundry and dry-cleaning services, we may collect the following details:
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600 font-bold">
                  {[
                    "Name",
                    "Phone number",
                    "Email address",
                    "Pickup and delivery address",
                    "Order and payment information",
                    "Support submissions & contact forms"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2: How We Use Your Information */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <UserCheck size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider mb-4">
                  2. How We Use Your Information
                </h3>
                <p className="text-slate-500 text-sm font-medium mb-4 leading-relaxed">
                  We process and utilize your information carefully for the following operational needs:
                </p>
                <div className="space-y-3">
                  {[
                    "Process laundry service bookings seamlessly.",
                    "Schedule and complete pickups and deliveries.",
                    "Provide prompt customer support when needed.",
                    "Send essential service updates and real-time order notifications.",
                    "Improve our offerings and operational flow for a better client experience."
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-slate-600 font-bold leading-relaxed">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 text-xs mt-0.5">
                        ✓
                      </div>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Disclosure of Information */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                <Lock size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider mb-3">
                  3. Disclosure of Information
                </h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Your privacy is highly valued. Your personal information is stored securely and is <strong className="text-slate-900 font-extrabold">never sold or rented</strong> to third parties. Information may only be shared where required by law or to provide the requested service.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4 & 5: Your Rights & Changes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Your Rights */}
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Shield size={18} />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  4. Your Rights
                </h3>
              </div>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">
                You may request access to, correction of, or deletion of your personal information at any time by contacting us directly.
              </p>
            </div>

            {/* Changes to Policy */}
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                  <RefreshCw size={18} />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  5. Changes
                </h3>
              </div>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">
                Any future updates or modifications to this Privacy Policy will be posted immediately on this page.
              </p>
            </div>
            
          </div>

          {/* Section 6: Contact Section */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-10 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider text-center mb-6">
              Get In Touch
            </h3>
            <p className="text-slate-500 text-sm font-medium text-center mb-8 max-w-md mx-auto leading-relaxed">
              If you have any questions or concerns regarding this Privacy Policy or your personal information, please feel free to reach out.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone contact */}
              <a
                href="tel:+919451034909"
                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-500/30 hover:bg-emerald-50/20 group transition-all"
              >
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Call Us</p>
                  <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">+91 9451034909</p>
                </div>
              </a>

              {/* Email contact */}
              <a
                href="mailto:ask003683@gmail.com"
                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-500/30 hover:bg-emerald-50/20 group transition-all"
              >
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Email Us</p>
                  <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">ask003683@gmail.com</p>
                </div>
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
