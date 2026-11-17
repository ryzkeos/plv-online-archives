import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import Logo from './Logo';

export const PasswordResetPage = () => {
  const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    let interval: any;
    if (step === 'verify' && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResendOtp = async () => {
    setResending(true);
    setError('');
    try {
      await api.forgotPassword({ email });
      setTimer(600);
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

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.forgotPassword({ email });
      setStep('verify');
      setTimer(600); // 10 mins
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.some(d => !d)) {
      setError('Please enter all digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.verifyOtp({ email, otp: otp.join('') });
      setStep('reset');
    } catch (err: any) {
      setError(err.error || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const validateStrength = (p: string) =>
    p && (p.length < 8 || !/[A-Z]/.test(p) || !/[0-9]/.test(p))
      ? 'Min 8 chars, 1 uppercase, 1 number' : '';

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const pErr = validateStrength(password);
    const cErr = password !== confirmPassword ? "Passwords don't match" : '';
    setPasswordError(pErr);
    setConfirmError(cErr);
    if (pErr || cErr) return;
    setLoading(true);
    setError('');
    try {
      await api.resetPassword({ email, otp: otp.join(''), password, confirm_password: confirmPassword });
      navigate('/login');
    } catch (err: any) {
      setError(err.error || 'Failed to reset password');
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
        
        <AnimatePresence mode="wait">
          {step === 'request' && (
            <motion.form 
              key="request"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleRequest} 
              className="mt-6 md:mt-8 space-y-6 md:space-y-7"
            >
              <div className="text-center mb-2">
                <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter">Forgot Password</h2>
              </div>

              <div className="relative">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  className="input-field py-3 md:py-4 placeholder:text-transparent"
                  placeholder=""
                />
                <motion.label
                  initial={false}
                  animate={{
                    top: (email || emailFocused) ? 0 : "50%",
                    y: (email || emailFocused) ? "-50%" : "-50%",
                    scale: (email || emailFocused) ? 0.8 : 1,
                    x: (email || emailFocused) ? -4 : 0,
                  }}
                  className={cn(
                    "absolute left-4 pointer-events-none select-none transition-colors duration-200 uppercase tracking-[0.2em] origin-left",
                    (email || emailFocused) 
                      ? "text-brand-primary bg-[#111827] px-2 font-black text-[10px]" 
                      : "text-slate-500 font-bold text-[9px] md:text-[10px]"
                  )}
                >
                  Email Address
                </motion.label>
              </div>

              {error && <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest text-center">{error}</p>}

              <div className="pt-2 md:pt-4 space-y-4">
                <button disabled={loading} className="btn-primary w-full py-2.5 md:py-3 text-[10px] md:text-xs">
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
                
                <div className="text-center">
                  <button 
                    type="button" 
                    onClick={() => navigate('/login')}
                    className="text-[9px] md:text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] hover:brightness-125 transition-all"
                  >
                    Login
                  </button>
                </div>
              </div>
            </motion.form>
          )}

          {step === 'verify' && (
            <motion.div 
              key="verify"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 md:mt-8 space-y-6 md:space-y-7"
            >
              <div className="text-center mb-2">
                <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter">Verify Email</h2>
                <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 break-all px-4">An OTP has been sent to {email}</p>
              </div>

              <div className="flex justify-between gap-1.5 md:gap-2">
                {otp.map((d, i) => (
                  <input 
                    key={i}
                    ref={otpRefs[i]}
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-full aspect-square bg-[#0d1526] border border-white/10 rounded-lg md:rounded-xl text-center font-black text-base md:text-xl text-brand-primary outline-none focus:border-brand-primary"
                  />
                ))}
              </div>

              {error && <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest text-center leading-tight">{error}</p>}

              <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">
                The OTP will expire in <span className="text-brand-primary">{formatTime(timer)}</span>
              </p>

              <div className="pt-2 md:pt-4 space-y-4">
                <button 
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="btn-primary w-full py-2.5 md:py-3 text-[10px] md:text-xs"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
                
                <div className="flex items-center justify-between">
                  <button 
                    type="button" 
                    onClick={() => setStep('request')}
                    className="text-[9px] md:text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] hover:brightness-125 transition-all"
                  >
                    Change Email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || resending}
                    className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-brand-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {resending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'reset' && (
            <motion.form 
              key="reset"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleReset} 
              className="mt-6 md:mt-8 space-y-6 md:space-y-7"
            >
              <div className="text-center mb-2">
                <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter">New Password</h2>
              </div>

              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => { setPasswordFocused(false); setPasswordError(validateStrength(password)); }}
                  className={cn("input-field py-3 md:py-4 pr-12 placeholder:text-transparent", passwordError && "border-rose-500/50")}
                  placeholder=""
                />
                <motion.label
                  initial={false}
                  animate={{
                    top: (password || passwordFocused) ? 0 : "50%",
                    y: (password || passwordFocused) ? "-50%" : "-50%",
                    scale: (password || passwordFocused) ? 0.8 : 1,
                    x: (password || passwordFocused) ? -4 : 0,
                  }}
                  className={cn(
                    "absolute left-4 pointer-events-none select-none transition-colors duration-200 uppercase tracking-[0.2em] origin-left",
                    (password || passwordFocused) 
                      ? "text-brand-primary bg-[#111827] px-2 font-black text-[10px]" 
                      : "text-slate-500 font-bold text-[9px] md:text-[10px]"
                  )}
                >
                  New Password
                </motion.label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-primary transition-colors"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                {passwordError && <p className="text-rose-400 text-[8px] font-black uppercase tracking-widest mt-1">{passwordError}</p>}
              </div>

              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  required
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError(''); }}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => { setConfirmPasswordFocused(false); setConfirmError(confirmPassword && confirmPassword !== password ? "Passwords don't match" : ''); }}
                  className={cn("input-field py-3 md:py-4 pr-12 placeholder:text-transparent", confirmError && "border-rose-500/50")}
                  placeholder=""
                />
                <motion.label
                  initial={false}
                  animate={{
                    top: (confirmPassword || confirmPasswordFocused) ? 0 : "50%",
                    y: (confirmPassword || confirmPasswordFocused) ? "-50%" : "-50%",
                    scale: (confirmPassword || confirmPasswordFocused) ? 0.8 : 1,
                    x: (confirmPassword || confirmPasswordFocused) ? -4 : 0,
                  }}
                  className={cn(
                    "absolute left-4 pointer-events-none select-none transition-colors duration-200 uppercase tracking-[0.2em] origin-left",
                    (confirmPassword || confirmPasswordFocused) 
                      ? "text-brand-primary bg-[#111827] px-2 font-black text-[10px]" 
                      : "text-slate-500 font-bold text-[9px] md:text-[10px]"
                  )}
                >
                  Confirm Password
                </motion.label>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-primary transition-colors"
                >
                  {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                {confirmError && <p className="text-rose-400 text-[8px] font-black uppercase tracking-widest mt-1">{confirmError}</p>}
              </div>

              {error && <p className="text-[9px] text-rose-400 font-black uppercase tracking-widest text-center leading-tight">{error}</p>}

              <div className="pt-2 md:pt-4">
                <button disabled={loading} className="btn-primary w-full py-2.5 md:py-3 text-[10px] md:text-xs">
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PasswordResetPage;

