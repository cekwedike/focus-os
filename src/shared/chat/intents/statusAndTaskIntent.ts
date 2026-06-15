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

  const completeMatch = trimmed.match(/\b(complete|finish|done with)\s+(.+)$/i)
  if (!completeMatch) {
    return null
  }

  const query = completeMatch[2].trim()
  const task = context.tasks.find((entry) => entry.title.toLowerCase().includes(query))
  if (!task) {
    return null
  }

  return {
    intent: 'complete_task',
    requiresIpc: true,
    extracted: { taskId: task.id, title: task.title },
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
