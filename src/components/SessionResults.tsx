import { motion } from 'motion/react';
import type { SessionResult, SessionSettings } from '../types';

interface SessionResultsProps {
  result: SessionResult;
  settings: SessionSettings;
  onPlayAgain: () => void;
  onNewSession: () => void;
}

function ScoreRing({ score, label, delay = 0 }: { score: number; label: string; delay?: number }) {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getScoreColor = (s: number) => {
    if (s >= 80) return { ring: '#10b981', text: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    if (s >= 60) return { ring: '#f59e0b', text: 'text-amber-400', bg: 'bg-amber-500/10' };
    return { ring: '#f97316', text: 'text-orange-400', bg: 'bg-orange-500/10' };
  };
  
  const colors = getScoreColor(score);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      className="flex flex-col items-center"
    >
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="#27272a"
            strokeWidth="8"
          />
          <motion.circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke={colors.ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ delay: delay + 0.3, duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.5 }}
            className={`text-2xl font-bold ${colors.text}`}
          >
            {score}
          </motion.span>
        </div>
      </div>
      <span className="mt-2 text-xs text-zinc-400 uppercase tracking-wider text-center">
        {label}
      </span>
    </motion.div>
  );
}

function MetricBar({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  const getColor = (v: number) => {
    if (v >= 80) return 'bg-emerald-500';
    if (v >= 60) return 'bg-amber-500';
    return 'bg-orange-500';
  };

  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-sm text-zinc-400">{label}</span>
        <span className="text-sm font-medium text-zinc-300">{value}%</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay, duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${getColor(value)}`}
        />
      </div>
    </div>
  );
}

export function SessionResults({ result, settings, onPlayAgain, onNewSession }: SessionResultsProps) {
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOverallGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', message: 'Outstanding!', color: 'text-emerald-400' };
    if (score >= 80) return { grade: 'A', message: 'Excellent work!', color: 'text-emerald-400' };
    if (score >= 70) return { grade: 'B', message: 'Great job!', color: 'text-amber-400' };
    if (score >= 60) return { grade: 'C', message: 'Good effort', color: 'text-amber-400' };
    return { grade: 'D', message: 'Keep practicing', color: 'text-orange-400' };
  };

  const { grade, message, color } = getOverallGrade(result.overallScore);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Session Complete</h1>
        <div className="flex items-center justify-center gap-4 text-sm text-zinc-400">
          <span className="capitalize">{settings.style}</span>
          <span>•</span>
          <span>Key of {settings.key}</span>
          <span>•</span>
          <span>{settings.tempo} BPM</span>
          <span>•</span>
          <span>{formatDuration(result.duration)}</span>
        </div>
      </motion.div>

      {/* Overall Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl border border-zinc-700 p-8 mb-6 text-center"
      >
        <div className="relative inline-block">
          <svg className="w-40 h-40 -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="#27272a"
              strokeWidth="12"
            />
            <motion.circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke={result.overallScore >= 70 ? '#10b981' : result.overallScore >= 50 ? '#f59e0b' : '#f97316'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 70}
              initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 70 * (1 - result.overallScore / 100) }}
              transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: 'spring' }}
              className={`text-5xl font-bold ${color}`}
            >
              {grade}
            </motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-zinc-400 text-sm mt-1"
            >
              {result.overallScore}/100
            </motion.span>
          </div>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className={`text-xl font-medium mt-4 ${color}`}
        >
          {message}
        </motion.p>
      </motion.div>

      {/* Score Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-5 gap-4 mb-6"
      >
        <ScoreRing score={result.metrics.scaleAdherence} label="Scale" delay={0.4} />
        <ScoreRing score={result.metrics.timingAccuracy} label="Timing" delay={0.5} />
        <ScoreRing score={result.metrics.pitchControl} label="Pitch" delay={0.6} />
        <ScoreRing score={result.metrics.phraseConsistency} label="Phrasing" delay={0.7} />
        <ScoreRing score={result.metrics.styleMatch} label="Style" delay={0.8} />
      </motion.div>

      {/* Detailed Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 mb-6"
      >
        <h3 className="text-lg font-medium text-white mb-4">Detailed Breakdown</h3>
        <MetricBar label="Scale Adherence" value={result.metrics.scaleAdherence} delay={0.6} />
        <MetricBar label="Timing Accuracy" value={result.metrics.timingAccuracy} delay={0.7} />
        <MetricBar label="Pitch Control" value={result.metrics.pitchControl} delay={0.8} />
        <MetricBar label="Phrase Consistency" value={result.metrics.phraseConsistency} delay={0.9} />
        <MetricBar label="Style Match" value={result.metrics.styleMatch} delay={1.0} />
      </motion.div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-emerald-500/5 rounded-xl border border-emerald-500/20 p-5"
        >
          <h3 className="text-emerald-400 font-medium mb-3 flex items-center gap-2">
            <span className="text-lg">💪</span> Strengths
          </h3>
          <ul className="space-y-2">
            {result.strengths.map((strength, idx) => (
              <li key={idx} className="text-sm text-zinc-300 flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                {strength}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-orange-500/5 rounded-xl border border-orange-500/20 p-5"
        >
          <h3 className="text-orange-400 font-medium mb-3 flex items-center gap-2">
            <span className="text-lg">🎯</span> Areas to Improve
          </h3>
          <ul className="space-y-2">
            {result.weaknesses.map((weakness, idx) => (
              <li key={idx} className="text-sm text-zinc-300 flex items-start gap-2">
                <span className="text-orange-400 mt-1">•</span>
                {weakness}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Practice Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-amber-500/5 rounded-xl border border-amber-500/20 p-5 mb-8"
      >
        <h3 className="text-amber-400 font-medium mb-3 flex items-center gap-2">
          <span className="text-lg">📝</span> Practice Suggestions
        </h3>
        <ul className="space-y-2">
          {result.suggestions.map((suggestion, idx) => (
            <li key={idx} className="text-sm text-zinc-300 flex items-start gap-2">
              <span className="text-amber-400 font-bold">{idx + 1}.</span>
              {suggestion}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex justify-center gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPlayAgain}
          className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl
            shadow-lg shadow-amber-500/30 hover:shadow-xl transition-shadow"
        >
          Play Again
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewSession}
          className="px-8 py-3 bg-zinc-800 text-white font-medium rounded-xl border border-zinc-700
            hover:bg-zinc-700 transition-colors"
        >
          Change Settings
        </motion.button>
      </motion.div>
    </div>
  );
}


