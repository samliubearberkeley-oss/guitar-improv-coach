// Music Types
export type MusicalStyle = 'rock' | 'blues' | 'metal';

export type MusicalKey = 
  | 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' 
  | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export interface SessionSettings {
  style: MusicalStyle;
  key: MusicalKey;
  tempo: number;
  metronomeEnabled?: boolean;
}

// Note Detection Types
export interface NoteEvent {
  note: string;
  frequency: number;
  timestamp: number;
  confidence: number;
  cents: number; // deviation from perfect pitch
  velocity: number;
}

export interface FretPosition {
  string: number; // 1-6 (high E to low E)
  fret: number;   // 0-24
  note: string;
}

// Scoring Types
export interface ScoreMetrics {
  scaleAdherence: number;
  timingAccuracy: number;
  pitchControl: number;
  phraseConsistency: number;
  styleMatch: number;
}

export interface SessionResult {
  overallScore: number;
  metrics: ScoreMetrics;
  feedback: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  noteEvents: NoteEvent[];
  duration: number;
}

// App State Types
export type AppView = 'setup' | 'playing' | 'results';

export interface AudioState {
  isListening: boolean;
  hasPermission: boolean | null;
  inputLevel: number;
  error: string | null;
}

