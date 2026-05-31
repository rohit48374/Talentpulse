import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, Mail, Phone, MapPin, Building2, Calendar, Shield, BadgeDollarSign, Edit2, 
  ShieldCheck, CheckCircle2, Heart, Award, Sparkles, UserRound
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const EmployeeProfile = () => {
  const { user, employee } = useAuth();

  const profileImageUrl = user?.profile_image 
    ? (user.profile_image.startsWith('http') ? user.profile_image : `http://${window.location.hostname}:8000${user.profile_image}`)
    : employee?.user_profile_image 
    ? (employee.user_profile_image.startsWith('http') ? employee.user_profile_image : `http://${window.location.hostname}:8000${employee.user_profile_image}`)
    : null;

  if (!user) return null;

  const initials = (user.full_name || 'System Associate')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans pb-16 text-slate-750 text-left select-text">
      
      {/* 1. Profile Identity Card Passport */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-white dark:bg-[#111827] rounded-[2.5rem] shadow-lg border border-slate-100 dark:border-slate-800 overflow-hidden relative"
      >
        <div className="h-48 bg-gradient-to-r from-violet-650 via-violet-800 to-indigo-850 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 rounded-full bg-violet-400/20 filter blur-3xl" />
          <div className="absolute bottom-[-50px] left-[10%] w-64 h-64 rounded-full bg-indigo-500/15 filter blur-3xl" />
          <div className="absolute bottom-4 left-6 text-white/50 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
            <Sparkles size={10} className="animate-spin-slow" /> Corporate Network ID Passport
          </div>
        </div>

        <div className="px-8 pb-8 flex flex-col md:flex-row gap-6 items-end relative z-10 -mt-16">
          <div className="relative group shrink-0">
            <div className="w-32 h-32 rounded-[2.2rem] border-4 border-white dark:border-[#111827] bg-gradient-to-tr from-violet-500 to-indigo-500 overflow-hidden shadow-2xl flex items-center justify-center text-white text-3xl font-black tracking-wider transition-all duration-300 shrink-0">
              {profileImageUrl ? (
                <img 
                  src={profileImageUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = ''; }}
                />
              ) : (
                initials
              )}
            </div>
            <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-white dark:border-[#111827] rounded-full shadow-lg" />
          </div>

          <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-end w-full gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">
                  {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                </h1>
                <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900/30 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 shadow-sm shrink-0">
                  <ShieldCheck size={10} /> Active Staff
                </span>
                <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 text-[9px] font-black uppercase tracking-wider rounded-lg shrink-0">
                  Tier-1 Authorization
                </span>
              </div>
              
              <p className="text-violet-650 dark:text-violet-400 font-black text-base mt-2.5 capitalize flex items-center gap-2 leading-none">
                <Building2 size={16} />
                {employee?.designation_name || user?.designation || 'Corporate Specialist Associate'}
              </p>
            </div>
            
            <Link 
              to="/profile/edit" 
              className="px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black rounded-2xl shadow-lg hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Edit2 size={14} /> Edit Identity Card
            </Link>
          </div>
        </div>
      </motion.div>

      {/* 2. Core Identity details grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Corporate details passport */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="md:col-span-1"
        >
          <div className="bg-white dark:bg-[#111827] rounded-[2.2rem] shadow-sm border border-slate-100 dark:border-slate-800 p-6 relative overflow-hidden min-h-[360px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-violet-500/5 filter blur-xl" />
            
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white mb-6 border-b border-slate-50 dark:border-slate-800 pb-4 flex items-center gap-2">
                <Shield className="text-violet-600" size={16} /> Corporate Identity
              </h3>

              <div className="space-y-4">
                
                {/* Employee ID */}
                <div className="flex gap-3.5 items-start">
                  <div className="w-8.5 h-8.5 rounded-xl bg-violet-50 dark:bg-violet-950/20 text-violet-600 border border-violet-100 dark:border-violet-900/30 flex items-center justify-center shrink-0 shadow-sm">
                    <User size={15} />
                  </div>
                  <div className="flex-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Employee ID</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-extrabold text-slate-800 dark:text-white text-xs block">
                        {user?.employee_id || 'Generating...'}
                      </span>
                      {user?.employee_id && (
                        <button 
                          type="button"
                          onClick={() => navigator.clipboard.writeText(user.employee_id)}
                          className="p-1 text-slate-400 hover:text-violet-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          title="Copy ID"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Allocated Division */}
                <div className="flex gap-3.5 items-start">
                  <div className="w-8.5 h-8.5 rounded-xl bg-violet-50 dark:bg-violet-950/20 text-violet-600 border border-violet-100 dark:border-violet-900/30 flex items-center justify-center shrink-0 shadow-sm">
                    <Building2 size={15} />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Allocated Division</span>
                    <span className="font-extrabold text-slate-800 dark:text-white text-xs mt-1 block capitalize">{employee?.department_name || user?.department || 'Unassigned'}</span>
                  </div>
                </div>

                {/* System Authorization Role */}
                <div className="flex gap-3.5 items-start">
                  <div className="w-8.5 h-8.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center shrink-0 shadow-sm">
                    <Shield size={15} />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Authorization Role</span>
                    <span className="font-extrabold text-slate-800 dark:text-white text-xs mt-1 block uppercase tracking-wide">
                      {(user?.role || employee?.role || 'EMPLOYEE').replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Date of Joining */}
                <div className="flex gap-3.5 items-start">
                  <div className="w-8.5 h-8.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center shrink-0 shadow-sm">
                    <Calendar size={15} />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Date of Joining</span>
                    <span className="font-extrabold text-slate-800 dark:text-white text-xs mt-1 block">
                      {user?.joining_date || employee?.date_of_joining ? new Date(user?.joining_date || employee?.date_of_joining).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Salary Grade Tier */}
                <div className="flex gap-3.5 items-start">
                  <div className="w-8.5 h-8.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 border border-cyan-100 dark:border-cyan-900/30 flex items-center justify-center shrink-0 shadow-sm">
                    <BadgeDollarSign size={15} />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Salary Level</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-450 text-xs mt-1 block">
                      {user?.salary || employee?.grade_base_salary ? `₹${Number(user?.salary || employee?.grade_base_salary).toLocaleString('en-IN')}` : 'Confidential Level'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Contact details card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="md:col-span-2 space-y-6"
        >
          <div className="bg-white dark:bg-[#111827] rounded-[2.2rem] shadow-sm border border-slate-100 dark:border-slate-800 p-6 relative overflow-hidden min-h-[360px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-blue-500/5 filter blur-xl" />
            
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white mb-6 border-b border-slate-50 dark:border-slate-800 pb-4 flex items-center gap-2">
                <UserRound className="text-violet-650" size={16} /> Communications & Address
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Email Address */}
                <div className="flex gap-3.5 items-start p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl hover:bg-white dark:hover:bg-[#111827] hover:border-violet-200 transition-all shadow-sm">
                  <div className="w-8.5 h-8.5 rounded-xl bg-violet-50 dark:bg-violet-950/20 text-violet-600 border border-violet-100 flex items-center justify-center shrink-0">
                    <Mail size={15} />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Work Email Address</span>
                    <span className="font-extrabold text-slate-800 dark:text-white text-xs mt-1.5 block truncate max-w-[200px]">{user.email}</span>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex gap-3.5 items-start p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl hover:bg-white dark:hover:bg-[#111827] hover:border-violet-200 transition-all shadow-sm">
                  <div className="w-8.5 h-8.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <Phone size={15} />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Contact Phone Number</span>
                    <span className="font-extrabold text-slate-800 dark:text-white text-xs mt-1.5 block">{employee?.contact_number || user?.phone || 'Not provided'}</span>
                  </div>
                </div>

                {/* Home Address Card (Span 2) */}
                <div className="flex gap-3.5 items-start p-5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl hover:bg-white dark:hover:bg-[#111827] hover:border-violet-200 transition-all md:col-span-2 shadow-sm">
                  <div className="w-8.5 h-8.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                    <MapPin size={15} />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Home Address Details</span>
                    <span className="font-extrabold text-slate-750 dark:text-slate-300 text-xs mt-2 block leading-relaxed">
                      {user?.address || employee?.office_location || 'No address on file. Please edit your profile identity card to save local address details.'}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Compliance seal */}
            <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center text-[8.5px] font-black text-slate-400 uppercase tracking-widest select-none">
              <span className="flex items-center gap-1">
                <Award size={12} className="text-violet-650" /> SOC2 Enterprise Compliance Verified
              </span>
              <span className="flex items-center gap-1">
                <Heart size={12} className="text-rose-505" /> Verified Identity Network
              </span>
            </div>

          </div>
        </motion.div>

      </div>

    </div>
  );
};
