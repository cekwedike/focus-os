import { motion } from 'framer-motion'

const DOT_DELAYS = [0, 0.15, 0.3]

export function TypingIndicator(): React.JSX.Element {
  return (
    <div className="flex justify-start">
      <div className="max-w-[min(100%,32rem)] rounded-panel border border-surface-border bg-surface-card px-3 py-2.5 shadow-panel sm:px-4 sm:py-3">
        <p className="focus-kicker mb-2">Assistant</p>
        <div className="flex items-center gap-1.5" aria-label="Assistant is typing">
          {DOT_DELAYS.map((delay) => (
            <motion.span
              key={delay}
              className="h-2 w-2 rounded-full bg-accent-mint/80"
              animate={{ opacity: [0.35, 1, 0.35], y: [0, -3, 0] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
