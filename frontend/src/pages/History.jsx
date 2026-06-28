/**
 * History Page — VisionAI
 * Paginated table of all compliance reports with a detail modal.
 */
import { useState, useEffect } from 'react';
import { History as HistoryIcon, Eye, ChevronLeft, ChevronRight, X, Filter } from 'lucide-react';
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

  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── Fetch reports list ──────────────────────────────────────────────────
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

  // ── View report detail ──────────────────────────────────────────────────
  const viewReport = async (id) => {
    setDetailLoading(true);
    try {
      const detail = await getReportDetail(id);
      setSelectedReport(detail);
    } catch (err) {
      setError(`Failed to load report: ${err.message}`);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => setSelectedReport(null);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-primary-600" />
            Compliance History
          </h1>
          <p className="text-surface-500 text-sm mt-1">
            {total > 0 ? `${total} report${total > 1 ? 's' : ''} found` : 'No reports yet'}
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-surface-400" />
          <select
            value={standard}
            onChange={(e) => { setStandard(e.target.value); setPage(1); }}
            className="select w-44 text-sm"
          >
            {STANDARDS.map((s) => (
              <option key={s} value={s === 'All Standards' ? '' : s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorAlert message={error} type="error" className="mb-6" />}
      {detailLoading && <LoadingSpinner message="Loading report..." />}

      {/* Empty state */}
      {!loading && reports.length === 0 && (
        <div className="card text-center py-16">
          <HistoryIcon className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-600 mb-2">No reports found</h3>
          <p className="text-surface-400 text-sm mb-6">
            {standard ? `No reports for "${standard}".` : 'Start by analyzing a room image.'}
          </p>
          <Link to="/" className="btn-primary mx-auto">Analyze a Room</Link>
        </div>
      )}

      {/* Reports Table */}
      {!loading && reports.length > 0 && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-400 uppercase tracking-wide">ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-400 uppercase tracking-wide">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-400 uppercase tracking-wide">Standard</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-400 uppercase tracking-wide">Score</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-surface-400 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                    <td className="py-3.5 px-4 text-surface-400 text-xs font-mono">#{r.id}</td>
                    <td className="py-3.5 px-4 text-surface-600">
                      {new Date(r.date).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                      <span className="block text-xs text-surface-400">
                        {new Date(r.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="badge badge-info">{r.standard}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <ScoreBadge score={r.score} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => viewReport(r.id)}
                        className="btn-secondary py-1.5 px-3 text-xs"
                        id={`view-report-${r.id}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-100">
              <span className="text-xs text-surface-400">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading && <LoadingSpinner message="Loading history..." />}

      {/* ── Report Detail Modal ── */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-surface-100">
              <div>
                <h2 className="text-lg font-bold text-surface-900">Report #{selectedReport.id}</h2>
                <p className="text-xs text-surface-400 mt-0.5">
                  {new Date(selectedReport.date).toLocaleString('en-GB')} · {selectedReport.standard}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-surface-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Score */}
              <div className="flex justify-center">
                <CircularScore score={selectedReport.score} size={160} />
              </div>

              {/* Summary */}
              <div>
                <p className="section-label">Summary</p>
                <p className="text-sm text-surface-700 leading-relaxed">{selectedReport.summary}</p>
              </div>

              {/* Issues */}
              {selectedReport.issues?.length > 0 && (
                <div>
                  <p className="section-label">Issues ({selectedReport.issues.length})</p>
                  <div className="space-y-3">
                    {selectedReport.issues.map((issue, i) => (
                      <IssueCard key={i} issue={issue} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selectedReport.recommendations?.length > 0 && (
                <div>
                  <p className="section-label">Recommendations</p>
                  <RecommendationList recommendations={selectedReport.recommendations} />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-surface-100 flex justify-end">
              <button onClick={closeModal} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
