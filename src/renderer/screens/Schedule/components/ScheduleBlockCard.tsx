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
    await window.focusOS.work.setPaused({ paused: false })
    await window.focusOS.schedule.startBlock({ blockId: block.id })
    await refresh()
  }

  const completeBlock = async (): Promise<void> => {
    await window.focusOS.work.setPaused({ paused: false })
    await window.focusOS.schedule.completeBlock({ blockId: block.id })
    await refresh()
  }

  const togglePause = (): void => {
    setPaused((current) => {
      const next = !current
      void window.focusOS.work.setPaused({ paused: next })
      return next
    })
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
      className={`focus-panel p-4 ${block.status === 'active' ? 'focus-panel-active' : ''}`}
      style={clientColor ? { borderLeftColor: clientColor, borderLeftWidth: 4 } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-text-primary">{block.title}</h3>
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
              <ActiveBlockTimer
                startedAt={block.actual_start}
                paused={paused}
                endsAt={block.planned_end}
              />
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {block.status === 'planned' && (
          <button
            type="button"
            onClick={() => void startBlock()}
            className="focus-btn-primary !px-3 !py-1.5 !text-xs"
          >
            Start
          </button>
        )}
        {block.status === 'active' && (
          <>
            <button
              type="button"
              onClick={togglePause}
              className="focus-btn-ghost !px-3 !py-1.5 !text-xs"
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
            {isFaithBlock(block) ? (
              <button
                type="button"
                onClick={openFaithEntry}
                className="focus-btn-primary !px-3 !py-1.5 !text-xs"
              >
                Log Faith Time
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void completeBlock()}
                className="focus-btn-primary !px-3 !py-1.5 !text-xs"
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
            className="focus-btn-ghost !px-3 !py-1.5 !text-xs !text-text-muted"
          >
            Edit Times
          </button>
        )}
      </div>
    </article>
  )
}
