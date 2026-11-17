import React from 'react';
import { Activity } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ActivityLogPanelProps {
  adminScope: 'mine' | 'all';
  setAdminScope: (s: 'mine' | 'all') => void;
  logFilters: any;
  setLogFilters: React.Dispatch<React.SetStateAction<any>>;
  activityLog: any[];
  formatDateDisplay: (d: string) => string;
  setShowStartDateModal: (s: boolean) => void;
  setShowEndDateModal: (s: boolean) => void;
  setShowEntityTypeModal: (s: boolean) => void;
  setCalendarDate: (d: Date) => void;
}

export const ActivityLogPanel = ({
  adminScope,
  setAdminScope,
  logFilters,
  setLogFilters,
  activityLog,
  formatDateDisplay,
  setShowStartDateModal,
  setShowEndDateModal,
  setShowEntityTypeModal,
  setCalendarDate
}: ActivityLogPanelProps) => {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
         <div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Audit Trail Explorer</h3>
            <p className="text-[8px] text-slate-700 font-bold uppercase tracking-widest mt-1">Review system changes and moderation actions</p>
         </div>
         <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 w-full sm:max-w-[400px]">
            <button 
              onClick={() => setAdminScope('mine')} 
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all text-center",
                adminScope === 'mine' ? "bg-brand-primary text-slate-900 shadow-lg" : "text-slate-500 hover:text-white"
              )}
            >My Actions</button>
            <button 
              onClick={() => setAdminScope('all')} 
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all text-center",
                adminScope === 'all' ? "bg-brand-primary text-slate-900 shadow-lg" : "text-slate-500 hover:text-white"
              )}
            >System Wide</button>
         </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 p-3 md:p-4 bg-[#0a0f1e] rounded-xl md:rounded-2xl border border-white/5">
        <div className="space-y-1 md:space-y-2 min-w-0">
          <label className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-widest truncate">From</label>
          <button 
            type="button"
            onClick={() => {
              const d = logFilters.startDate ? new Date(logFilters.startDate) : new Date();
              if (!isNaN(d.getTime())) setCalendarDate(d);
              setShowStartDateModal(true);
            }}
            className="w-full bg-[#111827] text-white p-2 md:p-3 rounded-lg md:rounded-xl border border-white/5 text-[8px] md:text-[10px] font-bold uppercase outline-none focus:border-brand-primary/30 transition-all flex items-center justify-between min-w-0 overflow-hidden"
          >
            <span className={cn(logFilters.startDate ? "text-white" : "text-slate-500", "truncate")}>
              {formatDateDisplay(logFilters.startDate) || 'Start'}
            </span>
          </button>
        </div>
        <div className="space-y-1 md:space-y-2 min-w-0">
          <label className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-widest truncate">End</label>
          <button 
            type="button"
            onClick={() => {
              const d = logFilters.endDate ? new Date(logFilters.endDate) : new Date();
              if (!isNaN(d.getTime())) setCalendarDate(d);
              setShowEndDateModal(true);
            }}
            className="w-full bg-[#111827] text-white p-2 md:p-3 rounded-lg md:rounded-xl border border-white/5 text-[8px] md:text-[10px] font-bold uppercase outline-none focus:border-brand-primary/30 transition-all flex items-center justify-between min-w-0 overflow-hidden"
          >
            <span className={cn(logFilters.endDate ? "text-white" : "text-slate-500", "truncate")}>
              {formatDateDisplay(logFilters.endDate) || 'End'}
            </span>
          </button>
        </div>
        <div className="space-y-1 md:space-y-2 min-w-0">
          <label className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-widest truncate">Action</label>
          <div className="relative">
            <input 
              placeholder="Action"
              value={logFilters.actionType}
              onChange={e => setLogFilters((p: any) => ({ ...p, actionType: e.target.value }))}
              className="w-full bg-[#111827] text-white p-2 md:p-3 rounded-lg md:rounded-xl border border-white/5 text-[8px] md:text-[10px] font-bold uppercase outline-none focus:border-brand-primary/30 transition-all truncate"
            />
          </div>
        </div>
        <div className="space-y-1 md:space-y-2 min-w-0">
          <label className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-widest truncate">Target</label>
          <button 
            type="button"
            onClick={() => setShowEntityTypeModal(true)}
            className="w-full bg-[#111827] text-white p-2 md:p-3 rounded-lg md:rounded-xl border border-white/5 text-[8px] md:text-[10px] font-bold uppercase outline-none focus:border-brand-primary/30 transition-all flex items-center justify-between min-w-0 overflow-hidden"
          >
            <span className={cn(logFilters.targetType ? "text-white" : "text-slate-500", "truncate")}>
              {logFilters.targetType || 'All'}
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {activityLog.length === 0 ? (
          <div className="py-24 text-center glass-card border-dashed border-white/5">
             <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Activity size={32} className="text-slate-700" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No activity logs meet these criteria</p>
             <p className="text-[8px] font-bold uppercase tracking-widest text-slate-700 mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          activityLog.map(log => (
            <div key={log.id} className="p-2 md:p-4 bg-[#0a0f1e] border border-white/5 rounded-xl flex items-center justify-between group hover:border-brand-primary/20 transition-all relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary/0 group-hover:bg-brand-primary/40 transition-all" />
              <div className="flex items-center gap-2 md:gap-4">
                <div className={cn(
                  "w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center transition-all group-hover:scale-110 shrink-0",
                  log.action.toLowerCase().includes('approve') || log.action.toLowerCase().includes('accept') || log.action.toLowerCase().includes('activate') ? "bg-emerald-500/10 text-emerald-500" :
                  log.action.toLowerCase().includes('reject') || log.action.toLowerCase().includes('delete') || log.action.toLowerCase().includes('deactivate') || log.action.toLowerCase().includes('remove') ? "bg-rose-500/10 text-rose-500" :
                  log.action.toLowerCase().includes('update') ? "bg-amber-500/10 text-amber-500" :
                  log.action.toLowerCase().includes('feature') ? "bg-purple-500/10 text-purple-500" :
                  "bg-blue-500/10 text-blue-500"
                )}>
                   <Activity size={14} />
                </div>
                <div>
                   <p className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-tight flex items-center gap-1.5 md:gap-2">
                     {log.action}
                     {log.target_type && (
                       <span className="px-1.5 py-0.5 bg-white/5 text-slate-500 text-[6px] md:text-[7px] border border-white/5 rounded-full">
                         {log.target_type}
                       </span>
                     )}
                   </p>
                   <div className="flex items-center gap-2 mt-1">
                     <p className="text-[8px] text-brand-primary font-bold uppercase tracking-widest">
                       {log.admin_name}
                     </p>
                     {log.target_label && (
                       <>
                         <span className="text-[8px] text-slate-800">•</span>
                         <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight truncate max-w-[120px] md:max-w-[200px]">
                           {log.target_label}
                         </p>
                       </>
                     )}
                   </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white font-mono font-bold">
                  {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-[8px] text-slate-600 font-mono mt-0.5">
                  {new Date(log.created_at).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </p>
              </div>
            </div>
          ))
        )}
        {activityLog.length > 0 && activityLog.length === 100 && (
          <p className="text-[8px] text-slate-700 font-black text-center uppercase tracking-widest pt-4">Limit reached (Showing last 100 actions)</p>
        )}
      </div>
    </div>
  );
};
