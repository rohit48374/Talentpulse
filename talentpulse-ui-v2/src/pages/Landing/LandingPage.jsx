import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, CheckCircle2, LayoutDashboard, Settings, Star, ArrowRight,
  ShieldCheck, Zap, Globe, BarChart3, Clock, Sparkles, Building2,
  TrendingUp, Menu, X, ChevronRight, ChevronLeft,
  PlayCircle, Target, Layers, PieChart, Bell, UserCheck,
  CreditCard, Activity, ArrowUpRight, HeartHandshake, Quote,
  LogOut, User as UserIcon, ChevronDown, Briefcase,
  MessageSquare, Plus, Info
} from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { Background3D } from '../../components/common/Background3D';

// ─────────────────────────────────────────────────────────
// Animated Counter
// ─────────────────────────────────────────────────────────
const AnimatedCounter = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let t0 = null;
    const frame = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [inView, end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// ─────────────────────────────────────────────────────────
// Floating card (hero right side)
// ─────────────────────────────────────────────────────────
const FloatingCard = ({ children, className, delay = 0, amplitude = 8 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: [0, -amplitude, 0] }}
    transition={{
      opacity: { duration: 0.6, delay },
      y: { duration: 3.5 + delay * 0.4, repeat: Infinity, ease: 'easeInOut', delay: delay * 0.6 }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// ─────────────────────────────────────────────────────────
// Dashboard preview slides (hero carousel)
// ─────────────────────────────────────────────────────────
const dashboardSlides = [
  {
    label: 'Workforce Overview',
    icon: Activity,
    color: 'from-violet-600/20 to-indigo-600/15',
    metrics: [
      { label: 'Total Employees', val: '2,847', delta: '+12%', up: true, color: 'text-white' },
      { label: 'Active Today', val: '2,491', delta: '87.5%', up: true, color: 'text-emerald-400' },
      { label: 'On Leave', val: '143', delta: '5.0%', up: false, color: 'text-amber-400' },
      { label: 'Open Positions', val: '38', delta: '+6', up: true, color: 'text-violet-400' },
    ],
    chart: [40, 60, 45, 75, 65, 85, 70, 90, 80, 95],
    chartColor: '#6345ED',
  },
  {
    label: 'Payroll Summary',
    icon: CreditCard,
    color: 'from-indigo-600/20 to-blue-600/15',
    metrics: [
      { label: 'Gross Payroll', val: '₹1.24Cr', delta: '+3.2%', up: true, color: 'text-white' },
      { label: 'Net Disbursed', val: '₹98.7L', delta: '79.6%', up: true, color: 'text-emerald-400' },
      { label: 'Tax Deducted', val: '₹18.2L', delta: '14.7%', up: false, color: 'text-amber-400' },
      { label: 'Processed On', val: '1st May', delta: 'On time', up: true, color: 'text-violet-400' },
    ],
    chart: [55, 62, 58, 70, 68, 82, 75, 88, 84, 92],
    chartColor: '#06b6d4',
  },
  {
    label: 'Recruitment Pipeline',
    icon: UserCheck,
    color: 'from-cyan-600/20 to-teal-600/15',
    metrics: [
      { label: 'Applications', val: '1,284', delta: '+24%', up: true, color: 'text-white' },
      { label: 'Shortlisted', val: '342', delta: '26.6%', up: true, color: 'text-emerald-400' },
      { label: 'Interviews', val: '89', delta: '26%', up: true, color: 'text-amber-400' },
      { label: 'Offers Sent', val: '21', delta: '23.6%', up: true, color: 'text-violet-400' },
    ],
    chart: [30, 48, 42, 65, 55, 72, 68, 80, 76, 88],
    chartColor: '#10b981',
  },
];

// Mini SVG sparkline
const Sparkline = ({ data, color }) => {
  const w = 100, h = 32;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min + 1)) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────
// Testimonials
// ─────────────────────────────────────────────────────────
const testimonials = [
  { name: 'Priya Sharma', role: 'VP of People', company: 'Infosys BPM', initials: 'PS', quote: 'Hirevant transformed our HR operations. What used to take 3 days now takes 3 hours. The ROI was clear within the first quarter.', stars: 5 },
  { name: 'Rajesh Kumar', role: 'Head of HR', company: 'Wipro Digital', initials: 'RK', quote: 'The payroll automation alone saved us 40 hours a month. Compliance tracking is flawless and our team loves the dashboard.', stars: 5 },
  { name: 'Ananya Patel', role: 'CHRO', company: 'Tata Consultancy', initials: 'AP', quote: 'Best HRMS investment we have made. Our hiring cycle is down from 45 days to 18 days. Incredible velocity improvement.', stars: 5 },
  { name: 'Meera Nair', role: 'People Operations Lead', company: 'Freshworks', initials: 'MN', quote: 'The appraisal module alone justified the entire cost. Seamless integration with our existing tools and world-class support.', stars: 5 },
  { name: 'Arjun Menon', role: 'HR Director', company: 'HCL Technologies', initials: 'AM', quote: 'Our multi-country payroll used to be a nightmare. Hirevant handles 12 countries effortlessly with perfect compliance.', stars: 5 },
];

// ─────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────
const stats = [
  { val: 5000, suffix: '+', label: 'Enterprises' },
  { val: 2, suffix: 'M+', label: 'Employees Managed' },
  { val: 150, suffix: '+', label: 'Countries' },
  { val: 99.9, suffix: '%', label: 'Uptime SLA' },
];

const steps = [
  { title: 'Onboard your team', desc: 'Import employees, configure departments, and set up your org chart in under 30 minutes.', icon: Users },
  { title: 'Automate workflows', desc: 'Configure leave policies, payroll rules, approval chains, and notifications — no code needed.', icon: Zap },
  { title: 'Scale confidently', desc: 'Get real-time analytics, compliance reports, and AI-powered insights as your team grows.', icon: TrendingUp },
];

const pricingPlans = [
  { name: 'Starter', monthlyPrice: 2499, annualPrice: 1999, badge: null, desc: 'Perfect for growing teams up to 50 employees', features: ['Employee Directory', 'Leave Management', 'Attendance Tracking', 'Basic Payroll', 'Email Support'], cta: 'Start Free Trial' },
  { name: 'Professional', monthlyPrice: 5999, annualPrice: 4799, badge: 'Most Popular', desc: 'Full-featured HRMS for mid-sized companies', features: ['Everything in Starter', 'Recruitment Pipeline', 'Performance Reviews', 'Advanced Analytics', 'Priority Support', 'Compliance Engine'], cta: 'Get Started' },
  { name: 'Enterprise', monthlyPrice: null, annualPrice: null, badge: 'Custom', desc: 'Tailored for large enterprises & global teams', features: ['Everything in Professional', 'Multi-entity Support', 'Custom Integrations', 'Dedicated CSM', 'SSO & SAML', 'SLA Guarantee'], cta: 'Contact Sales' },
];

const roleRoutes = {
  admin: '/admin', hr: '/hr', manager: '/manager', employee: '/employee',
  recruiter: '/recruiter', payroll: '/payroll',
};

// ─────────────────────────────────────────────────────────
// Support Contact Form Component
// ─────────────────────────────────────────────────────────
const SupportForm = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate API submission delay
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-[2rem] p-12 text-center shadow-[0_30px_70px_rgba(0,0,0,0.4)]"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/25"
        >
          <CheckCircle2 size={38} className="text-white" />
        </motion.div>
        <h3 className="text-2xl font-black text-white mb-3">Request Received!</h3>
        <p className="text-slate-400 font-medium max-w-md mx-auto">
          Our enterprise support specialists will review your inquiry and respond within <span className="font-black text-emerald-400">2 business hours</span>.
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: 'General Inquiry', message: '' }); }}
          className="mt-8 px-7 py-3 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-bold rounded-2xl transition-all cursor-pointer"
        >
          Submit another inquiry
        </button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.4)]"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Priya Sharma"
            className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm font-semibold focus:bg-[#0A0515] focus:outline-none focus:border-violet-500 transition-all placeholder:text-slate-600"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Corporate Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="priya@company.com"
            className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm font-semibold focus:bg-[#0A0515] focus:outline-none focus:border-violet-500 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="space-y-2 mb-5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Subject / Category</label>
        <select
          name="subject"
          value={form.subject}
          onChange={handleChange}
          className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm font-semibold focus:bg-[#0A0515] focus:outline-none focus:border-violet-500 transition-all appearance-none cursor-pointer"
        >
          {['General Inquiry', 'Enterprise Onboarding', 'Technical Support', 'Billing & Subscriptions', 'Custom Integration', 'Feature Request', 'Security & Compliance'].map(s => (
            <option key={s} value={s} className="bg-[#0A0515]">{s}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2 mb-8">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Inquiry Details</label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          required
          rows={5}
          placeholder="Describe your inquiry in detail. Include your company size, current HRMS setup, and any specific requirements..."
          className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm font-semibold focus:bg-[#0A0515] focus:outline-none focus:border-violet-500 transition-all resize-none placeholder:text-slate-600"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-emerald-500" />
          SOC2 compliant · All data encrypted in transit
        </p>
        <motion.button
          type="submit"
          disabled={submitting}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="group inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-[0_12px_30px_rgba(99,69,237,0.4)] hover:shadow-[0_16px_40px_rgba(99,69,237,0.55)] transition-all disabled:opacity-70 cursor-pointer text-sm"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Send Support Request
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
};

// ─────────────────────────────────────────────────────────
// Spotlight Bento Card component (Cursor Spotlight follower)
// ─────────────────────────────────────────────────────────
const BentoCard = ({ children, className = '', delay = 0 }) => {
  const cardRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className={`relative overflow-hidden group ${className}`}
    >
      {isHovered && (
        <div
          className="absolute pointer-events-none rounded-full blur-[90px] z-10 transition-opacity duration-300"
          style={{
            width: '280px',
            height: '280px',
            top: `${coords.y - 140}px`,
            left: `${coords.x - 140}px`,
            background: 'radial-gradient(circle, rgba(99,69,237,0.16) 0%, rgba(0,242,254,0.06) 60%, transparent 100%)',
          }}
        />
      )}
      {children}
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────
export const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isAnnual, setIsAnnual] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, employee, logout } = useAuth();
  const navigate = useNavigate();
  const profileRef = useRef(null);

  // Dynamic 3D Perspective Card Tilt
  const [tilt, setTilt] = useState({ rx: 5, ry: -10 });
  const tiltContainerRef = useRef(null);

  const handleTiltMove = (e) => {
    if (!tiltContainerRef.current) return;
    const rect = tiltContainerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setTilt({
      rx: -y * 22, // Dynamic tilt on X axis
      ry: x * 22,  // Dynamic tilt on Y axis
    });
  };

  const handleTiltLeave = () => {
    setTilt({ rx: 5, ry: -10 }); // Reset to dynamic default aesthetic Y angle
  };

  // Determine dashboard route for logged-in user
  const dashRoute = user ? '/dashboard' : '/login';

  // Profile image
  const profileImg = user?.profile_image
    ? (user.profile_image.startsWith('http') ? user.profile_image : `http://${window.location.hostname}:8000${user.profile_image}`)
    : employee?.user_profile_image
      ? (employee.user_profile_image.startsWith('http') ? employee.user_profile_image : `http://${window.location.hostname}:8000${employee.user_profile_image}`)
      : null;

  const displayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : '';

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(p => (p + 1) % testimonials.length), 4500);
    return () => clearInterval(t);
  }, []);

  // Auto-rotate dashboard slides
  useEffect(() => {
    const t = setInterval(() => setSlideIdx(p => (p + 1) % dashboardSlides.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const fn = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const toggleProfile = () => {
    setProfileOpen(o => !o);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(o => !o);
    setProfileOpen(false);
  };

  const handleLogout = () => { logout(); navigate('/'); setProfileOpen(false); setIsMobileMenuOpen(false); };

  const slide = dashboardSlides[slideIdx];
  const SlideIcon = slide.icon;

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden text-slate-800">

      {/* ══════════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════════ */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'py-0' : 'py-3'}`}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between transition-all duration-500 rounded-[1.8rem] border ${
          scrolled 
            ? 'bg-white/75 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border-slate-200/80 py-3 mt-2' 
            : 'bg-[#07030E]/20 backdrop-blur-md border-white/8 py-3.5 mt-2'
        }`}>
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo size="md" theme={scrolled ? 'light' : 'dark'} />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Features', href: '#features' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'Integrations', href: '#integrations' },
              { label: 'Enterprise', href: '#enterprise' },
            ].map(item => (
              <a key={item.label} href={item.href}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 group overflow-hidden ${scrolled
                  ? 'text-slate-600 hover:text-[#6345ED] hover:bg-violet-50/50'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}>
                <span className="relative z-10">{item.label}</span>
                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] rounded-full transition-all duration-300 group-hover:w-1/2 ${scrolled ? 'bg-[#6345ED]' : 'bg-white'}`} />
              </a>
            ))}
            <a href="#support"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${scrolled
                ? 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50'
                : 'text-white/80 hover:text-emerald-300 hover:bg-white/5'
                }`}>
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Contact Us
            </a>
          </div>

          {/* Desktop Right CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              /* ── Logged-in profile dropdown ── */
              <div
                ref={profileRef}
                className="relative"
                onMouseEnter={() => setProfileOpen(true)}
                onMouseLeave={() => setProfileOpen(false)}
              >
                <button onClick={toggleProfile}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl transition-all border cursor-pointer ${scrolled ? 'bg-slate-50 border-slate-200 hover:border-[#6345ED]/40 hover:bg-violet-50' : 'bg-white/10 border-white/20 hover:bg-white/15'}`}>
                  {profileImg ? (
                    <img src={profileImg} alt="" className="w-6.5 h-6.5 rounded-full object-cover border border-slate-200 shrink-0 shadow-sm" />
                  ) : (
                    <div className="w-6.5 h-6.5 rounded-full bg-slate-900 flex items-center justify-center text-white text-[9px] font-black border border-slate-200 shadow-inner shrink-0">
                      {displayName ? displayName[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className={`text-xs font-black tracking-tight max-w-[120px] truncate ${scrolled ? 'text-slate-700' : 'text-white'}`}>
                    {displayName || 'My Account'}
                  </span>
                  <ChevronDown size={13} className={`transition-transform duration-300 ${profileOpen ? 'rotate-180 text-[#6345ED]' : ''} ${scrolled ? 'text-slate-500' : 'text-white/70'}`} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-72 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-100 p-4 z-50">

                      {/* Top Header Card */}
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-3">
                        <div className="min-w-0 pr-2">
                          <p className="text-sm font-black text-slate-900 truncate leading-none mb-1.5">{displayName}</p>
                          <p className="text-[11px] text-slate-400 font-semibold truncate leading-none">{user?.email || 'no-email@hirevant.ai'}</p>
                        </div>
                        {profileImg ? (
                          <img src={profileImg} alt="" className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0 shadow-sm" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-black border border-slate-200 shadow-sm shrink-0">
                            {displayName ? displayName[0].toUpperCase() : 'U'}
                          </div>
                        )}
                      </div>

                      {/* Menu List - Gorgeous, premium colorful items with unique colored icons */}
                      <div className="space-y-1">
                        <button onClick={() => { navigate('/profile'); setProfileOpen(false); }}
                          className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-xs font-black text-slate-700 hover:text-violet-700 hover:bg-violet-50/70 transition-all text-left cursor-pointer">
                          <ShieldCheck size={16} className="text-violet-600 shrink-0" />
                          <span className="flex-1">Profile</span>
                        </button>

                        <button onClick={() => { navigate(dashRoute); setProfileOpen(false); }}
                          className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-xs font-black text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/70 transition-all text-left cursor-pointer">
                          <LayoutDashboard size={16} className="text-indigo-600 shrink-0" />
                          <span className="flex-1">Go to Dashboard</span>
                        </button>

                        <button onClick={() => { setProfileOpen(false); }}
                          className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-xs font-black text-slate-700 hover:text-pink-700 hover:bg-pink-50/70 transition-all text-left cursor-pointer">
                          <MessageSquare size={16} className="text-pink-600 shrink-0" />
                          <span className="flex-1">Community</span>
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-pink-100 hover:text-pink-600 transition-colors">
                            <Plus size={10} />
                          </div>
                        </button>

                        <button onClick={() => { navigate('/settings'); setProfileOpen(false); }}
                          className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-xs font-black text-slate-700 hover:text-amber-700 hover:bg-amber-50/70 transition-all text-left cursor-pointer">
                          <Settings size={16} className="text-amber-600 shrink-0" />
                          <span className="flex-1">Settings</span>
                        </button>

                        <div className="border-t border-slate-100 pt-2 mt-2">
                          <button onClick={() => { setProfileOpen(false); }}
                            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-xs font-black text-slate-700 hover:text-sky-700 hover:bg-sky-50/70 transition-all text-left cursor-pointer">
                            <Info size={16} className="text-sky-600 shrink-0" />
                            <span className="flex-1">Help center</span>
                          </button>

                          <button onClick={handleLogout}
                            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-xs font-black text-rose-600 hover:bg-rose-50 transition-all text-left cursor-pointer">
                            <LogOut size={16} className="text-rose-600 shrink-0" />
                            <span className="flex-1">Sign out</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* ── Guest: Login + Contact Us buttons ── */
              <div className="flex items-center gap-3">
                <a href="#support"
                  className={`hidden lg:flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border ${scrolled
                    ? 'border-slate-200 text-slate-600 hover:border-[#6345ED]/40 hover:text-[#6345ED] hover:bg-violet-50/50'
                    : 'border-white/10 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20'
                    }`}>
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Contact Us
                </a>
                <Link to="/login"
                  className="flex items-center gap-2 px-5.5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-black uppercase tracking-wider rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all duration-300">
                  <ShieldCheck size={14} className="shrink-0" />
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right CTA & Controls */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <div ref={profileRef} className="relative">
                <button onClick={toggleProfile}
                  className={`flex items-center gap-1 p-1 rounded-full border transition-all cursor-pointer ${scrolled ? 'bg-slate-50 border-slate-200' : 'bg-white/10 border-white/20'}`}>
                  {profileImg ? (
                    <img src={profileImg} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0 shadow-sm" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-white text-[9px] font-black border border-slate-200 shadow-inner shrink-0">
                      {displayName ? displayName[0].toUpperCase() : 'U'}
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-3.5 w-64 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 p-4 z-50">

                      {/* Top Header Card */}
                      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-2.5">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-black text-slate-900 truncate leading-none mb-1">{displayName}</p>
                          <p className="text-[10px] text-slate-400 font-semibold truncate leading-none">{user?.email || 'no-email@hirevant.ai'}</p>
                        </div>
                        {profileImg ? (
                          <img src={profileImg} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 shadow-sm" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-black border border-slate-200 shadow-sm shrink-0">
                            {displayName ? displayName[0].toUpperCase() : 'U'}
                          </div>
                        )}
                      </div>

                      {/* Menu List - Beautiful, colorful items with custom mobile-scale icons */}
                      <div className="space-y-0.5">
                        <button onClick={() => { navigate('/profile'); setProfileOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-black text-slate-700 hover:text-violet-700 hover:bg-violet-50/70 transition-all text-left cursor-pointer">
                          <ShieldCheck size={14} className="text-violet-600 shrink-0" />
                          <span className="flex-1">Profile</span>
                        </button>

                        <button onClick={() => { navigate(dashRoute); setProfileOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-black text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/70 transition-all text-left cursor-pointer">
                          <LayoutDashboard size={14} className="text-indigo-600 shrink-0" />
                          <span className="flex-1">Go to Dashboard</span>
                        </button>

                        <button onClick={() => { setProfileOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-black text-slate-700 hover:text-pink-700 hover:bg-pink-50/70 transition-all text-left cursor-pointer">
                          <MessageSquare size={14} className="text-pink-600 shrink-0" />
                          <span className="flex-1">Community</span>
                          <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-pink-100 hover:text-pink-600 transition-colors animate-pulse">
                            <Plus size={8} />
                          </div>
                        </button>

                        <button onClick={() => { navigate('/settings'); setProfileOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-black text-slate-700 hover:text-amber-700 hover:bg-amber-50/70 transition-all text-left cursor-pointer">
                          <Settings size={14} className="text-amber-600 shrink-0" />
                          <span className="flex-1">Settings</span>
                        </button>

                        <div className="border-t border-slate-100 pt-2 mt-2">
                          <button onClick={() => { setProfileOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-black text-slate-700 hover:text-sky-700 hover:bg-sky-50/70 transition-all text-left cursor-pointer">
                            <Info size={14} className="text-sky-600 shrink-0" />
                            <span className="flex-1">Help center</span>
                          </button>

                          <button onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-black text-rose-600 hover:bg-rose-50 transition-all text-left cursor-pointer">
                            <LogOut size={14} className="text-rose-600 shrink-0" />
                            <span className="flex-1">Sign out</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <button onClick={toggleMobileMenu}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}>
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="md:hidden mx-4 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-4 space-y-1">
                {[
                  { label: 'Features', href: '#features' },
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'Integrations', href: '#integrations' },
                  { label: 'Enterprise', href: '#enterprise' },
                ].map(item => (
                  <a key={item.label} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-[#6345ED] hover:bg-violet-50 rounded-xl transition-colors">
                    {item.label}
                  </a>
                ))}
                <a href="#support" onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
                  <HeartHandshake size={15} /> Contact Us
                </a>
              </div>
              <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                        {displayName ? displayName[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 truncate">{displayName}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">{user?.role}</p>
                      </div>
                    </div>
                    <button onClick={() => { navigate(dashRoute); setIsMobileMenuOpen(false); }}
                      className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2">
                      <LayoutDashboard size={15} /> Go to Dashboard
                    </button>
                    <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                      className="w-full py-3 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl flex items-center justify-center gap-2">
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 pt-1">
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 py-3 text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-md shadow-violet-300/40">
                      <ShieldCheck size={15} /> Sign In to Portal
                    </Link>
                    <a href="#support" onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 py-3 text-sm font-semibold border border-emerald-200 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors">
                      <HeartHandshake size={15} /> Contact Support
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center bg-[#07030E] overflow-hidden">
        {/* Advanced organic living background animations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Violet blob */}
          <motion.div
            animate={{
              x: [0, 80, -40, 0],
              y: [0, -60, 50, 0],
              scale: [1, 1.15, 0.9, 1],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/10 left-1/10 w-[550px] h-[550px] rounded-full bg-violet-600/15 blur-[140px]"
          />
          {/* Indigo blob */}
          <motion.div
            animate={{
              x: [0, -60, 50, 0],
              y: [0, 80, -40, 0],
              scale: [1, 0.9, 1.1, 1],
            }}
            transition={{
              duration: 26,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute bottom-1/10 right-1/10 w-[450px] h-[450px] rounded-full bg-indigo-500/12 blur-[120px]"
          />
          {/* Fuchsia accent blob */}
          <motion.div
            animate={{
              x: [0, 50, -60, 0],
              y: [0, 40, -50, 0],
              scale: [0.9, 1.1, 0.95, 0.9],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
            className="absolute top-1/3 left-1/3 w-[350px] h-[350px] rounded-full bg-fuchsia-500/8 blur-[110px]"
          />

          {/* Premium High-Density Radial Grid Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(99,69,237,0.12)_1.5px,transparent_1.5px)] opacity-70" style={{ backgroundSize: '36px 36px' }} />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)]" style={{ backgroundSize: '72px 72px' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left: Headline & Enterprise Messaging */}
            <div>
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
                <div className="inline-flex items-center gap-2 px-4.5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-black text-violet-300 mb-8 tracking-wider uppercase">
                  <Sparkles size={12} className="text-amber-400 animate-pulse" />
                  ⚡ THE FUTURE OF HR OPERATIONS · POWERED BY GEN-AI
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-black tracking-tight leading-[1.06] mb-6 text-white">
                  The AI-First<br />
                  Workforce Operating<br />
                  <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
                    System.
                  </span>
                </h1>

                <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-lg font-semibold">
                  Simplify complex workforce management. Auto-run localized payroll, automate timesheets, orchestrate AI recruiting pipelines, and run 360° talent appraisals — completely unified and SOC2 compliant.
                </p>

                <div className="flex flex-wrap items-center gap-4 mb-12">
                  <Link to={dashRoute}
                    className="group inline-flex items-center gap-2 px-7 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-[0_12px_30px_rgba(99,69,237,0.4)] hover:shadow-[0_16px_40px_rgba(99,69,237,0.55)] transition-all hover:-translate-y-0.5 text-base">
                    Access Portal
                    <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <button className="inline-flex items-center gap-2 px-6 py-4 bg-white/8 hover:bg-white/12 border border-white/15 text-white font-bold rounded-2xl backdrop-blur-md transition-all text-base">
                    <PlayCircle size={17} className="text-violet-400 animate-pulse" />
                    Watch Demo
                  </button>
                </div>

                {/* Key proof points — Premium Enterprise Badges */}
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2.5 text-slate-400 text-sm font-semibold">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => <Star key={i} size={13} className="text-amber-400 fill-amber-400" />)}
                    </div>
                    <span>4.9 / 5 on G2 Crowd</span>
                  </div>
                  <div className="w-px h-4 bg-white/15" />
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold">
                    <ShieldCheck size={14} className="text-emerald-400" /> ISO 27001 & SOC2 Certified
                  </div>
                  <div className="w-px h-4 bg-white/15" />
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold">
                    <Zap size={14} className="text-violet-400" /> SLA Uptime 99.99%
                  </div>
                </div>
              </motion.div>
            </div>


            {/* Right: Dashboard Slider (True 3D Animated perspective stack) */}
            <div className="hidden lg:block">
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
                <div className="relative p-6 flex items-center justify-center" style={{ perspective: 1500, transformStyle: 'preserve-3d' }}>

                  {/* 3D Depth Card 1 (Shadow offset layer) */}
                  <motion.div
                    animate={{
                      rotateY: -16,
                      rotateX: 8,
                      z: -40,
                      x: -16,
                      y: -12
                    }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="absolute inset-6 rounded-[2.5rem] bg-gradient-to-tr from-[#6345ED]/10 to-[#06b6d4]/10 border border-white/5 shadow-2xl -z-20 pointer-events-none"
                  />

                  {/* 3D Depth Card 2 (Dark visual grid backing layer) */}
                  <motion.div
                    animate={{
                      rotateY: -20,
                      rotateX: 10,
                      z: -80,
                      x: -32,
                      y: -24
                    }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="absolute inset-8 rounded-[2.5rem] bg-slate-950/50 border border-white/5 shadow-2xl -z-30 pointer-events-none"
                  />

                  {/* Ambient glowing outer space mesh */}
                  <div className="absolute -inset-2 rounded-[3rem] bg-violet-600/8 blur-3xl -z-40 pointer-events-none animate-pulse" />
                  <div className="absolute -inset-8 rounded-[3rem] bg-indigo-500/8 blur-3xl -z-40 pointer-events-none animate-pulse" style={{ animationDelay: '1.5s' }} />

                  {/* Main Slide Card (True 3D interactive frosted pane with Y-axis Flip) */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={slideIdx}
                      initial={{ rotateY: 85, rotateX: 12, scale: 0.9, opacity: 0, z: -150 }}
                      animate={{ rotateY: -10, rotateX: 5, scale: 1, opacity: 1, z: 0 }}
                      exit={{ rotateY: -85, rotateX: -12, scale: 0.9, opacity: 0, z: -150 }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      style={{ transformStyle: 'preserve-3d' }}
                      whileHover={{
                        rotateY: -2,
                        rotateX: 2,
                        scale: 1.03,
                        z: 20,
                        transition: { duration: 0.3, ease: 'easeOut' }
                      }}
                      className="relative w-full bg-white/[0.04] backdrop-blur-3xl border border-white/12 rounded-[2.5rem] overflow-hidden shadow-[0_35px_80px_rgba(0,0,0,0.6)] cursor-pointer"
                    >
                      {/* Card header */}
                      <div className="flex items-center justify-between px-6 py-5 border-b border-white/8 bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/25 to-indigo-500/25 flex items-center justify-center border border-white/10 shadow-inner">
                            <SlideIcon size={16} className="text-violet-300 animate-pulse" />
                          </div>
                          <p className="text-white text-sm font-black tracking-widest leading-none">
                            {slide.label.toUpperCase()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-full border border-white/5">
                          {dashboardSlides.map((_, i) => (
                            <button key={i} onClick={(e) => { e.stopPropagation(); setSlideIdx(i); }}
                              className={`rounded-full transition-all duration-300 cursor-pointer ${i === slideIdx ? 'w-4 h-1.5 bg-[#6345ED] shadow-[0_0_8px_#6345ED]' : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/45'}`} />
                          ))}
                        </div>
                      </div>

                      {/* Metrics grid */}
                      <div className="p-6">
                        <div className="grid grid-cols-2 gap-3.5 mb-6">
                          {slide.metrics.map((m, i) => (
                            <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 shadow-sm hover:bg-white/[0.06] transition-colors duration-300">
                              <p className="text-white/40 text-[9px] uppercase tracking-widest font-black mb-1.5">{m.label}</p>
                              <p className={`text-xl font-black leading-none mb-1.5 ${m.color}`}>{m.val}</p>
                              <div className="flex items-center gap-1">
                                <TrendingUp size={10} className={m.up ? 'text-emerald-400' : 'text-amber-400'} />
                                <span className="text-[9px] text-white/40 font-bold">{m.delta}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Sparkline trend overlay with depth shadows */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 shadow-inner">
                          <div className="flex items-center justify-between mb-3.5">
                            <p className="text-white/40 text-[9px] uppercase tracking-widest font-black">Performance Trend Indicator</p>
                            <span className="text-emerald-400 text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">↑ Optimised</span>
                          </div>
                          <Sparkline data={slide.chart} color={slide.chartColor} />
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Floating Notification Badge (3D Parallax offset) */}
                  <FloatingCard delay={0.4} amplitude={6} className="absolute -bottom-2 -left-4 z-10 hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.5)]" style={{ transform: 'translateZ(40px)' }}>
                      <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/20 animate-pulse">
                        <CheckCircle2 size={14} className="text-white" />
                      </div>
                      <div>
                        <p className="text-white text-xs font-black leading-none">Automated Payroll</p>
                        <p className="text-slate-400 text-[9px] font-bold mt-1 uppercase tracking-wider">Sync disbursement completed</p>
                      </div>
                    </div>
                  </FloatingCard>

                  {/* Floating Tasks Pending Pill Badge */}
                  <FloatingCard delay={1.1} amplitude={5} className="absolute top-2 -right-2 z-10 hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center gap-2.5 bg-gradient-to-r from-violet-600/90 to-indigo-600/90 backdrop-blur-xl border border-white/15 px-4.5 py-2.5 rounded-2xl shadow-[0_20px_40px_rgba(99,69,237,0.3)]">
                      <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
                      <p className="text-white text-[10px] font-black uppercase tracking-wider">12 approvals pending</p>
                    </div>
                  </FloatingCard>
                </div>
              </motion.div>
            </div>
          </div>

          {/* ── Corporate Partner Infinite Marquee Slider ── */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="mt-20 pt-8 border-t border-white/8 relative overflow-hidden">
            <p className="text-slate-600 text-[10px] uppercase tracking-widest font-black text-center mb-6">
              Empowering HR Operations Across Global Brands
            </p>

            <div className="relative w-full overflow-hidden">
              {/* Fade gradients on edges */}
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0A0515] to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0A0515] to-transparent z-10 pointer-events-none" />

              <div className="animate-marquee flex items-center gap-16 py-2">
                {['Infosys', 'Wipro', 'HCL Tech', 'Freshworks', 'Zoho', 'TCS', 'Tech Mahindra', 'Cognizant', 'Capgemini', 'LTI Mindtree'].concat(
                  ['Infosys', 'Wipro', 'HCL Tech', 'Freshworks', 'Zoho', 'TCS', 'Tech Mahindra', 'Cognizant', 'Capgemini', 'LTI Mindtree']
                ).map((logo, idx) => (
                  <span key={idx} className="text-slate-500 hover:text-slate-200 text-sm sm:text-base font-black tracking-widest transition-colors duration-300 cursor-default shrink-0">
                    {logo.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          STATS RIBBON
      ══════════════════════════════════════════════════ */}
      <section className="bg-[#06030F] py-16 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 text-center">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <p className="text-4xl lg:text-5xl font-black text-white mb-2">
                  <AnimatedCounter end={s.val} suffix={s.suffix} />
                </p>
                <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          BENTO FEATURES
      ══════════════════════════════════════════════════ */}
      <section id="features" className="py-24 sm:py-28 bg-[#F8F7FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-xs font-bold uppercase tracking-widest mb-5">
              <Layers size={13} /> Everything you need
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-5">
              One platform.<br />Every HR workflow.
            </h2>
            <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
              From hire to retire — Hirevant covers every step of the employee lifecycle with enterprise-grade automation.
            </p>
          </motion.div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Large — Payroll */}
            <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="sm:col-span-2 lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-800 rounded-3xl p-7 sm:p-8 text-white flex flex-col justify-between min-h-[320px] sm:min-h-[360px] relative overflow-hidden group hover:shadow-2xl hover:shadow-violet-300/25 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
              <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5" />
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 rounded-full text-[10px] font-black uppercase tracking-widest text-violet-200 mb-5">
                  <CreditCard size={9} /> Finance
                </span>
                <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CreditCard size={20} className="text-white" />
                </div>
                <h3 className="text-2xl font-black mb-3">Automated Payroll</h3>
                <p className="text-violet-200 text-sm font-medium leading-relaxed">
                  Run compliant payroll in one click. Auto-generate payslips, handle TDS, PF, and deductions — all in minutes, not days.
                </p>
              </div>
              <div className="relative mt-6 grid grid-cols-2 gap-3">
                {[{ label: 'Time saved', val: '94%' }, { label: 'Processing errors', val: '0%' }].map((s, i) => (
                  <div key={i} className="bg-white/10 rounded-xl p-3">
                    <p className="text-2xl font-black">{s.val}</p>
                    <p className="text-violet-300 text-[10px] font-bold uppercase tracking-wider mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recruitment */}
            <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
              className="sm:col-span-2 bg-slate-900 rounded-3xl p-6 text-white flex flex-col justify-between min-h-[170px] relative overflow-hidden group hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-violet-500/8" />
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <UserCheck size={17} className="text-violet-400" />
                  </div>
                  <h3 className="font-black text-lg">Smart Recruitment</h3>
                  <p className="text-slate-400 text-sm font-medium mt-1">AI-powered pipeline from JD to offer letter.</p>
                </div>
                <span className="text-3xl font-black text-violet-400">2×</span>
              </div>
              <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest mt-4">Hiring velocity improvement</p>
            </motion.div>

            {/* Attendance */}
            <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.12 }}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 group hover:shadow-lg hover:border-violet-200 transition-all duration-500 hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Clock size={17} className="text-emerald-600" />
              </div>
              <h3 className="font-black text-slate-900 mb-1.5">Attendance & Leaves</h3>
              <p className="text-slate-500 text-sm font-medium">Geofenced check-in, auto-timesheets & leave workflows.</p>
            </motion.div>

            {/* Appraisals */}
            <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.16 }}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 group hover:shadow-lg hover:border-violet-200 transition-all duration-500 hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Target size={17} className="text-amber-600" />
              </div>
              <h3 className="font-black text-slate-900 mb-1.5">Performance Reviews</h3>
              <p className="text-slate-500 text-sm font-medium">360° appraisals, OKRs, goal tracking & promotions.</p>
            </motion.div>

            {/* Analytics */}
            <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="sm:col-span-2 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-3xl p-6 text-white flex flex-col justify-between min-h-[170px] relative overflow-hidden group hover:shadow-xl hover:shadow-blue-300/25 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <PieChart size={17} className="text-white" />
                  </div>
                  <h3 className="font-black text-lg">Workforce Analytics</h3>
                  <p className="text-cyan-200 text-sm font-medium mt-1">Real-time KPIs, attrition risk & cost analysis.</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-white">50+</p>
                  <p className="text-cyan-300 text-[9px] uppercase tracking-widest font-bold">KPIs tracked</p>
                </div>
              </div>
            </motion.div>

            {/* Compliance */}
            <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.24 }}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 group hover:shadow-lg hover:border-violet-200 transition-all duration-500 hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck size={17} className="text-rose-600" />
              </div>
              <h3 className="font-black text-slate-900 mb-1.5">Compliance Engine</h3>
              <p className="text-slate-500 text-sm font-medium">SOC2 certified. Audit trails & data encryption.</p>
            </motion.div>

            {/* Employee Directory */}
            <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.28 }}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 group hover:shadow-lg hover:border-violet-200 transition-all duration-500 hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users size={17} className="text-violet-600" />
              </div>
              <h3 className="font-black text-slate-900 mb-1.5">Employee Directory</h3>
              <p className="text-slate-500 text-sm font-medium">Centralized profiles, org charts & document hub.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          LINKEDIN INTEGRATION & RECRUITMENT LIFECYCLE
      ══════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-28 bg-gradient-to-b from-[#F8F7FF] to-white relative overflow-hidden">
        {/* Background mesh details */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-80 h-80 rounded-full bg-blue-500/5 blur-[120px]" />
          <div className="absolute top-1/4 right-0 w-80 h-80 rounded-full bg-violet-500/5 blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-widest mb-5 border border-blue-100 shadow-sm">
              <Briefcase size={12} className="text-blue-600 animate-pulse" /> LinkedIn Partner Network
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-5">
              Connect with Top Talent on LinkedIn
            </h2>
            <p className="text-slate-500 text-base sm:text-lg font-semibold max-w-2xl mx-auto">
              Experience a seamless, AI-powered workflow from job creation to final offer with our native social sourcing engine.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 items-stretch mb-16">
            {/* LinkedIn Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="lg:col-span-1 bg-[#0A192F] rounded-3xl p-8 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:shadow-blue-900/10 hover:-translate-y-1 transition-all duration-500">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/15 transition-colors" />
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 bg-[#0077B5] rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                    in
                  </div>
                  <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/25 rounded-full text-blue-300 text-[9px] font-black uppercase tracking-wider">
                    Official Sync
                  </span>
                </div>
                <h3 className="text-2xl font-black mb-3 text-white tracking-tight">Direct Talent Sourcing</h3>
                <p className="text-blue-100/70 text-sm leading-relaxed mb-6 font-medium">
                  Auto-publish open jobs, import applicant profiles, and message passive talent directly through unified chat threads.
                </p>

                {/* Integration Details List */}
                <div className="space-y-3 bg-white/5 border border-white/8 rounded-2xl p-4.5">
                  <div className="flex items-center justify-between text-xs border-b border-white/8 pb-2.5">
                    <span className="text-blue-200/60 font-bold">LinkedIn Easy Apply</span>
                    <span className="text-emerald-400 font-black flex items-center gap-1">
                      <CheckCircle2 size={10} /> Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-b border-white/8 pb-2.5">
                    <span className="text-blue-200/60 font-bold">Profile Auto-Import</span>
                    <span className="text-emerald-400 font-black flex items-center gap-1">
                      <CheckCircle2 size={10} /> Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-200/60 font-bold">Hiring Manager Chat</span>
                    <span className="text-emerald-400 font-black flex items-center gap-1">
                      <CheckCircle2 size={10} /> Active
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex items-center gap-2 text-blue-400 text-xs font-black group-hover:text-blue-300 transition-colors">
                Explore Talent Solutions <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>

            {/* Lifecycle Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-xl flex flex-col justify-between hover:shadow-2xl hover:border-violet-100 hover:-translate-y-1 transition-all duration-500">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-violet-50 border border-violet-100 rounded-full text-[#6345ED] text-[10px] font-black uppercase tracking-wider mb-6">
                  <Sparkles size={11} className="text-[#6345ED]" /> The Complete Recruitment Lifecycle
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">AI-Powered End-to-End Recruitment</h3>
                <p className="text-slate-500 text-sm font-semibold leading-relaxed mb-8">
                  Experience a seamless, AI-powered workflow from job creation to final offer. Track candidates, collaborate with teams, and onboarding instantly.
                </p>

                {/* Steps Timeline Grid */}
                <div className="grid sm:grid-cols-3 gap-6">
                  {[
                    { icon: Sparkles, color: 'text-violet-600 bg-violet-50', t: '1. AI Job Posting', d: 'Draft compliant job descriptions in seconds and broadcast across corporate channels.' },
                    { icon: UserCheck, color: 'text-blue-600 bg-blue-50', t: '2. Smart Screen', d: 'Auto-evaluate resumes, parse applicant skills, and shortlist matches instantly.' },
                    { icon: CreditCard, color: 'text-emerald-600 bg-emerald-50', t: '3. Digital Offer', d: 'Draft templates dynamically, obtain approvals, and send signed agreements.' }
                  ].map((step, idx) => (
                    <div key={idx} className="space-y-3 group/item">
                      <div className={`w-10 h-10 rounded-xl ${step.color} flex items-center justify-center shadow-sm group-hover/item:scale-110 transition-transform`}>
                        <step.icon size={16} />
                      </div>
                      <p className="font-black text-sm text-slate-900">{step.t}</p>
                      <p className="text-slate-500 text-xs leading-relaxed font-semibold">{step.d}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Works seamlessly with native Hirevant ATS</p>
                <Link to={dashRoute} className="text-xs font-black text-[#6345ED] flex items-center gap-1 hover:text-[#5235D6] transition-all group">
                  See Recruitment Lifecycle <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest mb-5">
              <Zap size={13} /> Quick Setup
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">
              Up and running in<br className="hidden sm:block" /> under 30 minutes
            </h2>
          </motion.div>

          <div className="relative grid sm:grid-cols-3 gap-8 sm:gap-6">
            <div className="absolute top-10 left-[17%] right-[17%] h-px bg-gradient-to-r from-violet-200 via-violet-400 to-violet-200 hidden sm:block" />
            {steps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                className="relative text-center">
                <div className="relative inline-flex w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-100/80 z-10">
                  <step.icon size={26} className="text-[#6345ED]" />
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#6345ED] rounded-full flex items-center justify-center text-white text-[10px] font-black border-2 border-white">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* ══════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest mb-5">
              <CreditCard size={13} /> Simple Pricing
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">Transparent pricing, no surprises.</h2>
            <div className="inline-flex items-center bg-slate-100 rounded-2xl p-1.5 gap-1">
              <button onClick={() => setIsAnnual(false)}
                className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${!isAnnual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                Monthly
              </button>
              <button onClick={() => setIsAnnual(true)}
                className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${isAnnual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                Annual
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full">Save 20%</span>
              </button>
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-center">
            {pricingPlans.map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`relative rounded-3xl p-7 sm:p-8 flex flex-col ${i === 1 ? 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-2xl shadow-violet-300/25 lg:scale-105' : 'bg-white border border-slate-100 shadow-sm'}`}>
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${i === 1 ? 'bg-white text-violet-700' : 'bg-violet-100 text-violet-700'}`}>
                    {plan.badge}
                  </div>
                )}
                <h3 className={`text-lg font-black mb-1 ${i === 1 ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                <p className={`text-sm font-medium mb-6 ${i === 1 ? 'text-violet-200' : 'text-slate-500'}`}>{plan.desc}</p>
                <div className="mb-7">
                  {plan.monthlyPrice ? (
                    <>
                      <span className={`text-4xl font-black ${i === 1 ? 'text-white' : 'text-slate-900'}`}>
                        ₹{(isAnnual ? plan.annualPrice : plan.monthlyPrice).toLocaleString()}
                      </span>
                      <span className={`text-sm ml-1 ${i === 1 ? 'text-violet-200' : 'text-slate-500'}`}>/mo per entity</span>
                    </>
                  ) : (
                    <span className={`text-4xl font-black ${i === 1 ? 'text-white' : 'text-slate-900'}`}>Custom</span>
                  )}
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm font-medium">
                      <CheckCircle2 size={14} className={`shrink-0 ${i === 1 ? 'text-violet-300' : 'text-[#6345ED]'}`} />
                      <span className={i === 1 ? 'text-violet-100' : 'text-slate-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to={dashRoute}
                  className={`py-3.5 rounded-2xl text-center text-sm font-black transition-all hover:-translate-y-0.5 ${i === 1 ? 'bg-white text-violet-700 hover:bg-violet-50' : 'bg-[#6345ED] text-white hover:bg-[#5235D6] shadow-md shadow-violet-200'}`}>
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA SECTION
      ══════════════════════════════════════════════════ */}
      <section className="py-24 bg-gradient-to-br from-[#0A0515] via-[#140a2e] to-[#1a0040] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-violet-600/20 blur-[100px]" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-violet-300 mb-8">
              <Sparkles size={12} className="text-amber-400" />
              14-day free trial · No credit card required
            </div>
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.06] mb-6">
              Ready to transform<br />your HR operations?
            </h2>
            <p className="text-slate-400 text-lg font-medium mb-10 max-w-2xl mx-auto">
              Join 5,000+ enterprises using Hirevant to automate their workforce management.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to={dashRoute}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-[0_12px_30px_rgba(99,69,237,0.5)] hover:shadow-[0_16px_40px_rgba(99,69,237,0.7)] transition-all hover:-translate-y-0.5 text-base">
                Enter Portal <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to={dashRoute}
                className="inline-flex items-center gap-2 px-7 py-4 bg-white/8 hover:bg-white/12 border border-white/15 text-white font-bold rounded-2xl backdrop-blur-md transition-all text-base">
                Sign In to Dashboard <ArrowUpRight size={15} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CUSTOMER SUPPORT
      ══════════════════════════════════════════════════ */}
      <section id="support" className="py-28 bg-[#07030E] relative overflow-hidden">
        {/* Rich layered background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-violet-700/10 blur-[140px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-fuchsia-600/6 blur-[100px]" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(99,69,237,0.055) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>

            {/* === Section Header === */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-black text-emerald-400 mb-7 tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                24 / 7 Enterprise Support Desk
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.06] mb-5">
                World-class support,<br />
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">always on.</span>
              </h2>
              <p className="text-slate-400 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
                Our dedicated enterprise support team responds in under 2 hours. Get expert help with onboarding, technical issues, and custom integrations.
              </p>

              {/* SLA Trust Row */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                {[
                  { icon: Clock, label: '< 2hr', sub: 'First Response' },
                  { icon: ShieldCheck, label: '99.9%', sub: 'Uptime SLA' },
                  { icon: Globe, label: '150+', sub: 'Countries Served' },
                  { icon: Users, label: '5,000+', sub: 'Enterprises Trusted' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/8 backdrop-blur-sm">
                    <s.icon size={16} className="text-violet-400 shrink-0" />
                    <div className="text-left">
                      <p className="text-white text-sm font-black leading-none">{s.label}</p>
                      <p className="text-slate-500 text-[10px] font-semibold mt-0.5">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* === Support Channels (top) === */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              {[
                {
                  icon: MessageSquare,
                  label: 'Live Chat',
                  desc: 'Instant support for urgent issues',
                  badge: 'Online Now',
                  badgeColor: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
                  dotColor: 'bg-emerald-500',
                  color: 'text-violet-300',
                  border: 'border-violet-500/20 hover:border-violet-400/40',
                  bg: 'bg-violet-500/8 hover:bg-violet-500/12',
                  iconBg: 'bg-violet-500/15'
                },
                {
                  icon: Globe,
                  label: 'Help Center',
                  desc: '500+ guides and video walkthroughs',
                  badge: '500+ Articles',
                  badgeColor: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
                  dotColor: 'bg-sky-500',
                  color: 'text-sky-300',
                  border: 'border-sky-500/20 hover:border-sky-400/40',
                  bg: 'bg-sky-500/8 hover:bg-sky-500/12',
                  iconBg: 'bg-sky-500/15'
                },
                {
                  icon: Users,
                  label: 'Dedicated CSM',
                  desc: 'Named customer success manager',
                  badge: 'Enterprise Only',
                  badgeColor: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
                  dotColor: 'bg-amber-500',
                  color: 'text-emerald-300',
                  border: 'border-emerald-500/20 hover:border-emerald-400/40',
                  bg: 'bg-emerald-500/8 hover:bg-emerald-500/12',
                  iconBg: 'bg-emerald-500/15'
                },
              ].map((ch, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ duration: 0.22 }}
                  className={`p-6 rounded-[1.75rem] border ${ch.border} ${ch.bg} backdrop-blur-sm flex flex-col gap-4 transition-all cursor-default`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 rounded-2xl ${ch.iconBg} flex items-center justify-center shrink-0`}>
                      <ch.icon size={20} className={ch.color} />
                    </div>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest flex items-center gap-1.5 ${ch.badgeColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ch.dotColor} animate-pulse`} />
                      {ch.badge}
                    </span>
                  </div>
                  <div>
                    <p className={`text-sm font-black ${ch.color} mb-1`}>{ch.label}</p>
                    <p className="text-slate-500 text-xs font-semibold leading-relaxed">{ch.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* === Contact Form === */}
            <SupportForm />

          </motion.div>
        </div>
      </section>

      <footer className="bg-[#05020c] pt-20 pb-10 border-t border-white/5 relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle at 50% -20%, rgba(99, 69, 237, 0.12) 0%, transparent 65%)' }}>
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40 z-0" />

        {/* Top section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            <div className="sm:col-span-2 space-y-6">
              <Logo size="md" theme="dark" />
              <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm">
                The enterprise HRMS platform trusted by 5,000+ companies to manage their workforce intelligently — from hire to retire.
              </p>
              
              {/* Premium Trust Badges */}
              <div className="flex items-center gap-3">
                {['SOC2 Type II', 'ISO 27001', 'GDPR Compliant'].map(badge => (
                  <span key={badge} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-400 text-[9px] font-black uppercase tracking-widest hover:border-violet-500/40 hover:text-white transition-all cursor-default shadow-sm">
                    {badge}
                  </span>
                ))}
              </div>

              {/* Enterprise Support Ticket Box */}
              <div className="max-w-sm p-5 rounded-3xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 hover:border-white/15 transition-all shadow-lg flex flex-col gap-3.5 group">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Support Operations Desk</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                </div>
                <div>
                  <p className="text-white text-xs font-semibold flex items-center gap-2 group-hover:text-emerald-300 transition-colors">
                    <HeartHandshake size={14} className="text-emerald-400 shrink-0" />
                    support@hirevant.ai
                  </p>
                  <p className="text-slate-500 text-[10px] mt-1 font-medium">Global SLAs: Average response under <span className="font-extrabold text-emerald-400">2 hours</span></p>
                </div>
              </div>
            </div>

            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Integrations', 'Changelog', 'Roadmap'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Partners', 'Press'] },
              { title: 'Support', links: ['Help Center', 'Contact Us', 'Status Page', 'Privacy Policy', 'Terms'] },
            ].map(col => (
              <div key={col.title} className="space-y-4">
                <p className="text-white text-[10px] font-black uppercase tracking-widest border-b border-white/5 pb-2 w-max pr-6">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map(link => (
                    <li key={link}>
                      <a
                        href={link === 'Contact Us' ? '#support' : '#'}
                        className={`text-sm font-medium transition-all duration-300 hover:translate-x-1 block ${link === 'Contact Us'
                          ? 'text-emerald-500 hover:text-emerald-400'
                          : 'text-slate-500 hover:text-slate-200'
                          }`}
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-slate-500 text-xs font-medium">© 2026 Hirevant Technologies Pvt. Ltd. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#support" className="text-slate-500 hover:text-emerald-400 text-xs font-semibold transition-colors flex items-center gap-1.5">
                <HeartHandshake size={12} className="text-emerald-400" /> Contact Support
              </a>
              <Link to={dashRoute} className="text-slate-500 hover:text-violet-400 text-xs font-semibold transition-colors flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-violet-400" /> Sign In
              </Link>
              <p className="text-slate-650 text-xs font-medium">Made with ♥ for HR professionals</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
