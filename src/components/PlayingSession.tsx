import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import type { SessionSettings, NoteEvent } from '../types';
import { Fretboard } from './Fretboard';
import { useAudioInput } from '../hooks/useAudioInput';
import { useMetronome } from '../hooks/useMetronome';

interface PlayingSessionProps {
  settings: SessionSettings;
  onEnd: (noteEvents: NoteEvent[]) => void;
  onCancel: () => void;
}

const MIN_SESSION_DURATION = 10; // seconds
const MAX_SESSION_DURATION = 180; // 3 minutes

export function PlayingSession({ settings, onEnd, onCancel }: PlayingSessionProps) {
  const {
    audioState,
    noteEvents,
    currentNote,
    inputLevel,
    startListening,
    stopListening,
    clearNotes,
  } = useAudioInput();

  const metronome = useMetronome(settings.tempo, settings.metronomeEnabled ?? false);

  const [sessionTime, setSessionTime] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  
  // Use refs to avoid stale closures in timer callback
  const noteEventsRef = useRef<NoteEvent[]>([]);
  const onEndRef = useRef(onEnd);
  const metronomeRef = useRef(metronome);
  const stopListeningRef = useRef(stopListening);
  
  // Keep refs in sync
  useEffect(() => {
    noteEventsRef.current = noteEvents;
  }, [noteEvents]);
  
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);
  
  useEffect(() => {
    metronomeRef.current = metronome;
  }, [metronome]);
  
  useEffect(() => {
    stopListeningRef.current = stopListening;
  }, [stopListening]);

  // Start listening when component mounts
  useEffect(() => {
    startListening();
    return () => stopListening();
  }, [startListening, stopListening]);

  // Handle end session - stable callback using refs
  const handleEndSession = useCallback(() => {
    metronomeRef.current.stop();
    stopListeningRef.current();
    onEndRef.current(noteEventsRef.current);
  }, []);

  // Session timer
  useEffect(() => {
    if (!isStarted || !audioState.isListening) return;

    const interval = setInterval(() => {
      setSessionTime(prev => {
        if (prev >= MAX_SESSION_DURATION) {
          handleEndSession();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isStarted, audioState.isListening, handleEndSession]);

  const handleStartSession = useCallback(() => {
    clearNotes();
    setSessionTime(0);
    setIsStarted(true);
    // Start metronome if enabled
    if (settings.metronomeEnabled) {
      metronome.start();
    }
  }, [clearNotes, settings.metronomeEnabled, metronome]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Permission denied state
  if (audioState.hasPermission === false) {
    return (
      <div className="text-center py-20">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block p-8 bg-red-500/10 border border-red-500/30 rounded-2xl"
        >
          <div className="text-4xl mb-4">🎤</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Microphone Access Denied</h2>
          <p className="text-zinc-400 max-w-md mx-auto mb-6">
            Please allow microphone access to use the guitar improvisation coach. 
            Check your browser settings and try again.
          </p>
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (!audioState.isListening && audioState.hasPermission === null) {
    return (
      <div className="text-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full mx-auto mb-4"
        />
        <p className="text-zinc-400">Requesting microphone access...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with settings info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-zinc-800 rounded-lg border border-zinc-700">
            <span className="text-zinc-400 text-sm">Style:</span>
            <span className="text-white font-medium ml-2 capitalize">{settings.style}</span>
          </div>
          <div className="px-3 py-1 bg-zinc-800 rounded-lg border border-zinc-700">
            <span className="text-zinc-400 text-sm">Key:</span>
            <span className="text-amber-400 font-bold ml-2">{settings.key}</span>
          </div>
          <div className="px-3 py-1 bg-zinc-800 rounded-lg border border-zinc-700">
            <span className="text-zinc-400 text-sm">Tempo:</span>
            <span className="text-white font-medium ml-2">{settings.tempo} BPM</span>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Back to Setup
        </button>
      </motion.div>

      {/* Main Playing Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6"
      >
        {/* Pre-session state */}
        {!isStarted && (
          <div className="text-center py-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Ready to Jam?</h2>
              <p className="text-zinc-400">
                Click start, then play your guitar freely. The app will analyze your improvisation.
              </p>
            </div>

            {/* Input Level Meter */}
            <div className="mb-8">
              <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Input Level</div>
              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden max-w-xs mx-auto">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-500"
                  style={{ width: `${inputLevel * 100}%` }}
                  animate={{ width: `${inputLevel * 100}%` }}
                  transition={{ duration: 0.05 }}
                />
              </div>
              <p className="text-zinc-500 text-sm mt-2">
                {inputLevel > 0.1 ? 'Audio detected! 🎸' : 'Play something to test...'}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartSession}
              className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold text-lg rounded-xl
                shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-shadow"
            >
              Start Session
            </motion.button>
          </div>
        )}

        {/* Active session */}
        {isStarted && (
          <>
            {/* Timer and Stats Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-6">
                {/* Recording indicator */}
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-3 h-3 bg-red-500 rounded-full"
                  />
                  <span className="text-red-400 text-sm font-medium">Recording</span>
                </div>

                {/* Timer */}
                <div className="text-3xl font-mono font-bold text-white">
                  {formatTime(sessionTime)}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Metronome indicator */}
                {settings.metronomeEnabled && metronome.isPlaying && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-lg border border-zinc-700">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4].map((b) => (
                        <motion.div
                          key={b}
                          animate={{
                            scale: metronome.beat === b ? [1, 1.4, 1] : 1,
                            opacity: metronome.beat === b ? 1 : 0.4,
                          }}
                          transition={{ duration: 0.1 }}
                          className={`w-2 h-2 rounded-full ${
                            b === 1 ? 'bg-amber-500' : 'bg-zinc-500'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-zinc-400 ml-2">{settings.tempo} BPM</span>
                  </div>
                )}

                {/* Note count */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">{noteEvents.length}</div>
                  <div className="text-xs text-zinc-500 uppercase">Notes</div>
                </div>

                {/* Input level */}
                <div className="w-24">
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${
                        inputLevel > 0.7 ? 'bg-red-500' : inputLevel > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      animate={{ width: `${inputLevel * 100}%` }}
                      transition={{ duration: 0.05 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Fretboard Visualization */}
            <Fretboard
              currentNote={currentNote}
              recentNotes={noteEvents.slice(-10)}
              style={settings.style}
              musicalKey={settings.key}
            />

            {/* End Session Button */}
            <div className="mt-8 text-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEndSession}
                disabled={sessionTime < MIN_SESSION_DURATION}
                className={`px-8 py-3 font-bold rounded-xl transition-all ${
                  sessionTime >= MIN_SESSION_DURATION
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/30 hover:shadow-xl'
                    : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                }`}
              >
                {sessionTime >= MIN_SESSION_DURATION
                  ? 'End Session & Get Feedback'
                  : `Play for ${MIN_SESSION_DURATION - sessionTime} more seconds...`}
              </motion.button>

              <p className="text-zinc-500 text-sm mt-3">
                Minimum session: {MIN_SESSION_DURATION}s • Maximum: {MAX_SESSION_DURATION / 60} minutes
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
