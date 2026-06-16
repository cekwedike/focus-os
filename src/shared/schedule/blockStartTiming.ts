export interface BlockWithPlannedStart {
  status: string
  planned_start: string
}

export function isBlockStartDue(
  block: BlockWithPlannedStart,
  nowMs: number = Date.now()
): boolean {
  if (block.status !== 'planned') {
    return false
  }

  const plannedStartMs = new Date(block.planned_start).getTime()
  if (Number.isNaN(plannedStartMs)) {
    return false
  }

  return nowMs >= plannedStartMs
}
