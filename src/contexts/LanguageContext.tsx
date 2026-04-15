import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    dashboard: 'Dashboard',
    branches: 'Branches',
    customers: 'Customers',
    categories: 'Categories',
    orders: 'Orders',
    settings: 'Settings',
    new_entry: 'New Entry',
    active_orders: 'Active Orders',
    todays_sales: 'Today\'s Sales',
    total_outstanding: 'Total Outstanding',
    live_efficiency_metrics: 'Live Efficiency Metrics',
    status: 'Status',
    payment: 'Payment',
    actions: 'Actions',
    rules: 'Rules & Policy',
    language: 'System Language',
    save_settings: 'Save Settings',
    terms_conditions: 'Terms & Conditions',
    hindi: 'Hindi',
    english: 'English'
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    branches: 'शाखाएं',
    customers: 'ग्राहक',
    categories: 'श्रेणियाँ',
    orders: 'ऑर्डर',
    settings: 'सेटिंग्स',
    new_entry: 'नई एंट्री',
    active_orders: 'सक्रिय ऑर्डर',
    todays_sales: 'आज की बिक्री',
    total_outstanding: 'कुल बकाया',
    live_efficiency_metrics: 'लाइव दक्षता मेट्रिक्स',
    status: 'स्थिति',
    payment: 'भुगतान',
    actions: 'कार्रवाई',
    rules: 'नियम और नीति',
    language: 'सिस्टम की भाषा',
    save_settings: 'सेटिंग्स सहेजें',
    terms_conditions: 'शर्तें और नियम',
    hindi: 'हिंदी',
    english: 'अंग्रेजी'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('app_language') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string) => {
    return (translations[language] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
