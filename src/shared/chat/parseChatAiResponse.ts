import type { ChatAttachmentType } from '@shared/types/chat'
import type { ChatAiParsedResponse } from '@shared/types/chatAi'

const ATTACHMENT_TYPES = new Set<ChatAttachmentType>([
  'schedule_card',
  'task_summary_card',
  'faith_streak_card',
  'focus_score_card',
  'planned_vs_actual_card',
])

function stripMarkdownFences(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  }
  return trimmed
}

export function parseChatAiResponse(raw: string): ChatAiParsedResponse | null {
  try {
    const cleaned = stripMarkdownFences(raw)
    const parsed = JSON.parse(cleaned) as Record<string, unknown>
    const mode = parsed.mode

    if (mode === 'unavailable') {
      return { mode: 'unavailable' }
    }

    if (mode === 'conversational') {
      const replyText = typeof parsed.replyText === 'string' ? parsed.replyText.trim() : ''
      if (!replyText) {
        return null
      }

      const suggested = parsed.suggestedAttachment
      const suggestedAttachment =
        typeof suggested === 'string' && ATTACHMENT_TYPES.has(suggested as ChatAttachmentType)
          ? (suggested as ChatAttachmentType)
          : undefined

      return {
        mode: 'conversational',
        replyText,
        suggestedAttachment,
      }
    }

    if (mode === 'execute') {
      const intent = parsed.intent
      if (typeof intent !== 'string') {
        return null
      }

      const extracted =
        parsed.extracted && typeof parsed.extracted === 'object'
          ? (parsed.extracted as Record<string, unknown>)
          : {}

      const replyText =
        typeof parsed.replyText === 'string' ? parsed.replyText.trim() : undefined

      return {
        mode: 'execute',
        intent: intent as ChatAiParsedResponse extends { mode: 'execute' }
          ? ChatAiParsedResponse['intent']
          : never,
        extracted,
        replyText: replyText || undefined,
      }
    }

    return null
  } catch {
    return null
  }
}
