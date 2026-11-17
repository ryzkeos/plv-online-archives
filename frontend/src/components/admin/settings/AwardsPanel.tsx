import React, { useState } from 'react';
import { Plus, Trash2, Trophy, Star, Medal, Crown, Target, Heart, Zap, Award as AwardIcon, Shield, ChevronDown, AlertTriangle, FileText, User } from 'lucide-react';
import { api } from '../../../lib/api';
import { cn } from '../../../lib/utils';
import { Modal, ConfirmModal } from '../../shared/Shared';

interface AwardsPanelProps {
  awards: any[];
  setAwards: (a: any[]) => void;
  loading: boolean;
  setLoading: (l: boolean) => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
  refreshLogs: () => Promise<void>;
}

export const AwardsPanel = ({
  awards,
  setAwards,
  loading,
  setLoading,
  showToast,
  refreshLogs
}: AwardsPanelProps) => {
  const [isNewAwardOpen, setIsNewAwardOpen] = useState(false);
  const [newAwardVal, setNewAwardVal] = useState('');
  const [newAwardIcon, setNewAwardIcon] = useState('Award');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [awardToDelete, setAwardToDelete] = useState<string | null>(null);
  const [selectedAwardForList, setSelectedAwardForList] = useState<any | null>(null);
  const [awardResearches, setAwardResearches] = useState<any[]>([]);
  const [loadingResearches, setLoadingResearches] = useState(false);

  const handleFinalDeleteAward = async () => {
    if (!awardToDelete) return;
    setLoading(true);
    try {
      await api.deleteAward(awardToDelete);
      setAwards(awards.filter(a => a.id !== awardToDelete));
      showToast('Award category deleted');
      await refreshLogs();
      setAwardToDelete(null);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResearches = async (award: any) => {
    setSelectedAwardForList(award);
    setLoadingResearches(true);
    try {
      const data = await api.getAwardResearches(award.id);
      setAwardResearches(data);
    } catch (err) {
      showToast('Failed to load award recipients', 'error');
    } finally {
      setLoadingResearches(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">RESEARCH ACCOLADES</h3>
          <p className="text-[8px] text-slate-700 font-bold uppercase tracking-widest mt-1">Configure merit categories for exceptional papers</p>
        </div>
        <button onClick={() => setIsNewAwardOpen(true)} className="btn-primary py-3 px-8 text-[10px] w-full sm:w-auto flex items-center justify-center gap-3">
          <Plus size={14} />
          ADD AWARD TYPE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {awards.map(a => (
          <div 
            key={a.id} 
            className="p-5 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-brand-primary/20 hover:scale-[1.01] transition-all duration-300 cursor-pointer overflow-hidden relative"
            onClick={() => handleViewResearches(a)}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary transition-all shadow-inner group-hover:text-slate-900 shrink-0">
                {(() => {
                  const IconComp = { Trophy, Star, Medal, Crown, Target, Heart, Zap, Award: AwardIcon, Shield }[a.icon_name] || AwardIcon;
                  return <IconComp size={18} />;
                })()}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-white uppercase tracking-tighter truncate">{a.title}</p>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{a.recipients_count || 0} Recipients</p>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setAwardToDelete(a.id);
              }} 
              className="w-10 h-10 flex items-center justify-center bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shrink-0 ml-3 shadow-lg shadow-rose-500/5 group-hover:scale-105 active:scale-95"
              title="Delete Award"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {awards.length === 0 && (
          <div className="lg:col-span-4 py-24 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-20">
             <Trophy size={40} className="mx-auto mb-4" />
             <p className="text-[10px] font-bold uppercase tracking-[0.2em]">No award categories configured</p>
          </div>
        )}
      </div>

      {/* Recipient List Modal */}
      <Modal 
        title={`${selectedAwardForList?.title || 'AWARD'} RECIPIENTS`}
        isOpen={!!selectedAwardForList} 
        onClose={() => setSelectedAwardForList(null)}
      >
        <div className="space-y-6 py-2">
          {loadingResearches ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Accessing records...</p>
            </div>
          ) : awardResearches.length > 0 ? (
            <div className="max-h-[60vh] overflow-y-auto pr-2 no-scrollbar space-y-3">
              {awardResearches.map(res => (
                <div key={res.id} className="p-4 bg-[#0a0f1e] border border-white/5 rounded-2xl group hover:border-brand-primary/20 transition-all">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[11px] font-black text-white uppercase leading-tight mb-2 group-hover:text-brand-primary transition-colors truncate">{res.title}</h4>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-md">
                          <User size={10} className="text-slate-500" />
                          <span className="text-[8px] font-bold text-slate-400 capitalize">{res.author_name}</span>
                        </div>
                        <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">{res.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-slate-700 mx-auto mb-4 border border-white/5">
                <Trophy size={28} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No researches have received this accolade yet.</p>
            </div>
          )}
          
          <button 
            onClick={() => setSelectedAwardForList(null)}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-[10px] font-black text-white uppercase tracking-widest rounded-2xl border border-white/5 transition-all mt-4"
          >
            DISMISS
          </button>
        </div>
      </Modal>

      <Modal title="NEW MERIT CATEGORY" isOpen={isNewAwardOpen} onClose={() => setIsNewAwardOpen(false)}>
        <div className="space-y-8 p-2">
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Merit Label</label>
             <input 
               value={newAwardVal}
               onChange={e => setNewAwardVal(e.target.value)}
               className="w-full bg-[#0a0f1e] border border-white/10 rounded-2xl p-4 font-bold text-white text-center focus:outline-none focus:border-brand-primary transition-all text-xs"
               placeholder="GOLD MEDAL FOR RESEARCH..."
             />
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Visual Badge Icon</label>
             <button 
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="w-full flex items-center justify-between p-4 bg-slate-900 border border-white/10 rounded-xl group"
             >
                <div className="flex items-center gap-3">
                   {(() => {
                     const IconComp = { Trophy, Star, Medal, Crown, Target, Heart, Zap, Award: AwardIcon, Shield }[newAwardIcon] || AwardIcon;
                     return <IconComp size={18} className="text-brand-primary" />;
                   })()}
                   <span className="text-xs font-bold text-white uppercase">{newAwardIcon}</span>
                </div>
                <ChevronDown size={14} className="text-slate-600 group-hover:text-white transition-colors" />
             </button>

             {showIconPicker && (
               <div className="grid grid-cols-3 gap-2 p-4 bg-[#111827] rounded-xl border border-white/5">
                  {['Trophy', 'Star', 'Medal', 'Crown', 'Target', 'Heart', 'Zap', 'Award', 'Shield'].map(icon => {
                    const IconComp = { Trophy, Star, Medal, Crown, Target, Heart, Zap, Award: AwardIcon, Shield }[icon] || AwardIcon;
                    return (
                      <button 
                        key={icon}
                        onClick={() => {
                          setNewAwardIcon(icon);
                          setShowIconPicker(false);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-lg transition-all",
                          newAwardIcon === icon ? "bg-brand-primary/20 border border-brand-primary/40" : "bg-slate-900 border border-transparent hover:border-white/10"
                        )}
                      >
                         <IconComp size={20} className={newAwardIcon === icon ? "text-brand-primary" : "text-slate-500"} />
                         <span className="text-[8px] font-black uppercase text-slate-500">{icon}</span>
                      </button>
                    );
                  })}
               </div>
             )}
          </div>

          <p className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl text-[9px] font-bold text-amber-500 uppercase leading-relaxed">
            <AlertTriangle size={12} className="inline mr-2" />
            Newly created awards will be available to bestow upon research during the moderation process.
          </p>

          <button 
            disabled={loading || !newAwardVal}
            onClick={async () => {
              setLoading(true);
              try {
                await api.addAward({ title: newAwardVal, icon_name: newAwardIcon });
                const updated = await api.getAwards();
                setAwards(updated);
                showToast('Award category created');
                await refreshLogs();
                setIsNewAwardOpen(false);
                setNewAwardVal('');
              } finally {
                setLoading(false);
              }
            }}
            className="w-full btn-primary py-4 text-[10px] font-black uppercase tracking-widest"
          >
            {loading ? 'Processing...' : 'Register Award Label'}
          </button>
        </div>
      </Modal>

      <ConfirmModal 
        isOpen={!!awardToDelete} 
        onClose={() => setAwardToDelete(null)} 
        title="DELETE AWARD" 
        message="Are you sure you want to permanently delete this award category?" 
        onConfirm={handleFinalDeleteAward}
        confirmLabel="DELETE"
      />
    </div>
  );
};
