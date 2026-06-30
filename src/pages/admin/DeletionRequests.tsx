import React, { useEffect, useState } from 'react';
import { supabase } from '@backend/config/supabase';
import { Trash2, CheckCircle, Clock, ShieldAlert, Search } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DeletionRequest {
  id: string;
  phone_or_email: string;
  reason: string | null;
  status: 'pending' | 'completed';
  created_at: string;
}

const DeletionRequests: React.FC = () => {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const { data, error: dbError } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      setRequests((data || []) as DeletionRequest[]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch deletion requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: 'pending' | 'completed') => {
    try {
      const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
      const { error: dbError } = await supabase
        .from('account_deletion_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (dbError) throw dbError;

      // Update state local list
      setRequests(prev =>
        prev.map(req => (req.id === id ? { ...req, status: newStatus } : req))
      );
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this request record?')) return;

    try {
      const { error: dbError } = await supabase
        .from('account_deletion_requests')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // Update state local list
      setRequests(prev => prev.filter(req => req.id !== id));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete record.');
    }
  };

  const filteredRequests = requests.filter(req =>
    req.phone_or_email.toLowerCase().includes(search.toLowerCase()) ||
    (req.reason && req.reason.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldAlert size={28} className="text-red-500" />
          <div>
            <h2 className="text-2xl font-black text-slate-900">Account Deletion Requests</h2>
            <p className="text-sm text-slate-500">View and manage customer requests to delete accounts.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 border border-slate-100 rounded-2xl">
        <div className="relative w-full sm:max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            placeholder="Search details or reasons..."
          />
        </div>
        <button
          onClick={fetchRequests}
          className="text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-xl px-4 py-2"
        >
          Refresh
        </button>
      </div>

      {/* Table view */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50/70 border-b border-slate-100">
                <th className="px-6 py-4">Account Details</th>
                <th className="px-6 py-4">Reason for Deletion</th>
                <th className="px-6 py-4">Request Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-sm font-bold uppercase tracking-wider">
                    No deletion requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                      {req.phone_or_email}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm whitespace-pre-wrap max-w-xs">
                      {req.reason || <span className="italic text-slate-400">No reason provided</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                      {new Date(req.created_at).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(req.id, req.status)}
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors border",
                          req.status === 'completed'
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        )}
                        title="Click to toggle status"
                      >
                        {req.status === 'completed' ? (
                          <>
                            <CheckCircle size={10} /> Completed
                          </>
                        ) : (
                          <>
                            <Clock size={10} /> Pending
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteRecord(req.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all inline-flex"
                        title="Delete Record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeletionRequests;
