import type { QuickAddParseResult } from '@shared/parsing/quickAddTask'
import { parseEisenhowerFromText } from '@shared/tasks/eisenhower'
import type { IntentMatch, RouterContext } from '../routerContext'

export function matchTaskPriorityIntent(input: string, context: RouterContext): IntentMatch | null {
  if (context.conversation.pendingPrompt !== 'task_priority' || !context.conversation.pendingTaskDraft) {
    return null
  }

  const parsed = parseEisenhowerFromText(input)
  if (!parsed) {
    return null
  }

  const flags =
    parsed === 'skip'
      ? { isUrgent: null, isImportant: null, skipPriority: true }
      : {
          isUrgent: parsed.isUrgent,
          isImportant: parsed.isImportant,
          skipPriority: false,
        }

  return {
    intent: 'confirm_task_priority',
    extracted: {
      draft: context.conversation.pendingTaskDraft,
      ...flags,
    },
    requiresIpc: true,
  }
}

export function buildTaskPriorityQuickReplies(): Array<{ label: string; sendText: string }> {
  return [
    { label: 'Q1 · Do First', sendText: 'Do first' },
    { label: 'Q2 · Schedule', sendText: 'Schedule' },
    { label: 'Q3 · Delegate', sendText: 'Delegate' },
    { label: 'Q4 · Later', sendText: 'Later' },
    { label: 'Inbox (skip)', sendText: 'No priority' },
  ]
}

export type TaskPriorityPromptPayload = QuickAddParseResult
