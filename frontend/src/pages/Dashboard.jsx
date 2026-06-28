/**
 * Dashboard Page — VisionAI
 * Shows aggregate compliance stats + trend chart + recent reports.
 */
import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, FileText,
  Award, AlertOctagon, BarChart2
} from 'lucide-react';
import ScoreBadge from '../components/ScoreBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { getDashboard } from '../services/api';
import { Link } from 'react-router-dom';

// Custom tooltip for the trend chart
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const score = payload[0].value;
    return (
      <div className="bg-white border border-surface-200 rounded-xl shadow-card-hover p-3 text-sm">
        <p className="font-medium text-surface-700 mb-1">{label}</p>
        <p className="text-primary-600 font-bold">{score}/100</p>
        <p className="text-surface-500 text-xs">{payload[0].payload?.standard}</p>
      </div>
    );
  }
  return null;
}

function StatCard({ label, value, icon: Icon, color, subtitle }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-surface-500 mb-0.5">{label}</p>
        <p className="text-3xl font-bold text-surface-900 tabular-nums">{value}</p>
        {subtitle && <p className="text-xs text-surface-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
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

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Compliance Dashboard</h1>
        <p className="text-surface-500 text-sm mt-1">
          Overview of all compliance assessments and performance trends.
        </p>
      </div>

      {error && <ErrorAlert message={error} type="error" className="mb-6" />}

      {/* Empty state */}
      {data?.total_reports === 0 && (
        <div className="card text-center py-16">
          <BarChart2 className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-600 mb-2">No reports yet</h3>
          <p className="text-surface-400 text-sm mb-6">
            Upload and analyze a room to start building your compliance history.
          </p>
          <Link to="/" className="btn-primary mx-auto">
            Analyze a Room
          </Link>
        </div>
      )}

      {data && data.total_reports > 0 && (
        <>
          {/* ── Stats Grid ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Average Score"
              value={`${data.average_score}`}
              icon={Activity}
              color="bg-primary-600"
              subtitle="All-time average"
            />
            <StatCard
              label="Highest Score"
              value={`${data.highest_score}`}
              icon={Award}
              color="bg-emerald-600"
              subtitle="Best assessment"
            />
            <StatCard
              label="Lowest Score"
              value={`${data.lowest_score}`}
              icon={AlertOctagon}
              color="bg-red-500"
              subtitle="Needs attention"
            />
            <StatCard
              label="Total Reports"
              value={data.total_reports}
              icon={FileText}
              color="bg-violet-600"
              subtitle="Reports generated"
            />
          </div>

          {/* ── Trend Chart ── */}
          {data.trend && data.trend.length > 1 && (
            <div className="card mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-semibold text-surface-800">Score Trend</h2>
                  <p className="text-xs text-surface-400 mt-0.5">Last {data.trend.length} assessments</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-surface-500">
                  {data.trend.length > 1 &&
                    data.trend[data.trend.length - 1].score > data.trend[0].score ? (
                    <><TrendingUp className="w-4 h-4 text-emerald-500" /> Improving</>
                  ) : (
                    <><TrendingDown className="w-4 h-4 text-red-400" /> Declining</>
                  )}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 4"
                    label={{ value: 'Pass', fill: '#10b981', fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#2563eb' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Recent Reports ── */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-surface-800">Recent Reports</h2>
              <Link to="/history" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                View all →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100">
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-surface-400 uppercase tracking-wide">Date</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-surface-400 uppercase tracking-wide">Standard</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-surface-400 uppercase tracking-wide">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_reports.map((r) => (
                    <tr key={r.id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                      <td className="py-3 px-3 text-surface-600">
                        {new Date(r.date).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <span className="badge badge-info">{r.standard}</span>
                      </td>
                      <td className="py-3 px-3">
                        <ScoreBadge score={r.score} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
