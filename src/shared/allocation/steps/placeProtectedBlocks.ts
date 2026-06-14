import {
  createTempId,
  findLatestOverlapEnd,
  intervalFromStartDuration,
  parseIsoLocal,
  resolveProtectedStart,
  subtractInterval,
  toIsoLocal,
  type TimeInterval,
} from '../timeline'
import type { AllocationState, ProtectedBlockTemplate, ScheduleBlock } from '../types'

export function placeProtectedBlocks(
  state: AllocationState,
  templates: ProtectedBlockTemplate[],
  scheduleDate: string,
  wakeTime: string,
  dayEnd: Date
): AllocationState {
  const enabled = [...templates]
    .filter((template) => template.isEnabled)
    .sort((left, right) => left.sortOrder - right.sortOrder)

  const winddownTemplate = enabled.find((template) => template.blockType === 'winddown')
  const winddownStart = winddownTemplate
    ? resolveProtectedStart(winddownTemplate, scheduleDate, wakeTime)
    : undefined

  const placedIntervals: TimeInterval[] = []
  const blocks = [...state.blocks]
  const warnings = [...state.warnings]
  let freeIntervals = [...state.freeIntervals]

  for (const template of enabled) {
    if (template.blockType === 'winddown' && winddownStart) {
      continue
    }

    let start = resolveProtectedStart(template, scheduleDate, wakeTime, winddownStart ?? undefined)
    if (!start) {
      warnings.push(`Protected block '${template.label}' skipped: invalid anchor`)
      continue
    }

    let candidate = intervalFromStartDuration(start, template.durationMinutes)
    const overlapEnd = findLatestOverlapEnd(candidate, placedIntervals)
    if (overlapEnd) {
      start = overlapEnd
      candidate = intervalFromStartDuration(start, template.durationMinutes)
    }

    if (candidate.end > dayEnd) {
      warnings.push(
        `Protected block '${template.label}' skipped: no room after overlap resolution`
      )
      continue
    }

    if (start < parseIsoLocal(wakeTime)) {
      warnings.push(`Protected block '${template.label}' skipped: starts before wake time`)
      continue
    }

    const block: ScheduleBlock = {
      tempId: createTempId('protected'),
      scheduleDate,
      blockType: 'protected',
      protectedSubtype: template.blockType,
      title: template.label,
      plannedStart: toIsoLocal(candidate.start),
      plannedEnd: toIsoLocal(candidate.end),
      plannedDurationMinutes: template.durationMinutes,
    }

    blocks.push(block)
    placedIntervals.push(candidate)
    freeIntervals = subtractInterval(freeIntervals, candidate)
  }

  if (winddownTemplate && winddownStart) {
    let start = winddownStart
    let candidate = intervalFromStartDuration(start, winddownTemplate.durationMinutes)
    const overlapEnd = findLatestOverlapEnd(candidate, placedIntervals)
    if (overlapEnd) {
      start = overlapEnd
      candidate = intervalFromStartDuration(start, winddownTemplate.durationMinutes)
    }

    if (candidate.end <= dayEnd) {
      const block: ScheduleBlock = {
        tempId: createTempId('protected'),
        scheduleDate,
        blockType: 'protected',
        protectedSubtype: winddownTemplate.blockType,
        title: winddownTemplate.label,
        plannedStart: toIsoLocal(candidate.start),
        plannedEnd: toIsoLocal(candidate.end),
        plannedDurationMinutes: winddownTemplate.durationMinutes,
      }
      blocks.push(block)
      placedIntervals.push(candidate)
      freeIntervals = subtractInterval(freeIntervals, candidate)
    } else {
      warnings.push(`Protected block '${winddownTemplate.label}' skipped: no room in day window`)
    }
  }

  return { ...state, blocks, freeIntervals, warnings }
}

export function countProtectedMinutes(blocks: ScheduleBlock[]): number {
  return blocks
    .filter((block) => block.blockType === 'protected')
    .reduce((sum, block) => sum + block.plannedDurationMinutes, 0)
}
