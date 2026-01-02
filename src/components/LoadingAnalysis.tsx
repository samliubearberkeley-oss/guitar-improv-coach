import { motion } from 'motion/react';

const loadingMessages = [
  'Analyzing your improvisation...',
  'Evaluating scale choices...',
  'Measuring timing accuracy...',
  'Assessing pitch control...',
  'Checking phrase consistency...',
  'Matching to style characteristics...',
  'Generating personalized feedback...',
];

export function LoadingAnalysis() {
  return (
    <div className="max-w-md mx-auto text-center py-20">
      {/* Animated guitar pick */}
      <motion.div
        animate={{
          rotate: [0, 10, -10, 0],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="text-6xl mb-8"
      >
        🎸
      </motion.div>

      {/* Loading spinner */}
      <div className="relative w-20 h-20 mx-auto mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-2 border-4 border-transparent border-t-orange-500 rounded-full"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-4 border-4 border-transparent border-t-amber-400 rounded-full"
        />
      </div>

      {/* Animated messages */}
      <div className="h-8 overflow-hidden">
        <motion.div
          animate={{ y: ['0%', '-700%'] }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {loadingMessages.map((msg, idx) => (
            <div key={idx} className="h-8 flex items-center justify-center text-zinc-400">
              {msg}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            className="w-2 h-2 bg-amber-500 rounded-full"
          />
        ))}
      </div>
    </div>
  );
}


