import type { ProtectedBlockType } from '@shared/types/db'

export const PROTECTED_BLOCK_HEADINGS: Record<ProtectedBlockType, string> = {
  morning_routine: 'Morning Routine',
  faith: 'Faith And Prayer',
  meal: 'Meal Break',
  micro_break: 'Short Break',
  winddown: 'Evening Wind-Down',
}

export const PROTECTED_BLOCK_HINTS: Record<ProtectedBlockType, string> = {
  morning_routine: 'Gets scheduled before client work starts.',
  faith: 'Bible reading, prayer, or quiet reflection.',
  meal: 'Lunch, breakfast, or another meal you protect on the calendar.',
  micro_break: 'A planned pause separate from pop-up break reminders.',
  winddown: 'Time to slow down before the end of your day.',
}

export interface RoutineGroupDefinition {
  id: 'morning' | 'afternoon' | 'evening'
  title: string
  description: string
  blockTypes: ProtectedBlockType[]
}

export const ROUTINE_GROUPS: RoutineGroupDefinition[] = [
  {
    id: 'morning',
    title: 'Morning',
    description: 'Start-of-day habits before client work begins.',
    blockTypes: ['morning_routine', 'faith'],
  },
  {
    id: 'afternoon',
    title: 'Afternoon',
    description: 'Midday meals and planned pauses.',
    blockTypes: ['meal', 'micro_break'],
  },
  {
    id: 'evening',
    title: 'Evening And Night',
    description: 'Wind-down and end-of-day routines.',
    blockTypes: ['winddown'],
  },
]

export const SCHEDULE_TIMING_OPTIONS = [
  { value: 'wake_offset' as const, label: 'After I Wake Up' },
  { value: 'fixed_time' as const, label: 'At The Same Time Each Day' },
  { value: 'relative' as const, label: 'Before Evening Wind-Down' },
]

export function scheduleTimingDetailLabel(
  anchorType: 'wake_offset' | 'fixed_time' | 'relative'
): string {
  if (anchorType === 'wake_offset') {
    return 'Minutes After Wake-Up'
  }
  if (anchorType === 'fixed_time') {
    return 'Time Of Day'
  }
  return 'Minutes Before Wind-Down'
}

export function routineGroupForBlockType(blockType: ProtectedBlockType): RoutineGroupDefinition['id'] {
  const group = ROUTINE_GROUPS.find((entry) => entry.blockTypes.includes(blockType))
  return group?.id ?? 'afternoon'
}
