import { motion, useReducedMotion } from 'framer-motion'

interface HudWaveformProps {
  bars?: number
  active?: boolean
  className?: string
}

export function HudWaveform({
  bars = 12,
  active = true,
  className = '',
}: HudWaveformProps): React.JSX.Element {
  const reduceMotion = useReducedMotion()

  return (
    <div className={`flex h-9 items-end justify-center gap-0.5 ${className}`} aria-hidden="true">
      {Array.from({ length: bars }, (_, index) => {
        const baseHeight = 28 + (index % 5) * 10

        if (reduceMotion) {
          return (
            <span
              key={index}
              className="w-1 rounded-full bg-gradient-to-t from-accent-cyan/40 to-accent-mint"
              style={{ height: `${baseHeight}%`, opacity: active ? 1 : 0.4 }}
            />
          )
        }

        return (
          <motion.span
            key={index}
            className="block w-1 rounded-full bg-gradient-to-t from-accent-cyan/40 to-accent-mint"
            style={{ height: `${baseHeight}%`, transformOrigin: 'bottom center' }}
            animate={{
              scaleY: active ? [0.35, 1, 0.5, 0.9, 0.35] : [0.4, 0.65, 0.4],
              opacity: active ? [0.55, 1, 0.7, 1, 0.55] : [0.35, 0.55, 0.35],
            }}
            transition={{
              duration: active ? 1.1 + (index % 3) * 0.15 : 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: index * 0.07,
            }}
          />
        )
      })}
    </div>
  )
}
