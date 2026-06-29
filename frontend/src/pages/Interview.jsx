import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, ChevronRight, Trophy, RotateCcw, Star,
  Volume2, VolumeX, ShieldAlert, Sparkles, CheckCircle, BrainCircuit, Target, Lightbulb, AlertTriangle, Play, Download
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import MicButton from '../components/MicButton';
import ErrorAlert from '../components/ErrorAlert';
import { getInterviewQuestions, evaluateAnswer, saveInterviewResult, getHistory } from '../services/api';
import { useApp } from '../contexts/AppContext';

const STANDARDS = [
  { value: 'General Safety',     label: '🛡️ General Safety' },
  { value: 'Kitchen Hygiene',    label: '🍽️ Kitchen Hygiene' },
  { value: 'Office Safety',      label: '💼 Office Safety' },
  { value: 'Hostel Safety',      label: '🏠 Hostel Safety' },
  { value: 'Warehouse Safety',   label: '🏭 Warehouse Safety' },
  { value: 'Laboratory Safety',  label: '🔬 Laboratory Safety' },
];

const PHASES = {
  SETUP:      'setup',
  QUESTION:   'question',
  RECORDING:  'recording',
  EVALUATING: 'evaluating',
  FEEDBACK:   'feedback',
  ERROR:      'error',
  COMPLETE:   'complete',
};

// ── Components ─────────────────────────────────────────────────────────────

function ScoreRing({ score, max = 10 }) {
  const pct = (score / max) * 100;
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  const color = score >= 7 ? '#16a34a' : score >= 5 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-24 h-24">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#f1f5f9" strokeWidth={8} />
        <motion.circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black tracking-tight" style={{ color }}>{score}</span>
        <span className="text-[10px] text-surface-400 font-bold">/ {max}</span>
      </div>
    </div>
  );
}

