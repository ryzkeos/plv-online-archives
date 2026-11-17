import React, { useEffect, useState } from 'react';
import { FileText, Check, X, Eye, Trophy, Award, Search, Filter, Star, Edit, Trash2, ChevronDown, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { LoadingSpinner } from './Common';
import { ConfirmModal, SelectionModal } from '../shared/Shared';

export const AdminUploads = () => {
  const navigate = useNavigate();
  const [uploads, setUploads] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [targetUpload, setTargetUpload] = useState<any | null>(null);
  const [awardTarget, setAwardTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  const fetchUploads = () => {
    setLoading(true);
    api.getAllUploads(statusFilter).then(setUploads).finally(() => setLoading(false));
  };

  useEffect(() => { 
    fetchUploads(); 
    api.getAwards().then(setAwards);
    setPage(1);
  }, [statusFilter, searchTerm]);

  const handleAccept = async (id: string) => {
    await api.acceptUpload(id);
    fetchUploads();
  };

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleReject = async () => {
    if (!targetUpload) return;
    await api.rejectUpload(targetUpload.id, rejectReason);
    setTargetUpload(null);
    setRejectReason('');
    fetchUploads();
    showToast('Research rejected');
  };

  const handleBestowAward = async (awardTitle: string) => {
    if (!awardTarget) return;

    if (awardTitle === 'REMOVE AWARD') {
      if (!awardTarget.awards || awardTarget.awards.length === 0) {
        showToast('Research has no awards to remove', 'error');
        setAwardTarget(null);
        return;
      }
      setLoading(true);
      try {
        for (const a of awardTarget.awards) {
          await api.unawardResearch(awardTarget.id, a.id);
        }
        showToast('All awards removed successfully');
        fetchUploads();
      } catch (e: any) {
        showToast(e.error || 'Failed to remove awards', 'error');
      } finally {
        setAwardTarget(null);
        setLoading(false);
      }
      return;
    }

    const award = awards.find(a => a.title === awardTitle);
    if (!award) return;

    setLoading(true);
    try {
      await api.bestowAward(awardTarget.id, award.id);
      showToast('Award bestowed successfully');
      setAwardTarget(null);
      fetchUploads();
    } catch (e: any) {
      showToast(e.error || 'Failed to bestow award', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnawardResearch = async (researchId: string, awardId: string) => {
    if (!window.confirm('Are you sure you want to remove this award?')) return;
    setLoading(true);
    try {
      await api.unawardResearch(researchId, awardId);
      showToast('Award removed successfully');
      fetchUploads();
    } catch (e: any) {
      showToast(e.error || 'Failed to remove award', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = async (id: string, current: boolean) => {
    try {
      await api.toggleFeatured(id);
      showToast(current ? 'Removed from featured' : 'Marked as featured');
      fetchUploads();
    } catch (e: any) {
      showToast(e.error || 'Failed to toggle featured', 'error');
    }
  };

  const handleArchiveResearch = async (id: string) => {
    try {
      await api.deleteResearch(id);
      showToast('Research archived');
      fetchUploads();
    } catch (e: any) {
      showToast(e.error || 'Failed to archive research', 'error');
    }
  };

  const filteredUploads = uploads.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedUploads = filteredUploads.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredUploads.length / itemsPerPage);

  return (
    <div className="flex flex-col h-screen overflow-hidden p-4 md:p-10 bg-[#0a0f1e]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 md:mb-8 pb-4 md:pb-6 border-b border-white/5 gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">ALL UPLOADS</h1>
          <div className="flex items-center gap-2 mt-1.5">
             <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Pamantasan ng Lungsod ng Valenzuela</span>
          </div>
        </div>
        <div className="flex flex-row items-center gap-3 w-full lg:max-w-[320px]">
          <form onSubmit={e => { e.preventDefault(); fetchUploads(); }} className="bg-[#151c2f] rounded-xl flex items-center px-4 py-3 border border-white/5 flex-1 transition-all focus-within:border-brand-primary/20">
             <Search size={16} className="text-slate-500 mr-2 shrink-0" />
             <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent border-none text-xs outline-none text-slate-200 w-full font-medium" placeholder="Search title / author" />
          </form>
          <div className="relative flex-none">
            <button 
              onClick={() => setFilterOpen(!filterOpen)} 
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#111827] border border-white/5 rounded-xl text-[10px] font-black text-slate-300 uppercase tracking-widest hover:bg-white/5 transition-all h-full whitespace-nowrap"
            >
              <Filter size={14} className="text-brand-primary shrink-0" />
              <span className="hidden sm:inline">{statusFilter}</span>
            </button>
            
            <SelectionModal 
              isOpen={filterOpen} 
              onClose={() => setFilterOpen(false)} 
              title="Filter Status" 
              options={['All', 'Pending', 'Accepted', 'Rejected']}
              onSelect={(val) => {
                setStatusFilter(val);
                setFilterOpen(false);
              }}
            />
          </div>
        </div>
      </div>

      <div className="glass-card border-none bg-[#111827] shadow-2xl flex-1 overflow-auto min-h-0">
          <table className="w-full text-center min-w-[900px]">
            <thead>
              <tr className="table-header">
                <th colSpan={2} className="px-4 py-3 whitespace-nowrap text-center font-black uppercase text-[10px] tracking-widest">User / Course</th>
                <th className="px-8 py-3 whitespace-nowrap text-center font-black uppercase text-[10px] tracking-widest">Research Title / File</th>
                <th className="px-8 py-3 whitespace-nowrap text-center font-black uppercase text-[10px] tracking-widest">Date Uploaded</th>
                <th className="px-8 py-3 whitespace-nowrap text-center font-black uppercase text-[10px] tracking-widest">Status</th>
                <th className="px-8 py-5 text-center whitespace-nowrap font-black uppercase text-[10px] tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6}><LoadingSpinner /></td></tr>
              ) : paginatedUploads.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-10 text-center text-slate-600 font-black uppercase text-[10px] tracking-widest">No matching uploads found</td></tr>
              ) : paginatedUploads.map((item) => (
                <tr key={item.id} className="hover:bg-brand-primary/[0.02] transition-colors group text-center">
                  <td className="py-3 md:py-4 px-4 md:px-6 whitespace-nowrap w-20 align-middle">
                   <div className="flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-[#0a0f1e] border border-white/5 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:border-brand-primary/20 transition-all">
                      {item.avatar_url ? (
                        <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={14} className="text-slate-600" />
                      )}
                    </div>
                   </div>
                  </td>
                  <td className="py-3 md:py-4 pr-6 md:pr-10 whitespace-nowrap text-left">
                    <div className="flex flex-col">
                      <span className="text-white text-[12px] font-bold truncate capitalize max-w-[180px] tracking-tight">{item.user_name}</span>
                      <span className="text-slate-500 text-[9px] font-medium tracking-wider">
                        {(item.course && item.year_level && item.section && item.course !== 'ADMIN') ? (
                          <span className="uppercase">{item.course} {item.year_level?.replace(/\D/g, '')}-{item.section}</span>
                        ) : (
                          <span>{item.role === 'masteradmin' ? 'Master Administrator' : item.role === 'admin' ? 'Administrator' : (item.role ? item.role.charAt(0).toUpperCase() + item.role.slice(1) : 'Standard Editor')}</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-3 md:py-4 whitespace-nowrap text-center">
                    <div className="max-w-[400px] mx-auto">
                      <div className="flex flex-col items-center gap-1.5">
                        <p className="text-[12px] text-slate-400 capitalize leading-snug truncate w-full">{item.title}</p>
                      </div>
                      <a href={item.pdf_url} target="_blank" rel="noreferrer" className="text-[9px] text-brand-primary uppercase mt-1 flex items-center justify-center gap-1 hover:underline">
                        <FileText size={9} />
                        View PDF
                      </a>
                    </div>
                  </td>
                  <td className="px-8 py-3 md:py-4 text-slate-400 font-mono text-[11px] whitespace-nowrap text-center">
                    <div>{new Date(item.created_at).toLocaleDateString()}</div>
                    <div className="text-[9px] opacity-40 mt-0.5 font-bold">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-8 py-3 md:py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center">
                      <span className={cn(
                        "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border",
                        item.status === 'accepted' ? "text-emerald-400 bg-emerald-400/5 border-emerald-400/10" : 
                        item.status === 'rejected' ? "text-rose-400 bg-rose-400/5 border-rose-400/10" : 
                        "text-amber-400 bg-amber-400/5 border-amber-400/10"
                      )}>
                        {item.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-3 md:py-4 whitespace-nowrap text-center">
                    <div className="flex gap-2 justify-center">
                      {item.status === 'accepted' ? (
                        <>
                          <button 
                            onClick={() => setAwardTarget(item)} 
                            className={cn(
                              "p-2 rounded-lg transition-all border",
                              item.awards && item.awards.length > 0
                                ? "bg-brand-primary/10 text-brand-primary border-brand-primary/10 hover:bg-brand-primary hover:text-slate-900"
                                : "bg-slate-800 text-slate-400 border-white/5 hover:bg-slate-700 hover:text-white"
                            )}
                            title="Award"
                          >
                            <Trophy size={14} />
                          </button>
                          <button 
                            onClick={() => handleToggleFeature(item.id, !!item.is_featured)} 
                            className={cn(
                              "p-2 rounded-lg transition-all border",
                              item.is_featured 
                                ? "bg-amber-500/20 text-amber-500 border-amber-500/30" 
                                : "bg-slate-800 text-slate-400 border-white/5 hover:bg-slate-700 hover:text-white"
                            )}
                            title="Feature"
                          >
                            <Star size={14} />
                          </button>
                          <button 
                            onClick={() => navigate(`/admin/research/${item.id}/edit`)}
                            className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all border border-blue-500/10"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => setIsDeleting(item.id)}
                            className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : item.status === 'rejected' ? (
                        <>
                          <button onClick={() => handleAccept(item.id)} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/10" title="Approve">
                            <Check size={14} />
                          </button>
                          <button 
                            onClick={() => setIsDeleting(item.id)}
                            className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleAccept(item.id)} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/10" title="Approve">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setTargetUpload(item)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10" title="Reject">
                            <X size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {!loading && filteredUploads.length > 0 && (
        <div className="px-3 md:px-0 py-4 flex flex-row items-center justify-between gap-2 md:gap-6">
          <div className="text-[10px] font-medium text-slate-500 shrink-0">
            Showing <span className="text-white">{(page - 1) * itemsPerPage + 1}</span> to <span className="text-white">{Math.min(page * itemsPerPage, filteredUploads.length)}</span> of <span className="text-white">{filteredUploads.length}</span> entries
          </div>
          <div className="flex items-center gap-1">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 md:w-10 md:h-10 bg-white/4 border border-white/5 rounded-lg flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1 mx-1 md:mx-2">
                {((): number[] => {
                  const delta = 1;
                  const start = Math.max(1, page - delta);
                  const end = Math.min(totalPages || 1, page + delta);
                  let finalStart = start;
                  let finalEnd = end;
                  if (finalEnd - finalStart < 2 && (totalPages || 1) >= 3) {
                    if (finalStart === 1) finalEnd = 3;
                    else if (finalEnd === (totalPages || 1)) finalStart = Math.max(1, (totalPages || 1) - 2);
                  }
                  const pages = [];
                  for (let i = finalStart; i <= finalEnd; i++) pages.push(i);
                  return pages;
                })().map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "min-w-8 h-8 md:min-w-10 md:h-10 px-2 rounded-lg text-[10px] font-black transition-all flex items-center justify-center",
                      page === p ? "bg-brand-primary text-slate-900 shadow-lg shadow-brand-primary/20" : "bg-white/5 text-slate-500 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))}
                disabled={page === (totalPages || 1)}
                className="w-8 h-8 md:w-10 md:h-10 bg-white/4 border border-white/5 rounded-lg flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      <ConfirmModal isOpen={!!targetUpload} onClose={() => setTargetUpload(null)} title="REJECT RESEARCH" message={`Reject the research titled "${targetUpload?.title}"?`} onConfirm={handleReject}>
         <div className="mt-4 pt-4 border-t border-white/5 space-y-4 text-left">
           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reason:</label>
           <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="input-field min-h-[100px] resize-none" placeholder="e.g. Incomplete data sections..." />
         </div>
      </ConfirmModal>
      <SelectionModal 
        isOpen={!!awardTarget}
        onClose={() => setAwardTarget(null)}
        title="BESTOW AWARD"
        options={['REMOVE AWARD', ...awards.map(a => a.title)]}
        onSelect={handleBestowAward}
      />

      {toast && (
        <div className={cn(
          "fixed bottom-24 left-1/2 -translate-x-1/2 p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 z-[200] border",
          toast.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full",
            toast.type === 'success' ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" : "bg-rose-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]"
          )} />
          <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
        </div>
      )}
      <ConfirmModal 
        isOpen={!!isDeleting}
        onClose={() => setIsDeleting(null)}
        title="Archive Research"
        message="Are you sure you want to archive this research entry? This action can be undone by restoring from the database."
        onConfirm={() => {
          if (isDeleting) handleArchiveResearch(isDeleting);
          setIsDeleting(null);
        }}
      />
    </div>
  );
};

export default AdminUploads;
