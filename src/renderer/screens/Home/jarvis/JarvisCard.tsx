import { useRef, type ReactNode, type MouseEvent } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

interface HudCardProps {
  children: ReactNode
  className?: string
  expanded?: boolean
  onClick?: () => void
  span?: 'full' | 'half'
  accent?: 'mint' | 'cyan' | 'amber' | 'violet'
}

const accentBorder: Record<NonNullable<HudCardProps['accent']>, string> = {
  mint: 'hover:border-accent-mint/50',
  cyan: 'hover:border-accent-cyan/50',
  amber: 'hover:border-accent-amber/50',
  violet: 'hover:border-accent-violet/50',
}

export function HudCard({
  children,
  className = '',
  expanded = false,
  onClick,
  span = 'half',
  accent = 'cyan',
}: HudCardProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springX = useSpring(rotateX, { stiffness: 260, damping: 22 })
  const springY = useSpring(rotateY, { stiffness: 260, damping: 22 })

  const handleMove = (event: MouseEvent<HTMLDivElement>): void => {
    if (reduceMotion || !ref.current) {
      return
    }
    const rect = ref.current.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    rotateY.set(x * 8)
    rotateX.set(-y * 8)
  }

  const handleLeave = (): void => {
    rotateX.set(0)
    rotateY.set(0)
  }

  const spanClass = span === 'full' ? 'col-span-full' : 'col-span-1'

  return (
    <div
      ref={ref}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`hud-card rounded-panel ${spanClass} ${accentBorder[accent]} ${
        expanded ? 'hud-card-expanded' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <span className="hud-corner-bracket hud-corner-tl" aria-hidden="true" />
      <span className="hud-corner-bracket hud-corner-tr" aria-hidden="true" />
      <span className="hud-corner-bracket hud-corner-bl" aria-hidden="true" />
      <span className="hud-corner-bracket hud-corner-br" aria-hidden="true" />
      <motion.div
        className="relative p-3 sm:p-4"
        style={
          reduceMotion
            ? undefined
            : {
                rotateX: springX,
                rotateY: springY,
                transformPerspective: 900,
              }
        }
        whileTap={onClick ? { scale: 0.985 } : undefined}
      >
        {children}
      </motion.div>
    </div>
  )
}

/** @deprecated Use HudCard */
export const JarvisCard = HudCard
