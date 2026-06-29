import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const TECH_STACK = [
  { name: 'React', icon: '⚛' },
  { name: 'FastAPI', icon: '⚡' },
  { name: 'Gemini AI', icon: '🤖' },
  { name: 'Tailwind CSS', icon: '🎨' },
  { name: 'SQLite', icon: '🗄' },
  { name: 'Web Speech API', icon: '🎤' },
  { name: 'Python', icon: '🐍' }
];

const FEATURES = [
  'AI Image Analysis',
  'Compliance Scoring',
  'AI Recommendations',
  'Voice Interview',
  'Dashboard Analytics',
  'Inspection History'
];

const LINKS = [
  { name: 'Inspection', path: '/' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Interview', path: '/interview' },
  { name: 'History', path: '/history' }
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut', staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <footer className="w-full mt-auto relative z-10">
      {/* Subtle blue glow border line at the top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
      
      <div className="bg-[#070B18] rounded-t-[2.5rem] pt-20 pb-8 px-6 sm:px-12 relative overflow-hidden">
        {/* Subtle background glow effect */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-7xl mx-auto relative z-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            {/* COLUMN 1: Brand & Description */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <ShieldCheck className="text-white w-6 h-6" />
                </div>
                <span className="text-2xl font-black tracking-tight text-white">VisionAI</span>
              </div>
              <p className="text-sm font-bold text-blue-400 uppercase tracking-widest">
                AI-Powered Compliance Auditor
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">
                VisionAI is an intelligent compliance auditing platform that analyzes room environments using AI Vision, detects compliance gaps, generates actionable recommendations, and evaluates user knowledge through interactive AI interviews.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300">
                  Version v1.0
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  AI Ready
                </div>
              </div>
            </motion.div>

            {/* COLUMN 2: Quick Navigation */}
            <motion.div variants={itemVariants} className="space-y-6 lg:pl-8">
              <h3 className="text-white font-bold text-lg">Quick Navigation</h3>
              <ul className="space-y-4">
                {LINKS.map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="group flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors duration-300">
                      <span className="w-0 overflow-hidden group-hover:w-4 transition-all duration-300 ease-out flex items-center text-blue-400">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                      <span className="group-hover:translate-x-1 transition-transform duration-300">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* COLUMN 3: Technology Stack */}
            <motion.div variants={itemVariants} className="space-y-6">
              <h3 className="text-white font-bold text-lg">Technology Stack</h3>
              <div className="flex flex-wrap gap-2.5">
                {TECH_STACK.map((tech) => (
                  <div 
                    key={tech.name}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-default"
                  >
                    <span>{tech.icon}</span>
                    <span>{tech.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* COLUMN 4: Project Features */}
            <motion.div variants={itemVariants} className="space-y-6">
              <h3 className="text-white font-bold text-lg">Project Features</h3>
              <ul className="space-y-3.5">
                {FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm font-medium text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>

          </div>

          {/* BOTTOM BAR */}
          <motion.div 
            variants={itemVariants}
            className="pt-8 mt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-500"
          >
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center text-center md:text-left">
              <span>© {currentYear} VisionAI</span>
              <span className="hidden md:inline text-white/20">•</span>
              <span>Built for AI Compliance Auditing</span>
            </div>
            
            <div className="text-blue-400/80 tracking-wide">
              "Powered by Gemini AI & FastAPI"
            </div>

            <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center text-center md:text-right">
              <span>Version 1.0</span>
              <span className="hidden md:inline text-white/20">•</span>
              <span>Made with ❤️ using React & Python</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}
