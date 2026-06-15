let workPaused = false
let pauseStartedAt: number | null = null
let accumulatedPauseMs = 0

export function setWorkPaused(paused: boolean): void {
  if (paused && !workPaused) {
    pauseStartedAt = Date.now()
  } else if (!paused && workPaused && pauseStartedAt !== null) {
    accumulatedPauseMs += Date.now() - pauseStartedAt
    pauseStartedAt = null
  }

  workPaused = paused
}

export function isWorkPaused(): boolean {
  return workPaused
}

export function getWorkPausedState(): boolean {
  return workPaused
}

export function getEffectiveNowMs(nowMs = Date.now()): number {
  let pauseMs = accumulatedPauseMs
  if (workPaused && pauseStartedAt !== null) {
    pauseMs += nowMs - pauseStartedAt
  }

  return nowMs - pauseMs
}

export function resetPauseTracking(): void {
  workPaused = false
  pauseStartedAt = null
  accumulatedPauseMs = 0
}
