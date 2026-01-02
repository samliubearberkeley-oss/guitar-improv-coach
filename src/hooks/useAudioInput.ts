import { useState, useCallback, useRef, useEffect } from 'react';
import type { AudioState, NoteEvent } from '../types';
import { frequencyToNote } from '../lib/musicTheory';

// Autocorrelation-based pitch detection (YIN-inspired)
function detectPitch(buffer: Float32Array, sampleRate: number): { frequency: number; confidence: number } | null {
  const SIZE = buffer.length;
  const threshold = 0.1;
  
  // Calculate RMS to check if there's enough signal
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);
  
  if (rms < 0.01) return null; // Too quiet
  
  // Autocorrelation
  const correlations = new Float32Array(SIZE);
  
  for (let lag = 0; lag < SIZE; lag++) {
    let correlation = 0;
    for (let i = 0; i < SIZE - lag; i++) {
      correlation += buffer[i] * buffer[i + lag];
    }
    correlations[lag] = correlation;
  }
  
  // Find the first peak after the initial decrease
  let foundPeak = false;
  let peakLag = 0;
  let peakValue = 0;
  
  // Skip lag 0 and find first local minimum, then find peak after it
  let minLag = 0;
  let minValue = correlations[0];
  
  // Find minimum (fundamental period starts after this)
  for (let i = 1; i < SIZE / 2; i++) {
    if (correlations[i] < minValue) {
      minValue = correlations[i];
      minLag = i;
    }
    if (correlations[i] > correlations[i - 1] && minLag > 0) {
      break;
    }
  }
  
  // Find peak after minimum
  for (let i = minLag; i < SIZE / 2; i++) {
    if (correlations[i] > peakValue) {
      peakValue = correlations[i];
      peakLag = i;
      foundPeak = true;
    }
    if (foundPeak && correlations[i] < peakValue * 0.9) {
      break;
    }
  }
  
  if (!foundPeak || peakLag === 0) return null;
  
  // Calculate confidence
  const confidence = peakValue / correlations[0];
  
  if (confidence < threshold) return null;
  
  // Parabolic interpolation for better precision
  const y1 = correlations[peakLag - 1] || 0;
  const y2 = correlations[peakLag];
  const y3 = correlations[peakLag + 1] || 0;
  
  const refinedLag = peakLag + (y1 - y3) / (2 * (y1 - 2 * y2 + y3) || 1);
  
  const frequency = sampleRate / refinedLag;
  
  // Guitar range: ~80Hz (low E) to ~1300Hz (high E 24th fret)
  if (frequency < 70 || frequency > 1400) return null;
  
  return { frequency, confidence };
}

interface UseAudioInputReturn {
  audioState: AudioState;
  noteEvents: NoteEvent[];
  currentNote: NoteEvent | null;
  inputLevel: number;
  startListening: () => Promise<void>;
  stopListening: () => void;
  clearNotes: () => void;
}

export function useAudioInput(): UseAudioInputReturn {
  const [audioState, setAudioState] = useState<AudioState>({
    isListening: false,
    hasPermission: null,
    inputLevel: 0,
    error: null,
  });
  
  const [noteEvents, setNoteEvents] = useState<NoteEvent[]>([]);
  const [currentNote, setCurrentNote] = useState<NoteEvent | null>(null);
  const [inputLevel, setInputLevel] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastNoteRef = useRef<string | null>(null);
  const lastNoteTimeRef = useRef<number>(0);
  const sessionStartRef = useRef<number>(0);
  
  const processAudio = useCallback(() => {
    if (!analyserRef.current) return;
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    
    analyser.getFloatTimeDomainData(buffer);
    
    // Calculate input level
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / bufferLength);
    const level = Math.min(1, rms * 10); // Scale for visualization
    setInputLevel(level);
    
    // Detect pitch
    const pitchResult = detectPitch(buffer, audioContextRef.current!.sampleRate);
    
    if (pitchResult && pitchResult.confidence > 0.15) {
      const { note, cents } = frequencyToNote(pitchResult.frequency);
      const now = Date.now();
      const timestamp = now - sessionStartRef.current;
      
      // Debounce: only register if different note or 100ms passed
      if (note !== lastNoteRef.current || now - lastNoteTimeRef.current > 100) {
        const noteEvent: NoteEvent = {
          note,
          frequency: pitchResult.frequency,
          timestamp,
          confidence: pitchResult.confidence,
          cents,
          velocity: level,
        };
        
        setCurrentNote(noteEvent);
        setNoteEvents(prev => [...prev, noteEvent]);
        
        lastNoteRef.current = note;
        lastNoteTimeRef.current = now;
      }
    } else {
      // No clear pitch detected
      if (Date.now() - lastNoteTimeRef.current > 300) {
        setCurrentNote(null);
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(processAudio);
  }, []);
  
  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      
      streamRef.current = stream;
      
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.1;
      
      source.connect(analyser);
      analyserRef.current = analyser;
      
      sessionStartRef.current = Date.now();
      lastNoteRef.current = null;
      lastNoteTimeRef.current = 0;
      
      setAudioState({
        isListening: true,
        hasPermission: true,
        inputLevel: 0,
        error: null,
      });
      
      processAudio();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to access microphone';
      setAudioState(prev => ({
        ...prev,
        hasPermission: false,
        error: message,
      }));
    }
  }, [processAudio]);
  
  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    setCurrentNote(null);
    setInputLevel(0);
    
    setAudioState(prev => ({
      ...prev,
      isListening: false,
      inputLevel: 0,
    }));
  }, []);
  
  const clearNotes = useCallback(() => {
    setNoteEvents([]);
    setCurrentNote(null);
    lastNoteRef.current = null;
    lastNoteTimeRef.current = 0;
    sessionStartRef.current = Date.now();
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);
  
  return {
    audioState,
    noteEvents,
    currentNote,
    inputLevel,
    startListening,
    stopListening,
    clearNotes,
  };
}


