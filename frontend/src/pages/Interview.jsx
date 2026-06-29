import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, ChevronRight, Trophy, RotateCcw, Star,
  Volume2, ShieldAlert, Sparkles, CheckCircle, BrainCircuit, Target, Lightbulb
} from 'lucide-react';
import MicButton from '../components/MicButton';
import LoadingSpinner from '../components/LoadingSpinner';
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
  const { currentReport } = useApp();
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
    setTranscript(text);
  }, []);

  const handleMicError = useCallback((msg) => {
    setError(msg);
  }, []);

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
    } catch (err) {
      const avgScore = answers.reduce((s, a) => s + a.score, 0) / answers.length;
      const fallbackResult = {
        standard,
        overall_score: Math.round(avgScore * 10) / 10,
        strengths: ['Finished training interview session'],
        weaknesses: ['Review safety guidelines details'],
        suggestions: [JSON.stringify({
            overall_performance_summary: "Assessment complete. No detailed analysis could be generated.",
            knowledge_level: "Unknown",
            confidence_level: "Unknown",
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
    if (badge === 'Excellent') return '🏆';
    if (badge === 'Good') return '🥈';
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

  const finalSummaryData = parseFinalSuggestions();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 py-16 space-y-8"
    >
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

      {error && <ErrorAlert message={error} type="error" onDismiss={() => setError(null)} />}

      {phase === PHASES.SETUP && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
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

      {(phase === PHASES.QUESTION || phase === PHASES.RECORDING) && currentQuestion && (
        <div className="space-y-6 max-w-3xl mx-auto">
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8 bg-gradient-to-tr from-surface-50 to-white border border-surface-200 rounded-3xl shadow-sm space-y-3"
          >
            <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">Question prompt</span>
            <h2 className="text-xl font-bold text-surface-900 dark:text-white leading-snug">{currentQuestion}</h2>
          </motion.div>

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
        </div>
      )}

      {phase === PHASES.EVALUATING && (
        <LoadingSpinner message="Evaluating compliance knowledge..." />
      )}

      {phase === PHASES.FEEDBACK && evaluation && (
        <div className="space-y-6 max-w-3xl mx-auto">
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

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card border-primary-200/50 shadow-md">
            <div className="flex items-center gap-2 mb-6">
              <BrainCircuit className="w-5 h-5 text-primary-500" />
              <h3 className="font-bold text-surface-900 dark:text-white">AI Evaluation</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-surface-100">
              <div className="flex flex-col items-center justify-center space-y-2">
                <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Overall Score</span>
                <ScoreRing score={evaluation.score} />
              </div>
              <div className="flex flex-col items-center justify-center space-y-2">
                <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Performance Badge</span>
                <div className="text-3xl">{getBadgeIcon(evaluation.performance_badge)}</div>
                <span className="text-sm font-bold text-surface-700">{evaluation.performance_badge}</span>
              </div>
              <div className="flex flex-col justify-center space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1">Question Difficulty</span>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-surface-100 rounded-lg">{evaluation.difficulty}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1">Estimated Accuracy</span>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-surface-100 rounded-lg">{evaluation.estimated_accuracy}%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {evaluation.strengths?.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Strengths</span>
                  <ul className="space-y-2">
                    {evaluation.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2 text-xs text-surface-700">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {evaluation.missing_points?.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Missing Points</span>
                  <ul className="space-y-2">
                    {evaluation.missing_points.map((m, i) => (
                      <li key={i} className="flex gap-2 text-xs text-surface-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" /> {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-6 p-4 bg-primary-50/50 rounded-xl border border-primary-100/50">
              <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">AI Feedback</span>
              <p className="text-sm text-surface-700 leading-relaxed">{evaluation.feedback}</p>
            </div>

            <div className="space-y-3 p-4 bg-surface-50 rounded-xl border border-surface-200">
              <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Suggested Ideal Answer
              </span>
              <p className="text-sm text-surface-700 leading-relaxed italic">"{evaluation.suggested_answer}"</p>
            </div>
          </motion.div>

          <button onClick={handleNext} className="w-full btn-primary justify-center py-4 rounded-xl font-bold tracking-wide">
            {currentIdx + 1 >= totalQuestions ? (
              <><Trophy className="w-4 h-4" /> View Final Interview Report</>
            ) : (
              <>Next Question <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      )}

      {phase === PHASES.COMPLETE && (
        loading ? (
          <LoadingSpinner message="Generating Interview Report..." />
        ) : finalResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="card p-8 bg-gradient-to-tr from-surface-900 to-surface-800 text-white rounded-3xl shadow-xl text-center space-y-6 border-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent pointer-events-none" />
              <div className="flex flex-col items-center justify-center space-y-2 relative z-10">
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold uppercase tracking-widest mb-2">Interview Complete</span>
                <Trophy className="w-12 h-12 text-amber-300 fill-amber-300" />
                <h2 className="text-2xl font-black">Overall Score</h2>
                
                <div className="flex items-center justify-center gap-8 mt-4">
                  <div className="flex flex-col items-center">
                    <ScoreRing score={finalResult.overall_score} />
                  </div>
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Performance Badge</span>
                    <div className="text-4xl">{getBadgeIcon(finalResult.overall_score >= 8 ? 'Excellent' : finalResult.overall_score >= 6 ? 'Good' : 'Needs Improvement')}</div>
                    <span className="text-sm font-bold text-white">{finalResult.overall_score >= 8 ? 'Excellent' : finalResult.overall_score >= 6 ? 'Good' : 'Needs Improvement'}</span>
                  </div>
                </div>
              </div>
            </div>

            {finalSummaryData && (
              <div className="card border-primary-200/50 shadow-md">
                <div className="flex items-center gap-2 mb-6 border-b border-surface-100 pb-4">
                  <Target className="w-5 h-5 text-primary-500" />
                  <h3 className="font-bold text-surface-900 dark:text-white">Overall Performance Summary</h3>
                </div>
                
                <p className="text-sm text-surface-700 leading-relaxed mb-8">
                  {finalSummaryData.overall_performance_summary}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-surface-50 rounded-xl border border-surface-100">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1">Knowledge Level</span>
                    <span className="font-semibold text-surface-800">{finalSummaryData.knowledge_level}</span>
                  </div>
                  <div className="p-4 bg-surface-50 rounded-xl border border-surface-100">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1">Confidence Level</span>
                    <span className="font-semibold text-surface-800">{finalSummaryData.confidence_level}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {finalResult.strengths?.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Key Strengths</span>
                      <ul className="space-y-2">
                        {finalResult.strengths.map((s, i) => (
                          <li key={i} className="flex gap-2 text-xs text-surface-700">
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {finalResult.weaknesses?.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Areas for Improvement</span>
                      <ul className="space-y-2">
                        {finalResult.weaknesses.map((w, i) => (
                          <li key={i} className="flex gap-2 text-xs text-surface-700">
                            <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" /> {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {finalSummaryData.recommended_learning_topics?.length > 0 && (
                  <div className="p-5 bg-primary-50 rounded-xl border border-primary-100">
                    <span className="text-[10px] font-bold text-primary-700 uppercase tracking-widest block mb-3">Recommended Learning Topics</span>
                    <div className="flex flex-wrap gap-2">
                      {finalSummaryData.recommended_learning_topics.map((t, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white text-primary-700 text-xs font-semibold rounded-lg shadow-sm border border-primary-100">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button onClick={reset} className="btn-secondary w-full py-4 rounded-xl font-bold justify-center shadow-sm">
              <RotateCcw className="w-4 h-4" /> Start Another Assessment Session
            </button>
          </motion.div>
        )
      )}
    </motion.div>
  );
}
