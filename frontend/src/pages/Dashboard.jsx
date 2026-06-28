import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, FileText,
  Award, AlertOctagon, BarChart2, Calendar, ArrowUpRight,
  Mic, Clock, CheckCircle, Zap, ShieldCheck, Camera,
  Image as ImageIcon, Sparkles
} from 'lucide-react';
import ScoreBadge from '../components/ScoreBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { getDashboard, getHistory } from '../services/api';

// --- Recharts Tooltip ---
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0b1220]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-xl p-3.5 text-xs">
        <p className="font-bold text-white mb-1">{label}</p>
        <div className="h-px bg-white/10 my-1.5" />
        <p className="text-blue-400 font-extrabold text-sm">{payload[0].value}/100</p>
        <p className="text-white/60 mt-1 font-medium">{payload[0].payload?.standard}</p>
      </div>
    );
  }
  return null;
}

// --- Animated Count Up ---
function StatCard({ label, value, icon: Icon, color, subtitle, delay, postfix = "" }) {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    const isNum = !isNaN(parseFloat(value)) && isFinite(value);
    if (!isNum) return;

    let start = 0;
    const end = parseFloat(value);
    if (start === end) {
      setDisplayVal(end);
      return;
    }

    const timer = setInterval(() => {
      start += Math.max(1, Math.ceil(end / 20));
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
      className="card flex flex-col justify-between min-h-[140px] relative overflow-hidden bg-white/5 border border-white/10 rounded-[24px] p-5"
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl" />
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{label}</p>
          <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight tabular-nums">
            {valToShow}{postfix}
          </h3>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/10 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-[10px] font-medium text-white/40 relative z-10">
        <Activity className="w-3.5 h-3.5" />
        <span>{subtitle}</span>
      </div>
    </motion.div>
  );
}

// --- ProgressBar for Interview Stats ---
function ProgressBar({ label, value, max = 10, colorClass = "bg-blue-500" }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-white/70">{label}</span>
        <span className="text-white">{value.toFixed(1)} / {max}</span>
      </div>
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className={`h-full rounded-full ${colorClass}`}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Local Storage Interview Stats
  const [interviewStats, setInterviewStats] = useState({
    total: 0,
    avg: 0,
    highest: 0,
    lowest: 0,
    questionsAnswered: 0
  });

  useEffect(() => {
    // Load interview stats from local storage
    try {
      const stored = localStorage.getItem('visionai_interviews');
      if (stored) {
        const interviews = JSON.parse(stored);
        if (interviews && interviews.length > 0) {
          const scores = interviews.map(i => i.overall_score);
          const totalQ = interviews.reduce((acc, curr) => acc + (curr.answers ? curr.answers.length : 5), 0);
          setInterviewStats({
            total: interviews.length,
            avg: scores.reduce((a, b) => a + b, 0) / scores.length,
            highest: Math.max(...scores),
            lowest: Math.min(...scores),
            questionsAnswered: totalQ
          });
        }
      }
    } catch(e) {
      console.warn("Failed to parse interviews from local storage", e);
    }

    const load = async () => {
      try {
        const [dashResult, histResult] = await Promise.all([
          getDashboard(),
          getHistory(1, 10) // fetch latest 10 for inspection history
        ]);
        setData(dashResult);
        setHistory(histResult.reports || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Aggregating platform analytics..." />;

  // AI Insights Generation based on derived data
  const generateInsights = () => {
    if (!data || data.total_reports === 0) return ["Run more inspections to generate AI insights."];
    const insights = [];
    
    // Insight 1: Trend improvement
    if (data.trend && data.trend.length >= 2) {
      const first = data.trend[0].score;
      const last = data.trend[data.trend.length - 1].score;
      if (last > first) {
        const diff = ((last - first) / first * 100).toFixed(0);
        insights.push(`Your compliance score has improved by ${diff}% over the recent period.`);
      } else if (last < first) {
        insights.push(`Recent compliance scores have dropped compared to earlier inspections.`);
      } else {
        insights.push(`Compliance scores are stable across recent inspections.`);
      }
    }

    // Insight 2: Standard comparison
    if (history.length > 2) {
      const standards = {};
      history.forEach(r => {
        if (!standards[r.standard]) standards[r.standard] = { total: 0, count: 0 };
        standards[r.standard].total += r.score;
        standards[r.standard].count += 1;
      });
      let highestStd = null;
      let highestAvg = -1;
      let lowestStd = null;
      let lowestAvg = 101;
      Object.keys(standards).forEach(std => {
        const avg = standards[std].total / standards[std].count;
        if (avg > highestAvg) { highestAvg = avg; highestStd = std; }
        if (avg < lowestAvg) { lowestAvg = avg; lowestStd = std; }
      });
      if (highestStd && lowestStd && highestStd !== lowestStd) {
        insights.push(`${lowestStd} inspections consistently receive lower scores than ${highestStd} inspections.`);
      }
    }

    // Insight 3: Interview correlation
    if (interviewStats.total > 0) {
      if (interviewStats.avg > 8) {
        insights.push("Excellent interview performance indicates strong internal knowledge of safety standards.");
      } else if (interviewStats.avg < 6) {
        insights.push("Low interview scores suggest additional team training is required on compliance protocols.");
      } else {
        insights.push("Interview scores demonstrate adequate knowledge, but there is room for improvement.");
      }
    }

    if (insights.length === 0) insights.push("Consistent performance detected across safety compliance standards.");

    return insights;
  };

  const aiInsights = generateInsights();

  // Helper to map standard to room type
  const getRoomType = (standard) => {
    if (!standard) return 'General Facility';
    if (standard.toLowerCase().includes('kitchen')) return 'Kitchen Facility';
    if (standard.toLowerCase().includes('office')) return 'Corporate Office';
    if (standard.toLowerCase().includes('hostel')) return 'Residential / Hostel';
    if (standard.toLowerCase().includes('warehouse')) return 'Storage Warehouse';
    if (standard.toLowerCase().includes('laboratory')) return 'Research Lab';
    return 'General Facility';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-10 space-y-10"
    >
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white leading-none">
            Analytics Dashboard
          </h1>
          <p className="text-white/50 text-sm mt-2">
            Overview of all compliance assessments, trends, and interview readiness.
          </p>
        </div>
        
        {/* SECTION 6: Quick Actions */}
        <div className="flex items-center gap-3">
          <Link to="/" className="btn-secondary rounded-xl py-2.5 px-4 text-xs font-bold border-white/10 bg-white/5 hover:bg-white/10">
            <Camera className="w-4 h-4 mr-1.5" />
            New Inspection
          </Link>
          <Link to="/interview" className="btn-primary rounded-xl py-2.5 px-4 text-xs font-bold shadow-lg shadow-blue-500/20">
            <Mic className="w-4 h-4 mr-1.5" />
            Start Interview
          </Link>
        </div>
      </div>

      {error && <ErrorAlert message={error} type="error" />}

      {/* EMPTY STATE */}
      {data?.total_reports === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 border border-white/10 rounded-[32px] text-center py-24 flex flex-col items-center gap-5 max-w-2xl mx-auto"
        >
          <div className="text-6xl mb-2">📊</div>
          <div>
            <h3 className="text-xl font-bold text-white">No inspections completed yet.</h3>
            <p className="text-sm text-white/50 mt-2 px-6 max-w-sm mx-auto">
              Complete your first inspection to unlock analytics, trends, and AI-driven insights.
            </p>
          </div>
          <Link to="/" className="btn-primary mt-4 py-4 px-8 rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:scale-105 transition-transform">
            Start Inspection
          </Link>
        </motion.div>
      )}

      {data && data.total_reports > 0 && (
        <div className="space-y-10">
          
          {/* SECTION 1: Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Inspections"
              value={data.total_reports}
              icon={FileText}
              color="text-blue-400"
              subtitle="All time reports"
              delay={0.05}
            />
            <StatCard
              label="Avg Compliance"
              value={data.average_score}
              icon={Activity}
              color="text-indigo-400"
              subtitle="Overall platform score"
              delay={0.1}
            />
            <StatCard
              label="Highest Score"
              value={data.highest_score}
              icon={Award}
              color="text-emerald-400"
              subtitle="Peak assessment"
              delay={0.15}
            />
            <StatCard
              label="Interviews Done"
              value={interviewStats.total}
              icon={Mic}
              color="text-amber-400"
              subtitle="Completed voice tests"
              delay={0.2}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6 items-start">
            
            {/* SECTION 2: Compliance Trend */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-[24px] p-6 h-[340px] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Compliance Trend</h2>
                    <p className="text-xs text-white/40 mt-0.5">Chronological record of scores</p>
                  </div>
                  {data.trend && data.trend.length > 1 && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {data.trend[data.trend.length - 1].score > data.trend[0].score ? (
                        <span className="text-emerald-400 flex items-center gap-1 bg-emerald-400/10 px-2 py-1 rounded-md"><TrendingUp className="w-3.5 h-3.5" /> Improving</span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1 bg-red-400/10 px-2 py-1 rounded-md"><TrendingDown className="w-3.5 h-3.5" /> Declining</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-grow w-full">
                  {data.trend && data.trend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.trend} margin={{ top: 5, right: 10, bottom: 5, left: -25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={70} stroke="#16a34a" strokeDasharray="3 3" opacity={0.5} />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: '#60a5fa', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30 text-sm font-medium">
                      Not enough data points for trend chart.
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 5: AI Insights */}
              <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/20 border border-blue-500/20 rounded-[24px] p-6 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-blue-400 fill-blue-400/20" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">AI Insights</h2>
                </div>
                <div className="space-y-3 relative z-10">
                  {aiInsights.map((insight, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (idx * 0.1) }}
                      className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3"
                    >
                      <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-white/80 font-medium leading-relaxed">{insight}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* SECTION 4: Interview Statistics */}
              <div className="bg-white/5 border border-white/10 rounded-[24px] p-6 space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Interview Statistics</h2>
                  <p className="text-xs text-white/40 mt-0.5">Voice compliance assessment metrics</p>
                </div>
                
                {interviewStats.total > 0 ? (
                  <div className="space-y-5">
                    <ProgressBar label="Average Score" value={interviewStats.avg} colorClass="bg-blue-500" />
                    <ProgressBar label="Highest Score" value={interviewStats.highest} colorClass="bg-emerald-500" />
                    <ProgressBar label="Lowest Score" value={interviewStats.lowest} colorClass="bg-red-500" />
                    
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-white/50">Questions Answered</span>
                      <span className="text-lg font-black text-white">{interviewStats.questionsAnswered}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
                    <Mic className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-xs text-white/40">No interviews completed yet.</p>
                  </div>
                )}
              </div>

              {/* SECTION 3: Inspection History */}
              <div className="bg-white/5 border border-white/10 rounded-[24px] p-6 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Inspection History</h2>
                    <p className="text-xs text-white/40 mt-0.5">Recent audits</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {history.length > 0 ? history.map((r, idx) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-[#050816] border border-white/5 rounded-xl p-3.5 flex flex-col gap-3 group hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {/* Placeholder Thumbnail */}
                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-white/5 to-white/10 border border-white/5 flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-6 h-6 text-white/20" />
                        </div>
                        
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-xs font-bold text-white truncate pr-2">
                              {getRoomType(r.standard)}
                            </p>
                            <ScoreBadge score={r.score} className="scale-90 origin-top-right" />
                          </div>
                          <p className="text-[10px] font-medium text-white/50 truncate flex items-center gap-1 mb-1">
                            <ShieldCheck className="w-3 h-3" /> {r.standard}
                          </p>
                          <p className="text-[10px] text-white/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 
                            {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => alert(`Navigating to report ${r.id}... (Integrate History View here)`)}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white/80 transition-colors flex items-center justify-center gap-1.5"
                      >
                        View Report <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </motion.div>
                  )) : (
                    <p className="text-xs text-white/30 text-center py-4">No recent history.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
