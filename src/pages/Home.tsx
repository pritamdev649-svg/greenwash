import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import {
  Mail,
  Lock,
  ChevronRight,
  Zap,
  Menu,
  X,
  Smartphone,
  Star
} from 'lucide-react';

import { OfferPopup } from '../components/OfferPopup';
import { FloatingActions } from '../components/FloatingActions';
import { OfferSlider } from '../components/OfferSlider';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Home: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { session, signIn } = useAuth();

  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 scroll-smooth">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-emerald-50">
        <div className="max-w-7xl mx-auto px-6 h-28 flex items-center justify-between">
          <div className="flex items-center cursor-pointer transition-transform active:scale-95" onClick={() => window.scrollTo(0, 0)}>
            <img
              src="/assets/greenwashlogo.jpeg"
              alt="Green Wash Co Logo"
              className="h-24 w-auto object-contain"
            />
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            <a href="#home" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">Home</a>
            <a href="#steps" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">How it works</a>
            <a href="#services" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">Services</a>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-full text-xs font-bold active:scale-95 transition-all"
            >
              Admin Login
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden p-2 text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-16 left-0 right-0 bg-white border-b border-emerald-50 p-6 flex flex-col gap-6 animate-in slide-in-from-top duration-300">
            <a href="#home" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">Home</a>
            <a href="#steps" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">How it works</a>
            <a href="#services" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">Services</a>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsLoginModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-center text-sm font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
            >
              Admin Login
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-40 pb-12 lg:pt-48 lg:pb-20 overflow-hidden bg-emerald-50/20">
        {/* Wave Background */}
        <div className="absolute top-0 right-0 w-[60%] h-full bg-emerald-200/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 -z-10" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider mb-4">
              <Zap size={12} className="fill-emerald-600" />
              <span>Premium Laundry Service</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-6">
              Perfectly <span className="text-emerald-500 italic bg-white/40 ring-1 ring-emerald-100 rounded-lg px-2">clean</span> clothes, <br />
              without the hassle.
            </h1>
            <p className="text-base text-slate-500 mb-8 max-w-lg leading-relaxed font-medium">
              We take care of your laundry so you can focus on what matters. Fast, reliable, and perfectly pressed every single time.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-base font-bold  transition-all active:scale-95 flex items-center gap-2"
              >
                Watch Demo Account
                <ChevronRight size={18} />
              </button>
              <button className="bg-white border-2 border-emerald-100 hover:border-emerald-200 text-slate-700 px-6 py-3 rounded-xl text-base font-bold transition-all active:scale-95">
                Our Services
              </button>
            </div>

            <div className="mt-10 flex items-center gap-8">
              <div>
                <p className="text-xl font-black text-slate-900">1,000+</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Happy Clients</p>
              </div>
              <div className="w-px h-6 bg-emerald-100"></div>
              <div>
                <p className="text-xl font-black text-slate-900">10+</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Store Locations</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10 w-full animate-float max-w-lg mx-auto overflow-hidden rounded-[3rem]">
              <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full translate-y-10" />
              <img
                src="/assets/hero.png"
                alt="Laundry Illustration"
                className="relative z-10 w-full object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Offers Strip Section */}
      <OfferSlider />

      {/* Steps Section - Zig Zag Flow */}
      <section id="steps" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-emerald-600 font-black uppercase tracking-[0.2em] text-xs lg:text-sm mb-3">The Process</p>
            <h2 className="text-3xl lg:text-5xl font-black text-slate-900 leading-tight">Perfectly clean in 6 steps</h2>
          </div>

          <div className="relative">
            {/* SVG Connector Path (Desktop) */}
            <svg className="hidden lg:block absolute top-0 left-0 w-full h-[600px] -z-0 pointer-events-none" viewBox="0 0 1000 600" fill="none">
              <path
                d="M200,100 C400,100 600,100 800,100 C920,100 920,300 800,300 C600,300 400,300 200,300 C100,300 100,500 200,500 C400,500 600,500 800,500"
                stroke="#10b981"
                strokeWidth="3"
                strokeDasharray="12 12"
                opacity="0.2"
              />
            </svg>

            <div className="space-y-32 lg:space-y-0">
              {/* Row 1: 1 2 3 */}
              <div className="grid lg:grid-cols-3 gap-20 lg:mb-40">
                {[
                  { id: 1, label: "Pickup", color: "bg-emerald-500", desc: "Eco-friendly van pickup", img: "/assets/step1.png" },
                  { id: 2, label: "Reception", color: "bg-blue-500", desc: "Expert assessment", img: "/assets/step2.png" },
                  { id: 3, label: "Washing", color: "bg-indigo-500", desc: "Advanced washing tech", img: "/assets/step3.png" }
                ].map((step) => (
                  <div key={step.id} className="relative z-10 group flex flex-col items-center">
                    <div className="w-40 h-32 rounded-[2rem] bg-white border border-emerald-50 flex items-center justify-center p-4 shadow-lg group-hover:shadow-2xl group-hover:-translate-y-3 transition-all duration-500 relative text-emerald-600">
                      <img src={step.img} alt={step.label} className="w-24 h-24 object-contain group-hover:scale-110 transition-transform duration-500" />
                      <div className={cn("absolute -top-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-xl", step.color)}>
                        {step.id}
                      </div>
                    </div>
                    <div className="mt-8 text-center max-w-[180px]">
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">{step.label}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 2: 4 5 6 */}
              <div className="grid lg:grid-cols-3 gap-20">
                {[
                  { id: 4, label: "Folding", color: "bg-rose-500", desc: "Quality inspection", img: "/assets/step4.png" },
                  { id: 5, label: "Packaging", color: "bg-amber-500", desc: "Eco-friendly wrap", img: "/assets/step5.png" },
                  { id: 6, label: "Delivery", color: "bg-emerald-600", desc: "Doorstep delivery", img: "/assets/step6.png" }
                ].map((step) => (
                  <div key={step.id} className="relative z-10 group flex flex-col items-center">
                    <div className="w-40 h-32 rounded-[2rem] bg-white border border-emerald-50 flex items-center justify-center p-4 shadow-lg group-hover:shadow-2xl group-hover:-translate-y-3 transition-all duration-500 relative text-emerald-600">
                      <img src={step.img} alt={step.label} className="w-24 h-24 object-contain group-hover:scale-110 transition-transform duration-500" />
                      <div className={cn("absolute -top-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-xl", step.color)}>
                        {step.id}
                      </div>
                    </div>
                    <div className="mt-8 text-center max-w-[180px]">
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">{step.label}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-emerald-50/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <p className="text-emerald-600 font-black uppercase tracking-[0.2em] text-xs lg:text-sm mb-3">Professional Care</p>
            <h2 className="text-3xl lg:text-5xl font-black text-slate-900 leading-tight">Get Every Service Very Easily</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Wash & Fold", subtitle: "Standard wash cycle", img: "/assets/wash_fold.png" },
              { title: "Wash & Iron", subtitle: "Pressed to perfection", img: "/assets/wash_iron.png" },
              { title: "Dry Clean", subtitle: "Special care fabrics", img: "/assets/dry_clean.png" },
              { title: "Starching", subtitle: "Crisp cotton finish", img: "/assets/starching.png" },
              { title: "Steam Press", subtitle: "Quick wrinkle removal", img: "/assets/steam_press.png" },
              { title: "Premium Laundry", subtitle: "Luxury item handling", img: "/assets/premium_laundry.png" }
            ].map((service, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-emerald-50 hover:border-emerald-200 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all group overflow-hidden relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-full h-48 mb-6 rounded-3xl bg-emerald-50 flex items-center justify-center overflow-hidden relative shadow-inner">
                    <img
                      src={service.img}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-emerald-900/10 group-hover:opacity-0 transition-opacity" />
                  </div>
                  <h4 className="font-black text-2xl text-slate-900 mb-2">{service.title}</h4>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{service.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help Banner */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-12 lg:p-20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12 text-center lg:text-left">
              <div>
                <h2 className="text-3xl lg:text-4xl font-black text-white mb-8">
                  Need a specialized <br />
                  cleaning plan?
                </h2>
                <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black transition-all active:scale-95">
                  Contact Specialist
                </button>
              </div>
              <div className="relative text-emerald-500 opacity-20 group-hover:opacity-40 transition-opacity transform group-hover:scale-110 duration-500">
                <Smartphone size={180} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-emerald-50 pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center mb-6 -ml-4">
              <img
                src="/assets/greenwashlogo.jpeg"
                alt="Green Wash Co Logo"
                className="h-28 w-auto object-contain"
              />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4 font-medium">
              Modernizing laundry management for businesses and individuals. Eco-friendly, fast, and professional.
            </p>
            <div className="flex flex-col gap-3 text-slate-400 mb-8 font-bold text-sm">
              <div className="flex items-center gap-3">
                <Smartphone size={18} className="text-emerald-500" />
                <span>+91 9451034909</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-emerald-500" />
                <span>ask003683@gmail.com</span>
              </div>
            </div>
            <div className="flex gap-3">
              {[1, 2, 3].map(i => <div key={i} className="w-10 h-10 rounded-full bg-white border border-emerald-50 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer shadow-sm"><Star size={18} /></div>)}
            </div>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-xs">About us</h5>
            <ul className="space-y-4 text-sm text-slate-400 font-bold">
              <li className="hover:text-emerald-600 cursor-pointer transition-colors">Our Story</li>
              <li className="hover:text-emerald-600 cursor-pointer transition-colors">Careers</li>
              <li className="hover:text-emerald-600 cursor-pointer transition-colors">Sustainability</li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-xs">Company</h5>
            <ul className="space-y-4 text-sm text-slate-400 font-bold">
              <li className="hover:text-emerald-600 cursor-pointer transition-colors">Blog</li>
              <li className="hover:text-emerald-600 cursor-pointer transition-colors">Terms</li>
              <li className="hover:text-emerald-600 cursor-pointer transition-colors">Privacy</li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-xs">Services</h5>
            <ul className="space-y-4 text-sm text-slate-400 font-bold">
              <li className="hover:text-emerald-600 cursor-pointer transition-colors">Pickup</li>
              <li className="hover:text-emerald-600 cursor-pointer transition-colors">Order Tracking</li>
              <li className="hover:text-emerald-600 cursor-pointer transition-colors">Pricing</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-10 mt-16 border-t border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] text-slate-400 font-black uppercase tracking-widest">
          <p>© 2026 Green Wash Co. All rights reserved.</p>
          <div className="flex gap-8">
            <span className="cursor-pointer hover:text-emerald-600">LinkedIn</span>
            <span className="cursor-pointer hover:text-emerald-600">Twitter</span>
            <span className="cursor-pointer hover:text-emerald-600">Instagram</span>
          </div>
        </div>
      </footer>
      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsLoginModalOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-slide-up">
            <div className="p-8 sm:p-12">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-2">Admin Login</h2>
                  <p className="text-slate-400 text-sm font-medium">Manage your laundry ecosystem.</p>
                </div>
                <button onClick={() => setIsLoginModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border-l-4 border-red-500">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-medium"
                      placeholder="admin@greenwashco.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest mt-8">
                  Email logins are secure and encrypted.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Features */}
      <OfferPopup />
      <FloatingActions />
    </div>
  );
};

export default Home;
