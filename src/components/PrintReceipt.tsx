import React, { useState, useEffect } from 'react';
import toWords from 'number-to-words';
import { QRCodeSVG } from 'qrcode.react';

export interface PrintReceiptProps {
  isCapture?: boolean;
  orderData: {
    status?: string;
    orderNo: string;
    date: string;
    dueDate: string;
    customerName: string;
    customerAddress: string;
    customerPhone: string;
    vendorName?: string;
    vendorPhone?: string;
    vendorAddress?: string;
    items: Array<{
      id: string;
      name: string;
      category: string;
      qty: number;
      price: number;
      amount: number;
    }>;
    additionalCharges?: Array<{ label: string, amount: number }>;
    subTotal: number;
    discount: number;
    total: number;
    advance: number;
    balance: number;
    coinsRedeemed?: number | null;
    paymentInfo?: {
      upiId?: string | null;
      qrCodeUrl?: string | null;
      qrCodeText?: string | null;
      accountHolderName?: string | null;
    } | null;
  };
}

export const PrintReceipt: React.FC<PrintReceiptProps> = ({ orderData, isCapture }) => {
  // Convert number to words, handle decimal roughly or just round
  const roundedTotal = Math.round(orderData.total);
  const words = orderData.total > 0 ? toWords.toWords(roundedTotal) : 'Zero';
  // Capitalize each word
  const capitalizedWords = words
    .replace(/-/g, ' ')
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const amountInWords = `${capitalizedWords} Rupees only`;

  // Logic to separate standard items and [CHARGE] items
  // This ensures that even for saved orders where charges are merged into items,
  // we still display them professionally in the summary section.
  const displayItems = orderData.items.filter(item => !item.name.startsWith('[CHARGE]'));
  const derivedCharges = orderData.items
    .filter(item => item.name.startsWith('[CHARGE]'))
    .map(item => ({
      label: item.name.replace('[CHARGE] ', '').replace('[CHARGE]', ''),
      amount: item.amount
    }));

  // Combine provided additionalCharges with derived ones
  const finalAdditionalCharges = [
    ...(orderData.additionalCharges || []),
    ...derivedCharges
  ];

  // Get dynamic terms from localStorage
  const [terms, setTerms] = useState<string[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem('app_terms_conditions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTerms(Array.isArray(parsed) ? parsed : [parsed]);
      } catch (e) {
        setTerms([saved]);
      }
    } else {
      setTerms([
        "कपड़ों की धुलाई व रंगाई वैज्ञानिक तरीके से पूरी सावधानी से की जाती है लेकिन कपड़ों की अवस्था की वजह से कपड़े ग्राहक की जिम्मेदारी पर स्वीकार किये जाते हैं।",
        "कपड़ा उसी समय कटा या फटा देख पाना सम्भव नहीं है यदि धुलाई एवं रंगाई के समय वह दिखाई पड़ जाता है तो वर्कशाप इंचार्ज का कथन ही अंतिम व कानूनी तौर पर ग्राहक मान्य होगा।",
        "सभी दाग, धब्बे छुड़ाने की गारन्टी नहीं है फिर भी उसे छुड़ाने का पूरा प्रयास किया जाता है।"
      ]);
    }
  }, []);

  return (
    <div
      id="receipt-print-content"
      // Use absolute positioning off-screen instead of hidden so html2canvas can capture it
      className={isCapture 
        ? "font-sans text-black p-8 w-full bg-white relative overflow-hidden"
        : "absolute -left-[9999px] top-0 print:static print:left-0 font-sans text-black p-8 w-full bg-white printable-area relative overflow-hidden"}
      style={{ fontFamily: 'Arial, sans-serif', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}
    >
      {/* Cancelled Watermark */}
      {orderData.status === 'Cancelled' && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none opacity-20 print:opacity-30">
          <div className="border-[8px] border-red-600 text-red-600 rounded-3xl px-12 py-6 transform -rotate-45 font-black tracking-widest" style={{ fontSize: '100px' }}>
            CANCELLED
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-400 pb-2 mb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#2FA84B' }}>{orderData.vendorName || 'Green Wash Co.'}</h1>
          <p className="text-[11px] text-gray-700 mt-1">{orderData.vendorAddress || 'Hari Nagar Colony , Ayodhya Road Chinhat Lucknow'}</p>
          <p className="text-[11px] text-gray-700">Phone no. : {orderData.vendorPhone || '9451034909'}</p>
          <p className="text-[11px] text-gray-700">Email : info.greenwashco@gmail.com</p>
        </div>
        <div>
          <img src="/assets/logo.jpeg" alt="Green Wash Co Logo" className="h-20 object-contain" />
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-600">Invoice</h2>
        <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 rounded-full border border-slate-200">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Date:</span>
          <span className="text-xs font-black text-primary-600 uppercase">{orderData.dueDate}</span>
        </div>
      </div>

      {/* Addresses */}
      <div className="flex justify-between mb-6">
        <div>
          <p className="font-bold text-sm mb-1">Order From</p>
          <p className="font-bold text-sm">Mr. {orderData.customerName || 'Customer'}</p>
          <p className="text-[11px] mt-1 max-w-[250px]">{orderData.customerAddress || ''}</p>
          <p className="text-[11px] mt-1">Contact No. : {orderData.customerPhone || 'N/A'}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-sm mb-1">Order Details</p>
          <p className="text-[11px]">Order No. : {orderData.orderNo}</p>
          <p className="text-[11px] mt-1">Date : {orderData.date}</p>
          <p className="text-[11px] mt-1">Due Date : {orderData.dueDate}</p>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-left border-collapse mb-1">
        <thead>
          <tr className="bg-gray-500 text-white">
            <th className="py-1 px-2 text-[11px] font-bold w-12 border border-gray-500">Sl.No.</th>
            <th className="py-1 px-2 text-[11px] font-bold border border-gray-500">Item name</th>
            <th className="py-1 px-2 text-[11px] font-bold text-center w-20 border border-gray-500">Quantity</th>
            <th className="py-1 px-2 text-[11px] font-bold text-right w-24 border border-gray-500">Price/ Unit</th>
            <th className="py-1 px-2 text-[11px] font-bold text-right w-24 border border-gray-500">Amount</th>
          </tr>
        </thead>
        <tbody>
          {displayItems.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-300">
              <td className="py-1.5 px-2 text-[11px]">{idx + 1}</td>
              <td className="py-1.5 px-2 text-[11px] font-bold">{item.name}</td>
              <td className="py-1.5 px-2 text-[11px] text-center">{item.qty}</td>
              <td className="py-1.5 px-2 text-[11px] text-right">₹ {item.price.toFixed(1)}</td>
              <td className="py-1.5 px-2 text-[11px] text-right">₹ {item.amount.toFixed(1)}</td>
            </tr>
          ))}
          {/* Total Row */}
          <tr className="border-b-2 border-slate-600 font-bold">
            <td colSpan={2} className="py-1.5 px-8 text-xs text-center uppercase tracking-widest">Total</td>
            <td className="py-1.5 px-2 text-[11px] text-center">{displayItems.reduce((s, i) => s + i.qty, 0)}</td>
            <td className="py-1.5 px-2 text-[11px] text-right"></td>
            <td className="py-1.5 px-2 text-[11px] text-right">₹ {displayItems.reduce((s, i) => s + i.amount, 0).toFixed(1)}</td>
          </tr>
        </tbody>
      </table>

      {/* Lower section */}
      <div className="flex justify-between mt-4">
        <div className="w-3/5 pr-4 flex flex-col justify-between">
          <div>
            <p className="font-bold text-[11px] mb-1">Order Amount In Words</p>
            <p className="text-[11px] mb-4 text-gray-800">{amountInWords}</p>

            <p className="font-bold text-[11px] mb-1 mt-4 text-[#2FA84B]">Terms and Conditions</p>
            <div className="space-y-0.5">
              {terms.map((term, i) => (
                <p key={i} className="text-[10px] text-gray-800 leading-tight max-w-sm">• {term}</p>
              ))}
            </div>
            <p className="text-[10px] text-gray-800 mt-3 italic font-medium">Thanks for doing business with us!</p>
          </div>
          <div className="mt-4 flex gap-6">
            {/* Payment QR Code — uses vendor payment info if available */}
            <div className="text-center w-24">
              <div className="w-20 h-20 border border-gray-400 p-1 rounded inline-block bg-white relative flex items-center justify-center">
                {orderData.paymentInfo?.qrCodeUrl ? (
                  <img src={orderData.paymentInfo.qrCodeUrl} alt="Pay QR" style={{ width: 70, height: 70, objectFit: 'contain' }} />
                ) : (
                  <QRCodeSVG
                    value={
                      orderData.paymentInfo?.qrCodeText ||
                      (orderData.paymentInfo?.upiId
                        ? `upi://pay?pa=${orderData.paymentInfo.upiId}&pn=${encodeURIComponent(orderData.paymentInfo.accountHolderName || 'Green Wash Co')}&am=${orderData.balance}&tn=Order_${orderData.orderNo}&cu=INR`
                        : `upi://pay?pa=9628562024@kotak811&pn=SUMIT%20KUMAR&am=${orderData.balance}&tn=Order_${orderData.orderNo}&cu=INR`)
                    }
                    size={70}
                  />
                )}
              </div>
              <div className="bg-[#2FA84B] text-white text-[9px] py-1 mt-1 rounded font-bold w-full mx-auto uppercase">Scan to Pay</div>
              {orderData.paymentInfo?.upiId && (
                <p className="text-[8px] text-gray-500 mt-0.5 truncate w-24">{orderData.paymentInfo.upiId}</p>
              )}
            </div>

            {/* Google Review QR Code */}
            <div className="text-center w-24">
              <div className="w-20 h-20 border border-[#4285F4] p-1 rounded inline-block bg-white relative flex items-center justify-center">
                <QRCodeSVG
                  value={`https://g.page/r/CWo32A-V7qWGEBM/review`}
                  size={70}
                  fgColor="#4285F4"
                />
              </div>
              <div className="bg-[#4285F4] text-white text-[9px] py-1 mt-1 rounded font-bold w-full mx-auto uppercase">Review Us</div>
            </div>
          </div>
        </div>

        <div className="w-2/5 pl-4 flex flex-col justify-between">
          <table className="w-full text-[11px] mt-2 border-collapse">
            <tbody>
              <tr>
                <td className="py-1 text-gray-700 font-bold">Sub Total</td>
                <td className="py-1 text-right">₹ {(orderData.subTotal || 0).toFixed(1)}</td>
              </tr>
              {orderData.discount > 0 && (
                <tr>
                  <td className="py-1 text-gray-700 font-bold">Discount ({(((orderData.discount || 0) / (orderData.subTotal || 1)) * 100).toFixed(1)}%)</td>
                  <td className="py-1 text-right">₹ {(orderData.discount || 0).toFixed(1)}</td>
                </tr>
              )}
              {finalAdditionalCharges.map((charge, idx) => (
                <tr key={idx}>
                  <td className="py-1 text-gray-700 font-bold">{charge.label}</td>
                  <td className="py-1 text-right">+ ₹ {charge.amount.toFixed(1)}</td>
                </tr>
              ))}
              {orderData.coinsRedeemed && orderData.coinsRedeemed > 0 && (
                <tr className="text-amber-800 font-bold bg-amber-50">
                  <td className="py-1 pl-2">Coins Redeemed</td>
                  <td className="py-1 pr-2 text-right text-amber-700 font-extrabold">- ₹ {orderData.coinsRedeemed.toFixed(1)}</td>
                </tr>
              )}
              <tr className="bg-gray-500 text-white font-bold">
                <td className="py-1.5 pl-2">Grand Total</td>
                <td className="py-1.5 pr-2 text-right">₹ {(orderData.total || 0).toFixed(1)}</td>
              </tr>
              <tr className="font-bold">
                <td className="py-1 pl-2 text-emerald-700">Advance Received</td>
                <td className="py-1 pr-2 text-right text-emerald-700 font-extrabold">₹ {(orderData.advance || 0).toFixed(1)}</td>
              </tr>
              <tr className="bg-gray-50 border-t border-gray-400 font-bold">
                <td className="py-2 pl-2 text-rose-600">REMAINING BALANCE</td>
                <td className="py-2 pr-2 text-right text-rose-600 font-black">₹ {(orderData.balance || 0).toFixed(1)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-[20px] text-center w-full flex flex-col items-center">
            <p className="text-[11px] w-full mt-4 text-center">For :Green Wash Co.</p>
            <div className="mt-[60px] w-32 mx-auto">
              <div className="h-0 border-t border-gray-300 w-full opacity-0"></div>
              {/* Added a red semi-transparent mock signature squiggle for effect */}
              <div className="h-6 w-16 mx-auto -mt-4 opacity-30 mb-2 relative">
                <svg viewBox="0 0 100 40" className="w-full h-full text-red-500 fill-current opacity-80" preserveAspectRatio="none">
                  <path d="M10,30 Q25,5 40,25 T70,10 T90,20" stroke="currentColor" fill="transparent" strokeWidth="2" />
                  <path d="M20,20 L80,20" stroke="currentColor" fill="transparent" strokeWidth="1" />
                </svg>
              </div>
              <p className="text-[11px] font-bold text-center">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
