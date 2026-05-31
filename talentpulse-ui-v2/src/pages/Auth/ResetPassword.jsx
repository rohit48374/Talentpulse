import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Key, ArrowRight, ArrowLeft, Star, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';
import { Logo } from '../../components/common/Logo';
import { motion } from 'framer-motion';

export const ResetPassword = () => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Prefill fields if navigated from ForgotPassword state or URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryEmail = params.get('email');
    const queryToken = params.get('token');
    
    if (queryEmail) setValue('email', queryEmail);
    if (queryToken) setValue('token', queryToken);
    
    if (location.state) {
      if (location.state.email) setValue('email', location.state.email);
      if (location.state.token) setValue('token', location.state.token);
    }
  }, [location, setValue]);

  const onSubmit = async (data) => {
    if (data.new_password !== data.new_password_confirm) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      const response = await api.post('/accounts/users/reset_password/', {
        email: data.email,
        token: data.token,
        new_password: data.new_password,
        new_password_confirm: data.new_password_confirm
      });

      setSuccess(response.data.message || 'Your password has been successfully reset.');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid reset code or email. Please verify and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans bg-surface-50 relative overflow-hidden">
      
      {/* Left Side - Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface-900 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80" 
          alt="Office" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/90 via-[#0B041C]/90 to-[#0A0515]"></div>
        
        <div className="relative z-10 p-12 flex flex-col justify-between w-full h-full text-white">
          <Link to="/">
            <div className="bg-white/10 w-fit p-3 rounded-xl backdrop-blur-sm mb-12">
              <Logo size="lg" theme="dark" />
            </div>
          </Link>
          
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-bold text-primary-200 mb-6">
              <Star size={14} className="text-amber-400" /> #1 HR Platform 2026
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mb-6">
              Reset your credentials.
            </h1>
            <p className="text-surface-300 font-medium text-lg leading-relaxed mb-8">
              Update your account password securely. Ensure your credentials are strong and strictly unique to safe-keep your workplace metrics.
            </p>
            
            <div className="flex items-center gap-4 text-slate-300 text-sm font-bold bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md w-fit">
              <ShieldCheck size={20} className="text-violet-400" />
              <span>Enterprise Grade Security</span>
              <div className="h-1 w-1 bg-surface-600 rounded-full mx-2"></div>
              <span>SOC2 Type II</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 md:px-20 py-12 relative z-20 bg-white">
        <div className="lg:hidden mb-12 text-center flex justify-center">
          <Link to="/"><Logo size="lg" /></Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[420px] mx-auto"
        >
          <div className="mb-10">
            <h2 className="text-3xl font-black text-surface-900 tracking-tight mb-3">Set New Password</h2>
            <p className="text-surface-500 font-medium">Verify your reset code to completely restore access and update credentials.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div> {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-bold flex flex-col gap-1.5 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div> Password Updated!
                </div>
                <p className="text-xs text-green-600 font-medium">{success}</p>
                <p className="text-xs text-green-500">Redirecting to Login screen...</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900">Work Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                <input 
                  type="email" 
                  {...register("email", { required: true })} 
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-50 border border-surface-200 rounded-2xl text-surface-900 focus:bg-white focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all text-base font-medium" 
                  placeholder="john.doe@company.com" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900">Verification Code</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                <input 
                  type="text" 
                  {...register("token", { required: true })} 
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-50 border border-surface-200 rounded-2xl text-surface-900 focus:bg-white focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all text-base font-medium tracking-widest font-mono" 
                  placeholder="••••••" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900">New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  {...register("new_password", { required: true, minLength: 8 })} 
                  className="w-full pl-12 pr-12 py-3.5 bg-surface-50 border border-surface-200 rounded-2xl text-surface-900 focus:bg-white focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all text-base font-medium" 
                  placeholder="••••••••••••" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900">Confirm New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  {...register("new_password_confirm", { required: true })} 
                  className="w-full pl-12 pr-12 py-3.5 bg-surface-50 border border-surface-200 rounded-2xl text-surface-900 focus:bg-white focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all text-base font-medium" 
                  placeholder="••••••••••••" 
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-base font-bold rounded-2xl shadow-[0_8px_20px_-8px_rgba(124,58,237,0.5)] hover:shadow-[0_8px_20px_-8px_rgba(124,58,237,0.8)] transition-all disabled:opacity-70 flex items-center justify-center gap-3 hover:-translate-y-0.5"
              >
                {isLoading ? 'Resetting password...' : (
                  <>Complete Password Reset <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          </form>

          <div className="mt-10 pt-8 border-t border-surface-100 flex justify-center items-center text-sm font-bold text-primary-600">
            <Link to="/login" className="flex items-center gap-2 hover:text-primary-700 transition-colors">
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
