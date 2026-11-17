import React, { useEffect, useState } from 'react';
import { Save, ArrowLeft, Plus, Trash2, ChevronDown } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { LoadingSpinner } from './Common';
import { SelectionModal } from '../shared/Shared';

export const AdminResearchEdit = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({ title: '', category: '', abstract: '', researchers: [''] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const navigate = useNavigate();

  const [categories, setCategories] = useState<string[]>(['Technology', 'Agriculture', 'Medicine', 'Business', 'Education', 'Others']);

  useEffect(() => {
    api.getSelectibles().then(res => {
      if (res.category) {
        setCategories(res.category.map((i: any) => i.value));
      }
    });
    
    if (id) {
      api.getResearchDetail(id).then(res => {
        setFormData({
          title: res.title,
          category: res.category,
          abstract: res.abstract,
          researchers: res.researchers || ['']
        });
      }).finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleAddResearcher = () => setFormData(p => ({ ...p, researchers: [...p.researchers, ''] }));
  const handleRemoveResearcher = (index: number) => {
    if (formData.researchers.length <= 1) return;
    const nr = [...formData.researchers];
    nr.splice(index, 1);
    setFormData(p => ({ ...p, researchers: nr }));
  };
  const handleResearcherChange = (idx: number, val: string) => {
    const nr = [...formData.researchers];
    nr[idx] = val;
    setFormData(p => ({ ...p, researchers: nr }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      await api.updateResearchAdmin(id, {
        ...formData,
        researchers: formData.researchers.filter(Boolean)
      });
      setToast({ message: 'Research updated successfully', type: 'success' });
      setTimeout(() => navigate(-1), 1500);
    } catch (err: any) {
      setToast({ message: err.error || 'Update failed', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center bg-[#0a0f1e] min-h-screen"><LoadingSpinner /></div>;

  return (
    <div className="p-4 md:p-10 bg-[#0a0f1e] min-h-screen">
      {toast && (
        <div className={`fixed bottom-10 right-10 z-50 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 border ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
          <p className="text-xs font-black uppercase tracking-widest">{toast.message}</p>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-10 pb-6 border-b border-white/5 gap-6">
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">RESEARCH DATA</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Refine and correct registered research information</span>
            </div>
          </div>
          <button onClick={() => navigate(-1)} className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-white/5 rounded-xl text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all border border-white/5 whitespace-nowrap shrink-0">
            <ArrowLeft size={14} className="shrink-0" />
            <span>RETURN</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="glass-card p-10 bg-[#111827] border-none shadow-2xl space-y-8">
             <div className="space-y-3 md:space-y-4">
               <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Research Title</label>
               <input 
                 value={formData.title} 
                 onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} 
                 className="input-field py-5 text-base" 
                 placeholder="Enter title..." 
                 required 
               />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3 md:space-y-4">
                 <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Category Classification</label>
                 <button 
                   type="button"
                   onClick={() => setIsCategoryModalOpen(true)}
                   className="w-full bg-[#0d1526] border border-white/10 rounded-xl p-4 pr-10 text-sm font-medium text-slate-200 text-left relative group/select transition-all hover:border-brand-primary/20"
                 >
                   <span>{formData.category || 'Select Category'}</span>
                   <div className="absolute right-4 top-1/2 -translate-y-1/2">
                     <ChevronDown size={14} className="text-slate-500 group-hover/select:text-brand-primary transition-colors" />
                   </div>
                 </button>
               </div>
             </div>

             <SelectionModal 
               isOpen={isCategoryModalOpen}
               onClose={() => setIsCategoryModalOpen(false)}
               title="Select Category"
               options={categories}
               onSelect={(val) => setFormData(p => ({ ...p, category: val }))}
             />

             <div className="space-y-3 md:space-y-4">
               <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Executive Abstract</label>
               <textarea 
                 value={formData.abstract} 
                 onChange={e => setFormData(p => ({ ...p, abstract: e.target.value }))} 
                 className="input-field min-h-[250px] py-6 leading-relaxed" 
                 placeholder="Write abstract here..." 
                 required 
               />
             </div>

             <div className="space-y-6 pt-4 border-t border-white/5">
               <div className="flex items-center justify-between">
                 <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Researcher Information</label>
                 <button 
                   type="button" 
                   onClick={handleAddResearcher}
                   className="text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-2 hover:brightness-125 transition-all"
                 >
                   <Plus size={14} /> Add Member
                 </button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {formData.researchers.map((r, i) => (
                   <div key={i} className="relative group">
                     <input 
                       value={r} 
                       onChange={e => handleResearcherChange(i, e.target.value)} 
                       className="input-field pr-12" 
                       placeholder={`Researcher ${i + 1}`} 
                       required 
                     />
                     {formData.researchers.length > 1 && (
                       <button 
                         type="button" 
                         onClick={() => handleRemoveResearcher(i)}
                         className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 hover:text-rose-500 transition-colors"
                       >
                         <Trash2 size={14} />
                       </button>
                     )}
                   </div>
                 ))}
               </div>
             </div>
          </div>

          <div className="flex gap-4">
            <button 
              type="submit" 
              disabled={saving}
              className="flex-1 py-5 bg-brand-primary text-slate-900 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-2xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 sm:gap-3 px-6"
            >
              <Save size={18} className="shrink-0" />
              <span className="truncate">
                {saving ? 'UPDATING ARCHIVE...' : 'SAVE CHANGES TO DATABASE'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminResearchEdit;
