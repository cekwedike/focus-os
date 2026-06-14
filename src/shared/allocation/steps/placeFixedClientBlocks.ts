import {
  createTempId,
  intervalFromStartDuration,
  overlaps,
  parseScheduleDateTime,
  subtractInterval,
  toIsoLocal,
  type TimeInterval,
} from '../timeline'
import type { AllocationState, ClientInput, ScheduleBlock } from '../types'

export function placeFixedClientBlocks(
  state: AllocationState,
  clients: ClientInput[],
  scheduleDate: string,
  protectedIntervals: TimeInterval[]
): AllocationState {
  const fixedClients = clients
    .filter(
      (client) =>
        client.isActive &&
        client.fixedBlockEnabled &&
        client.fixedBlockStart &&
        client.fixedBlockDurationMinutes &&
        client.fixedBlockDurationMinutes > 0
    )
    .sort((left, right) => left.sortOrder - right.sortOrder)

  const blocks = [...state.blocks]
  const warnings = [...state.warnings]
  let freeIntervals = [...state.freeIntervals]

  for (const client of fixedClients) {
    const start = parseScheduleDateTime(scheduleDate, client.fixedBlockStart as string)
    const duration = client.fixedBlockDurationMinutes as number
    const candidate = intervalFromStartDuration(start, duration)

    const collidesWithProtected = protectedIntervals.some((interval) => overlaps(candidate, interval))
    if (collidesWithProtected) {
      warnings.push(
        `Fixed block for '${client.name}' skipped: overlaps protected block (protected wins)`
      )
      continue
    }

    const fitsInFree = freeIntervals.some(
      (interval) => candidate.start >= interval.start && candidate.end <= interval.end
    )
    if (!fitsInFree) {
      warnings.push(`Fixed block for '${client.name}' skipped: no free interval available`)
      continue
    }

    const block: ScheduleBlock = {
      tempId: createTempId('fixed'),
      scheduleDate,
      blockType: 'fixed_client',
      clientId: client.id,
      title: client.name,
      plannedStart: toIsoLocal(candidate.start),
      plannedEnd: toIsoLocal(candidate.end),
      plannedDurationMinutes: duration,
    }

    blocks.push(block)
    freeIntervals = subtractInterval(freeIntervals, candidate)
  }

  return { ...state, blocks, freeIntervals, warnings }
}

export function countFixedClientMinutes(blocks: ScheduleBlock[]): number {
  return blocks
    .filter((block) => block.blockType === 'fixed_client')
    .reduce((sum, block) => sum + block.plannedDurationMinutes, 0)
}
