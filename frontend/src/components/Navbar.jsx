import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Eye, Mic, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to Dark Mode as requested

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
        animate={{
          height: scrolled ? 64 : 90,
          paddingTop: scrolled ? 8 : 24,
          paddingBottom: scrolled ? 8 : 24,
          backgroundColor: scrolled ? 'rgba(5, 8, 22, 0.95)' : 'rgba(5, 8, 22, 0.75)'
        }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        className="w-full max-w-5xl rounded-[28px] border border-white/[0.08] backdrop-blur-xl shadow-[0_0_30px_rgba(37,99,235,0.08)] flex items-center justify-between px-6"
      >
        {/* LEFT: Logo Shield */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-black text-white tracking-tight">
            Vision<span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">AI</span>
          </span>
        </Link>

        {/* CENTER: Capsule Navigation */}
        <div className="flex items-center bg-white/[0.04] border border-white/[0.06] p-1 rounded-2xl">
          {[
            { to: '/', label: 'Inspection', icon: Eye },
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
                    className="absolute inset-0 bg-white/[0.06] border border-white/[0.08] rounded-xl"
                    transition={{ type: 'spring', stiffness: 150, damping: 18 }}
                  />
                )}
                
                <span className={`relative z-10 flex items-center gap-1.5 transition-colors duration-150 ${
                  isActive ? 'text-blue-400' : 'text-white/60 hover:text-white'
                }`}>
                  <Icon className="w-4 h-4" />
                  
                  {/* Label disappears when scrolled, only icons remain */}
                  <AnimatePresence>
                    {!scrolled && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
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

        {/* RIGHT: iOS Switch Dark Mode Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sun className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white/30' : 'text-amber-400'}`} />
            
            {/* iOS Switch */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-10 h-6 bg-white/[0.08] rounded-full p-0.5 border border-white/[0.08] relative flex items-center cursor-pointer focus:outline-none"
            >
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="w-4.5 h-4.5 bg-blue-500 rounded-full shadow-md flex items-center justify-center"
                style={{
                  x: isDarkMode ? 16 : 0
                }}
              >
                {isDarkMode ? (
                  <Moon className="w-2.5 h-2.5 text-white" />
                ) : (
                  <Sun className="w-2.5 h-2.5 text-white" />
                )}
              </motion.div>
            </button>
            
            <Moon className={`w-3.5 h-3.5 ${isDarkMode ? 'text-blue-400' : 'text-white/30'}`} />
          </div>
        </div>
      </motion.nav>
    </div>
  );
}
