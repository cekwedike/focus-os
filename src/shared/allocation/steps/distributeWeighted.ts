import {
  createTempId,
  firstFitSegment,
  subtractInterval,
  toIsoLocal,
} from '../timeline'
import type { AllocationState, ClientInput, ScheduleBlock } from '../types'

interface WeightedClient extends ClientInput {
  effectiveWeight: number
  allocatedMinutes: number
}

export function distributeWeighted(
  state: AllocationState,
  clients: ClientInput[],
  scheduleDate: string,
  minViableBlockMinutes: number
): AllocationState {
  const activeClients = clients.filter((client) => client.isActive && client.weightPercent > 0)
  const blocks = [...state.blocks]
  const warnings = [...state.warnings]
  let freeIntervals = [...state.freeIntervals]

  if (activeClients.length === 0) {
    warnings.push('No active clients with weight; no weighted blocks created')
    return { ...state, warnings }
  }

  const weightSum = activeClients.reduce((sum, client) => sum + client.weightPercent, 0)
  if (weightSum <= 0) {
    warnings.push('All active client weights are zero; no weighted blocks created')
    return { ...state, warnings }
  }

  const freeMinutes = freeIntervals.reduce(
    (sum, interval) =>
      sum + Math.round((interval.end.getTime() - interval.start.getTime()) / 60_000),
    0
  )

  const weightedClients: WeightedClient[] = activeClients
    .map((client) => ({
      ...client,
      effectiveWeight: (client.weightPercent / weightSum) * 100,
      allocatedMinutes: Math.floor((freeMinutes * client.weightPercent) / weightSum),
    }))
    .sort((left, right) => {
      if (left.effectiveWeight !== right.effectiveWeight) {
        return left.effectiveWeight > right.effectiveWeight ? -1 : 1
      }
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder < right.sortOrder ? -1 : 1
      }
      return left.id < right.id ? -1 : 1
    })

  let remainder = freeMinutes - weightedClients.reduce((sum, client) => sum + client.allocatedMinutes, 0)
  for (const client of weightedClients) {
    if (remainder <= 0) {
      break
    }
    client.allocatedMinutes += 1
    remainder -= 1
  }

  for (const client of weightedClients) {
    let minutesLeft = client.allocatedMinutes

    while (minutesLeft > 0) {
      const fit = firstFitSegment(freeIntervals, minutesLeft)
      let segment: import('../timeline').TimeInterval
      let duration: number

      if (fit) {
        segment = fit.segment
        duration = Math.round((segment.end.getTime() - segment.start.getTime()) / 60_000)
      } else {
        const smallerFit = findLargestFit(freeIntervals, minViableBlockMinutes)
        if (!smallerFit) {
          warnings.push(
            `Could not place remaining ${minutesLeft} minutes for client '${client.name}'`
          )
          break
        }
        segment = smallerFit.segment
        duration = smallerFit.duration
      }

      if (duration < minViableBlockMinutes) {
        warnings.push(
          `Fragment of ${duration} minutes for '${client.name}' below minimum viable block; skipped`
        )
        freeIntervals = subtractInterval(freeIntervals, segment)
        break
      }

      const block: ScheduleBlock = {
        tempId: createTempId('weighted'),
        scheduleDate,
        blockType: 'weighted_client',
        clientId: client.id,
        title: client.name,
        plannedStart: toIsoLocal(segment.start),
        plannedEnd: toIsoLocal(segment.end),
        plannedDurationMinutes: duration,
      }

      blocks.push(block)
      freeIntervals = subtractInterval(freeIntervals, segment)
      minutesLeft -= duration
    }
  }

  return { ...state, blocks, freeIntervals, warnings }
}

function findLargestFit(
  freeIntervals: import('../timeline').TimeInterval[],
  minViableBlockMinutes: number
): { segment: import('../timeline').TimeInterval; duration: number } | null {
  let best: { segment: import('../timeline').TimeInterval; duration: number } | null = null

  for (const interval of freeIntervals) {
    const duration = Math.round((interval.end.getTime() - interval.start.getTime()) / 60_000)
    if (duration >= minViableBlockMinutes && (!best || duration > best.duration)) {
      best = { segment: interval, duration }
    }
  }

  return best
}

export function countWeightedClientMinutes(blocks: ScheduleBlock[]): number {
  return blocks
    .filter((block) => block.blockType === 'weighted_client')
    .reduce((sum, block) => sum + block.plannedDurationMinutes, 0)
}
