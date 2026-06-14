import { DEFAULT_TASK_ESTIMATE_MINUTES } from '../constants'
import { getTaskEstimateMinutes, sortTasksForFill } from '../taskOrdering'
import type { AllocationState, ScheduleBlock, TaskInput } from '../types'

export function fillTasksByPriority(
  state: AllocationState,
  scheduleDate: string,
  minViableBlockMinutes: number
): AllocationState {
  const clientBlocks = state.blocks
    .filter((block) => block.blockType === 'fixed_client' || block.blockType === 'weighted_client')
    .sort((left, right) => left.plannedStart.localeCompare(right.plannedStart))

  const taskQueue = [...state.taskQueue]
  const blocks = state.blocks.map((block) => ({ ...block }))
  const warnings = [...state.warnings]

  for (const clientBlock of clientBlocks) {
    const blockIndex = blocks.findIndex((block) => block.tempId === clientBlock.tempId)
    if (blockIndex < 0 || !clientBlock.clientId) {
      continue
    }

    const candidates = sortTasksForFill(
      taskQueue.filter((task) => task.clientId === clientBlock.clientId),
      scheduleDate
    )

    let remainingMinutes = clientBlock.plannedDurationMinutes
    const assignedTaskIds: number[] = []
    let primaryTaskId: number | undefined

    for (const task of candidates) {
      if (remainingMinutes <= 0) {
        break
      }

      const estimate = getTaskEstimateMinutes(task, DEFAULT_TASK_ESTIMATE_MINUTES)

      if (estimate <= remainingMinutes) {
        assignedTaskIds.push(task.id)
        if (!primaryTaskId) {
          primaryTaskId = task.id
        }
        remainingMinutes -= estimate
        const queueIndex = taskQueue.findIndex((queued) => queued.id === task.id)
        if (queueIndex >= 0) {
          taskQueue.splice(queueIndex, 1)
        }
        continue
      }

      if (remainingMinutes >= minViableBlockMinutes) {
        assignedTaskIds.push(task.id)
        if (!primaryTaskId) {
          primaryTaskId = task.id
        }
        blocks[blockIndex] = {
          ...blocks[blockIndex],
          metadataJson: {
            ...(blocks[blockIndex].metadataJson ?? {}),
            partialTaskId: task.id,
            partialMinutes: remainingMinutes,
          },
        }
        remainingMinutes = 0
        break
      }
    }

    blocks[blockIndex] = {
      ...blocks[blockIndex],
      taskId: primaryTaskId,
      metadataJson: {
        ...(blocks[blockIndex].metadataJson ?? {}),
        assignedTaskIds,
      },
    }
  }

  return { ...state, blocks, taskQueue, warnings }
}

export function refillTasksForBlocks(
  blocks: ScheduleBlock[],
  taskQueue: TaskInput[],
  scheduleDate: string,
  minViableBlockMinutes: number,
  blockTempIds: string[]
): { blocks: ScheduleBlock[]; taskQueue: TaskInput[] } {
  const state: AllocationState = {
    blocks: blocks.map((block) => ({
      ...block,
      taskId: blockTempIds.includes(block.tempId) ? undefined : block.taskId,
      metadataJson: blockTempIds.includes(block.tempId) ? undefined : block.metadataJson,
    })),
    freeIntervals: [],
    warnings: [],
    taskQueue,
  }

  const filteredBlocks = state.blocks.filter(
    (block) =>
      blockTempIds.includes(block.tempId) &&
      (block.blockType === 'fixed_client' || block.blockType === 'weighted_client')
  )

  const partialState: AllocationState = {
    ...state,
    blocks: [...state.blocks.filter((block) => !blockTempIds.includes(block.tempId)), ...filteredBlocks],
  }

  const filled = fillTasksByPriority(partialState, scheduleDate, minViableBlockMinutes)
  return { blocks: filled.blocks, taskQueue: filled.taskQueue }
}
