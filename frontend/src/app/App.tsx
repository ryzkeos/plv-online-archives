import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { Settings, Home, Mail, User, Globe, LogOut } from 'lucide-react';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { MobileNav } from '../components/user/MobileNav';
import { LogoutConfirmModal } from '../components/shared/Shared';
import { cn } from '../lib/utils';
import { 
  UserHome, 
  AdminUserList, 
  UserInbox, 
  UserProfile, 
  AdminRegistration, 
  AdminUserDetails,
  AdminUploads,
  AdminSettings,
  AdminResearchEdit,
  SearchResultsPage,
  ResearchUploadPage,
  ResearchDetailsPage
} from '../components/pages';
import { LoginPage, RegistrationPage, OTPPage, PasswordResetPage, AdminLoginPage } from '../components/auth';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { SettingsProvider, useSettings } from '../hooks/useSettings';

const LoadingScreen = () => (
  <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
    <div className="w-8 h-8 border-t-2 border-brand-primary rounded-full animate-spin" />
  </div>
);

const MaintenanceScreen = () => (
  <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center p-6 text-center">
    <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mb-8 animate-pulse text-rose-500">
      <Settings size={40} />
    </div>
    <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 italic">Maintenance Mode</h1>
    <p className="text-slate-400 max-w-md font-medium leading-relaxed">
      The platform is currently undergoing scheduled maintenance to improve our services. 
      Please check back again soon.
    </p>
    <div className="mt-12 pt-8 border-t border-white/5 w-64">
       <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">PLV Archive Support</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, adminOnly = false, masteradminOnly = false }: { children: React.ReactNode, adminOnly?: boolean, masteradminOnly?: boolean }) => {
  const { user, loading } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  // Allow admins to bypass maintenance
  const isAdmin = user?.role === 'admin' || user?.role === 'masteradmin';
  if (settings?.maintenance_mode === 'true' && !isAdmin && !location.pathname.startsWith('/admin/login')) {
    return <MaintenanceScreen />;
  }

  if (!user) {
    return <Navigate to={adminOnly || masteradminOnly ? "/admin/login" : "/login"} state={{ from: location }} replace />;
  }

  if (masteradminOnly && user.role !== 'masteradmin') {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && user.role !== 'admin' && user.role !== 'masteradmin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AdminRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role === 'admin' || user.role === 'masteradmin') {
    return <Navigate to="/admin/users" replace />;
  }
  return <Navigate to="/" replace />;
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="flex flex-col h-screen bg-[#0a0f1e] overflow-hidden">
      <AdminHeader onLogoClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto p-0 scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
};

const UserSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { settings } = useSettings();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/inbox', icon: Mail, label: 'Inbox' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 bg-[#0a0f1e] border-r border-white/5 h-screen sticky top-0 p-6">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center text-slate-900 shadow-lg shadow-brand-primary/20 overflow-hidden">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <Globe size={24} />
            )}
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tighter uppercase leading-none truncate max-w-[140px]">
               {settings?.appName || 'PLV Archive'}
            </h1>
            <p className="text-[10px] text-brand-primary font-black uppercase tracking-widest mt-1">
              {settings?.tagline || 'Research Hub'}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest",
                isActive ? "bg-brand-primary text-slate-900 shadow-lg shadow-brand-primary/10 scale-[1.02]" : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
              )}
            >
              <link.icon size={18} strokeWidth={2.5} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="pt-8 border-t border-white/5 mt-auto">
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 active:scale-[0.98]"
          >
            <LogOut size={18} strokeWidth={2.5} />
            SIGN OUT
          </button>
        </div>
      </aside>

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => { setIsLogoutModalOpen(false); logout(); }}
      />
    </>
  );
};

const UserLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#0a0f1e] flex flex-col md:flex-row">
    <UserSidebar />
    <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </main>
    <MobileNav />
  </div>
);

const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#0a0f1e]">
    {children}
  </div>
);

const AppContent = () => {
  const navigate = useNavigate();
  const { settings, loading } = useSettings();

  if (loading) return <LoadingScreen />;

  return (
    <div className="relative">
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={
          settings?.maintenance_mode === 'true' ? <MaintenanceScreen /> : 
          <AuthLayout><LoginPage onToggle={() => navigate('/signup')} /></AuthLayout>
        } />
        <Route path="/admin/login" element={<AuthLayout><AdminLoginPage /></AuthLayout>} />
        <Route path="/signup" element={
          settings?.maintenance_mode === 'true' ? <MaintenanceScreen /> :
          <AuthLayout><RegistrationPage onToggle={() => navigate('/login')} /></AuthLayout>
        } />
        <Route path="/otp" element={<AuthLayout><OTPPage onVerify={() => navigate('/')} /></AuthLayout>} />
        <Route path="/reset" element={<AuthLayout><PasswordResetPage /></AuthLayout>} />

        {/* User Routes */}
        <Route path="/" element={<ProtectedRoute><UserLayout><UserHome /></UserLayout></ProtectedRoute>} />
        <Route path="/inbox" element={<ProtectedRoute><UserLayout><UserInbox /></UserLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><UserLayout><UserProfile /></UserLayout></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><UserLayout><SearchResultsPage /></UserLayout></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><UserLayout><ResearchUploadPage /></UserLayout></ProtectedRoute>} />
        <Route path="/research/:id" element={<ProtectedRoute><UserLayout><ResearchDetailsPage /></UserLayout></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRedirect />} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminLayout><AdminUserList /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/users/:id" element={<ProtectedRoute adminOnly><AdminLayout><AdminUserDetails /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/registration" element={<ProtectedRoute adminOnly><AdminLayout><AdminRegistration /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/uploads" element={<ProtectedRoute adminOnly><AdminLayout><AdminUploads /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/research/:id/edit" element={<ProtectedRoute adminOnly><AdminLayout><AdminResearchEdit /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute adminOnly><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </SettingsProvider>
  );
}

