import React, { useState } from 'react';
import { Plus, Home, FileText, ChevronDown, Trash2, Globe, Image as ImageIcon, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import { ConfirmModal, SelectionModal, ResearchYearModal } from '../shared/Shared';

export const ResearchUploadPage = () => {
  const [formData, setFormData] = useState({ title: '', category: 'Technology', abstract: '', researchers: [''], research_year: null as number | null });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [focusedFields, setFocusedFields] = useState<Record<string, boolean>>({});
  const setFocused = (field: string, val: boolean) => setFocusedFields(p => ({ ...p, [field]: val }));
  const navigate = useNavigate();

  const [categories, setCategories] = useState<string[]>(['Technology', 'Agriculture', 'Medicine', 'Business', 'Education', 'Others']);
  
  React.useEffect(() => {
    api.getSelectibles().then(res => {
      if (res.category) {
        setCategories(res.category.map((i: any) => i.value));
      }
    });
  }, []);

  const renderFloatingLabel = (label: string, field: string, value: any, isForcedFocus?: boolean) => {
    const isFocused = focusedFields[field] || isForcedFocus;
    return (
      <motion.label
        initial={false}
        animate={{
          top: (value || isFocused) ? 0 : "50%",
          y: (value || isFocused) ? "-50%" : "-50%",
          scale: (value || isFocused) ? 0.8 : 1,
          x: (value || isFocused) ? -4 : 0,
        }}
        className={cn(
          "absolute left-4 pointer-events-none select-none transition-colors duration-200 uppercase tracking-[0.2em] origin-left z-10 whitespace-nowrap truncate max-w-[calc(100%-2rem)]",
          (value || isFocused) 
            ? "text-brand-primary bg-[#0d1526] px-2 font-black text-[10px]" 
            : "text-slate-500 font-bold text-[9px] md:text-[10px]"
        )}
      >
        {label}
      </motion.label>
    );
  };

  const handleAddResearcher = () => setFormData(p => ({ ...p, researchers: [...p.researchers, ''] }));
  const handleRemoveResearcher = (idx: number) => {
    if (formData.researchers.length <= 1) return;
    const nr = formData.researchers.filter((_, i) => i !== idx);
    setFormData(p => ({ ...p, researchers: nr }));
  };
  const handleResearcherChange = (idx: number, val: string) => {
    const nr = [...formData.researchers];
    nr[idx] = val;
    setFormData(p => ({ ...p, researchers: nr }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) return alert('Please choose a PDF file');
    setLoading(true);
    const fd = new FormData();
    fd.append('title', formData.title);
    fd.append('category', formData.category);
    fd.append('abstract', formData.abstract);
    fd.append('researchers', JSON.stringify(formData.researchers.filter(Boolean)));
    if (formData.research_year) fd.append('research_year', String(formData.research_year));
    fd.append('pdf', pdfFile);
    if (thumbFile) fd.append('thumbnail', thumbFile);

    try {
      await api.uploadResearch(fd);
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      console.error('Upload Error Details:', err);
      // Extra logging for the backend error if available
      if (err.error) console.error('Backend Error Message:', err.error);
      
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        alert('Network Error: Failed to connect to server. The file might be too large or your connection was interrupted.');
      } else {
        const errorMsg = typeof err === 'string' ? err : (err.error || err.message || 'Upload failed');
        alert(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-[#0a0f1e] p-4 md:p-6 lg:p-10 pb-24 shadow-2xl border-x border-white/5">
      <div className="flex items-center justify-between mb-8 md:mb-12 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-5xl font-black text-white uppercase tracking-tighter">Submit Research</h1>
        </div>
        <Link to="/" className="w-10 h-10 md:w-12 md:h-12 bg-[#111827] rounded-xl md:rounded-2xl flex items-center justify-center text-slate-500 hover:text-brand-primary border border-white/5 transition-all">
          <Home size={20} className="md:size-6" />
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-6 md:space-y-8">
          <div className="space-y-4">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl shrink-0">
                 <ImageIcon size={16} />
               </div>
               <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Upload Thumbnail</h2>
             </div>
             <label className="aspect-[16/10] md:aspect-[4/3] bg-[#111827] border-2 border-dashed border-white/5 rounded-3xl md:rounded-[3rem] flex flex-col items-center justify-center gap-4 md:gap-6 group hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all cursor-pointer relative overflow-hidden shadow-2xl">
               <input type="file" className="hidden" accept="image/*" onChange={e => setThumbFile(e.target.files?.[0] || null)} />
               {thumbFile ? (
                 <img src={URL.createObjectURL(thumbFile)} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt="" />
               ) : (
                 <>
                   <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all">
                     <ImageIcon size={20} className="md:size-6" />
                   </div>
                   <div className="text-center px-6">
                     <span className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-600 group-hover:text-white transition-colors">
                       Choose Image
                     </span>
                     <p className="text-[8px] md:text-[9px] text-slate-700 font-bold uppercase mt-1">Aspect ratio 4:3 recommended</p>
                   </div>
                 </>
               )}
             </label>
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl shrink-0">
                 <FileText size={16} />
               </div>
               <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Submit Document</h2>
             </div>
             <label className="w-full py-8 md:py-12 bg-[#111827] border border-white/5 rounded-2xl md:rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:bg-brand-primary/5 hover:border-brand-primary/20 transition-all cursor-pointer shadow-lg border-dashed">
               <input type="file" className="hidden" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
               <div className={cn(
                 "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-colors",
                 pdfFile ? "bg-brand-primary text-slate-900" : "bg-white/5 text-slate-500"
               )}>
                 <FileText size={20} className="md:size-6" />
               </div>
               <div className="text-center px-6">
                 <span className={cn(
                   "block text-[10px] md:text-xs font-black uppercase tracking-widest truncate max-w-[200px] md:max-w-xs mx-auto", 
                   pdfFile ? "text-white" : "text-slate-600"
                 )}>
                   {pdfFile ? pdfFile.name : 'Choose Manuscript PDF'}
                 </span>
                 {!pdfFile && <p className="text-[8px] md:text-[9px] text-slate-700 font-bold uppercase mt-1">Requirement: PDF file only</p>}
               </div>
             </label>
          </div>
        </div>

        <div className="space-y-6 md:space-y-10 flex flex-col">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl shrink-0">
                <Globe size={16} />
              </div>
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Research Metadata</h2>
            </div>

            <div className="space-y-5">
              <div className="relative">
                <input 
                  value={formData.title} 
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} 
                  onFocus={() => setFocused('title', true)}
                  onBlur={() => setFocused('title', false)}
                  className="input-field py-3 md:py-4 placeholder:text-transparent" 
                  placeholder="" 
                  required 
                />
                {renderFloatingLabel('Research Title', 'title', formData.title)}
              </div>

              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setIsYearModalOpen(true)}
                  className="input-field py-3 md:py-4 flex items-center justify-between group relative pr-10 overflow-hidden"
                >
                  <span className="text-white font-medium text-sm truncate text-left">
                    {formData.research_year ?? '\u00A0'}
                  </span>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <ChevronDown size={14} className={cn("transition-colors", isYearModalOpen ? "text-brand-primary" : "text-slate-500")} />
                  </div>
                </button>
                {renderFloatingLabel('Research Year', 'research_year', formData.research_year, isYearModalOpen)}
              </div>
              
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="input-field py-3 md:py-4 flex items-center justify-between group relative pr-10 overflow-hidden"
                >
                  <span className="text-white font-medium text-sm truncate text-left">
                    {formData.category || '\u00A0'}
                  </span>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <ChevronDown size={14} className={cn("transition-colors", isCategoryModalOpen ? "text-brand-primary" : "text-slate-500")} />
                  </div>
                </button>
                {renderFloatingLabel('Academic Category', 'category', formData.category, isCategoryModalOpen)}
              </div>

              <div className="relative">
                <textarea 
                  rows={1}
                  value={formData.abstract} 
                  onChange={e => {
                    setFormData(p => ({ ...p, abstract: e.target.value }));
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }} 
                  onFocus={() => setFocused('abstract', true)}
                  onBlur={() => setFocused('abstract', false)}
                  className="input-field py-3 md:py-4 outline-none resize-none leading-relaxed placeholder:text-transparent overflow-hidden" 
                  placeholder="" 
                  required 
                />
                {renderFloatingLabel('Abstract Overview', 'abstract', formData.abstract)}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl shrink-0">
                    <Users size={16} />
                  </div>
                  <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Researchers Team</h2>
                </div>
                
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  {formData.researchers.map((r, i) => (
                    <div key={i} className="relative group flex gap-2">
                      <div className="relative flex-1">
                        <input 
                          value={r} 
                          onChange={e => handleResearcherChange(i, e.target.value)} 
                          onFocus={() => setFocused(`researcher_${i}`, true)}
                          onBlur={() => setFocused(`researcher_${i}`, false)}
                          className="input-field py-3 md:py-4 placeholder:text-transparent" 
                          placeholder="" 
                          required 
                        />
                        {renderFloatingLabel(`Researcher ${i + 1}`, `researcher_${i}`, r)}
                      </div>
                      {formData.researchers.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveResearcher(i)}
                          className="shrink-0 w-11 md:w-12 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all group/delete"
                        >
                          <Trash2 size={16} className="md:size-5 group-hover/delete:scale-110 transition-transform" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <button type="button" onClick={handleAddResearcher} className="w-full py-3 md:py-4 border-2 border-dashed border-white/5 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-600 hover:text-brand-primary hover:border-brand-primary/20 transition-all font-black text-[10px] tracking-widest group">
                  <div className="p-1 rounded-md bg-slate-800 text-slate-500 mr-2 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all">
                    <Plus size={14} />
                  </div>
                  ADD TEAM MEMBER
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 md:pt-6">
            <button type="submit" disabled={loading} className="w-full py-4 md:py-6 bg-brand-primary text-slate-900 rounded-2xl md:rounded-[2.5rem] text-[10px] md:text-xs font-black tracking-[0.25em] uppercase shadow-2xl shadow-brand-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Deploying to network...' : 'Execute Submission'}
            </button>
          </div>
        </div>
      </form>

      <ConfirmModal isOpen={isSuccessModalOpen} onClose={() => { setIsSuccessModalOpen(false); navigate('/'); }} onConfirm={() => { setIsSuccessModalOpen(false); navigate('/'); }} title="SUBMISSION SUCCESS" message="Your research has been successfully submitted for review. It will be available once approved by moderators." confirmLabel="UNDERSTOOD" />
      
      <SelectionModal 
        isOpen={isCategoryModalOpen} 
        onClose={() => setIsCategoryModalOpen(false)} 
        title="Select Category"
        options={categories}
        onSelect={(val) => setFormData(p => ({ ...p, category: val }))}
      />

      <ResearchYearModal
        isOpen={isYearModalOpen}
        onClose={() => setIsYearModalOpen(false)}
        value={formData.research_year}
        onSelect={(year) => setFormData(p => ({ ...p, research_year: year }))}
      />
    </div>
  );
};

export default ResearchUploadPage;
