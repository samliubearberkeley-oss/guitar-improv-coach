import { useState, useEffect, useRef, useCallback } from 'react';

interface UseMetronomeReturn {
  isPlaying: boolean;
  beat: number; // Current beat (1-4)
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

// Generate a metronome tick sound using Web Audio API
function createTickSound(audioContext: AudioContext, isAccent: boolean = false): AudioBufferSourceNode {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.05; // 50ms
  const frequency = isAccent ? 800 : 600; // Higher pitch for accent
  
  const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  
  // Generate a short beep with a quick attack and decay
  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 20); // Quick decay
    data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * (isAccent ? 0.8 : 0.6);
  }
  
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  
  return source;
}

export function useMetronome(tempo: number, enabled: boolean = true): UseMetronomeReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const beatRef = useRef(0);
  const tempoRef = useRef(tempo);
  const enabledRef = useRef(enabled);
  
  // Keep refs in sync with props
  useEffect(() => {
    tempoRef.current = tempo;
  }, [tempo]);
  
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  
  // Initialize audio context
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);
  
  // Play tick sound
  const playTick = useCallback(() => {
    if (!audioContextRef.current || !enabledRef.current) return;
    
    // Resume audio context if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    beatRef.current = (beatRef.current % 4) + 1;
    setBeat(beatRef.current);
    
    const isAccent = beatRef.current === 1; // Accent on beat 1
    const source = createTickSound(audioContextRef.current, isAccent);
    source.start(0);
  }, []);
  
  // Stop metronome - defined without dependencies to avoid circular refs
  const stopMetronome = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    setBeat(0);
    beatRef.current = 0;
  }, []);
  
  // Start metronome
  const startMetronome = useCallback(() => {
    if (!audioContextRef.current) return;
    
    // Resume audio context if needed
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    // Clear any existing interval
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }
    
    setIsPlaying(true);
    beatRef.current = 0;
    setBeat(0);
    
    // Calculate interval in milliseconds
    const intervalMs = (60 / tempoRef.current) * 1000;
    
    // Play first tick immediately
    playTick();
    
    // Set up interval for subsequent ticks
    intervalRef.current = window.setInterval(() => {
      playTick();
    }, intervalMs);
  }, [playTick]);
  
  // Toggle metronome
  const toggle = useCallback(() => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  }, [isPlaying, startMetronome, stopMetronome]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Update interval when tempo changes while playing
  useEffect(() => {
    if (!isPlaying || intervalRef.current === null) return;
    
    // Clear old interval and start new one with updated tempo
    clearInterval(intervalRef.current);
    
    const intervalMs = (60 / tempo) * 1000;
    intervalRef.current = window.setInterval(() => {
      playTick();
    }, intervalMs);
  }, [tempo, isPlaying, playTick]);
  
  return {
    isPlaying,
    beat,
    start: startMetronome,
    stop: stopMetronome,
    toggle,
  };
}
