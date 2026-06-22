import { motion } from 'framer-motion'
import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'
import { extractLocalTimeHHMM } from '@shared/utils/scheduleTimestamp'

interface TodayPlanSheetProps {
  open: boolean
  onClose: () => void
}

export function TodayPlanSheet({ open, onClose }: TodayPlanSheetProps): React.JSX.Element | null {
  const { dayBundle, activeBlock } = useScheduleContext()
  const { formatHHMM: formatClock } = useDisplayPreferences()

  if (!open) {
    return null
  }

  const blocks = (dayBundle?.blocks ?? []).filter(
    (block) => block.status !== 'superseded' && block.block_type !== 'break'
  )

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        aria-label="Close today plan"
        onClick={onClose}
      />
      <motion.aside
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[min(70vh,32rem)] overflow-hidden rounded-t-2xl border border-surface-border bg-surface-card shadow-panel-active"
      >
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-text-primary">Today</h2>
            <p className="text-xs text-text-muted">Your plan — ask me to change anything</p>
          </div>
          <button type="button" className="focus-btn-ghost text-sm" onClick={onClose}>
            Done
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-3">
          {blocks.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">
              No plan yet. Tell me what time you woke up and I&apos;ll build your day.
            </p>
          ) : (
            <ol className="space-y-2">
              {blocks.map((block) => {
                const start = block.planned_start
                  ? formatClock(extractLocalTimeHHMM(block.planned_start))
                  : '—'
                const isActive = activeBlock?.id === block.id
                const isDone = block.status === 'completed' || block.status === 'skipped'

                return (
                  <li
                    key={block.id}
                    className={`flex items-center gap-3 rounded-panel border px-3 py-2.5 ${
                      isActive
                        ? 'border-accent-mint/40 bg-accent-mint/10'
                        : 'border-surface-border bg-surface-base/50'
                    }`}
                  >
                    <span className="w-14 shrink-0 text-xs font-medium text-text-muted">{start}</span>
                    <span
                      className={`min-w-0 flex-1 truncate text-sm ${
                        isDone ? 'text-text-muted line-through' : 'text-text-primary'
                      }`}
                    >
                      {block.title}
                    </span>
                    {isActive ? (
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-accent-mint">
                        Now
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </motion.aside>
    </>
  )
}
