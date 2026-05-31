import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronDown, Bookmark, MoreHorizontal, Users, Shield, Award, Briefcase, Calendar, X,
  Mail, Phone, MapPin, Eye, GraduationCap, BookOpen, User, CreditCard, SlidersHorizontal
} from 'lucide-react';
import { Avatar, Button, Checkbox, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export const EmployeeDirectory = () => {
  const { user } = useAuth();

  // State for fetched dynamic data
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  // Filters & search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [selectedDesigs, setSelectedDesigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Edit employee state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [editForm, setEditForm] = useState({
    role: 'employee',
    department: '',
    designation: '',
    reporting_manager: '',
    office_location: '',
    employment_type: 'permanent',
    status: 'active',
    joining_date: '',
    is_active: true
  });

  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const isHRorAdmin = ['admin', 'hr'].includes(user?.role?.toLowerCase());
  const isHRUser = user?.role?.toLowerCase() === 'hr';

  // Role-assignment permission matrix (same as backend enforcement)
  // HR    → employee, manager, recruiter only
  // Admin → employee, manager, recruiter, hr, payroll (NOT admin)
  const availableRoles = isHRUser
    ? [
      { value: 'employee', label: 'Employee' },
      { value: 'manager', label: 'Manager' },
      { value: 'recruiter', label: 'Recruiter' },
    ]
    : [
      { value: 'employee', label: 'Employee' },
      { value: 'manager', label: 'Manager' },
      { value: 'recruiter', label: 'Recruiter' },
      { value: 'hr', label: 'HR' },
      { value: 'payroll', label: 'Payroll Executive' },
    ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empRes, deptRes, desigRes] = await Promise.all([
          api.get('/employees/profiles/'),
          api.get('/employees/departments/'),
          api.get('/employees/designations/')
        ]);

        setEmployees(empRes.data.results || empRes.data || []);
        setDepartments(deptRes.data.results || deptRes.data || []);
        setDesignations(desigRes.data.results || desigRes.data || []);

        if (['admin', 'hr'].includes(user?.role?.toLowerCase())) {
          const usersRes = await api.get('/users/');
          setUsersList(usersRes.data.results || usersRes.data || []);
        }
      } catch (err) {
        console.error("Failed to load directory directories", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleEditEmployee = (person) => {
    const matchedUser = usersList.find(u => u.id === person.user);

    setEditingEmployee(person);
    setEditForm({
      role: matchedUser?.role || 'employee',
      department: person.department_name || '',
      designation: person.designation_name || '',
      reporting_manager: person.reporting_manager || '',
      office_location: person.office_location || '',
      employment_type: person.employment_type || 'permanent',
      status: person.status || 'active',
      joining_date: person.joining_date || '',
      is_active: matchedUser ? matchedUser.is_active !== false : true
    });
    setFormSuccess('');
    setFormError('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormError('');
      setFormSuccess('');

      await api.post('/roles/assign/', {
        user_id: editingEmployee.user,
        role: editForm.role,
        department: editForm.department,
        designation: editForm.designation,
        reporting_manager: editForm.reporting_manager,
        office_location: editForm.office_location,
        is_active: editForm.is_active
      });

      await api.patch(`/employees/profiles/${editingEmployee.id}/`, {
        status: editForm.status,
        employment_type: editForm.employment_type,
        joining_date: editForm.joining_date || null
      });

      setFormSuccess(`Profile and Department assignments updated successfully for ${editingEmployee.user_full_name}!`);

      const [empRes, usersRes] = await Promise.all([
        api.get('/employees/profiles/'),
        api.get('/users/')
      ]);
      setEmployees(empRes.data.results || empRes.data || []);
      setUsersList(usersRes.data.results || usersRes.data || []);

      setTimeout(() => {
        setShowEditModal(false);
        setEditingEmployee(null);
      }, 1500);

    } catch (err) {
      console.error(err);
      let errMsg = 'Failed to update employee assignments.';
      if (err.response && err.response.data) {
        const data = err.response.data;
        errMsg = data.detail || data.error || data.message || JSON.stringify(data);
      }
      setFormError(errMsg);
    }
  };

  const handleDeptToggle = (deptName) => {
    if (selectedDepts.includes(deptName)) {
      setSelectedDepts(selectedDepts.filter(d => d !== deptName));
    } else {
      setSelectedDepts([...selectedDepts, deptName]);
    }
  };

  const handleDesigToggle = (desigName) => {
    if (selectedDesigs.includes(desigName)) {
      setSelectedDesigs(selectedDesigs.filter(d => d !== desigName));
    } else {
      setSelectedDesigs([...selectedDesigs, desigName]);
    }
  };

  // Perform client-side filter for real-time search/department/designation response
  // Role-based scoping is enforced server-side — the API returns only what the user is allowed to see
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = searchQuery === '' ||
      emp.user_full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDepts.length === 0 ||
      selectedDepts.includes(emp.department_name);

    const matchesDesig = selectedDesigs.length === 0 ||
      selectedDesigs.includes(emp.designation_name);

    return matchesSearch && matchesDept && matchesDesig;
  });


  const getProfileImg = (emp) => {
    if (emp.user_profile_image) {
      return emp.user_profile_image.startsWith('http') ? emp.user_profile_image : `http://${window.location.hostname}:8000${emp.user_profile_image}`;
    }
    return `https://i.pravatar.cc/150?u=${emp.id}`;
  };

  return (
    <div className="flex h-[calc(100vh-100px)] overflow-hidden bg-slate-50 font-sans -mx-4 -mt-4 relative">

      {/* Mobile Filters Overlay */}
      {showMobileFilters && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setShowMobileFilters(false)}
        />
      )}

      {/* Dynamic Filter Sidebar */}
      <div className={`fixed lg:relative inset-y-0 left-0 lg:left-auto w-66 bg-white/95 backdrop-blur-md shadow-2xl lg:shadow-[4px_0_24px_rgba(0,0,0,0.01)] flex flex-col h-full overflow-y-auto border-r border-slate-100 z-30 transition-transform duration-300 transform ${showMobileFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} rounded-br-[2rem] lg:rounded-br-none`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-violet-600" /> Filters
          </h2>
          <button
            className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            onClick={() => setShowMobileFilters(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex-1 space-y-6">
          {/* Departments Filter */}
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-3 text-slate-800 font-extrabold text-xs uppercase tracking-wider">
              <span>Department</span>
              <ChevronDown size={14} className="text-slate-450" />
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {departments.map((dept) => (
                <label key={dept.id} className="flex items-center gap-2 text-xs text-slate-600 hover:text-violet-600 transition-colors cursor-pointer select-none">
                  <Checkbox
                    size="small"
                    checked={selectedDepts.includes(dept.name)}
                    onChange={() => handleDeptToggle(dept.name)}
                    sx={{ p: 0.2, color: '#cbd5e1', '&.Mui-checked': { color: '#7c3aed' } }}
                  />
                  <span className="font-semibold">{dept.name}</span>
                </label>
              ))}
              {departments.length === 0 && (
                <p className="text-[10px] text-slate-400 italic p-1">No departments active</p>
              )}
            </div>
          </div>

          {/* Designations/Profession Filter */}
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-3 text-slate-800 font-extrabold text-xs uppercase tracking-wider">
              <span>Profession / Role</span>
              <ChevronDown size={14} className="text-slate-450" />
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {designations.map((desig) => (
                <label key={desig.id} className="flex items-center gap-2 text-xs text-slate-600 hover:text-violet-600 transition-colors cursor-pointer select-none">
                  <Checkbox
                    size="small"
                    checked={selectedDesigs.includes(desig.name)}
                    onChange={() => handleDesigToggle(desig.name)}
                    sx={{ p: 0.2, color: '#cbd5e1', '&.Mui-checked': { color: '#7c3aed' } }}
                  />
                  <span className="font-semibold">{desig.name}</span>
                </label>
              ))}
              {designations.length === 0 && (
                <p className="text-[10px] text-slate-400 italic p-1">No designations active</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/30">

        {/* Top Header / Search */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center shadow-lg rounded-bl-[2rem] gap-4 shrink-0 relative z-10">
          <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-white/5 filter blur-3xl"></div>
          <div className="flex items-center gap-3 text-white self-start sm:self-auto">
            <div className="p-2 bg-white/10 rounded-xl">
              <Users size={22} className="text-violet-100" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-black tracking-tight text-white leading-none">
                {user?.role === 'manager' ? 'My Team' : user?.role === 'hr' ? 'Employee Directory' : 'Workforce Directory'}
              </h1>
              <p className="text-[10px] text-violet-200 mt-1.5 font-bold uppercase tracking-wider">
                {user?.role === 'manager' ? 'Team Members Overview' : user?.role === 'hr' ? 'Manage Employee Records' : 'Dynamic Profile Manager'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden p-2.5 text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
              title="Open Filters"
            >
              <SlidersHorizontal size={18} />
            </button>

            <div className="relative flex-1 sm:flex-none sm:w-60">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-300" size={16} />
              <input
                type="text"
                placeholder="Search workforce..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 hover:bg-white/15 focus:bg-white border border-white/10 focus:border-white text-white focus:text-slate-800 placeholder:text-violet-200 focus:placeholder:text-slate-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-400/25 transition-all text-xs font-semibold shadow-inner"
              />
            </div>

            <div className="hidden md:flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 cursor-default">
              <Avatar
                src={user?.profile_image ? (user.profile_image.startsWith('http') ? user.profile_image : `http://${window.location.hostname}:8000${user.profile_image}`) : `https://i.pravatar.cc/150?u=${user?.id}`}
                sx={{ width: 28, height: 28, border: '1.5px solid rgba(255,255,255,0.4)' }}
              />
              <div className="text-white text-xs">
                <p className="text-[9px] text-violet-200 uppercase tracking-widest leading-none mb-0.5">{user?.role || 'Staff'}</p>
                <p className="font-extrabold leading-none">{user?.full_name || 'User'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Directory List Cards */}
        <div className="p-6 lg:p-8 pb-4 overflow-y-auto flex-1 no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
              <CircularProgress sx={{ color: '#7c3aed' }} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading Workforce...</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">
                    {user?.role === 'manager' ? 'Team Members' : user?.role === 'hr' ? 'Employee Records' : 'Workforce Members'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    {filteredEmployees.length === 0
                      ? 'No results match your filters'
                      : `Showing ${filteredEmployees.length} ${user?.role === 'manager' ? 'team member' : 'registered profile'}${filteredEmployees.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>


              <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-6 pb-20">
                {filteredEmployees.map((person, index) => {
                  const isPersonActive = person.status?.toLowerCase() === 'active';
                  const statusConfig = {
                    active: 'bg-emerald-50 border-emerald-150 text-emerald-700 🟢',
                    probation: 'bg-amber-50 border-amber-150 text-amber-700 🟡',
                    resigned: 'bg-rose-50 border-rose-150 text-rose-700 🔴',
                    exited: 'bg-slate-100 border-slate-200 text-slate-500 ❌',
                  };
                  const statusStyle = statusConfig[person.status?.toLowerCase()] || 'bg-slate-50 border-slate-150 text-slate-600 ⚪';

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.3 }}
                      whileHover={{ y: -6, scale: 1.01 }}
                      key={person.id}
                      className="bg-white rounded-[2rem] border border-slate-100/80 shadow-md flex flex-col overflow-hidden group hover:border-violet-300 hover:shadow-xl transition-all duration-300 relative h-[400px]"
                    >
                      {/* Top card banner bg with dynamic gradient overlay */}
                      <div className="h-20 bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-fuchsia-500/10 relative overflow-hidden shrink-0">
                        {/* Decorative background shapes */}
                        <div className="absolute -top-5 -right-5 w-16 h-16 rounded-full bg-violet-400/10 blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="absolute -bottom-5 -left-5 w-16 h-16 rounded-full bg-indigo-400/10 blur-xl group-hover:scale-150 transition-transform duration-500"></div>

                        <span className={`absolute top-4 left-4 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm ${statusStyle} flex items-center gap-1.5`}>
                          {person.status || 'Active'}
                        </span>

                        {isHRorAdmin && (
                          <button
                            onClick={() => handleEditEmployee(person)}
                            className="absolute top-3 right-3 text-slate-450 hover:text-violet-600 bg-white/90 backdrop-blur shadow-sm p-2 rounded-xl border border-slate-100 hover:border-violet-200 hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
                            title="Edit Assignments"
                          >
                            <MoreHorizontal size={15} />
                          </button>
                        )}
                      </div>

                      {/* Main Card Body (Strict Fixed Height / Layout) */}
                      <div className="px-6 pb-5 flex-1 flex flex-col justify-between relative">
                        {/* Avatar & Name Info Row (Fixed Height to prevent shifts) */}
                        <div className="flex gap-4 items-end -mt-10 mb-3 relative z-10 shrink-0 h-16">
                          <Avatar
                            src={getProfileImg(person)}
                            sx={{
                              width: 72,
                              height: 72,
                              border: '4px solid white',
                              boxShadow: '0 8px 16px -4px rgba(0,0,0,0.15)',
                              transition: 'transform 0.3s ease',
                              '&:hover': { transform: 'scale(1.05)' }
                            }}
                            className="group-hover:border-violet-100"
                          />
                          <div className="pb-1 max-w-[calc(100%-88px)] flex-1 min-w-0">
                            <h4 className="font-extrabold text-[14px] text-slate-800 leading-snug tracking-tight truncate group-hover:text-violet-700 transition-colors">{person.user_full_name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-wider block uppercase truncate leading-none">{person.designation_name || 'Associate'}</p>
                          </div>
                        </div>

                        {/* Information Grid Container (Fixed Heights on rows to enforce total vertical alignment) */}
                        <div className="space-y-2.5 flex-1 flex flex-col justify-center">
                          {/* Row 1: Department (Fixed height `h-11`) */}
                          <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-slate-50/60 hover:bg-slate-50 border border-slate-150 p-2 rounded-xl h-11 transition-colors shrink-0">
                            <div className="p-1 bg-violet-100/50 rounded-lg text-violet-600">
                              <Briefcase size={14} className="shrink-0" />
                            </div>
                            <div className="truncate flex-1 min-w-0">
                              <span className="text-[7.5px] font-extrabold uppercase tracking-wider block leading-none text-slate-400 mb-0.5">Department</span>
                              <span className="font-bold text-[11px] text-slate-700 leading-tight block truncate">{person.department_name || 'General Staff'}</span>
                            </div>
                          </div>

                          {/* Row 2: Level & Location (Fixed height `h-11`) */}
                          <div className="grid grid-cols-2 gap-2 shrink-0">
                            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50/60 hover:bg-slate-50 border border-slate-150 p-2 rounded-xl h-11 transition-colors">
                              <div className="p-1 bg-sky-100/50 rounded-lg text-sky-600">
                                <Award size={13} className="shrink-0" />
                              </div>
                              <div className="truncate flex-1 min-w-0">
                                <span className="text-[7px] font-extrabold uppercase tracking-wider block leading-none text-slate-400 mb-0.5">Level</span>
                                <span className="font-bold text-[10px] text-slate-700 leading-tight block truncate">{person.grade_name ? `Grade ${person.grade_name}` : 'Basic'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50/60 hover:bg-slate-50 border border-slate-150 p-2 rounded-xl h-11 transition-colors">
                              <div className="p-1 bg-rose-100/50 rounded-lg text-rose-600">
                                <MapPin size={13} className="shrink-0" />
                              </div>
                              <div className="truncate flex-1 min-w-0">
                                <span className="text-[7px] font-extrabold uppercase tracking-wider block leading-none text-slate-400 mb-0.5">Location</span>
                                <span className="font-bold text-[10px] text-slate-700 leading-tight block truncate">{person.office_location || 'Remote'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Row 3: Skills (Fixed height `h-14`) */}
                          <div className="h-14 flex flex-col justify-center shrink-0 border border-slate-100/50 bg-slate-50/30 rounded-xl p-2">
                            {person.skills && person.skills.length > 0 ? (
                              <div className="w-full">
                                <p className="text-[7.5px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">Core Competencies</p>
                                <div className="flex flex-wrap gap-1 max-h-7 overflow-hidden">
                                  {person.skills.slice(0, 3).map((sk) => (
                                    <span key={sk.id} className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-violet-50 text-violet-600 border border-violet-100 leading-none truncate max-w-[85px] inline-block">
                                      {sk.skill_name}
                                    </span>
                                  ))}
                                  {person.skills.length > 3 && (
                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 leading-none">
                                      +{person.skills.length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 h-full text-[10px] text-slate-400 font-semibold italic pl-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                No competencies listed
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Footer (Fixed Height `h-14` at the very bottom) */}
                      <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex gap-2 items-center shrink-0 h-[60px]">
                        <button
                          onClick={() => setViewingEmployee(person)}
                          className="flex-1 h-9 bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-slate-700 hover:text-violet-700 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <Eye size={13} /> View Profile
                        </button>

                        <a
                          href={`mailto:${person.user_email}`}
                          className="w-9 h-9 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center cursor-pointer hover:-translate-y-0.5 active:translate-y-0 shrink-0"
                          title="Send Email"
                        >
                          <Mail size={13} />
                        </a>

                        {person.contact_number ? (
                          <a
                            href={`tel:${person.contact_number}`}
                            className="w-9 h-9 bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center cursor-pointer hover:-translate-y-0.5 active:translate-y-0 shrink-0"
                            title="Call Employee"
                          >
                            <Phone size={13} />
                          </a>
                        ) : (
                          <div
                            className="w-9 h-9 bg-slate-100 text-slate-350 rounded-xl border border-slate-200/50 flex items-center justify-center shrink-0 cursor-not-allowed"
                            title="No phone number"
                          >
                            <Phone size={13} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {filteredEmployees.length === 0 && (
                  <div className="col-span-full py-16 text-center bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                    <Users size={48} className="mx-auto text-slate-350 mb-4 animate-pulse" />
                    <p className="text-slate-750 font-black text-lg">No workforce members found</p>
                    <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or search terms.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>

      {/* Viewing Employee Complete Details Modal */}
      <AnimatePresence>
        {viewingEmployee && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white rounded-[2.5rem] p-6 lg:p-8 w-full max-w-2xl shadow-2xl border border-slate-150 relative overflow-y-auto max-h-[90vh] font-sans text-slate-800 no-scrollbar"
            >
              {/* Absolute close button */}
              <button
                onClick={() => setViewingEmployee(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Header Profile Details */}
              <div className="bg-gradient-to-r from-violet-600 to-indigo-700 p-6 rounded-3xl text-white flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden mb-6 shadow-md">
                <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-white/5 filter blur-2xl"></div>
                <Avatar
                  src={getProfileImg(viewingEmployee)}
                  sx={{ width: 80, height: 80, border: '4px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
                />
                <div className="text-center sm:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-xl font-black tracking-tight">{viewingEmployee.user_full_name}</h3>
                    {viewingEmployee.employee_id && (
                      <span className="px-2 py-0.5 rounded bg-white/20 text-white text-[9px] font-black uppercase tracking-wider border border-white/10">
                        ID: {viewingEmployee.employee_id}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-violet-200 mt-1 font-bold uppercase tracking-wider">{viewingEmployee.designation_name || 'Workforce Member'}</p>
                  <p className="text-xs text-violet-100 mt-2 font-medium flex items-center justify-center sm:justify-start gap-1">
                    <Mail size={12} /> {viewingEmployee.user_email}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Section 1: Corporate Details */}
                <div className="bg-slate-50/60 border border-slate-150 rounded-2xl p-5 shadow-inner">
                  <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-1.5">
                    <Briefcase size={12} className="text-violet-500 animate-pulse" /> Corporate Assignment & Details
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-bold">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Department</span>
                      <p className="text-slate-800 mt-0.5 text-[13px]">{viewingEmployee.department_name || 'Unassigned'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Compensation Level</span>
                      <p className="text-slate-800 mt-0.5 text-[13px]">{viewingEmployee.grade_name ? `Grade ${viewingEmployee.grade_name}` : 'Basic Grade'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Base Salary (INR)</span>
                      <p className="text-emerald-600 mt-0.5 text-[13px]">₹{viewingEmployee.grade_base_salary ? Number(viewingEmployee.grade_base_salary).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Reporting Manager</span>
                      <p className="text-slate-800 mt-0.5 text-[13px]">{viewingEmployee.reporting_manager_name || 'Direct CEO Report'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Employment Type</span>
                      <p className="text-slate-800 mt-0.5 text-[13px] capitalize">{viewingEmployee.employment_type || 'Permanent'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Work Location</span>
                      <p className="text-slate-800 mt-0.5 text-[13px] capitalize">{viewingEmployee.office_location || 'Remote'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Joining Date</span>
                      <p className="text-slate-800 mt-0.5 text-[13px]">{viewingEmployee.joining_date || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Work Phone</span>
                      <p className="text-slate-800 mt-0.5 text-[13px]">{viewingEmployee.work_phone || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Account Status</span>
                      <span className="inline-block mt-1 text-[9px] font-black uppercase bg-violet-50 text-[#6345ED] border border-violet-100 px-2 py-0.5 rounded-md">
                        {viewingEmployee.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Personal Contact details */}
                <div className="bg-slate-50/60 border border-slate-150 rounded-2xl p-5 shadow-inner">
                  <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-1.5">
                    <User size={12} className="text-sky-500 animate-pulse" /> Personal Details & Contacts
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-bold">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Gender</span>
                      <p className="text-slate-800 mt-0.5 text-[13px] capitalize">
                        {viewingEmployee.gender === 'M' ? 'Male ♂️' : viewingEmployee.gender === 'F' ? 'Female ♀️' : 'Other ⚧️'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Date of Birth</span>
                      <p className="text-slate-800 mt-0.5 text-[13px]">{viewingEmployee.date_of_birth || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Personal Email</span>
                      <p className="text-slate-800 mt-0.5 text-[13px] truncate">{viewingEmployee.personal_email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Mobile Number</span>
                      <p className="text-slate-800 mt-0.5 text-[13px]">{viewingEmployee.contact_number || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Emergency Contact</span>
                      <p className="text-slate-800 mt-0.5 text-[13px]">{viewingEmployee.emergency_contact || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Emergency Phone</span>
                      <p className="text-slate-800 mt-0.5 text-[13px]">{viewingEmployee.emergency_phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Government Identifiers */}
                {isHRorAdmin && (
                  <div className="bg-slate-50/60 border border-slate-150 rounded-2xl p-5 shadow-inner">
                    <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-1.5">
                      <CreditCard size={12} className="text-rose-500 animate-pulse" /> Government Identifiers (HR Access Only)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">PAN Number</span>
                        <p className="text-slate-850 mt-0.5 text-[13px] font-mono tracking-wider">{viewingEmployee.pan_number || 'Not Provided'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Aadhar Number</span>
                        <p className="text-slate-850 mt-0.5 text-[13px] font-mono tracking-wider">{viewingEmployee.aadhar_number || 'Not Provided'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Passport Number</span>
                        <p className="text-slate-850 mt-0.5 text-[13px] font-mono tracking-wider">{viewingEmployee.passport_number || 'Not Provided'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 4: Skills & Competencies */}
                <div className="bg-slate-50/60 border border-slate-150 rounded-2xl p-5 shadow-inner">
                  <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-1.5">
                    <Award size={12} className="text-amber-500 animate-pulse" /> Skills & Core Competencies
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {viewingEmployee.skills && viewingEmployee.skills.length > 0 ? (
                      viewingEmployee.skills.map((sk) => (
                        <div key={sk.id} className="px-3.5 py-2 bg-white rounded-xl border border-slate-150 flex items-center gap-2 shadow-sm">
                          <div>
                            <p className="font-extrabold text-xs text-slate-800 leading-tight">{sk.skill_name}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                              {sk.proficiency} | {sk.years_of_experience} yrs exp
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No competencies updated yet.</p>
                    )}
                  </div>
                </div>

                {/* Section 5: Education History */}
                <div className="bg-slate-50/60 border border-slate-150 rounded-2xl p-5 shadow-inner">
                  <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-1.5">
                    <GraduationCap size={14} className="text-emerald-500 animate-pulse" /> Academic & Education History
                  </h4>
                  <div className="space-y-3">
                    {viewingEmployee.education_history && viewingEmployee.education_history.length > 0 ? (
                      viewingEmployee.education_history.map((edu) => (
                        <div key={edu.id} className="p-3 bg-white rounded-xl border border-slate-150 shadow-sm flex justify-between items-start gap-4">
                          <div>
                            <h5 className="font-extrabold text-xs text-slate-800">{edu.qualification} in {edu.field_of_study}</h5>
                            <p className="text-[10px] text-[#6345ED] font-bold mt-0.5">{edu.institution}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-1">Grade score: <span className="font-extrabold text-slate-650">{edu.grade_or_score || 'N/A'}</span></p>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-lg shrink-0">
                            {edu.start_date?.split('-')[0]} - {edu.end_date?.split('-')[0]}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No education credentials declared.</p>
                    )}
                  </div>
                </div>

                {/* Section 6: Experience History */}
                <div className="bg-slate-50/60 border border-slate-150 rounded-2xl p-5 shadow-inner">
                  <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-1.5">
                    <BookOpen size={13} className="text-indigo-500 animate-pulse" /> Professional Experience History
                  </h4>
                  <div className="space-y-3">
                    {viewingEmployee.experience_history && viewingEmployee.experience_history.length > 0 ? (
                      viewingEmployee.experience_history.map((exp) => (
                        <div key={exp.id} className="p-3.5 bg-white rounded-xl border border-slate-150 shadow-sm flex flex-col gap-2">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h5 className="font-extrabold text-xs text-slate-850">{exp.designation}</h5>
                              <p className="text-[10px] text-[#6345ED] font-black mt-0.5 uppercase tracking-wider">{exp.company_name}</p>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-lg shrink-0">
                              {exp.start_date?.split('-')[0]} - {exp.end_date ? exp.end_date.split('-')[0] : 'Present'}
                            </span>
                          </div>
                          {exp.description && (
                            <p className="text-[10px] text-slate-450 italic font-semibold leading-relaxed border-t border-slate-50 pt-2">
                              "{exp.description}"
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No previous corporate experience records registered.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-5 border-t border-slate-100 mt-6">
                <button
                  onClick={() => setViewingEmployee(null)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl shadow-md cursor-pointer hover:-translate-y-0.5 transition-all"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Employee Modal */}
      <AnimatePresence>
        {showEditModal && editingEmployee && (
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] p-6 w-full max-w-lg shadow-2xl border border-surface-150 relative overflow-y-auto max-h-[90vh] font-sans"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-surface-100">
                <h3 className="text-lg font-black text-surface-900 flex items-center gap-2">
                  <Award className="text-violet-600" size={22} /> Edit Employee Profile & Assignments
                </h3>
                <button
                  onClick={() => { setShowEditModal(false); setEditingEmployee(null); }}
                  className="text-surface-400 hover:text-surface-600 p-1 bg-surface-50 rounded-full border border-surface-200 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {formSuccess && <div className="mb-4 p-3 bg-green-50 border border-green-150 rounded-xl text-green-700 text-xs font-bold">{formSuccess}</div>}
              {formError && <div className="mb-4 p-3 bg-red-50 border border-red-150 rounded-xl text-red-600 text-xs font-bold">{formError}</div>}

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">

                {/* Employee Header details */}
                <div className="bg-surface-50 p-3 rounded-2xl border border-surface-100 flex items-center gap-3">
                  <Avatar src={getProfileImg(editingEmployee)} sx={{ width: 44, height: 44, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} />
                  <div>
                    <h4 className="font-extrabold text-sm text-surface-900">{editingEmployee.user_full_name}</h4>
                    <p className="text-surface-450 font-medium">{editingEmployee.user_email}</p>
                  </div>
                </div>

                {/* 1. Corporate Role & Department */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-surface-500">Security Privilege Role</label>
                    <select
                      value={editForm.role}
                      onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-400 transition-all cursor-pointer"
                    >
                      {availableRoles.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    {isHRUser && (
                      <p className="text-[9px] text-amber-600 font-bold mt-1">
                        ⚠ HR can assign: Employee, Manager, Recruiter only
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-surface-500">Target Department</label>
                    <select
                      value={editForm.department}
                      onChange={e => setEditForm({ ...editForm, department: e.target.value, designation: '' })}
                      className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-400 transition-all cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Designation & Manager */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-surface-500">Designation / Team</label>
                    <select
                      value={editForm.designation}
                      onChange={e => setEditForm({ ...editForm, designation: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-400 transition-all cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {departments
                        .find(d => d.name === editForm.department)
                        ?.designations?.map((desigName, idx) => (
                          <option key={idx} value={desigName}>{desigName}</option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-surface-500">Reporting Manager</label>
                    <select
                      value={editForm.reporting_manager}
                      onChange={e => setEditForm({ ...editForm, reporting_manager: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-400 transition-all cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {usersList
                        .filter(u => ['manager', 'hr', 'admin'].includes(u.role?.toLowerCase()) && u.id !== editingEmployee.user)
                        .map(u => (
                          <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* 3. Employment Type & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-surface-500">Employment Type</label>
                    <select
                      value={editForm.employment_type}
                      onChange={e => setEditForm({ ...editForm, employment_type: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-400 transition-all cursor-pointer"
                    >
                      <option value="permanent">Permanent</option>
                      <option value="contract">Contract</option>
                      <option value="intern">Intern</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-surface-500">Employment Status</label>
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-400 transition-all cursor-pointer"
                    >
                      <option value="active">Active</option>
                      <option value="probation">Probation</option>
                      <option value="resigned">Resigned</option>
                      <option value="exited">Exited</option>
                    </select>
                  </div>
                </div>

                {/* 4. Joining Date & Work Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-surface-500">Joining Date</label>
                    <input
                      type="date"
                      value={editForm.joining_date}
                      onChange={e => setEditForm({ ...editForm, joining_date: e.target.value })}
                      className="w-full px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-400 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-surface-500">Work Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Head Office, Remote"
                      value={editForm.office_location}
                      onChange={e => setEditForm({ ...editForm, office_location: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-400 transition-all"
                    />
                  </div>
                </div>

                {/* 5. Account Switch */}
                <div className="flex items-center gap-2.5 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="modal_is_active"
                    checked={editForm.is_active}
                    onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="w-4.5 h-4.5 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500 cursor-pointer"
                  />
                  <label htmlFor="modal_is_active" className="text-xs font-bold text-slate-700 cursor-pointer select-none">Activate Corporate Login Account</label>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setEditingEmployee(null); }}
                    className="px-4 py-2.5 border border-surface-200 hover:bg-surface-50 text-surface-700 text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#6345ED] hover:bg-[#5235D6] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-indigo-200 transition-all cursor-pointer"
                  >
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
