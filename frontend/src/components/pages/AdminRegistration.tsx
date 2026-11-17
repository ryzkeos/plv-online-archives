import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, User } from '../../lib/api';
import { cn } from '../../lib/utils';
import { LoadingSpinner } from './Common';
import { SelectionModal, ConfirmModal, DetailModal } from '../shared/Shared';
import { Check, X, Eye, Search, Filter, Mail, Flag, FileText, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';

export const AdminRegistration = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  const fetchRegs = () => {
    setLoading(true);
    api.getRegistrations(statusFilter).then(setRegistrations).finally(() => setLoading(false));
  };

  useEffect(() => { 
    fetchRegs(); 
    setPage(1);
  }, [statusFilter, searchTerm]);

  const handleApprove = async (id: string) => {
    await api.approveRegistration(id);
    fetchRegs();
  };

  const handleReject = async () => {
    if (!targetUser) return;
    await api.rejectRegistration(targetUser.id, rejectReason);
    setTargetUser(null);
    setRejectReason('');
    fetchRegs();
  };

  const filteredRegs = registrations.filter(app => 
    app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    app.student_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedRegs = filteredRegs.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredRegs.length / itemsPerPage);

  return (
    <div className="flex flex-col h-screen overflow-hidden p-4 md:p-10 bg-[#0a0f1e]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 md:mb-8 pb-4 md:pb-6 border-b border-white/5 gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">REGISTRATION SECTION</h1>
          <div className="flex items-center gap-2 mt-1.5">
             <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Pamantasan ng Lungsod ng Valenzuela</span>
          </div>
        </div>
        <div className="flex flex-row items-center gap-3 w-full lg:max-w-[320px]">
          <div className="bg-[#151c2f] rounded-xl flex items-center px-4 py-3 border border-white/5 flex-1 transition-all focus-within:border-brand-primary/20">
             <Search size={16} className="text-slate-500 mr-2 shrink-0" />
             <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent border-none text-xs outline-none text-slate-200 w-full font-medium" placeholder="Search applicant / student no" />
          </div>
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
              options={['All', 'Pending', 'Approved', 'Rejected']}
              onSelect={(val) => {
                setStatusFilter(val);
                setFilterOpen(false);
              }}
            />
          </div>
        </div>
      </div>
      
      <div className="glass-card shadow-2xl border-none bg-[#111827] flex-1 overflow-auto min-h-0">
          <table className="w-full text-center min-w-[900px]">
            <thead>
              <tr className="table-header">
                <th colSpan={2} className="px-4 py-3 whitespace-nowrap text-center font-black uppercase text-[10px] tracking-widest">Students Name</th>
                <th className="px-8 py-3 whitespace-nowrap text-center font-black uppercase text-[10px] tracking-widest">Student No.</th>
                <th className="px-8 py-3 whitespace-nowrap text-center font-black uppercase text-[10px] tracking-widest">Course</th>
                <th className="px-8 py-3 whitespace-nowrap text-center font-black uppercase text-[10px] tracking-widest">Yr & Sec</th>
                <th className="px-8 py-3 whitespace-nowrap text-center font-black uppercase text-[10px] tracking-widest">Registration Status</th>
                <th className="px-8 py-5 text-center whitespace-nowrap font-black uppercase text-[10px] tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={7}><LoadingSpinner /></td></tr>
              ) : paginatedRegs.length === 0 ? (
                <tr><td colSpan={7} className="px-8 py-10 text-center text-slate-600 font-black uppercase text-[10px] tracking-widest">No matching registrations found</td></tr>
              ) : paginatedRegs.map((app) => (
                <tr 
                  key={app.id} 
                  className="hover:bg-brand-primary/[0.02] transition-colors group cursor-pointer text-center"
                  onClick={() => setViewUser(app)}
                >
                <td className="py-3 md:py-4 px-4 md:px-6 whitespace-nowrap w-20 align-middle">
                   <div className="flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-[#0a0f1e] border border-white/5 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:border-brand-primary/20 transition-all">
                      {app.avatar_url ? (
                        <img src={app.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={14} className="text-slate-600" />
                      )}
                    </div>
                   </div>
                </td>
                <td className="py-3 md:py-4 pr-6 md:pr-10 whitespace-nowrap text-left">
                   <div className="flex flex-col">
                    <span className="text-white text-[12px] font-bold truncate capitalize max-w-[200px] tracking-tight">{app.full_name}</span>
                   </div>
                </td>
                  <td className="px-8 py-3 md:py-4 text-slate-400 text-[11px] uppercase whitespace-nowrap text-center font-mono">{app.student_number}</td>
                  <td className="px-8 py-3 md:py-4 text-slate-400 text-[11px] uppercase whitespace-nowrap text-center">{app.course}</td>
                  <td className="px-8 py-3 md:py-4 text-slate-400 text-[11px] uppercase whitespace-nowrap text-center">{app.year_level?.replace(/\D/g, '')}-{app.section}</td>
                  <td className="px-8 py-3 md:py-4 whitespace-nowrap text-center">
                    <div className="flex flex-col items-center gap-1">
                      {app.admin_approved === 1 ? (
                        <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">Approved</span>
                      ) : app.status === 'rejected' ? (
                        <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-500/5 border border-rose-500/10 rounded-lg">Rejected</span>
                      ) : (
                        <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/5 border border-amber-500/10 rounded-lg">Pending..</span>
                      )}
                      {!app.email_verified && (
                        <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest px-2 py-0.5 bg-rose-500/10 rounded-full border border-rose-500/20">Unverified Email</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-3 md:py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 justify-center">
                      {app.admin_approved === 0 && app.status !== 'rejected' ? (
                        <>
                          <button onClick={() => handleApprove(app.id)} className="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2">
                            <Check size={12} />
                            Approve
                          </button>
                          <button onClick={() => setTargetUser(app)} className="px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2">
                            <X size={12} />
                            Reject
                          </button>
                        </>
                      ) : app.admin_approved === 1 ? (
                        <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                          <Check size={14} /> Approved
                        </div>
                      ) : (
                        <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1.5">
                          <X size={14} /> Rejected
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {!loading && filteredRegs.length > 0 && (
        <div className="px-3 md:px-0 py-4 flex flex-row items-center justify-between gap-2 md:gap-6">
          <div className="text-[10px] font-medium text-slate-500 shrink-0">
            Showing <span className="text-white">{(page - 1) * itemsPerPage + 1}</span> to <span className="text-white">{Math.min(page * itemsPerPage, filteredRegs.length)}</span> of <span className="text-white">{filteredRegs.length}</span> entries
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

      {/* Registration Section Detail View (Modal) */}
      <DetailModal
        isOpen={!!viewUser}
        onClose={() => setViewUser(null)}
        title="REGISTRATION SECTION"
      >
        {viewUser && (
          <div className="space-y-4 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-8">
               {[
                 { label: 'FULL NAME', value: viewUser.full_name },
                 { label: 'STUDENT NUMBER', value: viewUser.student_number },
                 { label: 'COURSE', value: viewUser.course },
                 { label: 'SECTION', value: viewUser.section },
                 { label: 'YEAR LEVEL', value: viewUser.year_level },
                 { label: 'PERSONAL EMAIL', value: viewUser.personal_email },
                 { label: 'PLV EMAIL', value: viewUser.plv_email || 'N/A' },
               ].map((f) => (
                 <div key={f.label} className="space-y-1 md:space-y-2">
                   <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">{f.label}</p>
                   <div className="p-2.5 md:p-4 bg-[#0a0f1e] border border-white/5 rounded-xl text-white font-bold text-sm md:text-base">{f.value}</div>
                 </div>
               ))}
            </div>

            <div className="pt-4 md:pt-8 border-t border-white/5 space-y-3 md:space-y-4">
               <div className="grid grid-cols-1 gap-2 md:gap-3">
                 <button 
                  onClick={() => navigate(`/admin/users/${viewUser.id}`)}
                  className="w-full py-3 md:py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 hover:text-brand-primary hover:border-brand-primary/30 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                 >
                   <Eye size={14} />
                   VIEW FULL DETAILS
                 </button>
               </div>

               <div className="flex gap-2 md:gap-4">
                 {viewUser.admin_approved === 0 && viewUser.status !== 'rejected' ? (
                   <>
                     <button 
                      onClick={() => {
                        handleApprove(viewUser.id);
                        setViewUser(null);
                      }} 
                      className="flex-1 py-3 md:py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-1.5 md:gap-2"
                     >
                       <Check size={14} />
                       APPROVE APPLICANT
                     </button>
                     <button 
                      onClick={() => {
                        setTargetUser(viewUser);
                        setViewUser(null);
                      }} 
                      className="flex-1 py-3 md:py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/20 flex items-center justify-center gap-1.5 md:gap-2"
                     >
                       <X size={14} />
                       REJECT APPLICANT
                     </button>
                   </>
                 ) : viewUser.admin_approved === 1 ? (
                   <div className="flex-1 py-3 md:py-4 text-center text-emerald-500 font-black uppercase tracking-widest text-[12px] bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                     Applicant Approved
                   </div>
                 ) : (
                   <div className="flex-1 py-3 md:py-4 text-center text-rose-500 font-black uppercase tracking-widest text-[12px] bg-rose-500/5 rounded-xl border border-rose-500/10">
                     Applicant Rejected
                   </div>
                 )}
               </div>
            </div>
          </div>
        )}
      </DetailModal>

      <ConfirmModal
        isOpen={!!targetUser}
        onClose={() => setTargetUser(null)}
        title="REJECT APPLICATION"
        message={`Are you sure you want to reject the application for ${targetUser?.full_name}?`}
        confirmLabel="YES, REJECT"
        onConfirm={handleReject}
      >
        <div className="mt-4 pt-4 border-t border-white/5 space-y-4 text-left">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rejection Reason:</label>
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="input-field min-h-[100px] resize-none" placeholder="e.g. Invalid Student ID..." />
        </div>
      </ConfirmModal>
    </div>
  );
};

export default AdminRegistration;
