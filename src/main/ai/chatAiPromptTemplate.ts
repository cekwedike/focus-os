import type { ChatRouterContextSummary } from '@shared/types/chatAi'
import type { ChatIntentType } from '@shared/types/chat'

export const CHAT_AI_SYSTEM_PROMPT =
  'You are Focus OS, a calm assistant for a freelancer productivity app. You help interpret user messages and respond with strict JSON only.'

const VALID_INTENTS: ChatIntentType[] = [
  'wake_time',
  'add_task',
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
]

export function buildChatAiUserPrompt(
  userMessage: string,
  snapshotJson: string,
  contextSummary: ChatRouterContextSummary
): string {
  const contextJson = JSON.stringify(contextSummary)

  return `The user sent a chat message that the deterministic intent router could not match.

User message:
${userMessage}

Router context (conversation state, blocks, clients):
${contextJson}

Daily snapshot JSON:
${snapshotJson}

Respond with ONLY valid JSON (no markdown fences) using one of these shapes:

1. Execute an action:
{"mode":"execute","intent":"<intent>","extracted":{...},"replyText":"optional short confirmation"}

Valid intents: ${VALID_INTENTS.join(', ')}

Extracted fields by intent:
- wake_time: {"wakeTime":"HH:MM"} (24h)
- add_task: {"parseResult":{"title":"...","clientId":number|null,"isUrgent":boolean|null,"isImportant":boolean|null,"skipPriority":boolean,"deadlineDate":"YYYY-MM-DD"|null,"estimatedMinutes":number|null}}
- start_block/complete_block/extend_block/skip_block: {"blockId":number,"title":"..."}
- long_break: {"reason":"...","plannedMinutes":number|null}
- end_break: {}
- faith_log: {"bibleReference":"...","prayerNotes":"...","blockId":number|null}
- acknowledge_check_in: {"clientId":number,"clientName":"..."}
- complete_task: {"taskId":number,"title":"..."}
- query_schedule, query_streak, query_status, query_tasks: {}

2. Conversational reply (no action):
{"mode":"conversational","replyText":"...","suggestedAttachment":"schedule_card"|"task_summary_card"|"faith_streak_card"|"focus_score_card"|"planned_vs_actual_card"|null}

3. Cannot help:
{"mode":"unavailable"}

Rules:
- Only use execute mode when you are confident the user wants that action and extracted fields match context (real block/client/task ids).
- Never invent schedule mutations beyond the listed intents.
- For greetings, vague questions, or unclear requests, use conversational mode with snapshot facts.
- Respect conversation state: end_break only if longBreakActive is true; wake_time only if pendingPrompt is wake_time.
- Keep replyText warm and concise.`
}
