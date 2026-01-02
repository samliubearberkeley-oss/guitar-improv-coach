import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { AppView, SessionSettings, SessionResult, NoteEvent } from './types';
import { SessionSetup } from './components/SessionSetup';
import { PlayingSession } from './components/PlayingSession';
import { SessionResults } from './components/SessionResults';
import { LoadingAnalysis } from './components/LoadingAnalysis';
import { analyzeSession } from './lib/analyzeSession';

function App() {
  const [view, setView] = useState<AppView>('setup');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [settings, setSettings] = useState<SessionSettings>({
    style: 'rock',
    key: 'A',
    tempo: 120,
    metronomeEnabled: false,
  });
  const [result, setResult] = useState<SessionResult | null>(null);

  const handleStartSession = useCallback(() => {
    setView('playing');
    setResult(null);
  }, []);

  const handleEndSession = useCallback(async (noteEvents: NoteEvent[]) => {
    setIsAnalyzing(true);
    
    try {
      const analysisResult = await analyzeSession(noteEvents, settings);
      setResult(analysisResult);
      setView('results');
    } catch (error) {
      console.error('Analysis error:', error);
      // Still show results with basic analysis
      setResult({
        overallScore: 70,
        metrics: {
          scaleAdherence: 70,
          timingAccuracy: 70,
          pitchControl: 70,
          phraseConsistency: 70,
          styleMatch: 70,
        },
        feedback: ['Unable to complete full analysis. Showing estimated scores.'],
        strengths: ['Keep practicing!'],
        weaknesses: ['Analysis incomplete'],
        suggestions: ['Try another session for full feedback'],
        noteEvents,
        duration: noteEvents.length > 1 
          ? noteEvents[noteEvents.length - 1].timestamp - noteEvents[0].timestamp 
          : 0,
      });
      setView('results');
    } finally {
      setIsAnalyzing(false);
    }
  }, [settings]);

  const handleCancelSession = useCallback(() => {
    setView('setup');
  }, []);

  const handlePlayAgain = useCallback(() => {
    setView('playing');
    setResult(null);
  }, []);

  const handleNewSession = useCallback(() => {
    setView('setup');
    setResult(null);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 pointer-events-none" />
      
      {/* Subtle grid pattern */}
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Ambient glow effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 px-6 py-8 pb-20">
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingAnalysis />
            </motion.div>
          ) : view === 'setup' ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <SessionSetup
                settings={settings}
                onSettingsChange={setSettings}
                onStart={handleStartSession}
              />
            </motion.div>
          ) : view === 'playing' ? (
            <motion.div
              key="playing"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <PlayingSession
                settings={settings}
                onEnd={handleEndSession}
                onCancel={handleCancelSession}
              />
            </motion.div>
          ) : view === 'results' && result ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <SessionResults
                result={result}
                settings={settings}
                onPlayAgain={handlePlayAgain}
                onNewSession={handleNewSession}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-3 text-center text-zinc-700 text-xs bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none">
        <span>Guitar Improv Coach</span>
        <span className="mx-2">•</span>
        <span>Powered by InsForge AI</span>
      </footer>
    </div>
  );
}

export default App;
