import React, { useEffect, useState } from 'react';
import { Home, Mail, User } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export const MobileNav = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const { count } = await api.getUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        // Silent catch for network/auth errors to avoid console noise
      }
    };

    fetchUnread();
    // Refresh every 30 seconds for non-realtime fallback
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [location.pathname, user]);

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/inbox', icon: Mail, label: 'Inbox', badge: unreadCount },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-card rounded-none border-t border-white/5 flex items-center justify-around py-4 z-40 md:hidden bg-brand-background/80 backdrop-blur-xl">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => cn(
            "p-2 rounded-full transition-all relative",
            isActive ? "text-brand-primary scale-110" : "text-slate-500"
          )}
        >
          <link.icon size={24} />
          {link.badge !== undefined && link.badge > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white shadow-sm ring-1 ring-brand-background">
              {link.badge > 99 ? '99+' : link.badge}
            </span>
          )}
        </NavLink>
      ))}
    </div>
  );
};

export default MobileNav;
