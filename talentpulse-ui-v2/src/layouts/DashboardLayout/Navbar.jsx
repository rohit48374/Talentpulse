import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Menu,
  ChevronLeft,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  Calendar,
  FileText,
  Award
} from 'lucide-react';
import { IconButton } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

export const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const { user, employee, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme-mode') || 'light';
  });

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread_count/');
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await api.get('/notifications/');
      if (response.data && response.data.results) {
        setNotifications(response.data.results);
      } else {
        setNotifications(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/mark_as_read/`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isNotificationsOpen) {
      fetchNotifications();
    }
  }, [isNotificationsOpen]);

  const getNotificationIcon = (type) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('leave')) return <FileText size={14} className="text-violet-400" />;
    if (t.includes('payroll') || t.includes('payslip')) return <span className="text-emerald-400 font-extrabold text-xs">$</span>;
    if (t.includes('recruitment') || t.includes('interview')) return <Calendar size={14} className="text-indigo-400" />;
    if (t.includes('appraisal')) return <Award size={14} className="text-amber-400" />;
    return <Bell size={14} className="text-slate-400" />;
  };

  const applyTheme = (mode) => {
    setTheme(mode);
    localStorage.setItem('theme-mode', mode);
    
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else if (mode === 'light') {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    } else if (mode === 'pc') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isSystemDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-mode') || 'light';
    applyTheme(savedTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      const currentMode = localStorage.getItem('theme-mode') || 'light';
      if (currentMode === 'pc') {
        if (e.matches) {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const handleLogoutClick = () => {
    logout();
    navigate('/');
  };

  const profileImageUrl = user?.profile_image 
    ? (user.profile_image.startsWith('http') ? user.profile_image : `http://${window.location.hostname}:8000${user.profile_image}`)
    : employee?.user_profile_image 
    ? (employee.user_profile_image.startsWith('http') ? employee.user_profile_image : `http://${window.location.hostname}:8000${employee.user_profile_image}`)
    : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

  return (
    <nav className="h-20 bg-white dark:bg-[#0c1125] border-b border-surface-200 dark:border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-all duration-300">
      
      {/* Left side */}
      <div className="flex items-center gap-4">
        <IconButton 
          onClick={toggleSidebar}
          className="text-surface-500 hover:text-surface-900 dark:text-slate-400 dark:hover:text-white bg-surface-50 dark:bg-slate-900 hover:bg-surface-100 dark:hover:bg-slate-800 transition-colors"
          size="small"
        >
          {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </IconButton>
        
        {/* Search Bar */}
        <div className="hidden md:flex items-center relative">
          <Search className="absolute left-3 text-surface-400 dark:text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search employees, documents..." 
            className="pl-10 pr-4 py-2 w-72 bg-surface-50 dark:bg-slate-900 border border-surface-200 dark:border-slate-800 rounded-lg text-sm text-surface-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-[#12182b] focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-medium"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        <div 
          className="relative"
          onMouseEnter={() => setIsNotificationsOpen(true)}
          onMouseLeave={() => setIsNotificationsOpen(false)}
        >
          <button className="relative p-2 text-surface-400 hover:text-surface-700 dark:text-slate-400 dark:hover:text-white transition-colors rounded-lg hover:bg-surface-50 dark:hover:bg-slate-900 cursor-pointer">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 rounded-full border border-white dark:border-[#0c1125] text-[9px] font-black text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-[-60px] sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white dark:bg-[#0c1125] backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-surface-200 dark:border-slate-800/80 overflow-hidden py-3 z-50 text-slate-700 dark:text-slate-200"
              >
                <div className="px-4 pb-2 border-b border-surface-100 dark:border-slate-800/60 flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Notifications</h4>
                  <span className="text-[10px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-surface-100 dark:divide-slate-800/40">
                  {loadingNotifications ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-500 mx-auto mb-2"></div>
                      Loading alerts...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 font-semibold">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => n.status === 'unread' && handleMarkAsRead(n.id)}
                        className={`p-3 flex gap-3 text-left transition-colors duration-200 cursor-pointer ${
                          n.status === 'unread' 
                            ? 'bg-violet-500/5 hover:bg-violet-500/10' 
                            : 'hover:bg-surface-50 dark:hover:bg-slate-900/50'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-surface-100 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-surface-200 dark:border-slate-800">
                          {getNotificationIcon(n.notification_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs truncate ${n.status === 'unread' ? 'font-black text-slate-950 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>{n.title}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-1 uppercase tracking-wider">
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {n.status === 'unread' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0 self-center" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-6 w-px bg-surface-200 dark:bg-slate-800/80 mx-2"></div>

        <div 
          className="relative"
          onMouseEnter={() => setIsProfileOpen(true)}
          onMouseLeave={() => setIsProfileOpen(false)}
        >
          <div className="flex items-center gap-3 p-1.5 pr-4 rounded-full hover:bg-surface-100 dark:hover:bg-slate-900 transition-all cursor-pointer">
            <img src={profileImageUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover shadow-sm" />
            <span className="text-sm font-bold text-surface-700 dark:text-slate-200 hidden sm:block">{user?.full_name?.split(' ')[0] || user?.first_name}</span>
            <ChevronDown size={14} className="text-surface-400" />
          </div>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-64 bg-[#0a0f1d]/95 backdrop-blur-md rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-800/80 overflow-hidden py-4 z-50 text-slate-200"
              >
                {/* User Info Header */}
                <div className="px-4 py-3 flex items-center gap-3">
                  <img src={profileImageUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-slate-700/50 shadow-md" />
                  <div className="overflow-hidden">
                    <p className="font-black text-white text-sm truncate">{user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim()}</p>
                    <p className="text-xs font-semibold text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>

                {/* Theme Toggle Panel */}
                <div className="px-4 py-2">
                  <div className="bg-[#12182b] border border-slate-800/80 rounded-2xl p-1 flex justify-between gap-1 shadow-inner">
                    {/* Light Button */}
                    <button 
                      onClick={() => applyTheme('light')}
                      className={`w-1/3 flex justify-center py-1.5 rounded-xl transition-all duration-300 cursor-pointer ${
                        theme === 'light' 
                          ? 'bg-[#1b233d] text-amber-400 border border-[#263155] shadow-md animate-pulse' 
                          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                      }`}
                      title="Light Mode"
                    >
                      <Sun size={16} />
                    </button>
                    
                    {/* Dark Button */}
                    <button 
                      onClick={() => applyTheme('dark')}
                      className={`w-1/3 flex justify-center py-1.5 rounded-xl transition-all duration-300 cursor-pointer ${
                        theme === 'dark' 
                          ? 'bg-[#1b233d] text-violet-400 border border-[#263155] shadow-md animate-pulse' 
                          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                      }`}
                      title="Night Dark Mode"
                    >
                      <Moon size={16} />
                    </button>
                    
                    {/* PC/System Button */}
                    <button 
                      onClick={() => applyTheme('pc')}
                      className={`w-1/3 flex justify-center py-1.5 rounded-xl transition-all duration-300 cursor-pointer ${
                        theme === 'pc' 
                          ? 'bg-[#1b233d] text-sky-400 border border-[#263155] shadow-md animate-pulse' 
                          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                      }`}
                      title="System Preferences"
                    >
                      <Monitor size={16} />
                    </button>
                  </div>
                </div>

                <div className="my-2 border-t border-slate-800/60"></div>

                {/* Menu Options */}
                <div className="px-2 space-y-0.5">
                  <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-xs font-black text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                    <User size={14} className="text-slate-400" /> Your Profile
                  </Link>
                  <Link to="/profile/edit" className="flex items-center gap-3 px-4 py-2.5 text-xs font-black text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                    <Settings size={14} className="text-slate-400" /> Settings
                  </Link>
                </div>

                <div className="my-2 border-t border-slate-800/60"></div>
                
                <div className="px-2">
                  <button 
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                  >
                    <LogOut size={14} className="text-slate-400" /> Log Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </nav>
  );
};
