import { useEffect, useState } from 'react'
import { listStaleClients } from '@shared/insights/stalenessSnapshot'
import type { ClientProjectRow } from '@shared/types/db'
import type { NotificationDispatchedPayload } from '@shared/types/notifications'

export function StalenessAlertList({
  variant = 'dashboard',
}: {
  variant?: 'dashboard' | 'sidebar'
}): React.JSX.Element {
  const [staleClients, setStaleClients] = useState<ClientProjectRow[]>([])

  useEffect(() => {
    void (async () => {
      const [clients, settings] = await Promise.all([
        window.focusOS.clients.list(),
        window.focusOS.settings.get(),
      ])
      const staleIds = new Set(
        listStaleClients(clients, {
          defaultStalenessHours: settings.settings.defaultStalenessHours,
        }).map((entry) => entry.clientId)
      )

      setStaleClients(clients.filter((client) => staleIds.has(client.id)))
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

  const panelClass =
    variant === 'sidebar' ? 'focus-panel focus-panel-sidebar' : 'focus-panel'

  return (
    <section className={`${panelClass} h-full min-w-0`}>
      <p className="focus-metric-label">Staleness Radar</p>
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
