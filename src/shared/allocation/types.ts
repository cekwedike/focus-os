export type BlockType = 'protected' | 'fixed_client' | 'weighted_client' | 'buffer' | 'break'

export interface ScheduleBlock {
  tempId: string
  scheduleDate: string
  blockType: BlockType
  protectedSubtype?: string
  clientId?: number
  taskId?: number
  title: string
  plannedStart: string
  plannedEnd: string
  plannedDurationMinutes: number
  priorityOrder?: number
  metadataJson?: Record<string, unknown>
  status?: string
}

export interface ClientInput {
  id: number
  name: string
  weightPercent: number
  isActive: boolean
  fixedBlockEnabled: boolean
  fixedBlockStart?: string | null
  fixedBlockDurationMinutes?: number | null
  sortOrder: number
}

export interface TaskInput {
  id: number
  clientId: number
  title: string
  priority: number
  deadlineDate?: string | null
  estimatedMinutes?: number | null
  status: string
  deferredToDate?: string | null
  createdAt: string
}

export interface ProtectedBlockTemplate {
  id: number
  blockType: string
  label: string
  durationMinutes: number
  anchorType: 'wake_offset' | 'fixed_time' | 'relative'
  anchorValue: string
  sortOrder: number
  isEnabled: boolean
}

export interface BreakInput {
  startTime: string
  endTime: string
  durationMinutes: number
}

export interface AllocationInput {
  scheduleDate: string
  wakeTime: string
  sleepTargetTime?: string
  bufferPercent: number
  protectedBlocks: ProtectedBlockTemplate[]
  clients: ClientInput[]
  tasks: TaskInput[]
  minViableBlockMinutes: number
  existingBreaks?: BreakInput[]
}

export interface AllocationMetadata {
  totalProtectedMinutes: number
  totalFixedClientMinutes: number
  totalWeightedMinutes: number
  bufferMinutes: number
}

export interface AllocationOutput {
  blocks: ScheduleBlock[]
  bumpedTaskIds: number[]
  warnings: string[]
  remainingUnallocatedMinutes: number
  metadata: AllocationMetadata
}

export interface ReplanSummary {
  returnTime: string
  longBreakDurationMinutes: number
  blocksRemoved: Array<{ blockId: string; clientId: number; reason: string }>
  blocksCompressed: Array<{ blockId: string; beforeMinutes: number; afterMinutes: number }>
  protectedBlocksUnchanged: number
  bumpedTaskIds: number[]
  message: string
}

export interface ReallocationOutput extends AllocationOutput {
  replanSummary: ReplanSummary
}

export interface AllocationState {
  blocks: ScheduleBlock[]
  freeIntervals: import('./timeline').TimeInterval[]
  warnings: string[]
  taskQueue: TaskInput[]
}
