import { DEFAULT_MVB_MINUTES } from './constants'
import { finalizeAllocation } from './finalize'
import { applyBuffer } from './steps/applyBuffer'
import { distributeWeighted, countWeightedClientMinutes } from './steps/distributeWeighted'
import { fillTasksByPriority } from './steps/fillTasksByPriority'
import {
  countFixedClientMinutes,
  placeFixedClientBlocks,
} from './steps/placeFixedClientBlocks'
import {
  countProtectedMinutes,
  placeProtectedBlocks,
} from './steps/placeProtectedBlocks'
import { sortTasksForFill } from './taskOrdering'
import {
  blocksToIntervals,
  getDayWindow,
  resetTempIdCounter,
} from './timeline'
import type { AllocationInput, AllocationOutput, AllocationState } from './types'

export function allocateDay(input: AllocationInput): AllocationOutput {
  resetTempIdCounter()

  const dayWindow = getDayWindow(input.scheduleDate, input.wakeTime, input.sleepTargetTime)
  if (!dayWindow) {
    return {
      blocks: [],
      bumpedTaskIds: [],
      warnings: ['Wake time is after sleep target; no schedule generated'],
      remainingUnallocatedMinutes: 0,
      metadata: {
        totalProtectedMinutes: 0,
        totalFixedClientMinutes: 0,
        totalWeightedMinutes: 0,
        bufferMinutes: 0,
      },
    }
  }

  const eligibleTasks = sortTasksForFill(
    input.tasks.filter(
      (task) =>
        (task.status === 'pending' || task.status === 'in_progress') &&
        (!task.deferredToDate || task.deferredToDate <= input.scheduleDate)
    ),
    input.scheduleDate
  )

  const minViable = input.minViableBlockMinutes || DEFAULT_MVB_MINUTES

  let state: AllocationState = {
    blocks: [],
    freeIntervals: [dayWindow],
    warnings: [],
    taskQueue: eligibleTasks,
  }

  state = placeProtectedBlocks(
    state,
    input.protectedBlocks,
    input.scheduleDate,
    input.wakeTime,
    dayWindow.end
  )

  const protectedIntervals = blocksToIntervals(
    state.blocks.filter((block) => block.blockType === 'protected')
  )

  state = placeFixedClientBlocks(state, input.clients, input.scheduleDate, protectedIntervals)

  const { state: afterBuffer, bufferMinutes } = applyBuffer(
    state,
    input.bufferPercent,
    input.scheduleDate
  )
  state = afterBuffer

  state = distributeWeighted(state, input.clients, input.scheduleDate, minViable)
  state = fillTasksByPriority(state, input.scheduleDate, minViable)

  return finalizeAllocation(state, {
    totalProtectedMinutes: countProtectedMinutes(state.blocks),
    totalFixedClientMinutes: countFixedClientMinutes(state.blocks),
    totalWeightedMinutes: countWeightedClientMinutes(state.blocks),
    bufferMinutes,
  })
}

export { reallocateAfterLongBreak } from './reallocate'
