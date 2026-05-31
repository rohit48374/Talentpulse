import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, LogIn, LogOut, MapPin, ShieldCheck, 
  FileText, CheckCircle2, Calendar, Award, Hourglass, Percent, AlertCircle 
} from 'lucide-react';
import api from '../../services/api';

export const AttendancePage = () => {
  const [logs, setLogs] = useState([]);
  const [records, setRecords] = useState([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  // Live ticking clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const [recordRes, checkRes] = await Promise.all([
        api.get('/attendance/attendance/'),
        api.get('/attendance/check-in-out/')
      ]);
      
      const recordsData = recordRes.data.results || recordRes.data || [];
      const checkData = checkRes.data.results || checkRes.data || [];
      
      setRecords(recordsData);
      setLogs(checkData);

      // Check if user is checked in today
      const todayRecord = recordsData.find(r => r.date === todayStr);
      if (todayRecord && todayRecord.check_in_time && !todayRecord.check_out_time) {
        setIsCheckedIn(true);
      } else {
        setIsCheckedIn(false);
      }
    } catch (err) {
      console.error("Failed to fetch attendance metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    
    // Live Clock timer interval
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCheckInOut = async (checkIn = true) => {
    try {
      setActionMsg('');
      const payload = {
        location: 'HQ Office, Tech Hub',
        latitude: 12.9716,
        longitude: 77.5946
      };
      
      if (checkIn) {
        await api.post('/attendance/check-in-out/check_in/', payload);
        setActionMsg('Successfully checked in today! Have an amazing day at work.');
        setIsCheckedIn(true);
      } else {
        await api.post('/attendance/check-in-out/check_out/', payload);
        setActionMsg('Successfully checked out today! Have a pleasant evening.');
        setIsCheckedIn(false);
      }
      
      fetchAttendance();
    } catch (err) {
      console.error("Failed check in/out action", err);
      setActionMsg('Check in/out operation failed. Already processed today.');
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

  const todayRecord = records.find(r => r.date === todayStr);

  // Format current date & time
  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Calculate statistics
  const totalHoursThisMonth = records.reduce((acc, r) => acc + (parseFloat(r.working_hours) || 0), 0).toFixed(1);
  const presentDays = records.filter(r => r.status === 'present' || r.status === 'work_from_home').length;
  const onTimePercentage = records.length > 0 ? ((presentDays / records.length) * 100).toFixed(0) : "100";

  return (
    <div className="space-y-8 font-sans pb-16 text-slate-800">
      
      {/* Page Header */}
      <div className="relative pb-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-violet-500/5 filter blur-3xl -z-10"></div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 bg-clip-text bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950">
            Attendance Tracking
          </h1>
          <p className="text-slate-400 text-xs font-semibold mt-1">Real-time check-in, check-out, and log verification portal.</p>
        </div>
      </div>

      {/* Bento KPI Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI 1: Active Status */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-emerald-500/5 filter blur-2xl"></div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">TODAY'S STATUS</span>
            <h4 className="text-2xl font-black text-slate-900 mt-1">
              {isCheckedIn ? 'Active Work' : todayRecord?.check_out_time ? 'Shift Closed' : 'Not Clocked In'}
            </h4>
            <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 w-max mt-3 border ${
              isCheckedIn ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isCheckedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              {isCheckedIn ? 'Checked In' : 'Off Duty'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/50 flex items-center justify-center shadow-sm">
            <ShieldCheck size={20} />
          </div>
        </motion.div>

        {/* KPI 2: Total Hours */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-violet-500/5 filter blur-2xl"></div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">TOTAL HOURS WORKED</span>
            <h4 className="text-2xl font-black text-slate-900 mt-1">{totalHoursThisMonth} hrs</h4>
            <span className="text-[9px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 w-max mt-3 bg-violet-50 text-violet-600 border border-violet-100">
              <Hourglass size={10} /> Active Month aggregate
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 border border-violet-100/50 flex items-center justify-center shadow-sm">
            <Clock size={20} />
          </div>
        </motion.div>

        {/* KPI 3: Punctuality */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-sky-500/5 filter blur-2xl"></div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">PUNCTUALITY RATE</span>
            <h4 className="text-2xl font-black text-slate-900 mt-1">{onTimePercentage}%</h4>
            <span className="text-[9px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 w-max mt-3 bg-sky-50 text-sky-600 border border-sky-100">
              <Percent size={10} /> Standard SLA met
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100/50 flex items-center justify-center shadow-sm">
            <Award size={20} />
          </div>
        </motion.div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Check In Panel & Live Clock */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 border border-slate-100 shadow-md relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-violet-500/5 filter blur-3xl"></div>
          
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Clock className="text-violet-600 shrink-0" size={16} /> Workplace Access
            </h3>
            
            {/* Live digital clock card */}
            <div className="p-5 bg-gradient-to-br from-violet-600/90 to-indigo-700/90 text-white rounded-3xl shadow-md text-center relative overflow-hidden mb-6">
              <div className="absolute -bottom-10 -right-10 w-24 h-24 rounded-full bg-white/5 filter blur-xl"></div>
              <p className="text-[9px] font-black uppercase tracking-widest text-violet-200">REALTIME TIMECLOCK</p>
              <h2 className="text-3xl font-black tracking-tight mt-1 bg-clip-text bg-gradient-to-b from-white to-violet-100">{formattedTime}</h2>
              <p className="text-[10px] text-violet-200 font-bold mt-1.5 flex items-center justify-center gap-1">
                <Calendar size={10} /> {formattedDate}
              </p>
            </div>

            <div className="flex flex-col items-center py-4 text-center">
              {/* Circular Neumorphic Status Dial */}
              <div className="relative w-36 h-36 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shadow-inner mb-6 transition-all duration-500">
                <span className={`w-4 h-4 rounded-full absolute top-3 right-3 animate-pulse border-2 border-white shadow-sm ${
                  isCheckedIn ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'
                }`}></span>
                
                <motion.div 
                  animate={{ 
                    scale: isCheckedIn ? [1, 1.05, 1] : [1, 1.03, 1],
                    boxShadow: isCheckedIn 
                      ? '0 0 25px rgba(244,63,94,0.15)' 
                      : '0 0 25px rgba(124,58,237,0.15)'
                  }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className={`w-28 h-28 rounded-full flex flex-col items-center justify-center border shadow-md transition-all duration-500 ${
                    isCheckedIn 
                      ? 'bg-rose-50 border-rose-100 text-rose-600' 
                      : 'bg-violet-50 border-violet-100 text-violet-600'
                  }`}
                >
                  {isCheckedIn ? <LogOut size={32} /> : <LogIn size={32} />}
                  <span className="text-[9px] font-black uppercase tracking-widest mt-1.5">
                    {isCheckedIn ? 'Exit Unit' : 'Enter Unit'}
                  </span>
                </motion.div>
              </div>

              {actionMsg && (
                <motion.p 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-violet-50 border border-violet-100 rounded-2xl text-xs font-bold text-violet-700 leading-relaxed"
                >
                  {actionMsg}
                </motion.p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full">
            {!isCheckedIn ? (
              <button 
                onClick={() => handleCheckInOut(true)}
                disabled={todayRecord && todayRecord.check_in_time && todayRecord.check_out_time}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-black rounded-2xl shadow-[0_8px_20px_-8px_rgba(124,58,237,0.5)] hover:shadow-[0_8px_20px_-8px_rgba(124,58,237,0.8)] transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <LogIn size={16} /> Check In Shift
              </button>
            ) : (
              <button 
                onClick={() => handleCheckInOut(false)}
                className="w-full py-4 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white text-sm font-black rounded-2xl shadow-[0_8px_20px_-8px_rgba(244,63,94,0.3)] hover:shadow-[0_8px_20px_-8px_rgba(244,63,94,0.5)] transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <LogOut size={16} /> Check Out Shift
              </button>
            )}
            
            {todayRecord && todayRecord.check_in_time && todayRecord.check_out_time && (
              <p className="text-[10px] text-slate-400 font-bold text-center mt-1">🎉 shift completed successfully today</p>
            )}
          </div>
        </motion.div>

        {/* Attendance Records List */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 border border-slate-100 shadow-md h-full flex flex-col justify-between"
          >
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-50 pb-3">
                <FileText className="text-violet-600" size={16} /> Attendance Records
              </h3>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                {records.map(rec => {
                  const statusStyles = {
                    present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    work_from_home: 'bg-teal-50 text-teal-700 border-teal-200',
                    leave: 'bg-blue-50 text-blue-700 border-blue-200',
                    absent: 'bg-rose-50 text-rose-700 border-rose-200',
                  };
                  const statusStyle = statusStyles[rec.status] || 'bg-slate-50 text-slate-500 border-slate-200';
                  
                  return (
                    <div 
                      key={rec.id} 
                      className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-350 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-extrabold text-sm text-slate-900">{new Date(rec.date).toDateString()}</p>
                        <div className="text-xs text-slate-500 font-semibold flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1">🟢 Clock In: <strong className="text-slate-700 font-extrabold">{rec.check_in_time || 'N/A'}</strong></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                          <span className="flex items-center gap-1">🔴 Clock Out: <strong className="text-slate-700 font-extrabold">{rec.check_out_time || 'N/A'}</strong></span>
                          
                          {rec.working_hours && (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                              <span className="font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
                                {rec.working_hours} hours
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl border flex items-center gap-1 shrink-0 ${statusStyle}`}>
                        <CheckCircle2 size={10} /> {rec.status.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
                {records.length === 0 && (
                  <div className="py-12 text-center">
                    <AlertCircle size={24} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-400">No shift hours recorded for this period.</p>
                  </div>
                )}
              </div>
            </div>

            {/* GPS Logs Audit Card */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin className="text-violet-600" size={14} /> GPS Trail Audit
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[140px] overflow-y-auto no-scrollbar pr-1">
                {logs.slice(0, 4).map(log => (
                  <div key={log.id} className="p-3 bg-slate-50 border border-slate-150 rounded-2xl flex justify-between items-center hover:bg-slate-100 transition-all">
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-[10px] text-slate-900 uppercase tracking-wide">
                        {log.check_type.replace('_', ' ')}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                        <MapPin size={8} className="text-slate-400 shrink-0" /> {log.location || 'HQ Office'}
                      </p>
                    </div>
                    <span className="text-[9px] font-black text-slate-500 bg-white border border-slate-100 px-2 py-0.5 rounded-lg shadow-sm">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <p className="text-[10px] text-slate-400 font-bold py-3 text-center col-span-full border border-dashed border-slate-200 rounded-2xl">
                    No GPS positioning events stored.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};
