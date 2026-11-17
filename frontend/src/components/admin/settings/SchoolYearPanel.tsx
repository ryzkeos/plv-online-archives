import React, { useState } from 'react';
import { Archive, Plus, Trash2, Calendar as CalendarIcon, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../../../lib/api';
import { cn } from '../../../lib/utils';
import { Modal, ConfirmModal, DatePickerModal } from '../../shared/Shared';

interface SchoolYearPanelProps {
  years: any[];
  setYears: (y: any[]) => void;
  loading: boolean;
  setLoading: (l: boolean) => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
  refreshLogs: () => Promise<void>;
}

export const SchoolYearPanel = ({
  years,
  setYears,
  loading,
  setLoading,
  showToast,
  refreshLogs
}: SchoolYearPanelProps) => {
  const [isNewYearOpen, setIsNewYearOpen] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    start_date: '',
    end_date: ''
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [yearToDelete, setYearToDelete] = useState<string | null>(null);

  const handleFinalDeleteYear = async () => {
    if (!yearToDelete) return;
    setLoading(true);
    try {
      await api.deleteYear(yearToDelete);
      setYears(years.filter(y => y.id !== yearToDelete));
      showToast('Academic period deleted');
      await refreshLogs();
      setYearToDelete(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not Set';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const isExpired = (endDate: string) => {
    if (!endDate) return false;
    return new Date() > new Date(endDate);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ACADEMIC PERIODS</h3>
          <p className="text-[8px] text-slate-700 font-bold uppercase tracking-widest mt-1">Manage school terms and session dates</p>
        </div>
        <button onClick={() => setIsNewYearOpen(true)} className="btn-primary py-3 px-8 text-[10px] w-full sm:w-auto flex items-center justify-center gap-3">
          <Plus size={14} />
          REGISTER NEW PERIOD
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {years.map(y => {
          const expired = isExpired(y.end_date);
          return (
            <div key={y.id} className={cn(
              "p-5 sm:p-6 bg-[#0a0f1e] border rounded-3xl sm:rounded-[2rem] group hover:scale-[1.01] transition-all duration-500 relative overflow-hidden flex flex-col",
              y.is_active ? "border-brand-primary/40 shadow-[0_0_50px_-12px_rgba(20,184,166,0.2)]" : "border-white/5"
            )}>
              {!!y.is_active && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary/20 via-brand-primary to-brand-primary/20 animate-pulse" />
              )}
              
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tighter group-hover:text-brand-primary transition-colors">{y.year}</p>
                  <p className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">FISCAL PERIOD</p>
                </div>
                {expired && !!y.is_active && (
                  <div className="bg-rose-500/10 text-rose-500 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-rose-500/20 animate-bounce">
                    <AlertTriangle size={12} className="sm:w-3.5 sm:h-3.5" />
                  </div>
                )}
              </div>

              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/[0.02] rounded-xl sm:rounded-2xl border border-white/5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                    <CalendarIcon size={12} className="sm:w-3.5 sm:h-3.5" />
                  </div>
                  <div>
                    <p className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest">START DATE</p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-white uppercase">{formatDate(y.start_date)}</p>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/[0.02] rounded-xl sm:rounded-2xl border border-white/5",
                  expired ? "border-rose-500/20" : ""
                )}>
                  <div className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0",
                    expired ? "bg-rose-500/10 text-rose-500" : "bg-brand-primary/10 text-brand-primary"
                  )}>
                    <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                  </div>
                  <div>
                    <p className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest">END DATE</p>
                    <p className={cn(
                      "text-[9px] sm:text-[10px] font-bold uppercase",
                      expired ? "text-rose-500" : "text-white"
                    )}>{formatDate(y.end_date)}</p>
                  </div>
                </div>
              </div>

              {expired && !!y.is_active && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl sm:rounded-2xl text-center">
                  <p className="text-[8px] sm:text-[9px] font-black text-rose-500 uppercase tracking-widest leading-loose">
                    ACADEMIC PERIOD HAS ENDED.<br/>PLEASE UPDATE SYSTEM STATUS.
                  </p>
                </div>
              )}
              
              <div className="mt-auto flex gap-2">
                 <button 
                  disabled={loading}
                  onClick={async () => {
                     setLoading(true);
                     try {
                       await api.updateYear(y.id, { is_active: y.is_active ? 0 : 1 });
                       const updated = await api.getYears();
                       setYears(updated);
                       showToast('Academic period updated');
                       await refreshLogs();
                     } finally {
                       setLoading(false);
                     }
                  }}
                  className={cn(
                    "flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all",
                    y.is_active ? "bg-brand-primary/20 text-brand-primary shadow-xl shadow-brand-primary/10" : "bg-white/5 text-slate-500 hover:bg-white/10"
                  )}
                 >
                   {y.is_active ? 'ACTIVE' : 'ACTIVATE'}
                 </button>
                 <button 
                  onClick={() => setYearToDelete(y.id)}
                  className="w-12 sm:w-14 h-auto aspect-square sm:aspect-auto flex items-center justify-center bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl sm:rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/5"
                  title="Remove Period"
                 >
                   <Trash2 size={14} className="sm:hidden" />
                   <span className="hidden sm:inline">REMOVE</span>
                 </button>
              </div>
            </div>
          );
        })}
        {years.length === 0 && (
          <div className="lg:col-span-3 py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20">
             <Archive size={40} className="mx-auto mb-4" />
             <p className="text-[10px] font-bold uppercase tracking-[0.2em]">No academic periods registered</p>
          </div>
        )}
      </div>

      <Modal title="ADD NEW ACADEMIC PERIOD" isOpen={isNewYearOpen} onClose={() => setIsNewYearOpen(false)}>
        <div className="space-y-8 py-2">
          <div className="text-center">
             <div className="w-16 h-16 bg-brand-primary/10 rounded-3xl flex items-center justify-center text-brand-primary mx-auto mb-6">
               <CalendarIcon size={32} />
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-8 leading-loose">
               Set the duration for the new academic period. The system will automatically label the batch year based on your selection.
             </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
             <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <div className="w-1 h-1 bg-brand-primary rounded-full" />
                   Session Start Date
                </label>
                <button 
                  onClick={() => setShowStartPicker(true)}
                  className="w-full bg-[#0a0f1e] border border-white/10 rounded-2xl p-5 flex items-center justify-between group/btn hover:border-brand-primary/40 transition-all font-mono"
                >
                  <span className={cn(
                    "text-sm font-bold uppercase tracking-tight",
                    newPeriod.start_date ? "text-white" : "text-slate-600"
                  )}>
                    {newPeriod.start_date ? formatDate(newPeriod.start_date) : 'Choose Start Date'}
                  </span>
                  <CalendarIcon size={18} className="text-slate-600 group-hover/btn:text-brand-primary transition-colors" />
                </button>
             </div>

             <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <div className="w-1 h-1 bg-brand-primary rounded-full" />
                   Session End Date
                </label>
                <button 
                  onClick={() => setShowEndPicker(true)}
                  className="w-full bg-[#0a0f1e] border border-white/10 rounded-2xl p-5 flex items-center justify-between group/btn hover:border-brand-primary/40 transition-all font-mono"
                >
                  <span className={cn(
                    "text-sm font-bold uppercase tracking-tight",
                    newPeriod.end_date ? "text-white" : "text-slate-600"
                  )}>
                    {newPeriod.end_date ? formatDate(newPeriod.end_date) : 'Choose End Date'}
                  </span>
                  <CalendarIcon size={18} className="text-slate-600 group-hover/btn:text-brand-primary transition-colors" />
                </button>
             </div>
          </div>

          <button 
            disabled={loading || !newPeriod.start_date || !newPeriod.end_date}
            onClick={async () => {
              setLoading(true);
              try {
                await api.addYear({ start_date: newPeriod.start_date, end_date: newPeriod.end_date });
                const updated = await api.getYears();
                setYears(updated);
                showToast('Academic period registered successfully');
                await refreshLogs();
                setIsNewYearOpen(false);
                setNewPeriod({ start_date: '', end_date: '' });
              } catch (err: any) {
                showToast(err.error || 'Failed to register period', 'error');
              } finally {
                setLoading(false);
              }
            }}
            className="w-full btn-primary py-5 text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-brand-primary/20 active:scale-95 transition-transform"
          >
            {loading ? 'PROCESSING...' : 'FINALIZE ACADEMIC PERIOD'}
          </button>
        </div>
      </Modal>

      <DatePickerModal 
        isOpen={showStartPicker} 
        onClose={() => setShowStartPicker(false)} 
        value={newPeriod.start_date} 
        onChange={(v) => setNewPeriod(p => ({ ...p, start_date: v }))} 
        title="START DATE SELECTION" 
      />

      <DatePickerModal 
        isOpen={showEndPicker} 
        onClose={() => setShowEndPicker(false)} 
        value={newPeriod.end_date} 
        onChange={(v) => setNewPeriod(p => ({ ...p, end_date: v }))} 
        title="END DATE SELECTION" 
      />

      <ConfirmModal 
        isOpen={!!yearToDelete} 
        onClose={() => setYearToDelete(null)} 
        title="DELETE SCHOOL YEAR" 
        message="Are you sure? Deleting a school year might affect the records of research linked to it." 
        onConfirm={handleFinalDeleteYear}
        confirmLabel="CONFIRM DELETE"
      />
    </div>
  );
};
