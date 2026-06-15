import { parseQuickAddTask } from '@shared/parsing/quickAddTask'
import { ambiguousClient } from '../responseTemplates'
import type { AddTaskExtracted, IntentMatch, RouterContext } from '../routerContext'

const ADD_TASK_PATTERNS = [
  /^add\s+(.+)$/i,
  /^remind me to\s+(.+)$/i,
  /^i need to\s+(.+)$/i,
]

export function matchAddTaskIntent(input: string, context: RouterContext): IntentMatch | null {
  const trimmed = input.trim()
  let body: string | null = null

  for (const pattern of ADD_TASK_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) {
      body = match[1].trim()
      break
    }
  }

  if (!body) {
    return null
  }

  const parseResult = parseQuickAddTask(body, context.clients, context.unassignedClientId)

  if (parseResult.ambiguousClients && parseResult.ambiguousClients.length > 1) {
    return {
      intent: 'unrecognized',
      ambiguousMessage: ambiguousClient(parseResult.ambiguousClients),
      requiresIpc: false,
    }
  }

  const extracted: AddTaskExtracted = { parseResult }
  return { intent: 'add_task', extracted, requiresIpc: true }
}
