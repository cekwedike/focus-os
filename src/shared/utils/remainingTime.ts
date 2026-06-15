export function computeCountdownSeconds(input: {
  nowMs: number
  endsAt?: string | null
  startedAt?: string | null
  durationMinutes?: number | null
}): number {
  if (input.endsAt) {
    return Math.floor((new Date(input.endsAt).getTime() - input.nowMs) / 1000)
  }

  if (
    input.startedAt &&
    input.durationMinutes !== undefined &&
    input.durationMinutes !== null &&
    input.durationMinutes > 0
  ) {
    const elapsed = Math.floor((input.nowMs - new Date(input.startedAt).getTime()) / 1000)
    return input.durationMinutes * 60 - elapsed
  }

  return 0
}

export function formatCountdownMmSs(totalSeconds: number): string {
  const negative = totalSeconds < 0
  const absSeconds = Math.abs(totalSeconds)
  const minutes = Math.floor(absSeconds / 60)
  const seconds = absSeconds % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return negative ? `-${formatted}` : formatted
}
