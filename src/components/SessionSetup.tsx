import { motion } from 'motion/react';
import type { MusicalStyle, MusicalKey, SessionSettings } from '../types';
import { useMetronome } from '../hooks/useMetronome';

interface SessionSetupProps {
  settings: SessionSettings;
  onSettingsChange: (settings: SessionSettings) => void;
  onStart: () => void;
}

const STYLES: { value: MusicalStyle; label: string; description: string; color: string }[] = [
  { 
    value: 'rock', 
    label: 'Rock', 
    description: 'Pentatonic & Blues scale freedom',
    color: 'from-red-500 to-orange-500'
  },
  { 
    value: 'blues', 
    label: 'Blues', 
    description: 'Expressive bends & blue notes',
    color: 'from-blue-500 to-indigo-500'
  },
  { 
    value: 'metal', 
    label: 'Metal', 
    description: 'Technical precision & power',
    color: 'from-purple-500 to-pink-500'
  },
];

const KEYS: MusicalKey[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const TEMPOS = [60, 80, 100, 120, 140, 160, 180];

export function SessionSetup({ settings, onSettingsChange, onStart }: SessionSetupProps) {
  const metronome = useMetronome(settings.tempo, settings.metronomeEnabled ?? false);
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent mb-3">
          Guitar Improv Coach
        </h1>
        <p className="text-zinc-400 text-lg">
          Play freely. Get intelligent feedback.
        </p>
      </motion.div>

      {/* Style Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <label className="block text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">
          Style
        </label>
        <div className="grid grid-cols-3 gap-4">
          {STYLES.map((style) => (
            <button
              key={style.value}
              onClick={() => onSettingsChange({ ...settings, style: style.value })}
              className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                settings.style === style.value
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
              }`}
            >
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${style.color} opacity-0 ${
                settings.style === style.value ? 'opacity-10' : 'group-hover:opacity-5'
              } transition-opacity`} />
              <div className="relative">
                <div className={`text-xl font-bold mb-1 ${
                  settings.style === style.value ? 'text-white' : 'text-zinc-300'
                }`}>
                  {style.label}
                </div>
                <div className="text-xs text-zinc-500">
                  {style.description}
                </div>
              </div>
              {settings.style === style.value && (
                <motion.div
                  layoutId="style-indicator"
                  className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Key Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <label className="block text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">
          Key
        </label>
        <div className="flex flex-wrap gap-2">
          {KEYS.map((key) => (
            <button
              key={key}
              onClick={() => onSettingsChange({ ...settings, key })}
              className={`w-12 h-12 rounded-lg font-bold text-lg transition-all duration-200 ${
                settings.key === key
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                  : key.includes('#')
                    ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-700'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tempo Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <label className="block text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">
          Reference Tempo: <span className="text-amber-400">{settings.tempo} BPM</span>
        </label>
        <div className="relative">
          <input
            type="range"
            min={40}
            max={200}
            step={5}
            value={settings.tempo}
            onChange={(e) => onSettingsChange({ ...settings, tempo: parseInt(e.target.value) })}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-6
              [&::-webkit-slider-thumb]:h-6
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-amber-500
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:shadow-amber-500/50
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-110"
          />
          <div className="flex justify-between mt-2">
            {TEMPOS.map(tempo => (
              <button
                key={tempo}
                onClick={() => onSettingsChange({ ...settings, tempo })}
                className={`text-xs ${
                  settings.tempo === tempo ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-400'
                }`}
              >
                {tempo}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Metronome Control */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-zinc-300">Metronome</div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Beat indicator */}
            {metronome.isPlaying && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((b) => (
                  <motion.div
                    key={b}
                    animate={{
                      scale: metronome.beat === b ? [1, 1.3, 1] : 1,
                      opacity: metronome.beat === b ? [1, 0.8, 1] : 0.3,
                    }}
                    transition={{ duration: 0.1 }}
                    className={`w-3 h-3 rounded-full ${
                      b === 1 ? 'bg-amber-500' : 'bg-zinc-600'
                    }`}
                  />
                ))}
              </div>
            )}
            
            {/* Toggle button */}
            <button
              onClick={() => {
                const newEnabled = !(settings.metronomeEnabled ?? false);
                onSettingsChange({ ...settings, metronomeEnabled: newEnabled });
                if (newEnabled) {
                  metronome.start();
                } else {
                  metronome.stop();
                }
              }}
              className={`relative px-6 py-2 rounded-lg font-medium text-sm transition-all ${
                settings.metronomeEnabled
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700'
              }`}
            >
              {settings.metronomeEnabled ? '🔊 On' : '🔇 Off'}
              {metronome.isPlaying && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                />
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStart}
          className="px-12 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-lg rounded-xl
            shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-shadow"
        >
          Start Jamming
        </motion.button>
        <p className="text-zinc-500 text-sm mt-4">
          Make sure your guitar is connected and you're in a quiet space
        </p>
      </motion.div>
    </div>
  );
}

