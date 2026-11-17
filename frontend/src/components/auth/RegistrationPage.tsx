import React, { useState, useEffect } from 'react';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { CourseModal, SectionModal, YearLevelModal } from '../shared/Shared';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';

export const RegistrationPage = ({ onToggle }: { onToggle: () => void }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    section: '',
    year_level: '',
    course: '',
    student_number: '',
    personal_email: '',
    plv_email: '',
    password: '',
    confirm_password: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sectionModal, setSectionModal] = useState(false);
  const [yearModal, setYearModal] = useState(false);
  const [courseModal, setCourseModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedFields, setFocusedFields] = useState<Record<string, boolean>>({});
  
  const [selectibles, setSelectibles] = useState<any>({
    course: [],
    section: [],
    year_level: []
  });

  const navigate = useNavigate();

  useEffect(() => {
    api.getPublicSelectibles().then(data => {
      setSelectibles(data);
    }).catch(err => console.error('Failed to fetch selectibles', err));
  }, []);

  const setFocused = (field: string, isFocused: boolean) => {
    setFocusedFields(prev => ({ ...prev, [field]: isFocused }));
  };

  const validate = (data = formData): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (data.personal_email && !data.personal_email.toLowerCase().endsWith('@gmail.com'))
      errors.personal_email = 'Must be a @gmail.com address';
    if (data.plv_email && !data.plv_email.toLowerCase().endsWith('@plv.edu.ph'))
      errors.plv_email = 'Must be a @plv.edu.ph address';
    if (data.password && (data.password.length < 8 || !/[A-Z]/.test(data.password) || !/[0-9]/.test(data.password)))
      errors.password = 'Min 8 chars, 1 uppercase, 1 number';
    if (data.confirm_password && data.confirm_password !== data.password)
      errors.confirm_password = "Passwords don't match";
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    if (formData.password !== formData.confirm_password)
      errors.confirm_password = "Passwords don't match";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setLoading(true);
    try {
      await api.register(formData);
      navigate(`/otp?email=${formData.personal_email}`);
    } catch (err: any) {
      if (err.field) setFieldErrors({ [err.field]: err.error });
      else setFieldErrors({ global: err.error || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  };

  const handleBlur = (field: string) => {
    setFocused(field, false);
    const errors = validate();
    setFieldErrors(prev => {
      const e = { ...prev };
      if (errors[field]) e[field] = errors[field];
      else delete e[field];
      return e;
    });
  };

  // Helper to format options for the selection modals
  const getOptions = (category: string) => {
    const items = selectibles[category] || [];
    if (category === 'section') {
      // Return only the number part if it contains the course prefix
      return items.map((i: any) => {
        const val = i.value.toString();
        // If it looks like "BSIT 1", extract the "1"
        const parts = val.split(' ');
        return parts.length > 1 ? parts[parts.length - 1] : val;
      });
    }
    return items.map((i: any) => i.value);
  };

  const renderFloatingLabel = (label: string, field: keyof typeof formData, isForcedFocus?: boolean) => {
    const value = formData[field];
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
          "absolute left-4 pointer-events-none select-none transition-colors duration-200 uppercase tracking-[0.2em] origin-left",
          (value || isFocused) 
            ? "text-brand-primary bg-[#111827] px-2 font-black text-[10px]" 
            : "text-slate-500 font-bold text-[9px] md:text-[10px]"
        )}
      >
        {label}
      </motion.label>
    );
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#0a0f1e] p-4 md:p-8 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="auth-card w-full max-w-[400px] p-6 md:p-10 flex flex-col justify-center my-auto shrink-0 transition-all min-h-[650px]"
      >
        <h2 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase mb-2 md:mb-4 text-center">Sign up</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-7 mt-6 md:mt-8">
          <div className="relative">
            <input 
              className="input-field py-3 md:py-4 placeholder:text-transparent" 
              placeholder="" 
              value={formData.full_name}
              onChange={(e) => updateField('full_name', e.target.value)}
              onFocus={() => setFocused('full_name', true)}
              onBlur={() => setFocused('full_name', false)}
              required
            />
            {renderFloatingLabel('Full Name', 'full_name')}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <button 
                type="button"
                onClick={() => setCourseModal(true)}
                className="input-field py-3 md:py-4 flex items-center justify-between group relative pr-7 md:pr-10"
              >
                <span className="text-white font-medium text-sm truncate text-left">
                  {formData.course || '\u00A0'}
                </span>
                <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2">
                  <ChevronDown size={10} className="text-slate-600 group-hover:text-brand-primary" />
                </div>
              </button>
              {renderFloatingLabel('Course', 'course', courseModal)}
            </div>
            <div className="relative">
              <button 
                type="button"
                onClick={() => setYearModal(true)}
                className="input-field py-3 md:py-4 flex items-center justify-between group relative pr-7 md:pr-10"
              >
                <span className="text-white font-medium text-sm truncate text-left">
                  {formData.year_level || '\u00A0'}
                </span>
                <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2">
                  <ChevronDown size={10} className="text-slate-600 group-hover:text-brand-primary" />
                </div>
              </button>
              {renderFloatingLabel('Year', 'year_level', yearModal)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <button 
                type="button"
                onClick={() => setSectionModal(true)}
                className="input-field py-3 md:py-4 flex items-center justify-between group relative pr-7 md:pr-10"
              >
                <span className="text-white font-medium text-sm truncate text-left">
                  {formData.section || '\u00A0'}
                </span>
                <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2">
                  <ChevronDown size={10} className="text-slate-600 group-hover:text-brand-primary" />
                </div>
              </button>
              {renderFloatingLabel('Section', 'section', sectionModal)}
            </div>
            <div className="relative">
            <input 
              className="input-field py-3 md:py-4 placeholder:text-transparent" 
              placeholder="" 
              value={formData.student_number}
                onChange={(e) => {
                    let val = e.target.value.replace(/[^\d]/g, '').slice(0, 6);
                    if (val.length > 2) val = val.slice(0, 2) + '-' + val.slice(2);
                    updateField('student_number', val);
                 }}
                onFocus={() => setFocused('student_number', true)}
                onBlur={() => setFocused('student_number', false)}
                required
              />
              {renderFloatingLabel('Student ID', 'student_number')}
            </div>
          </div>

          <div className="relative">
            <input 
              className={cn("input-field py-3 md:py-4 placeholder:text-transparent", fieldErrors.personal_email && "border-rose-500/50")} 
              placeholder="" 
              value={formData.personal_email}
              onChange={(e) => updateField('personal_email', e.target.value)}
              onFocus={() => setFocused('personal_email', true)}
              onBlur={() => handleBlur('personal_email')}
              required
            />
            {renderFloatingLabel('Personal Email', 'personal_email')}
            {fieldErrors.personal_email && <p className="text-rose-400 text-[8px] font-black uppercase tracking-widest mt-1">{fieldErrors.personal_email}</p>}
          </div>

          <div className="relative">
            <input 
              className={cn("input-field py-3 md:py-4 placeholder:text-transparent", fieldErrors.plv_email && "border-rose-500/50")} 
              placeholder="" 
              value={formData.plv_email}
              onChange={(e) => updateField('plv_email', e.target.value)}
              onFocus={() => setFocused('plv_email', true)}
              onBlur={() => handleBlur('plv_email')}
              required
            />
            {renderFloatingLabel('Institutional Email', 'plv_email')}
            {fieldErrors.plv_email && <p className="text-rose-400 text-[8px] font-black uppercase tracking-widest mt-1">{fieldErrors.plv_email}</p>}
          </div>

          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              className={cn("input-field py-3 md:py-4 pr-12 placeholder:text-transparent", fieldErrors.password && "border-rose-500/50")} 
              placeholder="" 
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              onFocus={() => setFocused('password', true)}
              onBlur={() => handleBlur('password')}
              required
            />
            {renderFloatingLabel('Password', 'password')}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-primary transition-colors"
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            {fieldErrors.password && <p className="text-rose-400 text-[8px] font-black uppercase tracking-widest mt-1">{fieldErrors.password}</p>}
          </div>

          <div className="relative">
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              className={cn("input-field py-3 md:py-4 pr-12 placeholder:text-transparent", fieldErrors.confirm_password && "border-rose-500/50")} 
              placeholder="" 
              value={formData.confirm_password}
              onChange={(e) => updateField('confirm_password', e.target.value)}
              onFocus={() => setFocused('confirm_password', true)}
              onBlur={() => handleBlur('confirm_password')}
              required
            />
            {renderFloatingLabel('Confirm Password', 'confirm_password')}
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-primary transition-colors"
            >
              {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            {fieldErrors.confirm_password && <p className="text-rose-400 text-[8px] font-black uppercase tracking-widest mt-1">{fieldErrors.confirm_password}</p>}
          </div>

          {fieldErrors.global && (
            <p className="text-rose-400 text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-center leading-tight">{fieldErrors.global}</p>
          )}

          <div className="pt-2 md:pt-4 space-y-4">
            <button disabled={loading} className="btn-primary w-full py-2.5 md:py-3 text-[10px] md:text-xs">
              {loading ? 'Registering...' : 'Register'}
            </button>
            <div className="text-center">
              <button onClick={onToggle} type="button" className="text-[9px] md:text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] hover:brightness-125 transition-all">Login</button>
            </div>
          </div>
        </form>
      </motion.div>


      <CourseModal
        isOpen={courseModal}
        onClose={() => setCourseModal(false)}
        options={getOptions('course')}
        value={formData.course}
        onSelect={(val) => updateField('course', val)}
      />

      <SectionModal
        isOpen={sectionModal}
        onClose={() => setSectionModal(false)}
        options={getOptions('section')}
        value={formData.section}
        onSelect={(val) => updateField('section', val)}
      />

      <YearLevelModal
        isOpen={yearModal}
        onClose={() => setYearModal(false)}
        options={getOptions('year_level')}
        value={formData.year_level}
        onSelect={(val) => updateField('year_level', val)}
      />
    </div>
  );
};

export default RegistrationPage;
