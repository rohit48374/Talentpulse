import React from 'react';
import { Link } from 'react-router-dom';
import { FaTwitter as Twitter, FaLinkedin as Linkedin, FaGithub as Github } from 'react-icons/fa';

export const Footer = () => {
  return (
    <footer className="mt-12 py-8 border-t border-surface-200">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">H</span>
          </div>
          <span className="text-surface-600 font-medium">© 2026 Hirevant Inc.</span>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-surface-500">
          <Link to="#" className="hover:text-primary-600 transition-colors">Privacy Policy</Link>
          <Link to="#" className="hover:text-primary-600 transition-colors">Terms of Service</Link>
          <Link to="#" className="hover:text-primary-600 transition-colors">Support</Link>
        </div>

        <div className="flex items-center gap-4 text-surface-400">
          <a href="#" className="hover:text-primary-600 transition-colors"><Twitter size={18} /></a>
          <a href="#" className="hover:text-primary-600 transition-colors"><Linkedin size={18} /></a>
          <a href="#" className="hover:text-primary-600 transition-colors"><Github size={18} /></a>
        </div>
      </div>
    </footer>
  );
};
