import { motion } from 'framer-motion';

const DEMO_LIST = [
  {
    name: 'Office Space',
    file: 'office-clean-1.jpg.jpg',
    standard: 'Office Safety',
    desc: 'Modern workplace layout assessment',
    icon: '💼'
  },
  {
    name: 'Commercial Kitchen',
    file: 'commercial-kitchen.jpg.jpg',
    standard: 'Kitchen Hygiene',
    desc: 'Restaurant and food preparation inspection',
    icon: '🍽️'
  },
  {
    name: 'Research Laboratory',
    file: 'research-lab.jpg.jpg',
    standard: 'Laboratory Safety',
    desc: 'Chemical and equipment regulatory check',
    icon: '🔬'
  },
  {
    name: 'Warehouse Storage',
    file: 'warehouse-1.jpg.jpg',
    standard: 'Warehouse Safety',
    desc: 'Safety aisles, fire safety and rack storage',
    icon: '🏭'
  },
  {
    name: 'Hostel Dorm',
    file: 'hostel-room-1.jpg.jpg',
    standard: 'Hostel Safety',
    desc: 'Shared living quarters compliance',
    icon: '🏠'
  }
];

export default function DemoImages({ onLoadDemo }) {
  return (
    <div className="w-full">
      <div className="flex flex-col items-center mb-6">
        <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">Try Demo Images</h3>
        <p className="text-xs text-surface-500 mt-1">Select one of our preset templates to instantly test the auditor</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {DEMO_LIST.map((demo, idx) => (
          <motion.button
            key={idx}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onLoadDemo(demo.file, demo.standard)}
            className="flex flex-col items-center gap-3 p-4 bg-white dark:bg-[#0b1220] border border-surface-200/80 rounded-2xl shadow-sm hover:shadow-md hover:border-primary-300 transition-colors text-center w-full"
          >
            <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-2xl">
              {demo.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-surface-900 dark:text-white leading-tight truncate">{demo.name}</p>
              <p className="text-[10px] font-medium text-primary-600 mt-1 bg-primary-50 px-2 py-0.5 rounded-full inline-block">
                {demo.standard}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
