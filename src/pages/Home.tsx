import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@backend/config/supabase';
import { orderService } from '@backend/services/orderService';

import {
  Mail,
  Lock,
  ChevronRight,
  Zap,
  Menu,
  X,
  Smartphone,
  Star,
  Eye,
  EyeOff,
  Store,
  Plus,
  Minus,
  ShoppingBag,
  Search,
  Shirt,
  Loader2,
  ChevronLeft
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
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { session, role, signIn } = useAuth();

  // Guest Order States
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [clothTypes, setClothTypes] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [orderStep, setOrderStep] = useState<'vendor' | 'items'>('vendor');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Fetch all active vendors on mount
  useEffect(() => {
    supabase
      .from('vendors')
      .select('id, name, address, city, phone, branch_id')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setVendors(data || []);
        setLoadingVendors(false);
      });
  }, []);

  // Fetch cloth types when vendor selected
  useEffect(() => {
    if (!selectedVendor) return;
    setLoadingItems(true);
    setCart([]);
    orderService.getAllClothTypes(selectedVendor.id).then(data => {
      // fallback: load global cloth types if vendor has none
      if (!data || data.length === 0) {
        orderService.getAllClothTypes(null).then(global => {
          setClothTypes(global || []);
          setLoadingItems(false);
        });
      } else {
        setClothTypes(data);
        setLoadingItems(false);
      }
    });
  }, [selectedVendor]);

  const getCartItem = (id: string, service: string) =>
    cart.find(c => c.cloth_type_id === id && c.service === service);

  const setQty = (cloth: any, service: string, delta: number) => {
    const price =
      service === 'wash' ? Number(cloth.wash_price || 0) :
      service === 'iron' ? Number(cloth.iron_price || 0) :
      Number(cloth.dry_clean_price || 0);

    setCart(prev => {
      const existing = prev.find(c => c.cloth_type_id === cloth.id && c.service === service);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) return prev.filter(c => !(c.cloth_type_id === cloth.id && c.service === service));
        return prev.map(c =>
          c.cloth_type_id === cloth.id && c.service === service
            ? { ...c, quantity: newQty, subtotal: price * newQty }
            : c
        );
      }
      if (delta <= 0) return prev;
      return [...prev, {
        cloth_type_id: cloth.id,
        item_name: cloth.name,
        quantity: 1,
        service,
        wash_price: Number(cloth.wash_price || 0),
        iron_price: Number(cloth.iron_price || 0),
        dry_clean_price: Number(cloth.dry_clean_price || 0),
        subtotal: price,
      }];
    });
  };

  const cartTotal = cart.reduce((s, i) => s + i.subtotal, 0);

  const handleProceedOrder = () => {
    if (!selectedVendor) return;
    const pendingOrder = {
      vendor: selectedVendor,
      cart: cart
    };
    localStorage.setItem('greenwash_pending_order', JSON.stringify(pendingOrder));
    if (session && role === 'customer') {
      navigate('/customer/new-order');
    } else {
      navigate('/customer/login?mode=signup');
    }
  };

  const getDashboardPath = (r: typeof role) => {
    if (r === 'super_admin') return '/super-admin/dashboard';
    if (r === 'admin') return '/admin/dashboard';
    return '/dashboard';
  };

  useEffect(() => {
    if (session && role) {
      if (role === 'customer') {
        // Stay on home page to allow ordering
        return;
      }
      navigate(getDashboardPath(role));
    }
  }, [session, role, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Direct call without 15s timeout so we can see the REAL network error
      const { data, error } = await signIn(email, password);

      if (error) {
        setError(error.message || "Invalid login credentials.");
        setLoading(false);
      } else {
        const r = data?.role ?? null;

        // Prevent infinite redirect loops if role is missing
        if (!r) {
          setError("Your account does not have an assigned role. Please contact a super admin.");
          setLoading(false);
          return;
        }

        navigate(getDashboardPath(r));
      }
    } catch (e: any) {
      console.error("Login error:", e);
      setError(e.message || "An unexpected error occurred during login.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 scroll-smooth">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-emerald-50">
        <div className="max-w-7xl mx-auto px-6 h-28 flex items-center justify-between">
          <div className="flex items-center cursor-pointer transition-transform active:scale-95" onClick={() => window.scrollTo(0, 0)}>
            <img
              src="/assets/logo.jpeg"
              alt="Green Wash Co Logo"
              className="h-24 w-auto object-contain"
            />
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            <a href="#home" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">Home</a>
            <a href="#steps" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">How it works</a>
            <a href="#services" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">Services</a>
            <Link
              to="/customer/login"
              className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-5 py-2 rounded-full text-xs font-bold active:scale-95 transition-all"
            >
              Customer Login
            </Link>
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
            <Link
              to="/customer/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="border-2 border-emerald-600 text-emerald-600 px-5 py-3 rounded-xl text-center text-sm font-bold active:scale-95 transition-all"
            >
              Customer Login
            </Link>
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

      {/* Services & Ordering Section */}
      <section id="services" className="py-24 bg-emerald-50/20 scroll-mt-28">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-emerald-600 font-black uppercase tracking-[0.2em] text-xs lg:text-sm mb-3">Order Online</p>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight">Order Directly from Home</h2>
            <p className="text-slate-400 text-sm font-semibold mt-2">Select a nearby laundry and customize your laundry bag.</p>
          </div>

          {/* Interactive Steps Control */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setOrderStep('vendor')}
              className={cn(
                "px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                orderStep === 'vendor'
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "bg-white border border-slate-100 text-slate-500 hover:text-emerald-600"
              )}
            >
              1. Select Store
            </button>
            <div className="w-8 h-px bg-slate-200" />
            <button
              onClick={() => selectedVendor && setOrderStep('items')}
              disabled={!selectedVendor}
              className={cn(
                "px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                orderStep === 'items'
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "bg-white border border-slate-100 text-slate-500 hover:text-emerald-600 disabled:opacity-55 disabled:cursor-not-allowed"
              )}
            >
              2. Add Items
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-emerald-100/50 p-6 sm:p-8 shadow-sm">
            {/* ─── VENDOR SELECTION STEP ─── */}
            {orderStep === 'vendor' && (
              <div className="space-y-6">
                <div className="relative max-w-md mx-auto">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="text"
                    placeholder="Search laundry store by name or city..."
                    value={vendorSearch}
                    onChange={e => setVendorSearch(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all font-medium"
                  />
                </div>

                {loadingVendors ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-3">Loading stores...</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {vendors.filter(v => `${v.name} ${v.city || ''}`.toLowerCase().includes(vendorSearch.toLowerCase())).map(v => (
                      <button
                        key={v.id}
                        onClick={() => { setSelectedVendor(v); setOrderStep('items'); }}
                        className={cn(
                          "w-full text-left p-5 rounded-2xl border transition-all relative flex gap-4 group",
                          selectedVendor?.id === v.id
                            ? "border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500"
                            : "border-slate-100 hover:border-emerald-300 hover:shadow-sm"
                        )}
                      >
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                          <Store size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-slate-950 text-sm leading-snug">{v.name}</h4>
                          <p className="text-xs text-slate-400 font-medium mt-1 truncate">
                            {v.address ? `${v.address}, ` : ''}{v.city || ''}
                          </p>
                          {v.phone && <p className="text-[10px] font-bold text-emerald-600 mt-1">{v.phone}</p>}
                        </div>
                        <div className="absolute right-4 top-4 w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-emerald-400">
                          {selectedVendor?.id === v.id && (
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── ITEMS SELECTION STEP ─── */}
            {orderStep === 'items' && (
              <div className="space-y-6">
                {/* Active store summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/40 rounded-2xl p-4 border border-emerald-100/30">
                  <div className="flex items-center gap-3">
                    <Store className="text-emerald-600 shrink-0" size={20} />
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ordering From</p>
                      <h4 className="font-black text-slate-900 text-sm">{selectedVendor?.name}</h4>
                    </div>
                  </div>
                  <button
                    onClick={() => setOrderStep('vendor')}
                    className="text-xs font-black text-emerald-600 hover:underline flex items-center gap-1 self-start sm:self-auto"
                  >
                    <ChevronLeft size={14} /> Change Store
                  </button>
                </div>

                {/* Search Bar for items */}
                <div className="relative max-w-md">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search laundry items (e.g. Bed Sheet, Blazer)..."
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all font-medium placeholder:text-slate-400"
                  />
                </div>

                {loadingItems ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-3">Loading menu...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clothTypes
                      .filter(cloth => cloth.name.toLowerCase().includes(itemSearch.toLowerCase()))
                      .map(cloth => {
                        const services: ('wash' | 'iron' | 'dry_clean')[] = [];
                        if (Number(cloth.wash_price) > 0) services.push('wash');
                        if (Number(cloth.iron_price) > 0) services.push('iron');
                        if (Number(cloth.dry_clean_price) > 0) services.push('dry_clean');
                        if (services.length === 0) services.push('wash');

                        return (
                          <div key={cloth.id} className="bg-slate-50/50 rounded-2xl border border-slate-100/70 p-4 flex flex-col justify-between hover:border-emerald-100 transition-colors">
                            <div className="flex items-center gap-2.5 mb-3">
                              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
                                <Shirt size={14} className="text-emerald-500" />
                              </div>
                              <p className="font-black text-slate-900 text-sm">{cloth.name}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {services.map(svc => {
                                const price =
                                  svc === 'wash' ? Number(cloth.wash_price || 0) :
                                  svc === 'iron' ? Number(cloth.iron_price || 0) :
                                  Number(cloth.dry_clean_price || 0);
                                const cartItem = getCartItem(cloth.id, svc);
                                const label = svc === 'wash' ? 'Wash' : svc === 'iron' ? 'Iron' : 'Dry Clean';

                                return (
                                  <div key={svc} className="bg-white border border-slate-100 rounded-xl p-1.5 px-2.5 flex items-center gap-2 shadow-sm shrink-0">
                                    <div>
                                      <p className="text-[9px] font-black text-slate-400 uppercase leading-none">{label}</p>
                                      <p className="text-xs font-black text-emerald-600 mt-1">₹{price}</p>
                                    </div>

                                    <div className="flex items-center gap-1.5 ml-1">
                                      {cartItem ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => setQty(cloth, svc, -1)}
                                            className="w-5.5 h-5.5 rounded bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                                          >
                                            <Minus size={10} />
                                          </button>
                                          <span className="w-3 text-center text-xs font-black text-slate-900">{cartItem.quantity}</span>
                                          <button
                                            type="button"
                                            onClick={() => setQty(cloth, svc, 1)}
                                            className="w-5.5 h-5.5 rounded bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-600 transition-colors"
                                          >
                                            <Plus size={10} />
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setQty(cloth, svc, 1)}
                                          className="h-5.5 px-2 rounded bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-black flex items-center gap-0.5 hover:bg-emerald-100 transition-colors"
                                        >
                                          <Plus size={8} /> Add
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky checkout summary bar (Opens Sidebar) */}
          {cart.length > 0 && orderStep === 'items' && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl z-50 bg-slate-900 rounded-3xl p-4 sm:p-5 text-white flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300 shadow-2xl shadow-emerald-950/30 border border-slate-800/80">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm">{cart.reduce((s, i) => s + i.quantity, 0)} Items Added</h4>
                  <p className="text-[10px] sm:text-xs text-slate-300 font-semibold mt-0.5">Total Value: <span className="text-emerald-400 font-black text-xs sm:text-base ml-1">₹{cartTotal.toLocaleString('en-IN')}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="h-10 sm:h-12 px-4 sm:px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm shrink-0"
              >
                <span>Review Laundry Bag</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Cart Floating Card Modal */}
          {isCartOpen && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={() => setIsCartOpen(false)}
              />
              {/* Floating Card Panel */}
              <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 flex flex-col border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-955 flex items-center gap-2">
                      <ShoppingBag className="text-emerald-600" size={18} />
                      <span>My Laundry Bag</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-1">
                      {selectedVendor?.name ? `Ordering from ${selectedVendor.name}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Scrollable Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[50vh] scrollbar-thin">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
                      <ShoppingBag size={40} className="text-slate-200 mb-2" />
                      <p className="font-black text-sm">Your laundry bag is empty</p>
                      <p className="text-xs text-slate-300 mt-1">Go back and add some items to your bag.</p>
                    </div>
                  ) : (
                    cart.map((item, idx) => {
                      const label = item.service === 'wash' ? 'Wash & Fold' : item.service === 'iron' ? 'Iron Only' : 'Dry Clean';
                      const cloth = clothTypes.find(c => c.id === item.cloth_type_id) || {};

                      return (
                        <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-black text-slate-900 text-sm truncate">{item.item_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{label}</p>
                            <p className="text-xs font-black text-emerald-600 mt-1">₹{item.subtotal / item.quantity} each</p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Quantity controls */}
                            <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-xl p-1 shadow-sm">
                              <button
                                type="button"
                                onClick={() => setQty(cloth, item.service, -1)}
                                className="w-5.5 h-5.5 rounded bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="w-4 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => setQty(cloth, item.service, 1)}
                                className="w-5.5 h-5.5 rounded bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-600 transition-colors"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                            <p className="text-xs font-black text-slate-900 w-12 text-right">₹{item.subtotal.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Summary & Checkout */}
                {cart.length > 0 && (
                  <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="font-black text-slate-900 text-sm">Cart Subtotal</p>
                      <p className="font-black text-emerald-600 text-lg">₹{cartTotal.toLocaleString('en-IN')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleProceedOrder}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <span>Confirm & Checkout</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
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
                src="/assets/logo.jpeg"
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
              <li><Link to="/privacy-policy" className="hover:text-emerald-600 cursor-pointer transition-colors">Privacy</Link></li>
              <li><Link to="/request-delete-account" className="hover:text-emerald-600 cursor-pointer transition-colors">Delete Account</Link></li>
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
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-14 pl-12 pr-12 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all font-medium"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
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
