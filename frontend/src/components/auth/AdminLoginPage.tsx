import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import Logo from './Logo';

export const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      if (data.user.role !== 'admin' && data.user.role !== 'masteradmin') {
        setError('Access denied. Admin accounts only.');
        await api.logout();
        return;
      }
      login(data.user);
      navigate('/admin/users');
    } catch (err: any) {
      setError(err.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#0a0f1e] p-4 md:p-8 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="auth-card w-full max-w-[400px] p-6 md:p-10 flex flex-col justify-center my-auto shrink-0 transition-all min-h-[650px]"
      >
        <Logo />
        
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-7 mt-6 md:mt-8">
          <div className="relative">
            <input 
              className="input-field py-3 md:py-4 placeholder:text-transparent" 
              placeholder="" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              required
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
              Admin Username
            </motion.label>
          </div>

          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              className="input-field py-3 md:py-4 pr-12 placeholder:text-transparent" 
              placeholder="" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              required
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
              Password
            </motion.label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-primary transition-colors"
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          {error && (
            <p className="text-rose-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-center leading-tight">{error}</p>
          )}

          <div className="pt-2">
            <button disabled={loading} className="btn-primary w-full py-2.5 md:py-3 text-[10px] md:text-xs">
              {loading ? 'Authenticating...' : 'Login As Admin'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
