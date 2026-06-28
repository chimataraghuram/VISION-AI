import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Eye, Mic, Sun, Moon, LayoutDashboard } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function Navbar() {
  const { pathname } = useLocation();
  const { isDarkMode, toggleTheme } = useApp();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="w-full flex justify-center sticky top-4 z-50 px-4">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          height: scrolled ? 60 : 80,
          backgroundColor: scrolled ? 'rgba(11, 18, 32, 0.92)' : 'rgba(11, 18, 32, 0.75)',
          boxShadow: scrolled 
            ? '0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 40px 0 rgba(37, 99, 235, 0.12)' 
            : '0 4px 20px -5px rgba(0, 0, 0, 0.3), 0 0 20px 0 rgba(37, 99, 235, 0.05)'
        }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        className="w-[85%] max-w-5xl rounded-[28px] border border-white/[0.08] backdrop-blur-[24px] flex items-center justify-between px-6"
      >
        {/* LEFT: Logo Shield */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <motion.div 
            animate={{ scale: scrolled ? 0.9 : 1 }}
            className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200"
          >
            <ShieldCheck className="w-5 h-5 text-white" />
          </motion.div>
          <motion.span 
            animate={{ scale: scrolled ? 0.95 : 1 }}
            className="text-lg font-black text-white tracking-tight origin-left"
          >
            Vision<span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">AI</span>
          </motion.span>
        </Link>

        {/* CENTER: Capsule Navigation */}
        <div className="flex items-center bg-white dark:bg-[#0b1220]/[0.04] border border-white/[0.06] p-1 rounded-2xl">
          {[
            { to: '/', label: 'Inspection', icon: Eye },
            { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/interview', label: 'Interview', icon: Mic }
          ].map((item) => {
            const isActive = pathname === item.to;
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                className="relative px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeDarkNav"
                    className="absolute inset-0 bg-white dark:bg-[#0b1220]/[0.06] border border-white/[0.08] rounded-xl"
                    transition={{ type: 'spring', stiffness: 150, damping: 18 }}
                  />
                )}
                
                <span className={`relative z-10 flex items-center gap-1.5 transition-colors duration-150 ${
                  isActive ? 'text-blue-400' : 'text-white/60 hover:text-white'
                }`}>
                  <Icon className="w-4 h-4" />
                  
                  {/* Label disappears when scrolled, only icons remain */}
                  <AnimatePresence initial={false}>
                    {!scrolled && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                
                {/* Active Underline Glow */}
                {isActive && (
                  <motion.div
                    layoutId="activeUnderline"
                    className="absolute bottom-1 left-4 right-4 h-[2px] bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"
                    transition={{ type: 'spring', stiffness: 150, damping: 18 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* RIGHT: Icon-only Dark Mode Toggle */}
        <div className="flex items-center">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 cursor-pointer focus:outline-none hover:bg-white/10 transition-colors"
            title="Toggle Theme"
          >
            {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
      </motion.nav>
    </div>
  );
}
