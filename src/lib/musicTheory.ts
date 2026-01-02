import type { MusicalKey, MusicalStyle, NoteEvent } from '../types';

// All note names
export const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Scale patterns (semitone intervals from root)
const SCALE_PATTERNS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonicMinor: [0, 3, 5, 7, 10],
  pentatonicMajor: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  phrygianDominant: [0, 1, 4, 5, 7, 8, 10],
};

// Style-specific scale preferences
const STYLE_SCALES: Record<MusicalStyle, (keyof typeof SCALE_PATTERNS)[]> = {
  rock: ['pentatonicMinor', 'blues', 'dorian', 'mixolydian'],
  blues: ['blues', 'pentatonicMinor', 'mixolydian'],
  metal: ['pentatonicMinor', 'phrygianDominant', 'minor', 'blues'],
};

// Get scale notes for a given key
export function getScaleNotes(key: MusicalKey, scaleType: keyof typeof SCALE_PATTERNS): string[] {
  const rootIndex = ALL_NOTES.indexOf(key);
  const pattern = SCALE_PATTERNS[scaleType];
  return pattern.map(interval => ALL_NOTES[(rootIndex + interval) % 12]);
}

// Get all acceptable notes for a style/key combination
export function getStyleNotes(style: MusicalStyle, key: MusicalKey): Set<string> {
  const scales = STYLE_SCALES[style];
  const allNotes = new Set<string>();
  
  scales.forEach(scaleType => {
    getScaleNotes(key, scaleType).forEach(note => allNotes.add(note));
  });
  
  return allNotes;
}

// Check if a note is in scale
export function isNoteInScale(note: string, style: MusicalStyle, key: MusicalKey): boolean {
  const noteName = note.replace(/[0-9]/g, ''); // Remove octave
  const styleNotes = getStyleNotes(style, key);
  return styleNotes.has(noteName);
}

// Guitar string tunings (standard: E A D G B E)
export const STANDARD_TUNING = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
export const STRING_NOTES = ['E', 'B', 'G', 'D', 'A', 'E'];

// Frequency to note conversion
const A4_FREQ = 440;
const A4_MIDI = 69;

export function frequencyToMidi(frequency: number): number {
  return 12 * Math.log2(frequency / A4_FREQ) + A4_MIDI;
}

export function midiToNoteName(midi: number): string {
  const noteIndex = Math.round(midi) % 12;
  const octave = Math.floor(Math.round(midi) / 12) - 1;
  return `${ALL_NOTES[noteIndex]}${octave}`;
}

export function frequencyToNote(frequency: number): { note: string; cents: number } {
  const midi = frequencyToMidi(frequency);
  const roundedMidi = Math.round(midi);
  const cents = Math.round((midi - roundedMidi) * 100);
  const note = midiToNoteName(roundedMidi);
  return { note, cents };
}

// Find fret position(s) for a note on guitar
export function noteToFretPositions(note: string): { string: number; fret: number }[] {
  const noteName = note.replace(/[0-9]/g, '');
  const octave = parseInt(note.match(/[0-9]+/)?.[0] || '4');
  const noteIndex = ALL_NOTES.indexOf(noteName);
  
  if (noteIndex === -1) return [];
  
  const positions: { string: number; fret: number }[] = [];
  
  // For each string, calculate which fret would produce this note
  STRING_NOTES.forEach((openNote, stringIndex) => {
    const openNoteIndex = ALL_NOTES.indexOf(openNote);
    const openOctave = parseInt(STANDARD_TUNING[stringIndex].match(/[0-9]+/)?.[0] || '4');
    
    // Calculate fret position
    const fret = noteIndex - openNoteIndex + (octave - openOctave) * 12;
    
    // Only include valid fret positions (0-24)
    if (fret >= 0 && fret <= 24) {
      positions.push({ string: stringIndex + 1, fret });
    }
  });
  
  return positions;
}

