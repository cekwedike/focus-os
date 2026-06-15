import { useCallback, useEffect, useState } from 'react'
import type { ChatMessage } from '@shared/types/chat'

const CHAT_STORAGE_KEY = 'focus-os-chat-v1'
const MAX_MESSAGES = 80

function createMessageId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function loadStoredMessages(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as ChatMessage[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistMessages(messages: ChatMessage[]): void {
  try {
    sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)))
  } catch {
    // sessionStorage may be unavailable in some contexts
  }
}

export function useChatSession() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadStoredMessages())

  useEffect(() => {
    persistMessages(messages)
  }, [messages])

  const appendMessage = useCallback((role: ChatMessage['role'], content: string): ChatMessage => {
    const message: ChatMessage = {
      id: createMessageId(),
      role,
      content,
      timestamp: new Date().toISOString(),
    }
    setMessages((current) => [...current, message].slice(-MAX_MESSAGES))
    return message
  }, [])

  const appendAssistantMessage = useCallback(
    (content: string): ChatMessage => appendMessage('assistant', content),
    [appendMessage]
  )

  const appendUserMessage = useCallback(
    (content: string): ChatMessage => appendMessage('user', content),
    [appendMessage]
  )

  const appendSystemMessage = useCallback(
    (content: string): ChatMessage => appendMessage('system', content),
    [appendMessage]
  )

  return {
    messages,
    appendAssistantMessage,
    appendUserMessage,
    appendSystemMessage,
  }
}
