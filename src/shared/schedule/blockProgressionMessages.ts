export type BlockProgressionReason =
  | 'auto_completed'
  | 'manual_completed'
  | 'skipped'
  | 'extended'

export function formatAutoProgressionMessage(
  completedTitle: string,
  nextTitle: string | null,
  options?: { nextStartsAt?: string }
): string {
  if (nextTitle) {
    if (options?.nextStartsAt) {
      return `${completedTitle} complete. Up next: ${nextTitle} at ${options.nextStartsAt}.`
    }

    return `${completedTitle} complete. Up next: ${nextTitle}, starting now.`
  }

  return `${completedTitle} complete. That wraps your scheduled day.`
}

export function formatSkipMessage(
  skippedTitle: string,
  nextTitle: string | null,
  options?: { nextStartsAt?: string }
): string {
  if (nextTitle) {
    if (options?.nextStartsAt) {
      return `Skipped ${skippedTitle}. Up next: ${nextTitle} at ${options.nextStartsAt}.`
    }

    return `Skipped ${skippedTitle}. Up next: ${nextTitle}, starting now.`
  }

  return `Skipped ${skippedTitle}. That wraps your scheduled day.`
}

export function formatExtendMessage(title: string, minutes: number): string {
  return `Extended ${title} by ${minutes} minutes.`
}
