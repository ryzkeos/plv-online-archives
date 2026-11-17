import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Settings, 
  Activity, 
  Wrench, 
  Globe, 
  Layers, 
  ShieldCheck, 
  Calendar, 
  Trophy,
  Plus,
  Trash2,
  Edit,
  Search,
  Bell,
  CheckCircle,
  AlertCircle,
  Upload,
  Lock,
  UserPlus,
  Archive,
  Star,
  RefreshCw,
  Megaphone,
  X,
  ChevronRight,
  Shield,
  Calendar as CalendarIcon,
  RotateCcw, AlertTriangle, Medal, Crown, Target, Heart, Zap, Award, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../hooks/useAuth';
import { api, User as UserType, Research } from '../../lib/api';
import { cn } from '../../lib/utils';
import { LoadingSpinner } from './Common';
import { Modal, ConfirmModal, SelectionModal, InputModal, DatePickerModal, CountryCodeModal, GenderModal, EntityTypeModal } from '../shared/Shared';
import { ProfilePanel } from '../admin/settings/ProfilePanel';
import { ActivityLogPanel } from '../admin/settings/ActivityLogPanel';
import { WebsiteConfigPanel } from '../admin/settings/WebsiteConfigPanel';
import { ToolPanel } from '../admin/settings/ToolPanel';
import { SelectiblesPanel } from '../admin/settings/SelectiblesPanel';
import { AdminManagementPanel } from '../admin/settings/AdminManagementPanel';
import { SchoolYearPanel } from '../admin/settings/SchoolYearPanel';
import { AwardsPanel } from '../admin/settings/AwardsPanel';
import { SecurityPanel } from '../admin/settings/SecurityPanel';

type Tab = 'profile' | 'activity' | 'tools' | 'website' | 'selectibles' | 'admins' | 'years' | 'awards' | 'security';

