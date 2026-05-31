import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';

// Dynamic Icon Loader
const DynamicIcon = ({ name, className, size = 20 }) => {
  const IconComponent = LucideIcons[name] || LucideIcons.HelpCircle;
  return <IconComponent className={className} size={size} />;
};

// Sleek Bento KPI Card
const BentoKpiCard = ({ title, value, icon, trend, color }) => {
  const colorMap = {
    emerald: { bg: 'bg-emerald-50/50', text: 'text-emerald-600', border: 'border-emerald-100/80', glow: 'from-emerald-400/20 to-transparent' },
    blue: { bg: 'bg-blue-50/50', text: 'text-blue-600', border: 'border-blue-100/80', glow: 'from-blue-400/20 to-transparent' },
    amber: { bg: 'bg-amber-50/50', text: 'text-amber-600', border: 'border-amber-100/80', glow: 'from-amber-400/20 to-transparent' },
    purple: { bg: 'bg-purple-50/50', text: 'text-purple-600', border: 'border-purple-100/80', glow: 'from-purple-400/20 to-transparent' },
    indigo: { bg: 'bg-indigo-50/50', text: 'text-indigo-600', border: 'border-indigo-100/80', glow: 'from-indigo-400/20 to-transparent' },
    rose: { bg: 'bg-rose-50/50', text: 'text-rose-600', border: 'border-rose-100/80', glow: 'from-rose-400/20 to-transparent' },
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      whileHover={{
        y: -4,
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)'
      }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex justify-between items-start cursor-default relative overflow-hidden`}
    >
      {/* Decorative gradient light */}
      <div className={`absolute top-0 right-0 w-28 h-28 rounded-full bg-gradient-to-br ${selectedColor.glow} filter blur-2xl opacity-40`}></div>

      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">{title}</p>
          <h3 className="text-3xl font-black text-slate-850 tracking-tight">{value}</h3>
        </div>
        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 w-max mt-4 bg-slate-50 border border-slate-150 text-slate-500 shadow-sm`}>
          <LucideIcons.Activity size={10} className={selectedColor.text} /> {trend}
        </span>
      </div>
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${selectedColor.bg} ${selectedColor.text} ${selectedColor.border} relative z-10 shadow-sm`}>
        <DynamicIcon name={icon} size={20} />
      </div>
    </motion.div>
  );
};

// Master Bento Container Card
const BentoWidget = ({ title, children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4 }}
    whileHover={{ y: -3 }}
    className={`bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 transition-all duration-300 ${className}`}
  >
    <div className="flex justify-between items-center mb-5 border-b border-slate-50 pb-3">
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">{title}</h3>
      <button className="text-slate-400 hover:text-slate-600 transition-colors"><LucideIcons.MoreHorizontal size={18} /></button>
    </div>
    {children}
  </motion.div>
);


export const Dashboard = () => {
  const { user, employee, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pieActiveIndex, setPieActiveIndex] = useState(-1);
  const [departments, setDepartments] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFlowDept, setSelectedFlowDept] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [activeMeetingRound, setActiveMeetingRound] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [videoActive, setVideoActive] = useState(true);
  const [audioActive, setAudioActive] = useState(true);
  const [stream, setStream] = useState(null);
  const [evalOutcome, setEvalOutcome] = useState('pending');
  const [evalRating, setEvalRating] = useState(3);
  const [evalFeedback, setEvalFeedback] = useState('');
  const [submittingEval, setSubmittingEval] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const videoRef = useRef(null);
  const videoRefCandidate = useRef(null);

  const firstName = user?.full_name?.split(' ')[0] || user?.first_name || 'User';
  const role = user?.role?.toLowerCase() || 'employee';
  const roleTitle = user?.role ? user.role.toUpperCase().replace('_', ' ') : 'Employee';
  const isAdmin = role === 'admin';

  const profileImageUrl = user?.profile_image
    ? (user.profile_image.startsWith('http') ? user.profile_image : `http://${window.location.hostname}:8000${user.profile_image}`)
    : employee?.user_profile_image
      ? (employee.user_profile_image.startsWith('http') ? employee.user_profile_image : `http://${window.location.hostname}:8000${employee.user_profile_image}`)
      : null;

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const hasRecruitmentAccess = ['manager', 'hr', 'recruiter', 'admin'].includes(role);
        const [dashRes, deptRes, usersRes, intRes] = await Promise.allSettled([
          api.get('/dashboard/'),
          api.get('/departments/?page_size=1000'),
          api.get('/users/?page_size=1000'),
          hasRecruitmentAccess ? api.get('/recruitment/interview-rounds/?page_size=1000') : Promise.resolve({ data: [] })
        ]);

        if (dashRes.status === 'fulfilled') {
          setData(dashRes.value.data);
        }
        if (deptRes.status === 'fulfilled') {
          setDepartments(deptRes.value.data.results || deptRes.value.data || []);
        }
        if (usersRes.status === 'fulfilled') {
          setUsersList(usersRes.value.data.results || usersRes.value.data || []);
        }
        if (intRes.status === 'fulfilled') {
          setInterviews(intRes.value.data.results || intRes.value.data || []);
        }
      } catch (error) {
        console.error("Failed to load dynamic bento dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [authLoading, user, role]);

  // WebRTC Webcam Stream Capturer
  useEffect(() => {
    if (activeMeetingRound && videoActive) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          .then(s => {
            setStream(s);
            if (videoRef.current) {
              videoRef.current.srcObject = s;
            }
            if (videoRefCandidate.current) {
              videoRefCandidate.current.srcObject = s;
            }
          })
          .catch(err => {
            console.error("Camera access failed for local paired session:", err);
          });
      } else {
        console.warn("Webcam access not supported on non-HTTPS mobile connections");
      }
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeMeetingRound, videoActive]);

  // Real-time Chat Sync Polling Loop
  useEffect(() => {
    if (!activeMeetingRound) return;

    const fetchChatMessages = async () => {
      try {
        const response = await api.get(`/recruitment/interview-rounds/${activeMeetingRound.id}/chat/`);
        const mapped = response.data.map(msg => ({
          sender: msg.sender_type === 'interviewer' ? 'You' : (activeMeetingRound.candidate_name || 'Candidate'),
          text: msg.message,
          timestamp: msg.timestamp
        }));
        if (mapped.length === 0) {
          setChatMessages([
            { sender: 'System', text: 'Live Evaluation Lobby active. The candidate webcam feed is synchronized. Enter chat, checklist, or evaluations on the side panel.' }
          ]);
        } else {
          setChatMessages(mapped);
        }
      } catch (err) {
        console.error("Failed to sync live chat in dashboard:", err);
      }
    };

    fetchChatMessages();
    const interval = setInterval(fetchChatMessages, 2000);
    return () => clearInterval(interval);
  }, [activeMeetingRound]);

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeMeetingRound) return;
    const textToSend = chatInput;
    setChatInput('');
    try {
      setChatMessages(prev => [...prev, { sender: 'You', text: textToSend }]);
      await api.post(`/recruitment/interview-rounds/${activeMeetingRound.id}/chat/`, { message: textToSend });
    } catch (err) {
      console.error("Failed to send chat message in dashboard:", err);
    }
  };

  const handleOnboardEvaluationSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingEval(true);
      setErrorMsg('');
      setSuccessMsg('');
      await api.patch(`/recruitment/interview-rounds/${activeMeetingRound.id}/`, {
        outcome: evalOutcome,
        rating: Number(evalRating),
        feedback: evalFeedback,
        status: 'completed'
      });

      if (evalOutcome === 'pass') {
        const nextStatus = activeMeetingRound.interview_type === 'hr' ? 'selected' : 'shortlisted';
        await api.patch(`/recruitment/candidates/${activeMeetingRound.candidate}/`, {
          status: nextStatus
        });
        setSuccessMsg(`Interview evaluated as PASS! Candidate ${activeMeetingRound.candidate_name} status updated to ${nextStatus.toUpperCase()}.`);
      } else if (evalOutcome === 'fail') {
        await api.patch(`/recruitment/candidates/${activeMeetingRound.candidate}/`, {
          status: 'rejected'
        });
        setSuccessMsg(`Interview evaluated as FAIL! Candidate ${activeMeetingRound.candidate_name} rejected.`);
      } else {
        setSuccessMsg(`Interview evaluation recorded successfully for ${activeMeetingRound.candidate_name}!`);
      }

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setActiveMeetingRound(null);

      // Refresh operations
      const [dashRes, intRes] = await Promise.allSettled([
        api.get('/dashboard/'),
        api.get('/recruitment/interview-rounds/?page_size=1000')
      ]);
      if (dashRes.status === 'fulfilled') setData(dashRes.value.data);
      if (intRes.status === 'fulfilled') setInterviews(intRes.value.data.results || intRes.value.data || []);

    } catch (err) {
      setErrorMsg('Failed to upload evaluation metrics.');
    } finally {
      setSubmittingEval(false);
    }
  };

  if (authLoading || (loading && !data)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
          <div className="absolute text-[10px] font-black text-violet-600 uppercase tracking-widest animate-pulse">TP</div>
        </div>
      </div>
    );
  }

  if (!data) return null;


  if (role === 'employee' && !employee?.department && !user?.department) {
    return (
      <div className="max-w-xl mx-auto py-4 flex items-center justify-center min-h-[80vh] font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden relative w-full"
        >
          {/* Top colored accent bar */}
          <div className="h-2 bg-gradient-to-r from-amber-500 via-[#6345ED] to-blue-650"></div>

          <div className="p-6 md:p-8 text-center flex flex-col items-center">
            {/* Animated Pending Badge Icon */}
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-inner mb-4 relative">
              <div className="absolute inset-0 rounded-2xl bg-amber-400/10 animate-ping pointer-events-none"></div>
              <LucideIcons.ShieldAlert size={28} className="animate-pulse" />
            </div>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-2">Account Pending Onboarding</h2>

            <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed max-w-md mb-6">
              Welcome to the <span className="font-bold text-slate-800">Hirevant HRMS</span> network!
              Your enterprise profile has been registered successfully with <span className="font-semibold text-[#6345ED] bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-100 shadow-sm">Basic Access</span>.
              Our Human Resources team is currently reviewing your profile to assign your official <strong>Department, Designation, and Reporting Manager</strong>.
            </p>

            <div className="w-full bg-slate-50/60 border border-slate-150 rounded-2xl p-4 text-left space-y-3 max-w-md mb-6 shadow-inner">
              <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-200/60 pb-1.5 mb-1.5">Registered Corporate Details</h4>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Employee ID</span>
                  <p className="font-extrabold text-xs text-slate-800 mt-0.5">{user?.employee_id || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Full Name</span>
                  <p className="font-extrabold text-xs text-slate-800 mt-0.5">{user?.full_name}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Work Email</span>
                  <p className="font-extrabold text-xs text-slate-800 mt-0.5 truncate">{user?.email}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Phone Number</span>
                  <p className="font-extrabold text-xs text-slate-800 mt-0.5">{user?.phone || 'Not Provided'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center w-full max-w-md">
              <Link
                to="/profile/edit"
                className="w-full py-3 bg-[#6345ED] hover:bg-[#5235D6] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                <LucideIcons.User size={14} /> Complete Personal Profile
              </Link>
              <Link
                to="/profile"
                className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                View Profile Details
              </Link>
            </div>

            <p className="text-[9px] text-slate-400 font-bold mt-6 flex items-center gap-1.5 uppercase tracking-widest">
              <LucideIcons.ShieldAlert size={10} className="text-slate-400" /> SOC2 COMPLIANT & SECURED ENTERPRISE NETWORK
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (activeMeetingRound) {
    return (
      <div className="space-y-6 font-sans pb-16 text-slate-800 text-left">

        {/* Lobby Header */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-600" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center shrink-0">
              <LucideIcons.Video size={20} className="animate-pulse text-violet-600" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">Live Interview & Assessment Suite</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Round: {activeMeetingRound.interview_type} • Candidate: {activeMeetingRound.candidate_name}</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (stream) {
                stream.getTracks().forEach(track => track.stop());
              }
              setActiveMeetingRound(null);
            }}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-black rounded-xl transition-all cursor-pointer"
          >
            Exit Lobby
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* Left Column: Live feeds & Chat (8/12) */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Live Camera grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Interviewer self-camera */}
              <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden aspect-video relative flex flex-col justify-end shadow-sm">
                {videoActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                    <LucideIcons.Users size={48} className="text-slate-300 animate-pulse" />
                  </div>
                )}

                {/* Status indicator */}
                <div className="absolute top-4 left-4 bg-slate-900/70 px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md border border-white/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-200">You (Interviewer)</span>
                </div>

                <div className="z-10 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-white tracking-wider">{user?.full_name || 'Interviewer'}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setVideoActive(!videoActive)}
                      className={`p-2 rounded-xl border cursor-pointer transition-all ${videoActive ? 'bg-white/10 border-white/10 text-white' : 'bg-rose-500/20 border-rose-500/30 text-rose-400'}`}
                    >
                      {videoActive ? <LucideIcons.Video size={13} /> : <LucideIcons.VideoOff size={13} />}
                    </button>
                    <button
                      onClick={() => setAudioActive(!audioActive)}
                      className={`p-2 rounded-xl border cursor-pointer transition-all ${audioActive ? 'bg-white/10 border-white/10 text-white' : 'bg-rose-500/20 border-rose-500/30 text-rose-400'}`}
                    >
                      {audioActive ? <LucideIcons.Mic size={13} /> : <LucideIcons.MicOff size={13} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Candidate Simulated/Real feed */}
              <div className="bg-[#0C061A] rounded-[2rem] overflow-hidden aspect-video relative flex flex-col justify-end shadow-md border border-slate-950">
                {videoActive ? (
                  <video
                    ref={videoRefCandidate}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-violet-600/10 border border-violet-500/30 flex items-center justify-center mb-3">
                      <LucideIcons.Users size={30} className="text-violet-400" />
                    </div>
                    <span className="text-xs font-black text-white">{activeMeetingRound.candidate_name}</span>
                    <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest mt-1">Applicant Feed Connected</span>
                  </div>
                )}

                <div className="absolute top-4 left-4 bg-slate-955/70 px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md border border-white/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-200">Candidate Webcam Stream</span>
                </div>

                <div className="z-10 bg-[#07030E]/60 p-4 text-center">
                  <span className="text-[9px] font-bold text-slate-400">Feed verified • HD quality active</span>
                </div>
              </div>

            </div>

            {/* Chat section */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-5 flex flex-col gap-4 flex-1 min-h-[300px] max-h-[450px] shadow-sm">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-1.5"><LucideIcons.MessageSquare size={13} className="text-violet-600" /> Meeting Chat Feed</h3>

              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 select-text">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-0.5">{msg.sender}</span>
                    <div className={`px-4 py-2.5 rounded-2xl text-xs font-semibold max-w-[80%] ${msg.sender === 'You' ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleSendChatMessage}
                className="flex gap-3 mt-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-violet-500 focus:bg-white transition-all shadow-inner"
                  placeholder="Type a message to the candidate..."
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-[#6345ED] hover:bg-[#5235D6] text-white text-xs font-black rounded-2xl shadow-md cursor-pointer transition-all"
                >
                  Send
                </button>
              </form>
            </div>

          </div>

          {/* Right Column: Profile Specs & Evaluation (4/12) */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Candidate Specs & Grades checklist */}
            <div className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm space-y-6">

              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-2 mb-3">Live Candidate Dossier</h3>

                {/* Dynamic Fresher Experience/Grades Checklist */}
                <div className="space-y-4 text-xs font-semibold text-slate-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Years of Experience</span>
                      <p className="font-extrabold text-slate-900 mt-0.5">{activeMeetingRound.experience || 'Fresher Student'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Education Details</span>
                      <p className="font-extrabold text-slate-900 mt-0.5">{activeMeetingRound.education_details || 'Graduate'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">College Name</span>
                      <p className="font-extrabold text-slate-900 mt-0.5">{activeMeetingRound.college || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Disclosed CGPA</span>
                      <p className="font-extrabold text-[#6345ED] mt-0.5">{activeMeetingRound.cgpa || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">10th Percentage</span>
                      <p className="font-extrabold text-slate-900 mt-0.5">{activeMeetingRound.tenth_percentage ? `${activeMeetingRound.tenth_percentage}%` : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">12th / Inter %</span>
                      <p className="font-extrabold text-slate-900 mt-0.5">{activeMeetingRound.inter_percentage ? `${activeMeetingRound.inter_percentage}%` : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Preferred Locations</span>
                      <p className="font-extrabold text-slate-900 mt-0.5">{activeMeetingRound.preferred_locations || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Active Backlog Status</span>
                      <span className={`inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg border mt-1 ${Number(activeMeetingRound.backlogs) > 0
                        ? 'bg-rose-50 border-rose-100 text-rose-700'
                        : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        }`}>
                        {Number(activeMeetingRound.backlogs) > 0 ? `${activeMeetingRound.backlogs} backlogs` : 'No backlogs (Clear)'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Key Skills</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {activeMeetingRound.skills ? activeMeetingRound.skills.split(',').map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[9px] font-black text-slate-600 uppercase tracking-wider">{s.trim()}</span>
                      )) : <span className="text-[9px] text-slate-500 font-semibold">None listed</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Evaluation score form */}
              <form onSubmit={handleOnboardEvaluationSubmit} className="space-y-4 border-t border-slate-50 pt-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest pb-1 flex items-center gap-1"><LucideIcons.CheckCircle2 size={14} className="text-violet-600" /> Evaluation Grades</h3>

                {errorMsg && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold">{errorMsg}</div>}
                {successMsg && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-bold">{successMsg}</div>}

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400">Select Outcome</label>
                  <select
                    value={evalOutcome}
                    onChange={e => setEvalOutcome(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold focus:outline-none shadow-inner"
                  >
                    <option value="pending">Pending decision...</option>
                    <option value="pass">PASS (Shortlist & Proceed)</option>
                    <option value="fail">FAIL (Reject Application)</option>
                    <option value="hold">HOLD (Evaluate Later)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400">Score Rating (1 - 5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    required
                    value={evalRating}
                    onChange={e => setEvalRating(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400">Evaluation Notes / Feedback</label>
                  <textarea
                    rows="3"
                    required
                    value={evalFeedback}
                    onChange={e => setEvalFeedback(e.target.value)}
                    placeholder="Provide technical evaluation grades, fresher backlogs details, communication scores..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingEval}
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-70"
                >
                  {submittingEval ? 'Saving Assessment...' : 'Submit Final Evaluation'}
                </button>
              </form>

            </div>

          </div>

        </div>

      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 pb-16 font-sans text-slate-700"
    >

      {/* Dynamic Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Welcome back, {firstName}</h1>
          <p className="text-slate-500 text-sm font-semibold mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Here's your <span className="font-bold text-slate-800 tracking-wide uppercase bg-violet-50 text-[#6345ED] px-2.5 py-0.5 rounded-lg border border-violet-100 shadow-sm">{roleTitle}</span> overview.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2 hover:-translate-y-0.5"
          >
            <LucideIcons.RefreshCw size={14} /> Refresh Operations
          </button>
        </div>
      </motion.div>

      {/* Dynamic Bento KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.stats_cards.map((card, i) => (
          <BentoKpiCard
            key={i}
            title={card.title}
            value={card.value}
            icon={card.icon}
            trend={card.trend}
            color={card.color}
          />
        ))}
      </div>

      {/* Dynamic Bento Quick Actions */}
      {data.quick_actions && data.quick_actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
        >
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <LucideIcons.Zap size={14} className="text-violet-500 animate-pulse" /> Dynamic Quick Actions
          </p>
          <div className="flex flex-wrap gap-4">
            {data.quick_actions.map((act, idx) => (
              <Link
                key={idx}
                to={act.path}
                className="px-5 py-3.5 bg-gradient-to-r from-violet-50 to-blue-50 hover:from-violet-100 hover:to-blue-100 border border-violet-100/50 hover:border-violet-200/50 text-[#6345ED] text-xs font-black rounded-2xl shadow-sm transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-md"
              >
                {act.title}
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Upcoming Scheduled Evaluation Sessions */}
      {['manager', 'hr', 'recruiter', 'admin'].includes(role) && interviews.length > 0 && (() => {
        const myUpcomingInterviews = interviews.filter(int => {
          if (['admin', 'hr', 'recruiter'].includes(role)) {
            return int.status === 'scheduled';
          }
          return int.status === 'scheduled' && Number(int.interviewer) === Number(user?.id);
        });

        if (myUpcomingInterviews.length === 0) return null;

        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-violet-400/20 to-transparent filter blur-2xl opacity-40"></div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <div>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                  <LucideIcons.Calendar className="text-[#6345ED] animate-pulse" size={14} /> Scheduled Evaluation Sessions
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">You have {myUpcomingInterviews.length} upcoming interview(s) to conduct</p>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl bg-violet-50 text-[#6345ED] border border-violet-100 shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live Lobby
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myUpcomingInterviews.map((int) => (
                <motion.div
                  key={int.id}
                  whileHover={{ y: -4 }}
                  className="bg-slate-50/50 hover:bg-white rounded-2xl p-5 border border-slate-100 hover:border-violet-200 transition-all flex flex-col justify-between gap-4 shadow-sm hover:shadow-md relative text-left"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[8.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-violet-50 border border-violet-100 text-[#6345ED]">
                        {int.interview_type} Round
                      </span>
                      <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        #{int.id}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-800 tracking-tight mt-3">{int.candidate_name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1.5">Job: <span className="text-slate-700 font-extrabold">{int.requisition_title || 'General Job Position'}</span></p>
                    <p className="text-[10.5px] text-violet-600 font-black mt-2 flex items-center gap-1">
                      <LucideIcons.Clock size={12} /> {new Date(int.scheduled_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveMeetingRound(int);
                      setEvalOutcome(int.outcome || 'pending');
                      setEvalRating(int.rating || 3);
                      setEvalFeedback(int.feedback || '');
                      setChatMessages([
                        { sender: 'System', text: 'Live Evaluation Lobby active. The candidate webcam feed is synchronized. Enter chat, checklist, or evaluations on the side panel.' }
                      ]);
                    }}
                    className="w-full py-2.5 bg-[#6345ED] hover:bg-[#5235D6] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 hover:-translate-y-0.5"
                  >
                    <LucideIcons.Video size={13} /> Launch Interview Screen
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      })()}

      {/* Helper to Render Individual Bento Widgets */}
      {(() => {
        const renderWidget = (widget, i) => {

          // 1. Attendance Summary Widget
          if (widget.type === 'attendance_summary') {
            const chartData = [
              { name: 'Present', value: widget.data.present || 0, grad: 'url(#presentGrad)' },
              { name: 'Absent', value: widget.data.absent || 0, grad: 'url(#absentGrad)' },
              { name: 'Leave', value: widget.data.leave || 0, grad: 'url(#leaveGrad)' }
            ].filter(d => d.value > 0);

            const colors = ['#10B981', '#F43F5E', '#3B82F6'];

            return (
              <BentoWidget key={i} title={widget.title}>
                <div className="flex flex-col items-center justify-center py-4">
                  {chartData.length > 0 ? (
                    <div className="h-48 w-full relative flex items-center justify-center">
                      <ResponsiveContainer>
                        <PieChart>
                          <defs>
                            <linearGradient id="presentGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#34D399" />
                              <stop offset="100%" stopColor="#10B981" />
                            </linearGradient>
                            <linearGradient id="absentGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#FB7185" />
                              <stop offset="100%" stopColor="#F43F5E" />
                            </linearGradient>
                            <linearGradient id="leaveGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#60A5FA" />
                              <stop offset="100%" stopColor="#3B82F6" />
                            </linearGradient>
                          </defs>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            dataKey="value"
                            paddingAngle={3}
                          >
                            {chartData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.grad} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '10px', fontWeight: 'bold' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute text-center select-none pointer-events-none">
                        <span className="text-xl font-black text-slate-800 leading-none block">
                          {chartData.reduce((acc, curr) => acc + curr.value, 0)}
                        </span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5 block">Logged</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-slate-400 py-12">No attendance logged this month</p>
                  )}
                  <div className="flex gap-4 mt-4 justify-center w-full">
                    {chartData.map((d, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-lg shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }}></span>
                        {d.name} ({d.value})
                      </div>
                    ))}
                  </div>
                </div>
              </BentoWidget>
            );
          }

          // 2. Leave Balance Widget
          if (widget.type === 'leave_balance') {
            return (
              <BentoWidget key={i} title={widget.title} className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                  {widget.data.map((bal, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-violet-200 transition-colors flex flex-col justify-between gap-3 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h4 className="font-extrabold text-sm text-slate-800">{bal.type}</h4>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-violet-50 text-[#6345ED] border border-violet-100">FY26</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-black text-slate-900">{bal.available}</span>
                        <span className="text-xs text-slate-400 font-bold">/ {bal.total} remaining</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-[#6345ED] h-full rounded-full transition-all duration-500"
                          style={{ width: `${(bal.available / bal.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {widget.data.length === 0 && (
                    <p className="text-xs font-semibold text-slate-400 py-12 text-center col-span-full">No active leave configuration</p>
                  )}
                </div>
              </BentoWidget>
            );
          }

          // 3. Upcoming Holidays Widget
          if (widget.type === 'upcoming_holidays') {
            return (
              <BentoWidget key={i} title={widget.title}>
                <div className="space-y-3 py-1">
                  {widget.data.map((hol, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 hover:bg-slate-50/50 transition-colors shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-[#6345ED] flex items-center justify-center shrink-0 border border-violet-100 shadow-sm">
                          <LucideIcons.Sun size={16} />
                        </div>
                        <div>
                          <p className="font-extrabold text-xs text-slate-800">{hol.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5">{new Date(hol.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Holiday</span>
                    </div>
                  ))}
                </div>
              </BentoWidget>
            );
          }

          // 4. Team Attendance Widget (Manager)
          if (widget.type === 'team_attendance') {
            return (
              <BentoWidget key={i} title={widget.title} className="lg:col-span-2">
                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer>
                    <BarChart data={widget.data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="teamAttGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#C084FC" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontBold: true }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontBold: true }} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '10px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="present" fill="url(#teamAttGrad)" radius={[8, 8, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </BentoWidget>
            );
          }

          // 5. Employees on Leave Today Widget (Manager)
          if (widget.type === 'employees_on_leave') {
            return (
              <BentoWidget key={i} title={widget.title}>
                <div className="space-y-3.5 py-1 max-h-64 overflow-y-auto pr-1 no-scrollbar">
                  {widget.data.map((lv, idx) => {
                    const leaveThemes = {
                      'Sick Leave': { border: 'border-amber-100', bg: 'bg-amber-50/20', badge: 'bg-amber-50 text-amber-700 border-amber-150', icon: LucideIcons.Heart },
                      'Casual Leave': { border: 'border-blue-100', bg: 'bg-blue-50/20', badge: 'bg-blue-50 text-blue-700 border-blue-150', icon: LucideIcons.Smile },
                      'Earned Leave': { border: 'border-emerald-100', bg: 'bg-emerald-50/20', badge: 'bg-emerald-50 text-emerald-700 border-emerald-150', icon: LucideIcons.CalendarCheck },
                    };
                    const theme = leaveThemes[lv.type] || { border: 'border-rose-100', bg: 'bg-rose-50/20', badge: 'bg-rose-50 text-rose-700 border-rose-150', icon: LucideIcons.Calendar };
                    const LeaveIcon = theme.icon;

                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.015 }}
                        className={`flex justify-between items-center p-3.5 rounded-2xl border ${theme.border} ${theme.bg} shadow-sm transition-all duration-300`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl ${theme.badge} border flex items-center justify-center shrink-0 shadow-sm`}>
                            <LeaveIcon size={15} />
                          </div>
                          <div>
                            <p className="font-extrabold text-xs text-slate-800 tracking-tight">{lv.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
                              {lv.type}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg shrink-0 ${theme.badge}`}>
                          {lv.days} Days
                        </span>
                      </motion.div>
                    );
                  })}
                  {widget.data.length === 0 && (
                    <div className="text-center py-12">
                      <LucideIcons.Sun className="mx-auto text-slate-350 mb-3 animate-spin-slow" size={36} />
                      <p className="text-xs font-black text-slate-650 uppercase tracking-widest">Fully Staffed Today</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">No team members on leave.</p>
                    </div>
                  )}
                </div>
              </BentoWidget>
            );
          }

          // 6. Department Headcount Distribution (HR)
          if (widget.type === 'department_statistics') {
            return (
              <BentoWidget key={i} title={widget.title} className="lg:col-span-2">
                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer>
                    <BarChart data={widget.data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="deptStatGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6345ED" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#38BDF8" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontBold: true }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontBold: true }} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '10px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="value" fill="url(#deptStatGrad)" radius={[8, 8, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </BentoWidget>
            );
          }

          // 7. New Joiners (HR)
          if (widget.type === 'new_joiners') {
            return (
              <BentoWidget key={i} title={widget.title}>
                <div className="space-y-3 py-1 max-h-64 overflow-y-auto pr-1 no-scrollbar">
                  {widget.data.map((nj, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 hover:bg-slate-50/50 transition-colors shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-[#6345ED] flex items-center justify-center shrink-0 border border-violet-100 shadow-sm">
                          <LucideIcons.User size={16} />
                        </div>
                        <div>
                          <p className="font-extrabold text-xs text-slate-800">{nj.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5 capitalize">{nj.role}</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">Joined</span>
                    </div>
                  ))}
                  {widget.data.length === 0 && (
                    <p className="text-xs font-semibold text-slate-400 py-12 text-center">No new joiners this month</p>
                  )}
                </div>
              </BentoWidget>
            );
          }

          // 8. Hiring Stage Tracker (Recruiter)
          if (widget.type === 'recruitment_pipeline') {
            return (
              <BentoWidget key={i} title={widget.title} className="lg:col-span-2">
                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer>
                    <BarChart data={widget.data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="recPipeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#F472B6" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontBold: true }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontBold: true }} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '10px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="count" fill="url(#recPipeGrad)" radius={[8, 8, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </BentoWidget>
            );
          }

          // 9. Audit Logs Widget (Admin)
          if (widget.type === 'audit_logs') {
            return (
              <BentoWidget key={i} title={widget.title} className="w-full">
                <div className="space-y-2 py-1 max-h-80 overflow-y-auto pr-1 no-scrollbar">
                  {widget.data.map((log, idx) => {
                    const actionColors = {
                      create: 'bg-emerald-50 text-emerald-700 border-emerald-150',
                      update: 'bg-blue-50 text-blue-700 border-blue-150',
                      delete: 'bg-rose-50 text-rose-700 border-rose-150',
                      login: 'bg-violet-50 text-violet-750 border-violet-150',
                      logout: 'bg-slate-50 text-slate-700 border-slate-150',
                    };
                    const actionStyle = actionColors[log.action] || 'bg-slate-50 text-slate-600 border-slate-150';

                    return (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 hover:bg-slate-50/50 transition-colors shadow-sm gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8.5 h-8.5 rounded-xl bg-slate-50 text-slate-450 border border-slate-150 flex items-center justify-center shrink-0">
                            <LucideIcons.Terminal size={14} className="text-violet-600" />
                          </div>
                          <div>
                            <p className="font-extrabold text-xs text-slate-800">{log.email}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                              Action: <span className="font-black uppercase">{log.action}</span> | Target: <span className="font-black">{log.model}</span>
                            </p>
                          </div>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg border shrink-0 ${actionStyle}`}>
                          {log.action}
                        </span>
                      </div>
                    );
                  })}
                  {widget.data.length === 0 && (
                    <p className="text-xs font-semibold text-slate-400 py-12 text-center">No active system events</p>
                  )}
                </div>
              </BentoWidget>
            );
          }

          // 10. Payroll Processing Summary (Payroll)
          if (widget.type === 'payroll_summary') {
            const chartData = [
              { name: 'Disbursed', value: widget.data.processed || 0, grad: 'url(#payDisbGrad)' },
              { name: 'Draft', value: widget.data.draft || 0, grad: 'url(#payDraftGrad)' },
              { name: 'Generated', value: widget.data.generated || 0, grad: 'url(#payGenGrad)' }
            ].filter(d => d.value > 0);

            const colors = ['#10B981', '#F59E0B', '#8B5CF6'];

            return (
              <BentoWidget key={i} title={widget.title}>
                <div className="flex flex-col items-center justify-center py-4">
                  {chartData.length > 0 ? (
                    <div className="h-48 w-full relative flex items-center justify-center">
                      <ResponsiveContainer>
                        <PieChart>
                          <defs>
                            <linearGradient id="payDisbGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#34D399" />
                              <stop offset="100%" stopColor="#10B981" />
                            </linearGradient>
                            <linearGradient id="payDraftGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#FBBF24" />
                              <stop offset="100%" stopColor="#F59E0B" />
                            </linearGradient>
                            <linearGradient id="payGenGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#A78BFA" />
                              <stop offset="100%" stopColor="#8B5CF6" />
                            </linearGradient>
                          </defs>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            dataKey="value"
                            paddingAngle={3}
                          >
                            {chartData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.grad} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '10px', fontWeight: 'bold' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute text-center select-none pointer-events-none">
                        <span className="text-xl font-black text-slate-800 leading-none block">
                          {chartData.reduce((acc, curr) => acc + curr.value, 0)}
                        </span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5 block">Payslips</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-slate-400 py-12 text-center">No payroll processed this month</p>
                  )}
                  <div className="flex gap-4 mt-4 justify-center w-full">
                    {chartData.map((d, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-lg shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }}></span>
                        {d.name} ({d.value})
                      </div>
                    ))}
                  </div>
                </div>
              </BentoWidget>
            );
          }

          // 11. Role Distribution Widget (Admin)
          if (widget.type === 'role_distribution') {
            const chartData = widget.data.map(r => ({
              name: r.role ? r.role.toUpperCase().replace('_', ' ') : 'UNKNOWN',
              value: r.value || 0
            }));
            const colors = ['#6345ED', '#34D399', '#38BDF8', '#F59E0B', '#F472B6', '#10B981'];

            return (
              <BentoWidget key={i} title={widget.title}>
                <div className="flex flex-col items-center justify-center py-4">
                  {chartData.length > 0 ? (
                    <div className="h-48 w-full relative flex items-center justify-center">
                      <ResponsiveContainer>
                        <PieChart>
                          <defs>
                            <linearGradient id="roleAdminGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#8B5CF6" />
                              <stop offset="100%" stopColor="#6345ED" />
                            </linearGradient>
                            <linearGradient id="roleHrGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#EC4899" />
                              <stop offset="100%" stopColor="#D946EF" />
                            </linearGradient>
                            <linearGradient id="roleManagerGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#FBBF24" />
                              <stop offset="100%" stopColor="#F59E0B" />
                            </linearGradient>
                            <linearGradient id="roleEmpGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#34D399" />
                              <stop offset="100%" stopColor="#10B981" />
                            </linearGradient>
                            <linearGradient id="roleRecGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#22D3EE" />
                              <stop offset="100%" stopColor="#0891B2" />
                            </linearGradient>
                            <linearGradient id="rolePayGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#2DD4BF" />
                              <stop offset="100%" stopColor="#0D9488" />
                            </linearGradient>
                          </defs>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            dataKey="value"
                            paddingAngle={3}
                          >
                            {chartData.map((entry, idx) => {
                              const r = entry.name?.toLowerCase() || '';
                              let fillVal = colors[idx % colors.length];
                              if (r.includes('admin')) fillVal = 'url(#roleAdminGrad)';
                              else if (r.includes('hr')) fillVal = 'url(#roleHrGrad)';
                              else if (r.includes('manager')) fillVal = 'url(#roleManagerGrad)';
                              else if (r.includes('employee')) fillVal = 'url(#roleEmpGrad)';
                              else if (r.includes('recruiter')) fillVal = 'url(#roleRecGrad)';
                              else if (r.includes('payroll')) fillVal = 'url(#rolePayGrad)';
                              return <Cell key={`cell-${idx}`} fill={fillVal} />;
                            })}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '10px', fontWeight: 'bold' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute text-center select-none pointer-events-none">
                        <span className="text-xl font-black text-slate-800 leading-none block">
                          {chartData.reduce((acc, curr) => acc + curr.value, 0)}
                        </span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5 block">Staff</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-slate-400 py-12 text-center">No active role distribution records</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-4 justify-center w-full max-h-[50px] overflow-y-auto no-scrollbar">
                    {chartData.map((d, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-lg shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }}></span>
                        {d.name} ({d.value})
                      </div>
                    ))}
                  </div>
                </div>
              </BentoWidget>
            );
          }

          // 12. Department Budgets Widget (Admin)
          if (widget.type === 'department_budgets') {
            const chartData = widget.data.map(d => ({
              name: d.name ? d.name.split(' ')[0] : 'UNKNOWN',
              budget: d.budget || 0
            }));

            return (
              <BentoWidget key={i} title={widget.title} className="lg:col-span-2">
                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="deptBudgetsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#6345ED" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontBold: true }} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 10, fontBold: true }}
                        tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                      />
                      <Tooltip
                        formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Budget']}
                        contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '10px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="budget" fill="url(#deptBudgetsGrad)" radius={[8, 8, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </BentoWidget>
            );
          }

          // 13. Recently Onboarded Team Associates (Admin)
          if (widget.type === 'recent_users') {
            return (
              <BentoWidget key={i} title={widget.title}>
                <div className="space-y-3.5 py-1 max-h-64 overflow-y-auto pr-1 no-scrollbar">
                  {widget.data.map((ru, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 hover:bg-slate-50/50 transition-colors shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-sm">
                          <LucideIcons.User size={16} />
                        </div>
                        <div>
                          <p className="font-extrabold text-xs text-slate-800 truncate max-w-[120px]">{ru.full_name}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5 capitalize">{ru.role}</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">Onboarded</span>
                    </div>
                  ))}
                  {widget.data.length === 0 && (
                    <p className="text-xs font-semibold text-slate-400 py-12 text-center">No recent joiners records</p>
                  )}
                </div>
              </BentoWidget>
            );
          }

          // 14. Team Members List Widget (Manager)
          if (widget.type === 'team_members_list') {
            return (
              <BentoWidget key={i} title={widget.title}>
                <div className="space-y-3.5 py-1 max-h-64 overflow-y-auto pr-1 no-scrollbar select-text">
                  {widget.data.map((ru, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 hover:bg-slate-50/50 transition-colors shadow-sm gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {ru.profile_image ? (
                          <img src={ru.profile_image.startsWith('http') ? ru.profile_image : `http://${window.location.hostname}:8000${ru.profile_image}`} className="w-9 h-9 rounded-xl object-cover border border-slate-100 shadow-sm shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-violet-50 text-[#6345ED] border border-violet-100 flex items-center justify-center shrink-0 shadow-sm text-xs font-black">
                            {ru.full_name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-slate-800 truncate">{ru.full_name}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5 truncate">{ru.designation} • {ru.department}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 capitalize">{ru.status}</span>
                        {ru.phone && <p className="text-[8.5px] font-bold text-slate-450">{ru.phone}</p>}
                      </div>
                    </div>
                  ))}
                  {widget.data.length === 0 && (
                    <p className="text-xs font-semibold text-slate-400 py-12 text-center">No direct team members reported</p>
                  )}
                </div>
              </BentoWidget>
            );
          }

          return null;
        };

        // Segregate Widgets to Order Layout
        const widgets = data?.widgets || [];
        const chartWidgets = widgets.filter(w => ['attendance_summary', 'team_attendance', 'department_statistics', 'recruitment_pipeline', 'payroll_summary', 'role_distribution', 'department_budgets'].includes(w.type));
        const listWidgets = widgets.filter(w => ['leave_balance', 'upcoming_holidays', 'employees_on_leave', 'new_joiners', 'recent_users', 'team_members_list'].includes(w.type));
        const logWidgets = widgets.filter(w => w.type === 'audit_logs');

        return (
          <div className="space-y-8">

            {/* 1. Charts & Visualizations (RENDERED FIRST ON TOP) */}
            {chartWidgets.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <LucideIcons.PieChart className="text-violet-600" size={14} /> Analytical Visualizations & Charts
                  </h3>
                  <span className="h-px bg-slate-100 flex-1 ml-4"></span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {chartWidgets.map((widget, idx) => renderWidget(widget, idx))}
                </div>
              </div>
            )}

            {/* 2. Interactive Enterprise Organization Flowchart */}
            {(role === 'admin' || role === 'hr' || role === 'hrbp' || role === 'recruiter' || role === 'manager') && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden"
              >
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-50">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <LucideIcons.Network className="text-violet-600 animate-pulse" size={16} /> Interactive Enterprise Flowchart
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Tap a department node below to inspect team allocations</p>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl bg-violet-50 text-[#6345ED] border border-violet-100 shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Real-Time Core Data
                  </span>
                </div>

                {/* Bento / Material Dashboard Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

                  {/* Left Column - Corporate Identity Hub Node */}
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-gradient-to-br from-[#6345ED] to-[#4024BE] rounded-[2rem] p-6 text-white relative overflow-hidden flex flex-col justify-between shadow-xl shadow-indigo-100/40 border border-violet-500/20 min-h-[300px] lg:min-h-full"
                  >
                    {/* Glowing Light Spheres & Spinning CPU settings gear */}
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-violet-400/25 filter blur-3xl opacity-40"></div>
                    <LucideIcons.Settings className="text-white/10 animate-spin-slow absolute -right-8 -bottom-8 pointer-events-none select-none" size={180} />

                    <div className="relative z-10">
                      <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 text-white px-2.5 py-1 rounded-lg">Corporate root node</span>
                      <h4 className="text-2xl font-black tracking-tight mt-4 flex items-center gap-2">
                        <LucideIcons.Cpu size={24} className="text-emerald-300 animate-pulse" /> Hirevant Corp
                      </h4>
                      <p className="text-[10px] text-indigo-100 font-semibold mt-2 leading-relaxed max-w-[200px]">
                        Dynamic enterprise tree showing department boundaries, assigned managers, and designation arrays.
                      </p>
                    </div>

                    <div className="relative z-10 pt-8 mt-auto space-y-4">
                      {/* Meta stats */}
                      <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-wider text-indigo-200">Headcount</p>
                          <p className="text-xl font-black mt-0.5">{usersList.length} Staff</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-wider text-indigo-200">Divisions</p>
                          <p className="text-xl font-black mt-0.5">{departments.length} Units</p>
                        </div>
                      </div>

                      {/* Pill status */}
                      <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5 w-max shadow-sm">
                        <LucideIcons.ShieldAlert size={10} /> SOC2 COMPLIANT HUB
                      </span>
                    </div>
                  </motion.div>

                  {/* Right Columns - Departments Grid (2/3 width) */}
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
                    {departments.map((dept) => {
                      const deptUsers = usersList.filter(u => u.department === dept.name);
                      const isSelected = selectedFlowDept === dept.id;

                      // Theme styles based on department name
                      const getThemeStyles = (name) => {
                        const n = name?.toLowerCase() || '';
                        if (n.includes('eng') || n.includes('tech') || n.includes('dev') || n.includes('soft') || n.includes('it')) {
                          return {
                            glow: 'hover:shadow-blue-50/50 hover:border-blue-200',
                            accent: 'bg-blue-500',
                            pill: 'bg-blue-50 text-blue-600 border-blue-100',
                            bar: 'bg-blue-500'
                          };
                        }
                        if (n.includes('hr') || n.includes('people') || n.includes('resource') || n.includes('talent')) {
                          return {
                            glow: 'hover:shadow-fuchsia-50/50 hover:border-fuchsia-200',
                            accent: 'bg-fuchsia-500',
                            pill: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
                            bar: 'bg-fuchsia-500'
                          };
                        }
                        if (n.includes('fin') || n.includes('pay') || n.includes('acc') || n.includes('bud')) {
                          return {
                            glow: 'hover:shadow-emerald-50/50 hover:border-emerald-200',
                            accent: 'bg-emerald-500',
                            pill: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                            bar: 'bg-emerald-500'
                          };
                        }
                        return {
                          glow: 'hover:shadow-amber-50/50 hover:border-amber-200',
                          accent: 'bg-amber-500',
                          pill: 'bg-amber-50 text-amber-600 border-amber-100',
                          bar: 'bg-amber-500'
                        };
                      };

                      const styles = getThemeStyles(dept.name);

                      return (
                        <motion.div
                          key={dept.id}
                          layout
                          whileHover={{ y: -4 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={() => setSelectedFlowDept(isSelected ? null : dept.id)}
                          className={`p-5 rounded-[2rem] border transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer select-none bg-white ${styles.glow} ${isSelected
                            ? 'border-violet-300 ring-2 ring-violet-100 shadow-lg'
                            : 'border-slate-100 shadow-sm hover:shadow-md'
                            }`}
                        >
                          {/* Accent Color Indicator Line */}
                          <div className={`absolute top-0 left-0 right-0 h-1.5 ${styles.accent}`} />

                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border ${styles.pill}`}>
                                {dept.name?.split(' ')[0] || 'Unit'}
                              </span>
                              <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-lg">
                                {deptUsers.length} Staff
                              </span>
                            </div>

                            <h4 className="font-extrabold text-sm text-slate-800 tracking-tight mt-1">{dept.name}</h4>
                            <p className="text-[9px] text-slate-400 font-bold mt-1.5 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                              Head: <span className="font-extrabold text-slate-600">{dept.head_name || 'Unassigned'}</span>
                            </p>
                          </div>

                          {/* Capacity index progress bar */}
                          <div className="mt-4">
                            <div className="flex justify-between items-center text-[8px] uppercase tracking-widest font-black text-slate-400 mb-1">
                              <span>Allocation Rate</span>
                              <span className="text-slate-600">{usersList.length ? Math.round((deptUsers.length / usersList.length) * 100) : 0}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
                                style={{ width: `${usersList.length ? (deptUsers.length / usersList.length) * 100 : 0}%` }}
                              />
                            </div>
                          </div>

                          {/* Expandable Sliding Sheet */}
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t border-slate-100 space-y-3"
                              >
                                {/* Roles */}
                                {dept.designations && dept.designations.length > 0 && (
                                  <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Designations</p>
                                    <div className="flex flex-wrap gap-1">
                                      {dept.designations.map((desig, idx) => (
                                        <span key={idx} className="text-[9px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-150 shadow-sm">
                                          {desig}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Associates */}
                                {deptUsers.length > 0 && (
                                  <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Associates</p>
                                    <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar pr-1">
                                      {deptUsers.map((usr) => (
                                        <div key={usr.id} className="flex items-center gap-2.5 p-1.5 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-slate-150 hover:bg-slate-50 transition-colors">
                                          {usr.profile_image ? (
                                            <img src={usr.profile_image.startsWith('http') ? usr.profile_image : `http://${window.location.hostname}:8000${usr.profile_image}`} className="w-6 h-6 rounded-full object-cover border border-slate-100 shadow-sm" />
                                          ) : (
                                            <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-[9px] font-black shadow-sm">
                                              {usr.full_name?.charAt(0).toUpperCase()}
                                            </div>
                                          )}
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-black text-slate-800 truncate flex items-center gap-1">
                                              {usr.full_name}
                                              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                                            </p>
                                            <p className="text-[8px] text-slate-400 font-bold truncate">{usr.designation || 'Team Associate'}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>

                </div>
              </motion.div>
            )}

            {/* 3. Feeds, Lists & Leaves (RENDERED IN MIDDLE) */}
            {listWidgets.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <LucideIcons.ListTodo className="text-violet-600" size={14} /> Operation Feeds & Directories
                  </h3>
                  <span className="h-px bg-slate-100 flex-1 ml-4"></span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {listWidgets.map((widget, idx) => renderWidget(widget, idx))}
                </div>
              </div>
            )}

            {/* 4. System Activity Log / Audit Logs (RENDERED LAST AT THE VERY BOTTOM) */}
            {logWidgets.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <LucideIcons.ShieldAlert className="text-violet-600" size={14} /> System Activity Logs
                  </h3>
                  <span className="h-px bg-slate-100 flex-1 ml-4"></span>
                </div>
                <div className="w-full">
                  {logWidgets.map((widget, idx) => renderWidget(widget, idx))}
                </div>
              </div>
            )}

          </div>
        );
      })()}
    </motion.div>
  );
};
