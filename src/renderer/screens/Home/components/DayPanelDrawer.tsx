import { motion } from 'framer-motion'
import { HudTelemetryPanel } from '../hud/HudTelemetryPanel'

interface DayPanelDrawerProps {
  open: boolean
  onClose: () => void
}

export function DayPanelDrawer({ open, onClose }: DayPanelDrawerProps): React.JSX.Element | null {
  if (!open) {
    return null
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        aria-label="Close HUD"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed inset-y-0 right-0 z-50 w-[min(420px,94vw)] lg:hidden"
      >
        <div className="flex h-full flex-col shadow-panel-active">
          <div className="flex items-center justify-between border-b border-accent-cyan/20 bg-surface-card/95 px-4 py-3">
            <div>
              <p className="hud-kicker">Day Panel</p>
              <h2 className="font-display text-lg font-bold text-text-primary">Telemetry</h2>
            </div>
            <button type="button" className="focus-btn-ghost text-xs" onClick={onClose}>
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <HudTelemetryPanel />
          </div>
        </div>
      </motion.div>
    </>
  )
}
