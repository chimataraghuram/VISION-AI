/**
 * Home Page — VisionAI
 * Main compliance analysis page:
 * - Image upload with drag-and-drop
 * - Standard selector
 * - Analyze button
 * - Full results display (score, summary, issues, recommendations)
 */
import { useState, useCallback, useRef } from 'react';
import { Upload, ImageIcon, X, ShieldCheck, Zap } from 'lucide-react';
import CircularScore from '../components/CircularScore';
import IssueCard from '../components/IssueCard';
import RecommendationList from '../components/RecommendationList';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { analyzeImage } from '../services/api';
import { useApp } from '../contexts/AppContext';

const STANDARDS = [
  { value: 'General Safety',     label: '🛡️ General Safety' },
  { value: 'Kitchen Hygiene',    label: '🍽️ Kitchen Hygiene' },
  { value: 'Office Safety',      label: '💼 Office Safety' },
  { value: 'Hostel Safety',      label: '🏠 Hostel Safety' },
  { value: 'Warehouse Safety',   label: '🏭 Warehouse Safety' },
  { value: 'Laboratory Safety',  label: '🔬 Laboratory Safety' },
];

export default function Home() {
  const { setCurrentReport, showToast } = useApp();

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [standard, setStandard] = useState('General Safety');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const resultRef = useRef(null);

  // ── Image handling ────────────────────────────────────────────────────────
  const handleFile = useCallback((file) => {
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setError('Only JPG and PNG images are accepted.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB.');
      return;
    }

    setError(null);
    setResult(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const handleFileInput = (e) => handleFile(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Analysis ──────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!imageFile) { setError('Please upload an image first.'); return; }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeImage(imageFile, standard);
      setResult(data);
      setCurrentReport(data);
      showToast('Analysis complete!', 'success');

      // Scroll to results
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Score color helpers ───────────────────────────────────────────────────
  const getScoreGradient = (score) => {
    if (score >= 70) return 'from-emerald-500 to-emerald-600';
    if (score >= 40) return 'from-amber-500 to-amber-600';
    return 'from-red-500 to-red-600';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* ── Hero ── */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full mb-4 border border-primary-100">
          <Zap className="w-3.5 h-3.5" />
          Powered by Gemini 2.5 Flash
        </div>
        <h1 className="text-4xl font-bold text-surface-900 tracking-tight">
          AI Compliance Auditor
        </h1>
        <p className="mt-3 text-lg text-surface-500 max-w-xl mx-auto">
          Upload a photo of any room and receive an instant AI-powered compliance assessment.
        </p>
      </div>

      {/* ── Upload Card ── */}
      <div className="card mb-6">
        <h2 className="text-base font-semibold text-surface-800 mb-5 flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary-500" />
          Upload Room Image
        </h2>

        {!imagePreview ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-all duration-150
              ${isDragging
                ? 'border-primary-500 bg-primary-50'
                : 'border-surface-300 hover:border-primary-400 hover:bg-surface-50'}`}
          >
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-primary-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-surface-700">
                Drop your image here, or <span className="text-primary-600">browse</span>
              </p>
              <p className="text-xs text-surface-400 mt-1">
                Supports JPG, PNG — up to 10MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              className="hidden"
              onChange={handleFileInput}
              id="image-upload"
            />
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-surface-200">
            <img
              src={imagePreview}
              alt="Uploaded room"
              className="w-full max-h-80 object-cover"
            />
            <button
              onClick={removeImage}
              className="absolute top-3 right-3 w-8 h-8 bg-surface-900/70 hover:bg-surface-900 text-white rounded-full flex items-center justify-center transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
              <p className="text-white text-xs font-medium truncate">{imageFile?.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Standard + Analyze ── */}
      <div className="card mb-6">
        <h2 className="text-base font-semibold text-surface-800 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary-500" />
          Compliance Standard
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="standard-select" className="block text-xs font-medium text-surface-500 mb-2">
              Select standard to evaluate against
            </label>
            <select
              id="standard-select"
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
              className="select"
            >
              {STANDARDS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <button
            id="analyze-btn"
            onClick={handleAnalyze}
            disabled={loading || !imageFile}
            className="btn-primary justify-center py-3"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Analyze Compliance
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-6">
          <ErrorAlert message={error} type="error" onDismiss={() => setError(null)} />
        </div>
      )}

      {/* ── Loading overlay ── */}
      {loading && (
        <LoadingSpinner
          fullScreen
          message="Gemini Vision is analyzing your image... this may take up to 30 seconds."
        />
      )}

      {/* ── Results ── */}
      {result && (
        <div ref={resultRef} className="space-y-6">

          {/* Score Header */}
          <div className={`card bg-gradient-to-br ${getScoreGradient(result.score)} text-white border-0`}>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <CircularScore score={result.score} size={160} />
              <div className="flex-1 text-center sm:text-left">
                <div className="text-sm font-medium text-white/80 mb-1">
                  {standard} — Compliance Score
                </div>
                <p className="text-white/90 text-sm leading-relaxed max-w-md">
                  {result.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-medium">
                    {result.issues?.length || 0} issues detected
                  </span>
                  <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-medium">
                    {result.recommendations?.length || 0} recommendations
                  </span>
                  <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-medium">
                    Report #{result.id}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="card">
            <p className="section-label">Executive Summary</p>
            <p className="text-surface-700 text-sm leading-relaxed">{result.summary}</p>
          </div>

          {/* Issues */}
          {result.issues && result.issues.length > 0 && (
            <div className="card">
              <p className="section-label">
                Compliance Issues ({result.issues.length})
              </p>
              <div className="space-y-3">
                {result.issues.map((issue, i) => (
                  <IssueCard key={i} issue={issue} index={i} />
                ))}
              </div>
            </div>
          )}

          {result.issues && result.issues.length === 0 && (
            <div className="card border-emerald-200 bg-emerald-50">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
                <div>
                  <p className="font-semibold text-emerald-800">No Issues Detected</p>
                  <p className="text-sm text-emerald-600">This space is fully compliant with {standard} standards.</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="card">
              <p className="section-label">AI Action Plan</p>
              <RecommendationList recommendations={result.recommendations} />
            </div>
          )}

        </div>
      )}
    </div>
  );
}
