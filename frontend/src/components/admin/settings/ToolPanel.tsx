import React, { useState } from 'react';
import { UserPlus, Layers, Star, Megaphone, RefreshCw, Activity, ChevronDown, Trash2, Search, Plus, Archive } from 'lucide-react';
import { api, User as UserType, Research } from '../../../lib/api';
import { cn } from '../../../lib/utils';
import { CourseModal, SectionModal, YearLevelModal, ConfirmModal } from '../../shared/Shared';

interface ToolPanelProps {
  announcements: any[];
  deletedResearch: Research[];
  featuredResearch: Research[];
  allAcceptedResearch: Research[];
  allUsers: UserType[];
  refreshData: () => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
  isMasteradmin: boolean;
  selectibles: any;
}

export const ToolPanel = ({ 
  announcements, 
  deletedResearch, 
  featuredResearch, 
  allAcceptedResearch, 
  allUsers, 
  refreshData, 
  showToast, 
  isMasteradmin, 
  selectibles 
}: ToolPanelProps) => {
  const [manualCourseModal, setManualCourseModal] = useState(false);
  const [manualYearModal, setManualYearModal] = useState(false);
  const [manualSectionModal, setManualSectionModal] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [permDeleteTarget, setPermDeleteTarget] = useState<string | null>(null);
  
  // Forms
  const [manualReg, setManualReg] = useState({ 
    full_name: '', 
    student_number: '', 
    course: '', 
    section: '', 
    year_level: '', 
    personal_email: '', 
    plv_email: '', 
    password: '' 
  });

  const getRemainingDays = (deletedAtStr?: string) => {
    if (!deletedAtStr) return 30;
    const deletedAt = new Date(deletedAtStr);
    const diffTime = Date.now() - deletedAt.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const remaining = 30 - diffDays;
    return remaining > 0 ? remaining : 0;
  };

  const [annForm, setAnnForm] = useState({ title: '', content: '' });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  return (
    <div className="space-y-10">
      <section>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">ADMINISTRATIVE TOOLS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ToolCard 
              title="Manual Registration" 
              desc="Directly create a verified student account." 
              icon={UserPlus} 
              active={activeTool === 'register'} 
              onClick={() => setActiveTool(activeTool === 'register' ? null : 'register')}
            />
            <ToolCard 
              title="Batch Account Status" 
              desc="Deactivate or reactivate multiple accounts." 
              icon={Layers} 
              active={activeTool === 'batch'} 
              onClick={() => setActiveTool(activeTool === 'batch' ? null : 'batch')}
            />
            <ToolCard 
              title="Featured Research" 
              desc="Highlight papers on the homepage." 
              icon={Star} 
              active={activeTool === 'featured'} 
              onClick={() => setActiveTool(activeTool === 'featured' ? null : 'featured')}
            />
            <ToolCard 
              title="Post Announcement" 
              desc="Broadcast message to all user dashboards." 
              icon={Megaphone} 
              active={activeTool === 'announce'} 
              onClick={() => setActiveTool(activeTool === 'announce' ? null : 'announce')}
            />
            <ToolCard 
              title="Soft Delete Recovery" 
              desc="Restore recently deleted research." 
              icon={RefreshCw} 
              active={activeTool === 'restore'} 
              onClick={() => setActiveTool(activeTool === 'restore' ? null : 'restore')}
            />
            <ToolCard 
              title="Activity Audit" 
              desc="View high-level system logs and stats." 
              icon={Activity} 
              active={activeTool === 'audit'} 
              onClick={() => setActiveTool(activeTool === 'audit' ? null : 'audit')}
            />
          </div>
      </section>

      {/* Tool Forms */}
      {activeTool === 'register' && (
        <div className="max-w-3xl mx-auto p-4 md:p-8 bg-[#0a0f1e] border border-white/5 rounded-2xl overflow-hidden">
          <h4 className="text-xs font-black text-white uppercase mb-6 flex items-center gap-2 underline underline-offset-8 decoration-brand-primary">
            Manual Registration Form
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Full Name" value={manualReg.full_name} onChange={(v: string) => setManualReg({...manualReg, full_name: v})} placeholder="Full Name" />
            <Field label="Student Number" value={manualReg.student_number} onChange={(v: string) => {
              let val = v.replace(/[^\d]/g, '').slice(0, 6);
              if (val.length > 2) val = val.slice(0, 2) + '-' + val.slice(2);
              setManualReg({...manualReg, student_number: val});
             }} placeholder="xx-xxxx" />
            <Field label="Personal Email" value={manualReg.personal_email} onChange={(v: string) => setManualReg({...manualReg, personal_email: v})} placeholder="personal@example.com" />
            <Field label="PLV Email" value={manualReg.plv_email} onChange={(v: string) => setManualReg({...manualReg, plv_email: v})} placeholder="student@plv.edu.ph" />
            <Field label="Initial Password" type="password" value={manualReg.password} onChange={(v: string) => setManualReg({...manualReg, password: v})} placeholder="••••••••" />
            
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Course</label>
                 <button 
                    type="button"
                    onClick={() => setManualCourseModal(true)}
                    className="w-full bg-[#111827] text-white p-4 rounded-2xl border border-white/5 font-bold flex items-center justify-between group overflow-hidden relative"
                  >
                    <span className={cn(!manualReg.course ? "text-slate-600 font-medium" : "text-white font-bold", "text-xs uppercase truncate mr-8")}>
                      {manualReg.course || 'Select'}
                    </span>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <ChevronDown size={14} className="text-slate-600 group-hover:text-brand-primary transition-colors shrink-0" />
                    </div>
                  </button>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Year Level</label>
                 <button 
                    type="button"
                    onClick={() => setManualYearModal(true)}
                    className="w-full bg-[#111827] text-white p-4 rounded-2xl border border-white/5 font-bold flex items-center justify-between group overflow-hidden relative"
                  >
                    <span className={cn(!manualReg.year_level ? "text-slate-600 font-medium" : "text-white font-bold", "text-xs uppercase truncate mr-8")}>
                      {manualReg.year_level || 'Select'}
                    </span>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <ChevronDown size={14} className="text-slate-600 group-hover:text-brand-primary transition-colors shrink-0" />
                    </div>
                  </button>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Section</label>
                 <button 
                    type="button"
                    onClick={() => setManualSectionModal(true)}
                    className="w-full bg-[#111827] text-white p-4 rounded-2xl border border-white/5 font-bold flex items-center justify-between group overflow-hidden relative"
                  >
                    <span className={cn(!manualReg.section ? "text-slate-600 font-medium" : "text-white font-bold", "text-xs uppercase truncate mr-8")}>
                      {manualReg.section || 'Select'}
                    </span>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <ChevronDown size={14} className="text-slate-600 group-hover:text-brand-primary transition-colors shrink-0" />
                    </div>
                  </button>
               </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button 
              disabled={loading}
              onClick={async () => {
                if (!manualReg.full_name || !manualReg.student_number || !manualReg.plv_email || !manualReg.password) {
                  showToast('Please fill in all required fields', 'error');
                  return;
                }

                const studentNumPattern = /^\d{2}-\d{4}$/;
                const plvEmailPattern = /^[a-zA-Z0-9._%+-]+@plv\.edu\.ph$/;

                if (!studentNumPattern.test(manualReg.student_number)) {
                  showToast('Invalid Student Number format (XX-XXXX)', 'error');
                  return;
                }

                if (!plvEmailPattern.test(manualReg.plv_email)) {
                  showToast('Must use @plv.edu.ph email', 'error');
                  return;
                }

                setLoading(true);
                try { 
                  await api.manualRegister(manualReg); 
                  showToast('Student registered successfully'); 
                  setActiveTool(null); 
                  setManualReg({
                    full_name: '', 
                    student_number: '', 
                    course: '', 
                    section: '', 
                    year_level: '', 
                    personal_email: '', 
                    plv_email: '', 
                    password: ''
                  });
                }
                catch(e: any) { showToast(e.error || 'Registration failed', 'error'); }
                finally { setLoading(false); }
              }}
              className="w-full md:w-auto btn-primary py-4 px-10 text-[10px] font-black tracking-[0.2em] uppercase shadow-2xl shadow-brand-primary/20"
            >
              {loading ? 'Processing...' : 'Register Student'}
            </button>
          </div>
        </div>
      )}

      <CourseModal
        isOpen={manualCourseModal}
        onClose={() => setManualCourseModal(false)}
        options={selectibles.course?.map((i: any) => i.value) || []}
        value={manualReg.course}
        onSelect={(val) => setManualReg(p => ({ ...p, course: val }))}
      />

      <YearLevelModal
        isOpen={manualYearModal}
        onClose={() => setManualYearModal(false)}
        options={selectibles.year_level?.map((i: any) => i.value) || []}
        value={manualReg.year_level}
        onSelect={(val) => setManualReg(p => ({ ...p, year_level: val }))}
      />

      <SectionModal
        isOpen={manualSectionModal}
        onClose={() => setManualSectionModal(false)}
        options={selectibles.section?.map((i: any) => i.value) || []}
        value={manualReg.section}
        onSelect={(val) => setManualReg(p => ({ ...p, section: val }))}
      />

      {activeTool === 'announce' && (
        <div className="max-w-3xl mx-auto p-4 md:p-8 bg-[#0a0f1e] border border-white/5 rounded-2xl">
          <h4 className="text-xs font-black text-white uppercase mb-6 underline underline-offset-8 decoration-brand-primary">Post Announcement</h4>
          <div className="space-y-4">
            <Field label="Headline Title" value={annForm.title} onChange={(v: string) => setAnnForm({...annForm, title: v})} placeholder="Announcement Headline" />
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Message Content</label>
               <textarea 
                value={annForm.content} 
                onChange={e => setAnnForm({...annForm, content: e.target.value})}
                className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-xs h-32 focus:outline-none focus:border-brand-primary/50 text-white placeholder:text-slate-600 placeholder:font-medium"
                placeholder="Write the announcement message here..."
               />
            </div>
          </div>
          <button 
            disabled={loading}
            onClick={async () => {
              if (!annForm.title || !annForm.content) return showToast('Please fill all fields', 'error');
              setLoading(true);
              try { 
                await api.createAnnouncement(annForm); 
                showToast('Announcement posted & sent to all inboxes'); 
                setAnnForm({title:'', content:''}); 
                refreshData(); 
              }
              catch(e: any) { showToast(e.error || 'Post failed', 'error'); }
              finally { setLoading(false); }
            }}
            className="w-full md:w-auto btn-primary mt-6 py-4 px-10 text-[10px] font-black tracking-widest"
          >
            {loading ? 'Posting...' : 'Submit Announcement'}
          </button>

          <div className="mt-12 space-y-4">
            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sent History</h5>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {announcements.map((a: any) => (
                <div key={a.id} className="p-4 bg-slate-900/50 rounded-xl border border-white/5 flex items-center justify-between group">
                  <div className="min-w-0 flex-1">
                     <p className="text-[10px] font-bold text-white uppercase truncate">{a.title}</p>
                     <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{a.admin_name} • {new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => api.deleteAnnouncement(a.id).then(refreshData)} className="p-2 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-4">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTool === 'batch' && (
        <div className="p-4 md:p-8 bg-[#0a0f1e] border border-white/5 rounded-2xl">
          <h4 className="text-xs font-black text-white uppercase mb-6 underline underline-offset-8 decoration-brand-primary">Batch Account Controls</h4>
          <div className="max-h-96 overflow-y-auto space-y-2 mb-8 pr-2 custom-scrollbar">
             {allUsers.map((u: UserType) => (
               <div key={u.id} className="flex items-center gap-3 md:gap-4 p-3 bg-slate-900 border border-white/5 rounded-xl hover:border-white/10 transition-all overflow-hidden">
                 <input 
                  type="checkbox" 
                  checked={selectedUsers.includes(u.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedUsers([...selectedUsers, u.id]);
                    else setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                  }}
                  className="w-4 h-4 accent-brand-primary shrink-0"
                 />
                 <div className="flex-1 min-w-0">
                   <p className="text-[10px] font-bold text-white uppercase truncate">{u.full_name}</p>
                   <p className="text-[8px] text-slate-500 font-bold tracking-tight uppercase truncate">{u.plv_email} • {u.status}</p>
                 </div>
               </div>
             ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
             <button 
              disabled={loading || selectedUsers.length === 0}
              onClick={async () => {
                setLoading(true);
                try { await api.batchDeactivate(selectedUsers); showToast('Accounts deactivated'); setSelectedUsers([]); refreshData(); }
                finally { setLoading(false); }
              }}
              className="w-full px-4 py-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all disabled:opacity-30 whitespace-nowrap overflow-hidden text-ellipsis"
             >
               Deactivate ({selectedUsers.length})
             </button>

             <button 
              disabled={loading || selectedUsers.length === 0}
              onClick={async () => {
                setLoading(true);
                try { await api.batchArchive(selectedUsers); showToast('Accounts archived'); setSelectedUsers([]); refreshData(); }
                finally { setLoading(false); }
              }}
              className="w-full px-4 py-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-amber-500 hover:text-white transition-all disabled:opacity-30 whitespace-nowrap overflow-hidden text-ellipsis"
             >
               Archive ({selectedUsers.length})
             </button>

             <button 
              disabled={loading || selectedUsers.length === 0}
              onClick={async () => {
                setLoading(true);
                try { await api.batchReactivate(selectedUsers); showToast('Accounts reactivated'); setSelectedUsers([]); refreshData(); }
                finally { setLoading(false); }
              }}
              className="w-full px-4 py-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-30 whitespace-nowrap overflow-hidden text-ellipsis"
             >
               Reactivate ({selectedUsers.length})
             </button>

             <button 
              disabled={loading || selectedUsers.length === 0 || !isMasteradmin}
              onClick={() => setShowBatchDeleteConfirm(true)}
              className="w-full px-4 py-3 bg-rose-600 text-white border border-rose-600 rounded-xl text-[10px] font-black uppercase hover:bg-rose-700 transition-all disabled:opacity-30 whitespace-nowrap overflow-hidden text-ellipsis"
             >
               Delete ({selectedUsers.length})
             </button>
          </div>
          <ConfirmModal 
            isOpen={showBatchDeleteConfirm}
            onClose={() => setShowBatchDeleteConfirm(false)}
            title="BATCH DELETE ACCOUNTS"
            message={`Are you sure? This will PERMANENTLY delete ${selectedUsers.length} selected accounts.`}
            confirmLabel="PERMANENTLY DELETE"
            onConfirm={async () => {
              setLoading(true);
              try { 
                await api.batchDelete(selectedUsers); 
                showToast('Accounts deleted'); 
                setSelectedUsers([]); 
                refreshData(); 
              }
              finally { 
                setLoading(false); 
                setShowBatchDeleteConfirm(false); 
              }
            }}
          />
        </div>
      )}

      {activeTool === 'audit' && (
        <div className="p-4 md:p-8 bg-[#0a0f1e] border border-white/5 rounded-2xl overflow-hidden">
          <h4 className="text-xs font-black text-white uppercase mb-6 underline underline-offset-8 decoration-brand-primary">Activity Audit Log</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="p-4 bg-slate-900/50 border border-white/5 rounded-xl">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Active Users</p>
              <p className="text-2xl font-black text-white font-mono">{allUsers.filter(u => u.status === 'active').length}</p>
            </div>
            <div className="p-4 bg-slate-900/50 border border-white/5 rounded-xl">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Research</p>
              <p className="text-2xl font-black text-white font-mono">{allAcceptedResearch.length}</p>
            </div>
            <div className="p-4 bg-slate-900/50 border border-white/5 rounded-xl">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Broadcasts Sent</p>
              <p className="text-2xl font-black text-white font-mono">{announcements.length}</p>
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {allUsers.slice(0, 10).map((u, i) => (
              <div key={u.id + i} className="p-3 bg-slate-900/30 border border-white/5 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-[10px] font-bold uppercase">
                    {u.full_name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-white uppercase truncate">{u.full_name}</p>
                    <p className="text-[8px] text-slate-500 uppercase font-bold tracking-tight">Status: {u.status}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[8px] text-slate-500 font-bold uppercase">{u.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTool === 'featured' && (
        <div className="p-4 md:p-8 bg-[#0a0f1e] border border-white/5 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
             <div className="flex flex-col h-full">
               <h4 className="text-xs font-black text-slate-500 uppercase mb-6 tracking-widest">Library (Published Research)</h4>
               <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {allAcceptedResearch.filter((r: Research) => !featuredResearch.some((f: Research) => f.id === r.id)).length === 0 ? (
                    <div className="py-12 text-center opacity-20 border-2 border-dashed border-white/5 rounded-2xl">
                      <Search size={24} className="mx-auto mb-2" />
                      <p className="text-[8px] font-black uppercase tracking-widest">No more papers to feature</p>
                    </div>
                  ) : (
                    allAcceptedResearch.filter((r: Research) => !featuredResearch.some((f: Research) => f.id === r.id)).map((r: Research) => (
                      <div key={r.id} className="p-4 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-between group">
                        <p className="text-[10px] font-bold text-white uppercase truncate pr-4 min-w-0 flex-1">{r.title}</p>
                        <button onClick={() => api.toggleFeatured(r.id).then(refreshData)} className="p-2 text-slate-600 hover:text-brand-primary shrink-0">
                          <Plus size={16} />
                        </button>
                      </div>
                    ))
                  )}
               </div>
             </div>
             <div className="flex flex-col h-full">
               <h4 className="text-xs font-black text-brand-primary uppercase mb-6 tracking-widest">Currently Featured</h4>
               <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {featuredResearch.length === 0 ? (
                    <div className="py-12 text-center opacity-20 border-2 border-dashed border-white/5 rounded-2xl">
                      <Star size={24} className="mx-auto mb-2" />
                      <p className="text-[8px] font-black uppercase tracking-widest">No featured research</p>
                    </div>
                  ) : (
                    featuredResearch.map((r: Research) => (
                      <div key={r.id} className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl flex items-center justify-between">
                        <p className="text-[10px] font-bold text-white uppercase truncate pr-4 min-w-0 flex-1">{r.title}</p>
                        <button onClick={() => api.toggleFeatured(r.id).then(refreshData)} className="p-2 text-rose-500 hover:scale-110 transition-transform shrink-0">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
               </div>
             </div>
          </div>
        </div>
      )}

      {activeTool === 'restore' && (
        <div className="p-4 md:p-8 bg-[#0a0f1e] border border-white/5 rounded-2xl overflow-hidden">
          <h4 className="text-xs font-black text-white uppercase mb-6 underline underline-offset-8 decoration-brand-primary">Recovery Console</h4>
          <div className="space-y-3">
             {deletedResearch.length === 0 ? (
               <div className="py-12 text-center opacity-30">
                  <Archive size={40} className="mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Recycle bin is empty</p>
               </div>
             ) : (
               deletedResearch.map((r: Research) => (
                 <div key={r.id} className="p-4 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-between">
                    <div className="min-w-0 pr-4">
                      <p className="text-[10px] font-bold text-white uppercase truncate">{r.title}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tight">Deleted on: {new Date(r.deleted_at!).toLocaleDateString()}</p>
                        {r.author_name && (
                          <p className="text-[8px] text-brand-primary/60 font-bold uppercase tracking-tight">• By: {r.author_name}</p>
                        )}
                        <p className="text-[8px] text-rose-400 font-bold uppercase tracking-tight">
                          {getRemainingDays(r.deleted_at) > 0 ? `· Purges in ${getRemainingDays(r.deleted_at)} days` : '· Auto-purges today'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        disabled={loading}
                        onClick={async () => {
                          setLoading(true);
                          try {
                            await api.restoreDeleted(r.id);
                            showToast(`"${r.title}" restored successfully`);
                            refreshData();
                          } catch (e: any) {
                            showToast(e.error || 'Restoration failed', 'error');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="px-4 py-2 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-lg text-[8px] font-black uppercase hover:bg-brand-primary hover:text-slate-900 transition-all disabled:opacity-50"
                      >
                        {loading ? 'Restoring...' : 'Restore Entry'}
                      </button>
                      <button
                        disabled={loading}
                        onClick={() => setPermDeleteTarget(r.id)}
                        className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-[8px] font-black uppercase hover:bg-rose-500/20 transition-all disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!permDeleteTarget}
        onClose={() => setPermDeleteTarget(null)}
        title="PERMANENTLY DELETE ARCHIVE"
        message="Warning: This action cannot be undone. This research, including its PDF and metadata, will be permanently removed from PLV Archives."
        onConfirm={async () => {
          if (permDeleteTarget) {
            await api.permanentlyDeleteResearch(permDeleteTarget);
            refreshData();
            setPermDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};

const ToolCard = ({ title, desc, icon: Icon, active, onClick }: any) => (
  <div 
    onClick={onClick}
    className={cn(
      "p-6 border rounded-2xl transition-all cursor-pointer group flex flex-col items-start gap-4 h-full",
      active ? "bg-brand-primary border-brand-primary shadow-xl shadow-brand-primary/20" : "bg-white/5 border-white/5 hover:border-brand-primary/30"
    )}
  >
    <div className={cn("p-2 rounded-xl", active ? "bg-white text-brand-primary" : "bg-brand-primary/10 text-brand-primary")}>
      <Icon size={20} />
    </div>
    <div>
      <h4 className={cn("text-sm font-bold uppercase mb-1 tracking-tight", active ? "text-slate-900" : "text-white group-hover:text-brand-primary")}>{title}</h4>
      <p className={cn("text-[10px] uppercase font-medium leading-relaxed tracking-tight", active ? "text-slate-800" : "text-slate-500")}>{desc}</p>
    </div>
  </div>
);

const Field = ({ label, value, onChange, type = 'text', placeholder }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
    <input 
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-900 text-white p-3.5 rounded-xl border border-white/5 font-bold focus:outline-none focus:border-brand-primary/50 transition-all text-xs placeholder:text-slate-600 placeholder:font-medium" 
    />
  </div>
);