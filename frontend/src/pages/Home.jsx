import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ImageIcon, X, ShieldCheck, Zap, AlertCircle, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import CircularScore from '../components/CircularScore';
import IssueCard from '../components/IssueCard';
import RecommendationList from '../components/RecommendationList';
import AILoader from '../components/AILoader';
import DemoImages from '../components/DemoImages';
import ErrorAlert from '../components/ErrorAlert';
import WorkflowPanel from '../components/WorkflowPanel';
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
    if (file.size > 15 * 1024 * 1024) {
      setError('Image must be smaller than 15MB.');
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

  // ── Analyze image ─────────────────────────────────────────────────────────
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

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Load Demo Preset Template ─────────────────────────────────────────────
  const loadDemoTemplate = async (filename, selectedStandard) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setStandard(selectedStandard);

    try {
      // Fetch the image from IMAGES directory and convert to file
      const response = await fetch(`/IMAGES/${filename}`);
      if (!response.ok) {
        // Fallback if public alias is different
        throw new Error(`Demo image '/IMAGES/${filename}' could not be loaded.`);
      }
      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'image/jpeg' });
      
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      
      // Auto-run analysis for demo presets to showcase immediately
      const data = await analyzeImage(file, selectedStandard);
      setResult(data);
      setCurrentReport(data);
      showToast('Demo inspection complete!', 'success');
      
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(`Failed to load demo template: ${err.message}. Please upload an image manually.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-6 pt-2 pb-16 space-y-16 relative"
    >
      {/* Background glowing blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ── HERO SECTION ── */}
      <section className="grid lg:grid-cols-12 gap-12 items-center pt-8 pb-4">
        {/* Left: Text & CTA */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-full shadow-sm"
          >
            ⚡ Powered by Gemini 2.5 Flash
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 80, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.05]"
          >
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">AI-Powered</span> Compliance Auditor
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 80, delay: 0.2 }}
            className="text-sm sm:text-base text-white/50 leading-relaxed"
          >
            Analyze room environments using AI Vision, identify compliance gaps, generate intelligent action plans, and assess knowledge through voice-based interviews.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 80, delay: 0.3 }}
            className="flex flex-wrap gap-4 pt-1"
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-450 border border-blue-400/20 text-white font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              ✨ Start AI Inspection
            </button>
            <a
              href="#analyze-btn"
              className="btn-secondary px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold transition-all"
            >
              ▶ Learn More
            </a>
          </motion.div>
        </div>

        {/* Right: Live workflow panel */}
        <div className="lg:col-span-5">
          <WorkflowPanel />
        </div>
      </section>

      {/* ── UPLOAD SECTION ── */}
      <section className="space-y-6">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 22 }}
          className="bg-white dark:bg-[#0b1220] rounded-3xl border border-surface-200/80 shadow-xl p-6 sm:p-8"
        >
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Upload Zone */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-surface-400 uppercase tracking-widest">Image Source</span>
              {!imagePreview ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200 min-h-[260px]
                    ${isDragging
                      ? 'border-primary-500 bg-primary-50/50'
                      : 'border-surface-200 hover:border-primary-400 hover:bg-surface-50'}`}
                >
                  <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
                    <Upload className="w-7 h-7 text-primary-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-surface-800">
                      Drag & Drop room image
                    </p>
                    <p className="text-xs text-surface-400 mt-1">
                      or click to browse files (JPG, PNG)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-surface-200 shadow-inner group">
                  <img
                    src={imagePreview}
                    alt="Uploaded inspection subject"
                    className="w-full h-[260px] object-cover"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-3 right-3 w-8 h-8 bg-surface-900/80 hover:bg-surface-900 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Standard Options & Action Button */}
            <div className="space-y-6 flex flex-col justify-between h-full min-h-[260px]">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-surface-400 uppercase tracking-widest mb-2.5">
                    Compliance Standard
                  </label>
                  <select
                    value={standard}
                    onChange={(e) => setStandard(e.target.value)}
                    className="select bg-surface-50 border-surface-200 text-sm font-medium py-3 rounded-xl focus:ring-glow"
                  >
                    {STANDARDS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-surface-400 leading-relaxed">
                  VisionAI will evaluate structural safety, potential hazards, hygiene standards, and signage layout based on the chosen category.
                </p>
              </div>

              <button
                id="analyze-btn"
                onClick={handleAnalyze}
                disabled={loading || !imageFile}
                className="w-full btn-primary justify-center py-4 rounded-xl font-bold tracking-wide relative overflow-hidden group shadow-lg hover:shadow-primary-500/20 active:scale-[0.99] transition-transform"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center gap-2">
                  <Zap className="w-4 h-4 fill-white" />
                  🚀 Analyze with AI
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Demo Templates Selectors */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <DemoImages onLoadDemo={loadDemoTemplate} />
        </motion.div>
      </section>

      {/* ── Error message ── */}
      {error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <ErrorAlert message={error} type="error" onDismiss={() => setError(null)} />
        </motion.div>
      )}

      {/* ── Loading Thinking screen ── */}
      {loading && <AILoader />}

      {/* ── RESULTS VIEW ── */}
      <AnimatePresence>
        {result && (
          <motion.section
            ref={resultRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 20 }}
            className="space-y-8 pt-4"
          >
            {/* Split layout: Score & Executive Summary */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Score card */}
              <div className="card flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-6">Inspection Score</span>
                <CircularScore score={result.score} size={150} />
              </div>

              {/* Summary card */}
              <div className="card md:col-span-2 space-y-4">
                <span className="text-xs font-bold text-surface-400 uppercase tracking-widest">Executive Summary</span>
                <div className="h-px bg-surface-100" />
                <h3 className="text-lg font-bold text-surface-900 dark:text-white leading-snug">Assessment Findings</h3>
                <p className="text-sm text-surface-600 leading-relaxed">
                  {result.summary}
                </p>
                <div className="flex gap-2 flex-wrap pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-50 border border-surface-200 rounded-full text-xs font-medium text-surface-600">
                    <FileText className="w-3.5 h-3.5" /> {standard}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-100 rounded-full text-xs font-medium text-red-700">
                    {result.issues?.length || 0} issues detected
                  </span>
                </div>
              </div>
            </div>

            {/* Compliance Issues */}
            <div className="card space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-surface-400 uppercase tracking-widest">Compliance Issues</span>
                <span className="text-xs font-bold bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full">
                  Action Required
                </span>
              </div>
              <div className="h-px bg-surface-100" />

              {result.issues && result.issues.length > 0 ? (
                <div className="space-y-4">
                  {result.issues.map((issue, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <IssueCard issue={issue} index={idx} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <div>
                    <h4 className="font-bold text-emerald-800">Perfect Compliance</h4>
                    <p className="text-xs text-emerald-600 mt-0.5">No compliance safety gaps were identified in this environment.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Recommendations Action Plan */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="card space-y-6">
                <span className="text-xs font-bold text-surface-400 uppercase tracking-widest">AI Action Plan</span>
                <div className="h-px bg-surface-100" />
                <RecommendationList recommendations={result.recommendations} />
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
