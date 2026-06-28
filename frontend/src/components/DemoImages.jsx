import { motion } from 'framer-motion';
import { Loader2, CheckCircle2 } from 'lucide-react';

const DEMO_LIST = [
  {
    name: 'Office Space',
    file: 'office-clean-1.jpg',
    standard: 'Office Safety',
    desc: 'Modern workplace layout assessment',
    icon: '💼'
  },
  {
    name: 'Commercial Kitchen',
    file: 'commercial-kitchen.jpg',
    standard: 'Kitchen Hygiene',
    desc: 'Restaurant and food preparation inspection',
    icon: '🍳'
  },
  {
    name: 'Research Laboratory',
    file: 'research-laboratory.jpg',
    standard: 'Laboratory Safety',
    desc: 'Chemical and equipment regulatory check',
    icon: '🧪'
  },
  {
    name: 'Warehouse Storage',
    file: 'warehouse-storage-1.jpg',
    standard: 'Warehouse Safety',
    desc: 'Safety aisles, fire safety and rack storage',
    icon: '📦'
  },
  {
    name: 'Hostel Dorm',
    file: 'hostel-room-1.jpg',
    standard: 'Hostel Safety',
    desc: 'Shared living quarters compliance',
    icon: '🏠'
  }
];

export default function DemoImages({ onLoadDemo, activeDemo, isLoading }) {
  return (
    <div className="w-full">
      <div className="flex flex-col items-center text-center mb-8 max-w-3xl mx-auto">
        <h3 className="text-sm font-bold text-surface-400 uppercase tracking-widest mb-3">Demo Images</h3>
        <p className="text-sm text-surface-500 dark:text-white/60 leading-relaxed">
          Explore VisionAI instantly using our curated demo environments. Click any image below to automatically load it, run an AI compliance inspection, and experience the complete workflow without uploading your own image.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {DEMO_LIST.map((demo, idx) => {
          const isActive = activeDemo === demo.file;

          return (
            <motion.button
              key={idx}
              whileHover={{ y: -6, scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onLoadDemo(demo.file, demo.standard)}
              className={`relative flex flex-col items-center gap-3 p-4 border rounded-2xl shadow-sm hover:shadow-lg transition-all text-center w-full overflow-hidden ${
                isActive
                  ? 'bg-primary-50/50 dark:bg-primary-500/10 border-primary-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                  : 'bg-white dark:bg-[#0b1220] border-surface-200/80 dark:border-white/10 hover:border-primary-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]'
              }`}
            >
              {isActive && (
                <div className="absolute top-2 right-2 text-primary-500">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>
              )}
              
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-colors ${
                isActive 
                  ? 'bg-primary-100 dark:bg-primary-500/20' 
                  : 'bg-primary-50 dark:bg-white/5 group-hover:bg-primary-100'
              }`}>
                {demo.icon}
              </div>
              <div className="w-full">
                <p className="text-sm font-bold text-surface-900 dark:text-white leading-tight truncate">{demo.name}</p>
                <p className={`text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded-full inline-block truncate max-w-full ${
                  isActive 
                    ? 'bg-primary-500 text-white dark:text-white' 
                    : 'text-primary-600 bg-primary-50 dark:bg-primary-500/10 dark:text-primary-400'
                }`}>
                  {demo.standard}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
