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

export function formatCountdown(totalSeconds: number): string {
  const negative = totalSeconds < 0
  const absSeconds = Math.abs(totalSeconds)

  if (absSeconds >= 3600) {
    const hours = Math.floor(absSeconds / 3600)
    const minutes = Math.floor((absSeconds % 3600) / 60)
    const seconds = absSeconds % 60
    const formatted = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    return negative ? `-${formatted}` : formatted
  }

  const minutes = Math.floor(absSeconds / 60)
  const seconds = absSeconds % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return negative ? `-${formatted}` : formatted
}

export function formatCountdownFromMinutes(totalMinutes: number): string {
  return formatCountdown(Math.round(totalMinutes * 60))
}

export function formatDurationProse(totalMinutes: number): string {
  const absMinutes = Math.abs(Math.round(totalMinutes))
  const negative = totalMinutes < 0

  if (absMinutes < 60) {
    const unit = absMinutes === 1 ? 'minute' : 'minutes'
    const phrase = `${absMinutes} ${unit}`
    return negative ? `-${phrase}` : phrase
  }

  const hours = Math.floor(absMinutes / 60)
  const minutes = absMinutes % 60
  const hourUnit = hours === 1 ? 'hour' : 'hours'
  const hourPhrase = `${hours} ${hourUnit}`

  if (minutes === 0) {
    return negative ? `-${hourPhrase}` : hourPhrase
  }

  const minuteUnit = minutes === 1 ? 'minute' : 'minutes'
  const phrase = `${hourPhrase} ${minutes} ${minuteUnit}`
  return negative ? `-${phrase}` : phrase
}
