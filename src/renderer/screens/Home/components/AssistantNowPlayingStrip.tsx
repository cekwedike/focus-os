import { useEffect, useState } from 'react'
import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { useBreakContext } from '@renderer/context/BreakContext'
import { useChatContext } from '@renderer/context/useChatContext'
import { assistantLexicon } from '@shared/copy/assistantLexicon'
import { ActiveBlockTimer } from '@renderer/components/schedule/ActiveBlockTimer'

export function AssistantNowPlayingStrip(): React.JSX.Element | null {
  const { activeBlock } = useScheduleContext()
  const { longBreakActive, longBreakStartedAt, longBreakPlannedMinutes } = useBreakContext()
  const { sendMessage, sending, isTyping, aiThinking } = useChatContext()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (longBreakActive && longBreakStartedAt) {
    return (
      <div className="mb-4 rounded-2xl border border-surface-border bg-surface-card/80 px-4 py-3 shadow-panel">
        <p className="text-xs text-text-muted">You&apos;re on a break</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="font-medium text-text-primary">Long break</p>
          <ActiveBlockTimer
            startedAt={longBreakStartedAt}
            durationMinutes={longBreakPlannedMinutes}
          />
        </div>
      </div>
    )
  }

  if (!activeBlock || activeBlock.status !== 'active') {
    return null
  }

  const minutesLeft = Math.max(
    0,
    Math.ceil((new Date(activeBlock.planned_end).getTime() - now) / 60_000)
  )
  const busy = sending || isTyping || aiThinking

  return (
    <div className="mb-4 rounded-2xl border border-accent-mint/25 bg-gradient-to-br from-accent-mint/10 to-surface-card px-4 py-3 shadow-panel">
      <p className="text-xs font-medium text-accent-mint">Right now</p>
      <div className="mt-1 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-text-primary">{activeBlock.title}</p>
          <p className="text-xs text-text-muted">
            {assistantLexicon.nowPlaying(activeBlock.title, minutesLeft)}
          </p>
        </div>
        {activeBlock.actual_start ? (
          <ActiveBlockTimer
            startedAt={activeBlock.actual_start}
            endsAt={activeBlock.planned_end}
          />
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className="focus-chip disabled:opacity-50"
          onClick={() => void sendMessage('extend by 5')}
        >
          +5 min
        </button>
        <button
          type="button"
          disabled={busy}
          className="focus-chip disabled:opacity-50"
          onClick={() => void sendMessage("I'm done")}
        >
          Done
        </button>
        <button
          type="button"
          disabled={busy}
          className="focus-chip disabled:opacity-50"
          onClick={() => void sendMessage('skip block')}
        >
          Skip
        </button>
      </div>
    </div>
  )
}