// Get the most likely fret position based on context
export function getMostLikelyFretPosition(
  note: string,
  previousPosition?: { string: number; fret: number }
): { string: number; fret: number } | null {
  const positions = noteToFretPositions(note);
  
  if (positions.length === 0) return null;
  if (positions.length === 1) return positions[0];
  
  // If we have a previous position, prefer positions on same or adjacent strings
  if (previousPosition) {
    const sortedPositions = positions.sort((a, b) => {
      const distA = Math.abs(a.string - previousPosition.string) + Math.abs(a.fret - previousPosition.fret);
      const distB = Math.abs(b.string - previousPosition.string) + Math.abs(b.fret - previousPosition.fret);
      return distA - distB;
    });
    return sortedPositions[0];
  }
  
  // Default: prefer middle positions on the neck
  return positions.sort((a, b) => {
    const scoreA = Math.abs(a.fret - 7); // Prefer frets around 5-9
    const scoreB = Math.abs(b.fret - 7);
    return scoreA - scoreB;
  })[0];
}

// Calculate scale adherence score
export function calculateScaleAdherence(
  notes: NoteEvent[],
  style: MusicalStyle,
  key: MusicalKey
): number {
  if (notes.length === 0) return 100;
  
  const styleNotes = getStyleNotes(style, key);
  let inScaleCount = 0;
  
  notes.forEach(event => {
    const noteName = event.note.replace(/[0-9]/g, '');
    if (styleNotes.has(noteName)) {
      inScaleCount++;
    }
  });
  
  return Math.round((inScaleCount / notes.length) * 100);
}

// Calculate timing accuracy based on tempo
export function calculateTimingAccuracy(notes: NoteEvent[], tempo: number): number {
  if (notes.length < 2) return 100;
  
  const beatDuration = 60000 / tempo; // ms per beat
  const subdivisions = [beatDuration, beatDuration / 2, beatDuration / 4, beatDuration / 3];
  
  let totalDeviation = 0;
  
  for (let i = 1; i < notes.length; i++) {
    const interval = notes[i].timestamp - notes[i - 1].timestamp;
    
    // Find closest subdivision
    let minDeviation = Infinity;
    subdivisions.forEach(sub => {
      const remainder = interval % sub;
      const deviation = Math.min(remainder, sub - remainder);
      minDeviation = Math.min(minDeviation, deviation / sub);
    });
    
    totalDeviation += minDeviation;
  }
  
  const avgDeviation = totalDeviation / (notes.length - 1);
  return Math.round(Math.max(0, (1 - avgDeviation * 2)) * 100);
}

// Calculate pitch control based on cents deviation
export function calculatePitchControl(notes: NoteEvent[]): number {
  if (notes.length === 0) return 100;
  
  // Allow for vibrato and bends - only penalize excessive deviation
  const tolerableDeviation = 35; // cents
  
  let totalScore = 0;
  
  notes.forEach(event => {
    const absCents = Math.abs(event.cents);
    if (absCents <= tolerableDeviation) {
      totalScore += 100;
    } else if (absCents <= 50) {
      // Minor deviation - still good for vibrato/bends
      totalScore += 90;
    } else {
      // Score decreases as deviation increases
      totalScore += Math.max(0, 100 - (absCents - tolerableDeviation) * 2);
    }
  });
  
  return Math.round(totalScore / notes.length);
}

// Calculate phrase consistency (looking at note groupings and rests)
export function calculatePhraseConsistency(notes: NoteEvent[]): number {
  if (notes.length < 4) return 100;
  
  // Analyze gaps between notes to identify phrases
  const gaps: number[] = [];
  for (let i = 1; i < notes.length; i++) {
    gaps.push(notes[i].timestamp - notes[i - 1].timestamp);
  }
  
  // Calculate variance in gaps
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance = gaps.reduce((acc, gap) => acc + Math.pow(gap - avgGap, 2), 0) / gaps.length;
  const stdDev = Math.sqrt(variance);
  
  // High consistency = low relative standard deviation
  const relativeStdDev = stdDev / avgGap;
  
  // Score based on how consistent the phrasing is
  // Some variation is musical, but too much is chaotic
  if (relativeStdDev < 0.3) return 100;
  if (relativeStdDev < 0.5) return 90;
  if (relativeStdDev < 0.8) return 75;
  if (relativeStdDev < 1.2) return 60;
  return Math.max(40, Math.round(100 - relativeStdDev * 30));
}




