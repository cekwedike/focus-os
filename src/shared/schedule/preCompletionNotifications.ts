export const PRE_COMPLETION_THRESHOLDS = [15, 10, 5] as const

export type PreCompletionThreshold = (typeof PRE_COMPLETION_THRESHOLDS)[number]

export function computePreCompletionFireAtMs(
  plannedEnd: string,
  thresholdMinutes: PreCompletionThreshold
): number {
  const endMs = new Date(plannedEnd).getTime()
  return endMs - thresholdMinutes * 60_000
}

export function getDuePreCompletionThreshold(
  plannedEnd: string,
  effectiveNowMs: number,
  firedThresholds: ReadonlySet<PreCompletionThreshold>
): PreCompletionThreshold | null {
  for (const threshold of PRE_COMPLETION_THRESHOLDS) {
    if (firedThresholds.has(threshold)) {
      continue
    }

    const fireAt = computePreCompletionFireAtMs(plannedEnd, threshold)
    if (effectiveNowMs >= fireAt) {
      return threshold
    }
  }

  return null
}

export function recalculateFiredThresholds(
  plannedEnd: string,
  effectiveNowMs: number,
  firedThresholds: ReadonlySet<PreCompletionThreshold>
): Set<PreCompletionThreshold> {
  const next = new Set<PreCompletionThreshold>()

  for (const threshold of firedThresholds) {
    const fireAt = computePreCompletionFireAtMs(plannedEnd, threshold)
    if (effectiveNowMs >= fireAt) {
      next.add(threshold)
    }
  }

  return next
}

export function formatPreCompletionMessage(title: string, minutes: number): string {
  return `${title} ends in ${minutes} minutes.`
}
