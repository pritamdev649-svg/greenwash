import React, { useState, useEffect } from 'react';
import { Send, Users, AlertCircle, CheckCircle2, ImagePlus, X } from 'lucide-react';
import { customerService } from '@backend/services/customerService';
import { notificationService } from '@backend/services/notificationService';
import { supabase } from '@backend/config/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminBroadcast() {
  const { vendorId } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({ total: 0, sent: 0, failed: 0 });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [vendorId]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      // Admin sees customers for their assigned branch/vendorId.
      // If super_admin, they might see all or need branch selection, but assuming vendorId is context.
      const data = await customerService.getAllCustomers(vendorId);
      // Filter out those without mobile numbers
      const validCustomers = data.filter(c => c.mobile && c.mobile.trim() !== '');
      setCustomers(validCustomers);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      setMediaPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaPreviewUrl(null);
  };

  const handleBroadcast = async () => {
    if (!message.trim() && !mediaFile) {
      alert("Please enter a message or attach an image to broadcast.");
      return;
    }

    if (!window.confirm(`Are you sure you want to send this broadcast to ${customers.length} customers?`)) {
      return;
    }

    setIsSending(true);
    setProgress({ total: customers.length, sent: 0, failed: 0 });

    let uploadedMediaUrl: string | undefined = undefined;

    if (mediaFile) {
      try {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `broadcast_${Date.now()}.${fileExt}`;
        const { error } = await supabase.storage.from('receipts').upload(fileName, mediaFile, {
          cacheControl: '3600',
          upsert: false
        });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(fileName);
        uploadedMediaUrl = publicUrl;
      } catch (err) {
        console.error("Failed to upload media:", err);
        alert("Failed to upload image. Broadcasting without it.");
      }
    }

    let successCount = 0;
    let failCount = 0;

    for (const customer of customers) {
      try {
        const response = await notificationService.sendAutomatedWhatsApp(customer.mobile, message, uploadedMediaUrl);
        if (response.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }
      
      setProgress({ total: customers.length, sent: successCount, failed: failCount });
      
      // Artificial delay to prevent rate-limiting/spam flags
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsSending(false);
    alert(`Broadcast complete! Sent: ${successCount}, Failed: ${failCount}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Send className="text-primary-600" size={32} />
          Broadcast Message
        </h1>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Total Reach</h3>
            {loading ? (
              <div className="h-5 w-24 bg-slate-200 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-slate-500 text-sm">{customers.length} customers with valid mobile numbers</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-slate-700">Message Content</label>
              <label className="cursor-pointer text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-bold transition-colors">
                <ImagePlus size={16} />
                <span>Attach Image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleMediaChange} disabled={isSending || loading} />
              </label>
            </div>
            
            {mediaPreviewUrl && (
              <div className="relative mb-4 inline-block">
                <img src={mediaPreviewUrl} alt="Preview" className="h-32 rounded-xl object-cover border border-slate-200 shadow-sm" />
                <button 
                  onClick={removeMedia} 
                  disabled={isSending} 
                  className="absolute -top-2 -right-2 p-1 bg-white text-rose-500 rounded-full shadow-md border border-slate-100 hover:bg-rose-50 transition-colors"
                >
                  <X size={14} className="stroke-[3]" />
                </button>
              </div>
            )}

            <textarea
              className="w-full h-40 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none resize-none"
              placeholder="Write your promotional offer, announcement, or greeting here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending || loading}
            />
            <p className="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1">
              <AlertCircle size={14} /> Messages will be sent via WhatsApp Automation API.
            </p>
          </div>

          {isSending && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between text-sm font-bold text-slate-700">
                <span>Sending Broadcast...</span>
                <span>{progress.sent + progress.failed} / {progress.total}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-primary-500 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${((progress.sent + progress.failed) / Math.max(1, progress.total)) * 100}%` }}
                ></div>
              </div>
              <div className="flex gap-4 text-xs font-medium">
                <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14}/> Sent: {progress.sent}</span>
                <span className="text-rose-600 flex items-center gap-1"><AlertCircle size={14}/> Failed: {progress.failed}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={handleBroadcast}
              disabled={isSending || loading || customers.length === 0}
              className="px-8 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Broadcast Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
