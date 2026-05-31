import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../contexts/AuthContext';

export const PublicNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-surface-900/80 backdrop-blur-md shadow-lg border-b border-white/10 py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        
        {/* Logo - redirects to / */}
        <Link to="/" className="flex items-center gap-2 group cursor-pointer">
          <Logo size="md" theme="dark" />
        </Link>

        {/* Desktop NavLinks */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-surface-200 hover:text-white font-medium transition-colors drop-shadow-sm">Features</a>
          <a href="#pricing" className="text-surface-200 hover:text-white font-medium transition-colors drop-shadow-sm">Pricing</a>
          <a href="#testimonials" className="text-surface-200 hover:text-white font-medium transition-colors drop-shadow-sm">Testimonials</a>
          <div className="h-6 w-px bg-white/20"></div>
          {user ? (
            <Link to="/dashboard">
              <button className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 rounded-full font-bold transition-all shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:scale-105 flex items-center gap-2">
                Go to Dashboard <span className="text-[10px] font-black bg-white/20 px-1.5 py-0.5 rounded uppercase tracking-wider">{user.role}</span>
              </button>
            </Link>
          ) : (
            <Link to="/login">
              <button className="px-6 py-2.5 bg-white text-surface-900 hover:bg-primary-50 rounded-full font-bold transition-all shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:scale-105">
                Sign In
              </button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white drop-shadow-md" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-surface-900/95 backdrop-blur-xl border-b border-white/10 p-6 flex flex-col gap-4 shadow-2xl">
          <a href="#features" className="text-white font-medium text-lg p-2 hover:bg-white/5 rounded-lg" onClick={() => setIsMenuOpen(false)}>Features</a>
          <a href="#pricing" className="text-white font-medium text-lg p-2 hover:bg-white/5 rounded-lg" onClick={() => setIsMenuOpen(false)}>Pricing</a>
          {user ? (
            <Link to="/dashboard" className="text-white font-bold text-lg p-2 hover:bg-white/5 rounded-lg" onClick={() => setIsMenuOpen(false)}>
              Go to Dashboard ({user.role})
            </Link>
          ) : (
            <Link to="/login" onClick={() => setIsMenuOpen(false)}>
              <button className="w-full mt-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                Sign In to Portal
              </button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

