import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  hideCloseButton?: boolean;
}

export const Modal = ({ isOpen, onClose, title, children, footer, hideCloseButton = false }: ModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md overflow-hidden glass-card shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">{title}</h3>
              {!hideCloseButton && (
                <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>
            <div className="p-6 text-slate-200">
              {children}
            </div>
            {footer && (
              <div className="flex items-center justify-end gap-3 p-4 bg-black/20 border-t border-white/10">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  title,
  message,
  onConfirm,
  confirmLabel = 'OK',
  cancelLabel = 'CANCEL',
  children
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string;
  message: string;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  children?: React.ReactNode;
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6 text-center">
        <p className="text-sm font-bold text-white">{message}</p>
        {children}
        <div className="flex gap-4 pt-2">
          <button onClick={onClose} className="flex-1 btn-primary bg-slate-700 shadow-none text-white text-[10px]">{cancelLabel}</button>
          <button onClick={onConfirm} className="flex-1 btn-primary bg-brand-primary shadow-brand-primary/20 text-slate-900 text-[10px]">{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
};

export const LogoutConfirmModal = ({
  isOpen,
  onClose,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SIGN OUT" hideCloseButton>
      <div className="space-y-6 text-center">
        <div className="py-4">
          <p className="text-sm font-medium text-white uppercase tracking-tight">ARE YOU SURE YOU WANT TO SIGN OUT?</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-white/10 transition-all hover:bg-white/5"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-600 text-white hover:brightness-110 transition-all"
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const SelectionModal = ({ 
  isOpen, 
  onClose, 
  title, 
  options, 
  onSelect,
  selectedValue
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  options: string[]; 
  onSelect: (val: string) => void;
  selectedValue?: string;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[21000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-card w-full max-w-sm p-8 shadow-2xl"
          >
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">{title}</h3>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { onSelect(opt); onClose(); }}
                  className={cn(
                    "w-full p-4 text-left rounded-xl transition-all border border-white/5 text-xs font-bold uppercase tracking-widest",
                    selectedValue === opt ? "bg-brand-primary/20 border-brand-primary/50 text-brand-primary" : "bg-brand-background text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-full mt-6 py-4 bg-slate-800 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest"
            >
              CANCEL
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

export const CountryCodeModal = ({
  isOpen,
  onClose,
  countryCodes,
  phonePrefix,
  onSelect
}: {
  isOpen: boolean;
  onClose: () => void;
  countryCodes: CountryCode[];
  phonePrefix: string;
  onSelect: (code: string) => void;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[21000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-card w-full max-w-sm p-8 shadow-2xl"
          >
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">SELECT COUNTRY CODE</h3>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
              {countryCodes.map(c => (
                <button
                  key={c.code}
                  onClick={() => { onSelect(c.code); onClose(); }}
                  className={cn(
                    "w-full p-4 flex items-center justify-between rounded-xl transition-all border border-white/5",
                    phonePrefix === c.code ? "bg-brand-primary/20 border-brand-primary/50 text-brand-primary" : "bg-brand-background text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{c.flag}</span>
                    <span className="text-xs font-bold uppercase tracking-widest">{c.country}</span>
                  </div>
                  <span className="font-mono font-black">{c.code}</span>
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-full mt-6 py-4 bg-slate-800 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest"
            >
              CLOSE
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const GenderModal = ({
  isOpen,
  onClose,
  value,
  onSelect
}: {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onSelect: (gender: string) => void;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[21000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-card w-full max-w-sm p-8 shadow-2xl"
          >
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">SELECT GENDER</h3>
            <div className="grid grid-cols-1 gap-2">
              {['Male', 'Female', 'Non-Binary', 'Other', 'Prefer not to say'].map(opt => (
                <button
                  key={opt}
                  onClick={() => { onSelect(opt); onClose(); }}
                  className={cn(
                    "w-full p-4 text-left rounded-xl transition-all border border-white/5 text-xs font-bold uppercase tracking-widest",
                    value === opt ? "bg-brand-primary/20 border-brand-primary/50 text-brand-primary" : "bg-brand-background text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-full mt-6 py-4 bg-slate-800 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest"
            >
              CANCEL
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ENTITY_TYPE_OPTIONS = [
  { label: 'All Entities', value: '' },
  { label: 'User', value: 'user' },
  { label: 'Research', value: 'research' },
  { label: 'Admin', value: 'admin' },
  { label: 'Announcement', value: 'announcement' },
  { label: 'Award', value: 'award' },
  { label: 'Selectible', value: 'selectible' },
  { label: 'School Year', value: 'school_year' }
];

export const EntityTypeModal = ({
  isOpen,
  onClose,
  value,
  onSelect
}: {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onSelect: (val: string) => void;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[21000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-card w-full max-w-sm p-8 shadow-2xl"
          >
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">SELECT ENTITY TYPE</h3>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
              {ENTITY_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { onSelect(opt.value); onClose(); }}
                  className={cn(
                    "w-full p-4 text-left rounded-xl transition-all border border-white/5 text-[10px] font-bold uppercase tracking-widest",
                    value === opt.value ? "bg-brand-primary/20 border-brand-primary/50 text-brand-primary" : "bg-brand-background text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-full mt-6 py-4 bg-slate-800 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest"
            >
              CANCEL
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const DetailModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode; 
}) => {
  return (
    <div className={cn(
      "fixed inset-0 z-[20000] flex items-center justify-center p-4 md:p-10 transition-all duration-300",
      isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
    )}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        className="absolute inset-0 bg-[#0a0f1e]/80 backdrop-blur-xl"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: isOpen ? 1 : 0.9, y: isOpen ? 0 : 20 }}
        className="relative w-full max-w-2xl bg-[#0a0f1e] rounded-[3rem] border border-white/5 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
      >
        <div className="p-4 md:p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-brand-primary/5 to-transparent">
          <h3 className="text-base md:text-xl font-black text-white uppercase tracking-tighter">{title}</h3>
          <button onClick={onClose} className="p-2 md:p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar bg-[#0a0f1e]">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export const ActionModal = ({ 
  isOpen, 
  onClose, 
  type, 
  onConfirm 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  type: 'DELETE' | 'ARCHIVE' | 'DEACTIVATE'; 
  onConfirm: () => void;
}) => {
  const content = {
    DELETE: {
      title: 'DELETE ACCOUNT',
      description: 'This User has upload researches in this platform. User\'s contribution will also be deleted once you push through. Once the account is deleted the user will no longer have access to the following: Uploaded Research/s, Account details.',
      warning: 'Are you sure you want to delete this account?'
    },
    ARCHIVE: {
      title: 'ARCHIVE ACCOUNT',
      description: 'This User has upload researches in this platform. Once the account is archive the user\'s contribution/ uploads will still be visible in the platform.',
      warning: 'Are you sure you want to archive this account?'
    },
    DEACTIVATE: {
      title: 'DEACTIVATE ACCOUNT',
      description: 'This User has upload researches in this platform. Once the account is deactivated the user\'s contribution/ uploads will still be visible in the platform.',
      warning: 'Are you sure you want to deactivate this account?'
    }
  };

  const active = content[type];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={active.title}>
      <div className="space-y-4">
        <p className="text-xs text-slate-400 leading-relaxed font-medium">
          {active.description}
        </p>
        <div className="bg-brand-primary/5 p-4 rounded-xl border border-brand-primary/10 text-center">
          <p className="text-sm font-black text-white">{active.warning}</p>
        </div>
        <div className="flex gap-4 pt-4">
          <button onClick={onClose} className="flex-1 btn-primary bg-slate-700 shadow-none text-white text-[10px]">NO</button>
          <button onClick={onConfirm} className="flex-1 btn-primary bg-rose-600 shadow-rose-600/20 text-white text-[10px]">YES</button>
        </div>
      </div>
    </Modal>
  );
};

export const InputModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  value, 
  onChange, 
  onConfirm, 
  confirmLabel = 'SUBMIT',
  placeholder = 'Type here...' 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  message: string; 
  value: string; 
  onChange: (val: string) => void; 
  onConfirm: () => void; 
  confirmLabel?: string;
  placeholder?: string;
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{message}</p>
        <input 
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-[10px] font-black text-white uppercase outline-none focus:border-brand-primary/50"
          onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
        />
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-800 rounded-xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest">CANCEL</button>
          <button onClick={onConfirm} className="flex-1 py-4 bg-brand-primary rounded-xl text-[10px] font-black text-slate-900 hover:brightness-110 transition-all uppercase tracking-widest">{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
};

export const CourseModal = ({
  isOpen,
  onClose,
  options,
  value,
  onSelect
}: {
  isOpen: boolean;
  onClose: () => void;
  options: string[];
  value?: string;
  onSelect: (val: string) => void;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[21000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-card w-full max-w-sm p-8 shadow-2xl"
          >
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">SELECT COURSE</h3>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
              {options.map(opt => (
                <button
                  key={opt}
                  onClick={() => { onSelect(opt); onClose(); }}
                  className={cn(
                    "w-full p-4 text-left rounded-xl transition-all border border-white/5 text-xs font-bold uppercase tracking-widest",
                    value === opt ? "bg-brand-primary/20 border-brand-primary/50 text-brand-primary" : "bg-brand-background text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-full mt-6 py-4 bg-slate-800 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest"
            >
              CANCEL
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const SectionModal = ({
  isOpen,
  onClose,
  options,
  value,
  onSelect
}: {
  isOpen: boolean;
  onClose: () => void;
  options: string[];
  value?: string;
  onSelect: (val: string) => void;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[21000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-card w-full max-w-sm p-8 shadow-2xl"
          >
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">SELECT SECTION</h3>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
              {options.map(opt => (
                <button
                  key={opt}
                  onClick={() => { onSelect(opt); onClose(); }}
                  className={cn(
                    "w-full p-4 text-left rounded-xl transition-all border border-white/5 text-xs font-bold uppercase tracking-widest",
                    value === opt ? "bg-brand-primary/20 border-brand-primary/50 text-brand-primary" : "bg-brand-background text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-full mt-6 py-4 bg-slate-800 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest"
            >
              CANCEL
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const YearLevelModal = ({
  isOpen,
  onClose,
  options,
  value,
  onSelect
}: {
  isOpen: boolean;
  onClose: () => void;
  options: string[];
  value?: string;
  onSelect: (val: string) => void;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[21000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-card w-full max-w-sm p-8 shadow-2xl"
          >
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">SELECT YEAR LEVEL</h3>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
              {options.map(opt => (
                <button
                  key={opt}
                  onClick={() => { onSelect(opt); onClose(); }}
                  className={cn(
                    "w-full p-4 text-left rounded-xl transition-all border border-white/5 text-xs font-bold uppercase tracking-widest",
                    value === opt ? "bg-brand-primary/20 border-brand-primary/50 text-brand-primary" : "bg-brand-background text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-full mt-6 py-4 bg-slate-800 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest"
            >
              CANCEL
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface DatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (val: string) => void;
  title: string;
}

import { ChevronDown } from 'lucide-react';

export const DatePickerModal = ({ isOpen, onClose, value, onChange, title }: DatePickerProps) => {
  const [calendarDate, setCalendarDate] = React.useState(value ? new Date(value) : new Date());
  const [showMonthPicker, setShowMonthPicker] = React.useState(false);
  const [showYearPicker, setShowYearPicker] = React.useState(false);

  React.useEffect(() => {
    if (value) setCalendarDate(new Date(value));
  }, [value]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-card w-full max-w-sm p-8 relative overflow-hidden"
          >
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">{title}</h3>
            
            <div className="space-y-6">
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowMonthPicker(true)}
                  className="flex-1 bg-brand-background text-[10px] font-black uppercase text-brand-primary p-3.5 rounded-xl border border-white/5 outline-none flex items-center justify-between group/pick"
                >
                  <span>{['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][calendarDate.getMonth()]}</span>
                  <ChevronDown size={12} className="text-brand-primary/40 group-hover/pick:text-brand-primary transition-colors" />
                </button>
                <button 
                  onClick={() => setShowYearPicker(true)}
                  className="w-32 bg-brand-background text-[10px] font-black uppercase text-brand-primary p-3.5 rounded-xl border border-white/5 outline-none flex items-center justify-between group/pick"
                >
                  <span>{calendarDate.getFullYear()}</span>
                  <ChevronDown size={12} className="text-brand-primary/40 group-hover/pick:text-brand-primary transition-colors" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <div key={`${day}-${idx}`} className="text-[8px] font-black text-slate-600 uppercase mb-2">{day}</div>
                ))}
                {(() => {
                  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
                  const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
                  const blanks = Array.from({ length: firstDay }, (_, i) => <div key={`blank-${i}`} />);
                  const days = Array.from({ length: daysInMonth }, (_, i) => {
                    const d = i + 1;
                    const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const isSelected = value === dateStr;
                    
                    return (
                      <button
                        key={d}
                        onClick={() => {
                          onChange(dateStr);
                        }}
                        className={cn(
                          "aspect-square flex items-center justify-center text-[10px] font-bold rounded-lg transition-all",
                          isSelected ? "bg-brand-primary text-slate-900" : "text-slate-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {d}
                      </button>
                    );
                  });
                  return [...blanks, ...days];
                })()}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-brand-primary rounded-2xl text-[10px] font-black text-slate-900 hover:bg-brand-primary/90 transition-all uppercase tracking-widest shadow-xl shadow-brand-primary/20"
                >
                  CONFIRM
                </button>
              </div>
            </div>

            {/* Month Picker Overlay */}
            <AnimatePresence>
              {showMonthPicker && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 z-10 bg-brand-card flex flex-col overflow-hidden"
                >
                  <div className="p-8 pb-4 shrink-0">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Select Month</h4>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-28 no-scrollbar">
                    <div className="grid grid-cols-2 gap-2">
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, idx) => (
                        <button
                          key={m}
                          onClick={() => {
                            const newDate = new Date(calendarDate);
                            newDate.setMonth(idx);
                            setCalendarDate(newDate);
                            setShowMonthPicker(false);
                          }}
                          className={cn(
                            "p-3 text-[10px] font-bold uppercase rounded-xl border transition-all text-center",
                            calendarDate.getMonth() === idx 
                              ? "bg-brand-primary/10 border-brand-primary/30 text-white" 
                              : "bg-brand-background border-white/5 text-slate-400 hover:bg-brand-primary/10 hover:border-brand-primary/30 hover:text-slate-200"
                          )}
                        >
                          {m.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-8 pt-6 bg-brand-card border-t border-white/5">
                    <button
                      onClick={() => setShowMonthPicker(false)}
                      className="w-full py-4 bg-slate-800 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest shadow-xl shadow-slate-950/20"
                    >
                      CANCEL
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Year Picker Overlay */}
            <AnimatePresence>
              {showYearPicker && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 z-10 bg-brand-card flex flex-col overflow-hidden"
                >
                  <div className="p-8 pb-4 shrink-0">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Select Year</h4>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-28 no-scrollbar">
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 120 }, (_, i) => new Date().getFullYear() + 10 - i).map(y => (
                        <button
                          key={y}
                          onClick={() => {
                            const newDate = new Date(calendarDate);
                            newDate.setFullYear(y);
                            setCalendarDate(newDate);
                            setShowYearPicker(false);
                          }}
                          className={cn(
                            "p-3 text-[10px] font-bold rounded-xl border transition-all text-center",
                            calendarDate.getFullYear() === y 
                              ? "bg-brand-primary/10 border-brand-primary/30 text-white" 
                              : "bg-brand-background border-white/5 text-slate-400 hover:bg-brand-primary/10 hover:border-brand-primary/30 hover:text-slate-200"
                          )}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-8 pt-6 bg-brand-card border-t border-white/5">
                    <button
                      onClick={() => setShowYearPicker(false)}
                      className="w-full py-4 bg-slate-800 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest shadow-xl shadow-slate-950/20"
                    >
                      CANCEL
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const ResearchYearModal = ({
  isOpen,
  onClose,
  value,
  onSelect
}: {
  isOpen: boolean;
  onClose: () => void;
  value?: number | null;
  onSelect: (year: number) => void;
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1969 }, (_, i) => currentYear - i);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[21000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-card w-full max-w-sm p-8 shadow-2xl"
          >
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">SELECT RESEARCH YEAR</h3>
            <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
              {years.map(y => (
                <button
                  key={y}
                  onClick={() => { onSelect(y); onClose(); }}
                  className={cn(
                    "p-3 text-[10px] font-bold rounded-xl border transition-all text-center",
                    value === y
                      ? "bg-brand-primary/10 border-brand-primary/30 text-white"
                      : "bg-brand-background border-white/5 text-slate-400 hover:bg-brand-primary/10 hover:border-brand-primary/30 hover:text-slate-200"
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-full mt-6 py-4 bg-slate-800 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest"
            >
              CANCEL
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
