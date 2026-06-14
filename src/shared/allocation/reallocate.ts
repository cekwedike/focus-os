import { DEFAULT_MVB_MINUTES } from './constants'
import { finalizeAllocation } from './finalize'
import { refillTasksForBlocks } from './steps/fillTasksByPriority'
import { sortTasksForBump } from './taskOrdering'
import {
  addMinutes,
  blocksToIntervals,
  getDayWindow,
  minutesBetween,
  parseIsoLocal,
  subtractIntervals,
  toIsoLocal,
  type TimeInterval,
} from './timeline'
import type {
  AllocationInput,
  AllocationOutput,
  ReallocationOutput,
  ReplanSummary,
  ScheduleBlock,
} from './types'

export function reallocateAfterLongBreak(
  input: AllocationInput,
  existingBlocks: ScheduleBlock[],
  returnTime: string,
  longBreakDurationMinutes: number
): ReallocationOutput {
  const minViable = input.minViableBlockMinutes || DEFAULT_MVB_MINUTES
  const returnDate = parseIsoLocal(returnTime)
  const warnings: string[] = []
  const bumpedTaskIds: number[] = []
  const blocksRemoved: ReplanSummary['blocksRemoved'] = []
  const blocksCompressed: ReplanSummary['blocksCompressed'] = []

  const frozenBlocks = existingBlocks.filter((block) => {
    const plannedEnd = parseIsoLocal(block.plannedEnd)
    if (plannedEnd <= returnDate) {
      return true
    }
    if (block.blockType === 'protected') {
      return true
    }
    if (block.blockType === 'buffer') {
      return true
    }
    return false
  })

  const futureClientBlocks = existingBlocks
    .filter(
      (block) =>
        (block.blockType === 'fixed_client' || block.blockType === 'weighted_client') &&
        parseIsoLocal(block.plannedStart) >= returnDate
    )
    .sort((left, right) => left.plannedStart.localeCompare(right.plannedStart))

  const dayWindow = getDayWindow(input.scheduleDate, input.wakeTime, input.sleepTargetTime)
  if (!dayWindow) {
    const empty = finalizeAllocation(
      { blocks: frozenBlocks, freeIntervals: [], warnings: ['Invalid day window'], taskQueue: [] },
      summarizeMetadata(frozenBlocks)
    )
    return {
      ...empty,
      bumpedTaskIds: [],
      replanSummary: buildSummary(
        returnTime,
        longBreakDurationMinutes,
        blocksRemoved,
        blocksCompressed,
        countProtectedUnchanged(frozenBlocks),
        [],
        'Schedule could not be adjusted: invalid day window'
      ),
    }
  }

  const immovableIntervals = blocksToIntervals(frozenBlocks.filter((block) => block.plannedStart >= returnTime || block.blockType === 'protected' || block.blockType === 'buffer'))

  const availableWindow: TimeInterval = { start: returnDate, end: dayWindow.end }
  const freeIntervals = subtractIntervals([availableWindow], immovableIntervals)

  const remainingClientMinutes = futureClientBlocks.reduce(
    (sum, block) => sum + block.plannedDurationMinutes,
    0
  )
  const availableClientMinutes = freeIntervals.reduce(
    (sum, interval) => sum + minutesBetween(interval.start, interval.end),
    0
  )

  let resizedBlocks: ScheduleBlock[] = []
  const freedByClient = new Map<number, number>()

  if (remainingClientMinutes <= availableClientMinutes) {
    let cursor = returnDate
    for (const block of futureClientBlocks) {
      const end = addMinutes(cursor, block.plannedDurationMinutes)
      resizedBlocks.push({
        ...block,
        plannedStart: toIsoLocal(cursor),
        plannedEnd: toIsoLocal(end),
        status: block.status ?? 'scheduled',
      })
      cursor = end
    }
  } else {
    const ratio =
      remainingClientMinutes > 0 ? availableClientMinutes / remainingClientMinutes : 0

    for (const block of futureClientBlocks) {
      const newDuration = Math.floor(block.plannedDurationMinutes * ratio)
      blocksCompressed.push({
        blockId: block.tempId,
        beforeMinutes: block.plannedDurationMinutes,
        afterMinutes: newDuration,
      })

      if (newDuration >= minViable) {
        resizedBlocks.push({
          ...block,
          plannedDurationMinutes: newDuration,
          metadataJson: {
            ...(block.metadataJson ?? {}),
            compressed: true,
            originalDurationMinutes: block.plannedDurationMinutes,
          },
        })
      } else {
        blocksRemoved.push({
          blockId: block.tempId,
          clientId: block.clientId ?? 0,
          reason: 'Below minimum viable block after compression',
        })
        if (block.clientId) {
          const current = freedByClient.get(block.clientId) ?? 0
          freedByClient.set(block.clientId, current + block.plannedDurationMinutes)
        }
        if (block.taskId) {
          bumpedTaskIds.push(block.taskId)
        }
        const assignedIds = (block.metadataJson?.assignedTaskIds as number[] | undefined) ?? []
        for (const taskId of assignedIds) {
          if (!bumpedTaskIds.includes(taskId)) {
            bumpedTaskIds.push(taskId)
          }
        }
      }
    }

    let cursor = returnDate
    resizedBlocks = resizedBlocks.map((block) => {
      const end = addMinutes(cursor, block.plannedDurationMinutes)
      const updated = {
        ...block,
        plannedStart: toIsoLocal(cursor),
        plannedEnd: toIsoLocal(end),
        status: 'compressed',
      }
      cursor = end
      return updated
    })
  }

  resizedBlocks = applySecondPass(resizedBlocks, freedByClient, minViable)

  const pastBlocks = frozenBlocks.filter((block) => parseIsoLocal(block.plannedEnd) <= returnDate)
  const immovableFuture = frozenBlocks.filter(
    (block) =>
      parseIsoLocal(block.plannedEnd) > returnDate &&
      (block.blockType === 'protected' || block.blockType === 'buffer')
  )

  let combinedBlocks = [...pastBlocks, ...immovableFuture, ...resizedBlocks]

  const taskQueue = input.tasks.filter(
    (task) =>
      (task.status === 'pending' || task.status === 'in_progress') &&
      !bumpedTaskIds.includes(task.id)
  )

  const affectedIds = resizedBlocks.map((block) => block.tempId)
  const refilled = refillTasksForBlocks(
    combinedBlocks,
    taskQueue,
    input.scheduleDate,
    minViable,
    affectedIds
  )
  combinedBlocks = refilled.blocks

  const bumpedFromQueue = sortTasksForBump(
    input.tasks.filter((task) => bumpedTaskIds.includes(task.id))
  )
  for (const task of bumpedFromQueue) {
    if (!bumpedTaskIds.includes(task.id)) {
      bumpedTaskIds.push(task.id)
    }
  }

  if (bumpedTaskIds.length > 0) {
    warnings.push(
      `Schedule over-constrained after long break; ${bumpedTaskIds.length} tasks deferred`
    )
  }

  const state = {
    blocks: combinedBlocks,
    freeIntervals: [],
    warnings,
    taskQueue: refilled.taskQueue,
  }

  const output = finalizeAllocation(state, summarizeMetadata(combinedBlocks))

  const message =
    bumpedTaskIds.length > 0 || blocksCompressed.length > 0
      ? `Day re-planned after long break. ${bumpedTaskIds.length} task(s) moved to tomorrow.`
      : 'Schedule adjusted for your return. No tasks moved to tomorrow.'

  return {
    ...output,
    bumpedTaskIds,
    replanSummary: buildSummary(
      returnTime,
      longBreakDurationMinutes,
      blocksRemoved,
      blocksCompressed,
      countProtectedUnchanged(immovableFuture),
      bumpedTaskIds,
      message
    ),
  }
}

