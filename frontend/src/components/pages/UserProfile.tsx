import React, { useEffect, useRef, useState } from 'react';
import { Plus, Bookmark, Trash2, Settings, Upload, User, CheckCircle, AlertCircle, ChevronDown, Calendar as CalendarIcon, RefreshCw, FileText, LogOut, Edit, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { api, Research } from '../../lib/api';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { LoadingSpinner, EmptyState } from './Common';
import { ConfirmModal, DetailModal, CountryCodeModal, GenderModal, DatePickerModal, CourseModal, SectionModal, YearLevelModal, LogoutConfirmModal } from '../shared/Shared';
import { Globe } from 'lucide-react';

export const UserProfile = () => {
  const { user, logout, refreshUser } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState('Uploaded Research');
  const [uploads, setUploads] = useState<Research[]>([]);
  const [bookmarks, setBookmarks] = useState<Research[]>([]);
  const [loading, setLoading] = useState(true);
  const [formSaving, setFormSaving] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [permDeleteTarget, setPermDeleteTarget] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'security'>('profile');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [phonePrefix, setPhonePrefix] = useState('+63');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedFields, setFocusedFields] = useState<Record<string, boolean>>({});
  const isProfileSaving = useRef(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const setFocused = (field: string, isFocused: boolean) => {
    setFocusedFields(prev => ({ ...prev, [field]: isFocused }));
  };

  const renderFloatingLabel = (label: string, field: string, isForcedFocus?: boolean) => {
    const value = (editForm as any)[field] || (passwordForm as any)[field];
    const isFocused = focusedFields[field] || isForcedFocus;
    return (
      <motion.label
        initial={false}
        animate={{
          top: (value || isFocused) ? 0 : "50%",
          y: (value || isFocused) ? "-50%" : "-50%",
          scale: (value || isFocused) ? 0.8 : 1,
          x: (value || isFocused) ? -4 : 0,
        }}
        className={cn(
          "absolute left-4 pointer-events-none select-none transition-colors duration-200 uppercase tracking-[0.2em] origin-left z-10 whitespace-nowrap truncate max-w-[calc(100%-2rem)]",
          (value || isFocused) 
            ? "text-brand-primary bg-[#111827] px-2 font-black text-[10px]" 
            : "text-slate-500 font-bold text-[9px] md:text-[10px]"
        )}
      >
        {label}
      </motion.label>
    );
  };

  const [courseModal, setCourseModal] = useState(false);
  const [sectionModal, setSectionModal] = useState(false);
  const [yearModal, setYearModal] = useState(false);
  const [selectables, setSelectables] = useState<any>({
    course: [],
    section: [],
    year_level: []
  });

  useEffect(() => {
    api.getPublicSelectibles().then(setSelectables).catch(err => console.error('Failed to fetch selectibles', err));
  }, []);

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

  const navigate = useNavigate();

  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || '',
    course: user?.course || '',
    section: user?.section || '',
    year_level: user?.year_level || '',
    gender: user?.gender || '',
    birthdate: user?.birthdate || '',
    address: user?.address || '',
    phone: user?.phone || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user && !isProfileSaving.current) {
      setEditForm({
        full_name: user.full_name || '',
        course: user.course || '',
        section: user.section || '',
        year_level: user.year_level || '',
        gender: user.gender || '',
        birthdate: user.birthdate || '',
        address: user.address || '',
        phone: user.phone || ''
      });
      const prefix = user.phone?.match(/^\+\d+/)?.[0] || '+63';
      setPhonePrefix(prefix);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'Uploaded Research' || activeTab === 'Deleted Uploads') {
      api.getMyUploads().then(setUploads).finally(() => setLoading(false));
    } else if (activeTab === 'Bookmarks') {
      api.getMyBookmarks().then(setBookmarks).finally(() => setLoading(false));
    }
  }, [activeTab]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setFormSaving(true);
    isProfileSaving.current = true;
    try {
      await api.updateUser(user.id, editForm);
      await refreshUser();
      showToast('Profile updated successfully');
    } catch (err) {
      showToast('Failed to update profile', 'error');
    } finally {
      isProfileSaving.current = false;
      setFormSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setFormSaving(true);
    try {
      await api.changePassword({ 
        currentPassword: passwordForm.currentPassword, 
        newPassword: passwordForm.newPassword 
      });
      showToast('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showToast(err.error || 'Failed to update password', 'error');
    } finally {
      setFormSaving(false);
    }
  };

  const handleRestore = async (id: string) => {
    await api.restoreResearch(id);
    api.getMyUploads().then(setUploads);
  };

  const handleDeleteResearch = async () => {
    if (deleteTarget) {
      await api.deleteResearch(deleteTarget);
      api.getMyUploads().then(setUploads);
      setDeleteTarget(null);
    }
  };

  const getRemainingDays = (deletedAtStr?: string) => {
    if (!deletedAtStr) return 30;
    const deletedAt = new Date(deletedAtStr);
    const diffTime = Date.now() - deletedAt.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const remaining = 30 - diffDays;
    return remaining > 0 ? remaining : 0;
  };

  const handlePermanentDeleteResearch = async () => {
    if (permDeleteTarget) {
      await api.permanentlyDeleteResearch(permDeleteTarget);
      api.getMyUploads().then(setUploads);
      setPermDeleteTarget(null);
    }
  };

  const tabs = ['Uploaded Research', 'Bookmarks', 'Deleted Uploads'];

  const getTabContent = () => {
    if (loading && activeTab !== 'Uploaded Research' && activeTab !== 'Deleted Uploads') return <LoadingSpinner />;

    switch (activeTab) {
      case 'Uploaded Research': {
        const liveUploads = uploads.filter(u => !u.deleted_at);
        return (
          <div className="grid grid-cols-2 gap-4">
            {liveUploads.map(item => (
              <div key={item.id} className="aspect-[3/4] bg-[#111827] border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden group shadow-lg flex flex-col transition-all hover:border-brand-primary/30 hover:shadow-2xl hover:shadow-brand-primary/10 hover:-translate-y-1">
                <Link to={`/research/${item.id}`} className="block h-[72%] relative group overflow-hidden">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                      <FileText size={20} className="text-slate-800" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <span className={cn(
                      "text-[5px] sm:text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 sm:px-2 sm:py-1 rounded border backdrop-blur-md",
                      item.status === 'accepted' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                      item.status === 'rejected' ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                      "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    )}>
                      {item.status}
                    </span>
                  </div>
                </Link>
                <div className="h-[28%] p-2 sm:p-2.5 bg-[#111827] flex flex-col justify-center border-t border-white/5">
                  <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-white uppercase line-clamp-1 group-hover:text-brand-primary transition-colors leading-tight">{item.title}</p>
                  <div className="flex items-center justify-between mt-1 sm:mt-1.5">
                    <p className="text-[6px] sm:text-[7px] md:text-[8px] text-slate-500 font-bold uppercase tracking-tight">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteTarget(item.id);
                      }}
                      className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                      title="Delete Research"
                    >
                      <Trash2 size={10} className="sm:w-[12px] sm:h-[12px]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div onClick={() => navigate('/upload')} className="aspect-[3/4] bg-[#0d1526]/50 border-dashed border-white/10 border-2 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center gap-1 sm:gap-2 hover:bg-brand-primary/5 hover:border-brand-primary/20 transition-all cursor-pointer">
               <Plus size={20} className="text-white/10 sm:w-[24px] sm:h-[24px]" />
               <span className="text-[7px] sm:text-[8px] font-black text-slate-600 uppercase tracking-widest text-center">New Research</span>
            </div>
          </div>
        );
      }
      case 'Bookmarks':
        return bookmarks.length === 0 ? (
          <EmptyState icon={Bookmark} message="No bookmarks saved" />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {bookmarks.map(item => (
              <div key={item.id} className="aspect-[3/4] bg-[#111827] border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden group shadow-lg flex flex-col transition-all hover:border-brand-primary/30 relative hover:shadow-2xl hover:shadow-brand-primary/10 hover:-translate-y-1">
                <Link to={`/research/${item.id}`} className="block h-[72%] relative group overflow-hidden">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                      <FileText size={20} className="text-slate-800" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                </Link>
                <div className="h-[28%] p-2 sm:p-2.5 bg-[#111827] flex flex-col justify-center border-t border-white/5">
                  <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-white uppercase line-clamp-1 group-hover:text-brand-primary transition-colors leading-tight">{item.title}</p>
                  <p className="text-[6px] sm:text-[7px] md:text-[8px] text-slate-500 font-bold uppercase mt-1 tracking-tight">By {item.author_name}</p>
                </div>
                <button 
                  onClick={async (e) => {
                    e.preventDefault();
                    await api.toggleBookmark(item.id);
                    api.getMyBookmarks().then(setBookmarks);
                  }}
                  className="absolute top-2 right-2 p-1.5 sm:p-2 bg-brand-primary text-slate-900 rounded-lg shadow-xl active:scale-90 transition-all z-10"
                >
                  <Bookmark size={10} className="sm:w-[12px] sm:h-[12px]" fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        );
      case 'Deleted Uploads': {
        const deleted = uploads.filter(u => u.deleted_at);
        return deleted.length === 0 ? (
          <EmptyState icon={Trash2} message="No deleted archives" />
        ) : (
          <div className="space-y-4">
            {deleted.map(item => {
              const daysLeft = getRemainingDays(item.deleted_at);
              return (
                <div key={item.id} className="p-4 bg-slate-900/50 border border-white/5 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-rose-500/20 hover:bg-rose-950/5 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-black text-white uppercase truncate max-w-[200px] sm:max-w-md lg:max-w-xl">{item.title}</p>
                      <p className="text-[8px] text-rose-400 font-bold uppercase mt-1 tracking-wider">
                        {daysLeft > 0 ? `Permanently deletes in ${daysLeft} days` : 'Auto-purges today'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button onClick={() => handleRestore(item.id)}
                      className="px-4 py-2 bg-white/5 text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-white rounded-lg sm:rounded-xl transition-all border border-white/5 flex items-center gap-1.5">
                      <RefreshCw size={10} />
                      Restore
                    </button>
                    <button onClick={() => setPermDeleteTarget(item.id)}
                      className="px-4 py-2 bg-rose-500/10 text-[9px] font-black text-rose-400 uppercase tracking-widest hover:bg-rose-500/20 rounded-lg sm:rounded-xl transition-all border border-rose-500/10 flex items-center gap-1.5">
                      <Trash2 size={10} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
      default: return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-[#0a0f1e] pb-24 shadow-2xl border-x border-white/5 overflow-hidden">

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md bg-[#111827]/95 border-white/10"
          >
            {toast.type === 'success'
              ? <CheckCircle size={16} className="text-brand-primary shrink-0" />
              : <AlertCircle size={16} className="text-rose-400 shrink-0" />
            }
            <p className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              toast.type === 'success' ? "text-brand-primary" : "text-rose-400"
            )}>
              {toast.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-gradient-to-b from-[#1e293b] to-[#0a0f1e] p-4 lg:p-24 text-center border-b border-white/5 relative">
        <button 
          onClick={() => setIsLogoutModalOpen(true)}
          className="absolute top-3 right-3 lg:top-10 lg:right-10 w-8 h-8 sm:w-10 sm:h-10 bg-rose-500/10 rounded-lg sm:rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg"
          title="Logout"
        >
          <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
        <div className="relative group w-24 h-24 lg:w-40 lg:h-40 mx-auto mb-4 sm:mb-6">
          <div className="w-full h-full rounded-full bg-slate-800 border-2 sm:border-4 border-brand-background shadow-2xl overflow-hidden flex items-center justify-center">
             {user?.avatar_url ? (
               <img src={user.avatar_url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
             ) : (
               <User className="text-slate-600 w-12 h-12 lg:w-20 lg:h-20" />
             )}
          </div>
        </div>
        <h2 className="text-xl lg:text-4xl font-black text-white tracking-tight uppercase leading-tight">{user?.full_name}</h2>
        <p className="text-[8px] lg:text-xs text-brand-primary font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] mt-1.5 sm:mt-2">
          {user?.role?.toLowerCase().includes('super') || user?.role?.toLowerCase().includes('master') || user?.course?.toLowerCase().includes('super') || user?.year_level?.toLowerCase().includes('super') || user?.section?.toLowerCase().includes('super') ? (
            'Master Administrator'
          ) : user?.role?.toLowerCase().includes('admin') ? (
            'Administrator'
          ) : (
            `${user?.role || 'Student'} | ${user?.course || ''} ${user?.year_level?.replace(/\D/g, '') || ''}-${user?.section || ''}`
          )}
        </p>
        <button 
          onClick={() => {
            setActiveSettingsTab('profile');
            setIsEditModalOpen(true);
          }}
          className="px-6 py-2 sm:px-8 sm:py-3 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black text-white uppercase tracking-widest mt-6 sm:mt-8 hover:bg-brand-primary hover:text-slate-900 hover:border-brand-primary transition-all shadow-xl flex items-center gap-2 sm:gap-3 mx-auto"
        >
          <Settings size={12} className="sm:w-[14px] sm:h-[14px]" />
          Profile Settings
        </button>
      </div>
      
      <div className="max-w-5xl mx-auto mt-4 sm:mt-8 px-4">
        <div className="flex bg-white/5 p-0.5 sm:p-1.5 rounded-xl sm:rounded-2xl border border-white/5 lg:justify-center mb-4 sm:mb-0 gap-1 sm:gap-2">
          {tabs.map((tab) => (
            <button 
              key={tab} 
              onClick={() => { setActiveTab(tab); setLoading(true); }}
              className={cn(
              "flex-1 lg:flex-none lg:px-12 py-2 sm:py-3 text-[8px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all relative rounded-lg sm:rounded-xl",
              activeTab === tab 
                ? "bg-brand-primary text-slate-900 shadow-lg" 
                : "text-slate-500 hover:text-white hover:bg-white/5"
            )}>
              {tab}
            </button>
          ))}
        </div>

        <div className="p-2 sm:p-6 md:p-10 min-h-[400px]">
          {getTabContent()}
        </div>
      </div>

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => logout()}
      />

      <ConfirmModal 
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Move to Trash"
        message="Are you sure you want to move this research to trash? You can restore it later from your account settings."
        onConfirm={handleDeleteResearch}
      />

      <ConfirmModal
        isOpen={!!permDeleteTarget}
        onClose={() => setPermDeleteTarget(null)}
        title="PERMANENTLY DELETE ARCHIVE"
        message="Warning: This action cannot be undone. This research, including its PDF and metadata, will be permanently removed from PLV Archives."
        onConfirm={handlePermanentDeleteResearch}
      />

      <DetailModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="SETTINGS & PROFILE"
      >
        <div className="flex border-b border-white/5 mb-8 bg-white/5 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveSettingsTab('profile')}
            className={cn(
              "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative rounded-xl",
              activeSettingsTab === 'profile' ? "bg-brand-primary text-slate-900 shadow-lg" : "text-slate-500"
            )}
          >
            Basic Info
          </button>
          <button 
            onClick={() => setActiveSettingsTab('security')}
            className={cn(
              "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative rounded-xl",
              activeSettingsTab === 'security' ? "bg-brand-primary text-slate-900 shadow-lg" : "text-slate-500"
            )}
          >
            Password
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
          {activeSettingsTab === 'profile' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex flex-col items-center gap-4 mb-4">
                <div className="group relative">
                  <div className="w-32 h-32 rounded-full bg-slate-800 border-2 border-white/10 overflow-hidden shadow-2xl group-hover:border-brand-primary/30 transition-all duration-300">
                     {user?.avatar_url ? (
                       <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-700">
                          <User size={40} />
                       </div>
                     )}
                  </div>
                  <input 
                    type="file" 
                    id="user-avatar-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !user) return;
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        const base64 = reader.result as string;
                        try {
                          await api.updateUser(user.id, { avatar_url: base64 });
                          await refreshUser();
                        } catch (err) {
                          showToast('Failed to update photo', 'error');
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <button 
                    type="button"
                    onClick={() => document.getElementById('user-avatar-upload')?.click()}
                    className="absolute -bottom-2 -right-2 bg-brand-primary text-slate-900 p-2.5 rounded-xl shadow-lg border border-white/20 cursor-pointer hover:scale-110 active:scale-95 transition-all z-10"
                    title="Change Profile Photo"
                  >
                    <Edit size={18} />
                  </button>
                </div>
              </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl shrink-0">
                  <User size={16} />
                </div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Professional Identity</h4>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input 
                    className="input-field py-3 md:py-4 placeholder:text-transparent" 
                    placeholder=""
                    value={editForm.full_name} 
                    onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))}
                    onFocus={() => setFocused('full_name', true)}
                    onBlur={() => setFocused('full_name', false)}
                  />
                  {renderFloatingLabel('Full Identity Name', 'full_name')}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setCourseModal(true)}
                      className="input-field py-3 md:py-4 flex items-center justify-between group relative pr-10 overflow-hidden"
                    >
                      <span className="text-white font-medium text-sm truncate text-left">
                        {editForm.course || '\u00A0'}
                      </span>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <ChevronDown size={12} className="text-slate-500 group-hover:text-brand-primary transition-colors" />
                      </div>
                    </button>
                    {renderFloatingLabel('School Course', 'course', courseModal)}
                  </div>
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setSectionModal(true)}
                      className="input-field py-3 md:py-4 flex items-center justify-between group relative pr-10 overflow-hidden"
                    >
                      <span className="text-white font-medium text-sm truncate text-left">
                        {editForm.section || '\u00A0'}
                      </span>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <ChevronDown size={12} className="text-slate-500 group-hover:text-brand-primary transition-colors" />
                      </div>
                    </button>
                    {renderFloatingLabel('Class Section', 'section', sectionModal)}
                  </div>
                </div>

                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setYearModal(true)}
                    className="input-field py-3 md:py-4 flex items-center justify-between group relative pr-10 overflow-hidden w-full"
                  >
                    <span className="text-white font-medium text-sm truncate text-left">
                      {editForm.year_level || '\u00A0'}
                    </span>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <ChevronDown size={12} className="text-slate-500 group-hover:text-brand-primary transition-colors" />
                    </div>
                  </button>
                  {renderFloatingLabel('Year Level', 'year_level', yearModal)}
                </div>

                <div className="flex gap-2">
                  <div className="relative shrink-0">
                    <button 
                      type="button"
                      onClick={() => setShowCountryModal(true)}
                      className="input-field px-4 py-3 md:py-4 flex items-center gap-1 group/prefix whitespace-nowrap"
                    >
                      <span className="text-white font-medium text-sm">{phonePrefix}</span>
                      <ChevronDown size={12} className="text-slate-500 group-hover/prefix:text-brand-primary transition-colors" />
                    </button>
                  </div>
                  <div className="relative flex-1">
                    <input 
                      className="input-field py-3 md:py-4 placeholder:text-transparent truncate" 
                      placeholder=""
                      value={editForm.phone.replace(phonePrefix, '').replace(/^\s+/, '')} 
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setEditForm(p => ({ ...p, phone: `${phonePrefix} ${val}` }));
                      }}
                      onFocus={() => setFocused('phone', true)}
                      onBlur={() => setFocused('phone', false)}
                    />
                    {renderFloatingLabel('Phone Contact', 'phone')}
                  </div>
                </div>

                <div className="relative">
                  <input 
                    className="input-field py-3 md:py-4 text-slate-500 font-medium text-sm cursor-not-allowed opacity-60" 
                    value={user?.plv_email || ''} 
                    disabled 
                  />
                  {renderFloatingLabel('Institutional Email', 'email', true)}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setShowGenderModal(true)}
                      className="input-field py-3 md:py-4 flex items-center justify-between group relative pr-10 overflow-hidden"
                    >
                      <span className="text-white font-medium text-sm truncate text-left uppercase">
                        {editForm.gender || '\u00A0'}
                      </span>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <ChevronDown size={12} className="text-slate-500 group-hover:text-brand-primary transition-colors" />
                      </div>
                    </button>
                    {renderFloatingLabel('Gender', 'gender', showGenderModal)}
                  </div>
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setShowDateModal(true)}
                      className="input-field py-3 md:py-4 flex items-center justify-between group relative pr-10 overflow-hidden"
                    >
                      <span className="text-white font-medium text-sm font-mono truncate text-left">
                        {formatDateDisplay(editForm.birthdate) || '\u00A0'}
                      </span>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <ChevronDown size={12} className="text-slate-500 group-hover:text-brand-primary transition-colors" />
                      </div>
                    </button>
                    {renderFloatingLabel('Birthdate', 'birthdate', showDateModal)}
                  </div>
                </div>

                <div className="relative">
                  <input 
                    className="input-field py-3 md:py-4 placeholder:text-transparent" 
                    placeholder=""
                    value={editForm.address} 
                    onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))}
                    onFocus={() => setFocused('address', true)}
                    onBlur={() => setFocused('address', false)}
                  />
                  {renderFloatingLabel('Address', 'address')}
                </div>
              </div>
            </div>
            <div className="pt-4">
              <button onClick={handleUpdateProfile} disabled={formSaving} className="btn-primary w-full py-4 text-[10px]">{formSaving ? 'SAVING...' : 'APPLY CHANGES'}</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl mb-4">
               <p className="text-[10px] text-brand-primary font-bold uppercase leading-relaxed text-center">
                 Keep your access key secure. Use strong characters for higher security rating.
               </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl shrink-0">
                  <Globe size={16} />
                </div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Security Protocol</h4>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    className="input-field py-3 md:py-4 pr-12 placeholder:text-transparent" 
                    value={passwordForm.currentPassword} 
                    onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} 
                    onFocus={() => setFocused('currentPassword', true)}
                    onBlur={() => setFocused('currentPassword', false)}
                  />
                  {renderFloatingLabel('Current Access Key', 'currentPassword')}
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-primary transition-colors"
                  >
                    {showCurrentPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    className="input-field py-3 md:py-4 pr-12 placeholder:text-transparent" 
                    value={passwordForm.newPassword} 
                    onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} 
                    onFocus={() => setFocused('newPassword', true)}
                    onBlur={() => setFocused('newPassword', false)}
                  />
                  {renderFloatingLabel('New Deployment Key', 'newPassword')}
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-primary transition-colors"
                  >
                    {showNewPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    className="input-field py-3 md:py-4 pr-12 placeholder:text-transparent" 
                    value={passwordForm.confirmPassword} 
                    onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} 
                    onFocus={() => setFocused('confirmPassword', true)}
                    onBlur={() => setFocused('confirmPassword', false)}
                  />
                  {renderFloatingLabel('Confirm Key', 'confirmPassword')}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-primary transition-colors"
                  >
                    {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="pt-4">
              <button 
                onClick={handleUpdatePassword} 
                disabled={formSaving}
                className="btn-primary w-full py-4 text-[10px] bg-slate-800 border border-white/5"
              >
                {formSaving ? 'UPDATING...' : 'UPDATE PASSWORD'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DetailModal>

      <CourseModal
        isOpen={courseModal}
        onClose={() => setCourseModal(false)}
        options={selectables.course.map((i: any) => i.value)}
        value={editForm.course}
        onSelect={(val) => setEditForm(p => ({ ...p, course: val }))}
      />

      <SectionModal
        isOpen={sectionModal}
        onClose={() => setSectionModal(false)}
        options={selectables.section.map((i: any) => i.value)}
        value={editForm.section}
        onSelect={(val) => setEditForm(p => ({ ...p, section: val }))}
      />

      <YearLevelModal
        isOpen={yearModal}
        onClose={() => setYearModal(false)}
        options={selectables.year_level.map((i: any) => i.value)}
        value={editForm.year_level}
        onSelect={(val) => setEditForm(p => ({ ...p, year_level: val }))}
      />

      <CountryCodeModal
        isOpen={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        countryCodes={countryCodes}
        phonePrefix={phonePrefix}
        onSelect={(code) => {
          const currentPhone = editForm.phone.replace(phonePrefix, '').trim();
          setPhonePrefix(code);
          setEditForm(p => ({ ...p, phone: `${code} ${currentPhone}` }));
        }}
      />

      <GenderModal
        isOpen={showGenderModal}
        onClose={() => setShowGenderModal(false)}
        value={editForm.gender}
        onSelect={(g) => setEditForm(p => ({ ...p, gender: g }))}
      />

      <DatePickerModal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
        value={editForm.birthdate}
        onChange={(val) => setEditForm(p => ({ ...p, birthdate: val }))}
        title="BIRTH DATE"
      />
    </div>
  );
};

export default UserProfile;
