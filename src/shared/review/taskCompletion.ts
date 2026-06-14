import type { ReviewScheduleRow } from '@shared/types/review'

export interface TaskCompletionResult {
  scheduledTaskBlocks: number
  completedTaskBlocks: number
  taskCompletionRate: number | null
}

export function calculateTaskCompletionRate(rows: ReviewScheduleRow[]): TaskCompletionResult {
  const scheduled = rows.filter((row) => row.task_id !== null && row.status !== 'superseded')
  const completed = scheduled.filter((row) => row.status === 'completed')

  const scheduledTaskBlocks = scheduled.length
  const completedTaskBlocks = completed.length

  if (scheduledTaskBlocks === 0) {
    return {
      scheduledTaskBlocks: 0,
      completedTaskBlocks: 0,
      taskCompletionRate: null,
    }
  }

  return {
    scheduledTaskBlocks,
    completedTaskBlocks,
    taskCompletionRate: Math.round((completedTaskBlocks / scheduledTaskBlocks) * 100),
  }
}
