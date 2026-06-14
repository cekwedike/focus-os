import { isSystemUnassignedClient } from '@shared/constants/systemClient'
import type { ClientProjectRow } from '@shared/types/db'
import type { SnapshotStaleClient } from '@shared/types/insights'

export interface StalenessSettings {
  defaultStalenessHours: number
}

export function listStaleClients(
  clients: ClientProjectRow[],
  settings: StalenessSettings,
  nowMs: number = Date.now()
): SnapshotStaleClient[] {
  const stale: SnapshotStaleClient[] = []

  for (const client of clients) {
    if (client.is_active !== 1 || isSystemUnassignedClient(client.name)) {
      continue
    }

    const threshold = client.staleness_threshold_hours ?? settings.defaultStalenessHours

    if (!client.last_touched_at) {
      stale.push({
        clientId: client.id,
        clientName: client.name,
        hoursSinceTouch: threshold + 1,
      })
      continue
    }

    const hoursSince =
      (nowMs - new Date(client.last_touched_at).getTime()) / (60 * 60 * 1000)

    if (hoursSince >= threshold) {
      stale.push({
        clientId: client.id,
        clientName: client.name,
        hoursSinceTouch: Math.round(hoursSince),
      })
    }
  }

  return stale.sort((left, right) => right.hoursSinceTouch - left.hoursSinceTouch)
}