function applySecondPass(
  blocks: ScheduleBlock[],
  freedByClient: Map<number, number>,
  minViable: number
): ScheduleBlock[] {
  if (freedByClient.size === 0) {
    return blocks
  }

  const updated = blocks.map((block) => ({ ...block }))

  for (const [clientId, freedMinutes] of freedByClient) {
    if (freedMinutes <= 0) {
      continue
    }

    const clientBlocks = updated
      .filter(
        (block) =>
          block.clientId === clientId &&
          (block.blockType === 'fixed_client' || block.blockType === 'weighted_client')
      )
      .sort((left, right) => left.plannedStart.localeCompare(right.plannedStart))

    if (clientBlocks.length === 0) {
      continue
    }

    const target = clientBlocks[0]
    const index = updated.findIndex((block) => block.tempId === target.tempId)
    if (index < 0) {
      continue
    }

    const newDuration = target.plannedDurationMinutes + freedMinutes
    if (newDuration < minViable) {
      continue
    }

    const start = parseIsoLocal(target.plannedStart)
    updated[index] = {
      ...target,
      plannedDurationMinutes: newDuration,
      plannedEnd: toIsoLocal(addMinutes(start, newDuration)),
      metadataJson: {
        ...(target.metadataJson ?? {}),
        secondPassMinutesAdded: freedMinutes,
      },
    }
  }

  return updated
}

function countProtectedUnchanged(blocks: ScheduleBlock[]): number {
  return blocks.filter((block) => block.blockType === 'protected').length
}

function summarizeMetadata(blocks: ScheduleBlock[]): AllocationOutput['metadata'] {
  return {
    totalProtectedMinutes: blocks
      .filter((block) => block.blockType === 'protected')
      .reduce((sum, block) => sum + block.plannedDurationMinutes, 0),
    totalFixedClientMinutes: blocks
      .filter((block) => block.blockType === 'fixed_client')
      .reduce((sum, block) => sum + block.plannedDurationMinutes, 0),
    totalWeightedMinutes: blocks
      .filter((block) => block.blockType === 'weighted_client')
      .reduce((sum, block) => sum + block.plannedDurationMinutes, 0),
    bufferMinutes: blocks
      .filter((block) => block.blockType === 'buffer')
      .reduce((sum, block) => sum + block.plannedDurationMinutes, 0),
  }
}

function buildSummary(
  returnTime: string,
  longBreakDurationMinutes: number,
  blocksRemoved: ReplanSummary['blocksRemoved'],
  blocksCompressed: ReplanSummary['blocksCompressed'],
  protectedBlocksUnchanged: number,
  bumpedTaskIds: number[],
  message: string
): ReplanSummary {
  return {
    returnTime,
    longBreakDurationMinutes,
    blocksRemoved,
    blocksCompressed,
    protectedBlocksUnchanged,
    bumpedTaskIds,
    message,
  }
}
