export function formatBannerTimeSubtitle(createdAt: string, nowMs = Date.now()): string {
  const createdMs = new Date(createdAt).getTime()
  const elapsedMinutes = Math.max(0, Math.floor((nowMs - createdMs) / 60_000))

  if (elapsedMinutes <= 0) {
    return 'Active just now'
  }

  if (elapsedMinutes === 1) {
    return 'Active for 1 min'
  }

  return `Active for ${elapsedMinutes} min`
}
