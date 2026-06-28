import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ImageIcon, X, ShieldCheck, Zap, AlertCircle, CheckCircle2, ChevronRight, FileText, RefreshCw, Trash2, Download, Copy, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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

// Custom Confirmation Dialog
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-[#0b1220] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-surface-200 dark:border-white/10"
        >
          <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-surface-500 mb-8 leading-relaxed">{message}</p>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="btn-secondary px-5 py-2.5 rounded-xl">Cancel</button>
            <button onClick={() => { onConfirm(); onClose(); }} className="btn-primary px-5 py-2.5 rounded-xl text-white shadow-md bg-blue-600 hover:bg-blue-700">
              Continue
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default function Home() {
  const { setCurrentReport, showToast } = useApp();

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [standard, setStandard] = useState('General Safety');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Confirmation state
  const [confirmAction, setConfirmAction] = useState(null);

  const fileInputRef = useRef(null);
  const resultRef = useRef(null);
  const uploadSectionRef = useRef(null);

  // ── Image handling ────────────────────────────────────────────────────────
  const processFile = useCallback((file) => {
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

  const handleFile = useCallback((file) => {
    if (!file) return;

    if (result) {
      setConfirmAction(() => () => processFile(file));
    } else {
      processFile(file);
    }
  }, [result, processFile]);

  const handleFileInput = (e) => handleFile(e.target.files[0]);
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };
  
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const removeImage = () => {
    const doRemove = () => {
      setImageFile(null);
      setImagePreview(null);
      setResult(null);
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (result) {
      setConfirmAction(() => doRemove);
    } else {
      doRemove();
    }
  };

  const handleNewAnalysis = () => {
    const doNewAnalysis = () => {
      setImageFile(null);
      setImagePreview(null);
      setResult(null);
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      showToast('Ready for a new inspection.', 'success');
      setTimeout(() => {
        uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    };

    if (result) {
      // Actually if they click New Analysis explicitly, maybe we don't need confirmation?
      // Or we can just prompt them to make sure they want to leave the current result.
      // The instructions said "Show a confirmation dialog before replacing an image if analysis is already complete."
      // For "New Analysis" button, it implies leaving, but let's just reset directly since they clicked "New".
      doNewAnalysis();
    } else {
      doNewAnalysis();
    }
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

  // ── UX Actions ────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!resultRef.current) return;
    try {
      const canvas = await html2canvas(resultRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`VisionAI-Report-${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('PDF downloaded successfully!', 'success');
    } catch (err) {
      showToast('Failed to generate PDF', 'error');
    }
  };

  const handleCopyReport = () => {
    if (!result) return;
    const text = `VisionAI Inspection Report\nStandard: ${standard}\nScore: ${result.score}/100\n\nSummary:\n${result.summary}\n\nIssues Found: ${result.issues?.length || 0}\n\nRecommendations:\n${result.recommendations?.join('\n') || 'None'}`;
    navigator.clipboard.writeText(text);
    showToast('Report copied to clipboard!', 'success');
  };

  const handleShare = async () => {
    if (!result) return;
    const text = `I just ran a VisionAI compliance inspection for ${standard} and scored ${result.score}/100!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'VisionAI Inspection Report',
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        if (err.name !== 'AbortError') showToast('Failed to share', 'error');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!', 'success');
    }
  };

  // ── Load Demo Preset Template ─────────────────────────────────────────────
  const loadDemoTemplate = async (filename, selectedStandard) => {
    const doLoad = async () => {
      setLoading(true);
      setError(null);
      setResult(null);
      setStandard(selectedStandard);

      try {
        const response = await fetch(`/demo-images/${filename}`);
        if (!response.ok) {
          throw new Error(`Demo image '/demo-images/${filename}' could not be loaded.`);
        }
        const blob = await response.blob();
        const file = new File([blob], filename, { type: 'image/jpeg' });
        
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        
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

    if (result) {
      setConfirmAction(() => doLoad);
    } else {
      doLoad();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-6 pt-2 pb-16 space-y-16 relative"
    >
      <ConfirmDialog 
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction) confirmAction();
        }}
        title="Discard current analysis?"
        message="Starting a new analysis will clear the current results. The report is saved in your History."
      />

      {/* Background glowing blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ── HERO SECTION ── */}
      <section className="max-w-4xl mx-auto flex flex-col items-center text-center pt-12 pb-8 space-y-8">
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
          className="text-4xl sm:text-6xl font-black text-surface-900 dark:text-white tracking-tight leading-[1.05]"
        >
          <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">AI-Powered</span> Compliance Auditor
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 80, delay: 0.2 }}
          className="text-sm sm:text-base text-surface-600 dark:text-white/50 leading-relaxed max-w-2xl"
        >
          Analyze room environments using AI Vision, identify compliance gaps, generate intelligent action plans, and assess knowledge through voice-based interviews.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 80, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 pt-4"
        >
          <button
            onClick={() => {
              if (result) {
                setConfirmAction(() => () => fileInputRef.current?.click());
              } else {
                fileInputRef.current?.click();
              }
            }}
            className="btn-primary px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-450 border border-blue-400/20 text-white font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            ✨ Start AI Inspection
          </button>
        </motion.div>
      </section>

      {/* ── USER GUIDANCE ── */}
      {!imageFile && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm font-medium text-surface-500 dark:text-white/50 bg-surface-100 dark:bg-white/5 p-4 rounded-xl max-w-3xl mx-auto border border-surface-200 dark:border-white/10">
          💡 Don't have an image? Try one of our demo environments below to explore VisionAI instantly.
        </motion.div>
      )}

      {/* ── UPLOAD SECTION ── */}
      <section ref={uploadSectionRef} className="space-y-6">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 22 }}
          className="bg-white dark:bg-[#0b1220] rounded-3xl border border-surface-200/80 shadow-xl p-6 sm:p-8"
        >
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Upload Zone */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-surface-400 uppercase tracking-widest">Image Source</span>
                {imagePreview && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] uppercase tracking-wider font-bold text-blue-500 hover:text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Replace
                    </button>
                    <button
                      onClick={removeImage}
                      className="text-[10px] uppercase tracking-wider font-bold text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                )}
              </div>
              
              {!imagePreview ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200 min-h-[260px]
                    ${isDragging
                      ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-500/10'
                      : 'border-surface-200 dark:border-white/10 hover:border-primary-400 hover:bg-surface-50 dark:hover:bg-white/[0.02]'}`}
                >
                  <div className="w-14 h-14 bg-primary-50 dark:bg-primary-500/10 rounded-2xl flex items-center justify-center">
                    <Upload className="w-7 h-7 text-primary-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-surface-800 dark:text-white">
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
                <div 
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`relative rounded-2xl overflow-hidden border border-surface-200 dark:border-white/10 shadow-inner group transition-all duration-200 min-h-[260px] ${isDragging ? 'ring-2 ring-primary-500 opacity-80' : ''}`}
                >
                  <img
                    src={imagePreview}
                    alt="Uploaded inspection subject"
                    className="w-full h-[260px] object-cover"
                  />
                  {isDragging && (
                    <div className="absolute inset-0 bg-primary-500/20 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-dashed border-primary-500 rounded-2xl z-10">
                      <div className="w-14 h-14 bg-white shadow-lg rounded-2xl flex items-center justify-center mb-3">
                        <Upload className="w-7 h-7 text-primary-500" />
                      </div>
                      <p className="text-sm font-bold text-white drop-shadow-md">Drop to replace image</p>
                    </div>
                  )}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer z-0"
                  >
                    <div className="bg-white/90 text-surface-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" /> Click to replace
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    className="hidden"
                    onChange={handleFileInput}
                  />
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
                    onChange={(e) => {
                      if (result) {
                        setConfirmAction(() => () => setStandard(e.target.value));
                      } else {
                        setStandard(e.target.value);
                      }
                    }}
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
                disabled={loading || !imageFile || !!result}
                className={`w-full justify-center py-4 rounded-xl font-bold tracking-wide relative overflow-hidden transition-all duration-300 ${
                  result 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-not-allowed dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                  : 'btn-primary group shadow-lg hover:shadow-primary-500/20 active:scale-[0.99]'
                }`}
              >
                {result ? (
                  <span className="relative z-10 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Analysis Completed
                  </span>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 flex items-center gap-2">
                      <Zap className="w-4 h-4 fill-white" />
                      🚀 Analyze with AI
                    </span>
                  </>
                )}
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
          <DemoImages onLoadDemo={loadDemoTemplate} activeDemo={imageFile?.name} isLoading={loading} />
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
                <div className="h-px bg-surface-100 dark:bg-white/10" />
                <h3 className="text-lg font-bold text-surface-900 dark:text-white leading-snug">Assessment Findings</h3>
                <p className="text-sm text-surface-600 dark:text-white/70 leading-relaxed">
                  {result.summary}
                </p>
                <div className="flex gap-2 flex-wrap pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-50 dark:bg-white/5 border border-surface-200 dark:border-white/10 rounded-full text-xs font-medium text-surface-600 dark:text-white/70">
                    <FileText className="w-3.5 h-3.5" /> {standard}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-full text-xs font-medium text-red-700 dark:text-red-400">
                    {result.issues?.length || 0} issues detected
                  </span>
                </div>
              </div>
            </div>

            {/* Compliance Issues */}
            <div className="card space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-surface-400 uppercase tracking-widest">Compliance Issues</span>
                <span className="text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 px-2.5 py-0.5 rounded-full">
                  Action Required
                </span>
              </div>
              <div className="h-px bg-surface-100 dark:bg-white/10" />

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
                <div className="flex items-center gap-3 p-6 bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <div>
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-400">Perfect Compliance</h4>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500/70 mt-0.5">No compliance safety gaps were identified in this environment.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Recommendations Action Plan */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="card space-y-6">
                <span className="text-xs font-bold text-surface-400 uppercase tracking-widest">AI Action Plan</span>
                <div className="h-px bg-surface-100 dark:bg-white/10" />
                <RecommendationList recommendations={result.recommendations} />
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleNewAnalysis}
                className="btn-primary px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-450 border border-blue-400/20 text-white font-bold shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 text-lg"
              >
                <RefreshCw className="w-5 h-5" />
                🔄 New Analysis
              </button>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadPDF}
                  className="btn-secondary px-4 py-3 rounded-2xl flex items-center gap-2 hover:bg-surface-100 dark:hover:bg-white/10 transition-colors"
                  title="Download PDF Report"
                >
                  <Download className="w-4 h-4" /> <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  onClick={handleCopyReport}
                  className="btn-secondary px-4 py-3 rounded-2xl flex items-center gap-2 hover:bg-surface-100 dark:hover:bg-white/10 transition-colors"
                  title="Copy AI Report Text"
                >
                  <Copy className="w-4 h-4" /> <span className="hidden sm:inline">Copy</span>
                </button>
                <button
                  onClick={handleShare}
                  className="btn-secondary px-4 py-3 rounded-2xl flex items-center gap-2 hover:bg-surface-100 dark:hover:bg-white/10 transition-colors"
                  title="Share Report"
                >
                  <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Share</span>
                </button>
              </div>
            </div>

          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
