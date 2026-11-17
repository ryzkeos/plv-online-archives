import React, { useState } from 'react';
import { Users, UserPlus, UploadCloud, LogOut, Settings, Globe } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { LogoutConfirmModal } from '../shared/Shared';

export const AdminSidebar = ({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) => {
  const { logout } = useAuth();
  const { settings } = useSettings();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const links = [
    { to: '/admin/users', icon: Users, label: 'User List' },
    { to: '/admin/registration', icon: UserPlus, label: 'Registration' },
    { to: '/admin/uploads', icon: UploadCloud, label: 'User Uploads' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed top-16 right-0 bottom-0 left-0 bg-black/60 backdrop-blur-sm z-[45] md:hidden"
          onClick={onClose}
        />
      )}

      <div className={cn(
        "admin-sidebar flex flex-col border-r border-white/5 transition-all duration-300 ease-in-out z-[50] bg-[#0f172a] overflow-hidden shadow-2xl",
        "fixed left-0 top-0 h-[100dvh] md:relative md:h-full md:translate-x-0 md:bg-[#0f172a] md:w-64 md:border-t-0 border-t-0",
        isOpen ? "translate-x-0 w-64 opacity-100" : "-translate-x-full md:translate-x-0 w-0 opacity-0 md:opacity-100"
      )}>
        <nav className="flex-1 px-4 space-y-2 pt-6 md:pt-8 overflow-y-auto scrollbar-hide">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold",
                isActive ? "bg-brand-primary/20 text-brand-primary shadow-[inset_0_0_20px_rgba(20,184,166,0.1)]" : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <link.icon size={20} />
              <span className="text-sm">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 pb-24 border-t border-white/5 bg-[#0f172a]/80 backdrop-blur-md shrink-0 mt-auto relative z-10">
          <button 
            onClick={() => {
              if (onClose) onClose();
              setIsLogoutModalOpen(true);
            }}
            className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 active:scale-[0.98]"
          >
            <LogOut size={18} strokeWidth={2.5} />
            SIGN OUT
          </button>
        </div>
      </div>

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => { setIsLogoutModalOpen(false); logout('/admin/login'); }}
      />
    </>
  );
};

export default AdminSidebar;
