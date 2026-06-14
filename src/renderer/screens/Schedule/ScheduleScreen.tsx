import { ScreenCard } from '@renderer/components/layout/ScreenCard'
import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { getScreenDefinition } from '../screenMeta'
import { ScheduleBlockCard } from './components/ScheduleBlockCard'
import { useEffect, useState } from 'react'
import type { ClientProjectRow } from '@shared/types/db'

const screen = getScreenDefinition('/schedule')

export function ScheduleScreen(): React.JSX.Element {
  const { dayBundle, loading, error } = useScheduleContext()
  const [clients, setClients] = useState<ClientProjectRow[]>([])

  useEffect(() => {
    void window.focusOS.clients.list().then(setClients)
  }, [])

  const colorByClientId = new Map(clients.map((client) => [client.id, client.color]))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ScreenCard title={screen.title} description={screen.description} />
      {loading && <p className="text-sm text-text-muted">Loading schedule...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="space-y-3">
        {dayBundle?.blocks.map((block) => (
          <ScheduleBlockCard
            key={block.id}
            block={block}
            clientColor={block.client_id ? colorByClientId.get(block.client_id) : undefined}
          />
        ))}
        {!loading && (dayBundle?.blocks.length ?? 0) === 0 && (
          <p className="text-sm text-text-muted">
            No schedule yet. Go to Daily Workspace to generate today&apos;s plan.
          </p>
        )}
      </div>
    </div>
  )
}
