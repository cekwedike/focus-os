export function formatTimeHHMM(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function resolveHour(hour: number, meridiem?: string): number {
  const normalized = meridiem?.toLowerCase()
  if (normalized === 'pm' && hour < 12) {
    return hour + 12
  }
  if (normalized === 'am' && hour === 12) {
    return 0
  }
  if (!normalized && hour <= 11) {
    const now = new Date()
    const currentHour = now.getHours()
    if (currentHour >= 12 && hour <= 11) {
      return hour + 12
    }
  }
  return hour
}

export function parseWakeTime(input: string, referenceDate = new Date()): string | null {
  const trimmed = input.trim().toLowerCase()

  if (/\b(just woke up|right now|now)\b/.test(trimmed)) {
    return formatTimeHHMM(referenceDate.getHours(), referenceDate.getMinutes())
  }

  const clockMatch = trimmed.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i)
  if (clockMatch) {
    const hour = resolveHour(Number(clockMatch[1]), clockMatch[3])
    const minutes = Number(clockMatch[2])
    if (minutes >= 0 && minutes <= 59 && hour >= 0 && hour <= 23) {
      return formatTimeHHMM(hour, minutes)
    }
  }

  const meridiemMatch = trimmed.match(/\b(\d{1,2})\s*(am|pm)\b/i)
  if (meridiemMatch) {
    const hour = resolveHour(Number(meridiemMatch[1]), meridiemMatch[2])
    return formatTimeHHMM(hour, 0)
  }

  const bareHourMatch = trimmed.match(/^(\d{1,2})$/)
  if (bareHourMatch) {
    const hour = resolveHour(Number(bareHourMatch[1]))
    return formatTimeHHMM(hour, 0)
  }

  return null
}