function ProgressSteps() {
  const steps = [
    "Processing speech",
    "Understanding your response",
    "Evaluating knowledge",
    "Generating personalized feedback"
  ];
  
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="space-y-4 w-full max-w-sm mx-auto">
      {steps.map((step, idx) => {
        const isPast = idx < currentStep;
        const isCurrent = idx === currentStep;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isPast || isCurrent ? 1 : 0.3, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              isPast ? 'bg-emerald-500 text-white' : 
              isCurrent ? 'bg-primary-500 text-white animate-pulse' : 'bg-surface-200 text-surface-400'
            }`}>
              {isPast ? <CheckCircle className="w-3.5 h-3.5" /> : (
                isCurrent ? <div className="w-2 h-2 bg-white rounded-full animate-ping" /> : null
              )}
            </div>
            <span className={`text-sm font-medium ${isCurrent ? 'text-primary-700 dark:text-primary-400 font-bold' : 'text-surface-600'}`}>
              {step}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────

export default function Interview() {
  const { currentReport, showToast } = useApp();
  const [latestReport, setLatestReport] = useState(null);
  const [standard, setStandard]     = useState('General Safety');
  const [phase, setPhase]           = useState(PHASES.SETUP);
  const [questions, setQuestions]   = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [answers, setAnswers]       = useState([]);
  const [finalResult, setFinalResult] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  // Text to Speech State
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  const currentQuestion = questions[currentIdx];
  const totalQuestions  = 5;

  useEffect(() => {
    if (currentReport) {
      setLatestReport(currentReport);
    } else {
      getHistory(1, 1).then(res => {
        if (res.reports && res.reports.length > 0) {
          setLatestReport(res.reports[0]);
        }
      }).catch(err => console.error("Could not fetch latest report", err));
    }
  }, [currentReport]);

  // TTS Helper Functions
  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speakText = useCallback((text) => {
    if (!isVoiceEnabled || !window.speechSynthesis || !text) return;
    stopSpeaking();
    
    // Slight delay so the UI renders before audio begins
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      // Optional: you can pick a specific voice if available.
      // utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }, 100);
  }, [isVoiceEnabled, stopSpeaking]);

  // Clean up speech when component unmounts
  useEffect(() => {
    return () => stopSpeaking();
  }, [stopSpeaking]);

  // Speak Question
  useEffect(() => {
    if (phase === PHASES.QUESTION && currentQuestion) {
      speakText(currentQuestion);
    }
  }, [phase, currentQuestion, speakText]);

  // Speak Evaluation Feedback
  useEffect(() => {
    if (phase === PHASES.FEEDBACK && evaluation) {
      speakText(`You scored a ${evaluation.score} out of 10. ${evaluation.feedback}`);
    }
  }, [phase, evaluation, speakText]);

  const toggleVoice = () => {
    setIsVoiceEnabled(prev => {
      if (prev) stopSpeaking(); // stop currently playing audio if turned off
      return !prev;
    });
  };

  const startInterview = async () => {
    setLoading(true);
    setError(null);
    try {
      let contextStandard = standard;
      if (latestReport) {
        contextStandard = `${standard}. (Context: The user's last inspection scored ${latestReport.score}/100. Focus on improving their weak areas related to this score and recent safety findings.)`;
      }
      const data = await getInterviewQuestions(contextStandard);
      setQuestions(data.questions);
      setCurrentIdx(0);
      setAnswers([]);
      setTranscript('');
      setEvaluation(null);
      setPhase(PHASES.QUESTION);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTranscript = useCallback((text) => {
    stopSpeaking(); // Interrupt AI if user starts speaking
    setTranscript(text);
  }, [stopSpeaking]);

  const handleMicError = useCallback((msg) => {
    setError(msg);
  }, []);

  const handleEvaluate = async () => {
    if (!transcript.trim()) {
      setError('Please provide or speak your answer before submitting.');
      return;
    }
    stopSpeaking();
    setPhase(PHASES.EVALUATING);
    setError(null);
    try {
      const result = await evaluateAnswer(currentQuestion, transcript, standard);
      setEvaluation(result);
      setPhase(PHASES.FEEDBACK);

      setAnswers((prev) => [
        ...prev,
        { question: currentQuestion, answer: transcript, ...result },
      ]);
    } catch (err) {
      setError(err.message);
      setPhase(PHASES.ERROR);
    }
  };

  const handleNext = async () => {
    stopSpeaking();
    setTranscript('');
    setEvaluation(null);
    setError(null);

    const nextIdx = currentIdx + 1;
    if (nextIdx >= totalQuestions) {
      await finishInterview();
    } else {
      setCurrentIdx(nextIdx);
      setPhase(PHASES.QUESTION);
    }
  };

  const finishInterview = async () => {
    setLoading(true);
    setPhase(PHASES.COMPLETE);
    try {
      const avgScore = answers.reduce((s, a) => s + a.score, 0) / answers.length;
      const saved = await saveInterviewResult({
        standard,
        overall_score: Math.round(avgScore * 10) / 10,
        strengths: [],
        weaknesses: [],
        suggestions: [],
        answers,
      });
      setFinalResult(saved);
      saveToLocal(saved);
      speakText("Interview complete. Generating your final report.");
    } catch (err) {
      const avgScore = answers.reduce((s, a) => s + a.score, 0) / (answers.length || 1);
      const fallbackResult = {
        standard,
        overall_score: Math.round(avgScore * 10) / 10,
        strengths: ['Finished training interview session'],
        weaknesses: ['Review safety guidelines details'],
        suggestions: [JSON.stringify({
            overall_performance_summary: "Assessment complete. No detailed analysis could be generated.",
            knowledge_rating: 5,
            communication_rating: 5,
            reasoning_rating: 5,
            confidence_rating: 5,
            recommended_learning_topics: ["Review compliance documentation"]
        })],
        answers,
      };
      setFinalResult(fallbackResult);
      saveToLocal(fallbackResult);
    } finally {
      setLoading(false);
    }
  };

  const saveToLocal = (result) => {
    try {
      const existing = localStorage.getItem('visionai_interviews');
      const interviews = existing ? JSON.parse(existing) : [];
      interviews.push({
        ...result,
        date: result.date || new Date().toISOString()
      });
      localStorage.setItem('visionai_interviews', JSON.stringify(interviews));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
  };

  const reset = () => {
    stopSpeaking();
    setPhase(PHASES.SETUP);
    setQuestions([]);
    setCurrentIdx(0);
    setAnswers([]);
    setTranscript('');
    setEvaluation(null);
    setFinalResult(null);
    setError(null);
  };

  const getBadgeIcon = (badge) => {
    if (badge === 'Excellent' || badge === 'High' || badge === 'Advanced') return '🏆';
    if (badge === 'Good' || badge === 'Medium' || badge === 'Intermediate') return '🥈';
    return '🥉';
  };

  const parseFinalSuggestions = () => {
    if (!finalResult || !finalResult.suggestions || finalResult.suggestions.length === 0) return null;
    try {
      return JSON.parse(finalResult.suggestions[0]);
    } catch (e) {
      return null;
    }
  };

  // PDF Download Logic
  const handleDownloadPDF = () => {
    if (!finalResult) return;
    const element = document.getElementById('interview-report-content');
    
    // Add a temporary wrapper class for PDF generation to ensure Dark Mode styling captures well
    element.classList.add('pdf-export-mode');

    const opt = {
      margin:       10,
      filename:     `VisionAI_Interview_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
       element.classList.remove('pdf-export-mode');
       if (showToast) showToast('Report downloaded successfully!', 'success');
    });
  };

  const finalSummaryData = parseFinalSuggestions();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 py-16 space-y-8 relative"
    >
      {/* Voice Toggle Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleVoice}
          className="p-3 bg-surface-50 border border-surface-200 rounded-full shadow-sm text-surface-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
          title={isVoiceEnabled ? "Mute AI Voice" : "Enable AI Voice"}
        >
          {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full border border-primary-100 shadow-sm">
          <Mic className="w-3.5 h-3.5" />
          Interactive Assessment
        </div>
        <h1 className="text-3xl font-black tracking-tight text-surface-900 dark:text-white">Compliance Voice Interview</h1>
        <p className="text-surface-500 text-sm max-w-md mx-auto">
          Assess your understanding of safety protocols through a 5-question mock verbal training session.
        </p>
      </div>

      {error && phase !== PHASES.ERROR && <ErrorAlert message={error} type="error" onDismiss={() => setError(null)} />}

      <AnimatePresence mode="wait">
        {/* ── SETUP PHASE ── */}
        {phase === PHASES.SETUP && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="card max-w-3xl mx-auto space-y-6"
          >
            <span className="text-xs font-bold text-surface-400 uppercase tracking-widest">Configuration</span>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider">
                Target Standard
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
            <button
              onClick={startInterview}
              disabled={loading}
              className="w-full btn-primary justify-center py-4 rounded-xl font-bold tracking-wide shadow-lg"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating Assessment...</>
              ) : (
                <><Volume2 className="w-5 h-5" /> Start Assessment</>
              )}
            </button>
          </motion.div>
        )}

        {/* ── QUESTION / RECORDING PHASE ── */}
        {(phase === PHASES.QUESTION || phase === PHASES.RECORDING) && currentQuestion && (
          <motion.div
            key="question"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 max-w-3xl mx-auto"
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest min-w-[90px]">
                Question {currentIdx + 1} of {totalQuestions}
              </span>
              <div className="flex-grow h-1.5 bg-surface-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-500"
                  style={{ width: `${(currentIdx / totalQuestions) * 100}%` }}
                />
              </div>
            </div>
            <div className="card p-8 bg-gradient-to-tr from-surface-50 to-white border border-surface-200 rounded-3xl shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">Question prompt</span>
                <button 
                  onClick={() => speakText(currentQuestion)}
                  className="text-primary-500 hover:text-primary-700 transition-colors p-1"
                  title="Replay Audio"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-xl font-bold text-surface-900 dark:text-white leading-snug">{currentQuestion}</h2>
            </div>

            <div className="card flex flex-col items-center gap-6">
              <p className="text-xs text-surface-500 text-center font-medium max-w-sm">
                Click the microphone, formulate your response, and click again to transcribe.
              </p>
              <MicButton
                onTranscript={handleTranscript}
                onError={handleMicError}
                disabled={loading}
              />

              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full space-y-4 pt-4 border-t border-surface-100"
                >
                  <div>
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Transcribed Response</span>
                    <div className="mt-2.5 p-4 bg-surface-50 border border-surface-200 rounded-2xl text-sm text-surface-700 leading-relaxed italic">
                      "{transcript}"
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setTranscript('')} className="btn-secondary rounded-xl text-xs py-2 px-4">
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                    <button onClick={handleEvaluate} className="btn-primary rounded-xl text-xs py-2 px-4">
                      Submit Answer <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── EVALUATING PHASE ── */}
        {phase === PHASES.EVALUATING && (
          <motion.div
            key="evaluating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card max-w-md mx-auto flex flex-col items-center py-12 px-8 space-y-8 text-center"
          >
            <div className="relative">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center animate-pulse">
                <BrainCircuit className="w-10 h-10 text-primary-600" />
              </div>
              <div className="absolute -inset-2 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white">🤖 Evaluating Your Answer...</h2>
              <p className="text-sm text-surface-500">Please wait while Gemini reviews your response.</p>
            </div>
            
            <div className="w-full text-left bg-surface-50 p-6 rounded-2xl border border-surface-100">
              <ProgressSteps />
            </div>
          </motion.div>
        )}

        {/* ── ERROR PHASE ── */}
        {phase === PHASES.ERROR && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card max-w-md mx-auto flex flex-col items-center py-12 px-8 space-y-8 text-center border-red-200 bg-red-50/30"
          >
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white">Evaluation Failed</h2>
              <p className="text-sm text-surface-500">Unable to evaluate your answer. The Gemini API might be busy.</p>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>
            
            <div className="flex flex-col w-full gap-3">
              <button onClick={handleEvaluate} className="btn-primary w-full justify-center">
                <RotateCcw className="w-4 h-4" /> Retry Evaluation
              </button>
              <button onClick={handleNext} className="btn-secondary w-full justify-center">
                <Play className="w-4 h-4" /> Skip Question
              </button>
              <button onClick={reset} className="btn-secondary w-full justify-center text-red-600 border-red-200 hover:bg-red-50">
                Cancel Interview
              </button>
            </div>
          </motion.div>
        )}

        {/* ── FEEDBACK PHASE ── */}
        {phase === PHASES.FEEDBACK && evaluation && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 max-w-3xl mx-auto"
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest min-w-[90px]">
                Question {currentIdx + 1} of {totalQuestions}
              </span>
              <div className="flex-grow h-1.5 bg-surface-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            <div className="card border-primary-200/50 shadow-md p-8">
              <div className="flex items-center justify-between mb-8 border-b border-surface-100 pb-4">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-primary-500" />
                  <h3 className="font-bold text-surface-900 dark:text-white">🤖 AI Evaluation</h3>
                </div>
                <button 
                  onClick={() => speakText(`You scored a ${evaluation.score} out of 10. ${evaluation.feedback}`)}
                  className="text-primary-500 hover:text-primary-700 transition-colors p-1"
                  title="Replay Audio"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-8 mb-8 pb-8 border-b border-surface-100">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Question Score</span>
                  <ScoreRing score={evaluation.score} />
                </div>
                <div className="flex flex-col items-center justify-center space-y-2">
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Performance Badge</span>
                  <div className="text-4xl mt-2">{getBadgeIcon(evaluation.performance_badge)}</div>
                  <span className="text-sm font-bold text-surface-700">{evaluation.performance_badge}</span>
                </div>
                <div className="flex-grow flex flex-col justify-center space-y-4 pl-4 md:border-l border-surface-100">
                  <div className="bg-surface-50 p-3 rounded-xl border border-surface-200 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">Question Difficulty</span>
                    <span className="text-xs font-bold text-surface-800">{evaluation.difficulty}</span>
                  </div>
                  <div className="bg-surface-50 p-3 rounded-xl border border-surface-200 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">Estimated Accuracy</span>
                    <span className="text-xs font-bold text-surface-800">{evaluation.estimated_accuracy}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {evaluation.strengths?.length > 0 && (
                  <div className="space-y-4">
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> ✔ Strengths
                    </span>
                    <ul className="space-y-2.5">
                      {evaluation.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm text-surface-700 leading-relaxed">
                          <span className="text-emerald-500 flex-shrink-0">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {evaluation.missing_points?.length > 0 && (
                  <div className="space-y-4">
                    <span className="text-[11px] font-bold text-red-600 uppercase tracking-widest flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> ⚠ Areas for Improvement
                    </span>
                    <ul className="space-y-2.5">
                      {evaluation.missing_points.map((m, i) => (
                        <li key={i} className="flex gap-2 text-sm text-surface-700 leading-relaxed">
                          <span className="text-red-500 flex-shrink-0">•</span> {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-8 p-5 bg-primary-50/50 rounded-2xl border border-primary-100/50">
                <span className="text-[11px] font-bold text-primary-700 uppercase tracking-widest flex items-center gap-1.5">
                  💬 AI Feedback
                </span>
                <p className="text-sm text-surface-700 leading-relaxed">{evaluation.feedback}</p>
              </div>

              <div className="space-y-3 p-5 bg-amber-50/30 rounded-2xl border border-amber-200/50">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
                  💡 Suggested Ideal Answer
                </span>
                <p className="text-sm text-surface-700 leading-relaxed italic">"{evaluation.suggested_answer}"</p>
              </div>
            </div>

            <button onClick={handleNext} className="w-full btn-primary justify-center py-4 rounded-xl font-bold tracking-wide shadow-md">
              {currentIdx + 1 >= totalQuestions ? (
                <><Trophy className="w-4 h-4" /> View Final Interview Report</>
              ) : (
                <>Next Question <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </motion.div>
        )}

        {/* ── COMPLETE PHASE ── */}
        {phase === PHASES.COMPLETE && (
          loading ? (
            <motion.div key="complete-loading" className="flex justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                <p className="text-sm font-bold text-surface-500">Generating Interview Report...</p>
              </div>
            </motion.div>
          ) : finalResult && (
            <motion.div
              key="complete-report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 max-w-4xl mx-auto"
            >
              {/* PDF EXPORT CONTENT WRAPPER */}
              <div id="interview-report-content" className="space-y-8 bg-transparent">
                <div className="card p-10 bg-gradient-to-tr from-surface-900 to-surface-800 text-white rounded-3xl shadow-2xl text-center space-y-8 border-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-transparent pointer-events-none" />
                  <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
                    <span className="px-4 py-1.5 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest mb-2 border border-white/10">
                      🎉 Interview Complete
                    </span>
                    <h2 className="text-2xl font-bold">{standard} Assessment</h2>
                    
                    <div className="flex flex-col md:flex-row items-center justify-center gap-12 mt-6">
                      <div className="flex flex-col items-center space-y-4">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Overall Score</span>
                        <ScoreRing score={finalResult.overall_score} />
                        <span className="text-sm font-bold text-white/80">{Math.round((finalResult.overall_score / 10) * 100)}%</span>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Performance Badge</span>
                        <div className="text-5xl drop-shadow-lg">{getBadgeIcon(finalResult.overall_score >= 8 ? 'Excellent' : finalResult.overall_score >= 6 ? 'Good' : 'Needs Improvement')}</div>
                        <span className="text-lg font-bold text-white">{finalResult.overall_score >= 8 ? 'Excellent' : finalResult.overall_score >= 6 ? 'Good' : 'Needs Improvement'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {finalSummaryData && (
                  <div className="card shadow-lg border-surface-200">
                    <div className="flex items-center gap-2 mb-6 border-b border-surface-100 pb-5">
                      <Target className="w-5 h-5 text-primary-500" />
                      <h3 className="font-bold text-lg text-surface-900 dark:text-white">AI Summary</h3>
                    </div>
                    
                    <div className="mb-8">
                      <span className="text-[11px] font-bold text-surface-400 uppercase tracking-widest block mb-2">Overall Performance</span>
                      <p className="text-sm text-surface-700 leading-relaxed bg-surface-50 p-5 rounded-2xl border border-surface-100">
                        {finalSummaryData.overall_performance_summary}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="p-4 bg-surface-50 rounded-xl border border-surface-100 flex flex-col items-center text-center">
                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Knowledge Rating</span>
                        <ScoreRing score={finalSummaryData.knowledge_rating} max={10} />
                      </div>
                      <div className="p-4 bg-surface-50 rounded-xl border border-surface-100 flex flex-col items-center text-center">
                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Communication</span>
                        <ScoreRing score={finalSummaryData.communication_rating} max={10} />
                      </div>
                      <div className="p-4 bg-surface-50 rounded-xl border border-surface-100 flex flex-col items-center text-center">
                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Reasoning</span>
                        <ScoreRing score={finalSummaryData.reasoning_rating} max={10} />
                      </div>
                      <div className="p-4 bg-surface-50 rounded-xl border border-surface-100 flex flex-col items-center text-center">
                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Confidence</span>
                        <ScoreRing score={finalSummaryData.confidence_rating} max={10} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      {finalResult.strengths?.length > 0 && (
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Strengths
                          </span>
                          <ul className="space-y-2.5">
                            {finalResult.strengths.map((s, i) => (
                              <li key={i} className="flex gap-2 text-sm text-surface-700 leading-relaxed">
                                <span className="text-emerald-500 flex-shrink-0">•</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {finalResult.weaknesses?.length > 0 && (
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-red-600 uppercase tracking-widest flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" /> Weaknesses
                          </span>
                          <ul className="space-y-2.5">
                            {finalResult.weaknesses.map((w, i) => (
                              <li key={i} className="flex gap-2 text-sm text-surface-700 leading-relaxed">
                                <span className="text-red-500 flex-shrink-0">•</span> {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {finalSummaryData.recommended_learning_topics?.length > 0 && (
                      <div className="p-6 bg-primary-50 rounded-2xl border border-primary-100">
                        <span className="text-[11px] font-bold text-primary-700 uppercase tracking-widest block mb-4 flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4 text-primary-500" /> Recommended Topics
                        </span>
                        <div className="flex flex-wrap gap-2.5">
                          {finalSummaryData.recommended_learning_topics.map((t, i) => (
                            <span key={i} className="px-3.5 py-1.5 bg-white text-primary-800 text-sm font-semibold rounded-xl shadow-sm border border-primary-100">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons (Not in PDF) */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={handleDownloadPDF} className="flex-1 btn-primary py-4 rounded-xl font-bold justify-center shadow-sm">
                  <Download className="w-4 h-4" /> Download PDF Report
                </button>
                <button onClick={reset} className="flex-1 btn-secondary py-4 rounded-xl font-bold justify-center shadow-sm">
                  <RotateCcw className="w-4 h-4" /> Start Another Session
                </button>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </motion.div>
  );
}
