import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Nav & General
    dashboard: 'Dashboard',
    branches: 'Branches',
    customers: 'Customers',
    categories: 'Services',
    orders: 'Order History',
    settings: 'Settings',
    logout: 'Log Out',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    loading: 'Loading...',

    // Dashboard
    operational_overview: 'Operational Overview',
    live_ledger: 'Live Ledger Tracking',
    total_customers: 'Total Customers',
    active_orders: 'Active Orders',
    todays_sales: 'Today\'s Sales',
    total_outstanding: 'Total Outstanding',
    live_efficiency_metrics: 'Live Efficiency Metrics',
    sales_analysis: 'Sales Analysis',
    recent_ledger: 'Recent Ledger Entries',
    last_month: 'Last Month',
    this_week: 'This Week',
    this_month: 'This Month',
    this_quarter: 'This Quarter',
    half_year: 'Half Year',
    this_year: 'This Year',

    // Orders Page
    order_ledger: 'Order Ledger',
    manage_track: 'Manage, Track, and Fulfill laundry transactions.',
    new_entry: 'New Order',
    search_placeholder: 'Search orders, customers...',
    id: 'ID',
    timestamp: 'Timestamp',
    customer_profile: 'Customer Profile',
    total_bill: 'Total Bill',
    advance: 'Advance',
    remaining: 'Remaining',
    payment: 'Payment',
    status: 'Status',
    actions: 'Actions',

    // Order Entry Form
    new_sale_entry: 'New Sale Entry',
    assign_party: 'Assign Party (Customer)',
    search_customer_hint: 'Search customer by name or mobile...',
    contact_detail: 'Contact Detail',
    invoice_no: 'Invoice No',
    entry_date: 'Entry Date',
    delivery_date: 'Delivery Date',
    billing_items: 'Billing Items',
    service: 'Service',
    item_name: 'Item Name',
    qty: 'Qty',
    rate: 'Rate',
    amount: 'Amount',
    add_item: 'Add Another Line Item',
    checkout_summary: 'Checkout Summary',
    edit_bill: 'Edit Bill Entry',
    update_order: 'Update Order',
    confirm_changes: 'CONFIRM CHANGES',
    subtotal: 'Subtotal',
    discount: 'Adjust / Discount',
    advance_received: 'Advance Received',
    remaining_balance: 'Remaining Balance',
    grand_total: 'Grand Total',
    add_customer: 'Add Customer',
    search_orders: 'Search orders, customers...',
    confirm_balance: 'Confirm final balance collection?',
    delete_confirm: 'ARE YOU ABSOLUTELY SURE? THIS RECORD WILL BE PERMANENTLY DELETED.',
    order_saved: 'Order Saved!',
    transaction_recorded: 'Transaction recorded in ledger for',
    next_action: 'What would you like to do next?',
    print_receipt: 'Print Receipt',
    whatsapp: 'WhatsApp',
    done_back: 'Done & Go Back',
    ledger_note_title: 'Digital Ledger Note',
    ledger_note_desc: 'Order is being recorded in live database. Receipt can be generated after saving.',
    save_order: 'Save Order',
    confirm_transaction: 'CONFIRM LEDGER TRANSACTION',

    // Customers
    customer_directory: 'Customer Directory',
    manage_customer_base: 'Manage and maintain your laundry customer base.',
    add_customer_btn: 'Add Customer',
    search_customers: 'Search customers by name, mobile or address...',
    name: 'Name',
    mobile: 'Mobile',
    address: 'Address',
    joined_date: 'Joined Date',

    // Branches
    branch_network: 'Branch Network',
    manage_branches: 'Configure and monitor your service outlets.',
    add_branch_btn: 'Add Branch',
    location: 'Location',
    branch_performance: 'Branch Performance',
    today_orders: 'Today\'s Orders',
    active_status: 'Active Status',

    // Categories
    service_categories: 'Services',
    manage_services: 'Define laundry services and pricing structure.',
    add_category_btn: 'Add Service',
    category_name: 'Service Name',
    base_price: 'Base Price',

    // Settings
    rules: 'Rules & Policy',
    language: 'System Language',
    save_settings: 'Save Settings',
    terms_conditions: 'Terms & Conditions',
    hindi: 'Hindi',
    english: 'English',
    additional_charges: 'Additional Charges',
    carrybag: 'Carrybag',
    delivery_charge: 'Delivery Charge',
    fast_service: 'Fast Service',
    custom: 'Custom',
    label_text: 'Label',
    amount_text: 'Amount',

    // Offers Page
    promotional_offers: 'Promotional Offers',
    rate_list_manager: 'Rate List Manager',
    detailed_promotions: 'Detailed Promotions',
    promotions_desc: 'Create professional banners with headlines, bullet points, and CTAs.',
    design_new_offer: 'Design New Offer',
    no_active_posters: 'No Active Posters',
    no_posters_desc: 'Design your first promotional banner to engage customers.',
    active: 'Active',
    inactive: 'Inactive',
    no_description: 'No description provided',
    edit_promotion: 'Edit Promotion',
    new_promotion: 'New Promotion',
    headline: 'Headline',
    subtext_desc: 'Subtext (Description)',
    key_points: 'Key Points',
    add_point: '+ Add Point',
    button_text: 'Button Text',
    poster_image: 'Poster Image',
    upload_system: 'Upload from System',
    uploading: 'Uploading...',
    paste_url: 'OR PASTE IMAGE URL HERE...',
    image_preview: 'Image Preview',
    update_promotion: 'Update Promotion',
    launch_offer: 'Launch Professional Offer',
    deactivate: 'Deactivate',
    activate: 'Activate',
    edit_offer: 'Edit Offer',
    delete_offer: 'Delete Offer',
    delete_confirm_poster: 'Delete this offer poster?',
    error_upload: 'Error uploading image:',
    error_save: 'Error saving offer. Please check your database connection.',
    error_delete: 'Error deleting offer',
    required_fields: 'Headline and Image are required!',
    weekly_off: 'Weekly Off Day',
    weekly_off_desc: 'Choose which day the shop is closed.',
    none: 'None (Open 7 Days)',
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    shop_closed_warning: 'The shop is closed on {day}! Delivery date adjusted.'
  },
  hi: {
    // Nav & General
    dashboard: 'डैशबोर्ड',
    branches: 'शाखाएं',
    customers: 'ग्राहक',
    categories: 'सेवाएँ',
    orders: 'ऑर्डर इतिहास',
    settings: 'सेटिंग्स',
    logout: 'लॉग आउट',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    edit: 'बदलें',
    delete: 'हटाएं',
    loading: 'लोड हो रहा है...',

    // Dashboard
    operational_overview: 'परिचालन विवरण',
    live_ledger: 'लाइव लेज़र ट्रैकिंग',
    total_customers: 'कुल ग्राहक',
    active_orders: 'सक्रिय ऑर्डर',
    todays_sales: 'आज की बिक्री',
    total_outstanding: 'कुल बकाया',
    live_efficiency_metrics: 'लाइव दक्षता मेट्रिक्स',
    sales_analysis: 'बिक्री विश्लेषण',
    recent_ledger: 'हालिया लेज़र प्रविष्टियां',
    last_month: 'पिछला महीना',
    this_week: 'इस सप्ताह',
    this_month: 'इस महीने',
    this_quarter: 'इस तिमाही',
    half_year: 'अर्ध वर्ष',
    this_year: 'इस साल',

    // Orders Page
    order_ledger: 'ऑर्डर लेज़र',
    manage_track: 'लॉन्ड्री लेनदेन को प्रबंधित और ट्रैक करें।',
    new_entry: 'नया ऑर्डर',
    search_placeholder: 'ऑर्डर, ग्राहक खोजें...',
    id: 'आईडी',
    timestamp: 'समय',
    customer_profile: 'ग्राहक विवरण',
    total_bill: 'कुल बिल',
    advance: 'अग्रिम',
    remaining: 'शेष',
    payment: 'भुगतान',
    status: 'स्थिति',
    actions: 'कार्रवाई',

    // Order Entry Form
    new_sale_entry: 'नई सेल एंट्री',
    assign_party: 'पार्टी चुनें (ग्राहक)',
    search_customer_hint: 'नाम या मोबाइल से खोजें...',
    contact_detail: 'संपर्क विवरण',
    invoice_no: 'इनवॉइस नंबर',
    entry_date: 'तारीख',
    delivery_date: 'डिलीवरी की तारीख',
    billing_items: 'बिलिंग आइटम',
    service: 'सेवा',
    item_name: 'नाम',
    qty: 'मात्रा',
    rate: 'दर',
    amount: 'कुल',
    add_item: 'एक और आइटम जोड़ें',
    checkout_summary: 'बिल का सारांश',
    edit_bill: 'बिल बदलें',
    update_order: 'ऑर्डर अपडेट करें',
    confirm_changes: 'बदलाव की पुष्टि करें',
    subtotal: 'कुल योग',
    discount: 'डिस्काउंट',
    advance_received: 'अग्रिम भुगतान',
    remaining_balance: 'बाकी पैसा',
    grand_total: 'कुल बिल',
    add_customer: 'ग्राहक जोड़ें',
    search_orders: 'ऑर्डर, ग्राहक खोजें...',
    confirm_balance: 'क्या आप बैलेंस कलेक्शन की पुष्टि करते हैं?',
    delete_confirm: 'क्या आप वाकई इसे हटाना चाहते हैं? यह रिकॉर्ड हमेशा के लिए मिट जाएगा।',
    order_saved: 'ऑर्डर सहेजा गया!',
    transaction_recorded: 'लेज़र में लेनदेन दर्ज किया गया:',
    next_action: 'अब आप क्या करना चाहेंगे?',
    print_receipt: 'रसीद प्रिंट करें',
    whatsapp: 'वॉट्सऐप',
    done_back: 'हो गया, वापस जाएं',
    ledger_note_title: 'डिजिटल लेज़र नोट',
    ledger_note_desc: 'ऑर्डर डेटाबेस में दर्ज किया जा रहा है। रसीद सेव करने के बाद बनेगी।',
    save_order: 'ऑर्डर सहेजें',
    confirm_transaction: 'लेनदेन की पुष्टि करें',

    // Customers
    customer_directory: 'ग्राहक सूची',
    manage_customer_base: 'अपने लॉन्ड्री ग्राहकों के आधार को प्रबंधित और बनाए रखें।',
    add_customer_btn: 'ग्राहक जोड़ें',
    search_customers: 'नाम, मोबाइल या पते से ग्राहक खोजें...',
    name: 'नाम',
    mobile: 'मोबाइल',
    address: 'पता',
    joined_date: 'जुड़ने की तारीख',

    // Branches
    branch_network: 'शाखा नेटवर्क',
    manage_branches: 'अपने सर्विस आउटलेट्स को कॉन्फ़िगर और मॉनिटर करें।',
    add_branch_btn: 'शाखा जोड़ें',
    location: 'स्थान',
    branch_performance: 'शाखा का प्रदर्शन',
    today_orders: 'आज के ऑर्डर',
    active_status: 'सक्रिय स्थिति',

    // Services
    service_categories: 'सेवाएँ',
    manage_services: 'लॉन्ड्री सेवाएँ और मूल्य संरचना निर्धारित करें।',
    add_category_btn: 'सेवा जोड़ें',
    category_name: 'सेवा का नाम',
    base_price: 'आधार मूल्य',

    // Settings
    rules: 'नियम और नीति',
    language: 'सिस्टम की भाषा',
    save_settings: 'सेटिंग्स सहेजें',
    terms_conditions: 'शर्तें और नियम',
    hindi: 'हिंदी',
    english: 'अंग्रेजी',
    additional_charges: 'अतिरिक्त शुल्क',
    carrybag: 'कैरीबैग',
    delivery_charge: 'डिलीवरी शुल्क',
    fast_service: 'फास्ट सर्विस',
    custom: 'कस्टम',
    label_text: 'लेबल',
    amount_text: 'राशि',

    // Offers Page
    promotional_offers: 'प्रमोशनल ऑफर्स',
    rate_list_manager: 'रेट लिस्ट मैनेजर',
    detailed_promotions: 'विस्तृत प्रमोशन',
    promotions_desc: 'हेडलाइन, बुलेट पॉइंट और CTA के साथ पेशेवर बैनर बनाएं।',
    design_new_offer: 'नया ऑफर डिजाइन करें',
    no_active_posters: 'कोई सक्रिय पोस्टर नहीं',
    no_posters_desc: 'ग्राहकों को जोड़ने के लिए अपना पहला प्रमोशनल बैनर डिजाइन करें।',
    active: 'सक्रिय',
    inactive: 'निष्क्रिय',
    no_description: 'कोई विवरण नहीं दिया गया',
    edit_promotion: 'प्रमोशन बदलें',
    new_promotion: 'नया प्रमोशन',
    headline: 'हेडलाइन',
    subtext_desc: 'सबटेक्स्ट (विवरण)',
    key_points: 'मुख्य बिंदु',
    add_point: '+ पॉइंट जोड़ें',
    button_text: 'बटन का टेक्स्ट',
    poster_image: 'पोस्टर इमेज',
    upload_system: 'सिस्टम से अपलोड करें',
    uploading: 'अपलोड हो रहा है...',
    paste_url: 'या यहाँ इमेज URL पेस्ट करें...',
    image_preview: 'इमेज प्रिव्यू',
    update_promotion: 'प्रमोशन अपडेट करें',
    launch_offer: 'प्रोफेशनल ऑफर लॉन्च करें',
    deactivate: 'निष्क्रिय करें',
    activate: 'सक्रिय करें',
    edit_offer: 'ऑफर बदलें',
    delete_offer: 'ऑफर हटाएं',
    delete_confirm_poster: 'क्या आप इस ऑफर पोस्टर को हटाना चाहते हैं?',
    error_upload: 'इमेज अपलोड करने में त्रुटि:',
    error_save: 'ऑफर सहेजने में त्रुटि। कृपया अपना डेटाबेस कनेक्शन जांचें।',
    error_delete: 'ऑफर हटाने में त्रुटि',
    required_fields: 'हेडलाइन और इमेज अनिवार्य हैं!',
    weekly_off: 'साप्ताहिक अवकाश',
    weekly_off_desc: 'चुनें कि किस दिन दुकान बंद रहती है।',
    none: 'कोई नहीं (7 दिन खुली)',
    sunday: 'रविवार',
    monday: 'सोमवार',
    tuesday: 'मंगलवार',
    wednesday: 'बुधवार',
    thursday: 'गुरुवार',
    friday: 'शुक्रवार',
    saturday: 'शनिवार',
    shop_closed_warning: '{day} को दुकान बंद रहती है! डिलीवरी की तारीख को अगले कार्यदिवस पर सेट कर दिया गया है।'
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
