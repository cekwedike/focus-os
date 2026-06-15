import { motion } from 'framer-motion'

export interface HudBarDatum {
  id: string | number
  label: string
  value: number
  color?: string
  status?: string
}

interface HudMiniBarsProps {
  data: HudBarDatum[]
  maxValue?: number
  height?: number
  onBarClick?: (datum: HudBarDatum) => void
}

export function HudMiniBars({
  data,
  maxValue,
  height = 64,
  onBarClick,
}: HudMiniBarsProps): React.JSX.Element {
  const peak = maxValue ?? Math.max(1, ...data.map((d) => d.value))

  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((datum, index) => {
        const pct = peak > 0 ? (datum.value / peak) * 100 : 0
        const color = datum.color ?? '#22d3ee'
        return (
          <button
            key={datum.id}
            type="button"
            title={`${datum.label} — ${datum.status ?? ''}`}
            onClick={() => onBarClick?.(datum)}
            className="group relative flex min-w-0 flex-1 flex-col items-center justify-end gap-1 disabled:cursor-default"
            disabled={!onBarClick}
          >
            <motion.div
              className="w-full max-w-[28px] rounded-t-sm"
              style={{ background: `linear-gradient(180deg, ${color}, ${color}88)` }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(8, pct)}%` }}
              transition={{ delay: index * 0.04, duration: 0.5, ease: 'easeOut' }}
            />
            <span className="max-w-full truncate text-[9px] text-text-muted group-hover:text-accent-cyan">
              {datum.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
