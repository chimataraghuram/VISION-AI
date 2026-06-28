/**
 * Interview Page — VisionAI
 * 5-question voice compliance interview flow:
 * 1. Select standard
 * 2. Generate questions (Gemini)
 * 3. Display question → record answer (Web Speech API)
 * 4. Evaluate answer (Gemini) → show score + feedback
 * 5. Next question → repeat × 5
 * 6. Final summary: overall score, strengths, weaknesses, suggestions
 */
import { useState, useCallback } from 'react';
import {
  Mic, ChevronRight, Trophy, AlertCircle,
  CheckCircle, XCircle, Lightbulb, RotateCcw, Star
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
          className={`w-4 h-4 ${i < score ? 'text-amber-400 fill-amber-400' : 'text-surface-200'}`}
        />
      ))}
    </div>
  );
}

function ScoreRing({ score, max = 10 }) {
  const pct = (score / max) * 100;
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  const color = score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-24 h-24">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#e2e8f0" strokeWidth={8} />
        <circle cx="48" cy="48" r={radius} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-surface-400">/{max}</span>
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

  // ── Step 1: Generate questions ──────────────────────────────────────────
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

  // ── Step 2: Transcript from mic ─────────────────────────────────────────
  const handleTranscript = useCallback((text) => {
    setTranscript(text);
    setPhase(PHASES.FEEDBACK); // Wait for user to confirm or re-record
  }, []);

  const handleMicError = useCallback((msg) => {
    setError(msg);
    setPhase(PHASES.QUESTION);
  }, []);

  // ── Step 3: Evaluate answer ─────────────────────────────────────────────
  const handleEvaluate = async () => {
    if (!transcript.trim()) {
      setError('Please record your answer first.');
      return;
    }
    setPhase(PHASES.EVALUATING);
    setError(null);
    try {
      const result = await evaluateAnswer(currentQuestion, transcript, standard);
      setEvaluation(result);
      setPhase(PHASES.FEEDBACK);

      // Save this Q&A to answers list
      setAnswers((prev) => [
        ...prev,
        { question: currentQuestion, answer: transcript, ...result },
      ]);
    } catch (err) {
      setError(err.message);
      setPhase(PHASES.QUESTION);
    }
  };

  // ── Step 4: Next question / finish ──────────────────────────────────────
  const handleNext = async () => {
    setTranscript('');
    setEvaluation(null);
    setError(null);

    const nextIdx = currentIdx + 1;
    if (nextIdx >= totalQuestions) {
      // Interview complete — save and show summary
      await finishInterview();
    } else {
      setCurrentIdx(nextIdx);
      setPhase(PHASES.QUESTION);
    }
  };

  // ── Step 5: Save + final summary ───────────────────────────────────────
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
      // Non-critical — show local summary anyway
      const avgScore = answers.reduce((s, a) => s + a.score, 0) / answers.length;
      setFinalResult({
        standard,
        overall_score: Math.round(avgScore * 10) / 10,
        strengths: ['Completed the full assessment'],
        weaknesses: ['Review areas with low scores'],
        suggestions: ['Study the compliance documentation'],
        answers,
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Reset interview ─────────────────────────────────────────────────────
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

  // ── Score color ─────────────────────────────────────────────────────────
  const getOverallColor = (s) =>
    s >= 7 ? 'text-emerald-600' : s >= 5 ? 'text-amber-600' : 'text-red-600';

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER PHASES
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full mb-4 border border-primary-100">
          <Mic className="w-3.5 h-3.5" />
          Voice Assessment
        </div>
        <h1 className="text-2xl font-bold text-surface-900">Compliance Interview</h1>
        <p className="text-surface-500 text-sm mt-1">
          Answer 5 AI-generated questions to assess your compliance knowledge.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorAlert message={error} type="error" onDismiss={() => setError(null)} />
        </div>
      )}

      {/* ── SETUP PHASE ── */}
      {phase === PHASES.SETUP && (
        <div className="card">
          <h2 className="text-base font-semibold text-surface-800 mb-5">Configure Interview</h2>

          <div className="mb-6">
            <label className="block text-xs font-medium text-surface-500 mb-2">
              Compliance Standard
            </label>
            <select
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
              className="select"
              id="interview-standard"
            >
              {STANDARDS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="bg-primary-50 rounded-xl p-4 mb-6 text-sm text-primary-700">
            <p className="font-medium mb-2">📋 How it works:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-primary-600">
              <li>Gemini generates 5 questions about {standard}</li>
              <li>Click the mic button and speak your answer</li>
              <li>AI evaluates your response and gives feedback</li>
              <li>Complete all 5 for your final assessment</li>
            </ol>
          </div>

          <button
            onClick={startInterview}
            disabled={loading}
            className="btn-primary w-full justify-center py-3.5"
            id="start-interview-btn"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating Questions...</>
            ) : (
              <><Mic className="w-5 h-5" /> Start Interview</>
            )}
          </button>
        </div>
      )}

      {/* ── QUESTION PHASE ── */}
      {(phase === PHASES.QUESTION || phase === PHASES.RECORDING) && currentQuestion && (
        <div className="space-y-5">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-surface-500">
              Question {currentIdx + 1} of {totalQuestions}
            </span>
            <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
              <div
                className="h-2 bg-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${((currentIdx) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="card border-primary-100 bg-primary-50/50">
            <span className="text-xs font-bold text-primary-500 uppercase tracking-wider">
              Question {currentIdx + 1}
            </span>
            <p className="mt-3 text-lg font-semibold text-surface-900 leading-relaxed">
              {currentQuestion}
            </p>
          </div>

          {/* Mic */}
          <div className="card flex flex-col items-center gap-5">
            <p className="text-sm text-surface-500 text-center">
              Click the microphone, speak your answer, then click again to stop.
            </p>
            <MicButton
              onTranscript={handleTranscript}
              onError={handleMicError}
              disabled={loading}
            />

            {transcript && (
              <div className="w-full">
                <p className="section-label">Your Answer (transcript)</p>
                <div className="bg-surface-50 border border-surface-200 rounded-xl p-4 text-sm text-surface-700 leading-relaxed">
                  {transcript}
                </div>
                <div className="mt-3 flex gap-3 justify-end">
                  <button
                    onClick={() => { setTranscript(''); }}
                    className="btn-secondary text-xs py-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Re-record
                  </button>
                  <button
                    onClick={handleEvaluate}
                    className="btn-primary text-xs py-2"
                    id="submit-answer-btn"
                  >
                    Submit Answer <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EVALUATING ── */}
      {phase === PHASES.EVALUATING && (
        <LoadingSpinner message="AI is evaluating your answer..." />
      )}

      {/* ── FEEDBACK PHASE ── */}
      {phase === PHASES.FEEDBACK && evaluation && (
        <div className="space-y-5">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-surface-500">
              Question {currentIdx + 1} of {totalQuestions}
            </span>
            <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
              <div
                className="h-2 bg-primary-500 rounded-full transition-all"
                style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Score */}
          <div className="card border-0 bg-gradient-to-br from-surface-800 to-surface-900 text-white">
            <div className="flex items-center gap-5">
              <ScoreRing score={evaluation.score} />
              <div className="flex-1">
                <p className="text-sm text-white/60 mb-1">Answer Score</p>
                <ScoreStars score={evaluation.score} />
                <p className="text-xs text-white/50 mt-1">
                  {evaluation.score >= 8 ? 'Excellent!' : evaluation.score >= 6 ? 'Good answer' : evaluation.score >= 4 ? 'Needs improvement' : 'Study this topic further'}
                </p>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="card">
            <p className="section-label">AI Feedback</p>
            <p className="text-sm text-surface-700 leading-relaxed">{evaluation.feedback}</p>
          </div>

          {/* Your Answer */}
          <div className="card bg-surface-50">
            <p className="section-label">Your Answer</p>
            <p className="text-sm text-surface-600 leading-relaxed italic">"{transcript}"</p>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="btn-primary w-full justify-center py-3.5"
            id="next-question-btn"
          >
            {currentIdx + 1 >= totalQuestions ? (
              <><Trophy className="w-4 h-4" /> Finish Interview</>
            ) : (
              <>Next Question <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      )}

      {/* ── COMPLETE PHASE ── */}
      {phase === PHASES.COMPLETE && (
        loading ? (
          <LoadingSpinner message="Generating your final assessment..." />
        ) : finalResult && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="card bg-gradient-to-br from-primary-600 to-primary-800 text-white border-0 text-center py-10">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-amber-300" />
              <h2 className="text-2xl font-bold mb-1">Interview Complete!</h2>
              <p className="text-primary-200 text-sm mb-6">{finalResult.standard}</p>
              <div className={`text-7xl font-bold tabular-nums mb-2 ${
                finalResult.overall_score >= 7 ? 'text-emerald-300' :
                finalResult.overall_score >= 5 ? 'text-amber-300' : 'text-red-300'
              }`}>
                {finalResult.overall_score.toFixed(1)}
              </div>
              <p className="text-primary-200 text-sm">Overall Score (out of 10)</p>
            </div>

            {/* Per-question breakdown */}
            <div className="card">
              <p className="section-label">Question Breakdown</p>
              <div className="space-y-3">
                {answers.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl border border-surface-100">
                    <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-surface-700 mb-0.5 line-clamp-2">{a.question}</p>
                      <p className="text-xs text-surface-400 mb-2 line-clamp-1 italic">{a.answer}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          a.score >= 7 ? 'bg-emerald-100 text-emerald-700' :
                          a.score >= 5 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>{a.score}/10</span>
                        <p className="text-xs text-surface-500 truncate">{a.feedback}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths */}
            {finalResult.strengths?.length > 0 && (
              <div className="card bg-emerald-50 border-emerald-100">
                <p className="section-label text-emerald-600">Strengths</p>
                <ul className="space-y-2">
                  {finalResult.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-emerald-800">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {finalResult.weaknesses?.length > 0 && (
              <div className="card bg-red-50 border-red-100">
                <p className="section-label text-red-600">Areas for Improvement</p>
                <ul className="space-y-2">
                  {finalResult.weaknesses.map((w, i) => (
                    <li key={i} className="flex gap-2 text-sm text-red-800">
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {finalResult.suggestions?.length > 0 && (
              <div className="card bg-amber-50 border-amber-100">
                <p className="section-label text-amber-600">Suggestions</p>
                <ul className="space-y-2">
                  {finalResult.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-amber-800">
                      <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reset */}
            <button onClick={reset} className="btn-secondary w-full justify-center">
              <RotateCcw className="w-4 h-4" /> Take Another Interview
            </button>
          </div>
        )
      )}
    </div>
  );
}
