import type {
  PlannedActualGroup,
  ProtectedBlockDaySummary,
  ReviewScheduleRow,
} from '@shared/types/review'

function formatSubtypeLabel(subtype: string): string {
  return subtype
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function isWorkableRow(row: ReviewScheduleRow): boolean {
  return row.status !== 'superseded'
}

function actualMinutesForRow(row: ReviewScheduleRow): number {
  if (!row.actual_start || !row.actual_end) {
    return 0
  }
  return row.actual_duration_minutes ?? 0
}

function aggregateGroup(
  rows: ReviewScheduleRow[],
  getKey: (row: ReviewScheduleRow) => string | null,
  getLabel: (row: ReviewScheduleRow, key: string) => string
): PlannedActualGroup[] {
  const groups = new Map<string, PlannedActualGroup>()

  for (const row of rows) {
    if (!isWorkableRow(row)) {
      continue
    }

    const key = getKey(row)
    if (!key) {
      continue
    }

    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        label: getLabel(row, key),
        plannedMinutes: 0,
        actualMinutes: 0,
        notStartedCount: 0,
        completedCount: 0,
      })
    }

    const group = groups.get(key)!
    group.plannedMinutes += row.planned_duration_minutes
    group.actualMinutes += actualMinutesForRow(row)

    if (!row.actual_start) {
      group.notStartedCount += 1
    }
    if (row.status === 'completed') {
      group.completedCount += 1
    }
  }

  return [...groups.values()].sort((left, right) => right.plannedMinutes - left.plannedMinutes)
}

export function aggregateClientGroups(rows: ReviewScheduleRow[]): PlannedActualGroup[] {
  return aggregateGroup(
    rows.filter((row) => row.block_type === 'fixed_client' || row.block_type === 'weighted_client'),
    (row) => (row.client_id === null ? null : String(row.client_id)),
    (row, key) => row.client_name?.trim() || `Client ${key}`
  )
}

export function aggregateProtectedGroups(rows: ReviewScheduleRow[]): PlannedActualGroup[] {
  return aggregateGroup(
    rows.filter((row) => row.block_type === 'protected'),
    (row) => row.protected_subtype,
    (row, key) => formatSubtypeLabel(key)
  )
}

export function aggregateProtectedDaySummaries(
  rows: ReviewScheduleRow[]
): ProtectedBlockDaySummary[] {
  const bySubtype = new Map<string, { dates: Set<string>; completedDates: Set<string> }>()

  for (const row of rows) {
    if (row.block_type !== 'protected' || row.status === 'superseded' || !row.protected_subtype) {
      continue
    }

    const subtype = row.protected_subtype
    if (!bySubtype.has(subtype)) {
      bySubtype.set(subtype, { dates: new Set(), completedDates: new Set() })
    }

    const entry = bySubtype.get(subtype)!
    entry.dates.add(row.schedule_date)
    if (row.status === 'completed') {
      entry.completedDates.add(row.schedule_date)
    }
  }

  return [...bySubtype.entries()]
    .map(([protectedSubtype, value]) => ({
      protectedSubtype,
      label: formatSubtypeLabel(protectedSubtype),
      daysWithBlock: value.dates.size,
      daysCompleted: value.completedDates.size,
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
}
