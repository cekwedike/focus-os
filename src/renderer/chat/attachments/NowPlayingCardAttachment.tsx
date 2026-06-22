import { useEffect, useState } from 'react'
import type { NowPlayingCardAttachment } from '@shared/types/chat'
import { assistantLexicon } from '@shared/copy/assistantLexicon'
import { ActiveBlockTimer } from '@renderer/components/schedule/ActiveBlockTimer'

interface NowPlayingCardAttachmentViewProps {
  attachment: NowPlayingCardAttachment
  onSendText?: (text: string) => void
}

export function NowPlayingCardAttachmentView({
  attachment,
  onSendText,
}: NowPlayingCardAttachmentViewProps): React.JSX.Element {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const minutesLeft = Math.max(
    0,
    Math.ceil((new Date(attachment.plannedEnd).getTime() - now) / 60_000)
  )

  return (
    <div className="focus-panel space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-accent-mint">Now</p>
          <h4 className="font-medium text-text-primary">{attachment.title}</h4>
          <p className="text-xs text-text-muted">
            {assistantLexicon.nowPlaying(attachment.title, minutesLeft)}
          </p>
        </div>
        {attachment.plannedStart ? (
          <ActiveBlockTimer startedAt={attachment.plannedStart} endsAt={attachment.plannedEnd} />
        ) : null}
      </div>
      {onSendText ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="focus-btn-ghost !px-2 !py-1 text-xs" onClick={() => onSendText('extend by 5')}>
            {assistantLexicon.extend5}
          </button>
          <button type="button" className="focus-btn-ghost !px-2 !py-1 text-xs" onClick={() => onSendText('complete block')}>
            Done
          </button>
          <button type="button" className="focus-btn-ghost !px-2 !py-1 text-xs" onClick={() => onSendText('skip block')}>
            {assistantLexicon.skipBlock}
          </button>
        </div>
      ) : null}
    </div>
  )
}
