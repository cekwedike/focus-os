import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'
import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { ExecutionHudCard } from './cards/ExecutionHudCard'
import { QueueHudCard } from './cards/QueueHudCard'
import { FocusHudCard } from './cards/FocusHudCard'
import { FaithHudCard } from './cards/FaithHudCard'
import { BreakHudCard } from './cards/BreakHudCard'
import { StalenessHudCard } from './cards/StalenessHudCard'
import './jarvis.css'

export function JarvisTelemetryPanel(): React.JSX.Element {
  const { formatClock } = useDisplayPreferences()
  const { loading, dayBundle } = useScheduleContext()
  const [clock, setClock] = useState(() => formatClock(new Date(), false))

  useEffect(() => {
    const id = window.setInterval(() => setClock(formatClock(new Date(), false)), 1000)
    return () => window.clearInterval(id)
  }, [formatClock])

  const blockCount = dayBundle?.blocks.length ?? 0

  return (
    <aside className="jarvis-hud flex h-full min-h-0 w-full flex-col overflow-hidden border-l border-accent-cyan/15">
      <div className="jarvis-scanline" aria-hidden="true" />

      <header className="relative z-10 shrink-0 border-b border-accent-cyan/15 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="jarvis-kicker">Telemetry array</p>
            <h2 className="font-display text-sm font-bold tracking-wide text-text-primary sm:text-base">
              <span className="text-gradient-mint">J.A.R.V.I.S</span>
              <span className="text-text-muted"> // HUD</span>
            </h2>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm tabular-nums text-accent-cyan">{clock}</p>
            <p className="text-[10px] text-text-muted">
              {loading ? 'Syncing...' : `${blockCount} blocks`}
            </p>
          </div>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3">
          <ExecutionHudCard />
          <QueueHudCard />
          <FocusHudCard />
          <FaithHudCard />
          <BreakHudCard />
          <div className="col-span-full sm:col-span-2">
            <StalenessHudCard />
          </div>
        </div>
      </motion.div>
    </aside>
  )
}
