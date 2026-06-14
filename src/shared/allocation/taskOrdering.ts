import type { TaskInput } from './types'

export function sortTasksForFill(tasks: TaskInput[], scheduleDate: string): TaskInput[] {
  return [...tasks].sort((left, right) => {
    const leftDeadline = left.deadlineDate
    const rightDeadline = right.deadlineDate

    const leftOverdue = leftDeadline ? leftDeadline < scheduleDate : false
    const rightOverdue = rightDeadline ? rightDeadline < scheduleDate : false

    if (leftOverdue !== rightOverdue) {
      return leftOverdue ? -1 : 1
    }

    if (leftDeadline && rightDeadline && leftDeadline !== rightDeadline) {
      return leftDeadline < rightDeadline ? -1 : 1
    }
    if (leftDeadline && !rightDeadline) {
      return -1
    }
    if (!leftDeadline && rightDeadline) {
      return 1
    }

    if (left.priority !== right.priority) {
      return left.priority < right.priority ? -1 : 1
    }

    if (left.createdAt !== right.createdAt) {
      return left.createdAt < right.createdAt ? -1 : 1
    }

    return left.id < right.id ? -1 : 1
  })
}

export function sortTasksForBump(tasks: TaskInput[]): TaskInput[] {
  return [...tasks].sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority > right.priority ? -1 : 1
    }

    if (!left.deadlineDate && right.deadlineDate) {
      return -1
    }
    if (left.deadlineDate && !right.deadlineDate) {
      return 1
    }
    if (left.deadlineDate && right.deadlineDate && left.deadlineDate !== right.deadlineDate) {
      return left.deadlineDate > right.deadlineDate ? -1 : 1
    }

    return left.id < right.id ? -1 : 1
  })
}

export function getTaskEstimateMinutes(task: TaskInput, defaultEstimate: number): number {
  return task.estimatedMinutes ?? defaultEstimate
}
