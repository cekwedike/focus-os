import { useState } from 'react'
import type { DailyScheduleRow } from '@shared/types/db'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'
import { ActiveBlockTimer } from '@renderer/components/schedule/ActiveBlockTimer'
import { TimeInput } from '@renderer/components/ui/TimeInput'
import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { useFaithEntry } from '@renderer/context/FaithEntryContext'

interface ScheduleBlockCardProps {
  block: DailyScheduleRow
  clientColor?: string
}

function isFaithBlock(block: DailyScheduleRow): boolean {
  return block.block_type === 'protected' && block.protected_subtype === 'faith'
}

export function ScheduleBlockCard({ block, clientColor }: ScheduleBlockCardProps): React.JSX.Element {
  const { formatHHMM } = useDisplayPreferences()
  const { refresh } = useScheduleContext()
  const { openFaithEntry } = useFaithEntry()
  const [paused, setPaused] = useState(false)
  const [editing, setEditing] = useState(false)
  const [plannedStart, setPlannedStart] = useState(block.planned_start.slice(11, 16))
  const [plannedEnd, setPlannedEnd] = useState(block.planned_end.slice(11, 16))

  const startBlock = async (): Promise<void> => {
    await window.focusOS.schedule.startBlock({ blockId: block.id })
    await refresh()
  }

  const completeBlock = async (): Promise<void> => {
    await window.focusOS.schedule.completeBlock({ blockId: block.id })
    await refresh()
  }

  const saveTimes = async (): Promise<void> => {
    const datePrefix = block.planned_start.slice(0, 10)
    await window.focusOS.schedule.updateBlock({
      blockId: block.id,
      planned_start: `${datePrefix}T${plannedStart}:00`,
      planned_end: `${datePrefix}T${plannedEnd}:00`,
    })
    setEditing(false)
    await refresh()
  }

  return (
    <article
      className="rounded-button border border-surface-border bg-surface-elevated p-4"
      style={clientColor ? { borderLeftColor: clientColor, borderLeftWidth: 4 } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-text-primary">{block.title}</h3>
          <p className="mt-1 text-xs text-text-muted capitalize">
            {block.block_type.replace('_', ' ')} · {block.status}
          </p>
          {!editing ? (
            <p className="mt-1 font-mono text-xs text-text-secondary">
              {formatHHMM(plannedStart)} - {formatHHMM(plannedEnd)} ({block.planned_duration_minutes} min)
            </p>
          ) : (
            <div className="mt-2 flex gap-2">
              <TimeInput value={plannedStart} onChange={setPlannedStart} />
              <TimeInput value={plannedEnd} onChange={setPlannedEnd} />
              <button type="button" onClick={() => void saveTimes()} className="text-xs text-accent-mint">
                Save
              </button>
            </div>
          )}
          {block.status === 'active' && block.actual_start && (
            <div className="mt-2">
              <ActiveBlockTimer startedAt={block.actual_start} paused={paused} />
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {block.status === 'planned' && (
          <button
            type="button"
            onClick={() => void startBlock()}
            className="rounded-button bg-accent-mint/20 px-3 py-1.5 text-xs font-medium text-accent-mint"
          >
            Start
          </button>
        )}
        {block.status === 'active' && (
          <>
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              className="rounded-button border border-surface-border px-3 py-1.5 text-xs text-text-secondary"
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
            {isFaithBlock(block) ? (
              <button
                type="button"
                onClick={openFaithEntry}
                className="rounded-button bg-accent-mint/20 px-3 py-1.5 text-xs font-medium text-accent-mint"
              >
                Log Faith Time
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void completeBlock()}
                className="rounded-button bg-accent-mint/20 px-3 py-1.5 text-xs font-medium text-accent-mint"
              >
                Complete
              </button>
            )}
          </>
        )}
        {block.status === 'planned' && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-button border border-surface-border px-3 py-1.5 text-xs text-text-muted"
          >
            Edit Times
          </button>
        )}
      </div>
    </article>
  )
}
