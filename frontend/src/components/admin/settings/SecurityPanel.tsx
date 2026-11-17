import React, { useState, useEffect } from 'react';
import { ShieldCheck, Shield, Lock, Globe, Settings, User } from 'lucide-react';
import { api } from '../../../lib/api';
import { cn } from '../../../lib/utils';

interface SecurityPanelProps {
  showToast: (m: string, t?: 'success' | 'error') => void;
  settings: any;
  setSettings?: React.Dispatch<React.SetStateAction<any>>;
  refreshLogs?: () => Promise<void>;
}

export const SecurityPanel = ({ showToast, settings, setSettings, refreshLogs }: SecurityPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const toggle = async (key: string) => {
    const newVal = localSettings[key] === 'true' ? 'false' : 'true';
    setLocalSettings({ ...localSettings, [key]: newVal });
    if (setSettings) {
      setSettings((p: any) => ({ ...p, [key]: newVal }));
    }
    try {
      await api.updateSettings({ [key]: newVal });
      showToast('Security preference updated');
      if (refreshLogs) await refreshLogs();
    } catch (err) {
      showToast('Update failed', 'error');
    }
  };

  const downloadAuditLog = async () => {
    try {
      const data = await api.getActivityLog('all');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `archive-audit-trail-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Audit trail downloaded');
    } catch (err) {
      showToast('Download failed', 'error');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div className="p-6 sm:p-10 bg-[#0a0f1e] border border-white/5 rounded-[2rem] sm:rounded-3xl flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group">
           <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-all duration-700" />
           <ShieldCheck size={48} className="sm:w-16 sm:h-16 text-brand-primary mb-6 sm:mb-8 animate-pulse relative z-10" />
           <h4 className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter mb-4 relative z-10">System Shield Active</h4>
           <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed px-4 sm:px-12 relative z-10">
              All infrastructure changes, authentication events, and moderation actions are encrypted and logged in our immutable audit chain.
           </p>
           <button 
            onClick={downloadAuditLog}
            className="mt-8 sm:mt-12 px-6 py-3 sm:px-10 sm:py-4 bg-brand-primary/10 border border-brand-primary/30 rounded-xl sm:rounded-2xl text-[10px] font-black text-brand-primary uppercase tracking-widest hover:bg-brand-primary hover:text-slate-900 transition-all relative z-10"
           >
              Download Full Audit Trail
           </button>
        </div>
        
        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">SECURITY PROTOCOLS</h3>
          
          <div className="space-y-2 sm:space-y-3">
            {[
              { key: 'mfa_enforcement', label: 'MFA Enforcement', icon: Shield },
              { key: 'session_timeout', label: 'Auto Session Timeout', icon: Lock },
              { key: 'public_registration', label: 'Public Student Access', icon: Globe },
              { key: 'admin_registration_lock', label: 'Admin Key Registration Lock', icon: Settings },
            ].map(pref => (
              <div 
                key={pref.key} 
                onClick={() => toggle(pref.key)}
                className="flex items-center justify-between p-4 sm:p-5 bg-[#0a0f1e] border border-white/5 rounded-xl sm:rounded-2xl group hover:border-brand-primary/30 transition-all cursor-pointer shadow-lg"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                   <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-900 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-500 group-hover:text-brand-primary transition-colors shrink-0">
                      <pref.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                   </div>
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-tight">{pref.label}</span>
                </div>
                <div className={cn(
                  "w-12 h-6 rounded-full relative p-1 transition-all duration-300",
                  localSettings[pref.key] === 'true' ? "bg-brand-primary" : "bg-slate-800"
                )}>
                   <div className={cn(
                     "w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-xl",
                     localSettings[pref.key] === 'true' ? "translate-x-6" : "translate-x-0"
                   )} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
