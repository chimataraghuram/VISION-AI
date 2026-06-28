import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History as HistoryIcon, Eye, ChevronLeft, ChevronRight, X, Filter, Calendar } from 'lucide-react';
import ScoreBadge from '../components/ScoreBadge';
import CircularScore from '../components/CircularScore';
import IssueCard from '../components/IssueCard';
import RecommendationList from '../components/RecommendationList';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { getHistory, getReportDetail } from '../services/api';
import { Link } from 'react-router-dom';

const STANDARDS = [
  'All Standards',
  'General Safety',
  'Kitchen Hygiene',
  'Office Safety',
  'Hostel Safety',
  'Warehouse Safety',
  'Laboratory Safety',
];

export default function History() {
  const [reports, setReports]     = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [standard, setStandard]   = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailLoading, setDetailLoading]   = useState(false);

  const PAGE_SIZE = 9;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── Fetch reports ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const std = standard === 'All Standards' ? null : standard || null;
        const data = await getHistory(page, PAGE_SIZE, std);
        setReports(data.reports);
        setTotal(data.total);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, standard]);

  const viewReport = async (id) => {
    setDetailLoading(true);
    try {
      const detail = await getReportDetail(id);
      setSelectedReport(detail);
    } catch (err) {
      setError(`Failed to load report details: ${err.message}`);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => setSelectedReport(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-4 py-16 space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-surface-900 dark:text-white flex items-center gap-2">
            Compliance History
          </h1>
          <p className="text-surface-500 text-sm mt-2">
            {total > 0 ? `Archive contains ${total} reports` : 'No inspection reports saved'}
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2 bg-white dark:bg-[#0b1220] border border-surface-200 px-3 py-1.5 rounded-xl shadow-sm">
          <Filter className="w-4 h-4 text-surface-400" />
          <select
            value={standard}
            onChange={(e) => { setStandard(e.target.value); setPage(1); }}
            className="bg-transparent border-0 outline-none text-xs font-semibold text-surface-700 cursor-pointer"
          >
            {STANDARDS.map((s) => (
              <option key={s} value={s === 'All Standards' ? '' : s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorAlert message={error} type="error" />}
      {detailLoading && <LoadingSpinner message="Fetching report findings..." />}

      {/* Empty State */}
      {!loading && reports.length === 0 && (
        <div className="card text-center py-20 max-w-md mx-auto flex flex-col items-center gap-4">
          <HistoryIcon className="w-12 h-12 text-surface-300" />
          <div>
            <h3 className="text-lg font-bold text-surface-800">No reports found</h3>
            <p className="text-sm text-surface-400 mt-1">
              Select another compliance category filter or start a new inspection.
            </p>
          </div>
          <Link to="/" className="btn-primary mt-2">Start Inspection</Link>
        </div>
      )}

      {/* Grid of Report Cards */}
      {!loading && reports.length > 0 && (
        <div className="space-y-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reports.map((r, idx) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20, delay: idx * 0.04 }}
                whileHover={{ y: -4 }}
                className="card hover:border-primary-300 hover:shadow-md transition-all p-5 flex flex-col justify-between min-h-[170px]"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-surface-400 font-mono">#{r.id}</span>
                    <ScoreBadge score={r.score} />
                  </div>
                  <h3 className="text-sm font-extrabold text-surface-900 dark:text-white mt-3 leading-snug">{r.standard}</h3>
                </div>

                <div className="mt-6 flex justify-between items-center border-t border-surface-100 pt-3">
                  <div className="flex items-center gap-1 text-[10px] text-surface-400 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <button
                    onClick={() => viewReport(r.id)}
                    className="btn-secondary py-1.5 px-3 rounded-lg text-[10px] font-bold gap-1 bg-surface-50 border-surface-200 hover:bg-surface-100 hover:text-primary-600 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Report
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-4">
              <span className="text-xs font-semibold text-surface-400">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="btn-secondary py-2 px-4 rounded-xl disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  className="btn-secondary py-2 px-4 rounded-xl disabled:opacity-40"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading && <LoadingSpinner message="Retrieving compliance logs..." />}

      {/* Report Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-surface-900/50 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#0b1220] rounded-3xl shadow-2xl border border-surface-200/80 w-full max-w-2xl my-8 overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-start p-6 border-b border-surface-100 bg-surface-50/50">
                <div>
                  <span className="text-[10px] font-bold text-surface-400 font-mono">REPORT ARCHIVE #{selectedReport.id}</span>
                  <h2 className="text-lg font-black text-surface-900 dark:text-white mt-1">{selectedReport.standard}</h2>
                  <p className="text-xs text-surface-400 mt-0.5">
                    Assessed on {new Date(selectedReport.date).toLocaleString('en-US')}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 rounded-full hover:bg-surface-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-surface-500" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto scrollbar-thin">
                <div className="flex justify-center py-4 bg-surface-50/30 rounded-2xl border border-surface-100">
                  <CircularScore score={selectedReport.score} size={150} />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Findings Summary</span>
                  <p className="text-sm text-surface-600 leading-relaxed">{selectedReport.summary}</p>
                </div>

                {selectedReport.issues?.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Detected Safety Gaps</span>
                    <div className="space-y-3">
                      {selectedReport.issues.map((issue, idx) => (
                        <IssueCard key={idx} issue={issue} index={idx} />
                      ))}
                    </div>
                  </div>
                )}

                {selectedReport.recommendations?.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Action Recommendations</span>
                    <RecommendationList recommendations={selectedReport.recommendations} />
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-surface-100 flex justify-end gap-3 bg-surface-50/30">
                <button onClick={closeModal} className="btn-secondary rounded-xl py-2 px-5">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
