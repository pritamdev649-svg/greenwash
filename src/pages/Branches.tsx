import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, Phone, Building2, Search, X } from 'lucide-react';
import { branchService } from '@backend/services/branchService';
import { useLanguage } from '../contexts/LanguageContext';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
}

const Branches: React.FC = () => {
  const { t } = useLanguage();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '', phone: '' });

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const data = await branchService.getAllBranches();
      setBranches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await branchService.updateBranch(editingBranch.id, formData.name, formData.address, formData.phone);
      } else {
        await branchService.addBranch(formData.name, formData.address, formData.phone);
      }
      setIsModalOpen(false);
      setEditingBranch(null);
      setFormData({ name: '', address: '', phone: '' });
      fetchBranches();
    } catch (err) {
      alert("Failed to save branch");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this branch? This action cannot be undone.')) {
      try {
        await branchService.deleteBranch(id);
        fetchBranches();
      } catch (err) {
        alert("Failed to delete branch");
      }
    }
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('branch_network')}</h2>
          <p className="text-sm text-slate-500 font-medium">{t('manage_branches')}</p>
        </div>
        <button 
          onClick={() => { setIsModalOpen(true); setEditingBranch(null); setFormData({ name: '', address: '', phone: '' }); }}
          className="btn-primary flex h-11 px-5 items-center gap-2 rounded-xl shadow-lg shadow-primary-600/20 active:scale-95 transition-all text-sm font-bold"
        >
          <Plus size={18} />
          <span>{t('add_branch_btn')}</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search branches by name or location..."
            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 whitespace-nowrap px-4 select-none">
          {filteredBranches.length} {t('branches').toUpperCase()}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="table-header w-[40px]">#</th>
                <th className="table-header">{t('customer_profile')}</th>
                <th className="table-header">{t('address')}</th>
                <th className="table-header text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                   <td colSpan={4} className="h-32 text-center">
                      <div className="flex justify-center"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent animate-spin rounded-full"></div></div>
                   </td>
                </tr>
              ) : filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan={4} className="h-48 text-center bg-slate-50/20">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Building2 size={40} className="opacity-20" />
                      <p className="text-sm font-medium">No branches found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : filteredBranches.map((branch, index) => (
                <tr key={branch.id} className="table-row group">
                  <td className="table-cell font-bold text-slate-400 text-xs">{index + 1}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                        {branch.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{branch.name}</div>
                        <div className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone size={12} className="text-slate-400" />
                          {branch.phone || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-start gap-2 max-w-xs">
                      <MapPin size={14} className="text-slate-400 mt-1 shrink-0" />
                      <span className="text-sm font-medium text-slate-600 line-clamp-2">{branch.address || 'No address provided'}</span>
                    </div>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex justify-end gap-3">
                      <button 
                         onClick={() => { setEditingBranch(branch); setFormData({ name: branch.name, address: branch.address, phone: branch.phone }); setIsModalOpen(true); }}
                         className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                         title="Edit Branch"
                      >
                         <Edit2 size={15} strokeWidth={2.5} />
                      </button>
                      <button 
                        onClick={() => handleDelete(branch.id)}
                        className="w-9 h-9 flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all shadow-lg shadow-rose-600/20 active:scale-95"
                        title="Delete Branch"
                      >
                         <Trash2 size={15} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">{editingBranch ? 'Update Branch' : 'Create New Branch'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 tracking-wider">BRANCH NAME</label>
                <input
                  required
                  className="input h-11 font-medium bg-slate-50 focus:bg-white"
                  placeholder="e.g. Green Wash Co South Central"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 tracking-wider">CONTACT PHONE</label>
                <input
                  className="input h-11 font-medium bg-slate-50 focus:bg-white"
                  placeholder="+91-000-000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 tracking-wider">FULL ADDRESS</label>
                <textarea
                  className="input min-h-[100px] resize-none py-3 font-medium bg-slate-50 focus:bg-white"
                  placeholder="Street name, landmark, city..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn border-slate-200 text-slate-600 font-bold h-12 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 btn-primary font-bold h-12 rounded-xl shadow-lg shadow-primary-600/20 active:scale-95 transition-all">
                  {editingBranch ? 'Update Branch' : 'Register Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;
