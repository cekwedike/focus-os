import { isSystemUnassignedClient } from '@shared/constants/systemClient'
import type { ClientProjectRow } from '@shared/types/db'
import type { SnapshotStaleClient } from '@shared/types/insights'

export interface StalenessSettings {
  defaultStalenessHours: number
}

function touchReferenceAt(client: ClientProjectRow): string {
  return client.last_touched_at ?? client.created_at
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
    const referenceMs = new Date(touchReferenceAt(client)).getTime()
    if (Number.isNaN(referenceMs)) {
      continue
    }

    const hoursSince = (nowMs - referenceMs) / (60 * 60 * 1000)

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
