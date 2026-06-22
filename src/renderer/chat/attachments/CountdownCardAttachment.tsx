import { useEffect, useState } from 'react'
import type { CountdownCardAttachment } from '@shared/types/chat'

interface CountdownCardAttachmentViewProps {
  attachment: CountdownCardAttachment
}

export function CountdownCardAttachmentView({
  attachment,
}: CountdownCardAttachmentViewProps): React.JSX.Element {
  const [secondsLeft, setSecondsLeft] = useState(attachment.secondsUntil)

  useEffect(() => {
    setSecondsLeft(attachment.secondsUntil)
    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [attachment.secondsUntil])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const label =
    secondsLeft <= 0
      ? 'Starting now'
      : minutes > 0
        ? `${minutes}:${String(seconds).padStart(2, '0')}`
        : `${secondsLeft}s`

  return (
    <div className="focus-panel p-4">
      <p className="text-xs uppercase tracking-wide text-accent-cyan">Up next</p>
      <h4 className="font-medium text-text-primary">{attachment.title}</h4>
      <p className="mt-1 font-mono text-2xl text-accent-mint">{label}</p>
    </div>
  )
}
