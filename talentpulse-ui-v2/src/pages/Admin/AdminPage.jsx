import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Users, FileText, Folder, Sliders, 
  Plus, Search, ShieldCheck, Mail, ShieldAlert, Award, UserPlus,
  Edit, Cpu, Landmark, BarChart3, X, ChevronRight, AlertTriangle,
  Lock, Unlock, RefreshCw, UserX, ArrowRightLeft, Eye, Activity,
  CheckCircle2, XCircle, Clock, Building2, BadgeCheck, LogIn
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export const AdminPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Systems data
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [candidates, setCandidates] = useState([]);

  // Onboarding Activation States
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardCandidate, setOnboardCandidate] = useState(null);
  const [onboardForm, setOnboardForm] = useState({ 
    email: '', password: 'Welcome@2026', full_name: '', role: 'employee', department: '', designation: '' 
  });

  // Enterprise Roles & Governance state
  const [governanceData, setGovernanceData] = useState([]);
  const [governanceLoading, setGovernanceLoading] = useState(false);
  const [selectedGovernanceRole, setSelectedGovernanceRole] = useState(null); // role object with users
  const [showGovernanceModal, setShowGovernanceModal] = useState(false);
  const [governanceSearch, setGovernanceSearch] = useState('');
  const [actionUser, setActionUser] = useState(null); // user to perform action on
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });
  const [actionForm, setActionForm] = useState({ role: 'employee', department: '' });

  // Modals & forms
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [activeRoleAssign, setActiveRoleAssign] = useState(null); // User to edit role

  const [userForm, setUserForm] = useState({ email: '', password: '', full_name: '', role: 'employee', department: '', designation: '' });
  const [deptForm, setDeptForm] = useState({ name: '', description: '', budget: '', head: '', designations: '' });
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [roleForm, setRoleForm] = useState({
    role: '',
    department: '',
    designation: '',
    reporting_manager: '',
    office_location: '',
    is_active: true
  });

  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const getTabFromPath = (pathname) => {
    if (pathname.startsWith('/users') || pathname.startsWith('/employees/create')) return 'users';
    if (pathname.startsWith('/roles')) return 'roles';
    if (pathname.startsWith('/departments')) return 'departments';
    if (pathname.startsWith('/audit-logs')) return 'audit';
    if (pathname.startsWith('/settings') || pathname.startsWith('/configs') || pathname.startsWith('/leaves/config')) return 'settings';
    if (pathname.startsWith('/policies')) return 'policies';
    if (pathname.startsWith('/activations')) return 'activations';
    return 'users';
  };

  const handleTabChange = (tabId) => {
    setSearchQuery('');
    if (tabId === 'users') navigate('/users');
    else if (tabId === 'roles') navigate('/roles');
    else if (tabId === 'departments') navigate('/departments');
    else if (tabId === 'audit') navigate('/audit-logs');
    else if (tabId === 'settings') navigate('/settings');
    else if (tabId === 'policies') navigate('/policies');
    else if (tabId === 'activations') navigate('/activations');
  };

  useEffect(() => {
    const tab = getTabFromPath(path);
    setActiveTab(tab);
    
    if (path === '/users/create' || path === '/employees/create') {
      setShowUserModal(true);
    } else if (path === '/roles/assign') {
      if (usersList.length > 0) {
        setActiveRoleAssign(usersList[0]);
        setRoleForm({
          role: usersList[0].role || 'employee',
          department: usersList[0].department || '',
          designation: usersList[0].designation || '',
          reporting_manager: usersList[0].reporting_manager || '',
          office_location: usersList[0].office_location || '',
          is_active: usersList[0].is_active !== false
        });
      }
    }
  }, [path, usersList.length]);

  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const totalStaff = usersList.length;
  const maleStaff = usersList.filter(u => u.gender === 'M').length;
  const femaleStaff = usersList.filter(u => u.gender === 'F').length;
  const pendingStaff = usersList.filter(u => !u.is_active).length;

  const isAdmin = ['admin', 'hr'].includes(user?.role?.toLowerCase());
  const isHRUser = user?.role?.toLowerCase() === 'hr';

  // Role-creation permission matrix (mirrors backend enforcement)
  // HR    â†’ can create/assign: employee, manager, recruiter
  // Admin â†’ can create/assign: employee, manager, recruiter, hr, payroll
  // Admin CANNOT create another admin (super-admin privilege only)
  const availableRoles = isHRUser
    ? [
        { value: 'employee',  label: 'Employee' },
        { value: 'manager',   label: 'Manager' },
        { value: 'recruiter', label: 'Recruiter' },
      ]
    : [
        { value: 'employee',  label: 'Employee' },
        { value: 'manager',   label: 'Manager' },
        { value: 'recruiter', label: 'Recruiter' },
        { value: 'hr',        label: 'HR' },
        { value: 'payroll',   label: 'Payroll Executive' },
      ];


  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, logsRes, deptRes, candRes] = await Promise.all([
        api.get('/users/'),
        api.get('/audit-logs/'),
        api.get('/departments/'),
        api.get('/recruitment/candidates/')
      ]);
      
      setUsersList(usersRes.data.results || usersRes.data || []);
      setAuditLogs(logsRes.data.results || logsRes.data || []);
      setDepartments(deptRes.data.results || deptRes.data || []);
      setCandidates(candRes.data.results || candRes.data || []);
    } catch (err) {
      console.error("Failed to load systems operations data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      Promise.resolve().then(() => fetchData());
    } else {
      Promise.resolve().then(() => setLoading(false));
    }
  }, [user, isAdmin]);

  const extractErrorMessage = (err, defaultMsg) => {
    if (err.response && err.response.data) {
      const data = err.response.data;
      if (data.detail) return data.detail;
      if (data.error) return data.error;
      if (data.message) return data.message;
      
      const firstKey = Object.keys(data)[0];
      if (firstKey) {
        const val = data[firstKey];
        const valStr = Array.isArray(val) ? val[0] : (typeof val === 'string' ? val : JSON.stringify(val));
        return `${firstKey.charAt(0).toUpperCase() + firstKey.slice(1)}: ${valStr}`;
      }
      return JSON.stringify(data);
    }
    return defaultMsg;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setFormError('');
      setFormSuccess('');
      await api.post('/users/create/', {
        ...userForm
      });
      setFormSuccess('User credentials registered successfully!');
      setUserForm({ email: '', password: '', full_name: '', role: 'employee', department: '', designation: '' });
      setShowUserModal(false);
      fetchData();
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Failed to register new user.'));
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      setFormError('');
      setFormSuccess('');
      const payload = {
        name: deptForm.name,
        description: deptForm.description,
        budget: deptForm.budget ? Number(deptForm.budget) : null,
        head: deptForm.head ? Number(deptForm.head) : null,
        designations: deptForm.designations  // comma-separated string, handled by backend viewset
      };

      if (editingDeptId) {
        // Use PATCH (partial update) â€” avoids re-triggering unique validation on unchanged name
        await api.patch(`/employees/departments/${editingDeptId}/`, payload);
        setFormSuccess('Organizational unit updated successfully!');
      } else {
        await api.post('/employees/departments/', payload);
        setFormSuccess('Organizational unit configured successfully!');
      }

      setDeptForm({ name: '', description: '', budget: '', head: '', designations: '' });
      setEditingDeptId(null);
      setShowDeptModal(false);
      fetchData();
    } catch (err) {
      setFormError(extractErrorMessage(err, editingDeptId ? 'Failed to update department.' : 'Failed to configure department.'));
    }
  };


  const handleAssignRoleSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormError('');
      setFormSuccess('');
      await api.post('/roles/assign/', {
        user_id: activeRoleAssign.id,
        role: roleForm.role,
        department: roleForm.department,
        designation: roleForm.designation,
        reporting_manager: roleForm.reporting_manager,
        office_location: roleForm.office_location,
        is_active: roleForm.is_active
      });
      setFormSuccess(`Privilege authorization and assignments updated successfully for ${activeRoleAssign.email}`);
      setActiveRoleAssign(null);
      setRoleForm({ role: '', department: '', designation: '', reporting_manager: '', office_location: '', is_active: true });
      fetchData();
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Failed to update user security privilege.'));
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
      
      // Update candidate status to reflect activation/joining has finished
      await api.patch(`/recruitment/candidates/${onboardCandidate.id}/`, {
        status: 'onboarded'
      });

      setFormSuccess(`Candidate ${onboardForm.full_name} successfully activated as corporate employee! User account and Employee ID generated.`);
      setShowOnboardModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error || err.response?.data?.detail || 'Failed to activate employee account.');
    }
  };

  const getFilteredData = () => {
    const query = searchQuery.toLowerCase();
    if (activeTab === 'users') {
      return usersList.filter(u => u.full_name?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query) || u.role?.toLowerCase().includes(query));
    } else if (activeTab === 'audit') {
      return auditLogs.filter(l => l.email?.toLowerCase().includes(query) || l.action?.toLowerCase().includes(query) || l.model?.toLowerCase().includes(query));
    } else if (activeTab === 'activations') {
      return candidates.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(query) || c.email?.toLowerCase().includes(query) || c.status?.toLowerCase().includes(query));
    } else {
      return departments.filter(d => d.name?.toLowerCase().includes(query));
    }
  };

  const filteredItems = getFilteredData();

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white border border-rose-100 rounded-3xl shadow-sm">
        <ShieldAlert size={48} className="text-rose-500 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-surface-900">Security Access Denied</h3>
        <p className="text-surface-500 text-sm mt-1 max-w-md">Your active role profile does not possess authorization to operate the Administrative Systems Console.</p>
      </div>
    );
  }

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
          <h1 className="text-3xl font-black text-surface-900 tracking-tight">Systems Control Center</h1>
          <p className="text-surface-500 text-sm mt-1">Manage tenant users credentials, assign dynamic RBAC permissions, audit data activities, and setup departments.</p>
        </div>
        
        <div className="flex gap-3">
          {activeTab === 'users' && (
            <button 
              onClick={() => setShowUserModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-xs font-bold rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 hover:-translate-y-0.5 cursor-pointer"
            >
              <UserPlus size={16} /> Register User
            </button>
          )}
          {activeTab === 'departments' && (
            <button 
              onClick={() => {
                setEditingDeptId(null);
                setDeptForm({ name: '', description: '', budget: '', head: '', designations: '' });
                setShowDeptModal(true);
              }}
              className="px-5 py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-xs font-bold rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus size={16} /> Add Department
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2.5 rounded-3xl border border-surface-100 shadow-sm">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { id: 'users', label: 'Active Users', icon: Users },
            { id: 'roles', label: 'Roles & Permissions', icon: Shield },
            { id: 'departments', label: 'Departments', icon: Folder },
            { id: 'activations', label: 'Hiring & Activations', icon: ShieldCheck },
            { id: 'audit', label: 'System Audit Logs', icon: FileText },
            { id: 'settings', label: 'System Settings', icon: Sliders },
            { id: 'policies', label: 'Policies', icon: Award }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md' 
                  : 'text-surface-500 hover:bg-surface-50'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== 'configs' && (
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl text-surface-900 text-xs focus:outline-none focus:border-primary-500 shadow-inner"
            />
          </div>
        )}
      </div>

      {/* Alerts */}
      {formSuccess && <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-xs font-bold">{formSuccess}</div>}
      {formError && <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold">{formError}</div>}

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          
          {/* ACTIVE USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              
              {/* Executive Operational Metrics Summary Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Total Staff */}
                <div className="bg-white rounded-3xl p-6 border border-surface-100 shadow-sm relative overflow-hidden flex items-center justify-between hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-violet-500/5 filter blur-xl"></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-surface-400 tracking-wider">Total Associates</p>
                    <p className="text-3xl font-black text-surface-900 mt-2">{totalStaff}</p>
                    <p className="text-[10px] text-violet-600 font-bold mt-1">Full-time Staff</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center">
                    <Users size={22} />
                  </div>
                </div>

                {/* Male Staff */}
                <div className="bg-white rounded-3xl p-6 border border-surface-100 shadow-sm relative overflow-hidden flex items-center justify-between hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-blue-500/5 filter blur-xl"></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-surface-400 tracking-wider">Male Staff</p>
                    <p className="text-3xl font-black text-surface-900 mt-2">{maleStaff}</p>
                    <p className="text-[10px] text-blue-600 font-bold mt-1">
                      {totalStaff ? ((maleStaff / totalStaff) * 100).toFixed(0) : 0}% of Total
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black text-sm">
                    M
                  </div>
                </div>

                {/* Female Staff */}
                <div className="bg-white rounded-3xl p-6 border border-surface-100 shadow-sm relative overflow-hidden flex items-center justify-between hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-rose-500/5 filter blur-xl"></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-surface-400 tracking-wider">Female Staff</p>
                    <p className="text-3xl font-black text-surface-900 mt-2">{femaleStaff}</p>
                    <p className="text-[10px] text-rose-600 font-bold mt-1">
                      {totalStaff ? ((femaleStaff / totalStaff) * 100).toFixed(0) : 0}% of Total
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-black text-sm">
                    F
                  </div>
                </div>

                {/* Pending Onboarding */}
                <div className="bg-white rounded-3xl p-6 border border-surface-100 shadow-sm relative overflow-hidden flex items-center justify-between hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-amber-500/5 filter blur-xl"></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-surface-400 tracking-wider">Pending Access</p>
                    <p className="text-3xl font-black text-surface-900 mt-2">{pendingStaff}</p>
                    <p className="text-[10px] text-amber-600 font-bold mt-1">Suspended / Review</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                    <ShieldAlert size={20} />
                  </div>
                </div>

              </div>

              {/* Premium Operations Console User Grid */}
              <div className="bg-white rounded-3xl border border-surface-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-surface-50 text-surface-500 text-[10px] font-black uppercase tracking-widest border-b border-surface-100">
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Structural Placement</th>
                        <th className="px-6 py-4">Security Privilege</th>
                        <th className="px-6 py-4">Gender</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100 text-xs font-bold text-slate-600">
                      {filteredItems.map(usr => {
                        const initials = (usr.full_name || 'System Associate')
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2);

                        const getRoleBadgeClass = (role) => {
                          const r = role?.toLowerCase() || 'employee';
                          if (r === 'admin') return 'bg-rose-50 text-rose-700 border-rose-200';
                          if (r === 'hr') return 'bg-violet-50 text-violet-700 border-violet-200';
                          if (r === 'manager') return 'bg-amber-50 text-amber-700 border-amber-200';
                          if (r === 'recruiter') return 'bg-cyan-50 text-cyan-700 border-cyan-200';
                          if (r === 'payroll') return 'bg-teal-50 text-teal-700 border-teal-200';
                          return 'bg-green-50 text-green-700 border-green-200';
                        };

                        return (
                          <tr key={usr.id} className="hover:bg-surface-50/50 transition-colors">
                            
                            {/* 1. Profile image and name */}
                            <td className="px-6 py-4 flex items-center gap-3">
                              {usr.profile_image ? (
                                <img 
                                  src={usr.profile_image.startsWith('http') ? usr.profile_image : `http://${window.location.hostname}:8000${usr.profile_image}`} 
                                  alt={usr.full_name} 
                                  className="w-10 h-10 rounded-full object-cover border border-violet-100 hover:scale-105 transition-transform"
                                  onError={(e) => { e.target.onerror = null; e.target.src = ''; }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-blue-500 text-white flex items-center justify-center text-xs font-black tracking-wider shadow-sm hover:scale-105 transition-transform">
                                  {initials}
                                </div>
                              )}
                              <div>
                                <p className="text-surface-900 font-extrabold text-sm flex items-center gap-1.5">
                                  {usr.full_name || 'System Associate'}
                                  {usr.employee_id && (
                                    <span className="text-[9px] font-black bg-surface-100 text-surface-500 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                      ID: {usr.employee_id}
                                    </span>
                                  )}
                                </p>
                                <p className="text-surface-400 font-medium text-[10px] flex items-center gap-1 mt-0.5">
                                  <Mail size={10} /> {usr.email}
                                </p>
                              </div>
                            </td>

                            {/* 2. Structural Placement */}
                            <td className="px-6 py-4">
                              {usr.department ? (
                                <div>
                                  <p className="text-surface-900 font-bold text-xs">{usr.department}</p>
                                  <p className="text-surface-400 font-semibold text-[10px] mt-0.5">{usr.designation || 'Team Member'}</p>
                                </div>
                              ) : (
                                <span className="px-2 py-0.5 rounded-[6px] text-[9px] uppercase tracking-wider font-extrabold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                                  Pending Allocation
                                </span>
                              )}
                            </td>

                            {/* 3. Security Privilege badge */}
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-xl text-[10px] uppercase tracking-wider font-black border ${getRoleBadgeClass(usr.role)}`}>
                                {(usr.role || 'employee').replace('_', ' ')}
                              </span>
                            </td>

                            {/* 4. Gender badge */}
                            <td className="px-6 py-4">
                              {usr.gender === 'M' ? (
                                <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                                  Male
                                </span>
                              ) : usr.gender === 'F' ? (
                                <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                                  Female
                                </span>
                              ) : usr.gender === 'O' ? (
                                <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                                  Other
                                </span>
                              ) : (
                                <span className="text-surface-400 font-semibold text-[10px]">
                                  Unspecified
                                </span>
                              )}
                            </td>

                            {/* 5. Status badge */}
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-xl text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1 w-max border ${
                                usr.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                <ShieldCheck size={10} /> {usr.is_active ? 'Active' : 'Suspended'}
                              </span>
                            </td>

                            {/* 6. Update action */}
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => {
                                  setActiveRoleAssign(usr);
                                  setRoleForm({
                                    role: usr.role || 'employee',
                                    department: usr.department || '',
                                    designation: usr.designation || '',
                                    reporting_manager: usr.reporting_manager || '',
                                    office_location: usr.office_location || '',
                                    is_active: usr.is_active !== false
                                  });
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-violet-600 hover:text-violet-800 transition-colors border border-surface-200 hover:border-violet-100 bg-white px-3 py-1.5 rounded-xl shadow-sm cursor-pointer"
                              >
                                Edit Profile & Dept
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ONBOARDING & ACTIVATIONS TAB */}
          {activeTab === 'activations' && (
            <div className="space-y-8 text-left">
              
              {/* Section 1: Hired Candidates Pending Activation */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-black text-surface-900 tracking-tight flex items-center gap-2">
                      <ShieldCheck className="text-emerald-600 animate-pulse" size={22} /> Hired Candidates Pending Activation
                    </h2>
                    <p className="text-surface-500 text-xs mt-1">Review finalized candidates who accepted their offer letters, and provision their internal employee credentials.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {candidates.filter(c => c.status === 'joined').length} Awaiting Activation
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {candidates
                    .filter(c => c.status === 'joined')
                    .map(cand => (
                      <div 
                        key={cand.id}
                        className="bg-white rounded-[2.2rem] p-6 border border-emerald-100 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-emerald-500/5 filter blur-xl"></div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                Hired Candidate
                              </span>
                              <h3 className="font-black text-lg text-surface-900 mt-2">{cand.first_name} {cand.last_name}</h3>
                              <p className="text-xs text-slate-500 font-semibold">{cand.email} • {cand.phone}</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-emerald-55/10 border border-emerald-200 text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 size={10} /> Offer Accepted
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700 border-t border-slate-50 pt-4">
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Applied Role</span>
                              <p className="text-slate-900 font-extrabold mt-0.5">{cand.job_requisition_title || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Academic Record</span>
                              <p className="text-violet-650 font-extrabold mt-0.5">{cand.education_details || 'Graduate'}</p>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Disclosed Backlogs</span>
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${Number(cand.backlogs) > 0 ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700'}`}>
                                {cand.backlogs || 0} Backlogs
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Experience Level</span>
                              <p className="text-slate-900 mt-0.5">{cand.experience || 'Fresh Graduate'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-50">
                          <button
                            type="button"
                            onClick={() => handleInitiateOnboarding(cand)}
                            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <UserPlus size={14} /> Approve & Activate Account
                          </button>
                        </div>
                      </div>
                    ))}
                  {candidates.filter(c => c.status === 'joined').length === 0 && (
                    <div className="col-span-full py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[2rem]">
                      <BadgeCheck size={28} className="mx-auto text-slate-400 mb-2 animate-pulse" />
                      <p className="text-sm font-bold text-slate-450">No hired candidates pending activation.</p>
                      <p className="text-xs text-slate-400 mt-0.5">When candidates accept released offers in their portal, they will appear here instantly.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Recruitment History (Hiring Audit) */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div>
                  <h2 className="text-xl font-black text-surface-900 tracking-tight flex items-center gap-2">
                    <FileText className="text-violet-650" size={22} /> Operations Hiring History & Audit Trail
                  </h2>
                  <p className="text-surface-500 text-xs mt-1">Complete historic register of all candidates in final stages (Offered, Joined/Activated, or Rejected).</p>
                </div>

                <div className="bg-white rounded-3xl border border-surface-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-surface-50 text-surface-500 text-[10px] font-black uppercase tracking-widest border-b border-surface-100">
                          <th className="px-6 py-4">Candidate Name</th>
                          <th className="px-6 py-4">Applied Job</th>
                          <th className="px-6 py-4">Educational Background</th>
                          <th className="px-6 py-4">Disclosed Backlogs</th>
                          <th className="px-6 py-4">Hiring Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-100 text-xs font-bold text-slate-600">
                        {candidates
                          .filter(c => ['selected', 'offered', 'offer_accepted', 'background_verification', 'joining_confirmed', 'joined', 'onboarded', 'rejected'].includes(c.status))
                          .map(cand => (
                            <tr key={cand.id} className="hover:bg-surface-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <p className="text-surface-900 font-extrabold text-sm">{cand.first_name} {cand.last_name}</p>
                                <p className="text-surface-400 text-[10px] mt-0.5">{cand.email} • {cand.phone}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-surface-900 font-extrabold">{cand.job_requisition_title}</p>
                                <p className="text-surface-400 text-[10px] mt-0.5">Exp: {cand.experience || 'Fresher'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-violet-600 font-extrabold">{cand.education_details || 'Graduate'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  Number(cand.backlogs) > 0 ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700'
                                }`}>
                                  {cand.backlogs || 0} backlogs
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border ${
                                  cand.status === 'joined' ? 'bg-teal-50 border-teal-200 text-teal-700' :
                                  cand.status === 'offered' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                  'bg-rose-50 border-rose-200 text-rose-700'
                                }`}>
                                  {cand.status === 'joined' ? 'Activated / Joined' : cand.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        {candidates.filter(c => ['joined', 'offered', 'rejected'].includes(c.status)).length === 0 && (
                          <tr>
                            <td colSpan="5" className="py-12 text-center text-slate-400 font-bold">
                              No finalized recruitment records available in historic audit trail.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* DEPARTMENTS TAB */}
          {activeTab === 'departments' && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.05 } }
              }}
            >
              {filteredItems.map(dept => {
                const getDeptStyles = (name) => {
                  const n = name?.toLowerCase() || '';
                  if (n.includes('eng') || n.includes('tech') || n.includes('dev') || n.includes('soft') || n.includes('it')) {
                    return {
                      theme: 'sapphire',
                      bg: 'bg-sky-50 text-sky-700 border-sky-100/80 hover:border-sky-300',
                      iconBg: 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-200',
                      gradient: 'from-blue-500/10 via-sky-500/5 to-transparent',
                      borderColor: 'hover:border-sky-300/80',
                      accentColor: 'text-blue-600',
                      icon: Cpu,
                      chipClass: 'bg-sky-50/50 hover:bg-sky-100 text-sky-700 border-sky-100/60 hover:border-sky-200',
                      progressBar: 'bg-gradient-to-r from-blue-500 to-indigo-600',
                      glow: 'shadow-[0_0_30px_-5px_rgba(56,189,248,0.12)]'
                    };
                  }
                  if (n.includes('hr') || n.includes('people') || n.includes('resource') || n.includes('talent')) {
                    return {
                      theme: 'amethyst',
                      bg: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100/80 hover:border-fuchsia-300',
                      iconBg: 'bg-gradient-to-tr from-violet-600 to-fuchsia-600 shadow-violet-200',
                      gradient: 'from-violet-500/10 via-fuchsia-500/5 to-transparent',
                      borderColor: 'hover:border-fuchsia-300/80',
                      accentColor: 'text-violet-600',
                      icon: Users,
                      chipClass: 'bg-fuchsia-50/50 hover:bg-fuchsia-100 text-fuchsia-700 border-fuchsia-100/60 hover:border-fuchsia-200',
                      progressBar: 'bg-gradient-to-r from-violet-500 to-fuchsia-500',
                      glow: 'shadow-[0_0_30px_-5px_rgba(232,121,249,0.12)]'
                    };
                  }
                  if (n.includes('fin') || n.includes('pay') || n.includes('acc') || n.includes('bud')) {
                    return {
                      theme: 'emerald',
                      bg: 'bg-emerald-50 text-emerald-700 border-emerald-100/80 hover:border-emerald-300',
                      iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-200',
                      gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
                      borderColor: 'hover:border-emerald-300/80',
                      accentColor: 'text-emerald-600',
                      icon: Landmark,
                      chipClass: 'bg-emerald-50/50 hover:bg-emerald-100 text-emerald-700 border-emerald-100/60 hover:border-emerald-200',
                      progressBar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
                      glow: 'shadow-[0_0_30px_-5px_rgba(52,211,153,0.12)]'
                    };
                  }
                  if (n.includes('mark') || n.includes('sale') || n.includes('biz') || n.includes('growth')) {
                    return {
                      theme: 'ruby',
                      bg: 'bg-rose-50 text-rose-700 border-rose-100/80 hover:border-rose-300',
                      iconBg: 'bg-gradient-to-tr from-rose-600 to-orange-500 shadow-rose-200',
                      gradient: 'from-rose-500/10 via-orange-500/5 to-transparent',
                      borderColor: 'hover:border-rose-300/80',
                      accentColor: 'text-rose-600',
                      icon: BarChart3,
                      chipClass: 'bg-rose-50/50 hover:bg-rose-100 text-rose-700 border-rose-100/60 hover:border-rose-200',
                      progressBar: 'bg-gradient-to-r from-rose-500 to-orange-500',
                      glow: 'shadow-[0_0_30px_-5px_rgba(251,113,133,0.12)]'
                    };
                  }
                  return {
                    theme: 'amber',
                    bg: 'bg-amber-50 text-amber-700 border-amber-100/80 hover:border-amber-300',
                    iconBg: 'bg-gradient-to-tr from-amber-600 to-orange-650 shadow-amber-200',
                    gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
                    borderColor: 'hover:border-amber-300/80',
                    accentColor: 'text-amber-600',
                    icon: Folder,
                    chipClass: 'bg-amber-50/50 hover:bg-amber-100 text-amber-700 border-amber-100/60 hover:border-amber-200',
                    progressBar: 'bg-gradient-to-r from-amber-500 to-orange-500',
                    glow: 'shadow-[0_0_30px_-5px_rgba(251,191,36,0.12)]'
                  };
                };
                
                const styles = getDeptStyles(dept.name);
                const DeptIcon = styles.icon;

                // Visual metric for budget utilization benchmark (10M INR)
                const budgetPercent = Math.min(100, Math.max(10, ((dept.budget || 0) / 10000000) * 100));

                return (
                  <motion.div 
                    key={dept.id} 
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -6, scale: 1.015 }}
                    className={`bg-white rounded-[2.2rem] p-6 border border-surface-150 ${styles.glow} hover:shadow-xl hover:border-surface-200 flex flex-col justify-between relative overflow-hidden transition-all duration-300`}
                  >
                    {/* Glowing Accent Light */}
                    <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-tr ${styles.gradient} filter blur-3xl -z-10`}></div>
                    
                    <div>
                      {/* Top Header Row */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center text-white ${styles.iconBg} shadow-sm shrink-0`}>
                            <DeptIcon size={18} />
                          </div>
                          <div>
                            <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${styles.bg}`}>
                              {dept.name?.split(' ')[0] || 'Unit'}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            setEditingDeptId(dept.id);
                            setDeptForm({
                              name: dept.name,
                              description: dept.description || '',
                              budget: dept.budget || '',
                              head: dept.head || '',
                              designations: dept.designations ? dept.designations.join(', ') : ''
                            });
                            setShowDeptModal(true);
                          }}
                          className="p-2.5 bg-surface-50 hover:bg-violet-50 text-surface-400 hover:text-violet-600 rounded-xl transition-all border border-surface-150 hover:border-violet-100 z-10 shadow-sm cursor-pointer"
                          title="Edit Department"
                        >
                          <Edit size={13} />
                        </button>
                      </div>

                      {/* Name & Details */}
                      <div className="mt-5">
                        <h3 className="font-black text-xl text-surface-900 tracking-tight">{dept.name}</h3>
                        <p className="text-surface-400 text-xs font-semibold mt-2.5 leading-relaxed italic">
                          "{dept.description || 'Hirevant High-Performance Division'}"
                        </p>
                      </div>

                      {/* Designations & Teams Grid */}
                      {dept.designations && dept.designations.length > 0 && (
                        <div className="mt-6">
                          <p className="text-[9px] font-black text-surface-400 uppercase tracking-widest mb-3">Allocated Teams & Designations</p>
                          <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1 no-scrollbar">
                            {dept.designations.map((desig, idx) => (
                              <span key={idx} className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${styles.chipClass}`}>
                                {desig}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Department Operational Health & Budgets */}
                    <div className="mt-6 pt-5 border-t border-surface-100">
                      {/* Budget Gauge */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center text-[9px] uppercase tracking-widest font-black text-surface-400 mb-1.5">
                          <span>Budget Allocation Weight</span>
                          <span className={styles.accentColor}>{budgetPercent.toFixed(0)}% Index</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${styles.progressBar}`} style={{ width: `${budgetPercent}%` }}></div>
                        </div>
                      </div>

                      {/* Metadata Details Row */}
                      <div className="flex items-center justify-between text-xs text-surface-400 font-semibold gap-4">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[9px] uppercase tracking-wider text-surface-450 font-black">Division Head</span>
                          <span className="font-black text-surface-850 text-sm tracking-tight truncate">{dept.head_name || 'Unassigned'}</span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <span className="text-[9px] uppercase tracking-wider text-surface-450 font-black text-right">Authorized Budget</span>
                          <span className="text-emerald-600 font-black text-sm tracking-tight text-right">
                            ₹{dept.budget ? Number(dept.budget).toLocaleString('en-IN') : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                  </motion.div>
                );
              })}
              {filteredItems.length === 0 && (
                <p className="text-sm font-medium text-surface-400 py-12 text-center col-span-full">No departments configured yet.</p>
              )}
            </motion.div>
          )}

          {/* SYSTEM AUDIT LOGS TAB */}
          {activeTab === 'audit' && (
            <div className="bg-white rounded-3xl border border-surface-100 shadow-sm overflow-hidden p-6">
              <h3 className="text-base font-black text-surface-900 border-b border-surface-50 pb-4 flex items-center gap-2 mb-6">
                <Shield className="text-violet-600" size={18} /> Dynamic Operations Feed & Security Audit Log
              </h3>
              
              <motion.div 
                className="space-y-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.03 } }
                }}
              >
                {filteredItems.map(log => {
                  const getLogStyles = (action) => {
                    const act = action?.toLowerCase() || '';
                    if (act === 'login' || act === 'signin') {
                      return { bg: 'bg-green-50 text-green-700 border-green-150', icon: ShieldCheck, color: 'text-green-600' };
                    }
                    if (act === 'delete' || act === 'remove') {
                      return { bg: 'bg-rose-50 text-rose-700 border-rose-150', icon: ShieldAlert, color: 'text-rose-600' };
                    }
                    if (act === 'update' || act === 'edit' || act === 'modify' || act === 'patch') {
                      return { bg: 'bg-amber-50 text-amber-700 border-amber-150', icon: Sliders, color: 'text-amber-600' };
                    }
                    return { bg: 'bg-blue-50 text-blue-700 border-blue-150', icon: Plus, color: 'text-blue-600' };
                  };

                  const styles = getLogStyles(log.action);
                  const LogIcon = styles.icon;

                  return (
                    <motion.div 
                      key={log.id} 
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        visible: { opacity: 1, x: 0 }
                      }}
                      whileHover={{ scale: 1.002, borderLeftColor: '#6345ED' }}
                      className="p-4 rounded-2xl border-l-[4px] border-y border-r border-surface-100 hover:border-violet-200 bg-surface-50 hover:bg-white transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm"
                    >
                      <div className="flex gap-3 items-center">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${styles.bg}`}>
                          <LogIcon size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-surface-900">{log.user_email || log.email || 'System Operation'}</p>
                          <p className="text-[10px] font-semibold text-surface-400 mt-1 flex items-center gap-1.5 flex-wrap">
                            Executed: 
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${styles.bg}`}>
                              {log.action}
                            </span>
                            on 
                            <span className="px-2 py-0.5 bg-surface-150 text-surface-700 border border-surface-200 rounded text-[8px] font-black uppercase tracking-wider">
                              {log.model_name || log.model || 'Database'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-surface-400 bg-surface-100 px-2 py-1 rounded-xl border border-surface-150 shrink-0">
                        {new Date(log.timestamp || log.time).toLocaleString()}
                      </span>
                    </motion.div>
                  );
                })}
                {filteredItems.length === 0 && (
                  <p className="text-sm font-medium text-surface-400 py-12 text-center">No system actions registered</p>
                )}
              </motion.div>
            </div>
          )}

          {/* ROLES & PERMISSIONS TAB â€” Enterprise Governance Module */}
          {activeTab === 'roles' && (() => {
            // Classify configs
            const classConfig = {
              CRITICAL:     { label: 'CRITICAL', cls: 'bg-rose-50 border-rose-300 text-rose-700' },
              RESTRICTED:   { label: 'RESTRICTED', cls: 'bg-amber-50 border-amber-300 text-amber-700' },
              CONFIDENTIAL: { label: 'CONFIDENTIAL', cls: 'bg-orange-50 border-orange-300 text-orange-700' },
              INTERNAL:     { label: 'INTERNAL', cls: 'bg-blue-50 border-blue-300 text-blue-700' },
              PUBLIC:       { label: 'PUBLIC', cls: 'bg-slate-50 border-slate-300 text-slate-600' },
            };
            const roleIconMap = {
              admin: Shield, hr: Users, manager: Award,
              recruiter: UserPlus, payroll: Landmark, employee: ShieldCheck
            };
            const rolePalette = {
              admin:     'from-rose-500/15 via-rose-500/5 to-transparent border-rose-100',
              hr:        'from-violet-500/15 via-violet-500/5 to-transparent border-violet-100',
              manager:   'from-amber-500/15 via-amber-500/5 to-transparent border-amber-100',
              recruiter: 'from-cyan-500/15 via-cyan-500/5 to-transparent border-cyan-100',
              payroll:   'from-teal-500/15 via-teal-500/5 to-transparent border-teal-100',
              employee:  'from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-100',
            };
            const roleIconColor = {
              admin: 'text-rose-600 bg-rose-50 border-rose-200',
              hr: 'text-violet-600 bg-violet-50 border-violet-200',
              manager: 'text-amber-600 bg-amber-50 border-amber-200',
              recruiter: 'text-cyan-600 bg-cyan-50 border-cyan-200',
              payroll: 'text-teal-600 bg-teal-50 border-teal-200',
              employee: 'text-emerald-600 bg-emerald-50 border-emerald-200',
            };

            const filteredGovUsers = selectedGovernanceRole?.users?.filter(u =>
              !governanceSearch ||
              u.full_name?.toLowerCase().includes(governanceSearch.toLowerCase()) ||
              u.email?.toLowerCase().includes(governanceSearch.toLowerCase()) ||
              u.department?.toLowerCase().includes(governanceSearch.toLowerCase()) ||
              u.employee_id?.toLowerCase().includes(governanceSearch.toLowerCase())
            ) || [];

            const handleViewUsers = async (roleKey) => {
              setGovernanceLoading(true);
              setGovernanceSearch('');
              setActionMsg({ type: '', text: '' });
              try {
                const res = await api.get(`/roles/governance/?role=${roleKey}`);
                const roleEntry = (res.data || [])[0] || null;
                setSelectedGovernanceRole(roleEntry);
                setShowGovernanceModal(true);
              } catch (e) {
                console.error('Failed to load governance data', e);
              } finally {
                setGovernanceLoading(false);
              }
            };

            const handleAdminAction = async (actionType, extra = {}) => {
              if (!actionUser) return;
              setActionLoading(true);
              setActionMsg({ type: '', text: '' });
              try {
                const res = await api.post('/roles/governance/action/', {
                  action: actionType,
                  user_id: actionUser.id,
                  ...extra,
                });
                setActionMsg({ type: 'success', text: res.data.message || 'Action completed.' });
                // Refresh the role modal
                if (selectedGovernanceRole) {
                  const refreshRes = await api.get(`/roles/governance/?role=${selectedGovernanceRole.role_key}`);
                  setSelectedGovernanceRole((refreshRes.data || [])[0] || null);
                }
                // Refresh governance overview if needed
                if (governanceData.length > 0) {
                  const overviewRes = await api.get('/roles/governance/');
                  setGovernanceData(overviewRes.data || []);
                }
                setTimeout(() => {
                  setShowActionPanel(false);
                  setActionUser(null);
                  setActionMsg({ type: '', text: '' });
                }, 2000);
              } catch (err) {
                const errMsg = err.response?.data?.error || 'Action failed.';
                setActionMsg({ type: 'error', text: errMsg });
              } finally {
                setActionLoading(false);
              }
            };

            return (
              <div className="space-y-6">
                {/* Module Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2rem] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIvPjwvZz48L2c+PC9zdmc+')] opacity-20 rounded-[2rem]"></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="p-2 bg-white/10 rounded-xl">
                        <Shield size={20} className="text-white" />
                      </div>
                      <h2 className="text-white font-black text-lg tracking-tight">Organizational Access Governance</h2>
                    </div>
                    <p className="text-slate-400 text-xs font-medium ml-11">Enterprise Role-Based Access Control Â· Workforce Authorization Management Â· Security Oversight</p>
                  </div>
                  <div className="relative flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Total Authorized Users</p>
                      <p className="text-2xl font-black text-white">{usersList.length}</p>
                    </div>
                    <div className="w-px h-10 bg-white/10"></div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Active Roles</p>
                      <p className="text-2xl font-black text-emerald-400">6</p>
                    </div>
                  </div>
                </div>

                {/* Role Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[
                    { key: 'admin', meta: { title: 'System Administrator', tier: 'Tier-1 Â· Critical Security Access', classification: 'CRITICAL', responsibilities: ['Full platform access & governance', 'User account lifecycle management', 'Security protocol configuration', 'Audit log monitoring & analysis', 'System-wide settings control', 'Role & privilege assignment'], capabilities: ['Create/modify any user account', 'Access all modules without restriction', 'Configure system-level settings', 'View complete audit trail', 'Override any access control'] } },
                    { key: 'hr', meta: { title: 'HR Manager', tier: 'Tier-2 Â· HR Operational Access', classification: 'RESTRICTED', responsibilities: ['Employee onboarding & offboarding', 'Department & designation management', 'Leave policy configuration', 'Workforce analytics & reporting', 'Attendance oversight', 'Recruitment pipeline supervision'], capabilities: ['Create Employee/Manager/Recruiter', 'Assign and transfer departments', 'Approve special leave requests', 'View all employee records', 'Generate workforce reports'] } },
                    { key: 'manager', meta: { title: 'Department Manager', tier: 'Tier-2 Â· Team Lead Access', classification: 'INTERNAL', responsibilities: ['Direct team supervision', 'Leave request approvals', 'Attendance monitoring', 'Performance review submissions', 'Goal sheet evaluations', 'Appraisal rating approvals'], capabilities: ['View team employee profiles', 'Approve or reject leave requests', 'Monitor team attendance', 'Submit appraisal reviews', 'Recommend promotions'] } },
                    { key: 'recruiter', meta: { title: 'Recruiter', tier: 'Tier-3 Â· Talent Acquisition Access', classification: 'INTERNAL', responsibilities: ['Job requisition management', 'Candidate sourcing & tracking', 'Interview round scheduling', 'Offer letter generation', 'Hiring pipeline reporting'], capabilities: ['Create and manage job postings', 'View and update candidates', 'Schedule interview rounds', 'Generate offer letters', 'Access recruitment analytics'] } },
                    { key: 'payroll', meta: { title: 'Payroll Executive', tier: 'Tier-3 Â· Compensation Gatekeeper', classification: 'CONFIDENTIAL', responsibilities: ['Monthly payroll processing', 'Payslip generation & distribution', 'Deduction rules management', 'Salary structure configuration', 'Tax computation oversight'], capabilities: ['Process and approve payrolls', 'Generate employee payslips', 'Configure salary structures', 'Manage deductions & bonuses', 'Access compensation reports'] } },
                    { key: 'employee', meta: { title: 'Employee', tier: 'Tier-4 Â· Self-Service Access', classification: 'PUBLIC', responsibilities: ['Personal profile maintenance', 'Daily attendance check-in/out', 'Leave application submission', 'Goal sheet self-assessment', 'Payslip download access'], capabilities: ['View and update own profile', 'Submit leave requests', 'Clock in/out for attendance', 'Download own payslips', 'Access own appraisal data'] } },
                  ].map((roleEntry) => {
                    const RoleIcon = roleIconMap[roleEntry.key];
                    const clsCfg = classConfig[roleEntry.meta.classification] || classConfig.PUBLIC;
                    const palette = rolePalette[roleEntry.key];
                    const iconCls = roleIconColor[roleEntry.key];
                    const count = usersList.filter(u => u.role?.toLowerCase() === roleEntry.key).length;
                    const activeCount = usersList.filter(u => u.role?.toLowerCase() === roleEntry.key && u.is_active !== false).length;

                    return (
                      <motion.div
                        key={roleEntry.key}
                        whileHover={{ y: -4, scale: 1.01 }}
                        className={`bg-white rounded-[2rem] border bg-gradient-to-b ${palette} shadow-sm flex flex-col justify-between overflow-hidden group transition-all duration-300 relative`}
                      >
                        {/* Card Header */}
                        <div className="p-6 pb-4">
                          <div className="flex justify-between items-start mb-4">
                            <div className={`p-2.5 rounded-xl border ${iconCls} shadow-sm`}>
                              <RoleIcon size={18} />
                            </div>
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${clsCfg.cls}`}>
                              {clsCfg.label}
                            </span>
                          </div>

                          <h3 className="font-black text-slate-900 text-base tracking-tight">{roleEntry.meta.title}</h3>
                          <p className="text-[9px] font-black uppercase tracking-wider text-[#6345ED] mt-0.5">{roleEntry.meta.tier}</p>

                          {/* User Count Row */}
                          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100/80">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                              <span className="text-[10px] font-black text-slate-700">{activeCount} Active</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users size={10} className="text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-500">{count} Total</span>
                            </div>
                          </div>
                        </div>

                        {/* Responsibilities */}
                        <div className="px-6 pb-4">
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Operational Responsibilities</p>
                          <div className="space-y-1">
                            {roleEntry.meta.responsibilities.slice(0, 4).map((r, i) => (
                              <div key={i} className="flex items-start gap-2 text-[10px] text-slate-600 font-semibold leading-snug">
                                <ChevronRight size={10} className="text-[#6345ED] shrink-0 mt-0.5" />
                                {r}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Capabilities */}
                        <div className="px-6 pb-4">
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Authorized Capabilities</p>
                          <div className="space-y-1">
                            {roleEntry.meta.capabilities.slice(0, 3).map((c, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#6345ED] shrink-0 mt-1"></div>
                                <span className="text-[10px] text-slate-600 font-semibold leading-snug">{c}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {count} Authorized
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleViewUsers(roleEntry.key)}
                            disabled={governanceLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-[#6345ED] hover:bg-[#5235D6] text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md hover:shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {governanceLoading ? <RefreshCw size={10} className="animate-spin" /> : <Eye size={10} />}
                            View Authorized Users
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* â”€â”€ Enterprise Authorized Users Modal â”€â”€â”€ */}
                <AnimatePresence>
                  {showGovernanceModal && selectedGovernanceRole && (() => {
                    const clsCfg2 = classConfig[selectedGovernanceRole.classification] || classConfig.PUBLIC;
                    const ModalIcon = roleIconMap[selectedGovernanceRole.role_key] || Shield;
                    const modalIconCls = roleIconColor[selectedGovernanceRole.role_key] || 'text-slate-600 bg-slate-50 border-slate-200';
                    return (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) { setShowGovernanceModal(false); setShowActionPanel(false); setActionUser(null); } }}
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 24, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 12, scale: 0.97 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                          className="bg-white w-full max-w-[1200px] rounded-[1.75rem] shadow-[0_32px_80px_rgba(0,0,0,0.28)] overflow-hidden flex flex-col"
                          style={{ maxHeight: 'calc(100vh - 48px)' }}
                        >
                          {/* â”€â”€ Modal Header â”€â”€ */}
                          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 px-7 py-5 flex items-center justify-between shrink-0 border-b border-white/5">
                            <div className="flex items-center gap-4">
                              <div className={`p-2.5 rounded-xl border shadow-sm ${modalIconCls}`}>
                                <ModalIcon size={18} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2.5">
                                  <h2 className="text-white font-black text-[15px] tracking-tight">{selectedGovernanceRole.title}</h2>
                                  <span className={`px-2 py-0.5 rounded-md text-[7.5px] font-black uppercase tracking-widest border ${clsCfg2.cls}`}>
                                    {clsCfg2.label}
                                  </span>
                                </div>
                                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-0.5">{selectedGovernanceRole.tier}</p>
                              </div>
                            </div>

                            {/* Stats strip */}
                            <div className="flex items-center gap-1">
                              <div className="flex items-center gap-5 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl">
                                <div className="text-center">
                                  <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Total</p>
                                  <p className="text-lg font-black text-white leading-none mt-0.5">{selectedGovernanceRole.user_count}</p>
                                </div>
                                <div className="w-px h-7 bg-white/10" />
                                <div className="text-center">
                                  <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Active</p>
                                  <p className="text-lg font-black text-emerald-400 leading-none mt-0.5">{selectedGovernanceRole.active_count}</p>
                                </div>
                                <div className="w-px h-7 bg-white/10" />
                                <div className="text-center">
                                  <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Inactive</p>
                                  <p className="text-lg font-black text-rose-400 leading-none mt-0.5">{selectedGovernanceRole.user_count - selectedGovernanceRole.active_count}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => { setShowGovernanceModal(false); setShowActionPanel(false); setActionUser(null); setActionMsg({ type: '', text: '' }); }}
                                className="ml-2 p-2.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          </div>

                          {/* â”€â”€ Body: Split Pane â”€â”€ */}
                          <div className="flex flex-1 min-h-0">

                            {/* LEFT: User Directory Table */}
                            <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${showActionPanel ? 'border-r border-slate-100' : ''}`}>

                              {/* Search + info bar */}
                              <div className="px-6 py-3.5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/60 shrink-0">
                                <div className="relative flex-1 max-w-xs">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                                  <input
                                    type="text"
                                    placeholder={`Search ${selectedGovernanceRole.title} members...`}
                                    value={governanceSearch}
                                    onChange={e => setGovernanceSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#6345ED] focus:ring-1 focus:ring-[#6345ED]/20 transition-all"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{filteredGovUsers.length} Records</span>
                                </div>
                                {showActionPanel && (
                                  <span className="text-[10px] font-bold text-[#6345ED] bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-lg">
                                    Managing: {actionUser?.full_name}
                                  </span>
                                )}

                                {/* Status message inside search bar row */}
                                <AnimatePresence>
                                  {actionMsg.text && (
                                    <motion.span
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.9 }}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border ${
                                        actionMsg.type === 'success'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : 'bg-rose-50 text-rose-700 border-rose-200'
                                      }`}
                                    >
                                      {actionMsg.type === 'success' ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                                      {actionMsg.text}
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* Table */}
                              <div className="flex-1 overflow-auto">
                                <table className="w-full text-xs">
                                  <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-100">
                                    <tr>
                                      {['Employee', 'Contact', 'Department Â· Designation', 'Status', 'Last Login', 'Reporting To', 'Actions'].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap first:pl-6">
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50/80">
                                    {filteredGovUsers.length === 0 ? (
                                      <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                          <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                                              <Users size={20} className="text-slate-400" />
                                            </div>
                                            <p className="text-slate-400 font-semibold text-sm">No users found for this role</p>
                                            {governanceSearch && <p className="text-slate-300 text-xs">Try adjusting your search query</p>}
                                          </div>
                                        </td>
                                      </tr>
                                    ) : filteredGovUsers.map((u, idx) => {
                                      const isSelected = actionUser?.id === u.id && showActionPanel;
                                      const lastLoginDate = u.last_login ? new Date(u.last_login) : null;
                                      const initials = (u.full_name || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                                      return (
                                        <motion.tr
                                          key={u.id}
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{ delay: idx * 0.025 }}
                                          className={`group transition-all duration-150 cursor-default ${
                                            isSelected
                                              ? 'bg-violet-50/70 border-l-2 border-l-[#6345ED]'
                                              : 'hover:bg-slate-50/80 border-l-2 border-l-transparent'
                                          }`}
                                        >
                                          {/* Employee */}
                                          <td className="pl-6 pr-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0 ring-2 ${
                                                u.is_active ? 'bg-gradient-to-br from-[#6345ED] to-[#9B6BFA] ring-violet-100' : 'bg-slate-300 ring-slate-100'
                                              }`}>
                                                {initials}
                                              </div>
                                              <div>
                                                <p className="font-bold text-slate-800 text-[11px] leading-snug">{u.full_name}</p>
                                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{u.employee_id}</p>
                                              </div>
                                            </div>
                                          </td>
                                          {/* Contact */}
                                          <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[10px]">
                                              <Mail size={9} className="text-slate-400 shrink-0" />
                                              <span className="truncate max-w-[160px]">{u.email}</span>
                                            </div>
                                          </td>
                                          {/* Dept Â· Desig */}
                                          <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                              <Building2 size={9} className="text-slate-400 shrink-0" />
                                              <div>
                                                <p className="font-semibold text-slate-700 text-[10px]">{u.department || 'â€”'}</p>
                                                <p className="text-[9px] text-slate-400">{u.designation || 'â€”'}</p>
                                              </div>
                                            </div>
                                          </td>
                                          {/* Status */}
                                          <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                              u.is_active
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-slate-100 text-slate-500 border-slate-200'
                                            }`}>
                                              <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                              {u.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                          </td>
                                          {/* Last Login */}
                                          <td className="px-4 py-3.5 whitespace-nowrap">
                                            {lastLoginDate ? (
                                              <div>
                                                <p className="text-[10px] font-semibold text-slate-600">{lastLoginDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                  <Clock size={8} /> {lastLoginDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                              </div>
                                            ) : (
                                              <span className="text-[10px] text-slate-300 font-semibold italic">Never logged in</span>
                                            )}
                                          </td>
                                          {/* Reporting Manager */}
                                          <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className="text-[10px] text-slate-500 font-medium">{u.reporting_manager || 'â€”'}</span>
                                          </td>
                                          {/* Actions */}
                                          <td className="px-4 py-3.5 pr-6 whitespace-nowrap">
                                            <motion.button
                                              whileHover={{ scale: 1.04 }}
                                              whileTap={{ scale: 0.95 }}
                                              onClick={() => {
                                                if (isSelected) {
                                                  setShowActionPanel(false);
                                                  setActionUser(null);
                                                } else {
                                                  setActionUser(u);
                                                  setActionForm({ role: u.role, department: u.department || '' });
                                                  setShowActionPanel(true);
                                                  setActionMsg({ type: '', text: '' });
                                                }
                                              }}
                                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                                                isSelected
                                                  ? 'bg-[#6345ED] text-white border-[#6345ED] shadow-md'
                                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-[#6345ED]/5 hover:border-[#6345ED]/40 hover:text-[#6345ED]'
                                              }`}
                                            >
                                              <Sliders size={9} />
                                              {isSelected ? 'Managing' : 'Manage'}
                                            </motion.button>
                                          </td>
                                        </motion.tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* RIGHT: Admin Control Panel */}
                            <AnimatePresence>
                              {showActionPanel && actionUser && (
                                <motion.div
                                  initial={{ width: 0, opacity: 0 }}
                                  animate={{ width: 340, opacity: 1 }}
                                  exit={{ width: 0, opacity: 0 }}
                                  transition={{ type: 'spring', stiffness: 300, damping: 32 }}
                                  className="shrink-0 bg-slate-50 border-l border-slate-100 flex flex-col overflow-hidden"
                                  style={{ width: 340 }}
                                >
                                  {/* Panel Header */}
                                  <div className="bg-gradient-to-b from-slate-900 to-slate-800 px-5 py-4 shrink-0">
                                    <div className="flex justify-between items-center mb-3.5">
                                      <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-white font-black text-[11px] uppercase tracking-widest">Access Control</span>
                                      </div>
                                      <button
                                        onClick={() => { setShowActionPanel(false); setActionUser(null); setActionMsg({ type: '', text: '' }); }}
                                        className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all cursor-pointer"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>

                                    {/* User Identity Card */}
                                    <div className="bg-white/8 rounded-xl border border-white/10 p-3.5">
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0 ring-2 ${
                                          actionUser.is_active ? 'bg-gradient-to-br from-[#6345ED] to-[#9B6BFA] ring-violet-900/50' : 'bg-slate-500 ring-slate-700'
                                        }`}>
                                          {(actionUser.full_name || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-white font-bold text-xs truncate">{actionUser.full_name}</p>
                                          <p className="text-slate-400 text-[9px] truncate">{actionUser.email}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border shrink-0 ${
                                          actionUser.is_active ? 'bg-emerald-900/50 text-emerald-400 border-emerald-800/50' : 'bg-slate-700 text-slate-400 border-slate-600'
                                        }`}>
                                          {actionUser.is_active ? 'â— Active' : 'â—‹ Inactive'}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white/5 rounded-lg px-2.5 py-2">
                                          <p className="text-[7.5px] text-slate-500 uppercase tracking-widest font-bold">Employee ID</p>
                                          <p className="text-[10px] font-bold text-slate-300 mt-0.5">{actionUser.employee_id}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg px-2.5 py-2">
                                          <p className="text-[7.5px] text-slate-500 uppercase tracking-widest font-bold">Current Role</p>
                                          <p className="text-[10px] font-bold text-slate-300 capitalize mt-0.5">{actionUser.role}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg px-2.5 py-2 col-span-2">
                                          <p className="text-[7.5px] text-slate-500 uppercase tracking-widest font-bold">Department</p>
                                          <p className="text-[10px] font-bold text-slate-300 mt-0.5">{actionUser.department || 'â€”'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Actions scrollable */}
                                  <div className="flex-1 overflow-y-auto p-4 space-y-3">

                                    {/* â”€â”€ Account Status â”€â”€ */}
                                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                                          {actionUser.is_active ? <Lock size={12} className="text-rose-500" /> : <Unlock size={12} className="text-emerald-500" />}
                                        </div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Account Status</p>
                                      </div>
                                      <button
                                        onClick={() => handleAdminAction('toggle_active')}
                                        disabled={actionLoading || actionUser.role === 'admin'}
                                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer disabled:opacity-40 ${
                                          actionUser.is_active
                                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        }`}
                                      >
                                        {actionLoading ? <RefreshCw size={11} className="animate-spin" /> : actionUser.is_active ? <><Lock size={11} /> Deactivate Account</> : <><Unlock size={11} /> Activate Account</>}
                                      </button>
                                      {actionUser.role === 'admin' && (
                                        <p className="text-[8px] text-amber-600 font-bold mt-2 text-center flex items-center justify-center gap-1">
                                          <AlertTriangle size={9} /> Admin accounts cannot be deactivated
                                        </p>
                                      )}
                                    </div>

                                    {/* â”€â”€ Change Role â”€â”€ */}
                                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                                          <ArrowRightLeft size={12} className="text-[#6345ED]" />
                                        </div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Change Assigned Role</p>
                                      </div>
                                      <select
                                        value={actionForm.role}
                                        onChange={e => setActionForm({ ...actionForm, role: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 focus:outline-none focus:border-[#6345ED] focus:ring-1 focus:ring-[#6345ED]/20 mb-2.5 transition-all"
                                      >
                                        {availableRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                      </select>
                                      <button
                                        onClick={() => handleAdminAction('change_role', { role: actionForm.role })}
                                        disabled={actionLoading || actionForm.role === actionUser.role}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-[#6345ED] hover:bg-[#5235D6] text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm hover:shadow-indigo-200 transition-all cursor-pointer disabled:opacity-40"
                                      >
                                        {actionLoading ? <RefreshCw size={11} className="animate-spin" /> : <><ArrowRightLeft size={11} /> Apply Role Change</>}
                                      </button>
                                    </div>

                                    {/* â”€â”€ Transfer Department â”€â”€ */}
                                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                                          <Building2 size={12} className="text-slate-600" />
                                        </div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Transfer Department</p>
                                      </div>
                                      <select
                                        value={actionForm.department}
                                        onChange={e => setActionForm({ ...actionForm, department: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 focus:outline-none focus:border-[#6345ED] focus:ring-1 focus:ring-[#6345ED]/20 mb-2.5 transition-all"
                                      >
                                        <option value="">Select destination...</option>
                                        {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                      </select>
                                      <button
                                        onClick={() => handleAdminAction('transfer_dept', { department: actionForm.department })}
                                        disabled={actionLoading || !actionForm.department || actionForm.department === actionUser.department}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
                                      >
                                        {actionLoading ? <RefreshCw size={11} className="animate-spin" /> : <><Building2 size={11} /> Confirm Transfer</>}
                                      </button>
                                    </div>

                                    {/* â”€â”€ Credential Reset â”€â”€ */}
                                    <div className="bg-rose-50 rounded-2xl border border-rose-100 p-4">
                                      <div className="flex items-center gap-2 mb-1.5">
                                        <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center">
                                          <RefreshCw size={11} className="text-rose-600" />
                                        </div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-rose-500">Credential Reset</p>
                                      </div>
                                      <p className="text-[9px] text-rose-400/80 mb-3 leading-relaxed">
                                        Generates a temporary password. The user must reset it on next login.
                                      </p>
                                      <button
                                        onClick={() => handleAdminAction('reset_password', { new_password: 'TempPass@2026!' })}
                                        disabled={actionLoading}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 shadow-sm"
                                      >
                                        {actionLoading ? <RefreshCw size={11} className="animate-spin" /> : <><RefreshCw size={11} /> Reset Credentials</>}
                                      </button>
                                    </div>

                                    {/* â”€â”€ Audit Trail â”€â”€ */}
                                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                                          <Activity size={12} className="text-slate-500" />
                                        </div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Audit Trail</p>
                                      </div>
                                      <button
                                        onClick={() => { setShowGovernanceModal(false); setShowActionPanel(false); setActionUser(null); handleTabChange('audit'); }}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 border border-slate-200 hover:border-[#6345ED] hover:bg-violet-50 hover:text-[#6345ED] text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                      >
                                        <Activity size={11} /> View Activity Logs
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            );
          })()}

          {/* SYSTEM SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* SMTP Gateway Config */}
                <div className="bg-white rounded-[2.2rem] p-6 border border-surface-150 shadow-sm space-y-4">
                  <h3 className="font-black text-sm text-surface-900 uppercase tracking-wider border-b border-slate-50 pb-3 flex items-center gap-2">
                    <Mail size={16} className="text-[#6345ED]" /> SMTP Corporate Mail Gateway
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400">SMTP Host server</label>
                        <input type="text" disabled value="smtp.hirevant-enterprise.net" className="w-full px-4 py-2 bg-slate-50 border border-surface-200 rounded-xl text-xs font-semibold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400">Port (SSL/TLS)</label>
                        <input type="text" disabled value="587" className="w-full px-4 py-2 bg-slate-50 border border-surface-200 rounded-xl text-xs font-semibold" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Authorized Sender Email</label>
                      <input type="text" disabled value="noreply@hirevant-enterprise.net" className="w-full px-4 py-2 bg-slate-50 border border-surface-200 rounded-xl text-xs font-semibold" />
                    </div>
                    <div className="pt-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-green-50 border border-green-200 text-green-700">
                        Operational / Connected
                      </span>
                    </div>
                  </div>
                </div>

                {/* Security Compliance Control */}
                <div className="bg-white rounded-[2.2rem] p-6 border border-surface-150 shadow-sm space-y-4">
                  <h3 className="font-black text-sm text-surface-900 uppercase tracking-wider border-b border-slate-50 pb-3 flex items-center gap-2">
                    <Shield size={16} className="text-[#6345ED]" /> SOC2 Audit Security & Session controls
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-1">
                      <div>
                        <p className="font-bold text-xs text-slate-800">Multi-Factor Authentication (MFA)</p>
                        <p className="text-[9px] font-medium text-slate-450">Enforce secondary login verification via SMS/Auth app</p>
                      </div>
                      <input type="checkbox" defaultChecked disabled className="w-4.5 h-4.5 text-violet-600 rounded cursor-not-allowed" />
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <div>
                        <p className="font-bold text-xs text-slate-800">Automatic Session Timeout</p>
                        <p className="text-[9px] font-medium text-slate-450">Terminate active web app sessions after 30 minutes of inactivity</p>
                      </div>
                      <input type="checkbox" defaultChecked disabled className="w-4.5 h-4.5 text-violet-600 rounded cursor-not-allowed" />
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <div>
                        <p className="font-bold text-xs text-slate-800">Password Compliance Policy</p>
                        <p className="text-[9px] font-medium text-slate-450">Enforce dynamic alphanumeric combination with special characters</p>
                      </div>
                      <input type="checkbox" defaultChecked disabled className="w-4.5 h-4.5 text-violet-600 rounded cursor-not-allowed" />
                    </div>
                  </div>
                </div>

                {/* Database Snapshots */}
                <div className="bg-white rounded-[2.2rem] p-6 border border-surface-150 shadow-sm space-y-4 md:col-span-2">
                  <h3 className="font-black text-sm text-surface-900 uppercase tracking-wider border-b border-slate-50 pb-3 flex items-center gap-2">
                    <Sliders size={16} className="text-[#6345ED]" /> Backup Snapshot Schedule & Storage
                  </h3>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="font-bold text-xs text-slate-800">SQLite Database Snapshots</p>
                      <p className="text-[9px] font-medium text-slate-450">Scheduled automated backups executed daily at 00:00 UTC. Snapshots are securely backed up in cloud storage.</p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        type="button"
                        onClick={() => alert("Simulating Database Snapshot Export. Export complete!")}
                        className="px-4 py-2 border border-[#6345ED] hover:bg-violet-50 text-[#6345ED] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                      >
                        Run Live Backup
                      </button>
                      <button 
                        type="button"
                        onClick={() => alert("Database Restore Completed successfully!")}
                        className="px-4 py-2 bg-[#6345ED] hover:bg-[#5235D6] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        Restore Snapshot
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* POLICIES TAB */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { code: 'TP-POL-101', title: 'Code of Ethics & Conduct', scope: 'General Compliance', desc: 'Outlines behavioral expectations, professional integrity, and customer privacy protocols.', date: 'Jan 2026' },
                  { code: 'TP-POL-102', title: 'POSH Prevention policy', scope: 'Anti-Harassment', desc: 'Strict regulatory guidelines ensuring safety and equal workplace parameters.', date: 'Feb 2026' },
                  { code: 'TP-POL-103', title: 'Leave & Attendance rules', scope: 'Workplace Operations', desc: 'Setting operational core working hours, leaves, and time keeping metrics.', date: 'Mar 2026' },
                  { code: 'TP-POL-104', title: 'Salary Structure Guidelines', scope: 'Payroll Security', desc: 'Compensation policy setting maximum brackets and allowances weight.', date: 'Apr 2026' }
                ].map((pol, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -5, scale: 1.015 }}
                    className="bg-white rounded-[2.2rem] p-5 border border-surface-150 shadow-sm relative overflow-hidden flex flex-col justify-between transition-all duration-300"
                  >
                    <div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-violet-50 border border-violet-100 text-[#6345ED]">
                        {pol.code}
                      </span>
                      <h3 className="font-extrabold text-base text-surface-900 mt-3 leading-tight">{pol.title}</h3>
                      <p className="text-[9px] text-[#6345ED] font-bold uppercase tracking-wider mt-1">{pol.scope}</p>
                      <p className="text-slate-400 text-xs font-semibold mt-3 italic">"{pol.desc}"</p>
                    </div>
                    <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active ({pol.date})</span>
                      <button 
                        type="button"
                        onClick={() => alert(`Simulating viewing policy: ${pol.title}`)}
                        className="text-[9px] font-black uppercase tracking-widest text-[#6345ED] hover:text-[#5235D6] cursor-pointer"
                      >
                        View PDF
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* SYSTEM MODALS */}
      {/* 1. Register User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-surface-150 relative"
          >
            <h3 className="text-lg font-bold text-surface-900 mb-4 pb-2 border-b border-surface-50 flex items-center gap-2">
              <UserPlus className="text-violet-600" size={20} /> Register New Tenant Associate
            </h3>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-surface-500">Full Name</label>
                <input type="text" required value={userForm.full_name} onChange={e => setUserForm({...userForm, full_name: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-surface-500">Corporate Email</label>
                <input type="email" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Set Security Password</label>
                  <input type="password" required value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Default Auth Role</label>
                  <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer">
                    {availableRoles.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  {isHRUser && (
                    <p className="text-[9px] text-amber-600 font-bold mt-1">
                      âš  HR can only create Employee, Manager, or Recruiter accounts
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Target Department</label>
                  <select value={userForm.department} onChange={e => setUserForm({...userForm, department: e.target.value, designation: ''})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer">
                    <option value="">Unassigned</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Designation / Team</label>
                  <select value={userForm.designation} onChange={e => setUserForm({...userForm, designation: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer">
                    <option value="">Unassigned</option>
                    {departments
                      .find(d => d.name === userForm.department)
                      ?.designations?.map((desigName, idx) => (
                        <option key={idx} value={desigName}>{desigName}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2.5 border border-surface-200 hover:bg-surface-50 text-surface-700 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer">Create Associate</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 2. Configure Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-surface-150 relative"
          >
            <h3 className="text-lg font-bold text-surface-900 mb-4 pb-2 border-b border-surface-50 flex items-center gap-2">
              <Folder className="text-violet-600" size={20} /> {editingDeptId ? 'Edit Department Details' : 'Configure Organizational Unit'}
            </h3>
            
            <form onSubmit={handleCreateDept} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-surface-500">Department Name</label>
                <input type="text" required placeholder="e.g. Engineering" value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Budget Limit (INR)</label>
                  <input type="number" required placeholder="e.g. 5000000" value={deptForm.budget} onChange={e => setDeptForm({...deptForm, budget: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Designation / Team (comma-separated)</label>
                  <input type="text" placeholder="e.g. Junior Developer, Senior Developer" value={deptForm.designations} onChange={e => setDeptForm({...deptForm, designations: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-surface-500">Department Head / Manager</label>
                <select value={deptForm.head || ''} onChange={e => setDeptForm({...deptForm, head: e.target.value || ''})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer">
                  <option value="">Unassigned / None</option>
                  {usersList
                    .filter(u => ['manager', 'hr', 'admin'].includes(u.role?.toLowerCase()))
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.full_name || u.email} ({u.role})</option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-surface-500">Department Division Description</label>
                <textarea rows="3" required placeholder="Enter core description..." value={deptForm.description} onChange={e => setDeptForm({...deptForm, description: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold resize-none focus:outline-none"></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => { setShowDeptModal(false); setEditingDeptId(null); setDeptForm({ name: '', description: '', budget: '', head: '', designations: '' }); }} className="px-4 py-2.5 border border-surface-200 hover:bg-surface-50 text-surface-700 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#6345ED] hover:bg-[#5235D6] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer">{editingDeptId ? 'Update Department' : 'Save Department'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 3. Assign Roles Modal */}
      {activeRoleAssign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-surface-150 relative overflow-y-auto max-h-[90vh]"
          >
            <h3 className="text-lg font-bold text-surface-900 mb-4 pb-2 border-b border-surface-50 flex items-center gap-2">
              <Award className="text-violet-600" size={20} /> Edit Employee Profile & Assignments
            </h3>
            
            <form onSubmit={handleAssignRoleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Full Name</label>
                  <input type="text" disabled value={activeRoleAssign.full_name || 'Associate'} className="w-full px-4 py-2.5 bg-surface-100 border border-surface-200 rounded-xl text-xs text-slate-500 font-semibold cursor-not-allowed" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Employee ID</label>
                  <input type="text" disabled value={activeRoleAssign.employee_id || 'N/A'} className="w-full px-4 py-2.5 bg-surface-100 border border-surface-200 rounded-xl text-xs text-slate-500 font-semibold cursor-not-allowed" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-surface-500">Target Email</label>
                <input type="text" disabled value={activeRoleAssign.email} className="w-full px-4 py-2.5 bg-surface-100 border border-surface-200 rounded-xl text-xs text-slate-500 font-semibold cursor-not-allowed" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Allocate Authorization Role</label>
                  <select required value={roleForm.role} onChange={e => setRoleForm({ ...roleForm, role: e.target.value })} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs focus:outline-none cursor-pointer">
                    {availableRoles.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  {isHRUser && (
                    <p className="text-[9px] text-amber-600 font-bold mt-1">
                      âš  HR can assign: Employee, Manager, Recruiter only
                    </p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Department</label>
                  <select value={roleForm.department} onChange={e => setRoleForm({ ...roleForm, department: e.target.value, designation: '' })} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs focus:outline-none cursor-pointer">
                    <option value="">Unassigned</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Designation / Team</label>
                  <select value={roleForm.designation} onChange={e => setRoleForm({ ...roleForm, designation: e.target.value })} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs focus:outline-none cursor-pointer">
                    <option value="">Unassigned</option>
                    {departments
                      .find(d => d.name === roleForm.department)
                      ?.designations?.map((desigName, idx) => (
                        <option key={idx} value={desigName}>{desigName}</option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Reporting Manager</label>
                  <select value={roleForm.reporting_manager} onChange={e => setRoleForm({ ...roleForm, reporting_manager: e.target.value })} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs focus:outline-none cursor-pointer">
                    <option value="">Unassigned</option>
                    {usersList
                      .filter(u => ['manager', 'hr', 'admin'].includes(u.role?.toLowerCase()) && u.id !== activeRoleAssign.id)
                      .map(u => (
                        <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Work Location</label>
                  <input type="text" placeholder="e.g. Remote, Office" value={roleForm.office_location} onChange={e => setRoleForm({ ...roleForm, office_location: e.target.value })} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs focus:outline-none" />
                </div>

                <div className="flex items-center gap-2 mt-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="is_active" 
                    checked={roleForm.is_active} 
                    onChange={e => setRoleForm({ ...roleForm, is_active: e.target.checked })} 
                    className="w-4.5 h-4.5 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500 cursor-pointer"
                  />
                  <label htmlFor="is_active" className="text-xs font-bold text-slate-700 cursor-pointer select-none">Activate Account</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setActiveRoleAssign(null)} className="px-4 py-2.5 border border-surface-200 hover:bg-surface-50 text-surface-700 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#6345ED] hover:bg-[#5235D6] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer">Save Employee Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 4. Onboard Activation Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-surface-150 relative text-left"
          >
            <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <ShieldCheck size={10} /> Selected Candidate
            </div>

            <h3 className="text-lg font-bold text-surface-900 mb-4 pb-2 border-b border-surface-50 flex items-center gap-2">
              <UserPlus className="text-emerald-600" size={20} /> Approve & Activate Employee Account
            </h3>
            
            <form onSubmit={handleOnboardCandidateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-surface-500">Employee Full Name</label>
                <input type="text" required value={onboardForm.full_name} onChange={e => setOnboardForm({...onboardForm, full_name: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-surface-500">Corporate Email Address</label>
                <input type="email" required value={onboardForm.email} onChange={e => setOnboardForm({...onboardForm, email: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Department</label>
                  <input type="text" required value={onboardForm.department} onChange={e => setOnboardForm({...onboardForm, department: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Designation</label>
                  <input type="text" required value={onboardForm.designation} onChange={e => setOnboardForm({...onboardForm, designation: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Temporary Password</label>
                  <input type="text" required value={onboardForm.password} onChange={e => setOnboardForm({...onboardForm, password: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-surface-500">Allocate security Role</label>
                  <select value={onboardForm.role} onChange={e => setOnboardForm({...onboardForm, role: e.target.value})} className="w-full px-4 py-2.5 bg-surface-50/50 border border-surface-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer">
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="hr">HR</option>
                    <option value="payroll">Payroll Executive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowOnboardModal(false)} className="px-4 py-2.5 border border-surface-200 hover:bg-surface-50 text-surface-600 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-sm cursor-pointer">Provision Account</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};
