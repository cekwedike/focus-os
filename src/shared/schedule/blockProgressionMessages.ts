export type BlockProgressionReason =
  | 'auto_completed'
  | 'manual_completed'
  | 'skipped'
  | 'extended'

export function formatAutoProgressionMessage(
  completedTitle: string,
  nextTitle: string | null
): string {
  if (nextTitle) {
    return `${completedTitle} complete. Up next: ${nextTitle}, starting now.`
  }

  return `${completedTitle} complete. That wraps your scheduled day.`
}

export function formatSkipMessage(skippedTitle: string, nextTitle: string | null): string {
  if (nextTitle) {
    return `Skipped ${skippedTitle}. Up next: ${nextTitle}.`
  }

  return `Skipped ${skippedTitle}. That wraps your scheduled day.`
}

export function formatExtendMessage(title: string, minutes: number): string {
  return `Extended ${title} by ${minutes} minutes.`
}
