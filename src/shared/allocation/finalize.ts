import { totalMinutes } from './timeline'
import type { AllocationOutput, AllocationState } from './types'

export function finalizeAllocation(
  state: AllocationState,
  metadata: AllocationOutput['metadata']
): AllocationOutput {
  const sortedBlocks = [...state.blocks].sort((left, right) =>
    left.plannedStart.localeCompare(right.plannedStart)
  )

  const blocks = sortedBlocks.map((block, index) => ({
    ...block,
    priorityOrder: index + 1,
  }))

  return {
    blocks,
    bumpedTaskIds: [],
    warnings: state.warnings,
    remainingUnallocatedMinutes: totalMinutes(state.freeIntervals),
    metadata,
  }
}