export const AdminSettings = () => {
  const { user, refreshUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [savedLogoUrl, setSavedLogoUrl] = useState('');
  const [years, setYears] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [selectibles, setSelectibles] = useState<any>({});
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [deletedResearch, setDeletedResearch] = useState<Research[]>([]);
  const [featuredResearch, setFeaturedResearch] = useState<Research[]>([]);
  const [allAcceptedResearch, setAllAcceptedResearch] = useState<Research[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  
  // UI State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchAdmin, setSearchAdmin] = useState('');
  const [adminScope, setAdminScope] = useState<'mine' | 'all'>('mine');
  const [logFilters, setLogFilters] = useState({
    startDate: '',
    endDate: '',
    actionType: '',
    targetType: ''
  });
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showEndDateModal, setShowEndDateModal] = useState(false);
  const [showEntityTypeModal, setShowEntityTypeModal] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [phonePrefix, setPhonePrefix] = useState('+63');


  // Forms State
  const [form, setForm] = useState({
    full_name: '',
    plv_email: '',
    gender: '',
    birthdate: '',
    address: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    tagline: 'PLV ONLINE ARCHIVE',
    appName: 'PLV ARCHIVE',
    logoUrl: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    footer_text: '',
    social_facebook: '',
    social_twitter: '',
    about_us: '',
    maintenance_mode: 'false',
    brand_primary: '#14b8a6',
    brand_secondary: '#f59e0b',
    mfa_enforcement: 'false',
    session_timeout: 'true',
    public_registration: 'true',
    admin_registration_lock: 'false'
  });

  const isMasteradmin = user?.role === 'masteradmin';

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    return `${month}-${day}-${year}`;
  };

  const countryCodes = [
    { code: '+63', country: 'Philippines', flag: '🇵🇭' },
    { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+82', country: 'Korea', flag: '🇰🇷' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  ];

  // Toasts
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Brand Color Injection
  useEffect(() => {
    if (form.brand_primary) {
      document.documentElement.style.setProperty('--brand-primary', form.brand_primary);
    }
    if (form.brand_secondary) {
      document.documentElement.style.setProperty('--brand-secondary', form.brand_secondary);
    }
  }, [form.brand_primary, form.brand_secondary]);

  // Inactivity / Session Guarding
  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'masteradmin') return;
    
    let timeout: NodeJS.Timeout;
    const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutes

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        showToast('Session expired due to inactivity', 'error');
        logout();
      }, INACTIVITY_TIME);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      clearTimeout(timeout);
    };
  }, [user]);
  
  // Initial Data Fetch
  useEffect(() => {
    if (user) {
      setForm(p => ({
        ...p,
        full_name: user.full_name || '',
        plv_email: user.plv_email || '',
        gender: user.gender || '',
        birthdate: user.birthdate || '',
        address: user.address || '',
        phone: user.phone || ''
      }));
      const prefix = user.phone?.match(/^\+\d+/)?.[0] || '+63';
      setPhonePrefix(prefix);
    }
    
    // Fetch common data
    const fetchCommon = async () => {
      try {
        const [sy, aw, st] = await Promise.all([
          api.getYears(),
          api.getAwards(),
          api.getSettings()
        ]);
        setYears(sy);
        setAwards(aw);
        setSavedLogoUrl(st.logoUrl || '');
        setForm(p => ({
          ...p,
          appName: st.appName || p.appName,
          tagline: st.tagline || p.tagline,
          logoUrl: st.logoUrl || '',
          contact_email: st.contact_email || '',
          contact_phone: st.contact_phone || '',
          contact_address: st.contact_address || '',
          footer_text: st.footer_text || '',
          social_facebook: st.social_facebook || '',
          social_twitter: st.social_twitter || '',
          about_us: st.about_us || '',
          maintenance_mode: st.maintenance_mode || 'false',
          brand_primary: st.brand_primary || p.brand_primary,
          brand_secondary: st.brand_secondary || p.brand_secondary,
          mfa_enforcement: st.mfa_enforcement || 'false',
          session_timeout: st.session_timeout || 'true',
          public_registration: st.public_registration || 'true',
          admin_registration_lock: st.admin_registration_lock || 'false'
        }));
      } catch (err) {
        console.error('Failed to fetch settings data', err);
      }
    };

    fetchCommon();
  }, [user]);

  // Activity Log Fetch with debouncing
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const act = await api.getActivityLog({ scope: adminScope, ...logFilters });
        setActivityLog(act);
      } catch (err) {
        console.error('Failed to fetch activity logs', err);
      }
    };

    const timer = setTimeout(fetchLogs, 300);
    return () => clearTimeout(timer);
  }, [adminScope, logFilters]);

  // Data Refresh Handlers
  const refreshLogs = async () => {
    try {
      const act = await api.getActivityLog({ scope: adminScope, ...logFilters });
      setActivityLog(act);
    } catch (err) {
      console.error('Failed to refresh activity logs', err);
    }
  };

  const fetchTabData = async () => {
    try {
      if (activeTab === 'activity') {
        await refreshLogs();
      }
      if (activeTab === 'selectibles' || activeTab === 'tools') {
        const res = await api.getSelectibles();
        setSelectibles(res);
      }
      if (activeTab === 'admins' && isMasteradmin) {
        const res = await api.getAdmins();
        setAdmins(res);
      }
      if (activeTab === 'tools') {
        const [ann, del, feat, acc, users] = await Promise.all([
          api.getAnnouncements(),
          api.getDeletedResearch(),
          api.getFeaturedResearch(),
          api.getResearch('accepted'),
          api.getUsers()
        ]);
        setAnnouncements(ann);
        setDeletedResearch(del);
        setFeaturedResearch(feat);
        setAllAcceptedResearch(acc);
        setAllUsers(users);
      }
    } catch (err) {
      console.error('Tab data fetch error', err);
    }
  };

  // Fetch Tab Specific Data
  useEffect(() => {
    fetchTabData();
  }, [activeTab, isMasteradmin]);

  const refreshData = fetchTabData;

  // Handlers
  const handleUpdatePassword = async () => {
    if (!form.newPassword || form.newPassword !== form.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      showToast('Password updated successfully');
      setForm(p => ({ ...p, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (e: any) {
      showToast(e.error || 'Failed to update password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const updateData = { 
        full_name: form.full_name,
        plv_email: form.plv_email,
        gender: form.gender,
        birthdate: form.birthdate,
        address: form.address,
        phone: form.phone
      };
      await api.updateUser(user.id, updateData);
      await refreshUser();
      setForm(p => ({
        ...p,
        ...updateData
      }));
      showToast('Profile updated');
    } catch (e: any) {
      showToast(e.error || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWebsite = async () => {
    setLoading(true);
    try {
      await api.updateSettings({ 
        appName: form.appName, 
        tagline: form.tagline,
        logoUrl: form.logoUrl,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
        contact_address: form.contact_address,
        footer_text: form.footer_text,
        social_facebook: form.social_facebook,
        social_twitter: form.social_twitter,
        about_us: form.about_us,
        maintenance_mode: form.maintenance_mode,
        brand_primary: form.brand_primary,
        brand_secondary: form.brand_secondary
      });
      showToast('Website configuration saved');
      setSavedLogoUrl(form.logoUrl);
      await refreshLogs();
    } catch (e: any) {
      showToast(e.error || 'Failed to update settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', icon: User, label: 'Profile', roles: ['admin', 'masteradmin'] },
    { id: 'activity', icon: Activity, label: 'Activity Logs', roles: ['admin', 'masteradmin'] },
    { id: 'tools', icon: Wrench, label: 'Admin Tools', roles: ['admin', 'masteradmin'] },
    { id: 'website', icon: Globe, label: 'Website', roles: ['masteradmin'] },
    { id: 'selectibles', icon: Layers, label: 'Selectibles', roles: ['masteradmin'] },
    { id: 'admins', icon: ShieldCheck, label: 'Admin Management', roles: ['masteradmin'] },
    { id: 'years', icon: Calendar, label: 'Academic Period', roles: ['masteradmin'] },
    { id: 'awards', icon: Trophy, label: 'Awards', roles: ['masteradmin'] },
    { id: 'security', icon: Settings, label: 'Security', roles: ['masteradmin'] },
  ];

  const visibleTabs = tabs.filter(t => t.roles.includes(user?.role || ''));

  return (
    <div className="p-4 md:p-10 bg-brand-background min-h-screen">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={cn(
              "fixed bottom-10 right-10 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl",
              toast.type === 'success' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
            )}
          >
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <p className="text-xs font-black uppercase tracking-widest">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-10 pb-6 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">SETTINGS & MANAGEMENT</h1>
          <p className="text-[9px] md:text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1.5">
            System configuration and administrative control center
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 space-y-1">
           {visibleTabs.map(t => (
             <button
              key={t.id}
              onClick={() => setActiveTab(t.id as Tab)}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-4 rounded-xl transition-all font-bold text-[10px] tracking-widest uppercase",
                activeTab === t.id 
                  ? "bg-brand-primary text-slate-900 shadow-xl shadow-brand-primary/10" 
                  : "text-slate-500 hover:bg-white/5 hover:text-white"
              )}
             >
               <t.icon size={16} />
               {t.label}
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="glass-card p-4 md:p-10 min-h-[600px] shadow-2xl relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {activeTab === 'profile' && (
                  <ProfilePanel 
                    user={user} 
                    refreshUser={refreshUser} 
                    showToast={showToast} 
                    form={form} 
                    setForm={setForm}
                    phonePrefix={phonePrefix}
                    setPhonePrefix={setPhonePrefix}
                    countryCodes={countryCodes}
                    loading={loading}
                    setLoading={setLoading}
                    formatDateDisplay={formatDateDisplay}
                    setShowCountryModal={setShowCountryModal}
                    showCountryModal={showCountryModal}
                    setShowGenderModal={setShowGenderModal}
                    showGenderModal={showGenderModal}
                    setShowDateModal={setShowDateModal}
                    showDateModal={showDateModal}
                    setCalendarDate={setCalendarDate}
                    handleUpdatePassword={handleUpdatePassword}
                    handleSaveProfile={handleSaveProfile}
                  />
                )}

                {activeTab === 'activity' && (
                  <ActivityLogPanel 
                    activityLog={activityLog}
                    adminScope={adminScope}
                    setAdminScope={setAdminScope}
                    logFilters={logFilters}
                    setLogFilters={setLogFilters}
                    formatDateDisplay={formatDateDisplay}
                    setShowStartDateModal={setShowStartDateModal}
                    setShowEndDateModal={setShowEndDateModal}
                    setShowEntityTypeModal={setShowEntityTypeModal}
                    setCalendarDate={setCalendarDate}
                  />
                )}

                {activeTab === 'tools' && (
                  <ToolPanel 
                    announcements={announcements} 
                    deletedResearch={deletedResearch} 
                    featuredResearch={featuredResearch}
                    allAcceptedResearch={allAcceptedResearch}
                    allUsers={allUsers}
                    selectibles={selectibles}
                    refreshData={refreshData}
                    showToast={showToast}
                    isMasteradmin={isMasteradmin}
                  />
                )}

                {activeTab === 'website' && isMasteradmin && (
                  <WebsiteConfigPanel 
                    savedLogoUrl={savedLogoUrl}
                    form={form}
                    setForm={setForm}
                    showToast={showToast}
                    handleSaveWebsite={handleSaveWebsite}
                    loading={loading}
                  />
                )}

                {activeTab === 'selectibles' && isMasteradmin && (
                  <SelectiblesPanel data={selectibles} refresh={() => { refreshData(); refreshLogs(); }} showToast={showToast} />
                )}

                {activeTab === 'admins' && isMasteradmin && (
                  <AdminManagementPanel 
                    admins={admins.filter(a => a.full_name.toLowerCase().includes(searchAdmin.toLowerCase()) || a.plv_email.toLowerCase().includes(searchAdmin.toLowerCase()))}
                    refresh={() => { api.getAdmins().then(setAdmins); refreshLogs(); }}
                    search={searchAdmin}
                    setSearch={setSearchAdmin}
                    showToast={showToast}
                    currentUser={user}
                  />
                )}

                {activeTab === 'years' && isMasteradmin && (
                  <SchoolYearPanel 
                    years={years}
                    setYears={setYears}
                    showToast={showToast}
                    loading={loading}
                    setLoading={setLoading}
                    refreshLogs={refreshLogs}
                  />
                )}

                {activeTab === 'awards' && isMasteradmin && (
                  <AwardsPanel 
                    awards={awards}
                    setAwards={setAwards}
                    showToast={showToast}
                    loading={loading}
                    setLoading={setLoading}
                    refreshLogs={refreshLogs}
                  />
                )}

                {activeTab === 'security' && isMasteradmin && (
                  <SecurityPanel showToast={showToast} settings={form} setSettings={setForm} refreshLogs={refreshLogs} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <CountryCodeModal
        isOpen={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        countryCodes={countryCodes}
        phonePrefix={phonePrefix}
        onSelect={(code) => {
          const currentPhone = form.phone.replace(phonePrefix, '').trim();
          setForm(p => ({ ...p, phone: `${code} ${currentPhone}` }));
          setPhonePrefix(code);
        }}
      />
      <GenderModal
        isOpen={showGenderModal}
        onClose={() => setShowGenderModal(false)}
        value={form.gender}
        onSelect={(g) => setForm(p => ({ ...p, gender: g }))}
      />
      <EntityTypeModal
        isOpen={showEntityTypeModal}
        onClose={() => setShowEntityTypeModal(false)}
        value={logFilters.targetType}
        onSelect={(v) => setLogFilters(p => ({ ...p, targetType: v }))}
      />
      <DatePickerModal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
        title="BIRTH DATE SELECTION"
        value={form.birthdate}
        onChange={(v) => setForm(p => ({ ...p, birthdate: v }))}
      />
      <DatePickerModal
        isOpen={showStartDateModal}
        onClose={() => setShowStartDateModal(false)}
        title="START DATE FILTER"
        value={logFilters.startDate}
        onChange={(v) => setLogFilters(p => ({ ...p, startDate: v }))}
      />
      <DatePickerModal
        isOpen={showEndDateModal}
        onClose={() => setShowEndDateModal(false)}
        title="END DATE FILTER"
        value={logFilters.endDate}
        onChange={(v) => setLogFilters(p => ({ ...p, endDate: v }))}
      />
    </div>
  );
};
