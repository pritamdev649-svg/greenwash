import React from 'react';
import toWords from 'number-to-words';
import { QRCodeSVG } from 'qrcode.react';

export interface PrintReceiptProps {
  orderData: {
    orderNo: string;
    date: string;
    dueDate: string;
    customerName: string;
    customerAddress: string;
    customerPhone: string;
    items: Array<{
      id: string;
      name: string;
      category: string;
      qty: number;
      price: number;
      amount: number;
    }>;
    subTotal: number;
    discount: number;
    total: number;
    advance: number;
    balance: number;
  };
}

export const PrintReceipt: React.FC<PrintReceiptProps> = ({ orderData }) => {
  // Convert number to words, handle decimal roughly or just round
  const roundedTotal = Math.round(orderData.total);
  const words = toWords.toWords(roundedTotal);
  // Capitalize each word
  const capitalizedWords = words
    .replace(/-/g, ' ')
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  const amountInWords = `${capitalizedWords} Rupees only`;

  return (
    <div className="hidden print:block font-sans text-black p-8 w-full bg-white relative printable-area" style={{ fontFamily: 'Arial, sans-serif', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}>
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-400 pb-2 mb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#2FA84B' }}>Green Wash Co.</h1>
          <p className="text-[11px] text-gray-700 mt-1">Hari Nagar Colony , Ayodhya Road Chinhat Lucknow</p>
          <p className="text-[11px] text-gray-700">Phone no. : 9451034909</p>
          <p className="text-[11px] text-gray-700">Email : info@greenwashco.in</p>
        </div>
        <div>
          <img src="/assets/greenwashlogo.jpeg" alt="Green Wash Co Logo" className="h-20 object-contain" />
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
          {orderData.items.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-300">
              <td className="py-1.5 px-2 text-[11px]">{idx + 1}</td>
              <td className="py-1.5 px-2 text-[11px]">{item.name}</td>
              <td className="py-1.5 px-2 text-[11px] text-center">{item.qty}</td>
              <td className="py-1.5 px-2 text-[11px] text-right">₹ {item.price.toFixed(1)}</td>
              <td className="py-1.5 px-2 text-[11px] text-right">₹ {item.amount.toFixed(1)}</td>
            </tr>
          ))}
          {/* Total Row */}
          <tr className="border-b-2 border-slate-600 font-bold">
            <td colSpan={4} className="py-1.5 px-8 text-xs text-center">Total</td>
            <td className="py-1.5 px-2 text-[11px] text-right">₹ {orderData.items.reduce((s, i) => s + i.amount, 0).toFixed(1)}</td>
          </tr>
        </tbody>
      </table>

      {/* Lower section */}
      <div className="flex justify-between mt-4">
        <div className="w-3/5 pr-4 flex flex-col justify-between">
          <div>
            <p className="font-bold text-[11px] mb-1">Order Amount In Words</p>
            <p className="text-[11px] mb-4 text-gray-800">{amountInWords}</p>

            <p className="font-bold text-[11px] mb-1 mt-4">Terms and Conditions</p>
            <p className="text-[10px] text-gray-800 leading-tight mb-0.5 max-w-sm">कपड़ों की धुलाई व रंगाई वैज्ञानिक तरीके से पूरी सावधानी से की जाती है लेकिन कपड़ों की अवस्था की वजह से कपड़े ग्राहक की जिम्मेदारी पर स्वीकार किये जाते हैं।</p>
            <p className="text-[10px] text-gray-800 leading-tight mb-0.5 max-w-sm">कपड़ा उसी समय कटा या फटा देख पाना सम्भव नहीं है यदि धुलाई एवं रंगाई के समय वह दिखाई पड़ जाता है तो वर्कशाप इंचार्ज का कथन ही अंतिम व कानूनी तौर पर ग्राहक मान्य होगा।</p>
            <p className="text-[10px] text-gray-800 leading-tight mb-1 max-w-sm">सभी दाग, धब्बे छुड़ाने की गारन्टी नहीं है फिर भी उसे छुड़ाने का पूरा प्रयास किया जाता है।</p>
            <p className="text-[10px] text-gray-800 mb-4">Thanks for doing business with us!</p>
          </div>
          <div className="mt-2 text-center w-24">
            {/* Simple QR representation or fallback */}
            <div className="w-20 h-20 border border-gray-400 p-1 rounded inline-block bg-white relative flex items-center justify-center">
              <QRCodeSVG 
                value={`upi://pay?pa=greenwashco@upi&pn=GreenWashCo&am=${orderData.balance}&tn=Order_${orderData.orderNo}&cu=INR`}
                size={70}
              />
            </div>
            <div className="bg-[#2FA84B] text-white text-[9px] py-1 mt-1 rounded font-bold w-full mx-auto">SCAN TO PAY</div>
          </div>
        </div>

        <div className="w-2/5 pl-4 flex flex-col justify-between">
          <table className="w-full text-[11px] mt-2 border-collapse">
            <tbody>
              <tr>
                <td className="py-1 text-gray-700">Sub Total</td>
                <td className="py-1 text-right">₹ {(orderData.subTotal || 0).toFixed(1)}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-700">Discount ({orderData.discount > 0 ? (((orderData.discount || 0) / (orderData.subTotal || 1)) * 100).toFixed(1) : 0}%)</td>
                <td className="py-1 text-right">₹ {(orderData.discount || 0).toFixed(1)}</td>
              </tr>
              <tr className="bg-gray-500 text-white font-bold">
                <td className="py-1.5 pl-2">Total</td>
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
                   <path d="M10,30 Q25,5 40,25 T70,10 T90,20" stroke="currentColor" fill="transparent" strokeWidth="2"/>
                   <path d="M20,20 L80,20" stroke="currentColor" fill="transparent" strokeWidth="1"/>
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
