export function shiftIsoByMinutes(iso: string, deltaMinutes: number): string {
  const date = new Date(iso)
  date.setMinutes(date.getMinutes() + deltaMinutes)
  return date.toISOString()
}

export function computeDurationMinutes(plannedStart: string, plannedEnd: string): number {
  const startMs = new Date(plannedStart).getTime()
  const endMs = new Date(plannedEnd).getTime()
  return Math.max(1, Math.round((endMs - startMs) / 60_000))
}

export function computeShiftedBlockTimes(
  plannedStart: string,
  plannedEnd: string,
  deltaMinutes: number
): {
  plannedStart: string
  plannedEnd: string
  plannedDurationMinutes: number
} {
  const nextStart = shiftIsoByMinutes(plannedStart, deltaMinutes)
  const nextEnd = shiftIsoByMinutes(plannedEnd, deltaMinutes)

  return {
    plannedStart: nextStart,
    plannedEnd: nextEnd,
    plannedDurationMinutes: computeDurationMinutes(nextStart, nextEnd),
  }
}

export function computeReclaimMinutes(plannedEnd: string, nowMs: number): number {
  const endMs = new Date(plannedEnd).getTime()
  if (Number.isNaN(endMs) || endMs <= nowMs) {
    return 0
  }

  return Math.max(0, Math.round((endMs - nowMs) / 60_000))
}
