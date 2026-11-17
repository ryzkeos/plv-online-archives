import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import Logo from './Logo';

export const OTPPage = ({ onVerify }: { onVerify?: () => void }) => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await api.resendOtp({ email });
      setTimer(300);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.error || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async () => {
    if (digits.some(d => !d)) {
      setError('Please enter all digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.verifyOtp({ email, otp: digits.join('') });
      if (onVerify) {
        onVerify();
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#0a0f1e] p-4 md:p-8 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="auth-card w-full max-w-[400px] p-6 md:p-10 flex flex-col justify-center my-auto shrink-0 transition-all min-h-[650px]"
      >
        <Logo />
        <div className="mt-6 md:mt-8 space-y-6 md:space-y-7">
          <div className="text-center mb-2">
            <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter">Verify Email</h2>
            <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 break-all px-4">An OTP has been sent to {email}</p>
          </div>
          
          <div className="flex justify-between gap-1.5 md:gap-2">
            {digits.map((d, i) => (
              <input 
                key={i} 
                ref={inputRefs[i]}
                className="w-full aspect-square bg-[#0d1526] border border-white/10 rounded-lg md:rounded-xl text-center font-black text-base md:text-xl text-brand-primary outline-none focus:border-brand-primary" 
                maxLength={1} 
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
              />
            ))}
          </div>

          <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">
            The OTP will expire in <span className="text-brand-primary">{formatTime(timer)}</span>
          </p>

          {error && (
            <p className="text-rose-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-center leading-tight">{error}</p>
          )}

          <div className="pt-2 md:pt-4 space-y-4">
            <button onClick={handleVerify} disabled={loading} className="btn-primary w-full py-2.5 md:py-3 text-[10px] md:text-xs">
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <div className="text-center">
              <button 
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resending}
                className="text-[9px] md:text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] hover:brightness-125 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {resending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OTPPage;
