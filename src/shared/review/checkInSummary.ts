import type { CheckInLogRow } from '@shared/types/db'

export interface CheckInClientSummary {
  clientId: number
  clientName: string
  checkInCount: number
  averageActualIntervalMinutes: number | null
  overdueCount: number
}

export interface CheckInSummaryClientConfig {
  id: number
  name: string
  reminder_interval_minutes: number | null
}

export function aggregateCheckInSummaries(
  rows: CheckInLogRow[],
  clients: CheckInSummaryClientConfig[]
): CheckInClientSummary[] {
  const reminderClients = clients.filter(
    (client) => (client.reminder_interval_minutes ?? 0) > 0
  )

  if (reminderClients.length === 0) {
    return []
  }

  const rowsByClient = new Map<number, CheckInLogRow[]>()
  for (const row of rows) {
    const existing = rowsByClient.get(row.client_project_id) ?? []
    existing.push(row)
    rowsByClient.set(row.client_project_id, existing)
  }

  return reminderClients
    .map((client) => {
      const clientRows = rowsByClient.get(client.id) ?? []
      const intervals = clientRows
        .map((row) => row.actual_interval_minutes)
        .filter((value): value is number => value !== null)

      const threshold = client.reminder_interval_minutes ?? 0
      const overdueCount = clientRows.filter(
        (row) =>
          row.actual_interval_minutes !== null &&
          row.actual_interval_minutes > threshold
      ).length

      const averageActualIntervalMinutes =
        intervals.length > 0
          ? Math.round(
              intervals.reduce((sum, value) => sum + value, 0) / intervals.length
            )
          : null

      return {
        clientId: client.id,
        clientName: client.name,
        checkInCount: clientRows.length,
        averageActualIntervalMinutes,
        overdueCount,
      }
    })
    .filter((summary) => summary.checkInCount > 0 || summary.overdueCount > 0)
    .sort((left, right) => left.clientName.localeCompare(right.clientName))
}
