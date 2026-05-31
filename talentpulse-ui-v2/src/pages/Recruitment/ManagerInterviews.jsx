import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar, Clock, Video, VideoOff, Mic, MicOff, 
  MessageSquare, Star, Send, ShieldAlert, Sparkles, Check, 
  X, AlertCircle, HelpCircle, FileText, CheckCircle2, Copy, Play, ArrowUpRight
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const ManagerInterviews = () => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMeetingRound, setActiveMeetingRound] = useState(null);
  
  // Webcam states
  const [videoActive, setVideoActive] = useState(true);
  const [audioActive, setAudioActive] = useState(true);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const videoRefCandidate = useRef(null);

  // Chat states
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // Assessment Feedback states
  const [probSolvingRating, setProbSolvingRating] = useState(3);
  const [techKnowRating, setTechKnowRating] = useState(3);
  const [codingRating, setCodingRating] = useState(3);
  const [projExpRating, setProjExpRating] = useState(3);
  const [sysDesignRating, setSysDesignRating] = useState(3);
  const [overallTechRating, setOverallTechRating] = useState(3);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [evalOutcome, setEvalOutcome] = useState('pass'); // pass, fail, hold
  
  const [submittingEval, setSubmittingEval] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Screen share & recording (UI simulated toggles)
  const [screenSharing, setScreenSharing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [isCandidateLive, setIsCandidateLive] = useState(false);
  const [presenceToast, setPresenceToast] = useState({ show: false, message: '', type: 'info' });

  // Presence signaling and polling hook
  useEffect(() => {
    if (!activeMeetingRound) {
      setIsCandidateLive(false);
      return;
    }

    const pollPresence = async () => {
      try {
        const response = await api.post(`/recruitment/interview-rounds/${activeMeetingRound.id}/join_room/`);
        const candidateLive = response.data.is_candidate_live;

        setIsCandidateLive(prev => {
          if (prev !== candidateLive) {
            if (candidateLive) {
              setPresenceToast({
                show: true,
                message: 'Candidate has joined the lobby! They are waiting for you.',
                type: 'success'
              });
            } else {
              setPresenceToast({
                show: true,
                message: 'Candidate has left the lobby room.',
                type: 'warning'
              });
            }
            setTimeout(() => {
              setPresenceToast(t => ({ ...t, show: false }));
            }, 4000);
          }
          return candidateLive;
        });
      } catch (err) {
        console.error("Failed to sync lobby presence:", err);
      }
    };

    pollPresence();
    const interval = setInterval(pollPresence, 2000);
    return () => clearInterval(interval);
  }, [activeMeetingRound]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recruitment/interview-rounds/?page_size=1000');
      const allRounds = res.data.results || res.data || [];
      // Managers only see their assigned rounds (e.g. Technical, Managerial, Final)
      const myRounds = allRounds.filter(r => 
        Number(r.interviewer) === Number(user?.id) || 
        ['technical', 'managerial', 'final'].includes(r.interview_type)
      );
      setInterviews(myRounds);
    } catch (err) {
      console.error("Failed to load Manager candidate interviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  // WebRTC Local Camera Stream Paired Capture
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
          console.error("Manager Camera access failed:", err);
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

  // Real-time Chat Sync Polling
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
            { sender: 'System', text: 'Technical Assessment Room active. Local paired camera feeds mounted. Enter ratings and submit technical evaluation metrics in the right assessment panel.' }
          ]);
        } else {
          setChatMessages(mapped);
        }
      } catch (err) {
        console.error("Failed to sync Manager live chat:", err);
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
      console.error("Failed to send Manager chat message:", err);
    }
  };

  const handleCopyLink = (link) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOnboardEvaluationSubmit = async (e) => {
    e.preventDefault();
    if (!activeMeetingRound) return;
    try {
      setSubmittingEval(true);
      setErrorMsg('');
      setSuccessMsg('');

      // Submit feedback ratings to the backend API view (permitted allowed_fields check updated)
      await api.patch(`/recruitment/interview-rounds/${activeMeetingRound.id}/`, {
        outcome: evalOutcome,
        rating: Number(overallTechRating),
        feedback: feedbackNotes,
        problem_solving_rating: Number(probSolvingRating),
        tech_knowledge_rating: Number(techKnowRating),
        coding_rating: Number(codingRating),
        project_experience_rating: Number(projExpRating),
        system_design_rating: Number(sysDesignRating),
        status: 'completed'
      });

      // Update candidate stage based on outcome
      if (evalOutcome === 'pass') {
        const nextStatus = activeMeetingRound.interview_type === 'hr' ? 'selected' : 'shortlisted';
        await api.patch(`/recruitment/candidates/${activeMeetingRound.candidate}/`, {
          status: nextStatus
        });
        setSuccessMsg(`Technical Assessment saved as PASS! Candidate status updated to ${nextStatus.toUpperCase()}.`);
      } else if (evalOutcome === 'fail') {
        await api.patch(`/recruitment/candidates/${activeMeetingRound.candidate}/`, {
          status: 'rejected'
        });
        setSuccessMsg(`Technical Assessment saved as FAIL! Candidate marked as REJECTED.`);
      } else {
        setSuccessMsg("Technical evaluation scores saved successfully.");
      }

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setActiveMeetingRound(null);
      fetchInterviews();
    } catch (err) {
      setErrorMsg('Failed to upload Technical feedback metrics.');
    } finally {
      setSubmittingEval(false);
    }
  };

  if (loading && interviews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (activeMeetingRound) {
    return (
      <div className="space-y-6 font-sans pb-16 text-slate-800 text-left">
        
        {/* Lobby Header */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#6345ED]" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-[#6345ED] border border-violet-100 flex items-center justify-center shrink-0">
              <Video size={20} className="animate-pulse text-[#6345ED]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">Technical Assessment Lobbies</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Round: {activeMeetingRound.interview_type} • Candidate: {activeMeetingRound.candidate_name}</p>
            </div>
          </div>
          
          <button
            onClick={async () => {
              if (stream) {
                stream.getTracks().forEach(track => track.stop());
              }
              try {
                await api.post(`/recruitment/interview-rounds/${activeMeetingRound.id}/leave_room/`);
              } catch (err) {
                console.error("Failed to post interviewer leave:", err);
              }
              setActiveMeetingRound(null);
            }}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 text-xs font-black rounded-xl transition-all cursor-pointer"
          >
            Exit Lobby
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Live feeds & Chat & conferencing controls */}
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
                    <Users size={48} className="text-slate-300 animate-pulse" />
                  </div>
                )}
                
                <div className="absolute top-4 left-4 bg-slate-900/70 px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md border border-white/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-200">You (Technical Manager)</span>
                </div>

                <div className="z-10 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-white tracking-wider">{user?.full_name}</span>
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
              </div>              {/* Candidate simulated connection */}
              <div className="bg-[#0C061A] rounded-[2rem] overflow-hidden aspect-video relative flex flex-col justify-end shadow-md border border-slate-955">
                {isCandidateLive ? (
                  <>
                    {videoActive ? (
                      <video 
                        ref={videoRefCandidate} 
                        autoPlay 
                        playsInline 
                        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/80">
                        <div className="w-16 h-16 rounded-full bg-violet-600/10 border border-violet-500/30 flex items-center justify-center mb-3">
                          <Users size={30} className="text-violet-400" />
                        </div>
                        <span className="text-xs font-black text-white">{activeMeetingRound.candidate_name}</span>
                        <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest mt-1">Candidate (Camera Off)</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-slate-950 to-[#12082b]">
                    <div className="relative mb-4 flex items-center justify-center">
                      <div className="absolute w-16 h-16 rounded-full border border-violet-500/20 animate-ping" />
                      <div className="absolute w-12 h-12 rounded-full border border-violet-500/40 animate-pulse" />
                      <div className="w-10 h-10 rounded-full bg-violet-600/10 border border-violet-500/60 flex items-center justify-center z-10">
                        <Users size={20} className="text-violet-400 animate-bounce" />
                      </div>
                    </div>
                    <span className="text-xs font-black text-white">Waiting for Candidate...</span>
                    <span className="text-[9.5px] font-black text-violet-400 uppercase tracking-widest mt-1">Lobby Active</span>
                  </div>
                )}
                
                <div className="absolute top-4 left-4 bg-slate-900/70 px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md border border-white/5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isCandidateLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-200">
                    {isCandidateLive ? 'Candidate Connected' : 'Waiting Lobby'}
                  </span>
                </div>

                <div className="z-10 bg-[#07030E]/60 p-4 text-center">
                  <span className="text-[9px] font-bold text-slate-400">
                    {isCandidateLive ? 'Feed verified • HD quality active' : 'Lobby open • Standby'}
                  </span>
                </div>
              </div>

            </div>

            {/* Conference control bar */}
            <div className="bg-white border border-slate-100 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div className="flex gap-2">
                <button 
                  onClick={() => setScreenSharing(!screenSharing)} 
                  className={`px-4 py-2 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    screenSharing ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles size={14} className={screenSharing ? 'animate-spin' : ''} /> {screenSharing ? 'Screen Sharing Active' : 'Start Screen Share'}
                </button>
                <button 
                  onClick={() => setRecording(!recording)} 
                  className={`px-4 py-2 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    recording ? 'bg-rose-50 border-rose-100 text-rose-700 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${recording ? 'bg-rose-600 animate-ping' : 'bg-slate-400'}`} />
                  {recording ? 'Recording Session' : 'Record Assessment'}
                </button>
              </div>
              
              {activeMeetingRound.meeting_link && (
                <button
                  onClick={() => handleCopyLink(activeMeetingRound.meeting_link)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Copy size={13} /> {copiedLink ? 'Link Copied!' : 'Copy Meeting Link'}
                </button>
              )}
            </div>

            {/* Chat section */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-5 flex flex-col gap-4 flex-1 min-h-[300px] max-h-[400px] shadow-sm">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-1.5"><MessageSquare size={13} className="text-violet-600" /> Chat Console</h3>
              
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 select-text">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-0.5">{msg.sender}</span>
                    <div className={`px-4 py-2.5 rounded-2xl text-xs font-semibold max-w-[80%] ${msg.sender === 'You' ? 'bg-[#6345ED] text-white' : 'bg-slate-100 text-slate-800'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChatMessage} className="flex gap-3 mt-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-violet-500 focus:bg-white transition-all shadow-inner"
                  placeholder="Type a message..."
                />
                <button type="submit" className="px-5 py-3 bg-[#6345ED] text-white text-xs font-black rounded-2xl shadow-md cursor-pointer hover:bg-[#5235D6]">Send</button>
              </form>
            </div>

          </div>

          {/* Right Column: Technical evaluation form & specs */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Candidate Specs Check */}
            <div className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-2">Academic Credentials</h3>
              
              <div className="space-y-3.5 text-xs font-semibold text-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Experience Level</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">{activeMeetingRound.experience || 'Fresher'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Qualifications</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">{activeMeetingRound.education_details || 'Graduate'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">College</span>
                    <p className="font-extrabold text-slate-900 mt-0.5 truncate">{activeMeetingRound.college || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">CGPA Score</span>
                    <p className="font-extrabold text-violet-650 mt-0.5">{activeMeetingRound.cgpa || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">10th Grade / Percentage</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">{activeMeetingRound.tenth_percentage ? `${activeMeetingRound.tenth_percentage}%` : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">12th Grade / Percentage</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">{activeMeetingRound.inter_percentage ? `${activeMeetingRound.inter_percentage}%` : 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Core Skills</span>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {activeMeetingRound.skills ? activeMeetingRound.skills.split(',').map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[9px] font-black text-slate-650 uppercase tracking-wider">{s.trim()}</span>
                    )) : <span className="text-[9px] text-slate-400 font-bold">None</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Assessment feedback */}
            <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm space-y-6">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-2.5 flex items-center gap-1.5"><CheckCircle2 size={15} className="text-violet-600" /> Technical Assessment Form</h3>
              
              {errorMsg && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold">{errorMsg}</div>}
              {successMsg && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-bold">{successMsg}</div>}

              <form onSubmit={handleOnboardEvaluationSubmit} className="space-y-4">
                
                {/* Problem Solving */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <span>Problem Solving</span>
                    <span className="text-[#6345ED] font-black">{probSolvingRating} / 5</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" 
                    value={probSolvingRating} onChange={e => setProbSolvingRating(e.target.value)}
                    className="w-full accent-violet-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Tech Knowledge */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <span>Technical Knowledge</span>
                    <span className="text-[#6345ED] font-black">{techKnowRating} / 5</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" 
                    value={techKnowRating} onChange={e => setTechKnowRating(e.target.value)}
                    className="w-full accent-violet-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Coding Skills */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <span>Coding Skills</span>
                    <span className="text-[#6345ED] font-black">{codingRating} / 5</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" 
                    value={codingRating} onChange={e => setCodingRating(e.target.value)}
                    className="w-full accent-violet-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Project Experience */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <span>Project Experience</span>
                    <span className="text-[#6345ED] font-black">{projExpRating} / 5</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" 
                    value={projExpRating} onChange={e => setProjExpRating(e.target.value)}
                    className="w-full accent-violet-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* System Design Knowledge */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <span>System Design Knowledge</span>
                    <span className="text-[#6345ED] font-black">{sysDesignRating} / 5</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" 
                    value={sysDesignRating} onChange={e => setSysDesignRating(e.target.value)}
                    className="w-full accent-violet-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Overall Tech Rating */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <span>Overall Technical Rating</span>
                    <span className="text-[#6345ED] font-black">{overallTechRating} / 5</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" 
                    value={overallTechRating} onChange={e => setOverallTechRating(e.target.value)}
                    className="w-full accent-violet-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Recommendation */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block pl-1">Technical Recommendation</label>
                  <select 
                    value={evalOutcome} 
                    onChange={e => setEvalOutcome(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-extrabold focus:outline-none shadow-sm focus:bg-white"
                  >
                    <option value="pass">Recommend Selection (Pass Round)</option>
                    <option value="fail">Recommend Rejection (Fail Candidate)</option>
                    <option value="hold">Hold Recommendation</option>
                  </select>
                </div>

                {/* Comments */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block pl-1">Technical Feedback / Comments</label>
                  <textarea 
                    rows="3" 
                    required 
                    value={feedbackNotes} 
                    onChange={e => setFeedbackNotes(e.target.value)}
                    placeholder="Enter comprehensive technical feedback, algorithms performance, system structure details..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white shadow-inner resize-none"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submittingEval}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-md cursor-pointer transition-all disabled:opacity-75"
                >
                  {submittingEval ? 'Saving Assessment...' : 'Submit Technical Ratings'}
                </button>
              </form>
            </div>

          </div>

        </div>

        {/* Floating Presence Toast Alert */}
        {presenceToast.show && (
          <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-fade-in backdrop-blur-xl transition-all ${
            presenceToast.type === 'success' 
              ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' 
              : presenceToast.type === 'warning'
              ? 'bg-rose-950/80 border-rose-500/30 text-rose-300'
              : 'bg-slate-950/80 border-slate-800 text-slate-300'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              presenceToast.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : presenceToast.type === 'warning'
                ? 'bg-rose-500/10 text-rose-400'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {presenceToast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-white">Lobby Status Alert</p>
              <p className="text-[11px] font-semibold mt-0.5 text-slate-300">{presenceToast.message}</p>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans pb-16 text-slate-800 text-left">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 bg-clip-text bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950">
          Candidate Interviews
        </h1>
        <p className="text-slate-400 text-xs font-semibold mt-1">Select assigned candidate portfolios, assess coding/systems design solutions, and record technical performance indicators.</p>
      </div>

      {/* Grid of interview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {interviews.map(round => {
          const isCompleted = round.status === 'completed';
          return (
            <motion.div 
              key={round.id}
              whileHover={{ y: -4 }}
              className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-md flex flex-col justify-between gap-5 relative overflow-hidden group hover:border-violet-300 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-violet-500/5 filter blur-xl"></div>
              
              <div className="space-y-3.5">
                <div className="flex justify-between items-start">
                  <span className="text-[8.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-violet-50 border border-violet-100 text-[#6345ED]">
                    {round.interview_type} round
                  </span>
                  <span className={`text-[8.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded border ${
                    isCompleted ? 'bg-green-50 border-green-100 text-green-700' : 'bg-amber-50 border-amber-100 text-amber-700'
                  }`}>
                    {round.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-slate-900 tracking-tight leading-none">{round.candidate_name}</h3>
                  <p className="text-[10.5px] text-slate-400 font-bold mt-2">Applied Position: <span className="text-slate-800 font-extrabold">{round.requisition_title || 'General'}</span></p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-650 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
                  <p className="flex items-center gap-1.5 text-[10.5px] font-bold"><Calendar size={13} className="text-slate-400" /> {new Date(round.scheduled_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <p className="flex items-center gap-1.5 text-[10.5px] font-bold"><Clock size={13} className="text-slate-400" /> {new Date(round.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  {round.meeting_link && (
                    <p className="text-[10.5px] font-bold truncate flex items-center gap-1.5 text-violet-600 select-all"><Video size={13} /> {round.meeting_link}</p>
                  )}
                </div>
              </div>

              {!isCompleted ? (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 mt-2">
                  {round.meeting_link ? (
                    <a 
                      href={round.meeting_link}
                      target="_blank" 
                      rel="noreferrer"
                      className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                    >
                      <Play size={11} /> Join Link
                    </a>
                  ) : (
                    <button
                      disabled
                      className="py-2.5 bg-slate-50 border border-slate-150 text-slate-400 text-xs font-black uppercase tracking-wider rounded-xl cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      <Play size={11} /> No Link
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setActiveMeetingRound(round);
                      setProbSolvingRating(round.problem_solving_rating || 3);
                      setTechKnowRating(round.tech_knowledge_rating || 3);
                      setCodingRating(round.coding_rating || 3);
                      setProjExpRating(round.project_experience_rating || 3);
                      setSysDesignRating(round.system_design_rating || 3);
                      setOverallTechRating(round.rating || 3);
                      setFeedbackNotes(round.feedback || '');
                      setEvalOutcome(round.outcome || 'pass');
                      setChatMessages([
                        { sender: 'System', text: 'Technical Assessment Room active. Local paired camera feeds mounted. Enter ratings and submit technical evaluation metrics in the right assessment panel.' }
                      ]);
                    }}
                    className="py-2.5 bg-[#6345ED] hover:bg-[#5235D6] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Video size={12} /> Start Lobby
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-green-50 border border-green-100 rounded-2xl mt-2 text-left">
                  <span className="text-[8px] font-black uppercase text-green-700 block">Technical Evaluation Recorded</span>
                  <p className="text-xs font-black text-slate-800 mt-1 capitalize">Recommendation: {round.outcome}</p>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed line-clamp-2 mt-1">"{round.feedback}"</p>
                </div>
              )}

            </motion.div>
          );
        })}

        {interviews.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] w-full">
            <AlertCircle size={28} className="mx-auto text-slate-350 mb-3" />
            <p className="text-sm font-extrabold text-slate-650 uppercase tracking-widest">No assigned technical evaluations</p>
            <p className="text-xs text-slate-400 font-bold mt-1">Upcoming code challenges or system architecture rounds scheduled for you will display here.</p>
          </div>
        )}
      </div>

      {/* Floating Presence Toast Alert */}
      {presenceToast.show && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-fade-in backdrop-blur-xl transition-all ${
          presenceToast.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' 
            : presenceToast.type === 'warning'
            ? 'bg-rose-950/80 border-rose-500/30 text-rose-300'
            : 'bg-slate-950/80 border-slate-800 text-slate-300'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            presenceToast.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-400' 
              : presenceToast.type === 'warning'
              ? 'bg-rose-500/10 text-rose-400'
              : 'bg-slate-800 text-slate-400'
          }`}>
            {presenceToast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-white">Lobby Status Alert</p>
            <p className="text-[11px] font-semibold mt-0.5 text-slate-300">{presenceToast.message}</p>
          </div>
        </div>
      )}

    </div>
  );
};
