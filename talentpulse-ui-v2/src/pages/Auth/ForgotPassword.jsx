import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, Star, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { Logo } from '../../components/common/Logo';
import { motion } from 'framer-motion';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [devToken, setDevToken] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsLoading(true);
      setError('');
      setMessage('');
      setDevToken('');
      
      const response = await api.post('/accounts/users/forgot_password/', { email });
      setMessage(response.data.message || 'If a user with this email exists, a password reset code has been sent.');
      
      // Save dev token for manual testing since there's no SMTP server!
      if (response.data.token && response.data.token !== 'MOCKED_TOKEN') {
        setDevToken(response.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans bg-white overflow-hidden">
      
      {/* Left Panel — enterprise dark design */}
      <div className="hidden lg:flex lg:w-[52%] relative bg-gradient-to-br from-[#0A0515] via-[#12062a] to-[#1a0040] overflow-hidden">
        {/* Texture */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-[380px] h-[380px] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-indigo-500/15 blur-[90px]" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        </div>
        <div className="relative z-10 flex flex-col justify-between h-full w-full p-12">
          <Link to="/">
            <div className="bg-white/10 w-fit px-4 py-2.5 rounded-xl backdrop-blur-md border border-white/15">
              <Logo size="md" theme="dark" />
            </div>
          </Link>
          <div className="max-w-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-violet-300 mb-6">
              <Star size={11} className="text-amber-400" /> #1 HR Platform 2026
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight leading-[1.1] mb-5">
              Forgot your<br />password?
            </h2>
            <p className="text-slate-400 font-medium text-base leading-relaxed mb-8">
              No worries. We'll help you securely verify your identity and restore access to your workspace in seconds.
            </p>
            <div className="flex items-center gap-3 bg-white/6 border border-white/10 rounded-2xl p-3.5 w-fit">
              <ShieldCheck size={16} className="text-violet-400 shrink-0" />
              <span className="text-slate-400 text-xs font-bold">SOC2 Type II · End-to-end encrypted</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => <Star key={i} size={12} className="text-amber-400 fill-amber-400" />)}
            <span className="text-slate-500 text-xs font-semibold ml-1">4.9/5 · 2,000+ reviews</span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-[48%] flex flex-col justify-center px-6 md:px-16 xl:px-20 py-12 bg-white">
        <div className="lg:hidden mb-10 text-center flex justify-center">
          <Link to="/"><Logo size="lg" /></Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[420px] mx-auto"
        >
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-full text-violet-700 text-[10px] font-black uppercase tracking-widest mb-5">
              <ShieldCheck size={10} /> Account Recovery
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Recover Password</h1>
            <p className="text-slate-500 font-medium text-sm">Provide your registered work email to receive a secure reset code.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div> {error}
              </div>
            )}

            {message && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-medium flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div> Code Dispatched Successfully
                </div>
                <p className="text-xs text-green-600">{message}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Work Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#6345ED] transition-colors" size={17} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#6345ED] focus:ring-4 focus:ring-[#6345ED]/8 transition-all" 
                  placeholder="john.doe@company.com" 
                />
              </div>
            </div>

            <div className="pt-3 space-y-3">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-[#6345ED] to-indigo-600 hover:from-[#5235D6] hover:to-indigo-500 text-white text-sm font-black rounded-2xl shadow-[0_8px_24px_rgba(99,69,237,0.4)] hover:shadow-[0_12px_32px_rgba(99,69,237,0.55)] transition-all disabled:opacity-70 flex items-center justify-center gap-2.5 hover:-translate-y-0.5"
              >
                {isLoading ? 'Sending Code...' : (
                  <>Send Reset Code <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center items-center text-sm font-bold">
            <Link to="/login" className="flex items-center gap-2 text-[#6345ED] hover:text-[#5235D6] transition-colors">
              <ArrowLeft size={15} /> Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
