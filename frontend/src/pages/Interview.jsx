import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, ChevronRight, Trophy, RotateCcw, Star,
  Volume2, ShieldAlert, Sparkles, CheckCircle
} from 'lucide-react';
import MicButton from '../components/MicButton';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { getInterviewQuestions, evaluateAnswer, saveInterviewResult } from '../services/api';

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
  COMPLETE:   'complete',
};

function ScoreStars({ score }) {
  return (
    <div className="flex gap-1">
      {[...Array(10)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 transition-transform duration-300 hover:scale-110 ${
            i < score ? 'text-amber-400 fill-amber-400' : 'text-surface-200'
          }`}
        />
      ))}
    </div>
  );
}

function ScoreRing({ score, max = 10 }) {
  const pct = (score / max) * 100;
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  const color = score >= 7 ? '#16a34a' : score >= 5 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-20 h-20">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#f1f5f9" strokeWidth={6} />
        <motion.circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tracking-tight" style={{ color }}>{score}</span>
        <span className="text-[9px] text-surface-400">/{max}</span>
      </div>
    </div>
  );
}

export default function Interview() {
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

  const currentQuestion = questions[currentIdx];
  const totalQuestions  = 5;

  // ── Step 1: Generate Questions ────────────────────────────────────────────
  const startInterview = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInterviewQuestions(standard);
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

  // ── Step 2: Speech transcript received ────────────────────────────────────
  const handleTranscript = useCallback((text) => {
    setTranscript(text);
    setPhase(PHASES.FEEDBACK);
  }, []);

  const handleMicError = useCallback((msg) => {
    setError(msg);
    setPhase(PHASES.QUESTION);
  }, []);

  // ── Step 3: Evaluate response ─────────────────────────────────────────────
  const handleEvaluate = async () => {
    if (!transcript.trim()) {
      setError('Please provide or speak your answer before submitting.');
      return;
    }
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
      setPhase(PHASES.QUESTION);
    }
  };

  // ── Step 4: Next Question / Finish ────────────────────────────────────────
  const handleNext = async () => {
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

  // ── Step 5: Save Interview results ────────────────────────────────────────
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
    } catch (err) {
      const avgScore = answers.reduce((s, a) => s + a.score, 0) / answers.length;
      setFinalResult({
        standard,
        overall_score: Math.round(avgScore * 10) / 10,
        strengths: ['Finished training interview session'],
        weaknesses: ['Review safety guidelines details'],
        suggestions: ['Practice regulations compliance frequently'],
        answers,
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPhase(PHASES.SETUP);
    setQuestions([]);
    setCurrentIdx(0);
    setAnswers([]);
    setTranscript('');
    setEvaluation(null);
    setFinalResult(null);
    setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto px-4 py-16 space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full border border-primary-100 shadow-sm">
          <Mic className="w-3.5 h-3.5" />
          Interactive Assessment
        </div>
        <h1 className="text-3xl font-black tracking-tight text-surface-900">Compliance Voice Interview</h1>
        <p className="text-surface-500 text-sm max-w-md mx-auto">
          Assess your understanding of safety protocols through a 5-question mock verbal training session.
        </p>
      </div>

      {error && <ErrorAlert message={error} type="error" onDismiss={() => setError(null)} />}

      {/* ── SETUP PHASE ── */}
      {phase === PHASES.SETUP && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 bg-white border border-surface-200 rounded-3xl shadow-sm space-y-6"
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
              id="interview-standard"
            >
              {STANDARDS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="bg-primary-50/50 border border-primary-100 rounded-2xl p-5 text-sm text-primary-850 space-y-3">
            <p className="font-bold flex items-center gap-1.5 text-primary-750">
              <Sparkles className="w-4 h-4 text-primary-600 fill-primary-100" /> Assessment Flow
            </p>
            <ol className="space-y-2 text-xs font-medium text-primary-600 list-decimal list-inside leading-relaxed">
              <li>Gemini generates 5 tailored questions for {standard}.</li>
              <li>Activate the microphone, formulate your response, and submit.</li>
              <li>The engine evaluates your explanation and gives a constructive grade.</li>
            </ol>
          </div>

          <button
            onClick={startInterview}
            disabled={loading}
            className="w-full btn-primary justify-center py-4 rounded-xl font-bold tracking-wide relative overflow-hidden group shadow-lg hover:shadow-primary-500/20 active:scale-[0.99] transition-transform"
            id="start-interview-btn"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating Assessment...</>
            ) : (
              <><Volume2 className="w-5 h-5" /> Start Assessment</>
            )}
          </button>
        </motion.div>
      )}

      {/* ── QUESTION PHASE / RECORDING ── */}
      {(phase === PHASES.QUESTION || phase === PHASES.RECORDING) && currentQuestion && (
        <div className="space-y-6">
          {/* Progress */}
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

          {/* Question card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8 bg-gradient-to-tr from-surface-50 to-white border border-surface-200 rounded-3xl shadow-sm space-y-3"
          >
            <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">Question prompt</span>
            <h2 className="text-xl font-bold text-surface-900 leading-snug">{currentQuestion}</h2>
          </motion.div>

          {/* Voice recorder card */}
          <div className="card p-8 bg-white border border-surface-200 rounded-3xl shadow-sm flex flex-col items-center gap-6">
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
                  <button
                    onClick={() => setTranscript('')}
                    className="btn-secondary rounded-xl text-xs py-2 px-4"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                  <button
                    onClick={handleEvaluate}
                    className="btn-primary rounded-xl text-xs py-2 px-4"
                    id="submit-answer-btn"
                  >
                    Submit Answer <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* ── EVALUATING ── */}
      {phase === PHASES.EVALUATING && (
        <LoadingSpinner message="Evaluating compliance knowledge..." />
      )}

      {/* ── FEEDBACK VIEW ── */}
      {phase === PHASES.FEEDBACK && evaluation && (
        <div className="space-y-6">
          {/* Progress */}
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

          {/* Assessment Score */}
          <div className="card p-6 bg-white border border-surface-200 rounded-3xl shadow-sm flex items-center gap-6">
            <ScoreRing score={evaluation.score} />
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Question Score</span>
              <ScoreStars score={evaluation.score} />
              <p className="text-[10px] font-semibold text-surface-500">
                {evaluation.score >= 8 ? 'Excellent Understanding' : evaluation.score >= 6 ? 'Good Knowledge' : 'Requires Training'}
              </p>
            </div>
          </div>

          {/* Feedback details */}
          <div className="card p-8 bg-white border border-surface-200 rounded-3xl shadow-sm space-y-3">
            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">AI Examiner Feedback</span>
            <p className="text-sm text-surface-600 leading-relaxed">{evaluation.feedback}</p>
          </div>

          {/* User's spoken answer */}
          <div className="card p-6 bg-surface-50/50 border border-surface-200 rounded-2xl">
            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Your Transcript</span>
            <p className="text-xs text-surface-500 italic mt-2 leading-relaxed">"{transcript}"</p>
          </div>

          <button
            onClick={handleNext}
            className="w-full btn-primary justify-center py-4 rounded-xl font-bold tracking-wide"
            id="next-question-btn"
          >
            {currentIdx + 1 >= totalQuestions ? (
              <><Trophy className="w-4 h-4" /> View Performance Report</>
            ) : (
              <>Next Question <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      )}

      {/* ── COMPLETE PERFORMANCE REPORT ── */}
      {phase === PHASES.COMPLETE && (
        loading ? (
          <LoadingSpinner message="Compiling overall performance report..." />
        ) : finalResult && (
          <div className="space-y-8">
            {/* Header score */}
            <div className="card p-8 bg-gradient-to-tr from-surface-900 to-surface-800 text-white rounded-3xl shadow-xl text-center space-y-4 border-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent pointer-events-none" />
              <Trophy className="w-12 h-12 mx-auto text-amber-300 fill-amber-300" />
              <div>
                <h2 className="text-xl font-black">Voice Assessment Complete</h2>
                <p className="text-xs text-white/60 mt-1">{finalResult.standard}</p>
              </div>

              <div className="py-2">
                <div className={`text-6xl font-black tracking-tight tabular-nums ${
                  finalResult.overall_score >= 7 ? 'text-emerald-400' :
                  finalResult.overall_score >= 5 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {finalResult.overall_score.toFixed(1)}
                </div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Overall Score / 10</span>
              </div>
            </div>

            {/* Split layout: Question details */}
            <div className="card p-8 bg-white border border-surface-200 rounded-3xl shadow-sm space-y-6">
              <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Question Breakdown</span>
              <div className="h-px bg-surface-100" />
              <div className="space-y-4">
                {answers.map((a, i) => (
                  <div key={i} className="p-4 bg-surface-50 border border-surface-200/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-md">
                      <p className="text-xs font-bold text-surface-900 truncate">{a.question}</p>
                      <p className="text-[10px] text-surface-400 italic truncate">"{a.answer}"</p>
                      <p className="text-[10px] text-surface-500 line-clamp-1">{a.feedback}</p>
                    </div>
                    <span className={`self-start sm:self-center text-xs font-bold px-3 py-1 rounded-full ${
                      a.score >= 7 ? 'bg-emerald-100 text-emerald-700' :
                      a.score >= 5 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {a.score}/10
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Weaknesses (AI recommendations breakdown) */}
            {finalResult.strengths?.length > 0 && (
              <div className="card p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-4">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Strengths Demarcated</span>
                <ul className="space-y-3">
                  {finalResult.strengths.map((s, idx) => (
                    <li key={idx} className="flex gap-2.5 text-xs font-medium text-emerald-950">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {finalResult.weaknesses?.length > 0 && (
              <div className="card p-6 bg-red-50/50 border border-red-100 rounded-2xl space-y-4">
                <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest">Improvement Targets</span>
                <ul className="space-y-3">
                  {finalResult.weaknesses.map((w, idx) => (
                    <li key={idx} className="flex gap-2.5 text-xs font-medium text-red-950">
                      <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {finalResult.suggestions?.length > 0 && (
              <div className="card p-6 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-4">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Development Action Items</span>
                <ul className="space-y-3">
                  {finalResult.suggestions.map((s, idx) => (
                    <li key={idx} className="flex gap-2.5 text-xs font-medium text-amber-950">
                      <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Restart button */}
            <button onClick={reset} className="btn-secondary w-full py-4 rounded-xl font-bold justify-center shadow-sm">
              <RotateCcw className="w-4 h-4" /> Start Another Assessment Session
            </button>
          </div>
        )
      )}
    </motion.div>
  );
}
