import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  CalendarDays, 
  CreditCard, 
  TrendingUp,
  Settings,
  Menu,
  ChevronLeft,
  Clock,
  User,
  FileText,
  DollarSign,
  TrendingDown,
  Folder,
  Shield,
  Sliders
} from 'lucide-react';
import { IconButton } from '@mui/material';
import { Logo } from '../../components/common/Logo';

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, employee, logout } = useAuth();
 
  const getMenuItems = () => {
    const role = user?.role?.toLowerCase() || 'employee';
    
    if (role === 'manager') {
      return [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/team-employees', icon: Users, label: 'Team Management' },
        { path: '/leave-approvals', icon: CalendarDays, label: 'Leave Approvals' },
        { path: '/team-performance', icon: TrendingUp, label: 'Performance Reviews' },
        { path: '/candidate-interviews', icon: Briefcase, label: 'Candidate Interviews' },
        { path: '/team-reports', icon: CreditCard, label: 'Reports' },
      ];
    } else if (role === 'hrbp' || role === 'hr') {
      return [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/employees', icon: Users, label: 'Employees' },
        { path: '/recruitment', icon: Briefcase, label: 'Recruitment' },
        { path: '/hr-interviews', icon: CalendarDays, label: 'Interview Assignments' },
        { path: '/reports', icon: CreditCard, label: 'Reports & Analytics' },
      ];
    } else if (role === 'recruiter') {
      return [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/jobs', icon: Briefcase, label: 'Job Postings' },
        { path: '/candidates', icon: Users, label: 'Candidates' },
        { path: '/interviews', icon: CalendarDays, label: 'Interviews' },
        { path: '/offers', icon: CreditCard, label: 'Offers' },
        { path: '/reports', icon: TrendingUp, label: 'Reports' },
      ];
    } else if (role === 'payroll') {
      return [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/payroll-runs', icon: DollarSign, label: 'Payroll Runs' },
        { path: '/salary-structures', icon: Sliders, label: 'Salary Structure' },
        { path: '/payslips', icon: FileText, label: 'Payslips' },
        { path: '/deductions', icon: TrendingDown, label: 'Deductions' },
        { path: '/reports', icon: CreditCard, label: 'Reports' },
      ];
    } else if (role === 'super_admin' || role === 'hr_admin' || role === 'admin') {
      return [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/profile', icon: User, label: 'My Profile' },
        { path: '/users', icon: Users, label: 'Users' },
        { path: '/roles', icon: Shield, label: 'Roles & Permissions' },
        { path: '/audit-logs', icon: FileText, label: 'Audit Logs' },
        { path: '/grievances', icon: Shield, label: 'Grievance Console' },
        { path: '/departments', icon: Folder, label: 'Departments' },
        { path: '/settings', icon: Settings, label: 'System Settings' },
      ];
    }
    
    // Default: Employee
    if (!employee?.department && !user?.department) {
      return [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/profile', icon: User, label: 'My Profile' },
      ];
    }
    
    return [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/profile', icon: User, label: 'My Profile' },
      { path: '/attendance', icon: Clock, label: 'Attendance' },
      { path: '/leaves', icon: CalendarDays, label: 'Leave Management' },
      { path: '/grievances', icon: Shield, label: 'My Grievances' },
      { path: '/payslips', icon: FileText, label: 'Payslips' },
      { path: '/appraisal', icon: TrendingUp, label: 'Appraisal' },
    ];
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.div 
      initial={false}
      animate={{ width: isOpen ? 260 : 80 }}
      className="h-screen bg-surface-900 text-white flex flex-col flex-shrink-0 relative shadow-2xl z-20"
    >
      <div className="h-20 flex items-center justify-between px-4 border-b border-surface-800">
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm">
                <Logo size="sm" theme="dark" />
              </div>
            </Link>
          </motion.div>
        )}
        <div className={`${!isOpen && 'w-full flex justify-center'}`}>
          <IconButton onClick={() => setIsOpen(!isOpen)} sx={{ color: 'white' }}>
            {isOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </IconButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 no-scrollbar flex flex-col gap-2 px-3">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link key={item.path} to={item.path}>
              <motion.div 
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-primary-600 to-primary-800 text-white shadow-lg border border-primary-500/30' 
                    : 'text-surface-400 hover:bg-surface-800/80 hover:text-white'
                }`}
              >
                <item.icon size={22} className={`${isActive ? 'text-white' : ''} ${!isOpen && 'mx-auto'}`} />
                {isOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
              </motion.div>
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-surface-800 space-y-2">
        {user?.role?.toLowerCase() !== 'recruiter' && (
          <Link to="/settings">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-surface-400 hover:bg-surface-800 hover:text-white transition-colors`}
            >
              <Settings size={22} className={`${!isOpen && 'mx-auto'}`} />
              {isOpen && <span className="font-medium">Settings</span>}
            </motion.div>
          </Link>
        )}
        
        {/* Logout Button */}
        <div onClick={handleLogout} className="cursor-pointer">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-500 transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${!isOpen && 'mx-auto'}`}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            {isOpen && <span className="font-medium">Log out</span>}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
