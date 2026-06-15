let workPaused = false

export function setWorkPaused(paused: boolean): void {
  workPaused = paused
}

export function isWorkPaused(): boolean {
  return workPaused
}
