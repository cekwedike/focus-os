import type { TaskSummaryCardAttachment, TaskSummaryItem } from '@shared/types/chat'

export interface TaskRowForCard {
  id: number
  title: string
  client_name?: string | null
  priority: number
  deadline_date: string | null
  status: string
}

export function buildTaskSummaryCard(tasks: TaskRowForCard[]): TaskSummaryCardAttachment {
  const items: TaskSummaryItem[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    clientName: task.client_name?.trim() || 'Unassigned',
    priority: task.priority,
    deadlineDate: task.deadline_date,
    status: task.status,
  }))

  return {
    type: 'task_summary_card',
    tasks: items,
  }
}
