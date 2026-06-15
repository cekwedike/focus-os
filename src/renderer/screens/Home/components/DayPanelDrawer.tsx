import { DayPanel } from './DayPanel'

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
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        aria-label="Close day panel"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-[min(360px,92vw)] md:hidden">
        <div className="flex h-full flex-col bg-surface-card shadow-panel">
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
            <h2 className="font-display text-lg font-bold text-text-primary">Day Panel</h2>
            <button type="button" className="focus-btn-ghost text-xs" onClick={onClose}>
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <DayPanel />
          </div>
        </div>
      </div>
    </>
  )
}
