import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, ChevronRight, Layout, Shield, User, FileText, Search, Mail } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Template {
  id: string;
  name: string;
  category: 'Auth' | 'User' | 'Admin';
  icon: React.ReactNode;
  path: string;
}

const templates: Template[] = [
  { id: 'login', name: 'Login Screen', category: 'Auth', icon: <Shield size={14} />, path: '/login' },
  { id: 'signup', name: 'Sign Up', category: 'Auth', icon: <User size={14} />, path: '/signup' },
  { id: 'otp', name: 'OTP Verification', category: 'Auth', icon: <Shield size={14} />, path: '/otp' },
  { id: 'reset', name: 'Password Reset', category: 'Auth', icon: <Shield size={14} />, path: '/reset' },
  { id: 'user-home', name: 'User Home', category: 'User', icon: <Layout size={14} />, path: '/' },
  { id: 'user-inbox', name: 'Inbox', category: 'User', icon: <Mail size={14} />, path: '/inbox' },
  { id: 'user-profile', name: 'Profile', category: 'User', icon: <User size={14} />, path: '/profile' },
  { id: 'user-search', name: 'Search Results', category: 'User', icon: <Search size={14} />, path: '/search' },
  { id: 'user-upload', name: 'Research Upload', category: 'User', icon: <FileText size={14} />, path: '/upload' },
  { id: 'user-details', name: 'Research Details', category: 'User', icon: <FileText size={14} />, path: '/research/1' },
  { id: 'admin-users', name: 'Admin: User List', category: 'Admin', icon: <Layout size={14} />, path: '/admin/users' },
  { id: 'admin-details', name: 'Admin: User Details', category: 'Admin', icon: <User size={14} />, path: '/admin/users/12-3534' },
  { id: 'admin-reg', name: 'Admin: Registration', category: 'Admin', icon: <Shield size={14} />, path: '/admin/registration' },
  { id: 'admin-uploads', name: 'Admin: All Uploads', category: 'Admin', icon: <FileText size={14} />, path: '/admin/uploads' },
];

export const Customizer = ({ onNavigate }: { onNavigate: (path: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'Auth' | 'User' | 'Admin'>('User');

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 left-8 w-12 h-12 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:border-brand-primary/50 transition-all z-[9999] group shadow-2xl"
      >
        <Settings className="group-hover:rotate-90 transition-transform duration-500" size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            className="fixed top-0 left-0 h-full w-[320px] bg-[#0f172a] border-r border-white/10 z-[10000] shadow-[50px_0_100px_rgba(0,0,0,0.5)] p-8 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-black text-white italic uppercase tracking-widest">Template Customizer</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-white"
              ><X size={20} /></button>
            </div>

            <div className="flex gap-2 mb-6">
              {(['Auth', 'User', 'Admin'] as const).map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border",
                    activeCategory === cat ? "bg-brand-primary/10 border-brand-primary text-brand-primary" : "border-white/5 text-slate-500 hover:text-slate-300"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {templates.filter(t => t.category === activeCategory).map(template => (
                <button 
                  key={template.id}
                  onClick={() => {
                    onNavigate(template.path);
                    if (window.innerWidth < 768) setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-[#1e293b]/50 border border-white/5 rounded-xl hover:bg-brand-primary/5 hover:border-brand-primary/30 group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-slate-500 group-hover:text-brand-primary">{template.icon}</div>
                    <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors uppercase">{template.name}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-700 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center mb-4">Design Perfection v1.0</p>
              <div className="grid grid-cols-2 gap-2">
                <button className="p-2 glass-card text-[8px] font-black uppercase text-center hover:bg-white/5">Save Preset</button>
                <button className="p-2 glass-card text-[8px] font-black uppercase text-center hover:bg-white/5">Export CSS</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
