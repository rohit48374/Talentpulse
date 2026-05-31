import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, FileText, Sliders, TrendingUp, TrendingDown, 
  Percent, Send, Plus, Search, Calendar, ChevronRight, CheckCircle2, 
  PieChart as ChartIcon, BarChart3, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export const PayrollPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('payslips');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Data lists
  const [myPayslips, setMyPayslips] = useState([]);
  const [allPayslips, setAllPayslips] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [reportsData, setReportsData] = useState({ total_salary_expense: 0, total_deductions: 0 });

  // Detailed Payslip Modal
  const [activeSlip, setActiveSlip] = useState(null);

  // Forms & Modal state
  const [showRunModal, setShowRunModal] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);

  const [runForm, setRunForm] = useState({ month_year: '' });
  const [structureForm, setStructureForm] = useState({ 
    employee_id: '', base_salary: '', hra: '', da: '', 
    other_allowances: '', pf_contribution: '', it: '', other_deductions: '' 
  });

  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const isPayrollExec = ['payroll', 'hr', 'hrbp', 'hr_admin', 'super_admin'].includes(user?.role?.toLowerCase());

  const fetchData = async () => {
    try {
      setLoading(true);
      if (isPayrollExec) {
        const [runsRes, structRes, slipsRes, mySlipsRes, reportsRes] = await Promise.all([
          api.get('/payroll/payroll-runs/'),
          api.get('/payroll/salary-structures/'),
          api.get('/payroll/payslips/'),
          api.get('/payslips/me/'),
          api.get('/payroll/reports/')
        ]);
        setPayrollRuns(runsRes.data.results || runsRes.data || []);
        setSalaryStructures(structRes.data.results || structRes.data || []);
        setAllPayslips(slipsRes.data.results || slipsRes.data || []);
        setMyPayslips(mySlipsRes.data.results || mySlipsRes.data || []);
        setReportsData(reportsRes.data || { total_salary_expense: 0, total_deductions: 0 });
      } else {
        const mySlipsRes = await api.get('/payslips/me/');
        setMyPayslips(mySlipsRes.data.results || mySlipsRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load payroll intelligence", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Route-Aware Synchronization Effect
  useEffect(() => {
    const path = location.pathname;
    if (path === '/payroll-runs') {
      setActiveTab('runs');
    } else if (path === '/salary-structures') {
      setActiveTab('structures');
    } else if (path === '/payslips') {
      setActiveTab(isPayrollExec ? 'all-slips' : 'my-payslips');
    } else if (path === '/deductions') {
      setActiveTab('structures');
    } else if (path === '/reports') {
      setActiveTab('reports');
    } else if (path === '/payslips/generate') {
      setActiveTab('runs');
      if (isPayrollExec) {
        setShowRunModal(true); // Auto-trigger payslip generation modal!
      }
    }
  }, [location.pathname, isPayrollExec]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setSearchQuery('');
    
    // Sync browser URL cleanly to avoid clashes
    if (tabId === 'runs') navigate('/payroll-runs');
    else if (tabId === 'structures') navigate('/salary-structures');
    else if (tabId === 'all-slips' || tabId === 'my-payslips') navigate('/payslips');
    else if (tabId === 'reports') navigate('/reports');
  };

  const handleProcessPayroll = async (e) => {
    e.preventDefault();
    try {
      setFormError('');
      setFormSuccess('');
      await api.post('/payroll/process/', {
        month_year: runForm.month_year
      });
      setFormSuccess(`Payroll run for ${runForm.month_year} processed successfully!`);
      setRunForm({ month_year: '' });
      setShowRunModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to process payroll run.');
    }
  };

  const handleCreateStructure = async (e) => {
    e.preventDefault();
    try {
      setFormError('');
      setFormSuccess('');
      await api.post('/payroll/salary-structures/', {
        employee: Number(structureForm.employee_id),
        base_salary: Number(structureForm.base_salary),
        hra: Number(structureForm.hra),
        da: Number(structureForm.da),
        other_allowances: Number(structureForm.other_allowances),
        pf_contribution: Number(structureForm.pf_contribution),
        it: Number(structureForm.it),
        other_deductions: Number(structureForm.other_deductions),
        effective_from: new Date().toISOString().split('T')[0]
      });
      setFormSuccess('Salary structure configured successfully!');
      setStructureForm({ employee_id: '', base_salary: '', hra: '', da: '', other_allowances: '', pf_contribution: '', it: '', other_deductions: '' });
      setShowStructureModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create salary structure.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Define filteredItems correctly to resolve ReferenceError
  const filteredItems = allPayslips.filter(slip => {
    const term = searchQuery.toLowerCase();
    const nameMatch = slip.employee_name?.toLowerCase().includes(term);
    const codeMatch = `EMP00${slip.employee}`.toLowerCase().includes(term);
    const monthMatch = slip.payroll_run_name?.toLowerCase().includes(term);
    return nameMatch || codeMatch || monthMatch;
  });

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

  return (
    <div className="space-y-8 font-sans pb-16 text-slate-800">
      
      {/* Header */}
      <div className="relative pb-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-violet-500/5 filter blur-3xl -z-10"></div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 bg-clip-text bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950">
            Compensation & Payroll
          </h1>
          <p className="text-slate-400 text-xs font-semibold mt-1">Manage corporate payroll cycle, employee salary grades, and download monthly statements.</p>
        </div>
        
        {isPayrollExec && (
          <div className="flex gap-3">
            {activeTab === 'runs' && (
              <button 
                onClick={() => setShowRunModal(true)}
                className="px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Plus size={16} /> Process Payroll Run
              </button>
            )}
            {activeTab === 'structures' && (
              <button 
                onClick={() => setShowStructureModal(true)}
                className="px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Plus size={16} /> Add Salary Grade
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2.5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {isPayrollExec && [
            { id: 'runs', label: 'Payroll Runs', icon: DollarSign },
            { id: 'structures', label: 'Salary Structures', icon: Sliders },
            { id: 'all-slips', label: 'All Payslips', icon: FileText },
            { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 }
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
          
          <button
            onClick={() => handleTabClick('my-payslips')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'my-payslips' 
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <FileText size={16} />
            My Statements
          </button>
        </div>

        {activeTab === 'all-slips' && (
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search payslips by employee..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-violet-500 focus:bg-white shadow-inner transition-all"
            />
          </div>
        )}
      </div>

      {/* Alerts */}
      {formSuccess && <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-extrabold flex items-center gap-2">{formSuccess}</div>}
      {formError && <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-extrabold flex items-center gap-2">{formError}</div>}

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          
          {/* MY PAYSLIPS TAB */}
          {activeTab === 'my-payslips' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myPayslips.map(slip => (
                <motion.div 
                  key={slip.id} 
                  whileHover={{ y: -4 }}
                  className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 border border-slate-100 shadow-md flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-violet-500/5 filter blur-xl"></div>
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 border border-violet-100/50 flex items-center justify-center shrink-0 mb-4">
                      <FileText size={20} />
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900">Payslip Statement</h3>
                    <p className="text-slate-400 text-xs font-bold mt-1 flex items-center gap-1.5"><Calendar size={12} /> {slip.payroll_run_name || slip.payroll_run?.month_year || 'Monthly statement'}</p>
                    
                    <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-150 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Net Payout</span>
                      <span className="text-base font-black text-violet-700">₹{Number(slip.net_salary).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setActiveSlip(slip)}
                    className="w-full mt-6 py-3 border border-slate-200 hover:bg-slate-100 text-slate-650 text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    View Breakdown <ChevronRight size={14} />
                  </button>
                </motion.div>
              ))}
              {myPayslips.length === 0 && (
                <div className="col-span-full py-16 text-center border border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
                  <AlertCircle size={24} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-400">No statements generated for your profile yet.</p>
                </div>
              )}
            </div>
          )}

          {/* RUNS TAB */}
          {activeTab === 'runs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {payrollRuns.map(run => (
                <motion.div 
                  key={run.id} 
                  whileHover={{ y: -4 }}
                  className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 border border-slate-100 shadow-md hover:shadow-lg transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-violet-500/5 filter blur-xl"></div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                      run.status === 'processed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {run.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{new Date(run.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{run.month_year} Run Cycle</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Processed Associates: <span className="text-slate-800 font-black">{run.total_employees}</span></p>

                  <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Gross Spend</p>
                      <p className="text-xs font-extrabold text-slate-800">₹{Number(run.total_gross_salary || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Deductions</p>
                      <p className="text-xs font-extrabold text-rose-600">₹{Number(run.total_deductions || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {payrollRuns.length === 0 && (
                <div className="col-span-full py-16 text-center border border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
                  <AlertCircle size={24} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-400">No monthly payroll runs executed yet.</p>
                </div>
              )}
            </div>
          )}

          {/* STRUCTURES TAB */}
          {activeTab === 'structures' && (
            <div className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-slate-100 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                      <th className="px-6 py-4">Employee ID</th>
                      <th className="px-6 py-4">Base Salary</th>
                      <th className="px-6 py-4">Allowances (HRA/DA/Other)</th>
                      <th className="px-6 py-4">Deductions (PF/IT)</th>
                      <th className="px-6 py-4">Effective Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {salaryStructures.map(st => (
                      <tr key={st.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{st.employee_id || `EMP00${st.employee}`}</td>
                        <td className="px-6 py-4 font-black text-slate-800">₹{Number(st.base_salary).toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">
                          <span>HRA: ₹{Number(st.hra).toLocaleString()}</span>
                          <span className="mx-2 text-slate-300">|</span>
                          <span>DA: ₹{Number(st.da).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-rose-600">
                          <span>PF: ₹{Number(st.pf_contribution).toLocaleString()}</span>
                          <span className="mx-2 text-slate-300">|</span>
                          <span>Tax: ₹{Number(st.it).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-400">{st.effective_from}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {salaryStructures.length === 0 && (
                  <div className="py-16 text-center">
                    <AlertCircle size={24} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-sm font-bold text-slate-400">No salary structures configured yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ALL PAYSLIPS TAB */}
          {activeTab === 'all-slips' && (
            <div className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-slate-100 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                      <th className="px-6 py-4">Associate</th>
                      <th className="px-6 py-4">Billing Month</th>
                      <th className="px-6 py-4">Gross Earnings</th>
                      <th className="px-6 py-4">Total Deductions</th>
                      <th className="px-6 py-4">Net Disbursement</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredItems.map(slip => (
                      <tr key={slip.id} className="hover:bg-slate-50/50 cursor-pointer transition-colors" onClick={() => setActiveSlip(slip)}>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 leading-none">{slip.employee_name || 'System Associate'}</p>
                          <p className="text-[9px] text-slate-400 font-black uppercase mt-1 tracking-widest">{slip.employee_id || `EMP00${slip.employee}`}</p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-400">{slip.payroll_run_name || 'Monthly Statement'}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">₹{Number(slip.gross_salary).toLocaleString()}</td>
                        <td className="px-6 py-4 font-bold text-rose-600">₹{Number(slip.total_deductions).toLocaleString()}</td>
                        <td className="px-6 py-4 font-black text-violet-750">₹{Number(slip.net_salary).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider ${
                            slip.status === 'disbursed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {slip.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredItems.length === 0 && (
                  <div className="py-16 text-center">
                    <AlertCircle size={24} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-sm font-bold text-slate-400">No statements in database matching query.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REPORTS & ANALYTICS TAB */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Bento Analytics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Total Salary Expense */}
                <div className="bg-gradient-to-br from-violet-600/90 to-indigo-700/90 rounded-[2rem] p-6 shadow-md text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 filter blur-xl"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-violet-200">TOTAL DISBURSED SALARIES</span>
                  <h3 className="text-3xl font-black mt-2">₹{Number(reportsData.total_salary_expense || 0).toLocaleString('en-IN')}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-violet-200 mt-4 font-bold">
                    <TrendingUp size={12} /> Active payroll aggregates
                  </div>
                </div>

                {/* Total Deductions */}
                <div className="bg-gradient-to-br from-rose-600/90 to-orange-600/90 rounded-[2rem] p-6 shadow-md text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 filter blur-xl"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-200">TOTAL PF & TAX DEDUCTIONS</span>
                  <h3 className="text-3xl font-black mt-2">₹{Number(reportsData.total_deductions || 0).toLocaleString('en-IN')}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-rose-200 mt-4 font-bold">
                    <TrendingDown size={12} /> Active compliance holdings
                  </div>
                </div>

                {/* Net Corporate Payout */}
                <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-[2rem] p-6 shadow-md text-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-sky-500/5 filter blur-xl"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">NET FINANCIAL LIABILITY</span>
                  <h3 className="text-3xl font-black mt-2 text-slate-900">
                    ₹{Number((reportsData.total_salary_expense || 0) + (reportsData.total_deductions || 0)).toLocaleString('en-IN')}
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 mt-4 font-bold">
                    <CheckCircle2 size={12} /> Cycle expenditures verified
                  </div>
                </div>

              </div>

              {/* Data Visualization Cards */}
              <div className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-slate-100 p-6 shadow-md">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-slate-50 pb-3">
                  <ChartIcon className="text-violet-600" size={16} /> Budgetary Allocations
                </h4>
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-150 flex flex-col md:flex-row justify-around items-center gap-6">
                  
                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Compensation</p>
                    <p className="text-lg font-black text-slate-900">70%</p>
                    <div className="w-24 bg-violet-600 h-2.5 rounded-full mx-auto shadow-sm"></div>
                  </div>

                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HRA & Allowances</p>
                    <p className="text-lg font-black text-slate-900">20%</p>
                    <div className="w-24 bg-sky-500 h-2.5 rounded-full mx-auto shadow-sm"></div>
                  </div>

                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PF & Statutory Shares</p>
                    <p className="text-lg font-black text-slate-900">10%</p>
                    <div className="w-24 bg-rose-500 h-2.5 rounded-full mx-auto shadow-sm"></div>
                  </div>

                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* DETAIL VIEW / PAYSLIP STATEMENT MODAL */}
      {activeSlip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:relative">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:max-w-full"
          >
            {/* Payslip Header Info */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-850 p-8 text-white flex justify-between items-start print:bg-none print:text-black">
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase">Hirevant Solutions</h2>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Enterprise Earnings Statement</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Statement Period</p>
                <p className="text-lg font-bold mt-0.5">{activeSlip.payroll_run_name || 'Monthly Statement'}</p>
              </div>
            </div>

            {/* Payslip Body */}
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Name</p>
                  <p className="font-extrabold text-slate-900 mt-0.5">{activeSlip.employee_name || 'Workforce Associate'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Associate Code</p>
                  <p className="font-extrabold text-slate-900 mt-0.5">{activeSlip.employee_id || `EMP00${activeSlip.employee}`}</p>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                
                {/* Left - Earnings */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 pb-2 border-b border-slate-50 flex items-center gap-1.5">
                    <TrendingUp size={14} /> Earnings & Allowances
                  </h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Base Salary</span>
                      <span className="font-extrabold text-slate-950">₹{Number(activeSlip.base_salary || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">HRA</span>
                      <span className="font-extrabold text-slate-950">₹{Number(activeSlip.hra || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">DA</span>
                      <span className="font-extrabold text-slate-950">₹{Number(activeSlip.da || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Other Allowances</span>
                      <span className="font-extrabold text-slate-950">₹{Number(activeSlip.other_allowances || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Right - Deductions */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-rose-600 pb-2 border-b border-slate-50 flex items-center gap-1.5">
                    <TrendingDown size={14} /> Deductions
                  </h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Provident Fund (PF)</span>
                      <span className="font-extrabold text-rose-650">₹{Number(activeSlip.pf_contribution || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Income Tax (IT)</span>
                      <span className="font-extrabold text-rose-655">₹{Number(activeSlip.it || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Other Deductions</span>
                      <span className="font-extrabold text-rose-655">₹{Number(activeSlip.other_deductions || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Total Aggregates */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-150 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold pt-4">
                <div className="flex justify-between w-full md:w-auto gap-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">Gross Earnings</span>
                    <span className="text-sm font-extrabold text-slate-900">₹{Number(activeSlip.gross_salary || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest text-right md:text-left">Deductions Total</span>
                    <span className="text-sm font-extrabold text-rose-600 text-right md:text-left">₹{Number(activeSlip.total_deductions || 0).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex flex-col bg-violet-600 text-white px-5 py-2.5 rounded-xl text-center md:text-left w-full md:w-auto">
                  <span className="text-[9px] uppercase tracking-widest text-violet-200">Net Take-Home Pay</span>
                  <span className="text-lg font-black mt-0.5">₹{Number(activeSlip.net_salary || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 bg-slate-50 border-t border-slate-150 flex justify-end gap-3 print:hidden">
              <button 
                type="button" 
                onClick={handlePrint}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-650 text-xs font-black rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                Print / PDF Statement
              </button>
              <button 
                type="button" 
                onClick={() => setActiveSlip(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Close Statement
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Run Payroll Modal */}
      {showRunModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl border border-slate-150 relative animate-fade-in"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-50 flex items-center gap-2">
              <DollarSign className="text-violet-600" size={20} /> Run Monthly Payroll Cycle
            </h3>
            
            <form onSubmit={handleProcessPayroll} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Billing Cycle Month & Year</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. 2026-05" 
                  value={runForm.month_year} 
                  onChange={e => setRunForm({ month_year: e.target.value })} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-violet-500 focus:bg-white shadow-inner transition-all" 
                />
                <p className="text-[9px] text-slate-400 font-bold mt-1.5">Format: YYYY-MM strictly (e.g. 2026-05) to sync payout disbursements.</p>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowRunModal(false)} className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-650 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black rounded-xl shadow-sm cursor-pointer">Execute Run</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 2. Salary Structure Modal */}
      {showStructureModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl border border-slate-150 relative"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-50 flex items-center gap-2">
              <Sliders className="text-violet-600" size={20} /> Configure Employee Salary Grade
            </h3>
            
            <form onSubmit={handleCreateStructure} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Employee ID</label>
                  <input type="number" required value={structureForm.employee_id} onChange={e => setStructureForm({...structureForm, employee_id: e.target.value})} placeholder="e.g. 1" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Base Salary (INR)</label>
                  <input type="number" required value={structureForm.base_salary} onChange={e => setStructureForm({...structureForm, base_salary: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">HRA</label>
                  <input type="number" required value={structureForm.hra} onChange={e => setStructureForm({...structureForm, hra: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">DA</label>
                  <input type="number" required value={structureForm.da} onChange={e => setStructureForm({...structureForm, da: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Other Allowances</label>
                  <input type="number" required value={structureForm.other_allowances} onChange={e => setStructureForm({...structureForm, other_allowances: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">PF Share</label>
                  <input type="number" required value={structureForm.pf_contribution} onChange={e => setStructureForm({...structureForm, pf_contribution: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Income Tax (IT)</label>
                  <input type="number" required value={structureForm.it} onChange={e => setStructureForm({...structureForm, it: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Other Deductions</label>
                  <input type="number" required value={structureForm.other_deductions} onChange={e => setStructureForm({...structureForm, other_deductions: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-inner" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowStructureModal(false)} className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-650 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black rounded-xl shadow-sm cursor-pointer">Save Structure</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};
