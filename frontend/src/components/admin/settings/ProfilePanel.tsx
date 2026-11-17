import React, { useState } from 'react';
import { User as UserIcon, Edit, CheckCircle, AlertCircle, ChevronDown, Calendar as CalendarIcon, Shield } from 'lucide-react';
import { api, User as UserType } from '../../../lib/api';
import { cn } from '../../../lib/utils';
import { LoadingSpinner } from '../../pages/Common';
import { SelectionModal } from '../../shared/Shared';

interface ProfilePanelProps {
  user: UserType | null;
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  loading: boolean;
  setLoading: (l: boolean) => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
  refreshUser: () => Promise<void>;
  formatDateDisplay: (d: string) => string;
  phonePrefix: string;
  setPhonePrefix: (p: string) => void;
  countryCodes: Array<{ code: string; country: string; flag: string }>;
  setShowCountryModal: (s: boolean) => void;
  showCountryModal: boolean;
  setShowGenderModal: (s: boolean) => void;
  showGenderModal: boolean;
  setShowDateModal: (s: boolean) => void;
  showDateModal: boolean;
  setCalendarDate: (d: Date) => void;
  handleUpdatePassword: () => Promise<void>;
  handleSaveProfile: () => Promise<void>;
}

export const ProfilePanel = ({ 
  user, 
  form, 
  setForm, 
  loading, 
  setLoading, 
  showToast, 
  refreshUser,
  formatDateDisplay,
  phonePrefix,
  setPhonePrefix,
  countryCodes,
  setShowCountryModal,
  showCountryModal,
  setShowGenderModal,
  showGenderModal,
  setShowDateModal,
  showDateModal,
  setCalendarDate,
  handleUpdatePassword,
  handleSaveProfile
}: ProfilePanelProps) => {
  const [focusedFields, setFocusedFields] = useState<Record<string, boolean>>({});

  const renderFloatingLabel = (label: string, value: any, isFocused: boolean) => {
    const isActive = (value !== undefined && value !== null && value !== "" && value !== "—") || isFocused;
    return (
      <label
        style={{
          top: isActive ? "0px" : "50%",
          transform: `translateY(-50%) scale(${isActive ? 0.8 : 1})`,
          transition: "all 0.2s cubic-bezier(0.23, 1, 0.32, 1)"
        }}
        className={cn(
          "absolute left-4 pointer-events-none select-none uppercase tracking-[0.3em] origin-left z-10 px-2",
          isActive 
            ? "text-brand-primary bg-[#0a0f1e] font-black text-[9px]" 
            : "text-slate-500 font-bold text-[9px]"
        )}
      >
        {label}
      </label>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Avatar Card */}
        <div className="xl:col-span-1">
          <div className="glass-card bg-[#0a0f1e] p-8 h-full flex flex-col items-center justify-center border border-white/5 text-center group">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full bg-slate-900 border-2 border-white/5 flex items-center justify-center p-1 relative overflow-hidden group/avatar shadow-2xl transition-all duration-500 group-hover:border-brand-primary/30">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} className="w-full h-full object-cover rounded-full" alt="" />
                ) : (
                  <UserIcon size={40} className="text-slate-800" />
                )}
                <input 
                  type="file" 
                  id="avatar-upload" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !user) return;
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      const base64 = reader.result as string;
                      setLoading(true);
                      try {
                        await api.updateUser(user.id, { avatar_url: base64 });
                        await refreshUser();
                        showToast('Profile picture updated');
                      } finally {
                        setLoading(false);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </div>
              <label 
                htmlFor="avatar-upload"
                className="absolute -bottom-2 -right-2 bg-brand-primary text-slate-900 p-2 rounded-xl shadow-lg border border-white/20 cursor-pointer hover:scale-110 active:scale-95 transition-all z-10"
              >
                 <Edit size={14} />
              </label>
            </div>
            <h4 className="text-xl font-black text-white uppercase tracking-tighter">{user?.full_name}</h4>
            <p className="text-[10px] text-brand-primary font-bold uppercase tracking-widest mt-2 px-4 py-1 bg-brand-primary/10 rounded-full inline-block">
              {user?.role === 'masteradmin' ? 'MASTER ADMINISTRATOR' : 'ADMINISTRATOR'}
            </p>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-4 opacity-50">
              UID: {user?.id}
            </p>
          </div>
        </div>

        {/* Basic Info & Password Card */}
        <div className="xl:col-span-2 space-y-8">
          {/* Basic Info */}
          <div className="glass-card bg-[#0a0f1e] p-8 border border-white/5">
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl shrink-0">
                <UserIcon size={18} />
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-widest break-words flex-1 min-w-[120px]">Identity Configuration</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="relative pt-2">
                <div className="relative bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
                  {renderFloatingLabel("Full Legal Name", form.full_name, !!focusedFields['full_name'])}
                  <input 
                    value={form.full_name} 
                    onChange={e => setForm((p: any) => ({ ...p, full_name: e.target.value }))}
                    onFocus={() => setFocusedFields({ ...focusedFields, full_name: true })}
                    onBlur={() => setFocusedFields({ ...focusedFields, full_name: false })}
                    className="w-full bg-transparent text-white p-4 outline-none font-bold text-xs placeholder:transparent" 
                    placeholder=""
                  />
                </div>
              </div>
              <div className="relative pt-2">
                <div className="relative bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
                  {renderFloatingLabel("Primary Email", form.plv_email, !!focusedFields['plv_email'])}
                  <input 
                    value={form.plv_email} 
                    onChange={e => setForm((p: any) => ({ ...p, plv_email: e.target.value }))}
                    onFocus={() => setFocusedFields({ ...focusedFields, plv_email: true })}
                    onBlur={() => setFocusedFields({ ...focusedFields, plv_email: false })}
                    className="w-full bg-transparent text-white p-4 outline-none font-bold text-xs placeholder:transparent" 
                    placeholder=""
                  />
                </div>
              </div>
              <div className="flex gap-2 w-full pt-2">
                <div className="relative shrink-0">
                  <button 
                    type="button"
                    onClick={() => setShowCountryModal(true)}
                    className="h-[46px] md:h-[50px] px-4 flex items-center gap-2 group/prefix whitespace-nowrap bg-[#111827] border border-white/5 rounded-2xl hover:border-brand-primary/50 transition-all font-mono text-xs text-white font-bold"
                  >
                    <span>{phonePrefix}</span>
                    <ChevronDown size={12} className="text-white/40 group-hover/prefix:text-white transition-colors" />
                  </button>
                </div>
                <div className="relative flex-1 bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
                  {renderFloatingLabel("Phone Contact", form.phone, !!focusedFields['phone'])}
                  <input 
                    value={form.phone.replace(phonePrefix, '').trim()} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setForm((p: any) => ({ ...p, phone: `${phonePrefix} ${val}` }));
                    }}
                    onFocus={() => setFocusedFields({ ...focusedFields, phone: true })}
                    onBlur={() => setFocusedFields({ ...focusedFields, phone: false })}
                    className="w-full bg-transparent p-4 outline-none font-bold text-xs font-mono placeholder:transparent" 
                    placeholder=""
                  />
                </div>
              </div>
              <div className="relative pt-2">
                <div className="relative bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
                  {renderFloatingLabel("Gender Identity", form.gender, showGenderModal)}
                  <button 
                    type="button"
                    onClick={() => setShowGenderModal(true)}
                    className="w-full bg-transparent p-4 pr-10 rounded-2xl border-none text-left font-bold flex items-center justify-between group/select relative"
                  >
                    <span className={cn(
                      "truncate text-xs",
                      form.gender ? "text-white uppercase" : "text-slate-500 font-black tracking-widest text-[10px]"
                    )}>
                      {form.gender || '\u00A0'}
                    </span>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <ChevronDown size={14} className="text-white/40 transition-colors" />
                    </div>
                  </button>
                </div>
              </div>
              <div className="relative pt-2">
                <div className="relative bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
                  {renderFloatingLabel("Date of Birth", form.birthdate, showDateModal)}
                  <button 
                    type="button"
                    onClick={() => {
                      if (form.birthdate) {
                        const d = new Date(form.birthdate);
                        if (!isNaN(d.getTime())) setCalendarDate(d);
                      }
                      setShowDateModal(true);
                    }}
                    className="w-full bg-transparent p-4 pr-10 rounded-2xl border-none text-left font-bold flex items-center justify-between group/date relative"
                  >
                    <span className={cn(
                      "truncate text-xs font-mono font-bold", 
                      form.birthdate ? "text-white" : "text-slate-500 font-black tracking-widest text-[10px] font-sans"
                    )}>
                      {formatDateDisplay(form.birthdate) || '\u00A0'}
                    </span>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <ChevronDown size={14} className="text-white/40 transition-colors" />
                    </div>
                  </button>
                </div>
              </div>
              <div className="relative pt-2">
                <div className="relative bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
                  {renderFloatingLabel("Residential Locale", form.address, !!focusedFields['address'])}
                  <input 
                    value={form.address} 
                    onChange={e => setForm((p: any) => ({ ...p, address: e.target.value }))}
                    onFocus={() => setFocusedFields({ ...focusedFields, address: true })}
                    onBlur={() => setFocusedFields({ ...focusedFields, address: false })}
                    className="w-full bg-transparent text-white p-4 outline-none font-bold text-xs placeholder:transparent" 
                    placeholder=""
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleSaveProfile}
                disabled={loading}
                className="btn-primary w-full md:w-auto px-12 py-4 text-[10px] font-black tracking-widest uppercase shadow-2xl shadow-brand-primary/20"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Password Section */}
          <div className="glass-card bg-[#0a0f1e] p-8 border border-white/5">
             <div className="flex items-center gap-3 mb-8">
               <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl">
                 <Shield size={18} />
               </div>
               <h4 className="text-xs font-black text-white uppercase tracking-widest underline underline-offset-8 decoration-brand-primary/30">Account Security</h4>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="relative pt-2">
                 <div className="relative bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
                   {renderFloatingLabel("Current Key", form.currentPassword, !!focusedFields['currentPassword'])}
                   <input 
                     type="password"
                     value={form.currentPassword} 
                     onChange={e => setForm((p: any) => ({ ...p, currentPassword: e.target.value }))}
                     onFocus={() => setFocusedFields({ ...focusedFields, currentPassword: true })}
                     onBlur={() => setFocusedFields({ ...focusedFields, currentPassword: false })}
                     className="w-full bg-transparent text-white p-4 outline-none font-bold text-xs placeholder:transparent" 
                     placeholder=""
                   />
                 </div>
               </div>
               <div className="relative pt-2">
                 <div className="relative bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
                   {renderFloatingLabel("New Secret Key", form.newPassword, !!focusedFields['newPassword'])}
                   <input 
                     type="password"
                     value={form.newPassword} 
                     onChange={e => setForm((p: any) => ({ ...p, newPassword: e.target.value }))}
                     onFocus={() => setFocusedFields({ ...focusedFields, newPassword: true })}
                     onBlur={() => setFocusedFields({ ...focusedFields, newPassword: false })}
                     className="w-full bg-transparent text-white p-4 outline-none font-bold text-xs placeholder:transparent" 
                     placeholder=""
                   />
                 </div>
               </div>
               <div className="relative pt-2">
                 <div className="relative bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
                   {renderFloatingLabel("Confirm Key", form.confirmPassword, !!focusedFields['confirmPassword'])}
                   <input 
                     type="password"
                     value={form.confirmPassword} 
                     onChange={e => setForm((p: any) => ({ ...p, confirmPassword: e.target.value }))}
                     onFocus={() => setFocusedFields({ ...focusedFields, confirmPassword: true })}
                     onBlur={() => setFocusedFields({ ...focusedFields, confirmPassword: false })}
                     className="w-full bg-transparent text-white p-4 outline-none font-bold text-xs placeholder:transparent" 
                     placeholder=""
                   />
                 </div>
               </div>
             </div>

             <div className="mt-8 flex justify-end">
               <button 
                 onClick={handleUpdatePassword}
                 disabled={loading || !form.currentPassword || !form.newPassword}
                 className="btn-primary w-full md:w-auto px-12 py-4 text-[10px] font-black tracking-widest uppercase"
               >
                 {loading ? 'Updating...' : 'Update'}
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
