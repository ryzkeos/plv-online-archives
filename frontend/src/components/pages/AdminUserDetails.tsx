import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  User,
  Eye, 
  Star, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Trophy,
  Award,
  ArrowLeft,
  Search,
  Layers,
  FileText,
  AlertCircle,
  MoreVertical,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
import { api, Research } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { LoadingSpinner } from './Common';
import { ActionModal, DatePickerModal, CountryCodeModal, GenderModal, CourseModal, SectionModal, YearLevelModal, SelectionModal } from '../shared/Shared';

export const AdminUserDetails = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<'DELETE' | 'ARCHIVE' | 'DEACTIVATE' | null>(null);
  const [researchToDecline, setResearchToDecline] = useState<Research | null>(null);
  const [researchToDelete, setResearchToDelete] = useState<Research | null>(null);
  const [awards, setAwards] = useState<any[]>([]);
  const [awardTarget, setAwardTarget] = useState<Research | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [phonePrefix, setPhonePrefix] = useState('+63');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [focusedFields, setFocusedFields] = useState<Record<string, boolean>>({});
  
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [selectables, setSelectables] = useState<any>({
    course: [],
    section: [],
    year_level: []
  });

  const navigate = useNavigate();

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

  const fetchUser = async () => {
    if (id) {
      try {
        const res = await api.getUser(id);
        setUser(res);
        const prefix = res.phone?.match(/^\+\d+/)?.[0] || '+63';
        setPhonePrefix(prefix);
        setEditData({
          full_name: res.full_name,
          student_number: res.student_number,
          course: res.course,
          section: res.section,
          year_level: res.year_level,
          plv_email: res.plv_email,
          personal_email: res.personal_email || '',
          gender: res.gender || '',
          birthdate: res.birthdate || '',
          address: res.address || '',
          phone: res.phone || '',
        });
      } catch (err) {
        console.error('Failed to fetch user', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUser();
    api.getAwards().then(setAwards);
    api.getPublicSelectibles().then(setSelectables).catch(err => console.error('Failed to fetch selectibles', err));
  }, [id]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const handleAction = async () => {
    if (!id || !activeModal) return;
    try {
      if (activeModal === 'DELETE') await api.deleteUser(id);
      else if (activeModal === 'ARCHIVE') await api.archiveUser(id);
      else if (activeModal === 'DEACTIVATE') await api.deactivateUser(id);
      navigate('/admin/users');
    } catch (err: any) {
      showToast(err.error || 'Action failed', 'error');
    }
  };

  const handleResearchAction = async (research: Research, action: 'approve' | 'reject' | 'delete' | 'feature') => {
    if (action === 'reject') {
      setResearchToDecline(research);
      return;
    }
    if (action === 'delete') {
      setResearchToDelete(research);
      return;
    }

    setActionLoading(true);
    try {
      if (action === 'approve') {
        await api.acceptUpload(research.id);
        showToast('Research approved successfully');
      } else if (action === 'feature') {
        await api.toggleFeatured(research.id);
        showToast(research.is_featured ? 'Removed from featured' : 'Marked as featured');
      }
      fetchUser();
    } catch (err: any) {
      showToast(err.error || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmRejectResearch = async () => {
    if (!researchToDecline) return;
    setActionLoading(true);
    try {
      await api.rejectUpload(researchToDecline.id, declineReason || 'No reason provided');
      showToast('Research rejected');
      setResearchToDecline(null);
      setDeclineReason('');
      fetchUser();
    } catch (err: any) {
      showToast(err.error || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeleteResearch = async () => {
    if (!researchToDelete) return;
    setActionLoading(true);
    try {
      await api.deleteResearch(researchToDelete.id);
      showToast('Research deleted');
      setResearchToDelete(null);
      // Optimistically update UI
      setUser((prev: any) => ({
        ...prev,
        research: prev.research.filter((r: any) => r.id !== researchToDelete.id),
        researchCount: (prev.researchCount || 1) - 1
      }));
      fetchUser();
    } catch (err: any) {
      showToast(err.error || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await api.updateUser(id, editData);
      showToast('User details updated successfully');
      setIsEditing(false);
      fetchUser();
    } catch (err: any) {
      showToast(err.error || 'Update failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBestowAward = async (awardTitle: string) => {
    if (!awardTarget) return;

    if (awardTitle === 'REMOVE AWARD') {
      if (!awardTarget.awards || awardTarget.awards.length === 0) {
        showToast('Research has no awards to remove', 'error');
        setAwardTarget(null);
        return;
      }
      setActionLoading(true);
      try {
        for (const a of awardTarget.awards) {
          await api.unawardResearch(awardTarget.id, a.id);
        }
        showToast('All awards removed successfully');
        fetchUser();
      } catch (err: any) {
        showToast(err.error || 'Failed to remove awards', 'error');
      } finally {
        setAwardTarget(null);
        setActionLoading(false);
      }
      return;
    }

    const award = awards.find(a => a.title === awardTitle);
    if (!award) return;

    setActionLoading(true);
    try {
      await api.bestowAward(awardTarget.id, award.id);
      showToast('Award bestowed successfully');
      setAwardTarget(null);
      fetchUser();
    } catch (err: any) {
      showToast(err.error || 'Failed to bestow award', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnawardResearch = async (research: Research, awardId: string) => {
    if (!window.confirm('Are you sure you want to remove this award?')) return;
    setActionLoading(true);
    try {
      await api.unawardResearch(research.id, awardId);
      showToast('Award removed successfully');
      fetchUser();
    } catch (err: any) {
      showToast(err.error || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const isTargetMasteradmin = user?.role === 'masteradmin';
  const isAdminSession = currentUser?.role === 'admin';
  const canModify = !isAdminSession || !isTargetMasteradmin;

  const renderFloatingLabel = (label: string, value: any, isFocused: boolean, isFieldEditing: boolean, forceActive: boolean = false) => {
    const isActive = forceActive || (value !== undefined && value !== null && value !== "" && value !== "—") || isFocused || !isFieldEditing; 
    return (
      <motion.label
        initial={false}
        animate={{
          top: isActive ? 0 : "50%",
          y: isActive ? "-50%" : "-50%",
          scale: isActive ? 0.8 : 1,
          x: isActive ? -4 : 0,
        }}
        className={cn(
          "absolute left-4 pointer-events-none select-none transition-colors duration-200 uppercase tracking-[0.2em] origin-left z-10 px-2",
          isActive 
            ? cn("text-brand-primary font-black text-[10px]", isFieldEditing ? "bg-[#111827]" : "bg-[#0a0f1e]")
            : "text-slate-500 font-bold text-[9px]"
        )}
      >
        {label}
      </motion.label>
    );
  };

  if (loading) return <div className="p-20 text-center"><LoadingSpinner /></div>;
  if (!user) return <div className="p-20 text-center text-white font-black uppercase">User not found</div>;

  const isViewedUserAdmin = user.role === 'admin' || user.role === 'masteradmin';

  const fields = [
    { label: 'FULL NAME', value: user.full_name, key: 'full_name' },
    ...(!isViewedUserAdmin ? [
      { label: 'STUDENT NUMBER', value: user.student_number, key: 'student_number', type: 'student_number' },
      { label: 'COURSE', value: user.course, key: 'course', type: 'select', modal: 'course' },
      { label: 'SECTION', value: user.section, key: 'section', type: 'select', modal: 'section' },
      { label: 'YEAR LEVEL', value: user.year_level, key: 'year_level', type: 'select', modal: 'year' },
    ] : []),
    { label: 'PLV EMAIL', value: user.plv_email, key: 'plv_email' },
    { label: 'PERSONAL EMAIL', value: user.personal_email, key: 'personal_email' },
    { label: 'RECOGNIZED GENDER', value: user.gender, key: 'gender', type: 'select', options: ['Male', 'Female', 'Non-Binary', 'Other', 'Prefer not to say'] },
    { label: 'DATE OF BIRTH', value: user.birthdate, key: 'birthdate', type: 'date' },
    { label: 'RESIDENTIAL ADDRESS', value: user.address, key: 'address', type: 'textarea' },
    { label: 'CONTACT NUMBER', value: user.phone, key: 'phone', type: 'phone' },
    { label: 'RESEARCH COUNT', value: user.researchCount, key: 'researchCount', readonly: true },
  ];

  return (
    <div className="p-4 md:p-10 bg-[#0a0f1e] min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-10 right-10 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-300",
          toast.type === 'success' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
        )}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-xs font-black uppercase tracking-widest">{toast.message}</p>
        </div>
      )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-10 pb-6 border-b border-white/5 gap-6">
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">USER PROFILE</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Comprehensive Account Authority Control</span>
            </div>
          </div>
          <button onClick={() => navigate(-1)} className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-white/5 rounded-xl text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all border border-white/5 whitespace-nowrap shrink-0">
            <ArrowLeft size={14} className="shrink-0" />
            <span>RETURN</span>
          </button>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Section: Profile Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card bg-[#111827] flex flex-col items-center justify-center p-8 md:p-12 relative overflow-hidden border-none shadow-2xl">
             <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-primary/10 to-transparent" />
             
             <div className="relative z-10 w-32 h-32 md:w-44 md:h-44 rounded-full bg-[#0a0f1e] mb-6 md:mb-8 border-4 md:border-8 border-[#1a2333] shadow-2xl overflow-hidden flex items-center justify-center">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-800 bg-slate-900 overflow-hidden">
                    <User size={64} className="text-slate-700/50" strokeWidth={1.5} />
                  </div>
                )}
             </div>
             
             <div className="text-center relative z-10">
               <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-2 font-mono leading-none">{user.full_name}</h2>
               <div className="inline-block px-4 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full">
                  <p className="text-[10px] text-brand-primary font-black uppercase tracking-widest">
                    {user.role === 'masteradmin' ? 'MASTER ADMINISTRATOR' : user.role === 'admin' ? 'ADMINISTRATOR' : user.role}
                  </p>
               </div>
             </div>
          </div>

          <div className="glass-card p-8 bg-[#111827] border-none shadow-xl">
             <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Account Status</p>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    user.status === 'active' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  )} />
                  <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      user.status === 'active' ? "text-emerald-400" : "text-amber-400"
                    )}>
                      {user.status}
                  </span>
                </div>
             </div>
             <div className="space-y-4">
                <div>
                   <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-1">Registration Date</p>
                   <p className="text-xs text-slate-300 font-mono">{new Date(user.created_at).toLocaleDateString()} {new Date(user.created_at).toLocaleTimeString()}</p>
                </div>
                <div>
                   <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-1">Last Update</p>
                   <p className="text-xs text-slate-300 font-mono">
                     {user.research && user.research.length > 0 
                       ? new Date(Math.max(...user.research.map((r: any) => new Date(r.created_at).getTime()))).toLocaleString('en-US', { 
                           month: 'short', 
                           day: '2-digit', 
                           year: 'numeric',
                           hour: '2-digit',
                           minute: '2-digit'
                         })
                       : 'No Recent Activity'}
                   </p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
             <button 
              disabled={!canModify}
              onClick={() => setActiveModal('ARCHIVE')} 
              className={cn(
                "w-full py-4 bg-[#111827] border border-amber-500/20 rounded-2xl text-[10px] font-black text-amber-500 hover:bg-amber-500 hover:text-white transition-all uppercase tracking-widest",
                !canModify && "opacity-50 cursor-not-allowed grayscale"
              )}
             >
              ARCHIVE ACCOUNT
             </button>
             <button 
              disabled={!canModify}
              onClick={() => setActiveModal('DEACTIVATE')} 
              className={cn(
                "w-full py-4 bg-[#111827] border border-slate-500/20 rounded-2xl text-[10px] font-black text-slate-500 hover:bg-slate-500 hover:text-white transition-all uppercase tracking-widest",
                !canModify && "opacity-50 cursor-not-allowed grayscale"
              )}
             >
               DEACTIVATE ACCOUNT
             </button>
             {currentUser?.role === 'masteradmin' && (
               <button 
                disabled={!canModify}
                onClick={() => setActiveModal('DELETE')} 
                className={cn(
                  "w-full py-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[10px] font-black text-rose-500 hover:bg-rose-500 hover:text-white transition-all uppercase tracking-widest",
                  !canModify && "opacity-50 cursor-not-allowed grayscale"
                )}
               >
                 TERMINATE ACCOUNT
               </button>
             )}
             {!canModify && isAdminSession && (
               <p className="text-[8px] text-rose-500 font-bold uppercase tracking-widest text-center mt-2 px-4 italic opacity-80">
                 Insufficient privilege to modify Master Administrator
               </p>
             )}
          </div>
        </div>
        
        {/* Right Section: Details Grid & Research */}
        <div className="lg:col-span-8 space-y-10">
          <div className="glass-card p-10 bg-[#111827] border-none shadow-2xl">
            <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 md:mb-8 pb-4 border-b border-white/5 flex items-center gap-3">
              <FileText size={14} className="text-brand-primary" />
              IDENTIFICATION DATA
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              {fields.map(f => {
                const isFieldFocused = focusedFields[f.key] || 
                  (isEditing && (
                    f.type === 'select' ? (f.modal === 'course' ? showCourseModal : f.modal === 'section' ? showSectionModal : f.modal === 'year' ? showYearModal : showGenderModal) :
                    f.type === 'date' ? showDateModal :
                    f.type === 'phone' ? showCountryModal :
                    focusedFields[f.key]
                  ));

                // Phone field in edit mode uses a split design to match UserProfile.tsx
                if (isEditing && f.type === 'phone' && !f.readonly) {
                  return (
                    <div key={f.label} className="space-y-4 pt-2">
                       <div className="flex gap-2 w-full overflow-visible">
                          <div className="relative shrink-0">
                            <button 
                              type="button"
                              onClick={() => setShowCountryModal(true)}
                              className="input-field h-[52px] px-4 flex items-center gap-2 group/prefix whitespace-nowrap bg-[#111827] ring-1 ring-brand-primary/30 border-transparent hover:border-brand-primary/50 transition-all font-mono text-sm"
                            >
                              <span className="text-brand-primary font-medium">{phonePrefix}</span>
                              <ChevronDown size={12} className="text-brand-primary/50 group-hover/prefix:text-brand-primary transition-colors" />
                            </button>
                          </div>
                          <div className="relative flex-1 bg-[#111827] rounded-xl ring-1 ring-brand-primary/30 border-transparent overflow-visible shadow-inner">
                            {renderFloatingLabel(f.label, editData[f.key], !!isFieldFocused, true)}
                            <input 
                              type="text"
                              value={editData[f.key]?.replace(phonePrefix, '').trim() || ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setEditData({ ...editData, [f.key]: `${phonePrefix} ${val}` });
                              }}
                              onFocus={() => setFocusedFields({ ...focusedFields, [f.key]: true })}
                              onBlur={() => setFocusedFields({ ...focusedFields, [f.key]: false })}
                              className="w-full bg-transparent h-[52px] px-4 outline-none border-none text-brand-primary font-mono font-bold placeholder:transparent"
                              placeholder=""
                            />
                          </div>
                       </div>
                    </div>
                  );
                }

                return (
                  <div key={f.label} className="space-y-4 pt-2">
                    <div className={cn(
                      "relative bg-[#0a0f1e] rounded-xl border border-white/5 text-sm font-bold text-white shadow-inner flex items-center justify-between overflow-visible transition-all duration-200",
                      isEditing && !f.readonly ? "ring-1 ring-brand-primary/30 border-transparent bg-[#111827]" : "hover:border-white/10 p-4"
                    )}>
                      {renderFloatingLabel(f.label, (isEditing && !f.readonly) ? editData[f.key] : f.value, !!isFieldFocused, isEditing && !f.readonly, f.key === 'researchCount')}
                      
                      {isEditing && !f.readonly ? (
                        <div className="relative w-full flex items-center">
                          {f.type === 'select' ? (
                            <button 
                              type="button"
                              onClick={() => {
                                if (f.modal === 'course') setShowCourseModal(true);
                                else if (f.modal === 'section') setShowSectionModal(true);
                                else if (f.modal === 'year') setShowYearModal(true);
                                else setShowGenderModal(true);
                              }}
                              className="w-full bg-transparent p-4 pr-10 outline-none border-none text-left font-bold flex items-center justify-between group/select"
                            >
                              <span className={cn(
                                "truncate",
                                editData[f.key] ? "text-brand-primary" : "text-brand-primary/40"
                              )}>
                                {editData[f.key] || (isFieldFocused ? '' : '')}
                              </span>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-primary">
                                <ChevronDown size={14} className="text-brand-primary/60 group-hover/select:text-brand-primary transition-colors" />
                              </div>
                            </button>
                          ) : f.type === 'date' ? (
                            <button 
                              type="button"
                              onClick={() => {
                                setShowDateModal(true);
                              }}
                              className="w-full bg-transparent p-4 pr-10 outline-none border-none text-left font-bold flex items-center justify-between group/date"
                            >
                              <span className={cn(
                                "truncate", 
                                editData[f.key] ? "text-brand-primary" : "text-brand-primary/40"
                              )}>
                                {formatDateDisplay(editData[f.key]) || (isFieldFocused ? '' : '')}
                              </span>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-primary">
                                <ChevronDown size={14} className="text-brand-primary/60 group-hover/date:text-brand-primary transition-colors" />
                              </div>
                            </button>
                          ) : f.type === 'textarea' ? (
                            <input 
                              type="text"
                              value={editData[f.key] || ''}
                              onChange={(e) => setEditData({ ...editData, [f.key]: e.target.value })}
                              onFocus={() => setFocusedFields({ ...focusedFields, [f.key]: true })}
                              onBlur={() => setFocusedFields({ ...focusedFields, [f.key]: false })}
                              className="w-full bg-transparent p-4 outline-none border-none text-brand-primary whitespace-nowrap overflow-hidden font-bold leading-tight placeholder:transparent"
                              placeholder=""
                            />
                          ) : f.type === 'student_number' ? (
                            <input 
                              type="text"
                              value={editData[f.key] || ''}
                              onChange={(e) => {
                                let val = e.target.value.replace(/[^\d]/g, '').slice(0, 6);
                                if (val.length > 2) val = val.slice(0, 2) + '-' + val.slice(2);
                                setEditData({ ...editData, [f.key]: val });
                              }}
                              onFocus={() => setFocusedFields({ ...focusedFields, [f.key]: true })}
                              onBlur={() => setFocusedFields({ ...focusedFields, [f.key]: false })}
                              className="w-full bg-transparent p-4 outline-none border-none text-brand-primary font-mono font-bold placeholder:transparent"
                              placeholder=""
                            />
                          ) : (
                            <input 
                              type="text"
                              value={editData[f.key] || ''}
                              onChange={(e) => setEditData({ ...editData, [f.key]: e.target.value })}
                              onFocus={() => setFocusedFields({ ...focusedFields, [f.key]: true })}
                              onBlur={() => setFocusedFields({ ...focusedFields, [f.key]: false })}
                              className="w-full bg-transparent p-4 outline-none border-none text-brand-primary font-bold placeholder:transparent"
                              placeholder=""
                            />
                          )}
                        </div>
                      ) : (
                        <div className="relative w-full flex items-center">
                          <span className="truncate text-slate-300">
                            {f.type === 'date' 
                              ? (formatDateDisplay(f.value) || '—') 
                              : (f.value !== undefined && f.value !== null ? f.value : '—')}
                          </span>
                          {(f.value === undefined || f.value === null || f.value === '') && f.key !== 'researchCount' && <AlertCircle size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-rose-500/50" />}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex gap-4">
             {isEditing ? (
               <>
                 <button 
                  onClick={handleSaveDetails}
                  disabled={actionLoading}
                  className="flex-1 py-4 bg-brand-primary rounded-2xl text-[10px] font-black text-slate-900 hover:bg-brand-primary/90 transition-all uppercase tracking-widest shadow-lg shadow-brand-primary/20 disabled:opacity-50"
                 >
                    {actionLoading ? 'SAVING...' : 'SAVE CHANGES'}
                 </button>
                 <button 
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({
                      full_name: user.full_name,
                      student_number: user.student_number,
                      course: user.course,
                      section: user.section,
                      year_level: user.year_level,
                      plv_email: user.plv_email,
                      personal_email: user.personal_email || '',
                      gender: user.gender || '',
                      birthdate: user.birthdate || '',
                      address: user.address || '',
                      phone: user.phone || '',
                    });
                    const prefix = user.phone?.match(/^\+\d+/)?.[0] || '+63';
                    setPhonePrefix(prefix);
                  }}
                  className="flex-1 py-4 bg-slate-800 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest"
                 >
                    CANCEL
                 </button>
               </>
             ) : (
               <button 
                disabled={!canModify}
                onClick={() => setIsEditing(true)}
                className={cn(
                  "w-full py-4 bg-[#111827] border border-brand-primary/20 rounded-2xl text-[10px] font-black text-brand-primary hover:bg-brand-primary hover:text-slate-900 transition-all uppercase tracking-widest shadow-xl shadow-brand-primary/5",
                  !canModify && "opacity-50 cursor-not-allowed grayscale"
                )}
               >
                  {isAdminSession && isTargetMasteradmin ? 'EDITING PRIVILEGE RESTRICTED' : 'EDIT DETAILS'}
               </button>
             )}
          </div>

          <div className="glass-card p-6 md:p-10 bg-[#111827] border-none shadow-2xl">
             <div className="flex items-center justify-between mb-6 md:mb-8 pb-4 border-b border-white/5">
                <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                  <Layers size={14} className="text-brand-primary" />
                  RESEARCH PORTFOLIO
                </h3>
                {user.research && user.research.length > 0 && (
                  <span className="text-[8px] md:text-[10px] font-black text-brand-primary bg-brand-primary/10 px-2 md:px-3 py-1 rounded-full uppercase tracking-widest shrink-0">
                    {user.research.length} Entries
                  </span>
                )}
             </div>

             <div className="space-y-3 md:space-y-4">
                {!user.research || user.research.length === 0 ? (
                  <div className="py-20 text-center opacity-20 flex flex-col items-center">
                     <Layers size={64} className="mb-4" />
                     <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Zero entries registered in database</p>
                  </div>
                ) : (
                  user.research.map((res: Research) => (
                    <div key={res.id} className="p-2.5 md:p-6 bg-[#0a0f1e] border border-white/5 rounded-xl md:rounded-2xl group hover:border-brand-primary/30 transition-all flex items-center justify-between gap-3 md:gap-6 shadow-xl relative min-h-[70px] md:min-h-[100px]">
                       {/* Left Side: Research Info */}
                       <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1 md:gap-3 mb-1 md:mb-2">
                             <p className="text-[10px] md:text-sm font-black text-white uppercase truncate font-mono tracking-tight group-hover:text-brand-primary transition-colors max-w-full md:max-w-[400px] shrink-0">{res.title}</p>
                             <div className={cn("items-center gap-1 flex-wrap", openMenuId === res.id ? "hidden sm:flex" : "flex")}>
                               <span className={cn(
                                 "px-1 py-0.5 rounded-md text-[6px] md:text-[8px] font-black uppercase tracking-widest border shrink-0",
                                 res.status === 'accepted' ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" :
                                 res.status === 'rejected' ? "text-rose-400 border-rose-400/20 bg-rose-400/5" :
                                 "text-amber-400 border-amber-400/20 bg-amber-400/5"
                               )}>
                                  {res.status}
                               </span>
                               {!!res.is_featured && (
                                 <div className="p-0.5 bg-brand-primary/20 text-brand-primary rounded-md shrink-0">
                                   <Star size={8} fill="currentColor" />
                                 </div>
                               )}
                               {res.awards && res.awards.length > 0 && (
                                 <div className="flex items-center gap-1">
                                   {res.awards.map(a => (
                                     <button 
                                      key={a.id} 
                                      onClick={() => handleUnawardResearch(res, a.id)}
                                      title={`Remove ${a.title}`} 
                                      className="p-1 bg-amber-500/10 text-amber-500 rounded-md shrink-0 hover:bg-amber-500 hover:text-slate-900 transition-all group/aw"
                                     >
                                       <Award size={8} className="group-hover/aw:scale-110 transition-transform" />
                                     </button>
                                   ))}
                                 </div>
                               )}
                             </div>
                          </div>
                          <div className={cn(
                            "flex flex-wrap items-center gap-y-1 gap-x-2 md:gap-x-4",
                            openMenuId === res.id && "hidden md:flex"
                          )}>
                             <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest truncate max-w-[80px] md:max-w-none">{res.category}</p>
                             <p className="text-[8px] text-slate-600 font-mono italic">{new Date(res.created_at).toLocaleDateString()}</p>
                          </div>
                       </div>

                       {/* Action Section */}
                       <div className="flex items-center gap-2 shrink-0 h-full">
                          {/* Desktop/Landscape View: Always show buttons */}
                          <div className="hidden lg:flex items-center gap-2">
                             <button 
                              disabled={!canModify}
                              onClick={() => window.open(res.pdf_url, '_blank')}
                              title="View Document"
                              className={cn(
                                "p-2.5 bg-slate-800 text-slate-400 rounded-lg hover:text-white hover:bg-slate-700 transition-all border border-white/5",
                                !canModify && "opacity-50 cursor-not-allowed"
                              )}
                            >
                               <Eye size={16} />
                            </button>
                            
                            {res.status === 'accepted' ? (
                              <>
                                <button 
                                  disabled={!canModify}
                                  onClick={() => setAwardTarget(res)}
                                  title="Bestow Award"
                                  className={cn(
                                    "p-2.5 rounded-lg transition-all border",
                                    res.awards && res.awards.length > 0
                                      ? "bg-brand-primary/10 text-brand-primary border-brand-primary/10 hover:bg-brand-primary hover:text-slate-900"
                                      : "bg-slate-800 text-slate-400 border-white/5 hover:bg-slate-700 hover:text-white",
                                    !canModify && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  <Trophy size={16} />
                                </button>

                                <button 
                                  disabled={!canModify}
                                  onClick={() => handleResearchAction(res, 'feature')}
                                  title={res.is_featured ? "Unfeature" : "Feature"}
                                  className={cn(
                                    "p-2.5 rounded-lg transition-all border",
                                    res.is_featured 
                                      ? "bg-amber-500/20 text-amber-500 border-amber-500/30" 
                                      : "bg-slate-800 text-slate-400 border-white/5 hover:bg-slate-700 hover:text-white",
                                    !canModify && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  <Star size={16} />
                                </button>

                                <button 
                                  disabled={!canModify}
                                  onClick={() => navigate(`/admin/research/${res.id}/edit`)}
                                  title="Edit Data"
                                  className={cn(
                                    "p-2.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all border border-blue-500/10",
                                    !canModify && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  <Edit size={16} />
                                </button>

                                <button 
                                  disabled={!canModify}
                                  onClick={() => handleResearchAction(res, 'delete')}
                                  title="Delete Entry"
                                  className={cn(
                                    "p-2.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10",
                                    !canModify && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            ) : res.status === 'rejected' ? (
                              <>
                                <button 
                                  disabled={!canModify}
                                  onClick={() => handleResearchAction(res, 'approve')}
                                  title="Approve"
                                  className={cn(
                                    "p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/10",
                                    !canModify && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button 
                                  disabled={!canModify}
                                  onClick={() => handleResearchAction(res, 'delete')}
                                  title="Delete Entry"
                                  className={cn(
                                    "p-2.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10",
                                    !canModify && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  disabled={!canModify}
                                  onClick={() => handleResearchAction(res, 'approve')}
                                  title="Approve"
                                  className={cn(
                                    "p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/10",
                                    !canModify && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button 
                                  disabled={!canModify}
                                  onClick={() => handleResearchAction(res, 'reject')}
                                  title="Reject"
                                  className={cn(
                                    "p-2.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10",
                                    !canModify && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                          </div>

                          {/* Mobile/Portrait Tablet: Show Three Dots vs Action List */}
                          <div className="lg:hidden flex items-center h-full">
                             {openMenuId === res.id ? (
                               <div className="absolute inset-y-0 right-0 flex items-center gap-1 px-1.5 md:px-6 bg-[#0a0f1e] animate-in slide-in-from-right duration-300 z-10 border-l border-white/5">
                                  <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-hide max-w-[calc(100vw-80px)] sm:max-w-none">
                                    <button 
                                      disabled={!canModify}
                                      onClick={() => window.open(res.pdf_url, '_blank')}
                                      title="View Document"
                                      className="p-1.5 bg-slate-800 text-slate-400 rounded-lg border border-white/5 shrink-0"
                                    >
                                      <Eye size={14} />
                                    </button>

                                    {res.status === 'accepted' ? (
                                      <>
                                        <button 
                                          disabled={!canModify}
                                          onClick={() => { setAwardTarget(res); setOpenMenuId(null); }}
                                          className={cn(
                                            "p-1.5 rounded-lg border shrink-0 transition-all",
                                            res.awards && res.awards.length > 0
                                              ? "bg-brand-primary/10 text-brand-primary border-brand-primary/20"
                                              : "bg-slate-800 text-slate-400 border-white/5"
                                          )}
                                        >
                                          <Trophy size={14} />
                                        </button>
                                        <button 
                                          disabled={!canModify}
                                          onClick={() => { handleResearchAction(res, 'feature'); setOpenMenuId(null); }}
                                          className={cn("p-1.5 rounded-lg border shrink-0", res.is_featured ? "bg-amber-500/20 text-amber-500 border-amber-500/30" : "bg-slate-800 text-slate-400 border-white/5")}
                                        >
                                          <Star size={14} />
                                        </button>
                                        <button 
                                          disabled={!canModify}
                                          onClick={() => { navigate(`/admin/research/${res.id}/edit`); setOpenMenuId(null); }}
                                          className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 shrink-0"
                                        >
                                          <Edit size={14} />
                                        </button>
                                        <button 
                                          disabled={!canModify}
                                          onClick={() => { handleResearchAction(res, 'delete'); setOpenMenuId(null); }}
                                          className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg border border-rose-500/20 shrink-0"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button 
                                          disabled={!canModify}
                                          onClick={() => { handleResearchAction(res, 'approve'); setOpenMenuId(null); }}
                                          className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 shrink-0"
                                        >
                                          <CheckCircle size={14} />
                                        </button>
                                        {res.status === 'pending' && (
                                          <button 
                                            disabled={!canModify}
                                            onClick={() => { handleResearchAction(res, 'reject'); setOpenMenuId(null); }}
                                            className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg border border-rose-500/20 shrink-0"
                                          >
                                            <XCircle size={14} />
                                          </button>
                                        )}
                                        <button 
                                          disabled={!canModify}
                                          onClick={() => { handleResearchAction(res, 'delete'); setOpenMenuId(null); }}
                                          className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg border border-rose-500/20 shrink-0"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </>
                                    )}
                                  </div>

                                  <button 
                                    onClick={() => setOpenMenuId(null)}
                                    className="p-1.5 bg-slate-950 text-slate-500 rounded-lg border border-white/10 shrink-0 ml-1"
                                  >
                                    <XCircle size={14} />
                                  </button>
                               </div>
                             ) : (
                               <button 
                                onClick={() => setOpenMenuId(res.id)}
                                className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white transition-all border border-white/5 active:scale-95 flex items-center justify-center h-8 w-8"
                               >
                                 <MoreVertical size={14} />
                               </button>
                             )}
                          </div>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      </div>

      <ActionModal isOpen={!!activeModal} onClose={() => setActiveModal(null)} type={activeModal || 'DELETE'} onConfirm={handleAction} />

      <SelectionModal 
        isOpen={!!awardTarget}
        onClose={() => setAwardTarget(null)}
        title="BESTOW AWARD"
        options={['REMOVE AWARD', ...awards.map(a => a.title)]}
        onSelect={handleBestowAward}
      />

      {/* Research Decline Modal */}
      {researchToDecline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-8 bg-[#111827] border-none shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
                <XCircle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">REJECT RESEARCH</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Provide a reason for rejection</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">EXPLANATION</label>
              <textarea 
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Why is this research being rejected?"
                className="w-full bg-[#0a0f1e] text-slate-300 p-4 rounded-xl border border-white/5 outline-none focus:border-rose-500/50 transition-all min-h-[120px] text-sm"
              />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={confirmRejectResearch}
                disabled={actionLoading}
                className="flex-1 py-4 bg-rose-500 rounded-2xl text-[10px] font-black text-white hover:bg-rose-600 transition-all uppercase tracking-widest disabled:opacity-50"
              >
                {actionLoading ? 'REJECTING...' : 'CONFIRM REJECT'}
              </button>
              <button 
                onClick={() => {
                  setResearchToDecline(null);
                  setDeclineReason('');
                }}
                className="flex-1 py-4 bg-slate-800 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Research Delete Modal */}
      {researchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-8 bg-[#111827] border-none shadow-2xl text-center">
            <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">DELETE RESEARCH</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-8 px-4">
              You are about to permanently erase this research from the database. This action is irreversible.
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={confirmDeleteResearch}
                disabled={actionLoading}
                className="flex-1 py-4 bg-rose-500 rounded-2xl text-[10px] font-black text-white hover:bg-rose-600 transition-all uppercase tracking-widest shadow-lg shadow-rose-500/20"
              >
                {actionLoading ? 'DELETING...' : 'CONFIRM DELETE'}
              </button>
              <button 
                onClick={() => setResearchToDelete(null)}
                className="flex-1 py-4 bg-slate-800 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest border border-white/5"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Modals */}
      <CountryCodeModal
        isOpen={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        countryCodes={countryCodes}
        phonePrefix={phonePrefix}
        onSelect={(code) => {
          const currentPhone = editData.phone?.replace(/^\+\d+\s?/, '') || '';
          setPhonePrefix(code);
          setEditData({ ...editData, phone: `${code} ${currentPhone}` });
        }}
      />

      <GenderModal
        isOpen={showGenderModal}
        onClose={() => setShowGenderModal(false)}
        value={editData.gender}
        onSelect={(opt) => setEditData({ ...editData, gender: opt })}
      />

      <CourseModal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        options={selectables.course.map((i: any) => i.value)}
        value={editData.course}
        onSelect={(val) => {
          setEditData({ ...editData, course: val });
          setShowCourseModal(false);
        }}
      />

      <SectionModal
        isOpen={showSectionModal}
        onClose={() => setShowSectionModal(false)}
        options={selectables.section.map((i: any) => i.value)}
        value={editData.section}
        onSelect={(val) => {
          setEditData({ ...editData, section: val });
          setShowSectionModal(false);
        }}
      />

      <YearLevelModal
        isOpen={showYearModal}
        onClose={() => setShowYearModal(false)}
        options={selectables.year_level.map((i: any) => i.value)}
        value={editData.year_level}
        onSelect={(val) => {
          setEditData({ ...editData, year_level: val });
          setShowYearModal(false);
        }}
      />

      <DatePickerModal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
        title="BIRTH DATE SELECTION"
        value={editData.birthdate || ''}
        onChange={(v) => setEditData({ ...editData, birthdate: v })}
      />

      <style>{`
        .glass-card {
          background: rgba(17, 24, 39, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
        }
      `}</style>
    </div>
  );
};
