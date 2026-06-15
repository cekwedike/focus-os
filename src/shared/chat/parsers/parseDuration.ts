export function parseDurationMinutes(input: string): number | null {
  const trimmed = input.trim().toLowerCase()

  if (/\bhalf\s+(?:an?\s+)?hour\b/.test(trimmed)) {
    return 30
  }

  const hourMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*h(?:ours?)?/i)
  if (hourMatch) {
    return Math.round(Number(hourMatch[1]) * 60)
  }

  const minuteMatch = trimmed.match(/(\d+)\s*m(?:in(?:utes?)?)?/i)
  if (minuteMatch) {
    return Number(minuteMatch[1])
  }

  const bareMinutes = trimmed.match(/^\d+$/)
  if (bareMinutes) {
    return Number(bareMinutes[0])
  }

  return null
}

export function parseEstimateMinutes(input: string): number | null {
  return parseDurationMinutes(input)
}
