import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { NoteEvent, MusicalStyle, MusicalKey } from '../types';
import { getMostLikelyFretPosition, isNoteInScale, STRING_NOTES, ALL_NOTES } from '../lib/musicTheory';

interface FretboardProps {
  currentNote: NoteEvent | null;
  recentNotes: NoteEvent[];
  style: MusicalStyle;
  musicalKey: MusicalKey;
}

const FRET_COUNT = 15;
const STRING_COUNT = 6;

// Fret marker positions
const FRET_MARKERS = [3, 5, 7, 9, 12, 15];
const DOUBLE_MARKERS = [12];

export function Fretboard({ currentNote, recentNotes, style, musicalKey }: FretboardProps) {
  // Calculate current fret position
  const currentPosition = useMemo(() => {
    if (!currentNote) return null;
    return getMostLikelyFretPosition(currentNote.note);
  }, [currentNote]);

  // Get recent positions for trail effect
  const recentPositions = useMemo(() => {
    const last5 = recentNotes.slice(-5);
    return last5.map(note => ({
      ...getMostLikelyFretPosition(note.note),
      inScale: isNoteInScale(note.note, style, musicalKey),
      timestamp: note.timestamp,
    })).filter(p => p !== null);
  }, [recentNotes, style, musicalKey]);

  // Check if current note is in scale
  const currentInScale = currentNote ? isNoteInScale(currentNote.note, style, musicalKey) : true;

  // Generate note grid for fretboard overlay
  const noteGrid = useMemo(() => {
    const grid: { string: number; fret: number; note: string; inScale: boolean }[] = [];
    
    for (let string = 0; string < STRING_COUNT; string++) {
      const openNoteIndex = ALL_NOTES.indexOf(STRING_NOTES[string]);
      
      for (let fret = 0; fret <= FRET_COUNT; fret++) {
        const noteIndex = (openNoteIndex + fret) % 12;
        const note = ALL_NOTES[noteIndex];
        const inScale = isNoteInScale(note, style, musicalKey);
        
        grid.push({ string: string + 1, fret, note, inScale });
      }
    }
    
    return grid;
  }, [style, musicalKey]);

  return (
    <div className="relative w-full">
      {/* Fretboard Container */}
      <div className="relative bg-gradient-to-b from-amber-950 to-amber-900 rounded-lg overflow-hidden shadow-2xl border border-amber-800/50">
        {/* Nut */}
        <div className="absolute left-[4%] top-0 bottom-0 w-2 bg-gradient-to-r from-stone-200 to-stone-300 shadow-lg z-10" />
        
        {/* Fretboard surface */}
        <div 
          className="relative"
          style={{ 
            paddingLeft: '5%',
            paddingRight: '2%',
          }}
        >
          {/* Fret markers */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: FRET_COUNT + 1 }, (_, fret) => {
              const isMarker = FRET_MARKERS.includes(fret);
              const isDouble = DOUBLE_MARKERS.includes(fret);
              
              if (!isMarker) return null;
              
              return (
                <div
                  key={fret}
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ left: `${((fret - 0.5) / FRET_COUNT) * 95 + 5}%` }}
                >
                  {isDouble ? (
                    <div className="flex flex-col gap-8">
                      <div className="w-4 h-4 rounded-full bg-stone-300/60" />
                      <div className="w-4 h-4 rounded-full bg-stone-300/60" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-stone-300/40" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Strings and Frets Grid */}
          <div className="relative py-6">
            {/* Fret lines */}
            {Array.from({ length: FRET_COUNT + 1 }, (_, fret) => (
              <div
                key={`fret-${fret}`}
                className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-stone-400 via-stone-300 to-stone-400"
                style={{ left: `${(fret / FRET_COUNT) * 95 + 5}%` }}
              />
            ))}

            {/* Strings */}
            {Array.from({ length: STRING_COUNT }, (_, string) => (
              <div
                key={`string-${string}`}
                className="relative h-8 flex items-center"
              >
                {/* String line */}
                <div 
                  className="absolute left-0 right-0 rounded-full"
                  style={{
                    height: `${2 + string * 0.5}px`,
                    background: `linear-gradient(to bottom, #d4d4d4, #a3a3a3, #737373)`,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  }}
                />

                {/* String label */}
                <div className="absolute -left-6 w-5 text-center text-xs font-mono text-amber-200/60">
                  {STRING_NOTES[string]}
                </div>
              </div>
            ))}

            {/* Scale note indicators (subtle) */}
            {noteGrid.filter(n => n.inScale).map(({ string, fret, note }) => (
              <div
                key={`scale-${string}-${fret}`}
                className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                style={{
                  left: `${((fret - 0.5) / FRET_COUNT) * 95 + 5}%`,
                  top: `${((string - 0.5) / STRING_COUNT) * 100}%`,
                }}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
                <span className="absolute text-[8px] text-emerald-400/40 font-medium">
                  {note}
                </span>
              </div>
            ))}

            {/* Recent note trail */}
            <AnimatePresence>
              {recentPositions.map((pos, idx) => pos && (
                <motion.div
                  key={`trail-${pos.timestamp}`}
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 0.6, opacity: 0.2 }}
                  exit={{ scale: 0.3, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    left: `${((pos.fret - 0.5) / FRET_COUNT) * 95 + 5}%`,
                    top: `${((pos.string - 0.5) / STRING_COUNT) * 100}%`,
                    background: pos.inScale 
                      ? 'radial-gradient(circle, rgba(52, 211, 153, 0.4), transparent)'
                      : 'radial-gradient(circle, rgba(251, 146, 60, 0.4), transparent)',
                    zIndex: idx,
                  }}
                />
              ))}
            </AnimatePresence>

            {/* Current note indicator */}
            <AnimatePresence>
              {currentPosition && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 z-20"
                  style={{
                    left: `${((currentPosition.fret - 0.5) / FRET_COUNT) * 95 + 5}%`,
                    top: `${((currentPosition.string - 0.5) / STRING_COUNT) * 100}%`,
                  }}
                >
                  {/* Glow effect */}
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.3, 0.8] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className={`absolute inset-0 rounded-full ${
                      currentInScale ? 'bg-emerald-400' : 'bg-orange-400'
                    } blur-md`}
                  />
                  
                  {/* Main indicator */}
                  <div className={`relative w-full h-full rounded-full flex items-center justify-center
                    ${currentInScale 
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/50' 
                      : 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-500/50'
                    } shadow-lg border-2 border-white/30`}
                  >
                    <span className="text-white font-bold text-sm drop-shadow-lg">
                      {currentNote?.note.replace(/[0-9]/g, '')}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Fret numbers */}
          <div className="flex justify-between px-2 pb-2">
            {Array.from({ length: FRET_COUNT + 1 }, (_, fret) => (
              <span 
                key={`fret-num-${fret}`} 
                className="text-xs text-amber-200/40 font-mono"
                style={{ width: `${95 / FRET_COUNT}%`, textAlign: 'center' }}
              >
                {fret}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Current Note Display */}
      <div className="mt-4 flex items-center justify-center gap-8">
        <div className="text-center">
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Note</div>
          <div className={`text-3xl font-bold ${currentNote ? 'text-white' : 'text-zinc-600'}`}>
            {currentNote?.note || '--'}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Cents</div>
          <div className={`text-xl font-mono ${
            currentNote 
              ? Math.abs(currentNote.cents) < 15 
                ? 'text-emerald-400' 
                : Math.abs(currentNote.cents) < 35 
                  ? 'text-amber-400' 
                  : 'text-orange-400'
              : 'text-zinc-600'
          }`}>
            {currentNote ? `${currentNote.cents > 0 ? '+' : ''}${currentNote.cents}` : '--'}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Status</div>
          <div className={`text-sm font-medium px-3 py-1 rounded-full ${
            !currentNote 
              ? 'bg-zinc-800 text-zinc-500'
              : currentInScale 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
          }`}>
            {!currentNote ? 'Waiting' : currentInScale ? 'In Scale' : 'Color Tone'}
          </div>
        </div>
      </div>
    </div>
  );
}


