import type { IntentMatch } from '../routerContext'

export function matchQueryStatusIntent(input: string): IntentMatch | null {
  const trimmed = input.trim().toLowerCase()

  if (/\bhow am i doing\b/.test(trimmed)) {
    return { intent: 'query_status', requiresIpc: true }
  }

  if (/\b(focus\s+score|my\s+progress|day\s+progress)\b/.test(trimmed)) {
    return { intent: 'query_status', requiresIpc: true }
  }

  if (/\bhow('s| is)\s+(my\s+)?day\s+going\b/.test(trimmed)) {
    return { intent: 'query_status', requiresIpc: true }
  }

  return null
}

export function matchQueryTasksIntent(input: string): IntentMatch | null {
  const trimmed = input.trim().toLowerCase()

  if (/\b(list|show|what are)\s+(my\s+)?tasks\b/.test(trimmed)) {
    return { intent: 'query_tasks', requiresIpc: true }
  }

  if (/\bwhat tasks\b/.test(trimmed)) {
    return { intent: 'query_tasks', requiresIpc: true }
  }

  return null
}

export function matchCompleteTaskIntent(input: string, context: { tasks: Array<{ id: number; title: string }> }): IntentMatch | null {
  const trimmed = input.trim().toLowerCase()

  const completeMatch = trimmed.match(/\b(complete|finish|done with|mark)\s+(.+)$/i)
  if (!completeMatch) {
    return null
  }

  const query = completeMatch[2].trim()
  const task = findTaskByQuery(context.tasks, query)
  if (!task) {
    return null
  }

  return {
    intent: 'complete_task',
    requiresIpc: true,
    extracted: { taskId: task.id, title: task.title },
  }
}

function findTaskByQuery(
  tasks: Array<{ id: number; title: string }>,
  query: string
): { id: number; title: string } | null {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return null
  }

  const direct = tasks.find((entry) => entry.title.toLowerCase().includes(normalized))
  if (direct) {
    return direct
  }

  const tokens = normalized.split(/\s+/).filter((token) => token.length > 2)
  if (tokens.length === 0) {
    return null
  }

  return (
    tasks.find((entry) => {
      const title = entry.title.toLowerCase()
      return tokens.some((token) => title.includes(token))
    }) ?? null
  )
}

function mostRecentTask(
  tasks: Array<{ id: number; title: string }>
): { id: number; title: string } | null {
  if (tasks.length === 0) {
    return null
  }
  return [...tasks].sort((left, right) => right.id - left.id)[0] ?? null
}

export function matchDeleteTaskIntent(
  input: string,
  context: { tasks: Array<{ id: number; title: string }> }
): IntentMatch | null {
  const trimmed = input.trim().toLowerCase()

  if (
    /\b(delete|remove|cancel)\b/.test(trimmed) &&
    /\b(recently added|last added|just added|recent)\b/.test(trimmed)
  ) {
    const task = mostRecentTask(context.tasks)
    if (!task) {
      return null
    }
    return {
      intent: 'delete_task',
      requiresIpc: true,
      extracted: { taskId: task.id, title: task.title },
    }
  }

  if (/^(delete|remove|cancel)\s+(the\s+)?task[.!?\s]*$/i.test(trimmed)) {
    const task = mostRecentTask(context.tasks)
    if (!task) {
      return null
    }
    return {
      intent: 'delete_task',
      requiresIpc: true,
      extracted: { taskId: task.id, title: task.title },
    }
  }

  const deleteMatch = trimmed.match(/\b(delete|remove|cancel)\s+(?:the\s+)?(?:task\s+)?(.+)$/i)
  if (!deleteMatch) {
    return null
  }

  const query = deleteMatch[2].trim()
  if (!query || query === 'task') {
    const task = mostRecentTask(context.tasks)
    if (!task) {
      return null
    }
    return {
      intent: 'delete_task',
      requiresIpc: true,
      extracted: { taskId: task.id, title: task.title },
    }
  }

  const task = findTaskByQuery(context.tasks, query)
  if (!task) {
    return null
  }

  return {
    intent: 'delete_task',
    requiresIpc: true,
    extracted: { taskId: task.id, title: task.title },
  }
}

export function matchUpdateTaskIntent(
  input: string,
  context: { tasks: Array<{ id: number; title: string }> }
): IntentMatch | null {
  const trimmed = input.trim()

  const renameMatch = trimmed.match(
    /\b(?:edit|rename|update)\s+(?:the\s+)?(?:task\s+)?(.+?)\s+(?:to|as)\s+(.+)$/i
  )
  if (!renameMatch) {
    return null
  }

  const task = findTaskByQuery(context.tasks, renameMatch[1].trim())
  const newTitle = renameMatch[2].trim()
  if (!task || !newTitle) {
    return null
  }

  return {
    intent: 'update_task',
    requiresIpc: true,
    extracted: { taskId: task.id, title: newTitle, previousTitle: task.title },
  }
}

export function matchReplanDayIntent(input: string): IntentMatch | null {
  const trimmed = input.trim().toLowerCase()

  if (/\b(replan|rebuild|regenerate)\s+(my\s+)?(day|schedule)\b/.test(trimmed)) {
    return { intent: 'replan_day', requiresIpc: false }
  }

  if (/\badvanced\s+(wake|planning)\b/.test(trimmed)) {
    return { intent: 'replan_day', requiresIpc: false }
  }

  return null
}
