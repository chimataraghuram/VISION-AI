import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, FileText,
  Award, AlertOctagon, BarChart2, Calendar, ArrowUpRight
} from 'lucide-react';
import ScoreBadge from '../components/ScoreBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { getDashboard } from '../services/api';
import { Link } from 'react-router-dom';

// Custom tooltip styling matching Linear theme
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-[#0b1220]/95 backdrop-blur-md border border-surface-200 rounded-xl shadow-xl p-3.5 text-xs">
        <p className="font-bold text-surface-800 mb-1">{label}</p>
        <div className="h-px bg-surface-100 my-1.5" />
        <p className="text-primary-600 font-extrabold text-sm">{payload[0].value}/100</p>
        <p className="text-surface-400 mt-1 font-medium">{payload[0].payload?.standard}</p>
      </div>
    );
  }
  return null;
}

function StatCard({ label, value, icon: Icon, color, subtitle, delay }) {
  // Count up animation state
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    const isNum = !isNaN(parseFloat(value)) && isFinite(value);
    if (!isNum) return;

    let start = 0;
    const end = parseFloat(value);
    if (start === end) return;

    const timer = setInterval(() => {
      start += Math.ceil(end / 20);
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setDisplayVal(start);
    }, 30);

    return () => clearInterval(timer);
  }, [value]);

  const valToShow = isNaN(parseFloat(value)) ? value : displayVal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, delay }}
      whileHover={{ y: -4, shadow: 'lg' }}
      className="card flex flex-col justify-between min-h-[140px] relative overflow-hidden"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">{label}</p>
          <h3 className="text-3xl font-extrabold text-surface-900 dark:text-white mt-2 tracking-tight tabular-nums">
            {valToShow}
          </h3>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-surface-50 border border-surface-100 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1 text-[10px] font-medium text-surface-400">
        <Calendar className="w-3.5 h-3.5" />
        <span>{subtitle}</span>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getDashboard();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Loading statistics..." />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-4 py-16 space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-surface-900 dark:text-white leading-none">
          Compliance Dashboard
        </h1>
        <p className="text-surface-500 text-sm mt-2">
          Overview of all compliance assessments and performance trends.
        </p>
      </div>

      {error && <ErrorAlert message={error} type="error" />}

      {/* Empty State */}
      {data?.total_reports === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card text-center py-20 flex flex-col items-center gap-4 max-w-md mx-auto"
        >
          <BarChart2 className="w-12 h-12 text-surface-300" />
          <div>
            <h3 className="text-lg font-bold text-surface-800">No reports generated yet</h3>
            <p className="text-sm text-surface-400 mt-1 px-6">
              Create an inspection or run one of our demo templates to view analytics.
            </p>
          </div>
          <Link to="/" className="btn-primary mt-2">
            Run AI Inspection
          </Link>
        </motion.div>
      )}

      {data && data.total_reports > 0 && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Average Score"
              value={data.average_score}
              icon={Activity}
              color="text-primary-600"
              subtitle="Overall platform compliance"
              delay={0.05}
            />
            <StatCard
              label="Highest Score"
              value={data.highest_score}
              icon={Award}
              color="text-emerald-600"
              subtitle="Peak compliance assessment"
              delay={0.1}
            />
            <StatCard
              label="Lowest Score"
              value={data.lowest_score}
              icon={AlertOctagon}
              color="text-red-500"
              subtitle="Attention areas"
              delay={0.15}
            />
            <StatCard
              label="Total Reports"
              value={data.total_reports}
              icon={FileText}
              color="text-violet-600"
              subtitle="Reports archived in DB"
              delay={0.2}
            />
          </div>

          {/* Trend Chart & Recent list split layout */}
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            {/* Trend Chart */}
            {data.trend && data.trend.length > 1 && (
              <div className="card lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-bold text-surface-800 uppercase tracking-wider">Compliance Trend</h2>
                    <p className="text-xs text-surface-400 mt-0.5">Chronological record of scores</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    {data.trend[data.trend.length - 1].score > data.trend[0].score ? (
                      <span className="text-emerald-600 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Improving</span>
                    ) : (
                      <span className="text-red-500 flex items-center gap-1"><TrendingDown className="w-4 h-4" /> Declining</span>
                    )}
                  </div>
                </div>

                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trend} margin={{ top: 5, right: 10, bottom: 5, left: -25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={70} stroke="#16a34a" strokeDasharray="3 3" />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ fill: '#2563eb', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#1d4ed8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recent Reports List */}
            <div className="card space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold text-surface-800 uppercase tracking-wider">Recent Reports</h2>
                  <p className="text-xs text-surface-400 mt-0.5">Latest audits completed</p>
                </div>
                <Link to="/history" className="text-xs text-primary-600 hover:text-primary-700 font-bold flex items-center gap-0.5">
                  View all <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3.5">
                {data.recent_reports.map((r, idx) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex justify-between items-center p-3 bg-surface-50/50 border border-surface-200/50 rounded-xl hover:bg-surface-50 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-surface-950 truncate max-w-[130px]">{r.standard}</p>
                      <span className="text-[10px] text-surface-400 font-medium">
                        {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <ScoreBadge score={r.score} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
