import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, LayoutDashboard, History, Mic, Search, Sun, Moon } from 'lucide-react';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/history',   label: 'History',   icon: History },
  { to: '/interview', label: 'Interview',  icon: Mic },
];

export default function Navbar() {
  const { pathname } = useLocation();
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
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className={`w-full max-w-7xl rounded-2xl border transition-all duration-300 flex items-center justify-between px-6 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-lg border-surface-200/80 shadow-lg py-3'
            : 'bg-white/50 backdrop-blur-md border-surface-200/40 shadow-sm py-4'
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-gradient-to-tr from-primary-600 to-primary-400 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-surface-900 tracking-tight">
            Vision<span className="text-primary-600 font-extrabold">AI</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center bg-surface-100/50 p-1.5 rounded-xl border border-surface-200/30">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const isActive = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className="relative px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-0 bg-white border border-surface-200 shadow-sm rounded-lg"
                    transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                  />
                )}
                <span className={`relative z-10 flex items-center gap-1.5 ${
                  isActive ? 'text-primary-600 font-semibold' : 'text-surface-500 hover:text-surface-800'
                }`}>
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </span>
              </Link>
            );
          })}
        </div>

        {/* Right side items */}
        <div className="flex items-center gap-3">
          {/* Mock Search report bar */}
          <div className="hidden lg:flex items-center gap-2 bg-surface-50 border border-surface-200 px-3 py-1.5 rounded-xl text-surface-400 focus-within:border-primary-400 focus-within:ring-glow transition-all">
            <Search className="w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search reports..."
              className="bg-transparent border-0 outline-none text-xs text-surface-700 w-28"
              disabled
            />
          </div>

          {/* Profile Avatar indicator */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-200 to-primary-100 border border-primary-200 flex items-center justify-center font-bold text-xs text-primary-700 shadow-sm">
            AI
          </div>
        </div>
      </motion.nav>
    </div>
  );
}
