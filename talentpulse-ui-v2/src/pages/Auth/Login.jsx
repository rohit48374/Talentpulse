import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, ArrowRight, ShieldCheck, Star, Eye, EyeOff,
  Globe, Cpu, Zap, CreditCard, Users, Activity, Bell, Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../../components/common/Logo';
import { motion, AnimatePresence } from 'framer-motion';

// Floating animated card wrapper for subtle micro-interactions
const FloatingCard = ({ children, className, delay = 0, amplitude = 6 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: [0, -amplitude, 0] }}
    transition={{
      opacity: { duration: 0.5, delay },
      y: { duration: 4 + delay * 0.4, repeat: Infinity, ease: 'easeInOut', delay: delay * 0.5 },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Invalid credentials. Please verify your Workspace ID and Password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans bg-white overflow-hidden">

      {/* ── LEFT PANEL (High-Fidelity Enterprise Brand Stack) ──── */}
      <div className="hidden lg:flex lg:w-[48%] relative bg-gradient-to-br from-[#0A0515] via-[#12062a] to-[#1a0040] overflow-hidden flex-col justify-between p-12 shrink-0">
        
        {/* Animated background ambient meshes */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            animate={{
              x: [0, 40, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/20 blur-[130px]" 
          />
          <motion.div 
            animate={{
              x: [0, -30, 0],
              y: [0, 40, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-500/10 blur-[110px]" 
          />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)]" style={{ backgroundSize: '28px 28px' }} />
        </div>

        {/* Top Header Row (Logo & Live Pending Approvals Badge) */}
        <div className="relative z-10 flex items-center justify-between w-full">
          <Link to="/">
            <div className="bg-white/5 border border-white/8 backdrop-blur-md px-4.5 py-2 rounded-xl transition-colors hover:bg-white/10">
              <Logo size="md" theme="dark" />
            </div>
          </Link>
          
          {/* Real-time Approvals Pill */}
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg">
            <Bell size={11} className="text-amber-400 animate-bounce" />
            <span className="text-[10px] text-amber-300 font-black uppercase tracking-wider">7 Pending Approvals</span>
          </div>
        </div>

        {/* Content & Bento Preview Stack (No Absolute Position Clashes!) */}
        <div className="relative z-10 flex flex-col justify-center flex-1 max-w-[420px] w-full mx-auto py-10 space-y-8">
          
          {/* Main Headline */}
          <div className="space-y-3">
            <h2 className="text-4.5xl font-black leading-[1.1] tracking-tight text-white">
              One platform.<br />Every HR workflow.
            </h2>
            <div className="inline-flex items-center gap-1.5 text-violet-400 text-xs font-black uppercase tracking-wider">
              <Shield size={12} /> SOC2 Type II · Enterprise Security
            </div>
          </div>

          {/* Cards Container - Flow layout to strictly prevent overlapping */}
          <div className="space-y-4">
            
            {/* Live Workforce Stats Card */}
            <FloatingCard delay={0.1} amplitude={4}>
              <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-5 shadow-2xl relative overflow-hidden group hover:bg-white/[0.06] transition-colors duration-300">
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/[0.02] to-transparent pointer-events-none" />
                
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                  <span className="text-white/50 text-[9px] uppercase tracking-widest font-black">Live Workforce</span>
                  <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Node
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                    <span className="text-slate-400 text-[8px] uppercase tracking-wider font-bold">Employees</span>
                    <p className="text-white text-lg font-black mt-0.5">2,847</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                    <span className="text-slate-400 text-[8px] uppercase tracking-wider font-bold">On Leave</span>
                    <p className="text-amber-400 text-lg font-black mt-0.5">43</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                    <span className="text-slate-400 text-[8px] uppercase tracking-wider font-bold">New Hires</span>
                    <p className="text-emerald-400 text-lg font-black mt-0.5">18</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                    <span className="text-slate-400 text-[8px] uppercase tracking-wider font-bold">Open Roles</span>
                    <p className="text-violet-400 text-lg font-black mt-0.5">12</p>
                  </div>
                </div>

                {/* Rating Pill embedded directly inside card to avoid clutter */}
                <div className="mt-4 flex items-center justify-between bg-violet-600/10 border border-violet-500/20 rounded-xl px-3.5 py-2">
                  <span className="text-violet-300 text-[9px] uppercase tracking-wider font-black flex items-center gap-1">
                    <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" /> #1 HRMS Platform 2026
                  </span>
                  <span className="text-emerald-400 text-[9px] font-black uppercase tracking-wider">Top Rated</span>
                </div>
              </div>
            </FloatingCard>

            {/* Payroll Highlight Card */}
            <FloatingCard delay={0.3} amplitude={5}>
              <div className="bg-gradient-to-r from-violet-600/15 to-indigo-600/15 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-5 shadow-2xl hover:from-violet-600/20 hover:to-indigo-600/20 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-300 shrink-0">
                    <CreditCard size={15} />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[8px] uppercase tracking-widest font-black block">Payroll Hub</span>
                    <span className="text-white text-xs font-black">May 2026 Disbursements</span>
                  </div>
                </div>
                
                <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-white/5">
                  <span className="text-[#A5B4FC] text-2xl font-black">₹ 47.2L</span>
                  <span className="text-emerald-400 text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    ✓ Cleared
                  </span>
                </div>
              </div>
            </FloatingCard>

          </div>
        </div>

        {/* Footer Trust Indicator & Badges */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 border-t border-white/5 text-[10px] font-black tracking-widest uppercase text-slate-500">
          <div className="flex items-center gap-2">
            <Globe size={12} className="text-violet-400" /> ISO 27001 · SOC2 · GDPR COMPLIANT
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} size={11} className="fill-current" />)}
            </div>
            <span>4.9/5 from 2,000+ reviews</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (Secure Authentication Interface) ─── */}
      <div className="w-full lg:w-[52%] flex flex-col justify-between px-6 md:px-16 xl:px-24 py-12 bg-white relative overflow-y-auto">
        
        {/* Mobile Header Logo */}
        <div className="lg:hidden flex justify-center mb-6">
          <Link to="/"><Logo size="md" /></Link>
        </div>

        <div className="my-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-[420px] mx-auto"
          >
            {/* Secure indicator tag & Welcome heading */}
            <div className="mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 border border-violet-100/80 rounded-full text-[#6345ED] text-[10px] font-black uppercase tracking-widest mb-4">
                <ShieldCheck size={11} /> SECURE SIGN IN
              </span>
              <h1 className="text-3.5xl font-black text-slate-900 tracking-tight leading-none mb-3">Welcome back</h1>
              <p className="text-slate-500 font-semibold text-sm">Enter your credentials to access your workspace.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              {/* Animated Form Error Display */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email / Workspace ID Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest pl-1">
                  Employee ID or Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#6345ED] transition-colors" size={16} />
                  <input
                    type="text"
                    {...register('email', { required: 'Workspace ID or Email is required.' })}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium placeholder:text-slate-400/80 focus:bg-white focus:outline-none focus:border-[#6345ED] focus:ring-4 focus:ring-[#6345ED]/10 transition-all duration-300"
                    placeholder="name@company.com or EMP-101"
                  />
                </div>
                {errors.email && <p className="text-[10px] text-rose-500 font-bold pl-1">{errors.email.message}</p>}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pl-1">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Password</label>
                  <Link to="/forgot-password" className="text-[10px] font-bold text-[#6345ED] hover:text-[#5235D6] transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#6345ED] transition-colors" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { required: 'Password is required.' })}
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium placeholder:text-slate-400/80 focus:bg-white focus:outline-none focus:border-[#6345ED] focus:ring-4 focus:ring-[#6345ED]/10 transition-all duration-300"
                    placeholder="••••••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-rose-500 font-bold pl-1">{errors.password.message}</p>}
              </div>

              {/* Sign In Button */}
              <div className="pt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="group w-full py-3.5 bg-[#6345ED] hover:bg-[#5235D6] text-white text-sm font-black rounded-2xl shadow-[0_8px_24px_rgba(99,69,237,0.25)] hover:shadow-[0_12px_28px_rgba(99,69,237,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In to Workspace
                      <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </motion.button>
              </div>
            </form>

            {/* Social / SSO Section */}
            <div className="flex items-center gap-3 my-6">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider shrink-0">Or Sign In with</span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="flex items-center justify-center gap-2 py-3 border border-slate-200 hover:bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 transition-all cursor-pointer">
                <Globe size={14} className="text-slate-500" /> Google SSO
              </button>
              <button type="button" className="flex items-center justify-center gap-2 py-3 border border-slate-200 hover:bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 transition-all cursor-pointer">
                <Cpu size={14} className="text-slate-500" /> Active SSO
              </button>
            </div>
          </motion.div>
        </div>

        {/* Form Footer & Trust Badges */}
        <div className="pt-6 mt-6 border-t border-slate-100">
          <p className="text-slate-500 text-[11px] font-semibold text-center mb-5 italic bg-slate-50 border border-slate-100/60 p-3 rounded-2xl">
            This is a private corporate system. Accounts are created directly by HR/IT. If you need credentials or workspace access, please contact your HR representative or IT support desk.
          </p>
          
          <div className="flex items-center justify-center gap-6 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-[#6345ED]" /> SOC2 Certified</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            <span className="flex items-center gap-1"><Activity size={12} className="text-[#6345ED]" /> 99.9% Uptime</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            <span className="flex items-center gap-1"><Users size={12} className="text-[#6345ED]" /> 5000+ Enterprise</span>
          </div>
        </div>

      </div>
    </div>
  );
};

