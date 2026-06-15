import { motion, useReducedMotion } from 'framer-motion'

interface HudOrbProps {
  active?: boolean
  size?: number
}

export function HudOrb({ active = false, size = 56 }: HudOrbProps): React.JSX.Element {
  const reduceMotion = useReducedMotion()

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
    <motion.div
      className={active ? 'hud-orb hud-orb-active' : 'hud-orb hud-orb-idle'}
      style={{ width: size, height: size, transformStyle: 'preserve-3d' }}
      aria-hidden="true"
      animate={
        active
          ? {
              rotateY: [0, 360],
              scale: [1, 1.06, 1],
              boxShadow: [
                '0 0 24px rgba(0, 229, 168, 0.35)',
                '0 0 42px rgba(34, 211, 238, 0.55)',
                '0 0 24px rgba(0, 229, 168, 0.35)',
              ],
            }
          : {
              scale: [1, 1.04, 1],
              opacity: [0.65, 0.9, 0.65],
            }
      }
      transition={
        active
          ? {
              rotateY: { duration: 5, repeat: Infinity, ease: 'linear' },
              scale: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
              boxShadow: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
            }
          : {
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }
      }
    />
  )
}
