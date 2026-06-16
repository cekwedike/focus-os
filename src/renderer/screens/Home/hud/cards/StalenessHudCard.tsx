import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { listStaleClients } from '@shared/insights/stalenessSnapshot'
import type { ClientProjectRow } from '@shared/types/db'
import type { SnapshotStaleClient } from '@shared/types/insights'
import type { NotificationDispatchedPayload } from '@shared/types/notifications'
import { useChatContext } from '@renderer/context/useChatContext'
import { HudCard } from '../HudCard'
import { HudMiniBars, type HudBarDatum } from '../HudMiniBars'

export function StalenessHudCard(): React.JSX.Element {
  const { sendMessage } = useChatContext()
  const [staleClients, setStaleClients] = useState<ClientProjectRow[]>([])
  const [staleSnapshots, setStaleSnapshots] = useState<SnapshotStaleClient[]>([])
  const [thresholdHours, setThresholdHours] = useState(48)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const refresh = async (): Promise<void> => {
      const [clients, settings] = await Promise.all([
        window.focusOS.clients.list(),
        window.focusOS.settings.get(),
      ])
      const hours = settings.settings.defaultStalenessHours
      setThresholdHours(hours)
      const snapshots = listStaleClients(clients, { defaultStalenessHours: hours })
      const staleIds = new Set(snapshots.map((entry) => entry.clientId))
      setStaleSnapshots(snapshots)
      setStaleClients(clients.filter((client) => staleIds.has(client.id)))
    }

    void refresh()

    return window.focusOS.onNotificationDispatched((payload: NotificationDispatchedPayload) => {
      if (payload.type !== 'staleness_alert' || payload.skippedDuplicate) {
        return
      }
      const clientId = payload.metadata.clientId
      if (typeof clientId !== 'number') {
        return
      }
      void window.focusOS.clients.get({ id: clientId }).then((client) => {
        setStaleClients((current) =>
          current.some((entry) => entry.id === client.id) ? current : [...current, client]
        )
      })
    })
  }, [])

  const snapshotByClientId = useMemo(
    () => new Map(staleSnapshots.map((entry) => [entry.clientId, entry])),
    [staleSnapshots]
  )

  const radarBars = useMemo((): HudBarDatum[] => {
    return staleClients.slice(0, 6).map((client) => {
      const hours = snapshotByClientId.get(client.id)?.hoursSinceTouch ?? thresholdHours
      return {
        id: client.id,
        label: client.name.slice(0, 6),
        value: Math.min(100, (hours / thresholdHours) * 50),
        color: '#fbbf24',
        status: client.name,
      }
    })
  }, [staleClients, snapshotByClientId, thresholdHours])

  const healthy = staleClients.length === 0

  return (
    <HudCard
      span="full"
      accent="amber"
      expanded={expanded || !healthy}
      onClick={() => setExpanded((o) => !o)}
    >
      <p className="hud-kicker">Staleness Radar</p>
      {healthy ? (
        <p className="mt-2 text-sm text-accent-mint">All Clients Recently Active</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-accent-amber">{staleClients.length} client(s) need touch</p>
          <div className="mt-3">
            <HudMiniBars
              data={radarBars}
              height={44}
              onBarClick={(datum) => void sendMessage(`touch ${datum.status}`)}
            />
          </div>
        </>
      )}

      {expanded && !healthy ? (
        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 max-h-28 space-y-1 overflow-y-auto border-t border-surface-border/50 pt-2"
          onClick={(event) => event.stopPropagation()}
        >
          {staleClients.map((client) => (
            <li key={client.id}>
              <button
                type="button"
                className="w-full rounded-button px-2 py-1.5 text-left text-xs text-accent-amber hover:bg-accent-amber/10"
                onClick={() => void sendMessage(`acknowledge check-in for ${client.name}`)}
              >
                {client.name}
              </button>
            </li>
          ))}
        </motion.ul>
      ) : null}
    </HudCard>
  )
}
