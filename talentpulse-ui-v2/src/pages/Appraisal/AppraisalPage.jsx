import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Award, CheckCircle2, AlertCircle, Plus, 
  Send, User, FileText, Star, ClipboardList, Zap 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export const AppraisalPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('goals');
  const [loading, setLoading] = useState(true);

  // Performance data lists
  const [cycles, setCycles] = useState([]);
  const [myGoals, setMyGoals] = useState([]);
  const [myAppraisals, setMyAppraisals] = useState([]);
  const [teamReviews, setTeamReviews] = useState([]);

  // Modals & form fields
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(null); // active appraisal to review

  const [goalForm, setGoalForm] = useState({ appraisal_cycle: '', goal_title: '', goal_description: '', target_value: 100, weight: 10 });
  const [selfForm, setSelfForm] = useState({ appraisal_cycle: '', self_rating: '', self_comments: '' });
  const [managerReviewForm, setManagerReviewForm] = useState({ manager_rating: '', manager_comments: '', final_rating: '', performance_remarks: '' });

  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const isManager = ['manager', 'hr', 'hrbp', 'hr_admin', 'super_admin'].includes(user?.role?.toLowerCase());

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cycleRes, goalRes, appRes] = await Promise.all([
        api.get('/appraisal/cycles/'),
        api.get('/appraisal/goals/'),
        api.get('/appraisal/appraisals/')
      ]);
      
      setCycles(cycleRes.data.results || cycleRes.data || []);
      setMyGoals(goalRes.data.results || goalRes.data || []);
      setMyAppraisals(appRes.data.results || appRes.data || []);

      if (isManager) {
        const teamRes = await api.get('/manager/performance/');
        setTeamReviews(teamRes.data.results || teamRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load appraisal intelligence", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      setFormError('');
      setFormSuccess('');
      await api.post('/appraisal/goals/', {
        ...goalForm,
        appraisal_cycle: Number(goalForm.appraisal_cycle),
        target_value: Number(goalForm.target_value),
        weight: Number(goalForm.weight),
        employee: user.id
      });
      setFormSuccess('Performance goal set successfully!');
      setGoalForm({ appraisal_cycle: '', goal_title: '', goal_description: '', target_value: 100, weight: 10 });
      setShowGoalModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create strategic goal.');
    }
  };

  const handleSelfAppraisal = async (e) => {
    e.preventDefault();
    try {
      setFormError('');
      setFormSuccess('');
      await api.post('/appraisal/appraisals/', {
        ...selfForm,
        appraisal_cycle: Number(selfForm.appraisal_cycle),
        self_rating: Number(selfForm.self_rating),
        employee: user.id,
        manager: 5 // Defaulting to configured seed Manager ID
      });
      setFormSuccess('Self appraisal submitted to your reporting manager successfully!');
      setSelfForm({ appraisal_cycle: '', self_rating: '', self_comments: '' });
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to submit self appraisal review.');
    }
  };

  const handleManagerReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormError('');
      setFormSuccess('');
      await api.put(`/appraisal/appraisals/${showReviewForm.id}/`, {
        ...managerReviewForm,
        manager_rating: Number(managerReviewForm.manager_rating),
        final_rating: Number(managerReviewForm.final_rating)
      });
      setFormSuccess('Performance review completed successfully!');
      setShowReviewForm(null);
      setManagerReviewForm({ manager_rating: '', manager_comments: '', final_rating: '', performance_remarks: '' });
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to submit review ratings.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans pb-16">
      
      {/* Header */}
      <div className="pb-6 border-b border-surface-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-surface-900 tracking-tight">Performance & Appraisals</h1>
          <p className="text-surface-500 text-sm mt-1">Set strategic objectives, submit self evaluations, and complete performance appraisals.</p>
        </div>
        
        <div className="flex gap-3">
          {activeTab === 'goals' && (
            <button 
              onClick={() => setShowGoalModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-xs font-bold rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 hover:-translate-y-0.5"
            >
              <Plus size={16} /> Add Performance Goal
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2.5 rounded-3xl border border-surface-100 shadow-sm">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { id: 'goals', label: 'Strategic Goals', icon: TrendingUp },
            { id: 'cycles', label: 'Appraisal Cycles', icon: ClipboardList },
            { id: 'self-eval', label: 'Self Evaluation', icon: Star }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md' 
                  : 'text-surface-500 hover:bg-surface-50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
          
          {isManager && (
            <button
              onClick={() => { setActiveTab('team-reviews'); }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
                activeTab === 'team-reviews' 
                  ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md' 
                  : 'text-surface-500 hover:bg-surface-50'
              }`}
            >
              <Award size={16} />
              Team Appraisals
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {formSuccess && <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-xs font-bold">{formSuccess}</div>}
      {formError && <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold">{formError}</div>}

      {/* Main Tab panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          
          {/* STRATEGIC GOALS TAB */}
          {activeTab === 'goals' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myGoals.map(goal => (
                <div key={goal.id} className="bg-white rounded-3xl p-6 border border-surface-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-violet-500/5 filter blur-xl"></div>
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-violet-50 border border-violet-100 text-violet-600">
                        Weight: {goal.weight}%
                      </span>
                      <span className="text-[10px] text-surface-400 font-bold">Target Value: {goal.target_value}</span>
                    </div>
                    
                    <h3 className="font-bold text-base text-surface-900 mt-4">{goal.goal_title}</h3>
                    <p className="text-surface-600 text-xs mt-2 leading-relaxed bg-surface-50 p-3.5 rounded-2xl border border-surface-100">"{goal.goal_description}"</p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-surface-50 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-surface-400 flex items-center gap-1"><Zap size={12} className="text-amber-500" /> Active Goal</span>
                    <span className="text-xs font-black text-violet-600">Cycle ID: {goal.appraisal_cycle}</span>
                  </div>
                </div>
              ))}
              {myGoals.length === 0 && (
                <p className="text-sm font-medium text-surface-400 py-12 text-center col-span-full">No strategic goals defined yet. Use the header button to configure goals.</p>
              )}
            </div>
          )}

          {/* APPRAISAL CYCLES TAB */}
          {activeTab === 'cycles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cycles.map(cyc => (
                <div key={cyc.id} className="bg-white rounded-3xl p-6 border border-surface-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-blue-500/5 filter blur-xl"></div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-blue-50 border border-blue-100 text-blue-600">
                      FY {cyc.financial_year}
                    </span>
                    <h3 className="font-bold text-base text-surface-900 mt-4">{cyc.name}</h3>
                    <p className="text-surface-500 text-xs mt-1.5 leading-relaxed">"{cyc.description}"</p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-surface-50 flex flex-col gap-1.5 text-xs text-surface-400 font-semibold">
                    <div className="flex justify-between">
                      <span>Start Date:</span>
                      <span className="font-extrabold text-surface-800">{new Date(cyc.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>End Date:</span>
                      <span className="font-extrabold text-surface-800">{new Date(cyc.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              {cycles.length === 0 && (
                <p className="text-sm font-medium text-surface-400 py-12 text-center col-span-full">No active performance cycle configured</p>
              )}
            </div>
          )}

          {/* SELF EVALUATION TAB */}
          {activeTab === 'self-eval' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Column */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-3xl p-6 border border-surface-100 shadow-sm">
                  <h3 className="text-base font-bold text-surface-900 mb-6 border-b border-surface-50 pb-3 flex items-center gap-2">
                    <Star className="text-violet-600 shrink-0" size={18} /> Submit Self Appraisal Review
                  </h3>
                  
                  <form onSubmit={handleSelfAppraisal} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-surface-500">Active Appraisal Cycle</label>
                        <select required value={selfForm.appraisal_cycle} onChange={e => setSelfForm({...selfForm, appraisal_cycle: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs">
                          <option value="">Choose cycle...</option>
                          {cycles.map(cyc => (
                            <option key={cyc.id} value={cyc.id}>{cyc.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-surface-500">Self Evaluation Rating (1-5)</label>
                        <input type="number" required min="1" max="5" placeholder="e.g. 4" value={selfForm.self_rating} onChange={e => setSelfForm({...selfForm, self_rating: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-surface-500">Self Review Comments</label>
                      <textarea rows="4" required placeholder="Describe your achievements and contributions during this cycle..." value={selfForm.self_comments} onChange={e => setSelfForm({...selfForm, self_comments: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs resize-none"></textarea>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button type="submit" className="px-6 py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm hover:shadow-md transition-all">
                        <Send size={14} /> Submit Evaluation
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* History Column */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-3xl p-6 border border-surface-100 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-surface-900 border-b border-surface-50 pb-3">Evaluation History</h3>
                  
                  <div className="space-y-3">
                    {myAppraisals.map(app => (
                      <div key={app.id} className="p-4 rounded-2xl border border-surface-100 bg-surface-50 hover:border-violet-200 transition-all">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase tracking-widest text-violet-600">Cycle ID: {app.appraisal_cycle}</span>
                          <span className="text-xs font-black text-surface-900">Score: {app.final_rating || app.self_rating || 'N/A'}/5</span>
                        </div>
                        <p className="text-xs text-surface-600 mt-2 italic leading-relaxed">"{app.self_comments}"</p>
                        
                        {app.manager_comments && (
                          <div className="mt-3 pt-3 border-t border-surface-150 text-[10px] text-surface-500">
                            <span className="font-bold block text-surface-700">Manager P.O.V:</span>
                            <p className="mt-0.5 font-medium">"{app.manager_comments}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                    {myAppraisals.length === 0 && (
                      <p className="text-xs text-surface-400 p-2 italic text-center">No evaluations logged in this cycle</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TEAM REVIEWS TAB */}
          {activeTab === 'team-reviews' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teamReviews.map(rev => (
                <div key={rev.id} className="bg-white rounded-3xl p-6 border border-surface-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center pb-3 border-b border-surface-50">
                      <span className="text-xs font-black text-surface-900">{rev.employee_id || `EMP00${rev.employee}`}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-100">
                        Self rating: {rev.self_rating}/5
                      </span>
                    </div>

                    <div className="mt-4">
                      <span className="text-[9px] font-black uppercase text-surface-400">Employee Comments</span>
                      <p className="text-xs text-surface-700 bg-surface-50 border border-surface-100 p-3 rounded-2xl mt-1 italic">"{rev.self_comments}"</p>
                    </div>

                    {rev.final_rating && (
                      <div className="mt-4 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs">
                        <div className="flex justify-between items-center text-emerald-800 font-extrabold">
                          <span>Evaluation Complete</span>
                          <span>Score: {rev.final_rating}/5</span>
                        </div>
                        <p className="text-emerald-700 italic mt-1">"{rev.performance_remarks}"</p>
                      </div>
                    )}
                  </div>

                  {!rev.final_rating && (
                    <button 
                      onClick={() => {
                        setShowReviewForm(rev);
                        setManagerReviewForm({ manager_rating: rev.self_rating, manager_comments: '', final_rating: rev.self_rating, performance_remarks: '' });
                      }}
                      className="w-full mt-6 py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-xs font-black rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      Conduct Manager Evaluation
                    </button>
                  )}
                </div>
              ))}
              {teamReviews.length === 0 && (
                <p className="text-sm font-medium text-surface-400 py-12 text-center col-span-full">No active team evaluations pending review</p>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* MODALS */}
      {/* 1. Add Strategic Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-surface-150 relative"
          >
            <h3 className="text-lg font-bold text-surface-900 mb-4 pb-2 border-b border-surface-50 flex items-center gap-2">
              <TrendingUp className="text-violet-600" size={20} /> Add strategic objectives
            </h3>
            
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Appraisal Cycle</label>
                  <select required value={goalForm.appraisal_cycle} onChange={e => setGoalForm({...goalForm, appraisal_cycle: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs focus:outline-none">
                    <option value="">Choose cycle...</option>
                    {cycles.map(cyc => (
                      <option key={cyc.id} value={cyc.id}>{cyc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Goal Weight (%)</label>
                  <input type="number" required min="1" max="100" value={goalForm.weight} onChange={e => setGoalForm({...goalForm, weight: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-surface-500">Objective Goal Title</label>
                <input type="text" required placeholder="e.g. Deliver core HRMS modules" value={goalForm.goal_title} onChange={e => setGoalForm({...goalForm, goal_title: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-surface-500">Objective Details Description</label>
                <textarea rows="3" required placeholder="Outline exact target indicators..." value={goalForm.goal_description} onChange={e => setGoalForm({...goalForm, goal_description: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs resize-none"></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowGoalModal(false)} className="px-4 py-2.5 border border-surface-200 hover:bg-surface-50 text-surface-700 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-sm">Save Goal</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 2. Conduct Manager Evaluation Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl border border-surface-150 relative"
          >
            <h3 className="text-lg font-bold text-surface-900 mb-4 pb-2 border-b border-surface-50 flex items-center gap-2">
              <Award className="text-violet-600" size={20} /> Perform Manager Performance Review
            </h3>
            
            <div className="bg-surface-50 border border-surface-150 rounded-2xl p-4 text-xs mb-4 space-y-2">
              <div className="flex justify-between font-bold text-surface-700">
                <span>Associate ID: {showReviewForm.employee_id || `EMP00${showReviewForm.employee}`}</span>
                <span>Self Rating: {showReviewForm.self_rating}/5</span>
              </div>
              <p className="italic text-surface-600">Self Comments: "{showReviewForm.self_comments}"</p>
            </div>

            <form onSubmit={handleManagerReviewSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Manager Rating (1-5)</label>
                  <input type="number" required min="1" max="5" value={managerReviewForm.manager_rating} onChange={e => setManagerReviewForm({...managerReviewForm, manager_rating: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Final Assigned Rating (1-5)</label>
                  <input type="number" required min="1" max="5" value={managerReviewForm.final_rating} onChange={e => setManagerReviewForm({...managerReviewForm, final_rating: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs focus:outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-surface-500">Manager Evaluation Comments</label>
                <textarea rows="2" required placeholder="Log your professional comments..." value={managerReviewForm.manager_comments} onChange={e => setManagerReviewForm({...managerReviewForm, manager_comments: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs resize-none"></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-surface-500">Final Performance Remarks</label>
                <input type="text" required placeholder="e.g. Exceeded expectations during this milestone" value={managerReviewForm.performance_remarks} onChange={e => setManagerReviewForm({...managerReviewForm, performance_remarks: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs" />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowReviewForm(null)} className="px-4 py-2.5 border border-surface-200 hover:bg-surface-50 text-surface-700 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-sm">Save Appraisal</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};
