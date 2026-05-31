import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle, 
  FileText, Send, User, ChevronRight, Sparkles, Check, X 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export const LeavesPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const applyFormRef = useRef(null);

  const [balances, setBalances] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [teamRequests, setTeamRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  
  // Apply Leave Form State
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const role = user?.role?.toLowerCase() || 'employee';
  const isApplyRoute = location.pathname === '/leaves/apply';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [typeRes, balRes, appRes] = await Promise.all([
        api.get('/attendance/leave-types/'),
        api.get('/attendance/leave-balances/'),
        api.get('/attendance/leave-applications/')
      ]);
      
      setLeaveTypes(typeRes.data.results || typeRes.data || []);
      setBalances(balRes.data.results || balRes.data || []);
      setMyApplications(appRes.data.results || appRes.data || []);
      
      if (['manager', 'hr_admin', 'super_admin', 'hrbp', 'hr'].includes(role)) {
        const teamRes = await api.get('/manager/leave-requests/');
        setTeamRequests(teamRes.data.results || teamRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load leave metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role]);

  // Smooth scroll to the form if accessed via /leaves/apply
  useEffect(() => {
    if (isApplyRoute && applyFormRef.current && !loading) {
      setTimeout(() => {
        applyFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [isApplyRoute, loading]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveType || !startDate || !endDate || !reason) {
      setErrorMsg('Please populate all fields.');
      return;
    }

    try {
      setErrorMsg('');
      setSuccessMsg('');
      await api.post('/leave/apply/', {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason
      });
      setSuccessMsg('Leave request submitted successfully for approval.');
      setLeaveType('');
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit leave. Verify your remaining balances.');
    }
  };

  const handleAction = async (id, approve) => {
    try {
      await api.post('/manager/approve-leave/', {
        leave_application_id: id,
        status: approve ? 'approved' : 'rejected',
        approval_remarks: approve ? 'Approved via Leave Management panel.' : 'Rejected via Leave Management panel.'
      });
      setTeamRequests(teamRequests.filter(req => req.id !== id));
      fetchData();
    } catch (err) {
      console.error("Failed to update leave application", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-violet-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-violet-600 animate-spin"></div>
        </div>
      </div>
    );
  }

  // Curated balance color configurations
  const getBalanceStyle = (index) => {
    const styles = [
      {
        bg: 'bg-gradient-to-br from-violet-600/90 to-fuchsia-700/90',
        text: 'text-violet-600',
        glow: 'from-violet-500/20 to-transparent',
        badge: 'bg-violet-500/10 text-violet-300 border border-violet-500/20',
        progress: 'bg-gradient-to-r from-violet-200 to-fuchsia-200'
      },
      {
        bg: 'bg-gradient-to-br from-sky-500/90 to-blue-600/90',
        text: 'text-sky-600',
        glow: 'from-sky-500/20 to-transparent',
        badge: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
        progress: 'bg-gradient-to-r from-sky-200 to-blue-200'
      },
      {
        bg: 'bg-gradient-to-br from-rose-500/90 to-orange-600/90',
        text: 'text-rose-600',
        glow: 'from-rose-500/20 to-transparent',
        badge: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
        progress: 'bg-gradient-to-r from-rose-200 to-orange-200'
      }
    ];
    return styles[index % styles.length];
  };

  return (
    <div className="space-y-8 font-sans pb-16 text-slate-800">
      
      {/* Premium Header */}
      <div className="relative pb-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-violet-500/5 filter blur-3xl -z-10"></div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 bg-clip-text bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950">
            Leave Management
          </h1>
          <p className="text-slate-400 text-xs font-semibold mt-1">Manage balances, apply for leaves, and track approval processes.</p>
        </div>
      </div>

      {/* Available Balances Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {balances.map((b, idx) => {
          const style = getBalanceStyle(idx);
          const percent = b.total_days > 0 ? (b.available_days / b.total_days) * 100 : 0;
          return (
            <motion.div
              key={b.id}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className={`relative overflow-hidden rounded-[2rem] p-6 shadow-lg text-white ${style.bg}`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br ${style.glow} filter blur-2xl opacity-50`}></div>
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${style.badge}`}>
                      FY26 QUOTA
                    </span>
                    <h4 className="font-extrabold text-base mt-2 tracking-tight line-clamp-1">{b.leave_type_name}</h4>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tight">{b.available_days}</span>
                    <span className="text-xs text-white/70 font-bold">/ {b.total_days} days remaining</span>
                  </div>
                  
                  {/* Progress Indicator */}
                  <div className="mt-4">
                    <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${style.progress}`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-extrabold text-white/80 mt-1.5">
                      <span>{percent.toFixed(0)}% Available</span>
                      <span>{b.total_days - b.available_days} Used</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        {balances.length === 0 && (
          <div className="col-span-full p-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
            <AlertCircle size={24} className="mx-auto text-slate-400 mb-2" />
            <p className="text-xs text-slate-400 font-bold">No active balances configured for this fiscal year.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Apply Form & History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Manager Approvals Dashboard */}
          {['manager', 'hr_admin', 'super_admin', 'hrbp', 'hr'].includes(role) && teamRequests.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 border border-slate-100 shadow-md relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-amber-500/5 filter blur-3xl"></div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Clock className="text-amber-500 shrink-0" size={16} /> Pending Team Leaves ({teamRequests.length})
              </h3>
              
              <div className="space-y-4">
                {teamRequests.map(req => (
                  <div 
                    key={req.id} 
                    className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-amber-200 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-violet-600/10 text-violet-700 flex items-center justify-center font-black text-xs">
                          {req.employee_name ? req.employee_name.charAt(0) : 'E'}
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-slate-900">{req.employee_name || 'Team Associate'}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{req.employee_id || `EMP00${req.employee}`}</span>
                            <span className="text-[9px] text-slate-350">•</span>
                            <span className="text-[10px] text-slate-400 font-bold">{req.leave_type_name}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-slate-500 mt-1">
                        📅 {req.start_date} to {req.end_date} 
                        <span className="ml-1 text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full text-[10px] font-black">
                          {req.number_of_days} days
                        </span>
                      </p>
                      <p className="text-xs text-slate-600 font-medium italic bg-white border border-slate-100 p-2.5 rounded-xl mt-2 leading-relaxed">
                        "{req.reason}"
                      </p>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto shrink-0">
                      <button 
                        onClick={() => handleAction(req.id, true)} 
                        className="flex-1 md:flex-none px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button 
                        onClick={() => handleAction(req.id, false)} 
                        className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Apply Leave Panel */}
          <motion.div 
            ref={applyFormRef}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white/80 backdrop-blur-md rounded-[2rem] p-6 border transition-all duration-500 shadow-md relative overflow-hidden ${
              isApplyRoute 
                ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-[0_20px_50px_rgba(124,58,237,0.15)]' 
                : 'border-slate-100'
            }`}
          >
            {isApplyRoute && (
              <div className="absolute top-3 right-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Sparkles size={10} className="animate-spin" /> Quick Application Active
              </div>
            )}

            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Calendar className="text-violet-600" size={16} /> Apply for Leave
            </h3>
            
            <form onSubmit={handleApplyLeave} className="space-y-5">
              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-extrabold flex items-center gap-2"
                >
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  {successMsg}
                </motion.div>
              )}
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-extrabold flex items-center gap-2"
                >
                  <AlertCircle size={16} className="text-rose-600" />
                  {errorMsg}
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Leave Type</label>
                  <select 
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-bold focus:outline-none focus:border-violet-500 focus:bg-white transition-all shadow-inner"
                  >
                    <option value="">Select Type</option>
                    {leaveTypes.map(lt => (
                      <option key={lt.id} value={lt.id}>{lt.name} (Max {lt.max_days_per_year} days)</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Start Date</label>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-bold focus:outline-none focus:border-violet-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">End Date</label>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-bold focus:outline-none focus:border-violet-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Reason for Leave</label>
                <textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows="3"
                  required
                  placeholder="Provide brief details describing your request..."
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-bold focus:outline-none focus:border-violet-500 focus:bg-white transition-all shadow-inner resize-none leading-relaxed"
                ></textarea>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  className="px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <Send size={12} /> Submit Application
                </button>
              </div>
            </form>
          </motion.div>

        </div>

        {/* Right Column: My Applications */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 border border-slate-100 shadow-md h-full flex flex-col justify-between"
          >
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-50 pb-3">
                <FileText className="text-violet-600" size={16} /> My Leave Requests
              </h3>
              
              <div className="space-y-3 max-h-[450px] overflow-y-auto no-scrollbar pr-1">
                {myApplications.map(app => {
                  const statusColors = {
                    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
                    pending: 'bg-amber-50 text-amber-700 border-amber-200'
                  };
                  const statusColor = statusColors[app.status] || 'bg-slate-50 text-slate-500 border-slate-200';
                  
                  return (
                    <motion.div 
                      key={app.id} 
                      whileHover={{ scale: 1.01 }}
                      className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col gap-3 hover:border-slate-350 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-extrabold text-xs text-slate-900">{app.leave_type_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            {app.start_date} to {app.end_date}
                          </p>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border flex items-center gap-1 ${statusColor}`}>
                          {app.status === 'approved' && <CheckCircle2 size={10} />}
                          {app.status === 'rejected' && <XCircle size={10} />}
                          {app.status === 'pending' && <Clock size={10} />}
                          {app.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-white/70 border border-slate-100 p-2.5 rounded-xl">
                        <span className="text-[10px] font-black text-slate-400">Duration</span>
                        <span className="text-xs font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
                          {app.number_of_days} days
                        </span>
                      </div>

                      {app.approval_remarks && (
                        <div className="text-[9px] font-semibold text-slate-400 bg-slate-100 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                          <span className="font-black block text-slate-500 uppercase tracking-wide text-[8px] mb-0.5">Approval Remarks</span>
                          "{app.approval_remarks}"
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                {myApplications.length === 0 && (
                  <div className="py-12 text-center">
                    <AlertCircle size={20} className="mx-auto text-slate-300 mb-1.5" />
                    <p className="text-xs font-bold text-slate-400">No leave applications filed yet.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 text-[10px] text-slate-400 font-bold flex justify-between items-center">
              <span>Total Applications Filed</span>
              <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">{myApplications.length}</span>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};
