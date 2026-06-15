import { motion, useReducedMotion } from 'framer-motion'

export function HudScanline(): React.JSX.Element {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return null
  }

  return (
    <motion.div
      className="pointer-events-none absolute left-0 right-0 z-[2] h-px bg-gradient-to-r from-transparent via-accent-cyan/70 to-transparent"
      aria-hidden="true"
      initial={{ top: '0%', opacity: 0 }}
      animate={{ top: ['0%', '100%'], opacity: [0, 0.5, 0.35, 0] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: 'linear' }}
    />
  )
}
