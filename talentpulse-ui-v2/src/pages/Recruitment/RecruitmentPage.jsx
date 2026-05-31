import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Users, Calendar, UserCheck, Search, Plus, 
  MapPin, Clock, BadgeDollarSign, FileText, CheckCircle2, AlertCircle,
  Sparkles, Check, X, ArrowUpRight, Video, VideoOff, Mic, MicOff, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export const RecruitmentPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('jobs');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [offers, setOffers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [grades, setGrades] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [roundScheduleForm, setRoundScheduleForm] = useState({ interview_type: 'technical', interviewer: '', scheduled_date: '' });
  const [scheduleSuccess, setScheduleSuccess] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const [schedulingRound, setSchedulingRound] = useState(false);

  // Create Modals / Forms States
  const [showJobModal, setShowJobModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);

  // Form Fields
  const [jobForm, setJobForm] = useState({ 
    title: '', description: '', department: '', department_ref: '', 
    designation: '', designation_ref: '', grade: '', position_count: 1, 
    salary_range_min: '', salary_range_max: '', required_by: '' 
  });
  const [interviewForm, setInterviewForm] = useState({ 
    candidate: '', requisition: '', interview_type: 'technical', 
    interviewer: '', scheduled_date: '', status: 'scheduled', outcome: 'pending', meeting_link: '' 
  });
  const [offerForm, setOfferForm] = useState({ 
    candidate: '', requisition: '', position_title: '', salary: '', 
    start_date: '', joining_date: '', issued_date: '', offer_validity: '', status: 'issued' 
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Onboarding candidate states
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardCandidate, setOnboardCandidate] = useState(null);
  const [onboardForm, setOnboardForm] = useState({ email: '', password: 'Welcome@2026', full_name: '', role: 'employee', department: '', designation: '' });

  // Recruiter Virtual Meeting Room States
  const [activeMeetingRound, setActiveMeetingRound] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [videoActive, setVideoActive] = useState(true);
  const [audioActive, setAudioActive] = useState(true);
  const [screenSharingActive, setScreenSharingActive] = useState(false);
  const [recordingActive, setRecordingActive] = useState(false);
  
  const videoRef = useRef(null);
  const videoRefCandidate = useRef(null);
  const [stream, setStream] = useState(null);

  // Real-time evaluation input states
  const [evalOutcome, setEvalOutcome] = useState('pending');
  const [evalRating, setEvalRating] = useState(3);
  const [evalFeedback, setEvalFeedback] = useState('');
  const [submittingEval, setSubmittingEval] = useState(false);

  useEffect(() => {
    if (activeMeetingRound && videoActive) {
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
          console.error("Interviewer Camera access failed:", err);
        });
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

  // Recruiter Meeting Chat Polling Loop
  useEffect(() => {
    if (!activeMeetingRound) return;

    const fetchChatMessages = async () => {
      try {
        const response = await api.get(`/recruitment/interview-rounds/${activeMeetingRound.id}/chat/`);
        // Map messages to sender format
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
        console.error("Failed to sync live chat:", err);
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
      // Optimistic update
      setChatMessages(prev => [...prev, { sender: 'You', text: textToSend }]);
      await api.post(`/recruitment/interview-rounds/${activeMeetingRound.id}/chat/`, { message: textToSend });
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleOnboardEvaluationSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingEval(true);
      setFormError('');
      setFormSuccess('');
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
        setFormSuccess(`Interview evaluated as PASS! Candidate ${activeMeetingRound.candidate_name} status updated to ${nextStatus.toUpperCase()}.`);
      } else if (evalOutcome === 'fail') {
        await api.patch(`/recruitment/candidates/${activeMeetingRound.candidate}/`, {
          status: 'rejected'
        });
        setFormSuccess(`Interview evaluated as FAIL! Candidate ${activeMeetingRound.candidate_name} rejected.`);
      } else {
        setFormSuccess(`Interview evaluation recorded successfully for ${activeMeetingRound.candidate_name}!`);
      }

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setActiveMeetingRound(null);
      fetchData();
    } catch (err) {
      setFormError('Failed to upload evaluation metrics.');
    } finally {
      setSubmittingEval(false);
    }
  };

  const isRecruiter = ['recruiter', 'hr', 'hrbp', 'hr_admin', 'super_admin'].includes(user?.role?.toLowerCase());

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsRes, candRes, intRes, offRes, deptRes, desigRes, gradeRes, usersRes] = await Promise.all([
        api.get('/recruitment/job-requisitions/'),
        api.get('/recruitment/candidates/'),
        api.get('/recruitment/interview-rounds/'),
        api.get('/recruitment/offer-letters/'),
        api.get('/employees/departments/?page_size=1000'),
        api.get('/employees/designations/?page_size=1000'),
        api.get('/employees/grades/?page_size=1000'),
        api.get('/users/?page_size=1000')
      ]);
      
      const fetchedCandidates = candRes.data.results || candRes.data || [];
      setJobs(jobsRes.data.results || jobsRes.data || []);
      setCandidates(fetchedCandidates);
      setInterviews(intRes.data.results || intRes.data || []);
      setOffers(offRes.data.results || offRes.data || []);
      setDepartments(deptRes.data.results || deptRes.data || []);
      setDesignations(desigRes.data.results || desigRes.data || []);
      setGrades(gradeRes.data.results || gradeRes.data || []);
      setUsersList(usersRes.data.results || usersRes.data || []);
      
      if (selectedCandidate) {
        const freshCand = fetchedCandidates.find(c => c.id === selectedCandidate.id);
        if (freshCand) {
          setSelectedCandidate(freshCand);
        }
      }
    } catch (err) {
      console.error("Failed to load recruitment data pipeline", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Route-Aware Synchronization Effect
  useEffect(() => {
    const path = location.pathname;
    // Reset modal triggers first
    setShowJobModal(false);
    setShowInterviewModal(false);
    setShowOfferModal(false);

    if (path === '/jobs') {
      setActiveTab('jobs');
    } else if (path === '/jobs/create' || path === '/recruitment/requisitions/create') {
      setActiveTab('jobs');
      if (isRecruiter) {
        setShowJobModal(true);
      }
    } else if (path === '/candidates') {
      setActiveTab('candidates');
    } else if (path === '/interviews') {
      setActiveTab('interviews');
    } else if (path === '/interviews/schedule') {
      setActiveTab('interviews');
      if (isRecruiter) {
        setShowInterviewModal(true);
      }
    } else if (path === '/offers') {
      setActiveTab('offers');
    } else if (path === '/offers/create') {
      setActiveTab('offers');
      if (isRecruiter) {
        setShowOfferModal(true);
      }
    } else if (path === '/recruitment') {
      setActiveTab('jobs');
    }
  }, [location.pathname, isRecruiter]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setSearchQuery('');
    
    // Sync browser URL cleanly to avoid clashes
    if (tabId === 'jobs') navigate('/jobs');
    else if (tabId === 'candidates') navigate('/candidates');
    else if (tabId === 'interviews') navigate('/interviews');
    else if (tabId === 'offers') navigate('/offers');
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      setFormError('');
      setFormSuccess('');
      await api.post('/recruitment/job-requisitions/', {
        ...jobForm,
        department_ref: jobForm.department_ref ? Number(jobForm.department_ref) : null,
        designation_ref: jobForm.designation_ref ? Number(jobForm.designation_ref) : null,
        grade: jobForm.grade ? Number(jobForm.grade) : null,
        salary_range_min: Number(jobForm.salary_range_min),
        salary_range_max: Number(jobForm.salary_range_max),
        position_count: Number(jobForm.position_count),
        status: 'open'
      });
      setFormSuccess('Job posting released successfully!');
      setJobForm({ title: '', description: '', department: '', department_ref: '', designation: '', designation_ref: '', grade: '', position_count: 1, salary_range_min: '', salary_range_max: '', required_by: '' });
      setShowJobModal(false);
      fetchData();
      navigate('/jobs');
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to release job posting.');
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    try {
      setFormError('');
      setFormSuccess('');
      await api.post('/recruitment/interview-rounds/', {
        ...interviewForm,
        interviewer: Number(interviewForm.interviewer),
        candidate: Number(interviewForm.candidate),
        requisition: interviewForm.requisition ? Number(interviewForm.requisition) : null
      });
      setFormSuccess('Interview session scheduled successfully!');
      setInterviewForm({ candidate: '', requisition: '', interview_type: 'technical', interviewer: '', scheduled_date: '', status: 'scheduled', outcome: 'pending' });
      setShowInterviewModal(false);
      fetchData();
      navigate('/interviews');
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to schedule interview.');
    }
  };

  const handleReleaseOffer = async (e) => {
    e.preventDefault();
    try {
      setFormError('');
      setFormSuccess('');
      await api.post('/recruitment/offer-letters/', {
        ...offerForm,
        candidate: Number(offerForm.candidate),
        requisition: offerForm.requisition ? Number(offerForm.requisition) : null,
        salary: Number(offerForm.salary)
      });
      setFormSuccess('Offer letter released successfully!');
      setOfferForm({ candidate: '', requisition: '', position_title: '', salary: '', start_date: '', joining_date: '', issued_date: '', offer_validity: '', status: 'issued' });
      setShowOfferModal(false);
      fetchData();
      navigate('/offers');
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to release offer.');
    }
  };

  const handleInitiateOnboarding = (cand) => {
    setOnboardCandidate(cand);
    setOnboardForm({
      email: cand.email,
      password: 'Welcome@2026',
      full_name: `${cand.first_name} ${cand.last_name}`,
      role: 'employee',
      department: cand.job_requisition_title || '',
      designation: cand.current_designation || ''
    });
    setShowOnboardModal(true);
  };

  const handleOnboardCandidateSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormError('');
      setFormSuccess('');
      await api.post('/users/create/', {
        ...onboardForm
      });
      setFormSuccess(`Candidate ${onboardForm.full_name} onboarded successfully! User account and Employee ID generated.`);
      setShowOnboardModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error || err.response?.data?.detail || 'Failed to onboard candidate.');
    }
  };

  const getFilteredData = () => {
    const query = searchQuery.toLowerCase();
    if (activeTab === 'jobs') {
      return jobs.filter(j => j.title?.toLowerCase().includes(query) || j.department_name?.toLowerCase().includes(query) || j.department?.toLowerCase().includes(query));
    } else if (activeTab === 'candidates') {
      return candidates.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(query) || c.email?.toLowerCase().includes(query));
    } else if (activeTab === 'interviews') {
      return interviews.filter(i => i.candidate_name?.toLowerCase().includes(query) || i.interview_type?.toLowerCase().includes(query));
    } else {
      return offers.filter(o => o.candidate_name?.toLowerCase().includes(query) || o.position_title?.toLowerCase().includes(query));
    }
  };

  const filteredItems = getFilteredData();

  const filteredDesignations = designations.filter(d => !jobForm.department_ref || Number(d.department) === Number(jobForm.department_ref));

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

  if (activeMeetingRound) {
    return (
      <div className="space-y-6 font-sans pb-16 text-slate-800 text-left">
        
        {/* Lobby Header */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-600" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center shrink-0">
              <Video size={20} className="animate-pulse text-violet-600" />
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
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-655 text-xs font-black transition-all cursor-pointer"
          >
            Exit Lobby
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Live feeds & Chat (8/12) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Live Camera grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Recruiter self-camera */}
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
                    <Users size={48} className="text-slate-300 animate-pulse" />
                  </div>
                )}
                
                {/* Status indicator */}
                <div className="absolute top-4 left-4 bg-slate-955/70 px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md border border-white/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-200">You (Interviewer)</span>
                </div>

                <div className="z-10 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-white tracking-wider">{user?.full_name || 'Recruiter'}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setVideoActive(!videoActive)} 
                      className={`p-2 rounded-xl border cursor-pointer transition-all ${videoActive ? 'bg-white/10 border-white/10 text-white' : 'bg-rose-500/20 border-rose-500/30 text-rose-400'}`}
                    >
                      {videoActive ? <Video size={13} /> : <VideoOff size={13} />}
                    </button>
                    <button 
                      onClick={() => setAudioActive(!audioActive)} 
                      className={`p-2 rounded-xl border cursor-pointer transition-all ${audioActive ? 'bg-white/10 border-white/10 text-white' : 'bg-rose-500/20 border-rose-500/30 text-rose-400'}`}
                    >
                      {audioActive ? <Mic size={13} /> : <MicOff size={13} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Candidate simulated connection */}
              <div className="bg-[#0C061A] rounded-[2rem] overflow-hidden aspect-video relative flex flex-col justify-end shadow-md border border-slate-950">
                {videoActive ? (
                  <video 
                    ref={videoRefCandidate} 
                    autoPlay 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-radial-gradient">
                    <div className="w-16 h-16 rounded-full bg-violet-600/10 border border-violet-500/30 flex items-center justify-center mb-3">
                      <Users size={30} className="text-violet-400" />
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

            {/* Sleek Bento Conferencing Control Bar */}
            <div className="bg-slate-900 text-white rounded-3xl p-4 flex flex-wrap justify-between items-center gap-4 shadow-xl border border-slate-800">
              
              {/* Media Toggles */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setVideoActive(!videoActive)}
                  className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
                    videoActive 
                      ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-750' 
                      : 'bg-rose-500/20 border-rose-500/30 text-rose-400 hover:bg-rose-500/30'
                  }`}
                >
                  {videoActive ? <Video size={14} /> : <VideoOff size={14} />}
                  <span>{videoActive ? 'Cam On' : 'Cam Off'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAudioActive(!audioActive)}
                  className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
                    audioActive 
                      ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-750' 
                      : 'bg-rose-500/20 border-rose-500/30 text-rose-400 hover:bg-rose-500/30'
                  }`}
                >
                  {audioActive ? <Mic size={14} /> : <MicOff size={14} />}
                  <span>{audioActive ? 'Mic On' : 'Mic Off'}</span>
                </button>
              </div>

              {/* Screen Sharing Toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setScreenSharingActive(!screenSharingActive)}
                  className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
                    screenSharingActive 
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                      : 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-750'
                  }`}
                >
                  <Briefcase size={14} />
                  <span>{screenSharingActive ? 'Screen Sharing...' : 'Share Screen'}</span>
                </button>
              </div>

              {/* External Meeting Link Copy Action */}
              <div className="flex items-center gap-2">
                {activeMeetingRound.meeting_link ? (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeMeetingRound.meeting_link);
                      alert('Copied external meeting link to clipboard!');
                    }}
                    className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    <ArrowUpRight size={14} />
                    <span>Copy Link</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-800 px-3 py-2 rounded-xl">No external link set</span>
                )}
              </div>

              {/* Simulated Recording Status Indicator */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRecordingActive(!recordingActive)}
                  className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                    recordingActive 
                      ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 animate-pulse' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${recordingActive ? 'bg-rose-500 animate-ping' : 'bg-slate-500'}`} />
                  <span>{recordingActive ? 'REC ACTIVE' : 'START REC'}</span>
                </button>
              </div>

            </div>

            {/* Chat section */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-5 flex flex-col gap-4 flex-1 min-h-[300px] max-h-[450px] shadow-sm">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-1.5"><MessageSquare size={13} className="text-violet-600" /> Meeting Chat Feed</h3>
              
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
                      <span className={`inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg border mt-1 ${
                        Number(activeMeetingRound.backlogs) > 0 
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
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest pb-1 flex items-center gap-1"><CheckCircle2 size={14} className="text-violet-600" /> Evaluation Grades</h3>
                
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
    <div className="space-y-8 font-sans pb-16 text-slate-800">
      
      {/* Recruiter Operational Handbook Banner */}
      {user?.role?.toLowerCase() === 'recruiter' && (
        <div className="relative bg-gradient-to-r from-violet-600 to-indigo-700 rounded-[2rem] p-6 overflow-hidden shadow-xl shadow-violet-200/50 border border-violet-400/20">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 filter blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-indigo-400/20 filter blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles size={26} className="text-amber-300 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-violet-200 mb-1">Recruiter Operational Charter & Handbook</p>
              <h2 className="text-lg font-black text-white tracking-tight">Talent Acquisition Console</h2>
              <p className="text-violet-200 text-xs font-semibold mt-1 max-w-xl">Your mission is to attract qualified candidates, publish job openings, screen applications, coordinate interviews, and guide candidates from application to offer stage.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 shrink-0">
              {[
                { label: 'Can Post Jobs', ok: true },
                { label: 'Can Manage Candidates', ok: true },
                { label: 'Can Schedule Interviews', ok: true },
                { label: 'Can Release Offers', ok: true },
                { label: 'Can Access Payroll', ok: false },
                { label: 'Can Access Settings', ok: false },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                  item.ok 
                    ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200' 
                    : 'bg-rose-500/20 border-rose-400/30 text-rose-300'
                }`}>
                  {item.ok ? <Check size={9} /> : <X size={9} />} {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative pb-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-violet-500/5 filter blur-3xl -z-10"></div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 bg-clip-text bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950">
            Talent Acquisition
          </h1>
          <p className="text-slate-400 text-xs font-semibold mt-1">Manage active requisitions, candidates, scheduled evaluations, and offer workflows.</p>
        </div>
        
        {isRecruiter && (
          <div className="flex gap-3">
            {activeTab === 'jobs' && (
              <button 
                onClick={() => navigate('/jobs/create')}
                className="px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Plus size={16} /> Open Requisition
              </button>
            )}
            {activeTab === 'interviews' && (
              <button 
                onClick={() => navigate('/interviews/schedule')}
                className="px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Plus size={16} /> Schedule Evaluation
              </button>
            )}
            {activeTab === 'offers' && (
              <button 
                onClick={() => navigate('/offers/create')}
                className="px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Plus size={16} /> Release Offer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bento Summary Widget Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Metric 1 */}
        <motion.div whileHover={{ y: -4 }} className="bg-white/85 backdrop-blur-md border border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Total Scheduled</span>
            <h4 className="text-2xl font-black text-slate-900 mt-1">{interviews.length} slots</h4>
            <span className="text-[9px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 w-max mt-3 bg-violet-50 text-violet-600 border border-violet-100">
              Total interviews queue
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center shadow-sm">
            <Calendar size={20} />
          </div>
        </motion.div>

        {/* Metric 2 */}
        <motion.div whileHover={{ y: -4 }} className="bg-white/85 backdrop-blur-md border border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Interviews Today</span>
            <h4 className="text-2xl font-black text-slate-900 mt-1">
              {interviews.filter(i => new Date(i.scheduled_date).toDateString() === new Date().toDateString()).length} today
            </h4>
            <span className="text-[9px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 w-max mt-3 bg-sky-50 text-sky-600 border border-sky-100">
              Active sessions today
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shadow-sm">
            <Clock size={20} />
          </div>
        </motion.div>

        {/* Metric 3 */}
        <motion.div whileHover={{ y: -4 }} className="bg-white/85 backdrop-blur-md border border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Pending Feedback</span>
            <h4 className="text-2xl font-black text-slate-900 mt-1">
              {interviews.filter(i => i.status === 'scheduled').length} pending
            </h4>
            <span className="text-[9px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 w-max mt-3 bg-amber-50 text-amber-600 border border-amber-100">
              Awaiting interviewer notes
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shadow-sm">
            <Users size={20} />
          </div>
        </motion.div>

        {/* Metric 4 */}
        <motion.div whileHover={{ y: -4 }} className="bg-white/85 backdrop-blur-md border border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Selected Candidates</span>
            <h4 className="text-2xl font-black text-emerald-600 mt-1">
              {candidates.filter(c => c.status === 'selected').length} selected
            </h4>
            <span className="text-[9px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 w-max mt-3 bg-emerald-50 text-emerald-700 border border-emerald-100">
              Ready for offer letters
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-sm">
            <UserCheck size={20} />
          </div>
        </motion.div>

      </div>

      {/* Tab Navigation & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2.5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { id: 'jobs', label: 'Open Jobs', icon: Briefcase },
            { id: 'candidates', label: 'Candidates', icon: Users },
            { id: 'interviews', label: 'Interviews', icon: Calendar },
            { id: 'offers', label: 'Offer Letters', icon: UserCheck }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab === 'jobs' ? 'jobs by title...' : activeTab}...`} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-violet-500 focus:bg-white shadow-inner transition-all"
          />
        </div>
      </div>

      {/* Alerts */}
      {formSuccess && <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-extrabold flex items-center gap-2">{formSuccess}</div>}
      {formError && <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-extrabold flex items-center gap-2">{formError}</div>}

      {/* Main Tab Views */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* JOBS TAB */}
          {activeTab === 'jobs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map(job => (
                <motion.div 
                  key={job.id} 
                  whileHover={{ y: -4 }}
                  className="bg-white/85 backdrop-blur-md rounded-[2rem] p-6 border border-slate-100 shadow-md flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-violet-500/5 filter blur-xl"></div>
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-violet-50 border border-violet-100 text-violet-600">
                        {job.department_name || job.department || 'General'}
                      </span>
                      {job.grade_name && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-sky-50 border border-sky-100 text-sky-600">
                          {job.grade_name}
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900 mt-4 leading-snug">{job.title}</h3>
                    <p className="text-slate-400 text-[10px] font-extrabold mt-1.5 flex items-center gap-1"><MapPin size={12} /> Bangalore HQ Office</p>
                    
                    {job.required_by && (
                      <p className="text-violet-600/75 text-[9px] font-black uppercase tracking-widest mt-3.5">
                        📅 Needed By: {new Date(job.required_by).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                    
                    <p className="text-slate-600 text-xs line-clamp-3 leading-relaxed mt-4 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
                      "{job.description}"
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-6 text-xs">
                    <span className="text-[10px] font-black text-slate-400">Position Open: <span className="font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md ml-0.5">{job.position_count}</span></span>
                    <span className="text-xs font-black text-emerald-600">₹{job.salary_range_min?.toLocaleString()} - ₹{job.salary_range_max?.toLocaleString()}</span>
                  </div>
                </motion.div>
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-full py-16 text-center border border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
                  <AlertCircle size={24} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-400">No job postings found matching query.</p>
                </div>
              )}
            </div>
          )}
             {/* CANDIDATES TAB */}
          {activeTab === 'candidates' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in text-left">
              {/* Left panel: list (5/12 columns on large screens) */}
              <div className="lg:col-span-5 bg-white/80 backdrop-blur-md rounded-[2rem] border border-slate-100 shadow-md p-4 space-y-3 max-h-[80vh] overflow-y-auto">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider px-2 border-b border-slate-50 pb-2 mb-2">Applicants list ({filteredItems.length})</h3>
                {filteredItems.map(cand => {
                  const isSelected = selectedCandidate && selectedCandidate.id === cand.id;
                  return (
                    <div 
                      key={cand.id} 
                      onClick={() => {
                        setSelectedCandidate(cand);
                        setScheduleSuccess('');
                        setScheduleError('');
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-violet-600/5 border-violet-500/30 shadow-md' 
                          : 'bg-white/50 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{cand.first_name} {cand.last_name}</h4>
                          <p className="text-[10.5px] text-slate-500 mt-0.5">{cand.job_requisition_title}</p>
                        </div>
                        <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                          cand.status === 'offered' || cand.status === 'selected' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                          cand.status === 'offer_accepted' ? 'bg-teal-50 border-teal-100 text-teal-700' :
                          cand.status === 'joined' || cand.status === 'onboarded' ? 'bg-sky-50 border-sky-100 text-sky-700' :
                          cand.status === 'background_verification' || cand.status === 'joining_confirmed' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                          cand.status === 'rejected' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                          cand.status === 'interview_scheduled' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                          'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                          {cand.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100/50 text-[10px] text-slate-400 font-bold">
                        <span>Exp: {cand.experience || 'Fresher'}</span>
                        <span>Backlogs: {cand.backlogs || 0}</span>
                      </div>
                    </div>
                  );
                })}
                {filteredItems.length === 0 && (
                  <div className="py-12 text-center text-slate-400 font-bold text-xs">
                    <AlertCircle size={20} className="mx-auto mb-2 text-slate-350" />
                    No candidates matching query.
                  </div>
                )}
              </div>

              {/* Right panel: details drawer (7/12 columns on large screens) */}
              <div className="lg:col-span-7 bg-white/90 backdrop-blur-md rounded-[2rem] border border-slate-100 shadow-md p-6 space-y-6 min-h-[500px]">
                {selectedCandidate ? (
                  <div className="space-y-6">
                    
                    {/* Header info */}
                    <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-lg">
                          Candidate Dossier
                        </span>
                        <h3 className="text-xl font-extrabold text-slate-900 mt-2">{selectedCandidate.first_name} {selectedCandidate.last_name}</h3>
                        <p className="text-xs text-slate-400 font-bold mt-1 flex items-center gap-1">Applied for: <span className="text-slate-800 font-black">{selectedCandidate.job_requisition_title}</span></p>
                      </div>

                      {/* Status Selector Dropdown */}
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Override Stage</span>
                        <select
                          value={selectedCandidate.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            try {
                              setFormError('');
                              setFormSuccess('');
                              await api.patch(`/recruitment/candidates/${selectedCandidate.id}/`, { status: newStatus });
                              setFormSuccess(`Candidate status updated successfully to ${newStatus.replace('_', ' ').toUpperCase()}!`);
                              // Update active state in panel
                              setSelectedCandidate({...selectedCandidate, status: newStatus});
                              fetchData();
                            } catch (err) {
                              setFormError('Failed to update candidate status.');
                            }
                          }}
                          className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all ${
                            selectedCandidate.status === 'offered' || selectedCandidate.status === 'selected' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            selectedCandidate.status === 'offer_accepted' ? 'bg-teal-50 border-teal-200 text-teal-700' :
                            selectedCandidate.status === 'joined' || selectedCandidate.status === 'onboarded' ? 'bg-sky-50 border-sky-200 text-sky-700' :
                            selectedCandidate.status === 'background_verification' || selectedCandidate.status === 'joining_confirmed' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                            selectedCandidate.status === 'rejected' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                            selectedCandidate.status === 'interview_scheduled' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                            'bg-amber-50 border-amber-200 text-amber-700'
                          }`}
                        >
                          <option value="applied">Applied</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interview_scheduled">Interview Scheduled</option>
                          <option value="selected">Selected</option>
                          <option value="offered">Offer Released</option>
                          <option value="offer_accepted">Offer Accepted</option>
                          <option value="background_verification">Background Verification</option>
                          <option value="joining_confirmed">Joining Date Confirmed</option>
                          <option value="joined">Joined Company</option>
                          <option value="onboarded">Employee Active</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    {/* Profile Metrics Grid */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4 text-xs text-slate-655">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-150 pb-1.5 mb-2">Personal & Contact Info</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div>
                            <span className="text-[9px] text-slate-450 font-bold block uppercase tracking-wider">Email Address</span>
                            <span className="font-extrabold text-slate-800 block select-text">{selectedCandidate.email}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-450 font-bold block uppercase tracking-wider">Contact Number</span>
                            <span className="font-extrabold text-slate-800 block select-text">{selectedCandidate.phone}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-450 font-bold block uppercase tracking-wider">Alternate Number</span>
                            <span className="font-extrabold text-slate-800 block select-text">{selectedCandidate.alternate_phone || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-450 font-bold block uppercase tracking-wider">Date of Birth</span>
                            <span className="font-extrabold text-slate-800 block">{selectedCandidate.dob || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-455 font-bold block uppercase tracking-wider">Gender Identity</span>
                            <span className="font-extrabold text-slate-800 block capitalize">{selectedCandidate.gender || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-455 font-bold block uppercase tracking-wider">Relocation Preference</span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mt-0.5 border ${
                              selectedCandidate.willing_to_relocate ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'
                            }`}>{selectedCandidate.willing_to_relocate ? 'Willing to Relocate' : 'Prefers Home HQ'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-200/50 pt-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-150 pb-1.5 mb-2">Professional Metrics</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div>
                            <span className="text-[9px] text-slate-450 font-bold block uppercase tracking-wider">Source Channel</span>
                            <span className="font-extrabold text-slate-800 block capitalize">{selectedCandidate.source_channel || 'Portal'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-450 font-bold block uppercase tracking-wider">Current CTC</span>
                            <span className="font-extrabold text-slate-800 block">{selectedCandidate.current_ctc ? `₹${Number(selectedCandidate.current_ctc).toLocaleString('en-IN')}` : 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-450 font-bold block uppercase tracking-wider">Expected CTC</span>
                            <span className="font-extrabold text-[#6345ED] block">{selectedCandidate.expected_ctc ? `₹${Number(selectedCandidate.expected_ctc).toLocaleString('en-IN')}` : 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-450 font-bold block uppercase tracking-wider">Previous Company</span>
                            <span className="font-extrabold text-slate-800 block">{selectedCandidate.current_company || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-455 font-bold block uppercase tracking-wider">Designation / Role</span>
                            <span className="font-extrabold text-slate-800 block truncate">{selectedCandidate.current_designation || 'Graduate / Fresher'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-455 font-bold block uppercase tracking-wider">Notice Period</span>
                            <span className="font-extrabold text-slate-800 block">{selectedCandidate.notice_period || 'Immediate'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-455 font-bold block uppercase tracking-wider">Certifications</span>
                            <span className="font-extrabold text-slate-800 block truncate">{selectedCandidate.certifications || 'None'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-455 font-bold block uppercase tracking-wider">GitHub Profile</span>
                            {selectedCandidate.github_profile ? (
                              <a href={selectedCandidate.github_profile} target="_blank" rel="noreferrer" className="text-violet-600 font-extrabold block truncate hover:underline">{selectedCandidate.github_profile}</a>
                            ) : (
                              <span className="font-extrabold text-slate-400 block">N/A</span>
                            )}
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-455 font-bold block uppercase tracking-wider">Experience Level</span>
                            <span className="font-extrabold text-slate-800 block">{selectedCandidate.experience || 'Fresh Graduate'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Academic Dossier */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-150 pb-1.5">Academic Qualifications & Preferences</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Highest Education</span>
                          <p className="font-bold text-violet-750">{selectedCandidate.education_details || 'Graduate'}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">College / Institution</span>
                          <p className="font-bold text-slate-800">{selectedCandidate.college || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Graduation Degree / Specialization</span>
                          <p className="font-bold text-slate-800">{selectedCandidate.grad_degree ? `${selectedCandidate.grad_degree} (${selectedCandidate.grad_specialization || 'General'})` : 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Graduation CGPA / Year</span>
                          <p className="font-extrabold text-[#6345ED]">{selectedCandidate.cgpa || 'N/A'} {selectedCandidate.grad_year ? `• Class of ${selectedCandidate.grad_year}` : ''}</p>
                        </div>
                        
                        {/* PG details */}
                        {selectedCandidate.pg_university && (
                          <div className="sm:col-span-2 border-t border-slate-150 pt-2 grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Post-Graduation University / Degree</span>
                              <p className="font-bold text-slate-850">{selectedCandidate.pg_university} ({selectedCandidate.pg_degree})</p>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">PG CGPA / Year</span>
                              <p className="font-extrabold text-[#6345ED]">{selectedCandidate.pg_cgpa || 'N/A'} • Class of {selectedCandidate.pg_year}</p>
                            </div>
                          </div>
                        )}

                        {/* Diploma details */}
                        {selectedCandidate.diploma_institution && (
                          <div className="sm:col-span-2 border-t border-slate-150 pt-2 grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Diploma Details</span>
                              <p className="font-bold text-slate-850">{selectedCandidate.diploma_institution}</p>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Diploma Percentage / Year</span>
                              <p className="font-extrabold text-[#6345ED]">{selectedCandidate.diploma_percentage}% • Year of passing: {selectedCandidate.diploma_year}</p>
                            </div>
                          </div>
                        )}

                        {/* 10th and 12th details */}
                        <div className="sm:col-span-2 border-t border-slate-150 pt-2 grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">10th Details (School, Board, Year)</span>
                            <p className="font-bold text-slate-800">{selectedCandidate.tenth_school || 'N/A'} {selectedCandidate.tenth_board ? `• ${selectedCandidate.tenth_board}` : ''} {selectedCandidate.tenth_percentage ? `• ${selectedCandidate.tenth_percentage}%` : ''}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">12th Details (College, Board, Year)</span>
                            <p className="font-bold text-slate-800">{selectedCandidate.inter_college || 'N/A'} {selectedCandidate.inter_board ? `• ${selectedCandidate.inter_board}` : ''} {selectedCandidate.inter_percentage ? `• ${selectedCandidate.inter_percentage}%` : ''}</p>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Active/Cleared Backlogs</span>
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase mt-1 ${
                            Number(selectedCandidate.active_backlogs) > 0 ? 'bg-rose-50 border border-rose-205 text-rose-700 animate-pulse' : 'bg-emerald-50 border border-emerald-205 text-emerald-700'
                          }`}>
                            {selectedCandidate.active_backlogs || 0} active • {selectedCandidate.cleared_backlogs || 0} cleared
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Preferred Locations</span>
                          <p className="font-bold text-slate-800">{selectedCandidate.preferred_locations || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100/50">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider mb-1.5">Skills Tag</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCandidate.skills ? selectedCandidate.skills.split(',').map((s, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-wider">{s.trim()}</span>
                          )) : (
                            <span className="text-[9px] text-slate-400 italic">None registered</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Links and Documents */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      {selectedCandidate.resume ? (
                        <a 
                          href={selectedCandidate.resume.startsWith('http') ? selectedCandidate.resume : `http://${window.location.hostname}:8000${selectedCandidate.resume}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 border border-slate-200 hover:border-violet-300 hover:bg-violet-50/30 text-violet-600 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <FileText size={14} /> Open Resume <ArrowUpRight size={10} />
                        </a>
                      ) : (
                        <span className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 border border-dashed border-slate-200">
                          <FileText size={14} /> No Resume Attached
                        </span>
                      )}

                      {selectedCandidate.linkedin_url && (
                        <a 
                          href={selectedCandidate.linkedin_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-4 py-2 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 text-blue-600 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          LinkedIn Profile <ArrowUpRight size={10} />
                        </a>
                      )}

                      {selectedCandidate.portfolio_url && (
                        <a 
                          href={selectedCandidate.portfolio_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-4 py-2 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          Portfolio Website <ArrowUpRight size={10} />
                        </a>
                      )}
                    </div>

                    {/* Cover Letter */}
                    {selectedCandidate.cover_letter && (
                      <div className="space-y-2">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Cover Letter</span>
                        <p className="text-slate-650 bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs leading-relaxed italic select-text">
                          "{selectedCandidate.cover_letter}"
                        </p>
                      </div>
                    )}

                    {/* PIPELINE STAGE ACTIONS PANEL */}
                    <div className="bg-slate-50/80 border border-slate-100 rounded-3xl p-5 space-y-4">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-150 pb-2">Hiring Pipeline Orchestrator</h4>
                      
                      {/* Status-specific action consoles */}
                      {selectedCandidate.status === 'applied' && (
                        <div className="space-y-2">
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed">Review the resume above. If the education background and credentials check out, shortlist them to begin rounds.</p>
                          <button
                            onClick={async () => {
                              try {
                                setFormError('');
                                setFormSuccess('');
                                await api.patch(`/recruitment/candidates/${selectedCandidate.id}/`, { status: 'shortlisted' });
                                setFormSuccess(`Candidate ${selectedCandidate.first_name} shortlisted successfully!`);
                                setSelectedCandidate({...selectedCandidate, status: 'shortlisted'});
                                fetchData();
                              } catch (err) {
                                setFormError('Failed to shortlist candidate.');
                              }
                            }}
                            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            Confirm & Shortlist Profile
                          </button>
                        </div>
                      )}

                      {/* Assign Round form */}
                      {selectedCandidate.status === 'shortlisted' && (
                        <div className="space-y-4">
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Assign & Schedule Next Recruiting Round</p>
                          
                          {scheduleSuccess && <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-700 text-[11px] font-bold">{scheduleSuccess}</div>}
                          {scheduleError && <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[11px] font-bold">{scheduleError}</div>}

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Round Type</label>
                              <select 
                                value={roundScheduleForm.interview_type} 
                                onChange={e => setRoundScheduleForm({...roundScheduleForm, interview_type: e.target.value, interviewer: ''})} 
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none shadow-sm"
                              >
                                <option value="technical">Technical Round</option>
                                <option value="hr">HR Round</option>
                                <option value="screening">Phone Screening</option>
                                <option value="managerial">Managerial Round</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Assigned Evaluator</label>
                              <select 
                                required
                                value={roundScheduleForm.interviewer} 
                                onChange={e => setRoundScheduleForm({...roundScheduleForm, interviewer: e.target.value})} 
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none shadow-sm"
                              >
                                <option value="">Select Evaluator...</option>
                                {usersList
                                  .filter(u => {
                                    if (roundScheduleForm.interview_type === 'technical') {
                                      return u.role?.toLowerCase() === 'manager';
                                    }
                                    if (roundScheduleForm.interview_type === 'hr') {
                                      return ['hr', 'admin'].includes(u.role?.toLowerCase());
                                    }
                                    return ['manager', 'hr', 'admin'].includes(u.role?.toLowerCase());
                                  })
                                  .map(usr => (
                                    <option key={usr.id} value={usr.id}>{usr.full_name} ({usr.role?.toUpperCase()})</option>
                                  ))
                                }
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Scheduled Date & Time</label>
                              <input 
                                type="datetime-local" 
                                required 
                                value={roundScheduleForm.scheduled_date} 
                                onChange={e => setRoundScheduleForm({...roundScheduleForm, scheduled_date: e.target.value})} 
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none shadow-sm" 
                              />
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!roundScheduleForm.interviewer || !roundScheduleForm.scheduled_date) {
                                  setScheduleError('Please fill out interviewer and date-time.');
                                  return;
                                }
                                try {
                                  setSchedulingRound(true);
                                  setScheduleSuccess('');
                                  setScheduleError('');
                                  await api.post('/recruitment/interview-rounds/', {
                                    candidate: selectedCandidate.id,
                                    requisition: selectedCandidate.job_requisition,
                                    interview_type: roundScheduleForm.interview_type,
                                    interviewer: Number(roundScheduleForm.interviewer),
                                    scheduled_date: roundScheduleForm.scheduled_date,
                                    status: 'scheduled',
                                    outcome: 'pending'
                                  });
                                  setScheduleSuccess(`Interview assigned successfully!`);
                                  // Automatically transition to interview_scheduled
                                  setSelectedCandidate({...selectedCandidate, status: 'interview_scheduled'});
                                  fetchData();
                                } catch (err) {
                                  setScheduleError(err.response?.data?.detail || 'Failed to assign interview round.');
                                } finally {
                                  setSchedulingRound(false);
                                }
                              }}
                              disabled={schedulingRound}
                              className="w-full py-3 bg-[#6345ED] hover:bg-[#5235D6] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                            >
                              {schedulingRound ? 'Assigning...' : 'Assign & Schedule Session'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Scheduled round waiting or taking */}
                      {selectedCandidate.status === 'interview_scheduled' && (
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                            <h5 className="font-extrabold text-blue-900 text-xs flex items-center gap-1.5"><Calendar size={14} /> Evaluation Session Active</h5>
                            {interviews
                              .filter(i => i.candidate === selectedCandidate.id && i.status === 'scheduled')
                              .map(int => (
                                <div key={int.id} className="mt-2 text-xs space-y-1 text-blue-800">
                                  <p><strong>Round Type:</strong> <span className="capitalize">{int.interview_type}</span></p>
                                  <p><strong>Evaluator:</strong> {int.interviewer_name}</p>
                                  <p><strong>Date/Time:</strong> {new Date(int.scheduled_date).toLocaleString()}</p>
                                  <div className="pt-3">
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
                                      className="px-3.5 py-2 bg-[#6345ED] hover:bg-[#5235D6] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
                                    >
                                      Join Meeting Lobby
                                    </button>
                                  </div>
                                </div>
                              ))}
                            {interviews.filter(i => i.candidate === selectedCandidate.id && i.status === 'scheduled').length === 0 && (
                              <p className="text-xs text-blue-800 mt-1">Interviews scheduled. View Scheduled Sessions tab to start.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Release Offer CTA */}
                      {selectedCandidate.status === 'selected' && (
                        <div className="space-y-2">
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed">Candidate has successfully cleared all interview evaluations. Generate and release their corporate offer parameters.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setOfferForm({
                                candidate: selectedCandidate.id,
                                requisition: selectedCandidate.job_requisition,
                                position_title: selectedCandidate.job_requisition_title || selectedCandidate.current_designation || '',
                                salary: '',
                                start_date: '',
                                joining_date: '',
                                issued_date: new Date().toISOString().split('T')[0],
                                offer_validity: '',
                                status: 'issued'
                      });
                              setShowOfferModal(true);
                            }}
                            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            Release Official Job Offer
                          </button>
                        </div>
                      )}

                      {/* Offer released waiting */}
                      {selectedCandidate.status === 'offered' && (
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-xs space-y-1.5 text-amber-800">
                          <h5 className="font-extrabold text-amber-900 flex items-center gap-1"><Clock size={14} /> Offer Letter Released</h5>
                          <p>Awaiting signature and acceptance from the candidate on their portal.</p>
                          {offers
                            .filter(o => o.candidate === selectedCandidate.id)
                            .map(o => (
                              <div key={o.id} className="pt-2 text-[10.5px] border-t border-amber-100/50 mt-2">
                                <p><strong>Proposed Salary:</strong> ₹{o.salary?.toLocaleString()}</p>
                                <p><strong>Expiry Date:</strong> {new Date(o.offer_validity).toLocaleDateString()}</p>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Accepted / verification steps */}
                      {['offer_accepted', 'background_verification', 'joining_confirmed'].includes(selectedCandidate.status) && (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${selectedCandidate.status === 'offer_accepted' ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>1. Accepted</span>
                            <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${selectedCandidate.status === 'background_verification' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>2. BG Check</span>
                            <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${selectedCandidate.status === 'joining_confirmed' ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>3. Date Confirmed</span>
                          </div>

                          {selectedCandidate.status === 'offer_accepted' && (
                            <button
                              type="button"
                              onClick={async () => {
                                await api.patch(`/recruitment/candidates/${selectedCandidate.id}/`, { status: 'background_verification' });
                                setSelectedCandidate({...selectedCandidate, status: 'background_verification'});
                                fetchData();
                              }}
                              className="w-full py-2.5 bg-[#6345ED] hover:bg-[#5235D6] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                            >
                              Start Background Check Verification
                            </button>
                          )}

                          {selectedCandidate.status === 'background_verification' && (
                            <button
                              type="button"
                              onClick={async () => {
                                await api.patch(`/recruitment/candidates/${selectedCandidate.id}/`, { status: 'joining_confirmed' });
                                setSelectedCandidate({...selectedCandidate, status: 'joining_confirmed'});
                                fetchData();
                              }}
                              className="w-full py-2.5 bg-[#6345ED] hover:bg-[#5235D6] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                            >
                              Confirm Joining Date Parameters
                            </button>
                          )}

                          {selectedCandidate.status === 'joining_confirmed' && (
                            <button
                              type="button"
                              onClick={async () => {
                                await api.patch(`/recruitment/candidates/${selectedCandidate.id}/`, { status: 'joined' });
                                setSelectedCandidate({...selectedCandidate, status: 'joined'});
                                fetchData();
                              }}
                              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                            >
                              Mark Candidate Joined Company
                            </button>
                          )}
                        </div>
                      )}

                      {/* Joined - waiting activation */}
                      {selectedCandidate.status === 'joined' && (
                        <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl space-y-2">
                          <h5 className="font-extrabold text-sky-900 text-xs flex items-center gap-1"><Clock size={14} className="animate-spin text-sky-600" /> Awaiting Employee Activation</h5>
                          <p className="text-[11px] text-sky-800 leading-relaxed">The candidate has officially joined the company. A System Administrator or HRBP must provision their internal workspace login credentials via the activations console.</p>
                          {['admin', 'hr'].includes(user?.role?.toLowerCase()) && (
                            <button
                              type="button"
                              onClick={() => {
                                setOnboardCandidate(selectedCandidate);
                                setOnboardForm({
                                  email: selectedCandidate.email,
                                  password: 'Welcome@2026',
                                  full_name: `${selectedCandidate.first_name} ${selectedCandidate.last_name}`,
                                  role: 'employee',
                                  department: selectedCandidate.job_requisition_title || '',
                                  designation: selectedCandidate.current_designation || ''
                                });
                                setShowOnboardModal(true);
                              }}
                              className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl cursor-pointer"
                            >
                              Activate Account Credentials Now
                            </button>
                          )}
                        </div>
                      )}

                      {/* Onboarded access active */}
                      {selectedCandidate.status === 'onboarded' && (
                        <div className="p-4 bg-green-50 border border-green-150 rounded-2xl text-xs text-green-800 flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-green-600" />
                          <div>
                            <h5 className="font-extrabold">Corporate Employee Activated</h5>
                            <p className="text-[10px] mt-0.5">ID generated, corporate email issued, and access permissions fully active.</p>
                          </div>
                        </div>
                      )}

                      {/* Rejected */}
                      {selectedCandidate.status === 'rejected' && (
                        <div className="p-4 bg-rose-50 border border-rose-150 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                          <AlertCircle size={16} className="text-rose-600" />
                          <div>
                            <h5 className="font-extrabold">Application Rejected</h5>
                            <p className="text-[10px] mt-0.5">This profile has been archived and removed from active rounds.</p>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-20">
                    <Users size={36} className="text-slate-300 mb-2 animate-bounce" />
                    <p className="text-sm font-extrabold">No Candidate Dossier Selected</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">Select an applicant card from the sidebar list to inspect credentials, schedule rounds, and release offers.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* INTERVIEWS TAB */}
          {activeTab === 'interviews' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              {filteredItems.map(int => (
                <motion.div 
                  key={int.id} 
                  whileHover={{ y: -2 }}
                  className="bg-white/85 backdrop-blur-md rounded-[2rem] p-6 border border-slate-100 shadow-md flex items-center justify-between hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                      <Calendar size={22} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{int.candidate_name || 'Candidate evaluation'}</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-1">{int.requisition_title || 'Requisition'} - {int.interview_type} round</p>
                      {int.outcome && (
                        <span className={`inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border mt-2 ${
                          int.outcome === 'pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          int.outcome === 'fail' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          Outcome: {int.outcome}
                        </span>
                      )}
                      <p className="text-xs text-slate-400 font-bold mt-2.5 flex items-center gap-1.5"><Clock size={12} /> {new Date(int.scheduled_date).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      {int.status}
                    </span>
                    {int.status === 'scheduled' && (
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
                        className="px-2.5 py-1.5 bg-[#6345ED] hover:bg-[#5235D6] text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        Start Live
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-full py-16 text-center border border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
                  <AlertCircle size={24} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-400">No scheduled interviews found matching query.</p>
                </div>
              )}
            </div>
          )}

          {/* OFFERS TAB */}
          {activeTab === 'offers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {filteredItems.map(off => (
                <motion.div 
                  key={off.id} 
                  whileHover={{ y: -4 }}
                  className="bg-white/85 backdrop-blur-md rounded-[2rem] p-6 border border-slate-100 shadow-md flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-emerald-500/5 filter blur-xl"></div>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900 leading-snug">{off.candidate_name || 'Talent offering'}</h4>
                    <p className="text-xs text-slate-400 font-extrabold capitalize mt-1 mb-1">{off.position_title}</p>
                    {off.requisition_title && <p className="text-[9px] text-violet-600 font-black uppercase tracking-widest mb-3.5">Req: {off.requisition_title}</p>}
                    <p className="text-xs text-slate-400 font-bold flex items-center gap-1.5"><Clock size={12} /> Valid till: {new Date(off.offer_validity).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-6">
                    <span className="text-xs font-black text-emerald-600">₹{off.salary?.toLocaleString()}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded border ${
                      off.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      off.status === 'declined' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                      'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                      {off.status}
                    </span>
                  </div>
                </motion.div>
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-full py-16 text-center border border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
                  <AlertCircle size={24} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-400">No active offer letters released matching query.</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* MODALS */}
      {/* 1. Job Requisition Modal */}
      {showJobModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl border border-slate-150 relative"
          >
            <div className="absolute top-3 right-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Sparkles size={10} className="animate-spin" /> Quick Post Active
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-50 flex items-center gap-2">
              <Briefcase className="text-violet-600" size={20} /> Release Job Requisition
            </h3>
            
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Job Title</label>
                <input type="text" required placeholder="e.g. Lead React Developer" value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Department</label>
                  <select 
                    required 
                    value={jobForm.department_ref} 
                    onChange={e => {
                      const deptId = e.target.value;
                      const deptName = departments.find(d => d.id === Number(deptId))?.name || '';
                      setJobForm({
                        ...jobForm,
                        department_ref: deptId,
                        department: deptName,
                        designation_ref: '',
                        designation: ''
                      });
                    }} 
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none shadow-inner"
                  >
                    <option value="">Choose department...</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Designation</label>
                  <select 
                    required 
                    value={jobForm.designation_ref} 
                    onChange={e => setJobForm({...jobForm, designation_ref: e.target.value, designation: designations.find(d => d.id === Number(e.target.value))?.name || ''})} 
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none shadow-inner"
                  >
                    <option value="">Choose designation...</option>
                    {filteredDesignations.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Grade Structure</label>
                  <select required value={jobForm.grade} onChange={e => setJobForm({...jobForm, grade: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none shadow-inner">
                    <option value="">Choose grade...</option>
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>{g.grade} (Base: ₹{g.base_salary?.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Target Openings</label>
                  <input type="number" required min="1" value={jobForm.position_count} onChange={e => setJobForm({...jobForm, position_count: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Min Salary (INR)</label>
                  <input type="number" required value={jobForm.salary_range_min} onChange={e => setJobForm({...jobForm, salary_range_min: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Max Salary (INR)</label>
                  <input type="number" required value={jobForm.salary_range_max} onChange={e => setJobForm({...jobForm, salary_range_max: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Required By</label>
                  <input type="date" required value={jobForm.required_by} onChange={e => setJobForm({...jobForm, required_by: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Job Description</label>
                  <textarea rows="1" required placeholder="Outline job criteria..." value={jobForm.description} onChange={e => setJobForm({...jobForm, description: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner resize-none"></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => navigate('/jobs')} className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-650 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black rounded-xl shadow-sm cursor-pointer">Post Job</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 2. Schedule Interview Modal */}
      {showInterviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-slate-150 relative"
          >
            <div className="absolute top-3 right-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Sparkles size={10} className="animate-spin" /> Evaluation Wizard Active
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-50 flex items-center gap-2">
              <Calendar className="text-violet-600" size={20} /> Schedule Interview Evaluation
            </h3>
            
            <form onSubmit={handleScheduleInterview} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Select Candidate</label>
                  <select required value={interviewForm.candidate} onChange={e => setInterviewForm({...interviewForm, candidate: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none shadow-inner">
                    <option value="">Choose candidate...</option>
                    {candidates.map(c => (
                      <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Select Requisition</label>
                  <select required value={interviewForm.requisition} onChange={e => setInterviewForm({...interviewForm, requisition: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none shadow-inner">
                    <option value="">Choose job...</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Interview Type</label>
                  <select value={interviewForm.interview_type} onChange={e => setInterviewForm({...interviewForm, interview_type: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none shadow-inner">
                    <option value="technical">Technical</option>
                    <option value="hr">HR</option>
                    <option value="managerial">Managerial</option>
                    <option value="screening">Screening</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Interviewer Staff</label>
                  <select required value={interviewForm.interviewer} onChange={e => setInterviewForm({...interviewForm, interviewer: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none shadow-inner">
                    <option value="">Select interviewer...</option>
                    {usersList.filter(u => u.role !== 'employee').map(u => (
                      <option key={u.id} value={u.id}>{u.full_name || u.username} ({u.role ? u.role.toUpperCase() : 'STAFF'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Scheduled Date & Time</label>
                  <input type="datetime-local" required value={interviewForm.scheduled_date} onChange={e => setInterviewForm({...interviewForm, scheduled_date: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Initial Outcome</label>
                  <select value={interviewForm.outcome} onChange={e => setInterviewForm({...interviewForm, outcome: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none shadow-inner">
                    <option value="pending">Pending</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                    <option value="hold">Hold</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Meeting Link (Google Meet / Zoom / Teams)</label>
                <input type="url" placeholder="https://meet.google.com/abc-defg-hij" value={interviewForm.meeting_link} onChange={e => setInterviewForm({...interviewForm, meeting_link: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowInterviewModal(false)} className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-655 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black rounded-xl shadow-sm cursor-pointer">Schedule</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 3. Release Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-slate-150 relative"
          >
            <div className="absolute top-3 right-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Sparkles size={10} className="animate-spin" /> Offer Dashboard Active
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-50 flex items-center gap-2">
              <UserCheck className="text-violet-600" size={20} /> Release Offer Letter
            </h3>
            
            <form onSubmit={handleReleaseOffer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Select Candidate</label>
                  <select required value={offerForm.candidate} onChange={e => setOfferForm({...offerForm, candidate: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none shadow-inner">
                    <option value="">Choose candidate...</option>
                    {candidates.map(c => (
                      <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Select Requisition</label>
                  <select required value={offerForm.requisition} onChange={e => setOfferForm({...offerForm, requisition: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none shadow-inner">
                    <option value="">Choose requisition...</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Position Title</label>
                  <input type="text" required placeholder="e.g. Senior Backend Engineer" value={offerForm.position_title} onChange={e => setOfferForm({...offerForm, position_title: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Offered CTC (INR)</label>
                  <input type="number" required placeholder="e.g. 1800000" value={offerForm.salary} onChange={e => setOfferForm({...offerForm, salary: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Joining Date</label>
                  <input type="date" required value={offerForm.start_date} onChange={e => setOfferForm({...offerForm, start_date: e.target.value, joining_date: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Issued Date</label>
                  <input type="date" required value={offerForm.issued_date} onChange={e => setOfferForm({...offerForm, issued_date: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Offer Validity</label>
                  <input type="date" required value={offerForm.offer_validity} onChange={e => setOfferForm({...offerForm, offer_validity: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Status</label>
                  <select value={offerForm.status} onChange={e => setOfferForm({...offerForm, status: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none shadow-inner">
                    <option value="issued">Issued</option>
                    <option value="accepted">Accepted</option>
                    <option value="declined">Declined</option>
                    <option value="revoked">Revoked</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => navigate('/offers')} className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-650 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black rounded-xl shadow-sm cursor-pointer">Release Offer</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 4. Candidate Onboarding Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-slate-150 relative text-left"
          >
            <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <UserCheck size={10} /> Offer Accepted
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-50 flex items-center gap-2">
              <UserCheck className="text-emerald-600" size={20} /> Onboard Candidate to Employee
            </h3>
            
            <form onSubmit={handleOnboardCandidateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Full Name</label>
                <input type="text" required value={onboardForm.full_name} onChange={e => setOnboardForm({...onboardForm, full_name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Email Address</label>
                <input type="email" required value={onboardForm.email} onChange={e => setOnboardForm({...onboardForm, email: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Department</label>
                  <input type="text" required value={onboardForm.department} onChange={e => setOnboardForm({...onboardForm, department: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Designation</label>
                  <input type="text" required value={onboardForm.designation} onChange={e => setOnboardForm({...onboardForm, designation: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Temporary Password</label>
                  <input type="text" required value={onboardForm.password} onChange={e => setOnboardForm({...onboardForm, password: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Role</label>
                  <select value={onboardForm.role} onChange={e => setOnboardForm({...onboardForm, role: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none shadow-inner">
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="recruiter">Recruiter</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowOnboardModal(false)} className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-sm cursor-pointer">Provision Account</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};
