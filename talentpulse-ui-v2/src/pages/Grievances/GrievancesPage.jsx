import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, AlertTriangle, CheckCircle, Clock, User, 
  Send, HelpCircle, Eye, CornerDownRight, MessageSquare, Calendar
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const GrievancesPage = () => {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Grievance raise form state
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'workplace',
    description: ''
  });
  
  // Resolution active state
  const [activeResolution, setActiveResolution] = useState(null);
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState('resolved');
  
  const role = user?.role?.toLowerCase() || 'employee';
  const isHrbpOrAdmin = ['admin', 'hr', 'hrbp'].includes(role);

  const categories = {
    workplace: { label: 'Workplace Environment', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    payroll: { label: 'Payroll & Compensation', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    harassment: { label: 'Harassment & Bullying', color: 'bg-rose-50 text-rose-700 border-rose-100' },
    management: { label: 'Management & Leadership', color: 'bg-violet-50 text-violet-700 border-violet-100' },
    policy: { label: 'Policy & Benefits', color: 'bg-pink-50 text-pink-700 border-pink-100' },
    other: { label: 'Other Grievance', color: 'bg-slate-50 text-slate-700 border-slate-100' }
  };

  const statuses = {
    pending: { label: 'Pending Review', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    in_progress: { label: 'Under Investigation', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    resolved: { label: 'Resolved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    escalated: { label: 'Escalated', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    closed: { label: 'Closed', color: 'bg-slate-50 text-slate-500 border-slate-200' }
  };

  const fetchGrievances = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees/grievances/');
      setGrievances(res.data.results || res.data || []);
    } catch (err) {
      console.error("Failed to load grievances", err);
      setError("Failed to fetch grievances registry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, []);

  const handleSubmitGrievance = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;
    
    try {
      setError('');
      await api.post('/employees/grievances/', formData);
      setFormData({ title: '', category: 'workplace', description: '' });
      setIsSubmitOpen(false);
      fetchGrievances();
    } catch (err) {
      console.error("Failed to submit grievance", err);
      setError("Failed to submit grievance. Please double-check fields.");
    }
  };

  const handleResolveGrievance = async (e) => {
    e.preventDefault();
    if (!activeResolution || !resolutionDetails) return;

    try {
      setError('');
      await api.patch(`/employees/grievances/${activeResolution.id}/`, {
        status: resolutionStatus,
        resolution_details: resolutionDetails,
        assigned_to: user.id
      });
      setActiveResolution(null);
      setResolutionDetails('');
      fetchGrievances();
    } catch (err) {
      console.error("Failed to update resolution status", err);
      setError("Failed to update resolution details.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-16 font-sans text-slate-700"
    >
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Grievances & Disciplinary Hub</h1>
          <p className="text-slate-500 text-sm font-semibold mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            {isHrbpOrAdmin 
              ? 'Oversee corporate workplace harmony and resolve raised employee concerns.' 
              : 'Securely submit workplace concerns and track real-time resolution logs.'}
          </p>
        </div>
        
        {!isHrbpOrAdmin && (
          <button 
            onClick={() => setIsSubmitOpen(true)}
            className="px-6 py-3 bg-[#6345ED] hover:bg-[#5235D6] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            <AlertTriangle size={15} /> Raise Workplace Grievance
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> {error}
        </div>
      )}

      {/* Grid Layout splits between listing and operations panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Active Registry (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-50 pb-3">
              <Shield size={16} className="text-indigo-600" /> Active Grievances Registry
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            ) : grievances.length === 0 ? (
              <div className="text-center py-16">
                <HelpCircle size={40} className="mx-auto text-slate-350 mb-3 animate-bounce" />
                <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest">No Concerns Logged</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">All systems and workplace parameters are fully clear.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {grievances.map((g) => {
                  const cat = categories[g.category] || categories.other;
                  const stat = statuses[g.status] || statuses.pending;
                  
                  return (
                    <motion.div 
                      key={g.id}
                      whileHover={{ y: -2 }}
                      className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all shadow-sm flex flex-col gap-4 relative overflow-hidden"
                    >
                      {/* Top elements */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border ${cat.color}`}>
                            {cat.label}
                          </span>
                          <h4 className="text-base font-black text-slate-850 mt-1.5">{g.title}</h4>
                          {isHrbpOrAdmin && (
                            <p className="text-[10px] text-slate-450 font-bold mt-0.5 flex items-center gap-1.5">
                              <User size={12} /> Raised by: <span className="text-slate-650">{g.employee_name} ({g.employee_email})</span>
                            </p>
                          )}
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border shrink-0 ${stat.color}`}>
                          {stat.label}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-slate-500 text-xs font-semibold leading-relaxed bg-white border border-slate-100 p-3.5 rounded-xl">
                        {g.description}
                      </p>

                      {/* Resolution details if exists */}
                      {g.resolution_details && (
                        <div className="bg-emerald-50/20 border border-emerald-100/50 p-4 rounded-xl space-y-2 mt-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-[#0D9488] flex items-center gap-1.5">
                            <CheckCircle size={12} /> Resolution Response Log
                          </p>
                          <p className="text-slate-600 text-xs font-semibold leading-relaxed">
                            {g.resolution_details}
                          </p>
                          <div className="flex items-center gap-2 pt-2 border-t border-emerald-100/40 text-[9px] text-slate-400 font-bold uppercase">
                            <User size={10} /> Resolved by: <span className="text-[#0D9488] font-extrabold">{g.assigned_name || 'HRBP Officer'}</span>
                            {g.resolved_at && (
                              <>
                                <span className="mx-1">•</span>
                                <Calendar size={10} /> {new Date(g.resolved_at).toLocaleDateString()}
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Bottom action logs */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[10px] font-bold text-slate-400">
                        <span className="flex items-center gap-1"><Clock size={11} /> {new Date(g.created_at).toLocaleString()}</span>
                        
                        {isHrbpOrAdmin && !g.resolution_details && (
                          <button 
                            onClick={() => {
                              setActiveResolution(g);
                              setResolutionStatus(g.status === 'pending' ? 'in_progress' : g.status);
                            }}
                            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 font-black rounded-lg transition-colors flex items-center gap-1"
                          >
                            <MessageSquare size={10} /> Process Resolve Actions
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Side Panel (1/3 width) */}
        <div className="space-y-6">
          
          {/* Submit Modal Overlay for Employee */}
          <AnimatePresence>
            {isSubmitOpen && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-50 pb-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500 animate-pulse" /> Submit Workplace Concern
                </h3>
                <form onSubmit={handleSubmitGrievance} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-650">Grievance Title</label>
                    <input 
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="e.g. Discrepancy in Q1 incentive structures"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-650">Workplace Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none transition-colors"
                    >
                      {Object.entries(categories).map(([k, val]) => (
                        <option key={k} value={k}>{val.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-650">Detailed Incident Report</label>
                    <textarea 
                      rows={5}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      placeholder="Provide specific details including dates, names, or incident logs to help HRBP evaluate."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none transition-colors resize-none leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button 
                      type="submit"
                      className="flex-1 py-3 bg-[#6345ED] hover:bg-[#5235D6] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Send size={12} /> Log Grievance Report
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsSubmitOpen(false)}
                      className="px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </AnimatePresence>

          {/* Active HRBP Resolution panel */}
          <AnimatePresence>
            {activeResolution && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-200 relative overflow-hidden"
              >
                {/* Colored Accent highlight */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-500" />
                
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-50 pb-3 flex items-center gap-2 pt-1.5">
                  <CornerDownRight size={16} className="text-indigo-600" /> Resolution Control Panel
                </h3>

                <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-3.5 mb-5 space-y-1.5">
                  <p className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">Active Process Target</p>
                  <h4 className="font-extrabold text-xs text-slate-800">{activeResolution.title}</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Raised by: {activeResolution.employee_name}</p>
                </div>

                <form onSubmit={handleResolveGrievance} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-650">Process Status Update</label>
                    <select
                      value={resolutionStatus}
                      onChange={(e) => setResolutionStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none transition-colors"
                    >
                      <option value="in_progress">Under Investigation</option>
                      <option value="resolved">Resolved</option>
                      <option value="escalated">Escalated</option>
                      <option value="closed">Closed / Dismissed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-650">Resolution Response Details</label>
                    <textarea 
                      rows={6}
                      value={resolutionDetails}
                      onChange={(e) => setResolutionDetails(e.target.value)}
                      required
                      placeholder="Outline formal steps taken, core investigations, or final settlement agreements to log with the employee profile."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none transition-colors resize-none leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button 
                      type="submit"
                      className="flex-1 py-3 bg-[#6345ED] hover:bg-[#5235D6] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle size={12} /> Log Formal Resolution
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveResolution(null)}
                      className="px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grievance compliance guidelines card */}
          <div className="bg-gradient-to-br from-indigo-900 to-[#1E1145] rounded-3xl p-6 text-white relative overflow-hidden shadow-lg border border-indigo-950">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-violet-400/20 filter blur-2xl opacity-40"></div>
            <Shield className="text-white/10 absolute -right-6 -bottom-6 pointer-events-none" size={120} />
            
            <span className="text-[8px] font-black uppercase tracking-widest bg-white/20 text-white px-2.5 py-1 rounded-lg">Corporate Compliance Guide</span>
            <h4 className="text-base font-black tracking-tight mt-4 flex items-center gap-2">
              Fair Treatment Assurance
            </h4>
            <p className="text-[10px] text-indigo-150 font-semibold mt-2 leading-relaxed">
              Every employee has the statutory right to raise grievances without fear of reprisal. All submissions are kept strictly confidential under HRBP guidelines.
            </p>
            <ul className="space-y-1.5 pt-4 border-t border-white/10 mt-4 text-[9px] font-extrabold text-indigo-200 uppercase tracking-wide">
              <li className="flex items-center gap-1.5"><CheckCircle size={10} className="text-emerald-400" /> SLA Response: 48 Hours</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={10} className="text-emerald-400" /> Full Audit Trail Logged</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={10} className="text-emerald-400" /> Escalation Paths Active</li>
            </ul>
          </div>
        </div>

      </div>

    </motion.div>
  );
};
