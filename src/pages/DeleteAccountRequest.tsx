import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@backend/config/supabase';

const DeleteAccountRequest: React.FC = () => {
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleDeleteRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrEmail.trim()) {
      setError('Please provide your account phone number or email.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const { error: dbError } = await supabase
        .from('account_deletion_requests')
        .insert([
          {
            phone_or_email: phoneOrEmail.trim(),
            reason: reason.trim() || null,
            status: 'pending'
          }
        ]);

      if (dbError) throw dbError;

      setSuccess(true);
      setPhoneOrEmail('');
      setReason('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again or contact support.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 py-12 px-4 md:px-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-sm shadow-sm p-8 md:p-12">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft size={16} /> Back to Home
            </Link>
            <span className="text-xs text-slate-400 font-mono uppercase font-bold text-red-600">Account Action</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            Request Account Deletion
          </h1>
          <p className="text-slate-500 text-sm">
            Please fill out the form below to submit a request to delete your GreenWash account and associated personal data.
          </p>
        </div>

        {/* Form Body */}
        {success ? (
          <div className="space-y-6 py-6 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
              ✓
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Request Successful</h2>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                Your request to delete your account has been registered successfully. Our administration team will review and process your request shortly.
              </p>
            </div>
            <div className="pt-4">
              <Link
                to="/"
                className="inline-flex bg-slate-800 hover:bg-slate-950 text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-sm transition-colors"
              >
                Go to Home Page
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleDeleteRequest} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 text-sm rounded-sm font-semibold">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Account Details (Phone number or Email) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. +919000000002 or user@example.com"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-slate-500 bg-white"
              />
              <p className="text-xs text-slate-400">
                Provide the exact email address or mobile number associated with your customer or vendor account.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Reason for deletion <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                placeholder="Please let us know the reason you want to delete your account."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full border border-slate-300 rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-slate-500 bg-white resize-none"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-sm">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Important Notice</h4>
              <p className="text-xs text-amber-700 leading-relaxed">
                Account deletion is permanent. Once completed, your profile, active order history, addresses, and loyalty rewards will be deleted. This action cannot be undone.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-slate-800 hover:bg-slate-950 text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting Request...' : 'Submit Deletion Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default DeleteAccountRequest;
