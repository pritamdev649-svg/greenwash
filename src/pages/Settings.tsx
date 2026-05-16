import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Settings as SettingsIcon, 
  FileText, 
  Globe, 
  Save, 
  CheckCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const [terms, setTerms] = useState<string[]>([]);
  const [newTerm, setNewTerm] = useState('');
  const [reviewLink, setReviewLink] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const savedTerms = localStorage.getItem('app_terms_conditions');
    if (savedTerms) {
      setTerms(JSON.parse(savedTerms));
    } else {
      // Default Hindi terms
      const defaults = [
        "कपड़ों की धुलाई व रंगाई वैज्ञानिक तरीके से पूरी सावधानी से की जाती है लेकिन कपड़ों की अवस्था की वजह से कपड़े ग्राहक की जिम्मेदारी पर स्वीकार किये जाते हैं।",
        "कपड़ा उसी समय कटा या फटा देख पाना सम्भव नहीं है यदि धुलाई एवं रंगाई के समय वह दिखाई पड़ जाता है तो वर्कशाप इंचार्ज का कथन ही अंतिम व कानूनी तौर पर ग्राहक मान्य होगा।",
        "सभी दाग, धब्बे छुड़ाने की गारन्टी नहीं है फिर भी उसे छुड़ाने का पूरा प्रयास किया जाता है।"
      ];
      setTerms(defaults);
      localStorage.setItem('app_terms_conditions', JSON.stringify(defaults));
    }

    const savedReviewLink = localStorage.getItem('app_review_link');
    if (savedReviewLink) {
      setReviewLink(savedReviewLink);
    }
  }, []);

  const handleAddTerm = () => {
    if (!newTerm.trim()) return;
    const updated = [...terms, newTerm.trim()];
    setTerms(updated);
    setNewTerm('');
  };

  const handleDeleteTerm = (index: number) => {
    const updated = terms.filter((_, i) => i !== index);
    setTerms(updated);
  };

  const handleSave = () => {
    localStorage.setItem('app_terms_conditions', JSON.stringify(terms));
    localStorage.setItem('app_review_link', reviewLink);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <SettingsIcon className="text-emerald-600" />
            {t('settings')}
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">Configure your business rules and preferences</p>
        </div>
        
        {showSuccess && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full font-bold animate-in slide-in-from-top duration-300">
            <CheckCircle size={18} />
            Settings Saved!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Language */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 ring-1 ring-slate-900/5">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t('language')}</h3>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">App Interface</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { id: 'en', label: t('english'), sub: 'Standard Business English' },
                { id: 'hi', label: t('hindi'), sub: 'व्यवसायिक हिंदी' }
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id as any)}
                  className={cn(
                    "w-full p-4 rounded-2xl flex items-center justify-between border-2 transition-all active:scale-95 group",
                    language === lang.id 
                      ? "border-indigo-600 bg-indigo-50/50" 
                      : "border-slate-100 hover:border-indigo-200"
                  )}
                >
                  <div className="text-left">
                    <p className={cn("font-bold", language === lang.id ? "text-indigo-900" : "text-slate-700")}>{lang.label}</p>
                    <p className="text-xs text-slate-400 font-medium">{lang.sub}</p>
                  </div>
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    language === lang.id ? "bg-indigo-600 border-indigo-600" : "border-slate-200"
                  )}>
                    {language === lang.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Review Link Section */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 ring-1 ring-slate-900/5">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <Plus size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Google Review</h3>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Review Link</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Google Maps Review Link</p>
                <input
                  type="text"
                  value={reviewLink}
                  onChange={(e) => setReviewLink(e.target.value)}
                  placeholder="Paste your link here..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 italic">This link will be automatically added to the WhatsApp delivery message.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Terms & Conditions */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{t('terms_conditions')}</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Rules appearing on all PDFs</p>
                </div>
              </div>
              
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 h-12 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
              >
                <Save size={18} />
                {t('save_settings')}
              </button>
            </div>

            <div className="space-y-4 mb-8">
              {terms.map((term, index) => (
                <div key={index} className="flex gap-4 p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-slate-200 transition-all">
                  <div className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xs font-black text-slate-400 shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-slate-600 font-medium flex-grow leading-relaxed">{term}</p>
                  <button 
                    onClick={() => handleDeleteTerm(index)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-2 bg-slate-100 rounded-2xl flex gap-2">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Enter a new term or condition..."
                className="flex-grow bg-transparent px-4 py-3 text-slate-700 font-medium focus:outline-none placeholder:text-slate-400"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTerm()}
              />
              <button
                onClick={handleAddTerm}
                className="w-12 h-12 bg-white text-slate-900 rounded-xl flex items-center justify-center shadow-sm hover:bg-emerald-600 hover:text-white transition-all active:scale-90"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
