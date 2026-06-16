import { motion } from 'framer-motion'
import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { ExecutionHudCard } from './cards/ExecutionHudCard'
import { QueueHudCard } from './cards/QueueHudCard'
import { FocusHudCard } from './cards/FocusHudCard'
import { FaithHudCard } from './cards/FaithHudCard'
import { BreakHudCard } from './cards/BreakHudCard'
import { StalenessHudCard } from './cards/StalenessHudCard'
import { HudScanline } from './HudScanline'
import './hud.css'

export function HudTelemetryPanel(): React.JSX.Element {
  const { loading, dayBundle } = useScheduleContext()

  const blockCount = dayBundle?.blocks.length ?? 0

  return (
    <aside className="hud-shell flex h-full min-h-0 w-full flex-col overflow-hidden border-l border-accent-cyan/15">
      <HudScanline />

      <header className="relative z-10 shrink-0 border-b border-accent-cyan/15 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="hud-kicker">Day Telemetry</p>
            <h2 className="font-display text-sm font-bold tracking-wide text-gradient-mint sm:text-base">
              Systems Overview
            </h2>
          </div>
          <div className="text-right">
            <p className="hud-kicker">Schedule</p>
            <p className="font-mono text-xs text-text-muted">
              {loading ? 'Syncing...' : `${blockCount} Blocks`}
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
