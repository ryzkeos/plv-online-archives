import React, { useState } from 'react';
import { Globe, Plus } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface WebsiteConfigPanelProps {
  savedLogoUrl: string;
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  loading: boolean;
  showToast: (m: string, t?: 'success' | 'error') => void;
  handleSaveWebsite: () => Promise<void>;
}

export const WebsiteConfigPanel = ({
  savedLogoUrl,
  form,
  setForm,
  loading,
  showToast,
  handleSaveWebsite,
}: WebsiteConfigPanelProps) => {
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
    <div className="space-y-12">
      {/* Branding & Logo */}
      <section>
        <div className="flex items-center gap-3 mb-8">
           <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
           <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Identity & Branding</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative pt-2">
            <div className="relative bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
              {renderFloatingLabel("Application Name", form.appName, !!focusedFields['appName'])}
              <input 
                value={form.appName}
                onChange={e => setForm((p: any) => ({ ...p, appName: e.target.value }))}
                onFocus={() => setFocusedFields({ ...focusedFields, appName: true })}
                onBlur={() => setFocusedFields({ ...focusedFields, appName: false })}
                className="w-full bg-transparent text-white p-4 outline-none font-bold text-xs placeholder:transparent" 
                placeholder=""
              />
            </div>
          </div>
          <div className="relative pt-2">
            <div className="relative bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
              {renderFloatingLabel("Site Tagline", form.tagline, !!focusedFields['tagline'])}
              <input 
                value={form.tagline}
                onChange={e => setForm((p: any) => ({ ...p, tagline: e.target.value }))}
                onFocus={() => setFocusedFields({ ...focusedFields, tagline: true })}
                onBlur={() => setFocusedFields({ ...focusedFields, tagline: false })}
                className="w-full bg-transparent text-white p-4 outline-none font-bold text-xs placeholder:transparent" 
                placeholder=""
              />
            </div>
          </div>
          <div className="md:col-span-2 space-y-4">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Platform Logo</label>
             <div className="relative group overflow-hidden rounded-2xl bg-[#0a0f1e] border-2 border-dashed border-white/10 p-10 flex flex-col items-center justify-center gap-4 hover:border-brand-primary/30 transition-all">
                <div className="w-24 h-24 bg-[#111827] rounded-2xl flex items-center justify-center border border-white/5 overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500">
                   {form.logoUrl ? (
                     <img src={form.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                   ) : (
                     <Globe size={32} className="text-slate-800" />
                   )}
                </div>
                
                <div className="text-center space-y-2">
                   <input 
                    type="file" 
                    id="logo-upload" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64 = reader.result as string;
                        setForm((p: any) => ({ ...p, logoUrl: base64 }));
                      };
                      reader.readAsDataURL(file);
                    }}
                   />
                   <label htmlFor="logo-upload" className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 rounded-xl text-[10px] font-black text-slate-300 uppercase hover:bg-brand-primary hover:text-slate-900 transition-all cursor-pointer">
                     <Plus size={14} />
                     Change Logo
                   </label>
                   {form.logoUrl !== savedLogoUrl && (
                     <p className="text-[8px] text-amber-400 uppercase font-black tracking-widest opacity-80">
                       Unsaved — click Save to apply
                     </p>
                   )}
                   <p className="text-[8px] text-slate-600 uppercase font-black tracking-widest mt-4 opacity-50">SVG or transparent PNG (max 512kb)</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-8">
           <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
           <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Brand Aesthetics</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative pt-2">
            <div className="relative bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
              {renderFloatingLabel("Primary Brand Color", form.brand_primary, !!focusedFields['brand_primary'])}
              <div className="flex items-center gap-4 p-2">
                <div 
                  className="w-10 h-10 rounded-xl border border-white/10 shadow-lg shrink-0" 
                  style={{ backgroundColor: form.brand_primary }}
                />
                <input 
                  type="text"
                  value={form.brand_primary}
                  onChange={e => setForm((p: any) => ({ ...p, brand_primary: e.target.value }))}
                  onFocus={() => setFocusedFields({ ...focusedFields, brand_primary: true })}
                  onBlur={() => setFocusedFields({ ...focusedFields, brand_primary: false })}
                  className="flex-1 bg-transparent text-white outline-none font-mono text-xs uppercase" 
                  placeholder=""
                />
                <input 
                  type="color"
                  value={form.brand_primary}
                  onChange={e => setForm((p: any) => ({ ...p, brand_primary: e.target.value }))}
                  className="w-8 h-8 bg-transparent border-none cursor-pointer shrink-0"
                />
              </div>
            </div>
          </div>
          <div className="relative pt-2">
            <div className="relative bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
              {renderFloatingLabel("Secondary Brand Color", form.brand_secondary, !!focusedFields['brand_secondary'])}
              <div className="flex items-center gap-4 p-2">
                <div 
                  className="w-10 h-10 rounded-xl border border-white/10 shadow-lg shrink-0" 
                  style={{ backgroundColor: form.brand_secondary }}
                />
                <input 
                  type="text"
                  value={form.brand_secondary}
                  onChange={e => setForm((p: any) => ({ ...p, brand_secondary: e.target.value }))}
                  onFocus={() => setFocusedFields({ ...focusedFields, brand_secondary: true })}
                  onBlur={() => setFocusedFields({ ...focusedFields, brand_secondary: false })}
                  className="flex-1 bg-transparent text-white outline-none font-mono text-xs uppercase" 
                  placeholder=""
                />
                <input 
                  type="color"
                  value={form.brand_secondary}
                  onChange={e => setForm((p: any) => ({ ...p, brand_secondary: e.target.value }))}
                  className="w-8 h-8 bg-transparent border-none cursor-pointer shrink-0"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Support */}
      <section>
        <div className="flex items-center gap-3 mb-8">
           <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
           <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Contact & Support Info</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative pt-2">
            <div className="relative bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
              {renderFloatingLabel("Support Email", form.contact_email, !!focusedFields['contact_email'])}
              <input 
                value={form.contact_email}
                onChange={e => setForm((p: any) => ({ ...p, contact_email: e.target.value }))}
                onFocus={() => setFocusedFields({ ...focusedFields, contact_email: true })}
                onBlur={() => setFocusedFields({ ...focusedFields, contact_email: false })}
                className="w-full bg-transparent text-white p-4 outline-none font-bold text-xs placeholder:transparent" 
                placeholder=""
              />
            </div>
          </div>
          <div className="relative pt-2">
            <div className="relative bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
              {renderFloatingLabel("Support Phone", form.contact_phone, !!focusedFields['contact_phone'])}
              <input 
                value={form.contact_phone}
                onChange={e => setForm((p: any) => ({ ...p, contact_phone: e.target.value }))}
                onFocus={() => setFocusedFields({ ...focusedFields, contact_phone: true })}
                onBlur={() => setFocusedFields({ ...focusedFields, contact_phone: false })}
                className="w-full bg-transparent text-white p-4 outline-none font-bold text-xs placeholder:transparent" 
                placeholder=""
              />
            </div>
          </div>
          <div className="md:col-span-2 relative pt-2">
            <div className="relative bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
              {renderFloatingLabel("Physical Office Address", form.contact_address, !!focusedFields['contact_address'])}
              <input 
                value={form.contact_address}
                onChange={e => setForm((p: any) => ({ ...p, contact_address: e.target.value }))}
                onFocus={() => setFocusedFields({ ...focusedFields, contact_address: true })}
                onBlur={() => setFocusedFields({ ...focusedFields, contact_address: false })}
                className="w-full bg-transparent text-white p-4 outline-none font-bold text-xs placeholder:transparent" 
                placeholder=""
              />
            </div>
          </div>
        </div>
      </section>

      {/* Social & Content */}
      <section>
        <div className="flex items-center gap-3 mb-8">
           <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
           <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Social Media & Footer</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative pt-2">
            <div className="relative bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
              {renderFloatingLabel("Facebook URL", form.social_facebook, !!focusedFields['social_facebook'])}
              <input 
                value={form.social_facebook}
                onChange={e => setForm((p: any) => ({ ...p, social_facebook: e.target.value }))}
                onFocus={() => setFocusedFields({ ...focusedFields, social_facebook: true })}
                onBlur={() => setFocusedFields({ ...focusedFields, social_facebook: false })}
                className="w-full bg-transparent text-white p-4 outline-none font-bold text-xs placeholder:transparent" 
                placeholder=""
              />
            </div>
          </div>
          <div className="relative pt-2">
            <div className="relative bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
              {renderFloatingLabel("Twitter URL", form.social_twitter, !!focusedFields['social_twitter'])}
              <input 
                value={form.social_twitter}
                onChange={e => setForm((p: any) => ({ ...p, social_twitter: e.target.value }))}
                onFocus={() => setFocusedFields({ ...focusedFields, social_twitter: true })}
                onBlur={() => setFocusedFields({ ...focusedFields, social_twitter: false })}
                className="w-full bg-transparent text-white p-4 outline-none font-bold text-xs placeholder:transparent" 
                placeholder=""
              />
            </div>
          </div>
          <div className="md:col-span-2 relative pt-2">
            <div className="relative bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
              {renderFloatingLabel("About Platform (Short Description)", form.about_us, !!focusedFields['about_us'])}
              <textarea 
                value={form.about_us}
                onChange={e => setForm((p: any) => ({ ...p, about_us: e.target.value }))}
                onFocus={() => setFocusedFields({ ...focusedFields, about_us: true })}
                onBlur={() => setFocusedFields({ ...focusedFields, about_us: false })}
                className="w-full bg-transparent text-white p-4 outline-none font-bold h-32 text-xs placeholder:transparent resize-none" 
                placeholder=""
              />
            </div>
          </div>
          <div className="md:col-span-2 relative pt-2">
            <div className="relative bg-[#111827] rounded-2xl border border-white/5 overflow-visible shadow-inner">
              {renderFloatingLabel("Copyright / Footer Text", form.footer_text, !!focusedFields['footer_text'])}
              <input 
                value={form.footer_text}
                onChange={e => setForm((p: any) => ({ ...p, footer_text: e.target.value }))}
                onFocus={() => setFocusedFields({ ...focusedFields, footer_text: true })}
                onBlur={() => setFocusedFields({ ...focusedFields, footer_text: false })}
                className="w-full bg-transparent text-white p-4 outline-none font-bold text-xs placeholder:transparent" 
                placeholder=""
              />
            </div>
          </div>
        </div>
      </section>

      {/* System Toggles */}
      <section className="p-8 bg-brand-primary/5 rounded-3xl border border-brand-primary/10">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">Maintenance Mode</h4>
               <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Block public access to the platform</p>
            </div>
            <button 
              onClick={() => setForm((p: any) => ({ ...p, maintenance_mode: p.maintenance_mode === 'true' ? 'false' : 'true' }))}
              className={cn(
                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                form.maintenance_mode === 'true' 
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" 
                  : "bg-slate-800 text-slate-400 group-hover:text-white"
              )}
            >
              {form.maintenance_mode === 'true' ? 'ACTIVE' : 'INACTIVE'}
            </button>
         </div>
      </section>

      <div className="pt-8 border-t border-white/5 flex justify-end">
        <button 
          disabled={loading}
          onClick={handleSaveWebsite}
          className="whitespace-nowrap truncate max-w-full px-12 py-5 bg-brand-primary text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/20 hover:brightness-110 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};
