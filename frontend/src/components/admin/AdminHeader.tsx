import React, { useState, useEffect, useRef } from 'react';
import { Search, Settings, HelpCircle, Bell, User, Info, FileText, Globe, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { Modal, LogoutConfirmModal } from '../shared/Shared';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const AdminHeader = ({ onLogoClick }: { onLogoClick?: () => void }) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  
  // CONFIGURATION: Set to false to hide the help icon globally
  const SHOW_HELP_ICON = false;

  // CONFIGURATION: Change to 'circle' or 'square'
  const AVATAR_SHAPE: 'circle' | 'square' = 'circle';

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifError, setNotifError] = useState(false);
  const [pendingCount, setPendingCount] = useState({ pendingRegistrations: 0, pendingUploads: 0, total: 0 });

  const fetchPending = () => {
    if (!user) return;
    api.getPendingCount().then(setPendingCount).catch(() => {});
  };

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (isNotifOpen && user) {
      setNotifError(false);
      api.getInbox().then(setNotifications).catch(() => setNotifError(true));
    }
  }, [isNotifOpen, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="h-16 w-full border-b border-white/5 flex items-center justify-between px-4 sm:px-8 bg-[#0a0f1e]/80 backdrop-blur-md sticky top-0 z-[40]">
        <div className="flex items-center flex-1 min-w-0">
          <div 
            className="md:w-64 w-auto flex items-center gap-4 shrink-0 cursor-pointer group/logo"
            onClick={onLogoClick}
          >
            <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 overflow-hidden shrink-0 group-hover/logo:border-brand-primary/50 transition-all">
               {settings?.logoUrl ? (
                 <img src={settings.logoUrl} className="w-full h-full object-cover" alt="Logo" />
               ) : (
                 <Globe size={18} className="text-brand-primary" />
               )}
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm sm:text-lg font-black text-white tracking-tighter uppercase leading-none truncate">{settings?.appName || 'PLV Archive'}</h1>
              <p className="text-[8px] sm:text-[10px] text-brand-primary font-black uppercase tracking-widest mt-1 truncate">{settings?.tagline || 'Administrator Panel'}</p>
            </div>
          </div>

          <div className="max-w-md w-full relative hidden lg:block ml-8">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search resources, users or docs..."
              className="w-full bg-[#151c2f] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-300 focus:outline-none focus:border-brand-primary/30 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {SHOW_HELP_ICON && (
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="p-2 text-slate-500 hover:text-white transition-colors"
            >
              <HelpCircle size={18} />
            </button>
          )}
          <button 
            onClick={() => setIsNotifOpen(true)}
            className="p-2 text-slate-500 hover:text-white transition-colors relative"
          >
            <Bell size={18} />
            {pendingCount.total > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-primary rounded-full border-2 border-[#0a0f1e] animate-pulse" />
            )}
          </button>
          <div className="h-6 w-px bg-white/5 mx-1 sm:mx-2" />
          <div className="relative" ref={profileRef}>
            <div 
              className={cn(
                "flex items-center gap-3 pl-1 sm:pl-2 group cursor-pointer transition-all",
                isProfileOpen ? "opacity-100" : ""
              )} 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-white uppercase leading-none whitespace-nowrap">{user?.full_name}</p>
                <p className="text-[8px] text-brand-primary font-bold uppercase tracking-widest mt-1 whitespace-nowrap">
                  {user?.role === 'masteradmin' ? 'MASTER ADMINISTRATOR' : 'ADMINISTRATOR'}
                </p>
              </div>
              <div className={cn(
                "w-8 h-8 bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20 group-hover:bg-brand-primary group-hover:text-slate-900 transition-all overflow-hidden",
                AVATAR_SHAPE === 'circle' ? "rounded-full" : "rounded-lg",
                isProfileOpen && "bg-brand-primary text-slate-900 ring-2 ring-brand-primary/20"
              )}>
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    className={cn(
                      "w-full h-full object-cover",
                      AVATAR_SHAPE === 'circle' ? "rounded-full" : "rounded-lg"
                    )} 
                    alt="" 
                  />
                ) : (
                  <User size={14} />
                )}
              </div>
            </div>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-72 bg-[#0d1225] border border-white/5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-20 h-20 bg-slate-900 border-2 border-brand-primary/20 flex items-center justify-center overflow-hidden mb-4 shadow-2xl relative group/avatar",
                        AVATAR_SHAPE === 'circle' ? "rounded-full" : "rounded-2xl"
                      )}>
                        {user?.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            className={cn(
                              "w-full h-full object-cover transition-transform group-hover/avatar:scale-110",
                              AVATAR_SHAPE === 'circle' ? "rounded-full" : ""
                            )} 
                            alt="" 
                          />
                        ) : (
                          <User size={24} className="text-slate-700" />
                        )}
                        <div className="absolute inset-0 bg-brand-primary/20 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                      </div>
                      <h3 className="text-base font-black text-white uppercase tracking-tighter text-center">{user?.full_name}</h3>
                      <p className="text-[9px] text-brand-primary font-black uppercase tracking-widest mt-1 bg-brand-primary/10 px-2 py-0.5 rounded-full border border-brand-primary/20">
                        {user?.role === 'masteradmin' ? 'Master Administrator' : 'Administrator'}
                      </p>
                    </div>

                    <div className="mt-6 space-y-2">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm">
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">PLV Email</p>
                        <p className="text-[10px] font-bold text-slate-300 truncate">{user?.plv_email}</p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-2">
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/admin/settings');
                        }}
                        className="w-full py-3 px-4 bg-white/5 hover:bg-brand-primary hover:text-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between group/btn border border-white/5 hover:border-brand-primary"
                      >
                        <div className="flex items-center gap-2">
                          <Settings size={14} className="group-hover/btn:rotate-90 transition-transform" />
                          <span>Settings Panel</span>
                        </div>
                        <Info size={12} className="opacity-40" />
                      </button>

                      <button 
                        onClick={async () => {
                          setIsProfileOpen(false);
                          setIsLogoutModalOpen(true);
                        }}
                        className="w-full py-3 px-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-rose-500/20 hover:border-rose-500"
                      >
                        <LogOut size={14} />
                        <span>Sign Out Session</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-brand-primary/5 p-3 border-t border-white/5 text-center">
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em]">PLV Online Archives - v{import.meta.env.VITE_APP_VERSION ?? '—'}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Modals outside header to prevent stacking context weirdness */}
      
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={async () => {
          setIsLogoutModalOpen(false);
          await api.logout();
          window.location.href = '/admin/login';
        }}
      />
      
      <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title="ADMINISTRATOR HELP">
        <div className="space-y-4">
          <div className="p-4 bg-brand-primary/5 rounded-xl border border-brand-primary/10 flex gap-4">
            <Info className="text-brand-primary shrink-0" size={20} />
            <div>
              <h4 className="text-sm font-bold text-white uppercase">User Management</h4>
              <p className="text-xs text-slate-400 mt-1">Approve pending registrations in the 'Registration' tab before users can log in.</p>
            </div>
          </div>
          <div className="p-4 bg-brand-primary/5 rounded-xl border border-brand-primary/10 flex gap-4">
            <FileText className="text-brand-primary shrink-0" size={20} />
            <div>
              <h4 className="text-sm font-bold text-white uppercase">Research Moderation</h4>
              <p className="text-xs text-slate-400 mt-1">Verify uploaded PDFs and abstracts in the 'User Uploads' section.</p>
            </div>
          </div>
          
          {/* ADD MORE HELP INFORMATION HERE */}
          <div className="pt-4 border-t border-white/5">
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">System Documentation</h4>
             <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Guide version: 1.0.4</p>
                <p className="text-xs text-slate-400 mt-2 italic">Detailed system guides and operational procedures can be added to this section in the codebase.</p>
             </div>
          </div>
        </div>
      </Modal>

      {/* System Notifications Modal */}
      <Modal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        title="SYSTEM NOTIFICATIONS"
      >
        <div className="space-y-4">
          {pendingCount.total > 0 && (
            <div className="grid grid-cols-1 gap-2">
              {pendingCount.pendingRegistrations > 0 && (
                <button
                  onClick={() => { setIsNotifOpen(false); navigate('/admin/registration'); }}
                  className="p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-xl flex items-center justify-between hover:bg-brand-primary/20 transition-all"
                >
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{pendingCount.pendingRegistrations} Pending Registrations</span>
                  <Info size={14} className="text-brand-primary shrink-0" />
                </button>
              )}
              {pendingCount.pendingUploads > 0 && (
                <button
                  onClick={() => { setIsNotifOpen(false); navigate('/admin/uploads'); }}
                  className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between hover:bg-blue-500/20 transition-all"
                >
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{pendingCount.pendingUploads} Pending Uploads</span>
                  <Info size={14} className="text-blue-400 shrink-0" />
                </button>
              )}
            </div>
          )}

          <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-3">
            {notifError ? (
              <p className="text-center py-8 text-rose-400 text-[10px] font-black uppercase tracking-widest">Failed to load notifications</p>
            ) : notifications.length === 0 ? (
              <p className="text-center py-8 text-slate-500 text-[10px] font-black uppercase tracking-widest">No recent system logs</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-brand-primary/20 transition-all">
                  <div className="flex justify-between items-start gap-3">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-wide leading-tight">{n.title}</h4>
                    <span className="text-[9px] text-slate-500 font-mono shrink-0">{n.created_at ? new Date(n.created_at).toLocaleTimeString() : ''}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{n.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
