import { useEffect, useState } from 'react'
import { isSystemUnassignedClient } from '@shared/constants/systemClient'
import type { ClientProjectRow } from '@shared/types/db'
import type { NotificationDispatchedPayload } from '@shared/types/notifications'

export function StalenessAlertList(): React.JSX.Element {
  const [staleClients, setStaleClients] = useState<ClientProjectRow[]>([])

  useEffect(() => {
    void (async () => {
      const [clients, settings] = await Promise.all([
        window.focusOS.clients.list(),
        window.focusOS.settings.get(),
      ])
      const thresholdHours = settings.settings.defaultStalenessHours
      const now = Date.now()

      const stale = clients.filter((client) => {
        if (client.is_active !== 1 || isSystemUnassignedClient(client.name)) {
          return false
        }
        const threshold = client.staleness_threshold_hours ?? thresholdHours
        if (!client.last_touched_at) {
          return true
        }
        const hours = (now - new Date(client.last_touched_at).getTime()) / (60 * 60 * 1000)
        return hours >= threshold
      })

      setStaleClients(stale)
    })()

    return window.focusOS.onNotificationDispatched((payload: NotificationDispatchedPayload) => {
      if (payload.type !== 'staleness_alert' || payload.skippedDuplicate) {
        return
      }

      const clientId = payload.metadata.clientId
      if (typeof clientId !== 'number') {
        return
      }

      void window.focusOS.clients.get({ id: clientId }).then((client) => {
        setStaleClients((current) => {
          if (current.some((entry) => entry.id === client.id)) {
            return current
          }
          return [...current, client]
        })
      })
    })
  }, [])

  return (
    <section className="focus-panel h-full">
      <p className="focus-metric-label">Staleness radar</p>
      {staleClients.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">All clients recently active.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {staleClients.map((client) => (
            <li
              key={client.id}
              className="flex items-center gap-2 rounded-button border border-accent-amber/20 bg-accent-amber/5 px-3 py-2 text-sm text-accent-amber"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent-amber" aria-hidden="true" />
              {client.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
