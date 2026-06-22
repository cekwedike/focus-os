const snoozedUntil = new Map<number, number>()
let pausedUntilMs = 0

export function snoozeBlock(blockId: number, minutes: number): void {
  snoozedUntil.set(blockId, Date.now() + minutes * 60_000)
}

export function pauseAutoStart(minutes: number): void {
  pausedUntilMs = Date.now() + minutes * 60_000
}

export function isAutoStartPaused(): boolean {
  if (Date.now() < pausedUntilMs) {
    return true
  }
  pausedUntilMs = 0
  return false
}

export function getSnoozedBlockIds(): Set<number> {
  const now = Date.now()
  for (const [blockId, until] of snoozedUntil.entries()) {
    if (until <= now) {
      snoozedUntil.delete(blockId)
    }
  }
  return new Set(snoozedUntil.keys())
}

export function isBlockSnoozed(blockId: number): boolean {
  const until = snoozedUntil.get(blockId)
  if (!until) {
    return false
  }
  if (until <= Date.now()) {
    snoozedUntil.delete(blockId)
    return false
  }
  return true
}
