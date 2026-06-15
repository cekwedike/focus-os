import type {
  AllocationInput,
  ClientInput,
  ProtectedBlockTemplate,
  ScheduleBlock,
  TaskInput,
} from '@shared/allocation/types'

export const SCHEDULE_DATE = '2026-06-14'
export const WAKE_TIME = '2026-06-14T07:00:00'
export const SLEEP_TIME = '23:00'

export function baseInput(overrides: Partial<AllocationInput> = {}): AllocationInput {
  return {
    scheduleDate: SCHEDULE_DATE,
    wakeTime: WAKE_TIME,
    sleepTargetTime: SLEEP_TIME,
    bufferPercent: 10,
    protectedBlocks: defaultProtectedBlocks(),
    clients: defaultClients(),
    tasks: [],
    minViableBlockMinutes: 15,
    maxBufferMinutes: 60,
    ...overrides,
  }
}

export function defaultProtectedBlocks(): ProtectedBlockTemplate[] {
  return [
    {
      id: 1,
      blockType: 'morning_routine',
      label: 'Morning routine',
      durationMinutes: 30,
      anchorType: 'wake_offset',
      anchorValue: '15',
      sortOrder: 0,
      isEnabled: true,
    },
    {
      id: 2,
      blockType: 'faith',
      label: 'Faith',
      durationMinutes: 25,
      anchorType: 'wake_offset',
      anchorValue: '45',
      sortOrder: 1,
      isEnabled: true,
    },
    {
      id: 3,
      blockType: 'winddown',
      label: 'Wind-down',
      durationMinutes: 30,
      anchorType: 'fixed_time',
      anchorValue: '22:00',
      sortOrder: 4,
      isEnabled: true,
    },
  ]
}

export function overlappingProtectedBlocks(): ProtectedBlockTemplate[] {
  return [
    {
      id: 1,
      blockType: 'morning_routine',
      label: 'Morning routine',
      durationMinutes: 60,
      anchorType: 'wake_offset',
      anchorValue: '15',
      sortOrder: 0,
      isEnabled: true,
    },
    {
      id: 2,
      blockType: 'faith',
      label: 'Faith',
      durationMinutes: 30,
      anchorType: 'wake_offset',
      anchorValue: '30',
      sortOrder: 1,
      isEnabled: true,
    },
    {
      id: 3,
      blockType: 'winddown',
      label: 'Wind-down',
      durationMinutes: 30,
      anchorType: 'fixed_time',
      anchorValue: '22:00',
      sortOrder: 4,
      isEnabled: true,
    },
  ]
}

export function defaultClients(): ClientInput[] {
  return [
    {
      id: 1,
      name: 'Client A',
      weightPercent: 60,
      isActive: true,
      fixedBlockEnabled: false,
      sortOrder: 0,
    },
    {
      id: 2,
      name: 'Client B',
      weightPercent: 40,
      isActive: true,
      fixedBlockEnabled: false,
      sortOrder: 1,
    },
  ]
}

export function clientWithFixedBlock(): ClientInput[] {
  return [
    {
      id: 1,
      name: 'Fixed Client',
      weightPercent: 100,
      isActive: true,
      fixedBlockEnabled: true,
      fixedBlockStart: '10:00',
      fixedBlockDurationMinutes: 90,
      sortOrder: 0,
    },
  ]
}

export function sampleTasks(): TaskInput[] {
  return [
    {
      id: 1,
      clientId: 1,
      title: 'High priority task',
      priority: 1,
      deadlineDate: SCHEDULE_DATE,
      estimatedMinutes: 60,
      status: 'pending',
      createdAt: '2026-06-13T10:00:00',
    },
    {
      id: 2,
      clientId: 1,
      title: 'Lower priority task',
      priority: 3,
      deadlineDate: '2026-06-20',
      estimatedMinutes: 90,
      status: 'pending',
      createdAt: '2026-06-13T11:00:00',
    },
    {
      id: 3,
      clientId: 2,
      title: 'Client B task',
      priority: 2,
      deadlineDate: SCHEDULE_DATE,
      estimatedMinutes: 45,
      status: 'pending',
      createdAt: '2026-06-13T12:00:00',
    },
  ]
}

export function manyTasks(): TaskInput[] {
  return Array.from({ length: 20 }, (_, index) => ({
    id: index + 1,
    clientId: 1,
    title: `Task ${index + 1}`,
    priority: 3,
    deadlineDate: SCHEDULE_DATE,
    estimatedMinutes: 120,
    status: 'pending',
    createdAt: `2026-06-13T${String(index).padStart(2, '0')}:00:00`,
  }))
}

export function buildExistingSchedule(blocks: ScheduleBlock[]): ScheduleBlock[] {
  return blocks
}
