import { motion, useReducedMotion } from 'framer-motion'

interface HudOrbProps {
  active?: boolean
  size?: number
}

export function HudOrb({ active = false, size = 56 }: HudOrbProps): React.JSX.Element {
  const reduceMotion = useReducedMotion()
  const inner = Math.max(8, size - 10)

  if (reduceMotion) {
    return (
      <div
        className={active ? 'hud-orb hud-orb-active' : 'hud-orb hud-orb-idle'}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: active
            ? 'conic-gradient(from 0deg, transparent 0%, rgba(0,229,168,0.9) 18%, rgba(34,211,238,0.7) 32%, transparent 50%)'
            : 'conic-gradient(from 0deg, transparent 0%, rgba(100,116,139,0.5) 25%, transparent 45%)',
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: active ? 2.8 : 6,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className={`relative rounded-full ${active ? 'hud-orb hud-orb-active' : 'hud-orb hud-orb-idle'}`}
        style={{ width: inner, height: inner }}
        animate={
          active
            ? {
                scale: [1, 1.08, 1],
                boxShadow: [
                  '0 0 20px rgba(0, 229, 168, 0.35)',
                  '0 0 36px rgba(34, 211, 238, 0.55)',
                  '0 0 20px rgba(0, 229, 168, 0.35)',
                ],
              }
            : { scale: [1, 1.05, 1], opacity: [0.6, 0.85, 0.6] }
        }
        transition={{
          duration: active ? 2.2 : 3.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}
