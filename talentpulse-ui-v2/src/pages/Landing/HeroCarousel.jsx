import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const slides = [
  {
    id: 1,
    title: "The Future of HR is Here.",
    subtitle: "Manage your workforce with unprecedented clarity and speed using our next-generation 3D-accelerated dashboard.",
  },
  {
    id: 2,
    title: "Unleash Your Team's Potential.",
    subtitle: "Track performance, automate onboarding, and visualize data like never before with Hirevant.",
  }
];

export const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);
  const { user } = useAuth();
  const dashRoute = user ? '/dashboard' : '/login';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-screen flex items-center justify-center overflow-hidden w-full pt-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
        >
          <div className="max-w-4xl mx-auto backdrop-blur-lg bg-white/5 border border-white/10 p-12 md:p-20 rounded-[3rem] shadow-[0_0_50px_rgba(124,58,237,0.2)]">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-primary-200 to-white mb-6 drop-shadow-2xl tracking-tight"
            >
              {slides[current].title}
            </motion.h1>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg md:text-2xl text-surface-200 mb-10 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-lg"
            >
              {slides[current].subtitle}
            </motion.p>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to={dashRoute}>
                <button className="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-full font-bold text-lg transition-all duration-300 flex items-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.6)] hover:shadow-[0_0_30px_rgba(124,58,237,0.8)] hover:-translate-y-1">
                  Enter Portal <ArrowRight size={20} />
                </button>
              </Link>
              <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full font-bold text-lg transition-all duration-300 backdrop-blur-md">
                Book a Demo
              </button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Indicators */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-12 h-1.5 rounded-full transition-all duration-500 ${current === idx ? 'bg-primary-400 w-20 shadow-[0_0_10px_rgba(124,58,237,0.8)]' : 'bg-white/30 hover:bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
};
