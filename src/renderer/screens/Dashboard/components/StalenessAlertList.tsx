import { useEffect, useState } from 'react'
import { isSystemUnassignedClient } from '@shared/constants/systemClient'
import type { ClientProjectRow } from '@shared/types/db'

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

    return window.focusOS.onStalenessAlert((payload) => {
      void window.focusOS.clients.get({ id: payload.clientId }).then((client) => {
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
    <section className="rounded-button border border-surface-border bg-surface-card p-4">
      <h3 className="text-sm font-semibold text-text-primary">Staleness Alerts</h3>
      {staleClients.length === 0 ? (
        <p className="mt-2 text-sm text-text-muted">All active clients recently touched.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm text-amber-200">
          {staleClients.map((client) => (
            <li key={client.id}>{client.name} has gone quiet</li>
          ))}
        </ul>
      )}
    </section>
  )
}
