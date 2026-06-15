import { useId } from 'react'
import { motion } from 'framer-motion'

interface HudRingGaugeProps {
  value: number
  max?: number
  size?: number
  stroke?: number
  label?: string
  color?: string
  active?: boolean
}

export function HudRingGauge({
  value,
  max = 100,
  size = 72,
  stroke = 5,
  label,
  color = '#00e5a8',
  active = true,
}: HudRingGaugeProps): React.JSX.Element {
  const gradientId = useId()
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(max, value))
  const progress = max > 0 ? clamped / max : 0
  const offset = circumference * (1 - progress)
  const center = size / 2

  return (
    <div className="relative inline-flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(120,160,220,0.15)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference, opacity: 0.7 }}
          animate={{
            strokeDashoffset: offset,
            opacity: active ? [0.65, 1, 0.65] : 0.45,
          }}
          transition={{
            strokeDashoffset: { duration: 0.9, ease: 'easeOut' },
            opacity: active
              ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.3 },
          }}
          style={{ filter: active ? `drop-shadow(0 0 6px ${color})` : undefined }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-mono text-sm font-semibold tabular-nums text-text-primary"
        style={{ fontSize: size < 64 ? 11 : 13 }}
      >
        {max === 100 ? `${Math.round(progress * 100)}` : Math.round(clamped)}
      </div>
      {label ? <span className="text-[10px] tracking-wide text-text-muted">{label}</span> : null}
    </div>
  )
}
