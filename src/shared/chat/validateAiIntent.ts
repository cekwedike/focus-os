import type { ChatIntentType } from '@shared/types/chat'
import type { ChatAiExecuteResponse } from '@shared/types/chatAi'
import type { IntentExtracted, RouterContext } from './routerContext'

const EXECUTABLE_INTENTS = new Set<ChatIntentType>([
  'wake_time',
  'add_task',
  'confirm_task_priority',
  'start_block',
  'complete_block',
  'extend_block',
  'skip_block',
  'long_break',
  'end_break',
  'faith_log',
  'query_schedule',
  'query_streak',
  'query_status',
  'query_tasks',
  'complete_task',
  'acknowledge_check_in',
])

export function validateAiExecuteResponse(
  response: ChatAiExecuteResponse,
  context: RouterContext
): ChatAiExecuteResponse | null {
  if (!EXECUTABLE_INTENTS.has(response.intent)) {
    return null
  }

  if (response.intent === 'end_break' && !context.conversation.longBreakActive) {
    return null
  }

  if (response.intent === 'wake_time' && context.conversation.pendingPrompt !== 'wake_time') {
    return null
  }

  if (
    response.intent === 'confirm_task_priority' &&
    context.conversation.pendingPrompt !== 'task_priority'
  ) {
    return null
  }

  const blockIntents = new Set<ChatIntentType>([
    'start_block',
    'complete_block',
    'extend_block',
    'skip_block',
  ])

  if (blockIntents.has(response.intent)) {
    const extracted = response.extracted as { blockId?: number }
    if (typeof extracted.blockId !== 'number') {
      return null
    }
    const blockExists = context.todayBlocks.some((block) => block.id === extracted.blockId)
    if (!blockExists) {
      return null
    }
  }

  if (response.intent === 'acknowledge_check_in') {
    const extracted = response.extracted as { clientId?: number }
    if (typeof extracted.clientId !== 'number') {
      return null
    }
    const due = context.dueCheckInClients.some((client) => client.id === extracted.clientId)
    if (!due) {
      return null
    }
  }

  if (response.intent === 'complete_task') {
    const extracted = response.extracted as { taskId?: number }
    if (typeof extracted.taskId !== 'number') {
      return null
    }
  }

  return {
    ...response,
    extracted: response.extracted as IntentExtracted,
  }
}
