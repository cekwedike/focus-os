import type { ClientProjectRow, DailyScheduleRow, TaskRow } from '@shared/types/db'
import type {
  DailyInsightSnapshot,
  SnapshotBumpedTask,
  SnapshotClientTasks,
  SnapshotScheduleBlock,
  SnapshotTaskItem,
} from '@shared/types/insights'
import type { ReviewSummary } from '@shared/types/review'
import { listStaleClients, type StalenessSettings } from './stalenessSnapshot'

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function mapTaskItem(task: TaskRow): SnapshotTaskItem {
  return {
    id: task.id,
    title: task.title,
    priority: task.priority,
    status: task.status,
    deadlineDate: task.deadline_date,
  }
}

function mapScheduleBlock(
  block: DailyScheduleRow,
  clientNameById: Map<number, string>,
  taskTitleById: Map<number, string>
): SnapshotScheduleBlock {
  return {
    title: block.title,
    blockType: block.block_type,
    protectedSubtype: block.protected_subtype,
    clientName: block.client_id ? clientNameById.get(block.client_id) ?? null : null,
    plannedMinutes: block.planned_duration_minutes,
    actualMinutes: block.actual_duration_minutes,
    status: block.status,
    taskTitle: block.task_id ? taskTitleById.get(block.task_id) ?? null : null,
  }
}

function groupTasksByClient(
  tasks: TaskRow[],
  clients: ClientProjectRow[]
): SnapshotClientTasks[] {
  const clientNameById = new Map(clients.map((client) => [client.id, client.name]))
  const byClient = new Map<number, SnapshotClientTasks>()

  for (const task of tasks) {
    if (!byClient.has(task.client_id)) {
      byClient.set(task.client_id, {
        clientId: task.client_id,
        clientName: clientNameById.get(task.client_id) ?? `Client ${task.client_id}`,
        pending: [],
        completed: [],
      })
    }

    const group = byClient.get(task.client_id)!
    if (task.status === 'completed') {
      group.completed.push(mapTaskItem(task))
    } else if (task.status !== 'cancelled') {
      group.pending.push(mapTaskItem(task))
    }
  }

  return [...byClient.values()].sort((left, right) =>
    left.clientName.localeCompare(right.clientName)
  )
}

export interface ComposeDailySnapshotInput {
  scheduleDate: string
  generatedAt: string
  blocks: DailyScheduleRow[]
  tasks: TaskRow[]
  clients: ClientProjectRow[]
  stalenessSettings: StalenessSettings
  faith: DailyInsightSnapshot['faith']
  yesterdaySummary: ReviewSummary | null
  bumpedTasks: SnapshotBumpedTask[]
}

export function composeDailySnapshot(input: ComposeDailySnapshotInput): DailyInsightSnapshot {
  const clientNameById = new Map(input.clients.map((client) => [client.id, client.name]))
  const taskTitleById = new Map(input.tasks.map((task) => [task.id, task.title]))

  return {
    scheduleDate: input.scheduleDate,
    generatedAt: input.generatedAt,
    blocks: input.blocks
      .filter((block) => block.status !== 'superseded')
      .map((block) => mapScheduleBlock(block, clientNameById, taskTitleById)),
    tasksByClient: groupTasksByClient(input.tasks, input.clients),
    staleClients: listStaleClients(input.clients, input.stalenessSettings),
    faith: input.faith,
    yesterdaySummary: input.yesterdaySummary,
    bumpedTasks: input.bumpedTasks,
  }
}

export function buildBumpedTasksFromRows(
  tasks: Array<TaskRow & { client_name?: string }>,
  scheduleDate: string
): SnapshotBumpedTask[] {
  const tomorrow = addDays(scheduleDate, 1)

  return tasks
    .filter((task) => task.deferred_to_date === tomorrow && task.updated_at.startsWith(scheduleDate))
    .map((task) => ({
      id: task.id,
      title: task.title,
      clientName: task.client_name ?? `Client ${task.client_id}`,
      deferredToDate: task.deferred_to_date ?? tomorrow,
    }))
}
