import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { isSystemUnassignedClient } from '@shared/constants/systemClient'
import type { ClientProjectRow } from '@shared/types/db'
import type { NotificationDispatchedPayload } from '@shared/types/notifications'
import { useChatContext } from '@renderer/context/useChatContext'
import { HudCard } from '../JarvisCard'
import { JarvisMiniBars, type JarvisBarDatum } from '../JarvisMiniBars'

export function StalenessHudCard(): React.JSX.Element {
  const { sendMessage } = useChatContext()
  const [staleClients, setStaleClients] = useState<ClientProjectRow[]>([])
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
      const now = Date.now()

      const stale = clients.filter((client) => {
        if (client.is_active !== 1 || isSystemUnassignedClient(client.name)) {
          return false
        }
        const limit = client.staleness_threshold_hours ?? hours
        if (!client.last_touched_at) {
          return true
        }
        const elapsed = (now - new Date(client.last_touched_at).getTime()) / (60 * 60 * 1000)
        return elapsed >= limit
      })

      setStaleClients(stale)
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

  const radarBars = useMemo((): JarvisBarDatum[] => {
    return staleClients.slice(0, 6).map((client) => {
      const hours = client.last_touched_at
        ? (Date.now() - new Date(client.last_touched_at).getTime()) / (60 * 60 * 1000)
        : thresholdHours * 2
      return {
        id: client.id,
        label: client.name.slice(0, 6),
        value: Math.min(100, (hours / thresholdHours) * 50),
        color: '#fbbf24',
        status: client.name,
      }
    })
  }, [staleClients, thresholdHours])

  const healthy = staleClients.length === 0

  return (
    <HudCard
      span="full"
      accent="amber"
      expanded={expanded || !healthy}
      onClick={() => setExpanded((o) => !o)}
    >
      <p className="hud-kicker">Staleness radar</p>
      {healthy ? (
        <p className="mt-2 text-sm text-accent-mint">All clients recently active</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-accent-amber">{staleClients.length} client(s) need touch</p>
          <div className="mt-3">
            <JarvisMiniBars
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
