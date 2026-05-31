import React from 'react';
import { FaTwitter as Twitter, FaLinkedin as Linkedin, FaGithub as Github } from 'react-icons/fa';
import { Logo } from '../../components/common/Logo';

export const PublicFooter = () => {
  return (
    <footer className="bg-surface-900 border-t border-surface-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Logo size="md" theme="dark" />
          </div>
          <p className="text-surface-400 max-w-sm mb-6">
            The premium, modern HR Control Management UI Kit for fast-moving enterprise teams.
          </p>
          <div className="flex gap-4">
            <button className="w-10 h-10 rounded-full bg-surface-800 flex items-center justify-center text-surface-400 hover:text-white transition-colors cursor-pointer">
              <Twitter size={20} />
            </button>
            <button className="w-10 h-10 rounded-full bg-surface-800 flex items-center justify-center text-surface-400 hover:text-white transition-colors cursor-pointer">
              <Linkedin size={20} />
            </button>
            <button className="w-10 h-10 rounded-full bg-surface-800 flex items-center justify-center text-surface-400 hover:text-white transition-colors cursor-pointer">
              <Github size={20} />
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6">Product</h4>
          <ul className="flex flex-col gap-3 text-surface-400">
            <li><a href="#features" className="hover:text-primary-400 transition-colors">Features</a></li>
            <li><a href="#pricing" className="hover:text-primary-400 transition-colors">Pricing</a></li>
            <li><a href="#integrations" className="hover:text-primary-400 transition-colors">Integrations</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6">Company</h4>
          <ul className="flex flex-col gap-3 text-surface-400">
            <li><a href="#about" className="hover:text-primary-400 transition-colors">About</a></li>
            <li><a href="#careers" className="hover:text-primary-400 transition-colors">Careers</a></li>
            <li><a href="#contact" className="hover:text-primary-400 transition-colors">Contact</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 border-t border-surface-800 pt-8 flex flex-col md:flex-row items-center justify-between text-surface-500 text-sm">
        <p>© 2026 Hirevant. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};
